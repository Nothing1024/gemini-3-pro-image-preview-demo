import React, { useState } from 'react';
import { ChatHeader } from '@/features/chat/components/ChatHeader';
import { MessageList } from '@/features/chat/components/MessageList';
import { PromptPanel } from '@/features/chat/components/PromptPanel';
import { SettingsDialog } from '@/features/chat/components/SettingsDialog';
import { useChatSession } from '@/features/chat/hooks/useChatSession';
import { apiConfig } from '@/features/chat/utils/apiConfig';

function App() {
  const { state, actions } = useChatSession();
  const [settingsOpen, setSettingsOpen] = useState(!apiConfig.isConfigured());

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <ChatHeader
        sessionId={state.sessionId}
        onReset={actions.reset}
        onOpenSettings={() => setSettingsOpen(true)}
        disabled={state.loading}
      />

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <MessageList messages={state.messages} onDownload={actions.downloadImage} />

          <PromptPanel
            prompt={state.prompt}
            onPromptChange={actions.setPrompt}
            onSend={actions.sendPrompt}
            loading={state.loading}
            uploads={state.uploadedImages}
            onAddFiles={actions.addUploads}
            onRemoveUpload={actions.removeUpload}
            aspectRatio={state.aspectRatio}
            imageSize={state.imageSize}
            includeThinking={state.includeThinking}
            onAspectChange={actions.setAspectRatio}
            onSizeChange={actions.setImageSize}
            onToggleThinking={actions.setIncludeThinking}
            canEditLast={!!state.lastImageData}
            onEditLast={() => actions.sendPrompt('edit')}
          />
        </div>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

export default App;
