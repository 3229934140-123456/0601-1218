import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Meeting, Template, UserSettings, ProcessingStatus, Task, TranscriptSegment, Topic, SearchResult, CompareResult } from '@/types'
import { mockMeetings, mockTemplates, mockSettings, mockProcessingStatus, mockSpeakers, generateId } from '@/mock/data'

interface MeetingStore {
  meetings: Meeting[]
  templates: Template[]
  settings: UserSettings
  processingStatus: ProcessingStatus[]
  currentMeetingId: string | null
  searchResults: SearchResult[]
  compareResult: CompareResult | null
  isRecording: boolean
  recordingTime: number
  currentSpeakerId: string | null
  realtimeTranscript: TranscriptSegment[]
  draftSegments: TranscriptSegment[]

  setCurrentMeeting: (id: string | null) => void
  getCurrentMeeting: () => Meeting | undefined
  addMeeting: (meeting: Partial<Meeting>) => void
  updateMeeting: (id: string, updates: Partial<Meeting>) => void
  deleteMeeting: (id: string) => void
  
  addTask: (meetingId: string, task: Partial<Task>) => void
  updateTask: (meetingId: string, taskId: string, updates: Partial<Task>) => void
  deleteTask: (meetingId: string, taskId: string) => void
  
  updateSegment: (meetingId: string, segmentId: string, updates: Partial<TranscriptSegment>) => void
  toggleSegmentHighlight: (meetingId: string, segmentId: string) => void
  toggleSegmentSensitive: (meetingId: string, segmentId: string) => void
  mergeTopics: (meetingId: string, topicIds: string[], newTitle: string) => void
  
  generateSummary: (meetingId: string) => Promise<void>
  extractTasks: (meetingId: string) => Promise<void>
  
  searchMeetings: (keyword: string) => SearchResult[]
  compareMeetings: (meeting1Id: string, meeting2Id: string) => CompareResult
  clearCompareResult: () => void
  
  startRecording: () => void
  stopRecording: () => void
  addRealtimeSegment: (content: string) => void
  setCurrentSpeaker: (speakerId: string) => void
  
  updateSettings: (updates: Partial<UserSettings>) => void
  addSensitiveWord: (word: string) => void
  removeSensitiveWord: (word: string) => void
  addCommonWord: (word: string) => void
  removeCommonWord: (word: string) => void
  
  generateMinutesByTemplate: (meetingId: string, templateId: string, includeSensitive?: boolean) => string
  exportMeeting: (meetingId: string, format: 'markdown' | 'docx' | 'pdf', templateId?: string, includeSensitive?: boolean) => Promise<string>
  sendToParticipants: (meetingId: string, participantEmails: string[], templateId?: string) => Promise<boolean>
  
  updateProcessingStatus: (status: ProcessingStatus) => void
  removeProcessingStatus: (id: string) => void
  
