import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, List, Progress, Tag, message, Space, Typography, Empty } from 'antd'
import { UploadOutlined, AudioOutlined, ClockCircleOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useMeetingStore } from '@/store'
import { formatDuration, generateId } from '@/mock/data'

const { Title, Text } = Typography

interface UploadItem {
  id: string
  name: string
  size: number
  status: 'uploading' | 'transcribing' | 'processing' | 'completed' | 'error'
  progress: number
}

export default function AudioImport() {
  const navigate = useNavigate()
  const location = useLocation()
  const [uploadingItems, setUploadingItems] = useState<UploadItem[]>([])
  const { meetings, addMeeting, updateProcessingStatus, setCurrentMeeting } = useMeetingStore()
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const meetingId = params.get('meetingId')
    if (meetingId) {
      setCurrentMeeting(meetingId)
      navigate('/editor', { replace: true })
    }
  }, [location, navigate, setCurrentMeeting])

  const handleFileUpload = (file: File) => {
    const newItem: UploadItem = {
      id: generateId(),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0
    }
    setUploadingItems(prev => [newItem, ...prev])
    simulateProcessing(newItem.id, file)
  }

  const simulateProcessing = async (id: string, file: File) => {
    const steps = [
      { status: 'uploading', duration: 200 },
      { status: 'transcribing', duration: 500 },
      { status: 'processing', duration: 300 }
    ]

    for (const step of steps) {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, step.duration))
        setUploadingItems(prev => prev.map(item =>
          item.id === id ? { ...item, progress: i, status: step.status as any } : item
        ))
      }
    }

    const meetingId = generateId()
    addMeeting({
      title: file.name.replace(/\.[^/.]+$/, ''),
      duration: 3600,
      participants: ['张三', '李四', '王五'],
      audioFile: file.name,
      status: 'completed',
      progress: 100,
      summary: '本次会议讨论了项目进度和后续计划。',
      transcript: [
        { id: generateId(), speakerId: 's1', startTime: 0, endTime: 60, content: '大家好，今天我们讨论一下项目进度。', isHighlight: false, isSensitive: false },
        { id: generateId(), speakerId: 's2', startTime: 60, endTime: 150, content: '项目目前进展顺利，预计下周可以完成第一阶段。', isHighlight: true, isSensitive: false },
        { id: generateId(), speakerId: 's3', startTime: 150, endTime: 240, content: '需要注意接口联调的时间节点。', isHighlight: false, isSensitive: false }
      ],
      topics: [
        { id: generateId(), title: '项目进度汇报', description: '讨论当前项目进展情况', startTime: 0, endTime: 240, segmentIds: [] }
      ]
    })

    updateProcessingStatus({
      id: generateId(),
      meetingId,
      meetingTitle: file.name.replace(/\.[^/.]+$/, ''),
      step: 'completed',
      progress: 100,
      message: '处理完成',
      startTime: new Date().toISOString()
    })

    setUploadingItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'completed', progress: 100 } : item
    ))

    message.success('音频处理完成！')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'))
    if (files.length === 0) {
      message.error('请上传音频文件！')
      return
    }
    files.forEach(file => handleFileUpload(file))
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => handleFileUpload(file))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getStatusColor = (status: UploadItem['status']) => {
    switch (status) {
      case 'uploading': return 'blue'
      case 'transcribing': return 'cyan'
      case 'processing': return 'orange'
      case 'completed': return 'green'
      case 'error': return 'red'
      default: return 'default'
    }
  }

  const getStatusText = (status: UploadItem['status']) => {
    switch (status) {
      case 'uploading': return '上传中'
      case 'transcribing': return '转写中'
      case 'processing': return '处理中'
      case 'completed': return '已完成'
      case 'error': return '失败'
      default: return '未知'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleViewMeeting = (meetingId: string) => {
    setCurrentMeeting(meetingId)
    navigate('/editor')
  }

  return (
    <>
      <div className="page-header">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>录音导入</Title>
          <Space>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
              选择音频文件
            </Button>
          </Space>
        </div>
      </div>

      <div className="page-body">
        <div
          className={`upload-area ${dragging ? 'dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Title level={4} style={{ margin: '0 0 8px' }}>拖拽音频文件到此处</Title>
          <Text type="secondary">支持 MP3、WAV、M4A、FLAC 等格式，最大支持 500MB</Text>
          <br />
          <Text type="secondary">或点击选择文件</Text>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          accept="audio/*"
          multiple
          onChange={handleFileInputChange}
        />

        {uploadingItems.length === 0 && meetings.length === 0 && (
          <Empty
            description="暂无音频记录"
            style={{ marginTop: 40 }}
          />
        )}

        {uploadingItems.length > 0 && (
          <>
            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>处理队列</Title>
            <List
              dataSource={uploadingItems}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => {}}
                    >
                      查看
                    </Button>,
                    <Button
                      type="link"
                      icon={<DeleteOutlined />}
                      onClick={() => setUploadingItems(prev => prev.filter(i => i.id !== item.id))}
                      danger
                    >
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<AudioOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={
                      <Space>
                        <span>{item.name}</span>
                        <Tag color={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text type="secondary">
                          <AudioOutlined style={{ marginRight: 8 }} />
                          {formatFileSize(item.size)}
                        </Text>
                        <Progress
                          percent={item.progress}
                          size="small"
                          status={item.status === 'error' ? 'exception' : 'active'}
                        />
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}

        {meetings.length > 0 && (
          <>
            <Title level={5} style={{ marginTop: 32, marginBottom: 16 }}>历史会议</Title>
            <List
              dataSource={meetings}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewMeeting(item.id)}>
                      查看详情
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<AudioOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={
                      <Space>
                        <span>{item.title}</span>
                        <Tag color={item.status === 'completed' ? 'green' : item.status === 'processing' ? 'blue' : 'red'}>
                          {item.status === 'completed' ? '已完成' : item.status === 'processing' ? '处理中' : '错误'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space>
                        <Text type="secondary">
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {new Date(item.date).toLocaleString('zh-CN')}
                        </Text>
                        <Text type="secondary">
                          时长：{formatDuration(item.duration)}
                        </Text>
                        <Text type="secondary">
                          参会：{item.participants.join('、')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </div>
    </>
  )
}
