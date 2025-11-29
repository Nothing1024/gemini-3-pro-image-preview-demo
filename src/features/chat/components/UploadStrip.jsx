import { useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UploadStrip({ uploads, onAddFiles, onRemove }) {
  const fileInputRef = useRef(null);

  const handleFiles = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await onAddFiles(files);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {uploads.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {uploads.map((img) => (
            <div key={img.id} className="relative shrink-0">
              <img src={img.dataUrl} className="h-16 w-16 object-cover rounded-md border" alt={img.name} />
              <button
                onClick={() => onRemove(img.id)}
                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 shadow-sm hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFiles}
        />
        <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} title="Upload Images">
          <Plus className="h-5 w-5" />
        </Button>
        <span className="text-xs text-muted-foreground">最多 14 张参考图，自动排队发送</span>
      </div>
    </div>
  );
}
