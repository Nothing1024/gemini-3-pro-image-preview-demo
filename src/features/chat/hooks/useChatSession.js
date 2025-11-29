import { useState } from 'react';
import { chatApi } from '../api/chatApi';
import { createSessionId } from '../utils/session';
import { limitUploads, toUploadItems } from '../utils/files';

const messageId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

const now = () => new Date().toISOString();

function buildUserLabel(mode, text) {
  if (mode === 'edit') return `✏️ ${text}`;
  if (mode === 'search') return `🔍 ${text}`;
  return text;
}

export function useChatSession() {
  const [sessionId, setSessionId] = useState(createSessionId);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('2K');
  const [includeThinking, setIncludeThinking] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [lastImageData, setLastImageData] = useState(null);
  const [loading, setLoading] = useState(false);

  const addUploads = async (files) => {
    const incoming = Array.isArray(files) ? files : Array.from(files || []);
    const usableFiles = limitUploads(uploadedImages.length, incoming);
    const items = await toUploadItems(usableFiles);
    if (incoming.length > usableFiles.length) {
      const msg = { role: 'system', text: '最多只能上传 14 张图片', isError: true, id: messageId(), timestamp: now() };
      setMessages((prev) => [...prev, msg]);
    }
    setUploadedImages((prev) => [...prev, ...items]);
  };

  const removeUpload = (id) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const reset = async () => {
    const confirmed = window.confirm('重置对话？这将清除历史记录。');
    if (!confirmed) return;

    await chatApi.resetChat({ sessionId });
    setMessages([]);
    setUploadedImages([]);
    setLastImageData(null);
    setPrompt('');
    setSessionId(createSessionId());
  };

  const downloadImage = (base64) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `gemini-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendPrompt = async (mode = 'generate') => {
    if (!prompt.trim() && mode !== 'edit') return;
    if (mode === 'edit' && !lastImageData) {
      const msg = { role: 'system', text: '没有可编辑的图片', isError: true, id: messageId(), timestamp: now() };
      setMessages((prev) => [...prev, msg]);
      return;
    }

    const userText = buildUserLabel(mode, prompt.trim());
    const imageDataList = uploadedImages.map(({ base64, mimeType }) => ({ data: base64, mimeType }));

    const userMessage = {
      id: messageId(),
      role: 'user',
      text: userText,
      images: uploadedImages.map((img) => img.dataUrl),
      timestamp: now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      let response;

      if (mode === 'edit') {
        response = await chatApi.editImage({
          imageData: lastImageData,
          editPrompt: prompt.trim(),
          aspectRatio,
          imageSize,
          includeThinking,
          sessionId,
        });
      } else if (imageDataList.length > 0) {
        response = await chatApi.compositeImages({
          prompt: userText,
          imageDataList,
          aspectRatio,
          imageSize,
          includeThinking,
          sessionId,
        });
      } else if (mode === 'search') {
        response = await chatApi.generateWithSearch({
          prompt: prompt.trim(),
          aspectRatio,
          imageSize,
          sessionId,
        });
      } else {
        response = await chatApi.generateImage({
          prompt: userText,
          aspectRatio,
          imageSize,
          includeThinking,
          sessionId,
        });
      }

      const assistantMessage = {
        id: messageId(),
        role: 'assistant',
        text: response.text,
        imageData: response.imageData,
        thinkingImages: response.thinkingImages,
        timestamp: now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (response.imageData) setLastImageData(response.imageData);
    } catch (error) {
      const errorMessage = {
        id: messageId(),
        role: 'system',
        text: `错误：${error.message}`,
        isError: true,
        timestamp: now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return {
    state: {
      sessionId,
      messages,
      prompt,
      aspectRatio,
      imageSize,
      includeThinking,
      uploadedImages,
      lastImageData,
      loading,
    },
    actions: {
      setPrompt,
      setAspectRatio,
      setImageSize,
      setIncludeThinking,
      addUploads,
      removeUpload,
      sendPrompt,
      reset,
      downloadImage,
    },
  };
}
