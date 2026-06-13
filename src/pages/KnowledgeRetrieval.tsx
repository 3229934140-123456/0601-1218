import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Tabs,
  Input,
  Button,
  List,
  Select,
  Card,
  Tag,
  Typography,
  Space,
  Empty,
  Divider,
  Avatar
} from 'antd'
import {
  SearchOutlined,
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BulbOutlined
} from '@ant-design/icons'
import { useMeetingStore } from '@/store'
import type { SearchResult, CompareResult } from '@/types'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: number
}

export default function KnowledgeRetrieval() {
  const { meetings, searchMeetings, compareMeetings, compareResult, clearCompareResult } = useMeetingStore()
  const [activeTab, setActiveTab] = useState('qa')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    id: '1',
    role: 'ai',
    content: '您好！我是会议智能助手，您可以问我关于会议的任何问题，比如：\n• "Q3产品规划会议讨论了什么内容？"\n• "最近有哪些待办任务？"\n• "技术周会的结论是什么？"',
    timestamp: Date.now()
  }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [meeting1Id, setMeeting1Id] = useState<string | null>(null)
  const [meeting2Id, setMeeting2Id] = useState<string | null>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: Date.now()
    }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    const question = userMessage.content.toLowerCase()
    let answer = '抱歉，我暂时无法回答这个问题。您可以尝试询问具体的会议内容、待办任务或会议结论。'
    if (question.includes('q3') || question.includes('产品规划')) {
      const meeting = meetings.find(m => m.id === 'm1')
      if (meeting) {
        answer = `关于「${meeting.title}」：\n\n${meeting.summary}\n\n主要讨论了以下议题：\n${meeting.topics.map((t, i) => `${i + 1}. ${t.title}：${t.description}`).join('\n')}`
      }
    } else if (question.includes('技术周会') || question.includes('技术')) {
      const meeting = meetings.find(m => m.id === 'm2')
      if (meeting) {
        answer = `关于「${meeting.title}」：\n\n${meeting.summary}\n\n待办任务：\n${meeting.tasks.map((t, i) => `${i + 1}. ${t.title} - 负责人：${t.assignee}`).join('\n')}`
      }
    } else if (question.includes('任务') || question.includes('待办')) {
      const allTasks = meetings.flatMap(m => m.tasks)
      if (allTasks.length > 0) {
        answer = `当前共有 ${allTasks.length} 个待办任务：\n\n${allTasks.map((t, i) => `${i + 1}. [${t.status === 'completed' ? '已完成' : t.status === 'in-progress' ? '进行中' : '待处理'}] ${t.title} - ${t.assignee}`).join('\n')}`
      }
    } else if (question.includes('预算') || question.includes('成本')) {
      answer = '关于预算相关的敏感信息，已在 Q3 产品规划会议中讨论过。具体数字需要会后与财务部门确认。'
    }
    setChatMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: answer,
      timestamp: Date.now()
    }])
    setChatLoading(false)
  }

  const handleSearch = () => {
    if (!searchKeyword.trim()) return
    setSearchResults(searchMeetings(searchKeyword.trim()))
    setHasSearched(true)
  }

  const highlightKeyword = (text: string, keyword: string) => {
    if (!keyword) return text
    const parts = text.split(new RegExp(`(${keyword})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <span key={index} style={{ backgroundColor: '#fff3cd', color: '#d48806', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : part
    )
  }

  const handleCompare = () => {
    if (!meeting1Id || !meeting2Id) return
    compareMeetings(meeting1Id, meeting2Id)
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    if (key !== 'compare') clearCompareResult()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const completedMeetings = useMemo(() =>
    meetings.filter(m => m.status === 'completed'),
    [meetings]
  )

  const CompareResultView = ({ result }: { result: CompareResult }) => {
    const m1 = meetings.find(m => m.id === result.meeting1Id)
    const m2 = meetings.find(m => m.id === result.meeting2Id)
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title={<Space><BulbOutlined style={{ color: '#faad14' }} /><Text strong>相似点</Text></Space>} type="inner">
          <List dataSource={result.similarities} renderItem={(item) => (
            <List.Item><Space><CheckCircleOutlined style={{ color: '#52c41a' }} /><Text>{item}</Text></Space></List.Item>
          )} />
        </Card>
        <Card title={<Space><CloseCircleOutlined style={{ color: '#ff4d4f' }} /><Text strong>不同点</Text></Space>} type="inner">
          <List dataSource={result.differences} renderItem={(item) => (
            <List.Item><Space><CloseCircleOutlined style={{ color: '#ff4d4f' }} /><Text>{item}</Text></Space></List.Item>
          )} />
        </Card>
        <Card title={<Space><SwapOutlined style={{ color: '#1890ff' }} /><Text strong>主题对比</Text></Space>} type="inner">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {result.commonTopics.length > 0 && (
              <div>
                <Tag color="green" style={{ marginBottom: 8 }}>共同议题</Tag>
                <div>{result.commonTopics.map((t, i) => <Tag key={i} color="geekblue" style={{ marginBottom: 4 }}>{t}</Tag>)}</div>
              </div>
            )}
            <Divider style={{ margin: '8px 0' }} />
            {result.uniqueTopics1.length > 0 && (
              <div>
                <Tag color="blue" style={{ marginBottom: 8 }}>{m1?.title} 独有</Tag>
                <div>{result.uniqueTopics1.map((t, i) => <Tag key={i} color="blue" style={{ marginBottom: 4 }}>{t}</Tag>)}</div>
              </div>
            )}
            <Divider style={{ margin: '8px 0' }} />
            {result.uniqueTopics2.length > 0 && (
              <div>
                <Tag color="purple" style={{ marginBottom: 8 }}>{m2?.title} 独有</Tag>
                <div>{result.uniqueTopics2.map((t, i) => <Tag key={i} color="purple" style={{ marginBottom: 4 }}>{t}</Tag>)}</div>
              </div>
            )}
          </Space>
        </Card>
      </Space>
    )
  }

  return (
    <>
      <div className="page-header">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>知识检索</Title>
        </div>
      </div>
      <div className="page-body">
        <Card>
          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab="Q&A" key="qa">
              <div style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
                <div ref={chatContainerRef} style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 0',
                  marginBottom: 16,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  backgroundColor: '#fafafa'
                }}>
                  <List dataSource={chatMessages} renderItem={(msg) => (
                    <List.Item style={{ border: 'none', padding: '8px 16px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}>
                        <Space style={{
                          maxWidth: '70%',
                          flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                        }}>
                          <Avatar
                            icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                            style={{ backgroundColor: msg.role === 'user' ? '#1890ff' : '#52c41a' }}
                          />
                          <Card size="small" style={{
                            backgroundColor: msg.role === 'user' ? '#e6f7ff' : '#fff',
                            borderColor: msg.role === 'user' ? '#91d5ff' : '#d9d9d9',
                            borderRadius: 8
                          }}>
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                          </Card>
                        </Space>
                      </div>
                    </List.Item>
                  )} />
                  {chatLoading && (
                    <div style={{ padding: '8px 16px' }}>
                      <Space>
                        <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
                        <Text type="secondary">正在思考...</Text>
                      </Space>
                    </div>
                  )}
                </div>
                <Space.Compact style={{ width: '100%' }}>
                  <TextArea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                    placeholder="输入您的问题..."
                    rows={2}
                    style={{ resize: 'none' }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    loading={chatLoading}
                    disabled={!chatInput.trim()}
                    style={{ height: '100%' }}
                  >发送</Button>
                </Space.Compact>
              </div>
            </TabPane>
            <TabPane tab="搜索" key="search">
              <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                <Input
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="输入关键词搜索会议内容..."
                  prefix={<SearchOutlined />}
                  size="large"
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  disabled={!searchKeyword.trim()}
                  size="large"
                >搜索</Button>
              </Space.Compact>
              {!hasSearched ? (
                <Empty description="请输入关键词进行搜索" style={{ padding: '60px 0' }} />
              ) : searchResults.length === 0 ? (
                <Empty description={`未找到与「${searchKeyword}」相关的内容`} style={{ padding: '60px 0' }} />
              ) : (
                <List dataSource={searchResults} renderItem={(item) => (
                  <List.Item key={`${item.meetingId}-${item.segmentId}`}>
                    <Card style={{ width: '100%' }} size="small"
                      title={<Space><Text strong>{item.meetingTitle}</Text><Tag color="blue">{formatTime(item.timestamp)}</Tag></Space>}
                      extra={<Tag color="green">相关度: {Math.round(item.relevance * 100)}%</Tag>}
                    >
                      <Text>{highlightKeyword(item.snippet, searchKeyword)}</Text>
                    </Card>
                  </List.Item>
                )} />
              )}
            </TabPane>
            <TabPane tab="对比" key="compare">
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space align="center" style={{ width: '100%', justifyContent: 'center' }} wrap>
                  <Select
                    style={{ width: 300 }}
                    placeholder="选择会议 A"
                    value={meeting1Id}
                    onChange={setMeeting1Id}
                    showSearch
                    optionFilterProp="children"
                    size="large"
                  >
                    {completedMeetings.map(m => <Option key={m.id} value={m.id}>{m.title}</Option>)}
                  </Select>
                  <SwapOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                  <Select
                    style={{ width: 300 }}
                    placeholder="选择会议 B"
                    value={meeting2Id}
                    onChange={setMeeting2Id}
                    showSearch
                    optionFilterProp="children"
                    size="large"
                  >
                    {completedMeetings.map(m => <Option key={m.id} value={m.id}>{m.title}</Option>)}
                  </Select>
                  <Button
                    type="primary"
                    onClick={handleCompare}
                    disabled={!meeting1Id || !meeting2Id || meeting1Id === meeting2Id}
                    size="large"
                  >开始对比</Button>
                </Space>
                {meeting1Id && meeting2Id && meeting1Id === meeting2Id && (
                  <Text type="danger" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                    请选择两个不同的会议进行对比
                  </Text>
                )}
              </Card>
              {compareResult ? (
                <CompareResultView result={compareResult} />
              ) : (
                <Empty description="请选择两个会议开始对比" style={{ padding: '60px 0' }} />
              )}
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </>
  )
}