  getAllTasks: () => Task[]
  getSpeakers: () => typeof mockSpeakers
}

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set, get) => ({
      meetings: mockMeetings,
      templates: mockTemplates,
      settings: mockSettings,
      processingStatus: mockProcessingStatus,
      currentMeetingId: null,
      searchResults: [],
      compareResult: null,
      isRecording: false,
      recordingTime: 0,
      currentSpeakerId: mockSpeakers[0].id,
      realtimeTranscript: [],
      draftSegments: [],

      setCurrentMeeting: (id) => set({ currentMeetingId: id }),
      
      getCurrentMeeting: () => {
        const { meetings, currentMeetingId } = get()
        return meetings.find(m => m.id === currentMeetingId)
      },

      addMeeting: (meeting) => set((state) => ({
        meetings: [
          {
            id: generateId(),
            title: meeting.title || '未命名会议',
            date: new Date().toISOString(),
            duration: 0,
            participants: [],
            transcript: [],
            topics: [],
            summary: '',
            tasks: [],
            status: 'processing',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...meeting
          },
          ...state.meetings
        ]
      })),

      updateMeeting: (id, updates) => set((state) => ({
        meetings: state.meetings.map(m =>
          m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
        )
      })),

      deleteMeeting: (id) => set((state) => ({
        meetings: state.meetings.filter(m => m.id !== id)
      })),

      addTask: (meetingId, task) => set((state) => ({
        meetings: state.meetings.map(m =>
          m.id === meetingId
            ? {
                ...m,
                tasks: [
                  ...m.tasks,
                  {
                    id: generateId(),
                    title: task.title || '',
                    description: task.description || '',
                    assignee: task.assignee || '',
                    deadline: task.deadline || '',
                    priority: task.priority || 'medium',
                    status: task.status || 'pending',
                    meetingId,
                    createdAt: new Date().toISOString(),
                    ...task
                  }
                ]
              }
            : m
        )
      })),

      updateTask: (meetingId, taskId, updates) => set((state) => ({
        meetings: state.meetings.map(m =>
          m.id === meetingId
            ? {
                ...m,
                tasks: m.tasks.map(t =>
                  t.id === taskId ? { ...t, ...updates } : t
                )
              }
            : m
        )
      })),

      deleteTask: (meetingId, taskId) => set((state) => ({
        meetings: state.meetings.map(m =>
          m.id === meetingId
            ? { ...m, tasks: m.tasks.filter(t => t.id !== taskId) }
            : m
        )
      })),

      updateSegment: (meetingId, segmentId, updates) => set((state) => ({
        meetings: state.meetings.map(m =>
          m.id === meetingId
            ? {
                ...m,
                transcript: m.transcript.map(s =>
                  s.id === segmentId ? { ...s, ...updates } : s
                )
              }
            : m
        )
      })),

      toggleSegmentHighlight: (meetingId, segmentId) => {
        const meeting = get().meetings.find(m => m.id === meetingId)
        const segment = meeting?.transcript.find(s => s.id === segmentId)
        if (segment) {
          get().updateSegment(meetingId, segmentId, { isHighlight: !segment.isHighlight })
        }
      },

      toggleSegmentSensitive: (meetingId, segmentId) => {
        const meeting = get().meetings.find(m => m.id === meetingId)
        const segment = meeting?.transcript.find(s => s.id === segmentId)
        if (segment) {
          get().updateSegment(meetingId, segmentId, { isSensitive: !segment.isSensitive })
        }
      },

      mergeTopics: (meetingId, topicIds, newTitle) => set((state) => {
        const meeting = state.meetings.find(m => m.id === meetingId)
        if (!meeting) return state

        const topicsToMerge = meeting.topics.filter(t => topicIds.includes(t.id))
        const allSegmentIds = topicsToMerge.flatMap(t => t.segmentIds)
        const minStartTime = Math.min(...topicsToMerge.map(t => t.startTime))
        const maxEndTime = Math.max(...topicsToMerge.map(t => t.endTime))

        const newTopic: Topic = {
          id: generateId(),
          title: newTitle,
          description: topicsToMerge.map(t => t.description).join('；'),
          startTime: minStartTime,
          endTime: maxEndTime,
          segmentIds: allSegmentIds
        }

        return {
          meetings: state.meetings.map(m =>
            m.id === meetingId
              ? {
                  ...m,
                  topics: [
                    ...m.topics.filter(t => !topicIds.includes(t.id)),
                    newTopic
                  ],
                  transcript: m.transcript.map(s =>
                    allSegmentIds.includes(s.id) ? { ...s, topicId: newTopic.id } : s
                  )
                }
              : m
          )
        }
      }),

      generateSummary: async (meetingId) => {
        await new Promise(resolve => setTimeout(resolve, 1500))
        const meeting = get().meetings.find(m => m.id === meetingId)
        if (meeting) {
          const summaries = meeting.topics.map(t => t.title + ': ' + t.description).join('; ')
          get().updateMeeting(meetingId, {
            summary: '本次会议讨论了' + meeting.topics.length + '个议题，' + summaries + '。',
            status: 'completed',
            progress: 100
          })
        }
      },

      extractTasks: async (meetingId) => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const meeting = get().meetings.find(m => m.id === meetingId)
        const speakers = get().getSpeakers()
        if (meeting && meeting.tasks.length === 0) {
          const newTasks: Task[] = [
            {
              id: generateId(),
              title: '整理会议纪要',
              description: '根据会议内容整理正式会议纪要',
              assignee: speakers[0].name,
              deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
              priority: 'high',
              status: 'pending',
              meetingId,
              createdAt: new Date().toISOString()
            },
            {
              id: generateId(),
              title: '跟进决议执行',
              description: '跟进会议决议的执行情况',
              assignee: speakers[1].name,
              deadline: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
              priority: 'medium',
              status: 'pending',
              meetingId,
              createdAt: new Date().toISOString()
            }
          ]
          set((state) => ({
            meetings: state.meetings.map(m =>
              m.id === meetingId ? { ...m, tasks: newTasks } : m
            )
          }))
        }
      },

      searchMeetings: (keyword) => {
        const { meetings } = get()
        const results: SearchResult[] = []
        
        meetings.forEach(meeting => {
          meeting.transcript.forEach(segment => {
            if (segment.content.includes(keyword)) {
              const index = segment.content.indexOf(keyword)
              results.push({
                meetingId: meeting.id,
                meetingTitle: meeting.title,
                snippet: `...${segment.content.substring(Math.max(0, index - 20), Math.min(segment.content.length, index + keyword.length + 20))}...`,
                segmentId: segment.id,
                relevance: 1.0,
                timestamp: segment.startTime
              })
            }
          })
        })
        
        set({ searchResults: results })
        return results
      },

      compareMeetings: (meeting1Id, meeting2Id) => {
        const { meetings } = get()
        const m1 = meetings.find(m => m.id === meeting1Id)
        const m2 = meetings.find(m => m.id === meeting2Id)
        
        if (!m1 || !m2) return null as unknown as CompareResult
        
        const topics1 = new Set(m1.topics.map(t => t.title))
        const topics2 = new Set(m2.topics.map(t => t.title))
        
        const commonTopics = [...topics1].filter(t => topics2.has(t))
        const uniqueTopics1 = [...topics1].filter(t => !topics2.has(t))
        const uniqueTopics2 = [...topics2].filter(t => !topics1.has(t))
        
        const result: CompareResult = {
          meeting1Id,
          meeting2Id,
          similarities: ['都讨论了项目进度和后续计划', '都有明确的任务分配'],
          differences: [m1.title + '更侧重产品规划', m2.title + '更侧重技术执行'],
          commonTopics,
          uniqueTopics1,
          uniqueTopics2
        }
        
        set({ compareResult: result })
        return result
      },

      clearCompareResult: () => set({ compareResult: null }),

      startRecording: () => {
        set({ 
          isRecording: true, 
          recordingTime: 0,
          realtimeTranscript: [],
          currentMeetingId: null
        })
        
        const interval = setInterval(() => {
          const state = get()
          if (!state.isRecording) {
            clearInterval(interval)
            return
          }
          set({ recordingTime: state.recordingTime + 1 })
        }, 1000)
      },

      stopRecording: () => set({ isRecording: false }),

      addRealtimeSegment: (content) => {
        const { recordingTime, currentSpeakerId, realtimeTranscript } = get()
        const lastSegment = realtimeTranscript[realtimeTranscript.length - 1]
        const startTime = lastSegment ? lastSegment.endTime : 0
        const endTime = Math.max(startTime + Math.min(recordingTime - startTime, 15), startTime + 3)
        
        const newSegment: TranscriptSegment = {
          id: generateId(),
          speakerId: currentSpeakerId || 's1',
          startTime,
          endTime,
          content,
          isHighlight: false,
          isSensitive: false
        }
        set({ realtimeTranscript: [...realtimeTranscript, newSegment] })
      },

      setCurrentSpeaker: (speakerId) => set({ currentSpeakerId: speakerId }),

      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),

      addSensitiveWord: (word) => set((state) => ({
        settings: {
          ...state.settings,
          sensitiveWords: [...state.settings.sensitiveWords, word]
        }
      })),

      removeSensitiveWord: (word) => set((state) => ({
        settings: {
          ...state.settings,
          sensitiveWords: state.settings.sensitiveWords.filter(w => w !== word)
        }
      })),

      addCommonWord: (word) => set((state) => ({
        settings: {
          ...state.settings,
          commonWords: [...state.settings.commonWords, word]
        }
      })),

      removeCommonWord: (word) => set((state) => ({
        settings: {
          ...state.settings,
          commonWords: state.settings.commonWords.filter(w => w !== word)
        }
      })),

      generateMinutesByTemplate: (meetingId, templateId, includeSensitive = false) => {
        const { meetings, templates } = get()
        const meeting = meetings.find(m => m.id === meetingId)
        const template = templates.find(t => t.id === templateId)
        
        if (!meeting || !template) return ''
        
        let content = template.content
        
        const getWeekNumber = (date: Date) => {
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
          return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
        }
        
        const meetingDate = new Date(meeting.date)
        const weekStart = new Date(meetingDate)
        weekStart.setDate(meetingDate.getDate() - meetingDate.getDay() + 1)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        const weekNumber = getWeekNumber(meetingDate)
        
        const formatDate = (date: Date) => date.toLocaleDateString('zh-CN')
        
        const filterSensitive = (text: string) => {
          if (includeSensitive) return text
          return text.replace(/[\u4e00-\u9fa5a-zA-Z0-9]/g, '*')
        }
        
        const getTranscriptContent = (includeSen: boolean) => {
          return meeting.transcript
            .filter(s => includeSen || !s.isSensitive)
            .map(s => {
              const speaker = s.speakerId === 's1' ? '张三' : s.speakerId === 's2' ? '李四' : '王五'
              const cont = s.isSensitive && !includeSen ? filterSensitive(s.content) : s.content
              return `${speaker}：${cont}`
            })
            .join('\n\n')
        }
        
        const fillPlaceholder = (value: string, hint: string) => {
          if (value && value.trim()) return value
          return `【待补充：${hint}】`
        }
        
        const commonData: Record<string, string> = {
          '会议标题': fillPlaceholder(meeting.title, '请输入会议标题'),
          '会议时间': new Date(meeting.date).toLocaleString('zh-CN'),
          '参会人员': meeting.participants.length > 0 ? meeting.participants.join('、') : '【待补充：参会人员名单】',
          '会议摘要': fillPlaceholder(meeting.summary, '请补充会议摘要'),
          '附件': meeting.audioFile || '无',
          '项目名称': fillPlaceholder(meeting.title.replace(/会议|评审|讨论/g, ''), '请输入项目名称'),
          '周次': weekNumber.toString(),
          '汇报周期': `${formatDate(weekStart)} 至 ${formatDate(weekEnd)}`,
          '本周完成': meeting.topics.length > 0 
            ? meeting.topics.map((t, i) => `${i + 1}. ${t.title}：${t.description || '【待补充详情】'}`).join('\n\n')
            : '【待补充：本周完成的工作内容】',
          '遇到的问题': '【待补充：本周遇到的问题和风险】',
          '下周计划': meeting.tasks.length > 0
            ? meeting.tasks.filter(t => t.status !== 'completed').map((t, i) => `${i + 1}. ${t.title} - 负责人：${t.assignee}`).join('\n\n')
            : '【待补充：下周的工作计划】',
          '协调事项': '【待补充：需要协调的资源和事项】',
          '产品名称': fillPlaceholder(meeting.title.replace(/评审|讨论|会议/g, ''), '请输入产品名称'),
          '评审时间': new Date(meeting.date).toLocaleString('zh-CN'),
          '需求概述': fillPlaceholder(meeting.summary, '请补充需求概述'),
          '评审意见': '【待补充：评审意见和建议】',
          '修改建议': '【待补充：具体修改建议】',
          '结论': '【待补充：评审结论（通过/修改后重审/拒绝）】',
          '后续行动': meeting.tasks.length > 0
            ? meeting.tasks.map((t, i) => `${i + 1}. ${t.title} - 负责人：${t.assignee}，截止：${t.deadline}`).join('\n\n')
            : '【待补充：后续行动计划】',
          '方案名称': fillPlaceholder(meeting.title.replace(/评审|讨论|会议/g, ''), '请输入方案名称'),
          '方案概述': fillPlaceholder(meeting.summary, '请补充方案概述'),
          '技术选型': '【待补充：技术选型说明】',
          '风险评估': '【待补充：风险评估和应对措施】',
          '评审结论': '【待补充：评审结论（通过/修改后重审/拒绝）】',
          '后续工作': meeting.tasks.length > 0
            ? meeting.tasks.map((t, i) => `${i + 1}. ${t.title} - 负责人：${t.assignee}，截止：${t.deadline}`).join('\n\n')
            : '【待补充：后续工作安排】',
          '讨论议题': meeting.topics.length > 0
            ? meeting.topics.map((t, i) => `${i + 1}. ${t.title}\n\n${t.description || '【待补充议题详情】'}`).join('\n\n')
            : '【待补充：讨论的议题内容】',
          '待办事项': meeting.tasks.length > 0
            ? meeting.tasks.map((t, i) => {
                const priority = t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低'
                const status = t.status === 'completed' ? '已完成' : t.status === 'in-progress' ? '进行中' : '待处理'
                return `${i + 1}. [${priority}优先级] [${status}] ${t.title}\n   负责人：${t.assignee}\n   截止日期：${t.deadline}`
              }).join('\n\n')
            : '【待补充：待办事项列表】',
          '转写内容': getTranscriptContent(includeSensitive) || '【待补充：会议转写内容】'
        }
        
        Object.keys(commonData).forEach(key => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
          content = content.replace(regex, commonData[key])
        })
        
        const remainingVars = content.match(/\{\{[^}]+\}\}/g) || []
        remainingVars.forEach(v => {
          const varName = v.replace(/\{\{|\}\}/g, '')
          content = content.replace(v, `【待补充：${varName}】`)
        })
        
        return content
      },

      exportMeeting: async (meetingId, _format, templateId, includeSensitive = false) => {
        await new Promise(resolve => setTimeout(resolve, 800))
        const { meetings, generateMinutesByTemplate } = get()
        const meeting = meetings.find(m => m.id === meetingId)
        if (!meeting) return ''
        
        if (templateId) {
          const content = generateMinutesByTemplate(meetingId, templateId, includeSensitive)
          return content
        }
        
        const filterSensitive = (text: string) => {
          if (includeSensitive) return text
          return text.replace(/[\u4e00-\u9fa5a-zA-Z0-9]/g, '*')
        }
        
        let content = '# ' + meeting.title + '\n\n'
        content += '时间: ' + new Date(meeting.date).toLocaleString('zh-CN') + '\n\n'
        content += '参会人员: ' + meeting.participants.join('、') + '\n\n'
        content += '---\n\n'
        content += '## 会议摘要\n\n' + (meeting.summary || '【待补充：会议摘要】') + '\n\n'
        content += '---\n\n'
        content += '## 转写内容\n\n'
        meeting.transcript.forEach(segment => {
          if (!includeSensitive && segment.isSensitive) return
          const speaker = segment.speakerId === 's1' ? '张三' : segment.speakerId === 's2' ? '李四' : '王五'
          const segContent = segment.isSensitive && !includeSensitive ? filterSensitive(segment.content) : segment.content
          content += `**${speaker}**：${segContent}\n\n`
        })
        content += '---\n\n'
        content += '## 讨论议题\n\n'
        if (meeting.topics.length === 0) {
          content += '【待补充：讨论的议题内容】\n\n'
        } else {
          meeting.topics.forEach(topic => {
            content += '### ' + topic.title + '\n\n' + (topic.description || '【待补充议题详情】') + '\n\n'
          })
        }
        content += '---\n\n'
        content += '## 待办事项\n\n'
        if (meeting.tasks.length === 0) {
          content += '【待补充：待办事项列表】\n\n'
        } else {
          meeting.tasks.forEach(task => {
            const status = task.status === 'completed' ? 'x' : ' '
            content += '- [' + status + '] ' + task.title + ' - ' + task.assignee + ' (' + task.deadline + ')\n'
          })
        }
        
        return content
      },

      sendToParticipants: async (meetingId, participantEmails, templateId) => {
        await new Promise(resolve => setTimeout(resolve, 1500))
        const { meetings, generateMinutesByTemplate } = get()
        const meeting = meetings.find(m => m.id === meetingId)
        if (!meeting) return false
        
        const content = templateId 
          ? generateMinutesByTemplate(meetingId, templateId, false)
          : null
        
        console.log('发送会议纪要给:', participantEmails)
        console.log('会议标题:', meeting.title)
        console.log('会议摘要:', meeting.summary)
        if (content) console.log('纪要内容:', content)
        
        return true
      },

      updateProcessingStatus: (status) => set((state) => {
        const exists = state.processingStatus.find(s => s.id === status.id)
        if (exists) {
          return {
            processingStatus: state.processingStatus.map(s =>
              s.id === status.id ? status : s
            )
          }
        }
        return {
          processingStatus: [...state.processingStatus, status]
        }
      }),

      removeProcessingStatus: (id) => set((state) => ({
        processingStatus: state.processingStatus.filter(s => s.id !== id)
      })),

      getAllTasks: () => get().meetings.flatMap(m => m.tasks),

      getSpeakers: () => mockSpeakers
    }),
    {
      name: 'meeting-store'
    }
  )
)
