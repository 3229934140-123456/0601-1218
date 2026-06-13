import { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { List, Button, Input, Space, Typography, Tag, Checkbox, Empty, message, Modal, Divider, Select } from 'antd'
import { HighlightOutlined, SafetyOutlined, EditOutlined, CheckOutlined, CloseOutlined, MergeOutlined, FileTextOutlined, CalendarOutlined, UserOutlined, DownloadOutlined, SendOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import { useMeetingStore } from '@/store'
import { formatTime } from '@/mock/data'
import type { TranscriptSegment } from '@/types'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function MinutesEditor() {
  const location = useLocation()
  const { meetings, currentMeetingId, setCurrentMeeting, toggleSegmentHighlight, toggleSegmentSensitive, updateSegment, mergeTopics, generateSummary, getSpeakers, exportMeeting, sendToParticipants, templates } = useMeetingStore()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const meetingId = params.get('meetingId')
    if (meetingId && !currentMeetingId) {
      setCurrentMeeting(meetingId)
    } else if (!currentMeetingId && meetings.length > 0) {
      setCurrentMeeting(meetings[0].id)
    }
  }, [location, currentMeetingId, meetings, setCurrentMeeting])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
  const [mergeModalVisible, setMergeModalVisible] = useState(false)
  const [mergeTitle, setMergeTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showSensitive, setShowSensitive] = useState(false)
  const [collapsedSensitiveIds, setCollapsedSensitiveIds] = useState<Set<string>>(new Set())
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [exportTemplateId, setExportTemplateId] = useState<string>('')
  const [exportIncludeSensitive, setExportIncludeSensitive] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [sendModalVisible, setSendModalVisible] = useState(false)
  const [sendTemplateId, setSendTemplateId] = useState<string>('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [sending, setSending] = useState(false)

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

  const maskSensitiveContent = (text: string) => {
    return text.replace(/[\u4e00-\u9fa5a-zA-Z0-9]/g, '*')
  }

  const toggleSensitiveCollapse = (segmentId: string) => {
    setCollapsedSensitiveIds(prev => {
      const next = new Set(prev)
      if (next.has(segmentId)) {
        next.delete(segmentId)
      } else {
        next.add(segmentId)
      }
      return next
    })
  }

  const handleOpenExportModal = () => {
    if (!currentMeetingId) return
    const defaultTemplate = templates.find(t => t.isDefault)
    setExportTemplateId(defaultTemplate?.id || '')
    setExportIncludeSensitive(false)
    setExportModalVisible(true)
  }

  const handleExport = async () => {
    if (!currentMeetingId) return
    setExporting(true)
    try {
      const content = await exportMeeting(currentMeetingId, 'markdown', exportTemplateId || undefined, exportIncludeSensitive)
      const meeting = meetings.find(m => m.id === currentMeetingId)
      const template = templates.find(t => t.id === exportTemplateId)
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
      const tplName = template ? `_${template.name}` : ''
      a.download = `${meeting?.title || '会议纪要'}${tplName}_${dateStr}.md`
      a.click()
      URL.revokeObjectURL(url)
      message.success('导出成功')
      setExportModalVisible(false)
    } catch {
      message.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleOpenSendModal = () => {
    if (!currentMeetingId) return
    const meeting = meetings.find(m => m.id === currentMeetingId)
    const defaultTemplate = templates.find(t => t.isDefault)
    setSendTemplateId(defaultTemplate?.id || '')
    if (meeting) {
      setSelectedParticipants([...meeting.participants])
    }
    setSendModalVisible(true)
  }

  const handleSend = async () => {
    if (!currentMeetingId || selectedParticipants.length === 0) {
      message.warning('请至少选择一位参会人')
      return
    }
    setSending(true)
    try {
      const success = await sendToParticipants(currentMeetingId, selectedParticipants, sendTemplateId || undefined)
      if (success) {
        message.success(`已发送给 ${selectedParticipants.length} 位参会人`)
        setSendModalVisible(false)
      } else {
        message.error('发送失败')
      }
    } catch {
      message.error('发送失败')
    } finally {
      setSending(false)
    }
  }

  const displayContent = useMemo(() => {
    if (showSensitive) return null
    const count = currentMeeting?.transcript.filter(s => s.isSensitive).length || 0
    return count > 0 ? `已隐藏 ${count} 条敏感内容` : null
  }, [showSensitive, currentMeeting])

  return (
    <>
      <div className="page-header">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>会议纪要编辑</Title>
          <Space>
            <Button
              icon={showSensitive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={() => setShowSensitive(!showSensitive)}
              disabled={!currentMeeting}
            >
              {showSensitive ? '显示敏感' : '隐藏敏感'}
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={handleGenerateSummary}
              loading={generating}
              disabled={!currentMeeting}
            >
              生成摘要
            </Button>
            <Button
              icon={<SendOutlined />}
              onClick={handleOpenSendModal}
              disabled={!currentMeeting}
            >
              发送参会人
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleOpenExportModal}
              disabled={!currentMeeting}
            >
              导出文档
            </Button>
          </Space>
        </div>
        {displayContent && (
          <div style={{ marginTop: 8, padding: '8px 12px', backgroundColor: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
            <Text type="warning" style={{ fontSize: '12px' }}>
              🔒 {displayContent}，点击"显示敏感"可查看原文（编辑时可见）
            </Text>
          </div>
        )}
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
                      const isSensitive = segment.isSensitive
                      const shouldMask = isSensitive && !showSensitive
                      const isCollapsed = isSensitive && collapsedSensitiveIds.has(segment.id) && !showSensitive
                      
                      if (shouldMask && isCollapsed) {
                        return (
                          <div
                            key={segment.id}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              backgroundColor: '#fff1f0',
                              border: '1px dashed #ffa39e',
                              cursor: 'pointer'
                            }}
                            onClick={() => toggleSensitiveCollapse(segment.id)}
                          >
                            <Space>
                              <EyeInvisibleOutlined style={{ color: '#ff4d4f' }} />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                              </Text>
                              <Tag color="red">敏感内容已折叠</Tag>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                点击展开查看打码内容
                              </Text>
                            </Space>
                          </div>
                        )
                      }
                      
                      return (
                        <div
                          key={segment.id}
                          style={{
                            padding: '16px',
                            borderRadius: '8px',
                            backgroundColor: getSegmentBg(segment),
                            border: isSensitive ? '1px solid #ffa39e' : '1px solid #e8e8e8'
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
                              {shouldMask && (
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EyeInvisibleOutlined />}
                                  onClick={(e) => { e.stopPropagation(); toggleSensitiveCollapse(segment.id) }}
                                  style={{ padding: 0, height: 'auto' }}
                                >
                                  <Text type="secondary" style={{ fontSize: '12px' }}>折叠</Text>
                                </Button>
                              )}
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
                            <Text style={{ 
                              color: shouldMask ? '#d9d9d9' : undefined,
                              fontFamily: shouldMask ? 'monospace' : undefined,
                              letterSpacing: shouldMask ? '2px' : undefined
                            }}>
                              {shouldMask ? maskSensitiveContent(segment.content) : segment.content}
                            </Text>
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

      <Modal
        title="导出会议纪要"
        open={exportModalVisible}
        onOk={handleExport}
        onCancel={() => setExportModalVisible(false)}
        okText="导出"
        cancelText="取消"
        confirmLoading={exporting}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            选择导出模板
          </Text>
          <Select
            placeholder="选择模板（不选则使用通用格式）"
            style={{ width: '100%' }}
            value={exportTemplateId || undefined}
            onChange={setExportTemplateId}
            allowClear
          >
            {templates.map(t => (
              <Select.Option key={t.id} value={t.id}>
                {t.name} {t.isDefault && '(默认)'}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Checkbox
            checked={exportIncludeSensitive}
            onChange={e => setExportIncludeSensitive(e.target.checked)}
          >
            包含敏感内容（默认不导出敏感内容）
          </Checkbox>
        </div>
        <div style={{ padding: 12, backgroundColor: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 导出格式：Markdown (.md)，可直接用 Typora、VS Code 等工具打开
          </Text>
        </div>
      </Modal>

      <Modal
        title="发送给参会人"
        open={sendModalVisible}
        onOk={handleSend}
        onCancel={() => setSendModalVisible(false)}
        okText="发送"
        cancelText="取消"
        confirmLoading={sending}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            会议信息
          </Text>
          {(() => {
            const meeting = meetings.find(m => m.id === currentMeetingId)
            const template = templates.find(t => t.id === sendTemplateId)
            return (
              <div style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                <div><Text type="secondary">标题：</Text>{meeting?.title}</div>
                <div><Text type="secondary">模板：</Text>{template?.name || '通用'}</div>
                <div><Text type="secondary">摘要：</Text>{meeting?.summary || '无'}</div>
              </div>
            )
          })()}
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            选择纪要模板
          </Text>
          <Select
            placeholder="选择模板（不选则使用通用格式）"
            style={{ width: '100%' }}
            value={sendTemplateId || undefined}
            onChange={setSendTemplateId}
            allowClear
          >
            {templates.map(t => (
              <Select.Option key={t.id} value={t.id}>
                {t.name} {t.isDefault && '(默认)'}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            选择参会人
          </Text>
          {(() => {
            const meeting = meetings.find(m => m.id === currentMeetingId)
            const allParticipants = Array.from(new Set([
              ...(meeting?.participants || []),
              '张三', '李四', '王五', '赵六', '钱七', '孙八'
            ]))
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allParticipants.map(p => (
                  <Checkbox
                    key={p}
                    checked={selectedParticipants.includes(p)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedParticipants(prev => [...prev, p])
                      } else {
                        setSelectedParticipants(prev => prev.filter(x => x !== p))
                      }
                    }}
                  >
                    {p}
                  </Checkbox>
                ))}
              </div>
            )
          })()}
        </div>
        <div style={{ padding: 12, backgroundColor: '#e6f7ff', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 将发送：会议标题、摘要、以及基于模板生成的纪要文档（自动过滤敏感内容）
          </Text>
        </div>
      </Modal>
    </>
  )
}
