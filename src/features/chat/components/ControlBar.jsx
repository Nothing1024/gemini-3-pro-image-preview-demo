import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit } from 'lucide-react';

export function ControlBar({
  aspectRatio,
  imageSize,
  includeThinking,
  onAspectChange,
  onSizeChange,
  onToggleThinking,
  onEdit,
  canEdit,
  loading,
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <Label className="text-muted-foreground">宽高比:</Label>
        <Select value={aspectRatio} onValueChange={onAspectChange}>
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">1:1 (正方形)</SelectItem>
            <SelectItem value="16:9">16:9 (横向)</SelectItem>
            <SelectItem value="4:3">4:3</SelectItem>
            <SelectItem value="3:4">3:4</SelectItem>
            <SelectItem value="9:16">9:16 (纵向)</SelectItem>
            <SelectItem value="5:4">5:4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-muted-foreground">尺寸:</Label>
        <Select value={imageSize} onValueChange={onSizeChange}>
          <SelectTrigger className="h-8 w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1K">1K</SelectItem>
            <SelectItem value="2K">2K</SelectItem>
            <SelectItem value="4K">4K</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="thinking"
          checked={includeThinking}
          onCheckedChange={onToggleThinking}
        />
        <Label htmlFor="thinking" className="cursor-pointer">显示思考过程</Label>
      </div>

      {canEdit && (
        <Button variant="ghost" size="sm" onClick={onEdit} disabled={loading} className="ml-auto">
          <Edit className="h-4 w-4 mr-2" />
          编辑上一张
        </Button>
      )}
    </div>
  );
}
