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
import { apiConfig } from '../utils/apiConfig';

export function SettingsDialog({ open, onOpenChange }) {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setUrl(apiConfig.getUrl() || 'https://www.packyapi.com');
      setApiKey(apiConfig.getKey());
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
    onOpenChange(false);
  };

  const handleReset = () => {
    apiConfig.clear();
    setUrl('https://www.packyapi.com');
    setApiKey('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API 配置</DialogTitle>
          <DialogDescription>
            配置您的 Gemini API 访问信息
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">API URL</Label>
            <Input
              id="api-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.packyapi.com"
            />
            <p className="text-xs text-muted-foreground">
              您的url会以 {url || '{url}'}/v1beta/models/gemini-3-pro-image-preview:generateContent 的形式进行请求
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
              API Key 将存储在本地浏览器中，请勿在公共设备上使用
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
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
