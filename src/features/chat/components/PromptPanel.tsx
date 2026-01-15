import { useEffect, useRef, useState } from 'react'
import { Search, Send, Plus, Settings2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UploadStrip } from './UploadStrip'
import { ControlBar } from './ControlBar'
import type { UploadItem, ChatMode, AspectRatio, ImageSize } from '@/features/chat/types'
import { extractFilesFromDataTransfer } from '../utils/files'
import { cn } from '@/lib/utils'
import { apiConfig, type ModelName } from '@/features/chat/utils/apiConfig'

type PromptPanelProps = {
  prompt: string
  onPromptChange: (value: string) => void
  onSend: (mode?: ChatMode) => void
  loading: boolean
  uploads: UploadItem[]
  onAddFiles: (files?: FileList | File[] | null) => Promise<void>
  onRemoveUpload: (id: string) => void
  aspectRatio: AspectRatio
  imageSize: ImageSize
  model: ModelName
  forceImageGuidance: boolean
  onAspectChange: (value: AspectRatio) => void
  onSizeChange: (value: ImageSize) => void
  onModelChange: (model: ModelName) => void
  onToggleForceImageGuidance: (value: boolean) => void
  canEditLast: boolean
  onEditLast: () => void
}

export function PromptPanel({
  prompt,
  onPromptChange,
  onSend,
  loading,
  uploads,
  onAddFiles,
  onRemoveUpload,
  aspectRatio,
  imageSize,
  model,
  forceImageGuidance,
  onAspectChange,
  onSizeChange,
  onModelChange,
  onToggleForceImageGuidance,
  canEditLast,
  onEditLast,
}: PromptPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const apiType = apiConfig.getType()

  const handleIncomingFiles = async (files?: FileList | File[]) => {
    if (files && files.length > 0) {
      await onAddFiles(files)
    }
  }

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    await handleIncomingFiles(files || undefined)
    if (event.target) event.target.value = ""
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend("generate")
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = extractFilesFromDataTransfer(e.clipboardData)
    if (files.length > 0) {
      e.preventDefault()
      await handleIncomingFiles(files)
    }
  }

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    if (typeof window === 'undefined') return

    const update = () => {
      const height = Math.ceil(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--prompt-panel-height', `${height}px`)
    }

    update()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }

    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    // 提交后 prompt 可能被清空，此时需要把高度还原
    if (!textareaRef.current) return
    textareaRef.current.style.height = "auto"
    if (prompt) adjustHeight()
  }, [prompt])

  return (
    <div ref={panelRef} className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-2 pb-2 md:pb-6">
      <div
        className="pointer-events-auto w-full max-w-3xl mx-auto flex flex-col gap-3"
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragging(false)
        }}
        onDrop={async (e) => {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer?.files?.length) {
            await handleIncomingFiles(e.dataTransfer.files)
          }
        }}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFiles}
        />

        {/* Upload Strip - Floating above */}
        {uploads.length > 0 && (
           <div className="px-1">
              <UploadStrip uploads={uploads} onRemove={onRemoveUpload} aspectRatio={aspectRatio} />
           </div>
        )}

        {/* Main Input Area */}
        <div
          className={cn(
            "relative flex flex-col bg-background/80 backdrop-blur-2xl shadow-2xl border border-border/60 rounded-[24px] transition-all duration-200 overflow-hidden ring-1 ring-black/5 dark:ring-white/5",
            isDragging && "ring-2 ring-primary/60 bg-primary/5",
            "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50"
          )}
        >
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              onPromptChange(e.target.value)
              adjustHeight()
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="描述您想生成的图像..."
            className="min-h-[48px] max-h-[200px] w-full resize-none border-0 bg-transparent py-3.5 pl-4 pr-4 focus-visible:ring-0 focus-visible:ring-offset-0 text-base shadow-none placeholder:text-muted-foreground/50"
          />

           {/* Collapsible Controls inside the input box */}
          <div className={cn(
             "overflow-hidden transition-all duration-300 ease-in-out px-2",
              showControls ? "max-h-40 opacity-100 mb-2" : "max-h-0 opacity-0"
           )}>
              <div className="bg-muted/40 rounded-xl p-1.5 mx-1 border border-border/20">
                 <ControlBar
                 aspectRatio={aspectRatio}
                 imageSize={imageSize}
                 model={model}
                  forceImageGuidance={forceImageGuidance}
                  onAspectChange={onAspectChange}
                  onSizeChange={onSizeChange}
                  onModelChange={onModelChange}
                  onToggleForceImageGuidance={onToggleForceImageGuidance}
                  onEdit={onEditLast}
                  canEdit={canEditLast}
                  loading={loading}
                />
              </div>
          </div>

          {/* Bottom Toolbar - Flexbox layout */}
          <div className="flex items-center justify-between p-1.5 pl-3 bg-muted/10 border-t border-border/40">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200",
                  uploads.length > 0 && "text-primary bg-primary/10 hover:bg-primary/20"
                )}
                onClick={() => fileInputRef.current?.click()}
                title="上传参考图"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
               <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200",
                  showControls && "text-primary bg-primary/10 hover:bg-primary/20"
                )}
                onClick={() => setShowControls(!showControls)}
                title={showControls ? "收起设置" : "展开设置"}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              {apiType === "gemini" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                  onClick={() => onEditLast()}
                  disabled={loading || !canEditLast}
                  title="编辑上一张"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {apiType === "gemini" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                  onClick={() => onSend("search")}
                  disabled={loading}
                  title="联网生成"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={() => onSend("generate")}
                disabled={loading || (!prompt && uploads.length === 0)}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full shadow-sm transition-all duration-200 shrink-0 flex items-center justify-center",
                  loading ? "bg-muted text-muted-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {loading ? (
                  <span className="animate-spin text-xs">⏳</span>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
