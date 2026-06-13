import { useState, useMemo } from 'react'
import {
  Select,
  DatePicker,
  Tag,
  Button,
  Tabs,
  Modal,
  Form,
  Input,
  Card,
  Space,
  Typography,
  Empty,
  message,
  Row,
  Col
} from 'antd'
import {
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { useMeetingStore } from '@/store'
import type { Task } from '@/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

export default function TaskExtraction() {
  const { meetings, extractTasks, addTask, updateTask, deleteTask, getSpeakers } = useMeetingStore()
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [extractLoading, setExtractLoading] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  const speakers = getSpeakers()
  const assigneeOptions = speakers.map(s => ({ label: s.name, value: s.name }))

  const selectedMeeting = useMemo(() =>
    meetings.find(m => m.id === selectedMeetingId),
    [meetings, selectedMeetingId]
  )

  const filteredTasks = useMemo(() => {
    const tasks = selectedMeeting?.tasks || []
    switch (activeTab) {
      case 'pending':
        return tasks.filter(t => t.status === 'pending')
      case 'in-progress':
        return tasks.filter(t => t.status === 'in-progress')
      case 'completed':
        return tasks.filter(t => t.status === 'completed')
      default:
        return tasks
    }
  }, [selectedMeeting, activeTab])

  const handleExtractTasks = async () => {
    if (!selectedMeetingId) {
      message.warning('请先选择会议')
      return
    }
    setExtractLoading(true)
    try {
      await extractTasks(selectedMeetingId)
      message.success('任务提取成功！')
    } catch (e) {
      message.error('任务提取失败')
    } finally {
      setExtractLoading(false)
    }
  }

  const handleAddTask = () => {
    form.validateFields().then(values => {
      if (!selectedMeetingId) {
        message.warning('请先选择会议')
        return
      }
      addTask(selectedMeetingId, {
        ...values,
        deadline: values.deadline?.format('YYYY-MM-DD') || ''
      })
      message.success('任务添加成功！')
      setAddModalVisible(false)
      form.resetFields()
    })
  }

  const handleEditTask = () => {
    editForm.validateFields().then(values => {
      if (!selectedMeetingId || !editingTask) return
      updateTask(selectedMeetingId, editingTask.id, {
        ...values,
        deadline: values.deadline?.format('YYYY-MM-DD') || editingTask.deadline
      })
      message.success('任务更新成功！')
      setEditModalVisible(false)
      setEditingTask(null)
    })
  }

  const handleDeleteTask = (taskId: string) => {
    if (!selectedMeetingId) return
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      onOk: () => {
        deleteTask(selectedMeetingId, taskId)
        message.success('任务已删除')
      }
    })
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    editForm.setFieldsValue({
      ...task,
      deadline: task.deadline ? dayjs(task.deadline) : null
    })
    setEditModalVisible(true)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'green'
      default: return 'default'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高优先级'
      case 'medium': return '中优先级'
      case 'low': return '低优先级'
      default: return priority
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default'
      case 'in-progress': return 'blue'
      case 'completed': return 'green'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待处理'
      case 'in-progress': return '进行中'
      case 'completed': return '已完成'
      default: return status
    }
  }

  return (
    <>
      <div className="page-header">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>任务提取</Title>
          <Space>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              loading={extractLoading}
              onClick={handleExtractTasks}
              disabled={!selectedMeetingId}
            >
              提取任务
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
              disabled={!selectedMeetingId}
            >
              新建任务
            </Button>
          </Space>
        </div>
      </div>

      <div className="page-body">
        <Card style={{ marginBottom: 16 }}>
          <Space style={{ width: '100%' }} direction="vertical" size="large">
            <Space style={{ width: '100%' }}>
              <Text strong>选择会议：</Text>
              <Select
                style={{ width: 400 }}
                placeholder="请选择要提取任务的会议"
                value={selectedMeetingId}
                onChange={setSelectedMeetingId}
                showSearch
                optionFilterProp="children"
              >
                {meetings.map(m => (
                  <Option key={m.id} value={m.id}>{m.title}</Option>
                ))}
              </Select>
              {selectedMeeting && (
                <Text type="secondary">
                  任务总数：{selectedMeeting.tasks.length}
                </Text>
              )}
            </Space>
          </Space>
        </Card>

        {selectedMeeting ? (
          <>
            <Card>
              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="全部" key="all" />
                <TabPane tab="待处理" key="pending" />
                <TabPane tab="进行中" key="in-progress" />
                <TabPane tab="已完成" key="completed" />
              </Tabs>

              {filteredTasks.length === 0 ? (
                <Empty description="暂无任务" style={{ padding: '40px 0' }} />
              ) : (
                <Row gutter={[16, 16]}>
                  {filteredTasks.map(task => (
                    <Col xs={24} md={12} lg={8} key={task.id}>
                      <Card
                        size="small"
                        title={
                          <Space>
                            <Text strong>{task.title}</Text>
                            <Tag color={getPriorityColor(task.priority)}>
                              {getPriorityText(task.priority)}
                            </Tag>
                          </Space>
                        }
                        extra={
                          <Space>
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              size="small"
                              onClick={() => openEditModal(task)}
                            />
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              size="small"
                              onClick={() => handleDeleteTask(task.id)}
                            />
                          </Space>
                        }
                      >
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <Text type="secondary" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {task.description || '暂无描述'}
                          </Text>
                          <Space>
                            <UserOutlined />
                            <Select
                              size="small"
                              style={{ width: 120 }}
                              value={task.assignee}
                              onChange={(value) => updateTask(selectedMeetingId!, task.id, { assignee: value })}
                              options={assigneeOptions}
                            />
                          </Space>
                          <Space>
                            <CalendarOutlined />
                            <DatePicker
                              size="small"
                              value={task.deadline ? dayjs(task.deadline) : null}
                              onChange={(date) => updateTask(selectedMeetingId!, task.id, { deadline: date?.format('YYYY-MM-DD') || '' })}
                              placeholder="选择截止日期"
                            />
                          </Space>
                          <Tag color={getStatusColor(task.status)}>
                            {getStatusText(task.status)}
                          </Tag>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </>
        ) : (
          <Empty description="请先选择一个会议" style={{ marginTop: 60 }} />
        )}
      </div>

      <Modal
        title="新建任务"
        open={addModalVisible}
        onOk={handleAddTask}
        onCancel={() => { setAddModalVisible(false); form.resetFields() }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <Form.Item name="assignee" label="负责人" rules={[{ required: true, message: '请选择负责人' }]}>
            <Select placeholder="请选择负责人" options={assigneeOptions} />
          </Form.Item>
          <Form.Item name="deadline" label="截止日期">
            <DatePicker style={{ width: '100%' }} placeholder="选择截止日期" />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="medium">
            <Select>
              <Option value="high">高优先级</Option>
              <Option value="medium">中优先级</Option>
              <Option value="low">低优先级</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="pending">
            <Select>
              <Option value="pending">待处理</Option>
              <Option value="in-progress">进行中</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑任务"
        open={editModalVisible}
        onOk={handleEditTask}
        onCancel={() => { setEditModalVisible(false); setEditingTask(null) }}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <Form.Item name="assignee" label="负责人" rules={[{ required: true, message: '请选择负责人' }]}>
            <Select placeholder="请选择负责人" options={assigneeOptions} />
          </Form.Item>
          <Form.Item name="deadline" label="截止日期">
            <DatePicker style={{ width: '100%' }} placeholder="选择截止日期" />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select>
              <Option value="high">高优先级</Option>
              <Option value="medium">中优先级</Option>
              <Option value="low">低优先级</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="pending">待处理</Option>
              <Option value="in-progress">进行中</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
