import { apiConfig } from '../utils/apiConfig';

// 会话历史存储
const sessionHistories = new Map();

function getHistory(sessionId) {
  if (!sessionHistories.has(sessionId)) {
    sessionHistories.set(sessionId, []);
  }
  return sessionHistories.get(sessionId);
}

function buildUserMessage(prompt, images = []) {
  const parts = [{ text: prompt }];
  images.forEach(({ data, mimeType }) => {
    if (!data) return;
    parts.push({
      inline_data: {
        mime_type: mimeType || 'image/png',
        data,
      },
    });
  });
  return { role: 'user', parts };
}

function extractImageData(response) {
  const candidate = response.candidates?.[0];
  if (!candidate) return null;

  const parts = candidate.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  return null;
}

function extractThinkingImages(response) {
  const thinkingImages = [];
  const candidate = response.candidates?.[0];
  if (!candidate) return thinkingImages;

  const parts = candidate.content?.parts || [];
  for (const part of parts) {
    if (part.thought && part.inlineData) {
      thinkingImages.push(part.inlineData.data);
    }
  }
  return thinkingImages;
}

function extractText(response) {
  return response.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text || '';
}

function buildAssistantMessageParts(response, includeThinking) {
  const parts = [];

  const thinkingImages = includeThinking ? extractThinkingImages(response) : [];
  if (thinkingImages.length > 0) {
    thinkingImages.forEach((img) => {
      parts.push({
        inlineData: { mime_type: 'image/png', data: img },
        thought: true,
      });
    });
  }

  const candidateParts = response.candidates?.[0]?.content?.parts || [];
  candidateParts.forEach((part) => {
    if (part.text) {
      parts.push({ text: part.text });
    } else if (part.inlineData) {
      parts.push({ inlineData: part.inlineData, thought: false });
    }
  });

  return { parts, thinkingImages };
}

async function callGeminiApi({
  sessionId,
  prompt,
  images = [],
  aspectRatio = '1:1',
  imageSize = '2K',
  includeThinking = false,
  useSearch = false,
}) {
  const baseUrl = apiConfig.getUrl();
  const apiKey = apiConfig.getKey();

  if (!baseUrl || !apiKey) {
    throw new Error('请先配置 API URL 和 Key');
  }

  const url = `${baseUrl}/v1beta/models/gemini-3-pro-image-preview:generateContent`;
  const history = getHistory(sessionId);

  const userMessage = buildUserMessage(prompt, images);
  const contents = [...history, userMessage];

  const payload = {
    contents,
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    },
  };

  if (useSearch) {
    payload.tools = [{ google_search: {} }];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = '请求失败';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorText;
    } catch {
      errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();

  // 更新会话历史
  history.push(userMessage);
  const { parts, thinkingImages } = buildAssistantMessageParts(result, includeThinking);
  if (parts.length) {
    history.push({
      role: 'model',
      parts,
    });
  }

  return {
    text: extractText(result),
    imageData: extractImageData(result),
    thinkingImages,
    groundingMetadata: result.groundingMetadata,
  };
}

export const chatApi = {
  generateImage: ({ prompt, aspectRatio, imageSize, includeThinking, sessionId }) =>
    callGeminiApi({ sessionId, prompt, aspectRatio, imageSize, includeThinking }),

  editImage: ({ imageData, editPrompt, aspectRatio, imageSize, includeThinking, sessionId }) =>
    callGeminiApi({
      sessionId,
      prompt: editPrompt,
      images: [{ data: imageData, mimeType: 'image/png' }],
      aspectRatio,
      imageSize,
      includeThinking,
    }),

  compositeImages: ({ prompt, imageDataList, aspectRatio, imageSize, includeThinking, sessionId }) =>
    callGeminiApi({
      sessionId,
      prompt,
      images: imageDataList,
      aspectRatio,
      imageSize,
      includeThinking,
    }),

  generateWithSearch: ({ prompt, aspectRatio, imageSize, sessionId }) =>
    callGeminiApi({
      sessionId,
      prompt,
      aspectRatio,
      imageSize,
      useSearch: true,
    }),

  resetChat: ({ sessionId }) => {
    sessionHistories.delete(sessionId);
    return Promise.resolve();
  },
};
