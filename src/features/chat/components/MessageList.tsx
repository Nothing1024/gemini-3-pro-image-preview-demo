import { useEffect, useRef } from 'react'
import { Image as ImageIcon, Sparkles } from 'lucide-react'
import { MessageItem } from './MessageItem'
import { Button } from '@/components/ui/button'
import type { ChatMessage, RetryContext } from '@/features/chat/types'

type MessageListProps = {
  messages: ChatMessage[]
  onDownload: (base64: string) => void
  onDeleteMessage: (id: string) => void
  onRetry: (ctx: RetryContext, errorMessageId: string) => void
  hasSavedConversation: boolean
  savedConversationAt: string | null
  onRestoreSavedConversation: () => void
  onClearSavedConversation: () => void
}

export function MessageList({
  messages,
  onDownload,
  onDeleteMessage,
  onRetry,
  hasSavedConversation,
  savedConversationAt,
  onRestoreSavedConversation,
  onClearSavedConversation,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-8 scroll-smooth custom-scrollbar">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              {/* 装饰性渐变背景 */}
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-violet-500 opacity-20 blur-lg rounded-full" />
              <div className="relative border shadow-sm rounded-full p-6 bg-background">
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
                <Sparkles className="absolute top-2 right-2 h-5 w-5 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="font-semibold text-lg">开始您的创作之旅</h3>
              <p className="text-sm text-muted-foreground">描述您的想法，让 Gemini 为您生成精美图像</p>
            </div>

            {hasSavedConversation && (
              <div className="pt-2 space-y-3">
                <div className="rounded-xl border bg-muted/30 px-4 py-3 text-left">
                  <p className="text-sm font-medium">发现上次对话</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    保存时间：{savedConversationAt ? new Date(savedConversationAt).toLocaleString() : '未知'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" onClick={onRestoreSavedConversation}>
                    快速加载
                  </Button>
                  <Button size="sm" variant="outline" onClick={onClearSavedConversation}>
                    删除记录
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onDownload={onDownload}
              onDelete={onDeleteMessage}
              onRetry={onRetry}
            />
          ))}
          <div ref={endRef} />
        </>
      )}
    </div>
  )
}
