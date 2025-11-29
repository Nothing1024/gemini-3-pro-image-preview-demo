import { Send, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UploadStrip } from './UploadStrip';
import { ControlBar } from './ControlBar';

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
  includeThinking,
  onAspectChange,
  onSizeChange,
  onToggleThinking,
  canEditLast,
  onEditLast,
}) {
  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <UploadStrip uploads={uploads} onAddFiles={onAddFiles} onRemove={onRemoveUpload} />

        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="描述您想生成的图像..."
            className="min-h-[50px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend('generate');
              }
            }}
          />

          <div className="flex flex-col gap-2">
            <Button onClick={() => onSend('generate')} disabled={loading}>
              {loading ? <span className="animate-spin">⏳</span> : <Send className="h-4 w-4" />}
            </Button>
            <Button variant="secondary" size="icon" onClick={() => onSend('search')} disabled={loading} title="联网生成">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ControlBar
          aspectRatio={aspectRatio}
          imageSize={imageSize}
          includeThinking={includeThinking}
          onAspectChange={onAspectChange}
          onSizeChange={onSizeChange}
          onToggleThinking={onToggleThinking}
          onEdit={onEditLast}
          canEdit={canEditLast}
          loading={loading}
        />
      </div>
    </div>
  );
}
