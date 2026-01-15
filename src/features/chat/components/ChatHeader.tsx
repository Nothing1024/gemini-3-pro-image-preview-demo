import { RotateCcw, Settings, Loader2, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type ChatHeaderProps = {
  loading: boolean
  onReset: () => void
  onOpenSettings?: () => void
}

export function ChatHeader({ loading, onReset, onOpenSettings }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b bg-background/95 backdrop-blur px-3 py-2 md:px-4 md:py-3">
      <div className="flex items-center gap-3">
        <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
          <span className="md:hidden">✨ Banana Pro</span>
          <span className="hidden md:inline">✨ Banana Pro 图像创作</span>
        </h1>
        {loading && (
          <Badge variant="secondary" className="gap-1 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">生成中…</span>
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1 md:gap-2 text-sm text-muted-foreground">
        <a
          href="https://github.com/Nothing1024/gemini-3-pro-image-preview-demo"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
        >
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9" asChild>
            <span><Github className="h-4 w-4" /></span>
          </Button>
        </a>
        {onOpenSettings && (
          <Button variant="ghost" size="icon" onClick={onOpenSettings} title="设置" className="h-8 w-8 md:h-9 md:w-9">
            <Settings className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onReset} title="重置对话" disabled={loading} className="h-8 w-8 md:h-9 md:w-9">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
