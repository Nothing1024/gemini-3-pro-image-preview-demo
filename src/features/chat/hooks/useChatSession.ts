import { useCallback, useReducer } from 'react';
import { geminiClient } from '../services/geminiClient';
import { openaiClient } from '../services/openaiClient';
import { apiConfig } from '../utils/apiConfig';
import { createSessionId } from '../utils/session';
import { limitUploads, toUploadItems } from '../utils/files';
import type { UploadItem, ChatMessage, ChatMode, AspectRatio, ImageSize } from '../types';
import type { GeminiInlineDataInput, GeminiMessage, GeminiResult } from '@/types/gemini';

const messageId = (): string =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

const now = (): string => new Date().toISOString();

enum ChatRequestKind {
  Edit = 'EDIT',
  Composite = 'COMPOSITE',
  Search = 'SEARCH',
  Generate = 'GENERATE',
}

const INCLUDE_THINKING_STORAGE_KEY = 'gemini_include_thinking';

const readIncludeThinking = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const stored = window.localStorage?.getItem(INCLUDE_THINKING_STORAGE_KEY);
    return stored === 'true';
  } catch (error) {
    console.warn('无法从 localStorage 读取 includeThinking 状态：', error);
    return false;
  }
};

const writeIncludeThinking = (value: boolean): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage?.setItem(INCLUDE_THINKING_STORAGE_KEY, String(value));
  } catch (error) {
    console.warn('无法写入 includeThinking 状态到 localStorage：', error);
  }
};

export type ChatState = {
  sessionId: string;
  messages: ChatMessage[];
  history: GeminiMessage[];
  prompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  includeThinking: boolean;
  uploadedImages: UploadItem[];
  lastImageData: string | null;
  loading: boolean;
};

type ChatAction =
  | { type: 'setPrompt'; payload: string }
  | { type: 'setAspectRatio'; payload: AspectRatio }
  | { type: 'setImageSize'; payload: ImageSize }
  | { type: 'setIncludeThinking'; payload: boolean }
  | { type: 'addUploads'; payload: UploadItem[] }
  | { type: 'removeUpload'; payload: string }
  | { type: 'clearUploads' }
  | { type: 'appendMessage'; payload: ChatMessage }
  | { type: 'setHistory'; payload: GeminiMessage[] }
  | { type: 'setLastImage'; payload: string | null }
  | { type: 'setLoading'; payload: boolean }
  | { type: 'reset' };

const createInitialState = (): ChatState => ({
  sessionId: createSessionId(),
  messages: [],
  history: [],
  prompt: '',
  aspectRatio: '1:1',
  imageSize: '2K',
  includeThinking: readIncludeThinking(),
  uploadedImages: [],
  lastImageData: null,
  loading: false,
});

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'setPrompt':
      return { ...state, prompt: action.payload };
    case 'setAspectRatio':
      return { ...state, aspectRatio: action.payload };
    case 'setImageSize':
      return { ...state, imageSize: action.payload };
    case 'setIncludeThinking':
      return { ...state, includeThinking: action.payload };
    case 'addUploads':
      return { ...state, uploadedImages: [...state.uploadedImages, ...action.payload] };
    case 'removeUpload':
      return { ...state, uploadedImages: state.uploadedImages.filter((img) => img.id !== action.payload) };
    case 'clearUploads':
      return { ...state, uploadedImages: [] };
    case 'appendMessage':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'setHistory':
      return { ...state, history: action.payload };
    case 'setLastImage':
      return { ...state, lastImageData: action.payload };
    case 'setLoading':
      return { ...state, loading: action.payload };
    case 'reset':
      return createInitialState();
    default:
      return state;
  }
}

const buildUserLabel = (mode: ChatMode, text: string): string => {
  if (mode === 'edit') return `✏️ ${text}`;
  if (mode === 'search') return `🔍 ${text}`;
  return text;
};

