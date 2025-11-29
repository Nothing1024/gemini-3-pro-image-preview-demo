import { RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChatHeader({ sessionId, onReset, onOpenSettings, disabled }) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h1 className="text-xl font-bold flex items-center gap-2">✨ Gemini 图像聊天</h1>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="hidden sm:inline">会话: {sessionId}</span>
        <Button variant="ghost" size="icon" onClick={onOpenSettings} title="设置">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onReset} title="重置对话" disabled={disabled}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
