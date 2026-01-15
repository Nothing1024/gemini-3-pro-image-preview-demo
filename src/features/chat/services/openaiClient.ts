import { apiConfig } from '../utils/apiConfig';
import { DEFAULT_REQUEST_TIMEOUT_MS, requestWithMode } from './request';
import type {
  GeminiInlineDataInput,
  GeminiMessage,
  GeminiResult,
} from '@/types/gemini';

const MODEL_PATH = '/v1/chat/completions';

export class OpenAIClientError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, options: { status?: number; code?: string; details?: unknown } = {}) {
    super(message);
    this.name = 'OpenAIClientError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

type OpenAICallParams = {
  prompt: string;
  history?: GeminiMessage[];
  images?: GeminiInlineDataInput[];
  aspectRatio?: string;
  imageSize?: string;
  includeThinking?: boolean;
  useSearch?: boolean;
};

type OpenAIMessageContent =
  | string
  | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;

type OpenAIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: OpenAIMessageContent;
};

type OpenAIRequestPayload = {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  stream?: boolean;
};

type OpenAIChoice = {
  index: number;
  message: {
    role: 'assistant';
    content: string | null;
    reasoning_content?: string;
  };
  finish_reason: string;
};

type OpenAIResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type: string;
    code: string;
  };
};

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, '');

const geminiRoleToOpenAI = (role: 'user' | 'model'): 'user' | 'assistant' => {
  return role === 'model' ? 'assistant' : 'user';
};

const convertHistoryToOpenAI = (history: GeminiMessage[] = []): OpenAIMessage[] => {
  return history.map((msg) => {
    const textParts = msg.parts
      .filter((p) => p.text && !p.thought)
      .map((p) => p.text as string);

    const imageParts = msg.parts
      .filter((p) => !p.thought && (p.inline_data || p.inlineData))
      .map((p) => {
        const inlineData = p.inline_data || p.inlineData;
        return inlineData ? `data:${inlineData.mime_type};base64,${inlineData.data}` : '';
      })
      .filter(Boolean);

    if (imageParts.length > 0 && msg.role === 'user') {
      const content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];

      if (textParts.length > 0) {
        content.push({ type: 'text', text: textParts.join('\n') });
      }

      imageParts.forEach((url) => {
        content.push({ type: 'image_url', image_url: { url } });
      });

      return {
        role: geminiRoleToOpenAI(msg.role),
        content,
      };
    }

    return {
      role: geminiRoleToOpenAI(msg.role),
      content: textParts.join('\n'),
    };
  });
};

const buildUserMessage = (prompt: string, images: GeminiInlineDataInput[] = []): OpenAIMessage => {
  if (images.length === 0) {
    return { role: 'user', content: prompt };
  }

  const content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
    { type: 'text', text: prompt },
  ];

  images.forEach(({ data, mimeType }) => {
    if (!data) return;
    const url = `data:${mimeType || 'image/png'};base64,${data}`;
    content.push({ type: 'image_url', image_url: { url } });
  });

  return { role: 'user', content };
};

const extractImageFromMarkdown = (text: string): { cleanText: string; imageData: string | null } => {
  const imagePattern = /!\[.*?\]\(data:image\/[^;]+;base64,([^)]+)\)/g;
  const matches = [...text.matchAll(imagePattern)];

  let imageData: string | null = null;
  if (matches.length > 0) {
    imageData = matches[matches.length - 1][1];
  }

  const cleanText = text.replace(imagePattern, '').trim();

  return { cleanText, imageData };
};

const toOpenAIError = (status: number, body: unknown): OpenAIClientError => {
  if (body && typeof body === 'object') {
    const errorBody = body as { error?: { message?: string; type?: string; code?: string } };
    if (errorBody.error) {
      return new OpenAIClientError(errorBody.error.message || '请求失败', {
        status,
        code: errorBody.error.code || errorBody.error.type,
        details: body,
      });
    }
  }

  if (typeof body === 'string' && body.trim().length > 0) {
    return new OpenAIClientError(body, { status, details: body });
  }

  return new OpenAIClientError('请求失败', { status, details: body });
};

const parseResponse = async (response: Response): Promise<OpenAIResponse> => {
  const text = await response.text();

  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    throw toOpenAIError(response.status, parsed);
  }

  return (parsed || {}) as OpenAIResponse;
};

