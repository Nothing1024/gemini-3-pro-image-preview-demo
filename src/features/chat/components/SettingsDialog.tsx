import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiConfig, type ApiType, type ModelName } from '../utils/apiConfig';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiType, setApiType] = useState<ApiType>('gemini');
  const [model, setModel] = useState<ModelName>(apiConfig.getModel());
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setUrl(apiConfig.getUrl() || 'https://www.packyapi.com');
      setApiKey(apiConfig.getKey());
      setApiType(apiConfig.getType());
      setModel(apiConfig.getModel());
      setError('');
    }
  }, [open]);

  const handleSave = () => {
    if (!url.trim()) {
      setError('请输入 API URL');
      return;
    }
    if (!apiKey.trim()) {
      setError('请输入 API Key');
      return;
    }
    apiConfig.setUrl(url.trim());
    apiConfig.setKey(apiKey.trim());
    apiConfig.setType(apiType);
    apiConfig.setModel(model);
    onOpenChange(false);
  };

  const handleReset = () => {
    apiConfig.clear();
    setUrl('https://www.packyapi.com');
    setApiKey('');
    setApiType('gemini');
    setModel(apiConfig.getModel());
    setError('');
  };

  const getApiPathHint = () => {
    if (apiType === 'gemini') {
      return `${url || '{url}'}/v1beta/models/${model}:generateContent`;
    }
    return `${url || '{url}'}/v1/chat/completions`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>
            管理您的应用首选项和 API 连接
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* API 配置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">API 配置</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-type">API 类型</Label>
                <Select value={apiType} onValueChange={(value: ApiType) => setApiType(value)}>
                  <SelectTrigger id="api-type">
                    <SelectValue placeholder="选择 API 类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini (原生格式)</SelectItem>
                    <SelectItem value="openai">OpenAI 兼容格式</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {apiType === 'gemini'
                    ? '使用 Gemini 原生 API 格式，支持图片生成和编辑'
                    : '使用 OpenAI 兼容 API 格式，适用于普通 Chat 对话'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-url">API URL</Label>
                <Input
                  id="api-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.packyapi.com"
                />
                <p className="text-xs text-muted-foreground">
                  请求地址：{getApiPathHint()}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入您的 API Key"
                />
                <p className="text-xs text-muted-foreground">
                  {apiType === 'gemini'
                    ? 'Key 将通过 x-goog-api-key 头部发送'
                    : 'Key 将通过 Authorization: Bearer 头部发送'}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
