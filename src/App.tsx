import { useEffect, useState } from 'react'
import { ChatHeader } from '@/features/chat/components/ChatHeader'
import { MessageList } from '@/features/chat/components/MessageList'
import { PromptPanel } from '@/features/chat/components/PromptPanel'
import { LoadingOverlay } from '@/features/chat/components/LoadingOverlay'
import { SettingsDialog } from '@/features/chat/components/SettingsDialog'
import { useChatSession } from '@/features/chat/hooks/useChatSession'
import { apiConfig, type ModelName } from '@/features/chat/utils/apiConfig'

function App() {
  const { state, actions } = useChatSession()
  const [settingsOpen, setSettingsOpen] = useState(!apiConfig.isConfigured())
  const [model, setModel] = useState<ModelName>(apiConfig.getModel())

  const handleModelChange = (value: ModelName) => {
    setModel(value)
    apiConfig.setModel(value)
  }

  useEffect(() => {
    if (!settingsOpen) {
      setModel(apiConfig.getModel())
    }
  }, [settingsOpen])

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <ChatHeader
        loading={state.loading}
        onReset={actions.reset}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 relative pb-36 md:pb-48">
          <MessageList
            messages={state.messages}
            includeThinking={state.includeThinking}
            onDownload={actions.downloadImage}
          />

          {/* 加载覆盖层 */}
          <LoadingOverlay show={state.loading} />
        </div>
      </main>

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
        model={model}
        includeThinking={state.includeThinking}
        onAspectChange={actions.setAspectRatio}
        onSizeChange={actions.setImageSize}
        onModelChange={handleModelChange}
        onToggleThinking={actions.setIncludeThinking}
        canEditLast={!!state.lastImageData}
        onEditLast={() => actions.sendPrompt('edit')}
      />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}

export default App