const requestOpenAI = async (payload: OpenAIRequestPayload, apiKey: string, baseUrl: string): Promise<OpenAIResponse> => {
  try {
    const response = await requestWithMode({
      url: `${normalizeBaseUrl(baseUrl)}${MODEL_PATH}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: payload,
      timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    });

    return parseResponse(response);
  } catch (error) {
    if (error instanceof OpenAIClientError) {
      throw error;
    }
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
      throw new OpenAIClientError('请求超时（已等待 20 分钟）', { details: error });
    }
    throw new OpenAIClientError('网络请求失败', { details: error });
  }
};

const convertOpenAIResponseToGeminiResult = (
  response: OpenAIResponse,
  previousHistory: GeminiMessage[],
  userMessage: GeminiMessage
): GeminiResult => {
  const choice = response.choices?.[0];
  if (!choice) {
    return {
      text: '',
      parts: [],
      imageData: null,
      thinkingImages: [],
      groundingMetadata: undefined,
      history: [...previousHistory, userMessage],
    };
  }

  const content = choice.message?.content || '';
  const reasoningContent = choice.message?.reasoning_content || '';

  const { cleanText, imageData } = extractImageFromMarkdown(content);

  const thinkingImages: string[] = [];
  const parts: Array<{ text: string; thought?: boolean }> = [];

  if (reasoningContent) {
    parts.push({ text: reasoningContent, thought: true });
  }

  if (cleanText) {
    parts.push({ text: cleanText });
  }

  const assistantParts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];
  if (cleanText) {
    assistantParts.push({ text: cleanText });
  }
  if (imageData) {
    assistantParts.push({ inline_data: { mime_type: 'image/png', data: imageData } });
  }

  // 如果没有任何内容，添加一个空文本避免空消息
  if (assistantParts.length === 0) {
    assistantParts.push({ text: '' });
  }

  const updatedHistory: GeminiMessage[] = [
    ...previousHistory,
    userMessage,
    { role: 'model', parts: assistantParts },
  ];

  return {
    text: cleanText,
    parts,
    imageData,
    thinkingImages,
    groundingMetadata: undefined,
    history: updatedHistory,
  };
};

const callOpenAIApi = async ({
  prompt,
  images = [],
  history = [],
}: OpenAICallParams): Promise<GeminiResult> => {
  const baseUrl = apiConfig.getUrl();
  const apiKey = apiConfig.getKey();

  if (!baseUrl || !apiKey) {
    throw new OpenAIClientError('请先配置 API URL 和 Key');
  }

  const openaiHistory = convertHistoryToOpenAI(history);
  const userMessage = buildUserMessage(prompt, images);
  const messages = [...openaiHistory, userMessage];

  const payload: OpenAIRequestPayload = {
    model: apiConfig.getModel(),
    messages,
    max_tokens: 4096,
    stream: false,
  };

  const response = await requestOpenAI(payload, apiKey, baseUrl);

  const geminiUserMessage: GeminiMessage = {
    role: 'user',
    parts: [
      { text: prompt },
      ...images.map(({ data, mimeType }) => ({
        inline_data: { mime_type: mimeType || 'image/png', data },
      })),
    ],
  };

  return convertOpenAIResponseToGeminiResult(response, history, geminiUserMessage);
};

export const openaiClient = {
  generateImage: ({
    prompt,
    history,
  }: Omit<OpenAICallParams, 'images' | 'useSearch'>) =>
    callOpenAIApi({ prompt, history }),

  editImage: ({
    imageData,
    editPrompt,
    history,
  }: {
    imageData: string;
    editPrompt: string;
  } & Omit<OpenAICallParams, 'prompt' | 'images' | 'useSearch'>) =>
    callOpenAIApi({
      prompt: editPrompt,
      images: [{ data: imageData, mimeType: 'image/png' }],
      history,
    }),

  compositeImages: ({
    prompt,
    imageDataList,
    history,
  }: {
    prompt: string;
    imageDataList: GeminiInlineDataInput[];
  } & Omit<OpenAICallParams, 'images' | 'useSearch'>) =>
    callOpenAIApi({
      prompt,
      images: imageDataList,
      history,
    }),

  generateWithSearch: ({
    prompt,
    history,
  }: Omit<OpenAICallParams, 'images' | 'useSearch'>) =>
    callOpenAIApi({
      prompt,
      history,
    }),
};
