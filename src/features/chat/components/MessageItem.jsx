import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MessageItem({ message, onDownload }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex flex-col gap-2 max-w-3xl mx-auto', isUser ? 'items-end' : 'items-start')}>
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', isUser ? 'flex-row-reverse' : '')}>
        <span className="font-semibold">{isUser ? '你' : 'Gemini'}</span>
        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>

      <div
        className={cn(
          'rounded-lg p-4 shadow-sm max-w-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-card border',
          message.isError ? 'bg-destructive/10 border-destructive text-destructive' : ''
        )}
      >
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}

        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.images.map((img, i) => (
              <img key={i} src={img} alt="uploaded" className="h-20 w-20 object-cover rounded-md border" />
            ))}
          </div>
        )}

        {message.thinkingImages && message.thinkingImages.length > 0 && (
          <div className="mt-4 p-2 bg-muted/50 rounded text-xs">
            <p className="font-semibold mb-2">🧠 思考过程:</p>
            <div className="flex overflow-x-auto gap-2 py-2">
              {message.thinkingImages.map((img, i) => (
                <img key={i} src={`data:image/png;base64,${img}`} className="h-24 w-auto rounded border" alt="thinking" />
              ))}
            </div>
          </div>
        )}

        {message.imageData && (
          <div className="mt-4 relative group">
            <img
              src={`data:image/png;base64,${message.imageData}`}
              alt="generated"
              className="w-full max-w-md rounded-lg border shadow-sm"
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => onDownload(message.imageData)}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