const toSystemMessage = (text: string, isError = false): ChatMessage => ({
  id: messageId(),
  role: 'system',
  text,
  isError,
  timestamp: now(),
});

const toUserMessage = (text: string, images: string[]): ChatMessage => ({
  id: messageId(),
  role: 'user',
  text,
  images: images.length > 0 ? images : undefined,
  timestamp: now(),
});

const toAssistantMessage = (response: GeminiResult): ChatMessage => ({
  id: messageId(),
  role: 'assistant',
  text: response.text,
  parts: response.parts?.length ? response.parts : undefined,
  imageData: response.imageData ?? undefined,
  thinkingImages: response.thinkingImages.length ? response.thinkingImages : undefined,
  timestamp: now(),
});

type RequestContext = {
  promptText: string;
  labelledPrompt: string;
  imageDataList: GeminiInlineDataInput[];
  history: GeminiMessage[];
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  includeThinking: boolean;
  lastImageData: string | null;
};

const getClient = () => {
  const apiType = apiConfig.getType();
  return apiType === 'openai' ? openaiClient : geminiClient;
};

const requestHandlers: Record<ChatRequestKind, (ctx: RequestContext) => Promise<GeminiResult>> = {
  [ChatRequestKind.Edit]: ({ lastImageData, promptText, aspectRatio, imageSize, includeThinking, history }) => {
    if (!lastImageData) {
      return Promise.reject(new Error('没有可编辑的图片'));
    }
    const client = getClient();
    return client.editImage({
      imageData: lastImageData,
      editPrompt: promptText,
      aspectRatio,
      imageSize,
      includeThinking,
      history,
    });
  },
  [ChatRequestKind.Composite]: ({ labelledPrompt, imageDataList, aspectRatio, imageSize, includeThinking, history }) => {
    const client = getClient();
    return client.compositeImages({
      prompt: labelledPrompt,
      imageDataList,
      aspectRatio,
      imageSize,
      includeThinking,
      history,
    });
  },
  [ChatRequestKind.Search]: ({ promptText, aspectRatio, imageSize, includeThinking, history }) => {
    const client = getClient();
    return client.generateWithSearch({
      prompt: promptText,
      aspectRatio,
      imageSize,
      includeThinking,
      history,
    });
  },
  [ChatRequestKind.Generate]: ({ labelledPrompt, aspectRatio, imageSize, includeThinking, history }) => {
    const client = getClient();
    return client.generateImage({
      prompt: labelledPrompt,
      aspectRatio,
      imageSize,
      includeThinking,
      history,
    });
  },
};

const resolveRequestKind = (mode: ChatMode, hasUploads: boolean): ChatRequestKind => {
  if (mode === 'edit') return ChatRequestKind.Edit;
  if (hasUploads) return ChatRequestKind.Composite;
  if (mode === 'search') return ChatRequestKind.Search;
  return ChatRequestKind.Generate;
};

const normalizeFiles = (files?: FileList | File[] | null): File[] => {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return Array.from(files);
};

export type ChatActions = {
  setPrompt: (value: string) => void;
  setAspectRatio: (value: AspectRatio) => void;
  setImageSize: (value: ImageSize) => void;
  setIncludeThinking: (value: boolean) => void;
  addUploads: (files?: FileList | File[] | null) => Promise<void>;
  removeUpload: (id: string) => void;
  sendPrompt: (mode?: ChatMode) => Promise<void>;
  reset: () => Promise<void>;
  downloadImage: (base64: string) => void;
};

export type UseChatSessionResult = {
  state: ChatState;
  actions: ChatActions;
};

