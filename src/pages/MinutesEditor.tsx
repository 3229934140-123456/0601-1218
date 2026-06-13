import { useState } from 'react'
import { List, Button, Input, Space, Typography, Tag, Checkbox, Empty, message, Modal, Divider } from 'antd'
import { HighlightOutlined, SafetyOutlined, EditOutlined, CheckOutlined, CloseOutlined, MergeOutlined, FileTextOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons'
import { useMeetingStore } from '@/store'
import { formatTime } from '@/mock/data'
import type { TranscriptSegment } from '@/types'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function MinutesEditor() {
  const { meetings, currentMeetingId, setCurrentMeeting, toggleSegmentHighlight, toggleSegmentSensitive, updateSegment, mergeTopics, generateSummary, getSpeakers } = useMeetingStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
  const [mergeModalVisible, setMergeModalVisible] = useState(false)
  const [mergeTitle, setMergeTitle] = useState('')
  const [generating, setGenerating] = useState(false)

  const currentMeeting = meetings.find(m => m.id === currentMeetingId)
  const speakers = getSpeakers()

  const getSpeaker = (speakerId: string) => {
    return speakers.find(s => s.id === speakerId) || { name: '未知', color: '#999' }
  }

  const handleEditClick = (segment: TranscriptSegment) => {
    setEditingId(segment.id)
    setEditContent(segment.content)
  }

  const handleSaveEdit = () => {
    if (!currentMeetingId || !editingId) return
    updateSegment(currentMeetingId, editingId, { content: editContent })
    setEditingId(null)
    message.success('内容已更新')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleTopicSelect = (topicId: string, checked: boolean) => {
    if (checked) {
      setSelectedTopicIds(prev => [...prev, topicId])
    } else {
      setSelectedTopicIds(prev => prev.filter(id => id !== topicId))
    }
  }

  const handleMergeTopics = async () => {
    if (!currentMeetingId || selectedTopicIds.length < 2) {
      message.warning('请至少选择两个主题进行合并')
      return
    }
    if (!mergeTitle.trim()) {
      message.warning('请输入新主题标题')
      return
    }
    mergeTopics(currentMeetingId, selectedTopicIds, mergeTitle.trim())
    setMergeModalVisible(false)
    setSelectedTopicIds([])
    setMergeTitle('')
    message.success('主题合并成功')
  }

  const handleGenerateSummary = async () => {
    if (!currentMeetingId) return
    setGenerating(true)
    try {
      await generateSummary(currentMeetingId)
      message.success('摘要生成成功')
    } catch {
      message.error('摘要生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const getSegmentBg = (segment: TranscriptSegment) => {
    if (segment.isSensitive) return '#fff1f0'
    if (segment.isHighlight) return '#fffbe6'
    return '#fff'
  }

  return (
    <>
      <div className="page-header">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>会议纪要编辑</Title>
          <Space>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={handleGenerateSummary}
              loading={generating}
              disabled={!currentMeeting}
            >
              生成摘要
            </Button>
          </Space>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: '16px' }}>
        <div style={{ width: '280px', flexShrink: 0, overflow: 'auto' }}>
          <Title level={5} style={{ marginBottom: 16 }}>会议列表</Title>
          <List
            dataSource={meetings}
            renderItem={(meeting) => (
              <List.Item
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  backgroundColor: currentMeetingId === meeting.id ? '#e6f7ff' : '#fff',
                  border: currentMeetingId === meeting.id ? '1px solid #1890ff' : '1px solid #e8e8e8'
                }}
                onClick={() => setCurrentMeeting(meeting.id)}
              >
                <List.Item.Meta
                  title={<Text strong>{meeting.title}</Text>}
                  description={
                    <Space direction="vertical" size={4}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        {new Date(meeting.date).toLocaleDateString('zh-CN')}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <UserOutlined style={{ marginRight: 4 }} />
                        {meeting.participants.length}人参会
                      </Text>
                      <Tag color={meeting.status === 'completed' ? 'green' : meeting.status === 'processing' ? 'blue' : 'red'} style={{ margin: 0 }}>
                        {meeting.status === 'completed' ? '已完成' : meeting.status === 'processing' ? '处理中' : '错误'}
                      </Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!currentMeeting ? (
            <Empty description="请选择一个会议进行编辑" style={{ marginTop: 80 }} />
          ) : (
            <>
              <div style={{ paddingBottom: 16, borderBottom: '1px solid #e8e8e8', marginBottom: 16 }}>
                <Title level={5} style={{ margin: '0 0 8px' }}>{currentMeeting.title}</Title>
                {currentMeeting.summary && (
                  <Paragraph type="secondary" style={{ margin: 0 }}>
                    <Text strong>摘要：</Text>{currentMeeting.summary}
                  </Paragraph>
                )}
              </div>

              <div style={{ flex: 1, overflow: 'auto' }}>
                {currentMeeting.transcript.length === 0 ? (
                  <Empty description="暂无转写内容" style={{ marginTop: 60 }} />
                ) : (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {currentMeeting.transcript.map((segment) => {
                      const speaker = getSpeaker(segment.speakerId)
                      return (
                        <div
                          key={segment.id}
                          style={{
                            padding: '16px',
                            borderRadius: '8px',
                            backgroundColor: getSegmentBg(segment),
                            border: '1px solid #e8e8e8'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <Space>
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: speaker.color
                                }}
                              />
                              <Text strong>{speaker.name}</Text>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                              </Text>
                              {segment.isHighlight && <Tag color="gold">高亮</Tag>}
                              {segment.isSensitive && <Tag color="red">敏感</Tag>}
                            </Space>
                            <Space size={4}>
                              <Button
                                type={segment.isHighlight ? 'primary' : 'default'}
                                size="small"
                                icon={<HighlightOutlined />}
                                onClick={() => currentMeetingId && toggleSegmentHighlight(currentMeetingId, segment.id)}
                              />
                              <Button
                                type={segment.isSensitive ? 'primary' : 'default'}
                                danger={segment.isSensitive}
                                size="small"
                                icon={<SafetyOutlined />}
                                onClick={() => currentMeetingId && toggleSegmentSensitive(currentMeetingId, segment.id)}
                              />
                              {editingId === segment.id ? (
                                <>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<CheckOutlined />}
                                    onClick={handleSaveEdit}
                                  />
                                  <Button
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={handleCancelEdit}
                                  />
                                </>
                              ) : (
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => handleEditClick(segment)}
                                />
                              )}
                            </Space>
                          </div>
                          {editingId === segment.id ? (
                            <TextArea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              autoSize={{ minRows: 2, maxRows: 6 }}
                            />
                          ) : (
                            <Text>{segment.content}</Text>
                          )}
                        </div>
                      )
                    })}
                  </Space>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ width: '280px', flexShrink: 0, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>主题列表</Title>
            <Button
              type="primary"
              size="small"
              icon={<MergeOutlined />}
              onClick={() => setMergeModalVisible(true)}
              disabled={!currentMeeting || selectedTopicIds.length < 2}
            >
              合并
            </Button>
          </div>
          {!currentMeeting || currentMeeting.topics.length === 0 ? (
            <Empty description="暂无主题" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {currentMeeting.topics.map((topic) => (
                <div
                  key={topic.id}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: selectedTopicIds.includes(topic.id) ? '#e6f7ff' : '#fff',
                    border: selectedTopicIds.includes(topic.id) ? '1px solid #1890ff' : '1px solid #e8e8e8'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Checkbox
                      checked={selectedTopicIds.includes(topic.id)}
                      onChange={(e) => handleTopicSelect(topic.id, e.target.checked)}
                    />
                    <Text strong>{topic.title}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginLeft: '24px' }}>
                    {topic.description}
                  </Text>
                  <div style={{ marginLeft: '24px', marginTop: '8px' }}>
                    <Tag color="blue" style={{ fontSize: '11px' }}>
                      {formatTime(topic.startTime)} - {formatTime(topic.endTime)}
                    </Tag>
                    <Tag color="green" style={{ fontSize: '11px' }}>
                      {topic.segmentIds.length} 条记录
                    </Tag>
                  </div>
                </div>
              ))}
            </Space>
          )}
        </div>
      </div>

      <Modal
        title="合并主题"
        open={mergeModalVisible}
        onOk={handleMergeTopics}
        onCancel={() => { setMergeModalVisible(false); setMergeTitle('') }}
        okText="合并"
        cancelText="取消"
      >
        <p style={{ marginBottom: '12px' }}>已选择 <Text strong>{selectedTopicIds.length}</Text> 个主题进行合并</p>
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>新主题标题</Text>
          <Input
            value={mergeTitle}
            onChange={(e) => setMergeTitle(e.target.value)}
            placeholder="请输入合并后的主题标题"
          />
        </div>
        <div>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>选中的主题</Text>
          {currentMeeting?.topics.filter(t => selectedTopicIds.includes(t.id)).map(t => (
            <Tag key={t.id} color="blue" style={{ marginBottom: '4px' }}>{t.title}</Tag>
          ))}
        </div>
      </Modal>
    </>
  )
}
