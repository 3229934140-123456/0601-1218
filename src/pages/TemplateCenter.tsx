import { useState, useMemo } from 'react'
import { Card, Button, Select, Modal, Form, Input, Tabs, Radio, Tag, Typography, Space, message, Empty, Checkbox } from 'antd'
import { PlusOutlined, FileTextOutlined, DownloadOutlined, StarOutlined, StarFilled, SendOutlined } from '@ant-design/icons'
import { useMeetingStore } from '@/store'
import type { Template } from '@/types'
import { generateId } from '@/mock/data'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

const CATEGORIES = ['通用', '项目管理', '产品', '技术']
const VARIABLE_HINTS = ['{{会议标题}}', '{{会议时间}}', '{{参会人员}}', '{{会议摘要}}', '{{讨论议题}}', '{{待办事项}}', '{{附件}}']

export default function TemplateCenter() {
  const { meetings, templates, generateMinutesByTemplate, exportMeeting, sendToParticipants } = useMeetingStore()
  const [activeTab, setActiveTab] = useState('templates')
  const [category, setCategory] = useState<string>('All')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [includeSensitive, setIncludeSensitive] = useState(false)
  const [sendModalVisible, setSendModalVisible] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [form] = Form.useForm()

  const filteredTemplates = useMemo(() => {
    if (category === 'All') return templates
    return templates.filter(t => t.category === category)
  }, [templates, category])

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    form.setFieldsValue({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content
    })
    setModalVisible(true)
  }

  const handleSaveTemplate = async () => {
    try {
      const values = await form.validateFields()
      const variables = VARIABLE_HINTS.filter(v => values.content.includes(v))
      
      const newTemplate: Template = {
        id: editingTemplate?.id || generateId(),
        ...values,
        variables,
        isDefault: editingTemplate?.isDefault || false,
        createdAt: editingTemplate?.createdAt || new Date().toISOString()
      }

      const { templates: currentTemplates } = useMeetingStore.getState()
      const updatedTemplates = editingTemplate
        ? currentTemplates.map(t => t.id === editingTemplate.id ? newTemplate : t)
        : [newTemplate, ...currentTemplates]
      
      useMeetingStore.setState({ templates: updatedTemplates })
      message.success(editingTemplate ? '模板更新成功' : '模板创建成功')
      setModalVisible(false)
    } catch {
      message.error('请填写完整信息')
    }
  }

  const handleSetDefault = (templateId: string) => {
    const { templates: currentTemplates } = useMeetingStore.getState()
    const updatedTemplates = currentTemplates.map(t => ({
      ...t,
      isDefault: t.id === templateId
    }))
    useMeetingStore.setState({ templates: updatedTemplates })
    message.success('已设为默认模板')
  }

  const handleGeneratePreview = () => {
    if (!selectedMeetingId || !selectedTemplateId) {
      message.warning('请选择会议和模板')
      return
    }
    const content = generateMinutesByTemplate(selectedMeetingId, selectedTemplateId, includeSensitive)
    setGeneratedContent(content)
  }

  const handleExport = async () => {
    if (!generatedContent || !selectedMeetingId) {
      message.warning('请先生成预览内容')
      return
    }
    setExporting(true)
    try {
      const content = await exportMeeting(selectedMeetingId, 'markdown', selectedTemplateId, includeSensitive)
      const meeting = meetings.find(m => m.id === selectedMeetingId)
      const template = templates.find(t => t.id === selectedTemplateId)
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
    } catch {
      message.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleOpenSendModal = () => {
    if (!selectedMeetingId) {
      message.warning('请先选择会议')
      return
    }
    const meeting = meetings.find(m => m.id === selectedMeetingId)
    if (meeting) {
      setSelectedParticipants([...meeting.participants])
    }
    setSendModalVisible(true)
  }

  const handleSend = async () => {
    if (selectedParticipants.length === 0) {
      message.warning('请至少选择一位参会人')
      return
    }
    setSending(true)
    try {
      const success = await sendToParticipants(selectedMeetingId, selectedParticipants, selectedTemplateId)
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

  const handleInsertVariable = (variable: string) => {
    const content = form.getFieldValue('content') || ''
    form.setFieldsValue({ content: content + variable })
  }

  const renderTemplateCard = (template: Template) => (
    <Card
      key={template.id}
      hoverable
      style={{ marginBottom: 16 }}
      actions={[
        <Button type="link" size="small" onClick={() => handleEditTemplate(template)}>编辑</Button>,
        <Button
          type="link"
          size="small"
          icon={template.isDefault ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
          onClick={() => handleSetDefault(template.id)}
        >
          {template.isDefault ? '默认' : '设为默认'}
        </Button>
      ]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Title level={5} style={{ margin: 0 }}>{template.name}</Title>
        <Space>
          {template.isDefault && <Tag color="gold">默认</Tag>}
          <Tag color="blue">{template.category}</Tag>
        </Space>
      </div>
      <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
        {template.description}
      </Paragraph>
      <Space wrap size={4}>
        {template.variables.slice(0, 4).map(v => (
          <Tag key={v} color="geekblue" style={{ fontSize: '11px' }}>{v}</Tag>
        ))}
        {template.variables.length > 4 && (
          <Tag color="default" style={{ fontSize: '11px' }}>+{template.variables.length - 4}</Tag>
        )}
      </Space>
    </Card>
  )

  return (
    <>
      <div className="page-header">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>模板中心</Title>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateTemplate}
            >
              创建模板
            </Button>
          </Space>
        </div>
      </div>

      <div className="page-body" style={{ height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ height: '100%' }}>
          <TabPane tab="模板管理" key="templates">
            <div style={{ marginBottom: 16 }}>
              <Radio.Group value={category} onChange={e => setCategory(e.target.value)}>
                <Radio.Button value="All">全部</Radio.Button>
                {CATEGORIES.map(cat => (
                  <Radio.Button key={cat} value={cat}>{cat}</Radio.Button>
                ))}
              </Radio.Group>
            </div>

            {filteredTemplates.length === 0 ? (
              <Empty description="暂无模板" style={{ marginTop: 80 }} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, overflow: 'auto', maxHeight: 'calc(100vh - 220px)', paddingRight: 8 }}>
                {filteredTemplates.map(renderTemplateCard)}
              </div>
            )}
          </TabPane>

          <TabPane tab="生成纪要" key="generate">
            <div style={{ display: 'flex', height: 'calc(100vh - 200px)', gap: 16 }}>
              <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card title="选择配置" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>选择会议</Text>
                      <Select
                        placeholder="请选择会议"
                        style={{ width: '100%' }}
                        value={selectedMeetingId || undefined}
                        onChange={setSelectedMeetingId}
                      >
                        {meetings.map(m => (
                          <Option key={m.id} value={m.id}>{m.title}</Option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>选择模板</Text>
                      <Select
                        placeholder="请选择模板"
                        style={{ width: '100%' }}
                        value={selectedTemplateId || undefined}
                        onChange={setSelectedTemplateId}
                      >
                        {templates.map(t => (
                          <Option key={t.id} value={t.id}>
                            {t.name} {t.isDefault && '(默认)'}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      onClick={handleGeneratePreview}
                      block
                    >
                      生成预览
                    </Button>
                  </Space>
                </Card>

                {selectedTemplateId && (
                  <Card title="模板信息" size="small">
                    {(() => {
                      const t = templates.find(t => t.id === selectedTemplateId)
                      if (!t) return null
                      return (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <Text strong>{t.name}</Text>
                            {t.isDefault && <Tag color="gold" style={{ marginLeft: 8 }}>默认</Tag>}
                          </div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>{t.description}</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>变量：</Text>
                            <Space wrap size={4}>
                              {t.variables.map(v => (
                                <Tag key={v} color="geekblue" style={{ fontSize: '11px' }}>{v}</Tag>
                              ))}
                            </Space>
                          </div>
                        </Space>
                      )
                    })()}
                  </Card>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Card
                  title="预览"
                  size="small"
                  extra={
                    <Space>
                      <Checkbox
                        checked={includeSensitive}
                        onChange={e => setIncludeSensitive(e.target.checked)}
                        style={{ marginBottom: 0 }}
                      >
                        包含敏感内容
                      </Checkbox>
                      <Button
                        icon={<SendOutlined />}
                        onClick={handleOpenSendModal}
                        disabled={!generatedContent}
                      >
                        发送参会人
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={handleExport}
                        disabled={!generatedContent}
                        loading={exporting}
                      >
                        导出 Markdown
                      </Button>
                    </Space>
                  }
                  style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  {!generatedContent ? (
                    <Empty description="请选择会议和模板，点击生成预览" style={{ marginTop: 80 }} />
                  ) : (
                    <pre
                      style={{
                        flex: 1,
                        padding: 16,
                        backgroundColor: '#fafafa',
                        borderRadius: 8,
                        border: '1px solid #e8e8e8',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflow: 'auto',
                        margin: 0
                      }}
                    >
                      {generatedContent}
                    </pre>
                  )}
                </Card>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </div>

      <Modal
        title={editingTemplate ? '编辑模板' : '创建模板'}
        open={modalVisible}
        onOk={handleSaveTemplate}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <Form.Item
              name="name"
              label="模板名称"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input placeholder="请输入模板名称" />
            </Form.Item>
            <Form.Item
              name="category"
              label="分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select placeholder="请选择分类">
                {CATEGORIES.map(cat => (
                  <Option key={cat} value={cat}>{cat}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="description"
            label="模板描述"
            rules={[{ required: true, message: '请输入模板描述' }]}
          >
            <Input placeholder="请输入模板描述" />
          </Form.Item>
          <Form.Item
            name="content"
            label="模板内容"
            rules={[{ required: true, message: '请输入模板内容' }]}
          >
            <TextArea
              rows={10}
              placeholder="请输入模板内容，使用 {{变量名}} 作为占位符"
            />
          </Form.Item>
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
              快速插入变量：
            </Text>
            <Space wrap>
              {VARIABLE_HINTS.map(v => (
                <Tag
                  key={v}
                  color="geekblue"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleInsertVariable(v)}
                >
                  {v}
                </Tag>
              ))}
            </Space>
          </div>
        </Form>
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
            const meeting = meetings.find(m => m.id === selectedMeetingId)
            const template = templates.find(t => t.id === selectedTemplateId)
            return (
              <div style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                <div><Text type="secondary">标题：</Text>{meeting?.title}</div>
                <div><Text type="secondary">模板：</Text>{template?.name || '通用'}</div>
                <div><Text type="secondary">摘要：</Text>{meeting?.summary || '无'}</div>
              </div>
            )
          })()}
        </div>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            选择参会人
          </Text>
          {(() => {
            const meeting = meetings.find(m => m.id === selectedMeetingId)
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
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#e6f7ff', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 将发送：会议标题、摘要、以及基于模板生成的纪要文档
          </Text>
        </div>
      </Modal>
    </>
  )
}