export function useChatSession(): UseChatSessionResult {
  const [state, dispatch] = useReducer(chatReducer, undefined, createInitialState);

  const addUploads = useCallback(
    async (files?: FileList | File[] | null) => {
      const incoming = normalizeFiles(files);
      if (incoming.length === 0) return;

      const usableFiles = limitUploads(state.uploadedImages.length, incoming);
      const items = await toUploadItems(usableFiles);

      if (incoming.length > usableFiles.length) {
        dispatch({ type: 'appendMessage', payload: toSystemMessage('最多只能上传 14 张图片', true) });
      }

      dispatch({ type: 'addUploads', payload: items });
    },
    [state.uploadedImages.length]
  );

  const removeUpload = useCallback((id: string) => dispatch({ type: 'removeUpload', payload: id }), []);

  const reset = useCallback(async () => {
    const confirmed = window.confirm('重置对话？这将清除历史记录。');
    if (!confirmed) return;
    dispatch({ type: 'reset' });
  }, []);

  const downloadImage = useCallback((base64: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `gemini-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const sendPrompt = useCallback(
    async (mode: ChatMode = 'generate') => {
      const apiType = apiConfig.getType();
      if (apiType === 'openai') {
        if (mode === 'edit' || mode === 'search') {
          dispatch({
            type: 'appendMessage',
            payload: toSystemMessage('OpenAI 兼容模式不支持此功能', true),
          });
          return;
        }
      }

      const trimmedPrompt = state.prompt.trim();

      if (!trimmedPrompt && mode !== 'edit') return;
      if (mode === 'edit' && !state.lastImageData) {
        dispatch({ type: 'appendMessage', payload: toSystemMessage('没有可编辑的图片', true) });
        return;
      }

      const userText = buildUserLabel(mode, trimmedPrompt);
      const imageDataList: GeminiInlineDataInput[] = state.uploadedImages.map(({ base64, mimeType }) => ({
        data: base64,
        mimeType,
      }));

      const userMessage = toUserMessage(userText, state.uploadedImages.map((img) => img.dataUrl));

      dispatch({ type: 'appendMessage', payload: userMessage });
      dispatch({ type: 'clearUploads' });
      dispatch({ type: 'setPrompt', payload: '' });
      dispatch({ type: 'setLoading', payload: true });

      // OpenAI 兼容模式下使用安全的默认值，避免不支持的参数影响请求
      const aspectRatio = apiType === 'openai' ? ('1:1' as AspectRatio) : state.aspectRatio;
      const imageSize = apiType === 'openai' ? ('1K' as ImageSize) : state.imageSize;

      const requestKind = resolveRequestKind(mode, imageDataList.length > 0);
      const requestContext: RequestContext = {
        promptText: trimmedPrompt,
        labelledPrompt: userText,
        imageDataList,
        history: state.history,
        aspectRatio,
        imageSize,
        includeThinking: state.includeThinking,
        lastImageData: state.lastImageData,
      };

      try {
        const response = await requestHandlers[requestKind](requestContext);
        const assistantMessage = toAssistantMessage(response);

        dispatch({ type: 'appendMessage', payload: assistantMessage });
        dispatch({ type: 'setHistory', payload: response.history });
        if (response.imageData) {
          dispatch({ type: 'setLastImage', payload: response.imageData });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知错误';
        dispatch({ type: 'appendMessage', payload: toSystemMessage(`错误：${message}`, true) });
      } finally {
        dispatch({ type: 'setLoading', payload: false });
      }
    },
    [
      state.prompt,
      state.uploadedImages,
      state.history,
      state.aspectRatio,
      state.imageSize,
      state.includeThinking,
      state.lastImageData,
    ]
  );

  return {
    state,
    actions: {
      setPrompt: (value: string) => dispatch({ type: 'setPrompt', payload: value }),
      setAspectRatio: (value: AspectRatio) => dispatch({ type: 'setAspectRatio', payload: value }),
      setImageSize: (value: ImageSize) => dispatch({ type: 'setImageSize', payload: value }),
      setIncludeThinking: (value: boolean) => {
        writeIncludeThinking(value);
        dispatch({ type: 'setIncludeThinking', payload: value });
      },
      addUploads,
      removeUpload,
      sendPrompt,
      reset,
      downloadImage,
    },
  };
}
