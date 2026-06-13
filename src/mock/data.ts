import { v4 as uuidv4 } from 'uuid'
import type { Meeting, Speaker, Template, UserSettings, ProcessingStatus, Task } from '@/types'

export const mockSpeakers: Speaker[] = [
  { id: 's1', name: '张三', color: '#1890ff' },
  { id: 's2', name: '李四', color: '#52c41a' },
  { id: 's3', name: '王五', color: '#fa8c16' },
  { id: 's4', name: '赵六', color: '#722ed1' },
  { id: 's5', name: '钱七', color: '#eb2f96' }
]

const now = Date.now()

export const mockMeetings: Meeting[] = [
  {
    id: 'm1',
    title: 'Q3产品规划会议',
    date: new Date(now - 86400000).toISOString(),
    duration: 5400,
    participants: ['张三', '李四', '王五'],
    audioFile: 'meeting_q3.wav',
    status: 'completed',
    progress: 100,
    summary: '本次会议讨论了Q3季度的产品规划，包括新功能开发、市场推广策略以及团队资源分配。确定了三个主要项目的优先级和时间节点。',
    transcript: [
      { id: 't1', speakerId: 's1', startTime: 0, endTime: 45, content: '大家好，今天我们来讨论Q3的产品规划，首先请产品经理介绍一下整体思路。', isHighlight: false, isSensitive: false, topicId: 'topic1' },
      { id: 't2', speakerId: 's2', startTime: 45, endTime: 120, content: '好的，Q3我们主要有三个方向：第一是用户增长，第二是功能优化，第三是商业化探索。', isHighlight: true, isSensitive: false, topicId: 'topic1' },
      { id: 't3', speakerId: 's3', startTime: 120, endTime: 180, content: '我补充一下，关于商业化这部分需要和财务部门确认预算是多少？', isHighlight: false, isSensitive: false, topicId: 'topic1' },
      { id: 't4', speakerId: 's2', startTime: 180, endTime: 250, content: '预算大概在500万左右，具体数字需要会后和财务确认。关于用户增长，我们需要技术这边需要支持新用户引导流程。', isHighlight: true, isSensitive: false, topicId: 'topic1' },
      { id: 't5', speakerId: 's1', startTime: 250, endTime: 320, content: '好的，那我们先讨论第二个议题：技术方案评审。', isHighlight: false, isSensitive: false, topicId: 'topic2' },
      { id: 't6', speakerId: 's3', startTime: 320, endTime: 400, content: '技术方案我们考虑微服务架构，拆分用户中心、订单中心、支付中心三个模块。', isHighlight: false, isSensitive: false, topicId: 'topic2' },
      { id: 't7', speakerId: 's1', startTime: 400, endTime: 480, content: '微服务拆分是否必要？当前团队规模能否支撑？', isHighlight: false, isSensitive: false, topicId: 'topic2' },
      { id: 't8', speakerId: 's3', startTime: 480, endTime: 560, content: '我们可以分步实施，先拆分核心模块，预计需要2个月时间完成第一阶段。', isHighlight: true, isSensitive: false, topicId: 'topic2' },
      { id: 't9', speakerId: 's1', startTime: 560, endTime: 620, content: '好的，那第三个议题：市场推广计划。', isHighlight: false, isSensitive: false, topicId: 'topic3' },
      { id: 't10', speakerId: 's4', startTime: 620, endTime: 700, content: '市场推广我们计划线上线下结合，线上主要投放社交媒体和内容营销，线下参加行业展会。', isHighlight: false, isSensitive: false, topicId: 'topic3' },
      { id: 't11', speakerId: 's2', startTime: 700, endTime: 780, content: '关于定价策略需要注意，这部分内容比较敏感，不要对外透露。', isHighlight: false, isSensitive: true, topicId: 'topic3' },
      { id: 't12', speakerId: 's1', startTime: 780, endTime: 850, content: '好的，大家还有什么问题吗？没有的话我们分配一下任务。', isHighlight: false, isSensitive: false, topicId: 'topic3' }
    ],
    topics: [
      { id: 'topic1', title: '产品规划方向', description: '讨论Q3产品规划的三个主要方向', startTime: 0, endTime: 320, segmentIds: ['t1', 't2', 't3', 't4'] },
      { id: 'topic2', title: '技术方案评审', description: '评审微服务架构方案', startTime: 320, endTime: 620, segmentIds: ['t5', 't6', 't7', 't8'] },
      { id: 'topic3', title: '市场推广计划', description: '讨论Q3市场推广策略', startTime: 620, endTime: 900, segmentIds: ['t9', 't10', 't11', 't12'] }
    ],
    tasks: [
      { id: 'task1', title: '制定详细需求文档', description: '根据会议讨论内容整理成正式需求文档', assignee: '李四', deadline: '2024-06-20', priority: 'high', status: 'pending', meetingId: 'm1', createdAt: new Date(now - 86400000).toISOString() },
      { id: 'task2', title: '技术方案详细设计', description: '完成微服务架构详细设计方案', assignee: '王五', deadline: '2024-06-25', priority: 'high', status: 'in-progress', meetingId: 'm1', createdAt: new Date(now - 86400000).toISOString() },
      { id: 'task3', title: '市场推广方案细化', description: '制定详细的市场推广执行方案', assignee: '赵六', deadline: '2024-06-30', priority: 'medium', status: 'pending', meetingId: 'm1', createdAt: new Date(now - 86400000).toISOString() }
    ],
    createdAt: new Date(now - 86400000).toISOString(),
    updatedAt: new Date(now - 86400000).toISOString()
  },
  {
    id: 'm2',
    title: '技术周会 - 第12周',
    date: new Date(now - 172800000).toISOString(),
    duration: 3600,
    participants: ['王五', '赵六', '钱七'],
    status: 'completed',
    progress: 100,
    summary: '本周技术周会讨论了项目进度、技术债务清理计划以及下周工作计划。',
    transcript: [
      { id: 't13', speakerId: 's3', startTime: 0, endTime: 60, content: '大家好，本周项目进度汇报开始。', isHighlight: false, isSensitive: false, topicId: 'topic4' },
      { id: 't14', speakerId: 's4', startTime: 60, endTime: 150, content: '用户中心开发进度80%，预计本周五可以提测。', isHighlight: true, isSensitive: false, topicId: 'topic4' },
      { id: 't15', speakerId: 's5', startTime: 150, endTime: 240, content: '订单中心接口联调中，遇到一些性能问题需要优化。', isHighlight: false, isSensitive: false, topicId: 'topic4' },
      { id: 't16', speakerId: 's3', startTime: 240, endTime: 300, content: '好的，接下来讨论技术债务清理。', isHighlight: false, isSensitive: false, topicId: 'topic5' },
      { id: 't17', speakerId: 's4', startTime: 300, endTime: 380, content: '建议下周安排2个开发人员专门处理遗留代码重构。', isHighlight: false, isSensitive: false, topicId: 'topic5' },
      { id: 't18', speakerId: 's3', startTime: 380, endTime: 450, content: '可以，需要提交具体计划。', isHighlight: false, isSensitive: false, topicId: 'topic5' }
    ],
    topics: [
      { id: 'topic4', title: '项目进度汇报', description: '各模块开发进度汇报', startTime: 0, endTime: 240, segmentIds: ['t13', 't14', 't15'] },
      { id: 'topic5', title: '技术债务清理', description: '讨论技术债务清理计划', startTime: 240, endTime: 450, segmentIds: ['t16', 't17', 't18'] }
    ],
    tasks: [
      { id: 'task4', title: '用户中心提测', description: '完成用户中心开发并提交测试', assignee: '赵六', deadline: '2024-06-14', priority: 'high', status: 'completed', meetingId: 'm2', createdAt: new Date(now - 172800000).toISOString() },
      { id: 'task5', title: '性能优化方案', description: '解决订单中心性能问题', assignee: '钱七', deadline: '2024-06-18', priority: 'high', status: 'in-progress', meetingId: 'm2', createdAt: new Date(now - 172800000).toISOString() }
    ],
    createdAt: new Date(now - 172800000).toISOString(),
    updatedAt: new Date(now - 172800000).toISOString()
  },
  {
    id: 'm3',
    title: '新员工入职培训',
    date: new Date(now - 259200000).toISOString(),
    duration: 7200,
    participants: ['张三', '新员工A', '新员工B'],
    status: 'processing',
    progress: 65,
    summary: '',
    transcript: [],
    topics: [],
    tasks: [],
    createdAt: new Date(now - 259200000).toISOString(),
    updatedAt: new Date(now - 259200000).toISOString()
  }
]

