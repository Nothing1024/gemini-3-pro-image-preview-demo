export type UploadItem = {
  id: string
  name: string
  mimeType: string
  base64: string
  dataUrl: string
  width?: number
  height?: number
  aspectRatio?: number
}

export type ChatMode = "generate" | "edit" | "search"
export type AspectRatio = "1:1" | "16:9" | "4:3" | "3:4" | "9:16" | "5:4"
export type ImageSize = "1K" | "2K" | "4K"
export type ChatRole = "user" | "assistant" | "system"

export interface RetryContext {
  mode: ChatMode
  prompt: string
  uploadDataUrls: string[]
  uploadItems: Array<{ base64: string; mimeType: string }>
}

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  parts?: Array<{ text: string }>
  images?: string[]           // 用户上传的参考图
  imageData?: string          // AI生成的图片 (base64)
  isError?: boolean
  retryContext?: RetryContext // 错误消息的重试上下文
  timestamp: string
}

// API相关类型
export type GeminiInlineData = {
  mime_type: string
  data: string
}

export type GeminiContentPart = {
  text?: string
  inline_data?: GeminiInlineData
  inlineData?: GeminiInlineData
  thought?: boolean
}

export type GeminiContent = {
  role: "user" | "model"
  parts: GeminiContentPart[]
}
