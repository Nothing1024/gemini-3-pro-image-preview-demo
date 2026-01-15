import { useState, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, Copy, Check, Trash2 } from 'lucide-react'
import { ImageLightbox } from '@/components/ImageLightbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/features/chat/types'
import { getThumbSize } from '../utils/thumb'

const USER_IMAGE_MAX_EDGE = 80

const markdownComponents: Components = {
  a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
  code(
    { inline, className, children, ...props }: { inline?: boolean; className?: string; children?: ReactNode } & HTMLAttributes<HTMLElement>,
  ) {
    if (inline) {
      return (
        <code className={cn("rounded bg-muted px-1 py-0.5 text-xs font-medium", className)} {...props}>
          {children}
        </code>
      )
    }

    return (
      <pre className="overflow-x-auto rounded-lg bg-muted px-3 py-2 text-sm">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    )
  },
}

function getDisplayParts(message: ChatMessage) {
  if (message.parts && message.parts.length > 0) {
    return message.parts
  }
  if (message.text) return [{ text: message.text }]
  return []
}

function buildUserMarkdown(message: ChatMessage): string {
  const text = message.text?.trimEnd() || ''
  const images = (message.images || [])
    .filter(Boolean)
    .map((src, idx) => `![参考图 ${idx + 1}](${src})`)
    .join('\n')

  if (text && images) return `${text}\n\n${images}`
  return text || images
}

function UploadedThumb({ src, alt }: { src: string; alt: string }) {
  const [ratio, setRatio] = useState(1)
  const size = getThumbSize(ratio, USER_IMAGE_MAX_EDGE)

  return (
    <div
      className="relative shrink-0 rounded-md border bg-background overflow-hidden flex items-center justify-center"
      style={size}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        onLoad={(e) => {
          const { naturalWidth, naturalHeight } = e.currentTarget
          if (naturalWidth && naturalHeight) {
            const nextRatio = naturalWidth / naturalHeight
            if (nextRatio !== ratio) setRatio(nextRatio)
          }
        }}
      />
    </div>
  )
}

type MessageItemProps = {
  message: ChatMessage
  onDownload: (base64: string) => void
  onDelete: (id: string) => void
}

export function MessageItem({ message, onDownload, onDelete }: MessageItemProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const canCopy = message.role !== 'system'

  const handleCopy = () => {
    const copyText = isUser
      ? buildUserMarkdown(message)
      : (() => {
          const displayParts = getDisplayParts(message)
          const hasStructured = Boolean(message.parts?.length)
          return hasStructured
            ? displayParts.map((p) => p.text).filter(Boolean).join('\n\n')
            : message.text
        })()
    if (!copyText) return

    navigator.clipboard.writeText(copyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => onDelete(message.id)

  const displayParts = getDisplayParts(message)

  return (
    <div className={cn("flex flex-col gap-1 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300", isUser ? "items-end" : "items-start")}>
      {/* 用户名和时间戳 */}
      <div className={cn("flex items-center gap-2 px-1", isUser ? "flex-row-reverse" : "")}>
        <span className="text-xs text-muted-foreground font-medium">{isUser ? "你" : "Gemini"}</span>
        <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">{new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>

      {/* 消息气泡 */}
      <div
        className={cn(
          "relative group/bubble rounded-2xl p-4 shadow-sm max-w-[90%] sm:max-w-[85%]",
          isUser
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-card border rounded-tl-sm",
          message.isError ? "bg-destructive/10 border-destructive text-destructive" : "",
        )}
      >
        {/* 气泡操作：复制 / 删除 */}
        <div
          className={cn(
            "absolute -right-2 -top-2 flex items-center gap-1 rounded-full border px-1 py-1 shadow-sm backdrop-blur",
            "bg-background/90 ring-1 ring-black/5 dark:ring-white/5",
            "opacity-0 translate-y-0.5 group-hover/bubble:opacity-100 group-hover/bubble:translate-y-0 transition-all",
          )}
        >
          {canCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "h-7 w-7 inline-flex items-center justify-center rounded-full transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
              aria-label={isUser ? "复制 Markdown" : "复制文本"}
              title={isUser ? "复制 Markdown" : "复制文本"}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className={cn(
              "h-7 w-7 inline-flex items-center justify-center rounded-full transition-colors",
              message.isError
                ? "text-destructive hover:bg-destructive/10"
                : "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            )}
            aria-label="删除消息"
            title="删除消息"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 文本内容 + 复制按钮 */}
        {displayParts.length > 0 && (
          <div className="relative group/text">
            <div className="space-y-3">
              {displayParts.map((part, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "prose prose-sm prose-neutral dark:prose-invert max-w-none",
                    isUser && "prose-invert"
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 用户上传的参考图 */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.images.map((img, i) => (
              <UploadedThumb key={i} src={img} alt="uploaded" />
            ))}
          </div>
        )}

        {/* AI生成的图片 */}
        {message.imageData && (
          <>
            <div className="mt-3 relative group" onClick={() => setLightboxOpen(true)}>
              <img
                src={`data:image/png;base64,${message.imageData}`}
                alt="generated"
                className="w-full h-auto max-w-md rounded-xl border shadow-sm bg-muted/10 min-h-[100px] cursor-pointer hover:brightness-95"
              />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9 shadow-lg backdrop-blur-sm bg-background/80 hover:bg-background"
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    onDownload(message.imageData!)
                  }}
                  title="下载图片"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ImageLightbox
              src={`data:image/png;base64,${message.imageData}`}
              open={lightboxOpen}
              onOpenChange={setLightboxOpen}
            />
          </>
        )}
      </div>
    </div>
  )
}
