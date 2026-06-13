export interface Speaker {
  id: string
  name: string
  color: string
  avatar?: string
}

export interface TranscriptSegment {
  id: string
  speakerId: string
  startTime: number
  endTime: number
  content: string
  isHighlight: boolean
  isSensitive: boolean
  topicId?: string
}

export interface Topic {
  id: string
  title: string
  description: string
  startTime: number
  endTime: number
  segmentIds: string[]
}

export interface Task {
  id: string
  title: string
  description: string
  assignee: string
  deadline: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in-progress' | 'completed'
  sourceSegmentId?: string
  meetingId: string
  createdAt: string
}

export interface Meeting {
  id: string
  title: string
  date: string
  duration: number
  participants: string[]
  audioFile?: string
  transcript: TranscriptSegment[]
  topics: Topic[]
  summary: string
  tasks: Task[]
  status: 'processing' | 'completed' | 'error'
  progress: number
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  content: string
  variables: string[]
  isDefault: boolean
  createdAt: string
}

export interface UserSettings {
  id: string
  theme: 'light' | 'dark'
  autoSave: boolean
  language: string
  sensitiveWords: string[]
  commonWords: string[]
  defaultTemplateId?: string
  notificationEnabled: boolean
}

export interface ProcessingStatus {
  id: string
  meetingId: string
  meetingTitle: string
  step: 'uploading' | 'transcribing' | 'analyzing' | 'summarizing' | 'completed' | 'error'
  progress: number
  message: string
  startTime: string
  estimatedEndTime?: string
}

export interface SearchResult {
  meetingId: string
  meetingTitle: string
  snippet: string
  segmentId: string
  relevance: number
  timestamp: number
}

export interface CompareResult {
  meeting1Id: string
  meeting2Id: string
  similarities: string[]
  differences: string[]
  commonTopics: string[]
  uniqueTopics1: string[]
  uniqueTopics2: string[]
}