export const mockTemplates: Template[] = [
  {
    id: 'tmpl1',
    name: '标准会议纪要',
    description: '适用于日常工作会议纪要',
    category: '通用',
    content: '# {{会议标题}}\n\n**时间：{{会议时间}}\n**参会人员：{{参会人员}}\n\n## 会议摘要\n{{会议摘要}}\n\n## 讨论议题\n{{讨论议题}}\n\n## 待办事项\n{{待办事项}}\n\n## 附件\n{{附件}}',
    variables: ['会议标题', '会议时间', '参会人员', '会议摘要', '讨论议题', '待办事项', '附件'],
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'tmpl2',
    name: '项目周报模板',
    description: '适用于项目周例会',
    category: '项目管理',
    content: '# {{项目名称}} - 第{{周次}}周周报\n\n**汇报周期：{{汇报周期}}\n**参会人员：{{参会人员}}\n\n## 本周工作完成情况\n{{本周完成}}\n\n## 遇到的问题\n{{遇到的问题}}\n\n## 下周工作计划\n{{下周计划}}\n\n## 需要协调的事项\n{{协调事项}}',
    variables: ['项目名称', '周次', '汇报周期', '参会人员', '本周完成', '遇到的问题', '下周计划', '协调事项'],
    isDefault: false,
    createdAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'tmpl3',
    name: '产品评审纪要',
    description: '适用于产品需求评审会议',
    category: '产品',
    content: '# 产品需求评审纪要\n\n**产品名称：{{产品名称}}\n**评审时间：{{评审时间}}\n**参会人员：{{参会人员}}\n\n## 需求概述\n{{需求概述}}\n\n## 评审意见\n{{评审意见}}\n\n## 修改建议\n{{修改建议}}\n\n## 结论\n{{结论}}\n\n## 后续行动\n{{后续行动}}',
    variables: ['产品名称', '评审时间', '参会人员', '需求概述', '评审意见', '修改建议', '结论', '后续行动'],
    isDefault: false,
    createdAt: '2024-02-01T00:00:00.000Z'
  },
  {
    id: 'tmpl4',
    name: '技术方案评审',
    description: '适用于技术方案评审会议',
    category: '技术',
    content: '# 技术方案评审纪要\n\n**方案名称：{{方案名称}}\n**评审时间：{{评审时间}}\n**参会人员：{{参会人员}}\n\n## 方案概述\n{{方案概述}}\n\n## 技术选型\n{{技术选型}}\n\n## 风险评估\n{{风险评估}}\n\n## 评审结论\n{{评审结论}}\n\n## 后续工作\n{{后续工作}}',
    variables: ['方案名称', '评审时间', '参会人员', '方案概述', '技术选型', '风险评估', '评审结论', '后续工作'],
    isDefault: false,
    createdAt: '2024-02-15T00:00:00.000Z'
  }
]

export const mockSettings: UserSettings = {
  id: 'settings1',
  theme: 'light',
  autoSave: true,
  language: 'zh-CN',
  sensitiveWords: ['定价', '薪酬', '预算', '成本', '利润'],
  commonWords: ['微服务', '用户增长', '转化率', 'KPI', 'OKR', '复盘'],
  defaultTemplateId: 'tmpl1',
  notificationEnabled: true
}

export const mockProcessingStatus: ProcessingStatus[] = [
  {
    id: 'ps1',
    meetingId: 'm3',
    meetingTitle: '新员工入职培训',
    step: 'transcribing',
    progress: 65,
    message: '正在进行语音转写...',
    startTime: new Date(now - 3600000).toISOString(),
    estimatedEndTime: new Date(now + 1800000).toISOString()
  }
]

export function generateId(): string {
  return uuidv4()
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`
  }
  if (minutes > 0) {
    return `${minutes}分${secs}秒`
  }
  return `${secs}秒`
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const allTasks: Task[] = mockMeetings.flatMap(m => m.tasks)
