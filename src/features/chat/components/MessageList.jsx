import { useEffect, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { MessageItem } from './MessageItem';

export function MessageList({ messages, onDownload }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {!messages.length ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
          <ImageIcon className="h-16 w-16 mb-4" />
          <p>开始对话以生成图像...</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem key={message.id} message={message} onDownload={onDownload} />
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}
