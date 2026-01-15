import { Edit, Monitor, Ratio, Bot, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { type ModelName, apiConfig } from "@/features/chat/utils/apiConfig"
import type { AspectRatio, ImageSize } from "@/features/chat/types"

type ControlBarProps = {
  aspectRatio: AspectRatio
  imageSize: ImageSize
  model: ModelName
  forceImageGuidance: boolean
  onAspectChange: (value: AspectRatio) => void
  onSizeChange: (value: ImageSize) => void
  onModelChange: (model: ModelName) => void
  onToggleForceImageGuidance: (value: boolean) => void
  onEdit: () => void
  canEdit: boolean
  loading: boolean
}

export function ControlBar({
  aspectRatio,
  imageSize,
  model,
  forceImageGuidance,
  onAspectChange,
  onSizeChange,
  onModelChange,
  onToggleForceImageGuidance,
  onEdit,
  canEdit,
  loading,
}: ControlBarProps) {
  const apiType = apiConfig.getType()

  const openAIModelList = apiType === "openai" ? apiConfig.getOpenAIModelList() : []

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground px-1">
      {/* 模型选择（OpenAI 兼容模式）- 下拉列表 */}
      {apiType === "openai" && (
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <Select
            value={openAIModelList.includes(model) ? model : undefined}
            onValueChange={(value) => onModelChange(value as ModelName)}
          >
            <SelectTrigger className="h-8 w-[240px] border-transparent bg-transparent hover:bg-muted/50 focus:ring-0 px-2 shadow-none data-[state=open]:bg-muted">
              <SelectValue placeholder={openAIModelList.length === 0 ? "暂无可用模型" : "选择模型"} />
            </SelectTrigger>
            <SelectContent>
              {openAIModelList.length === 0 ? (
                <SelectItem value="__empty_openai_model_list__" disabled>
                  请先在设置中添加模型
                </SelectItem>
              ) : (
                openAIModelList.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 宽高比选择 */}
      {apiType === "gemini" && (
        <div className="flex items-center gap-2">
          <Ratio className="h-4 w-4" />
          <Select value={aspectRatio} onValueChange={(value) => onAspectChange(value as AspectRatio)}>
            <SelectTrigger className="h-8 w-[140px] border-transparent bg-transparent hover:bg-muted/50 focus:ring-0 px-2 shadow-none data-[state=open]:bg-muted">
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
      )}

      {/* 图像大小选择 */}
      {apiType === "gemini" && (
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          <Select value={imageSize} onValueChange={(value) => onSizeChange(value as ImageSize)}>
            <SelectTrigger className="h-8 w-[70px] border-transparent bg-transparent hover:bg-muted/50 focus:ring-0 px-2 shadow-none data-[state=open]:bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1K">1K</SelectItem>
              <SelectItem value="2K">2K</SelectItem>
              <SelectItem value="4K">4K</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 强制出图引导开关 */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onToggleForceImageGuidance(!forceImageGuidance)}
        >
          <span className="text-xs">强制出图引导</span>
          <Switch
            id="force-image-guidance"
            checked={forceImageGuidance}
            onCheckedChange={onToggleForceImageGuidance}
            className="scale-75 origin-left"
          />
        </div>
      </div>

      {/* 编辑上一张按钮 */}
      {apiType === "gemini" && canEdit && (
        <>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            disabled={loading}
            className="ml-auto sm:ml-0 h-8 text-xs hover:bg-muted/50"
          >
            <Edit className="h-3.5 w-3.5 mr-2" />
            编辑上一张
          </Button>
        </>
      )}
    </div>
  )
}
