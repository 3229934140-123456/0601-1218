import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import AudioImport from './pages/AudioImport'
import RealtimeTranscribe from './pages/RealtimeTranscribe'
import MinutesEditor from './pages/MinutesEditor'
import TaskExtraction from './pages/TaskExtraction'
import KnowledgeRetrieval from './pages/KnowledgeRetrieval'
import TemplateCenter from './pages/TemplateCenter'
import UserSettings from './pages/UserSettings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/audio-import" replace />} />
        <Route path="audio-import" element={<AudioImport />} />
        <Route path="realtime" element={<RealtimeTranscribe />} />
        <Route path="editor" element={<MinutesEditor />} />
        <Route path="tasks" element={<TaskExtraction />} />
        <Route path="knowledge" element={<KnowledgeRetrieval />} />
        <Route path="templates" element={<TemplateCenter />} />
        <Route path="settings" element={<UserSettings />} />
      </Route>
    </Routes>
  )
}
