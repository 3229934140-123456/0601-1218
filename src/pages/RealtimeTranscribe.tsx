import { useState, useEffect, useRef } from 'react'
import { Button, Typography, Select, Avatar, List, Space, Tag, message, Input, Modal } from 'antd'
import { AudioOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons'
import { useMeetingStore } from '@/store'
import { formatTime, generateId } from '@/mock/data'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const MOCK_CONTENTS = [
  '我认为这个方案可行',
  '我们需要再讨论一下细节',
  '技术上应该没有问题',
  '预计需要两周时间完成',
  '请补充一下需求文档',
  '好的，我来跟进这件事',
  '这个优先级需要调整',
  '我们先做个原型验证一下'
]

export default function RealtimeTranscribe() {
  const {
    isRecording, recordingTime, currentSpeakerId, realtimeTranscript,
    startRecording, stopRecording, addRealtimeSegment, setCurrentSpeaker,
    addMeeting, getSpeakers
  } = useMeetingStore()

  const [isPaused, setIsPaused] = useState(false)
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(40).fill(2))
  const [saveModalVisible, setSaveModalVisible] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const segmentIntervalRef = useRef<NodeJS.Timeout>()

  const speakers = getSpeakers()
  const currentSpeaker = speakers.find(s => s.id === currentSpeakerId)

  useEffect(() => {
    if (isRecording && !isPaused) {
      const animateWaveform = () => {
        setWaveformBars(prev => prev.map(() => Math.random() * 80 + 10))
        animationRef.current = requestAnimationFrame(animateWaveform)
      }
      animationRef.current = requestAnimationFrame(animateWaveform)
      segmentIntervalRef.current = setInterval(() => {
        const randomContent = MOCK_CONTENTS[Math.floor(Math.random() * MOCK_CONTENTS.length)]
        addRealtimeSegment(randomContent)
      }, 3000)
    } else {
      setWaveformBars(Array(40).fill(2))
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (segmentIntervalRef.current) clearInterval(segmentIntervalRef.current)
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (segmentIntervalRef.current) clearInterval(segmentIntervalRef.current)
    }
  }, [isRecording, isPaused, addRealtimeSegment])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [realtimeTranscript])

  const handleStart = () => { startRecording(); setIsPaused(false) }
  const handlePause = () => setIsPaused(!isPaused)
  const handleStop = () => {
    stopRecording()
    setIsPaused(false)
    if (realtimeTranscript.length > 0) {
      setSaveModalVisible(true)
      setMeetingTitle(`实时会议 - ${new Date().toLocaleString('zh-CN')}`)
    }
  }

  const handleSaveMeeting = () => {
    if (!meetingTitle.trim()) { message.error('请输入会议标题'); return }
    const participantIds = [...new Set(realtimeTranscript.map(s => s.speakerId))]
    const participants = participantIds
      .map(id => speakers.find(s => s.id === id)?.name)
      .filter(Boolean) as string[]

    addMeeting({
      title: meetingTitle, duration: recordingTime, participants,
      status: 'processing', progress: 100, transcript: realtimeTranscript,
      topics: [{
        id: generateId(), title: '会议讨论', description: '实时转写会议内容',
        startTime: 0, endTime: recordingTime, segmentIds: realtimeTranscript.map(s => s.id)
      }], summary: ''
    })

    setSaveModalVisible(false)
    message.success('会议保存成功！')
  }

  const getSpeakerColor = (speakerId: string) => speakers.find(s => s.id === speakerId)?.color || '#999'
  const getSpeakerName = (speakerId: string) => speakers.find(s => s.id === speakerId)?.name || '未知'

  return (
    <>
      <div className="page-header">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>实时转写</Title>
          <Space>
            <Select
              value={currentSpeakerId}
              onChange={setCurrentSpeaker}
              style={{ width: 180 }}
              disabled={isRecording && !isPaused}
              prefix={<Avatar size="small" style={{ backgroundColor: currentSpeaker?.color, marginRight: 8 }} icon={<UserOutlined />} />}
            >
              {speakers.map(speaker => (
                <Option key={speaker.id} value={speaker.id}>
                  <Space>
                    <Avatar size="small" style={{ backgroundColor: speaker.color }} icon={<UserOutlined />} />
                    <span>{speaker.name}</span>
                  </Space>
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => { setSaveModalVisible(true); setMeetingTitle('') }}
              disabled={realtimeTranscript.length === 0}
            >
              保存为会议
            </Button>
          </Space>
        </div>
      </div>

      <div className="page-body">
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 16, padding: 40, textAlign: 'center', marginBottom: 24
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80, marginBottom: 24, gap: 2 }}>
            {waveformBars.map((height, i) => (
              <div
                key={i}
                style={{
                  width: 4, height: `${height}%`,
                  background: 'rgba(255,255,255,0.8)', borderRadius: 2, transition: 'height 0.1s ease'
                }}
              />
            ))}
          </div>

          <Title level={2} style={{ color: '#fff', margin: '0 0 24px', fontFamily: 'monospace' }}>
            {formatTime(recordingTime)}
          </Title>

          <Space size="large">
            {!isRecording ? (
              <Button type="primary" shape="circle" size="large" icon={<PlayCircleOutlined />} onClick={handleStart} style={{ width: 72, height: 72, fontSize: 32 }} />
            ) : (
              <>
                <Button shape="circle" size="large" icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />} onClick={handlePause} style={{ width: 64, height: 64, fontSize: 28 }} />
                <Button danger shape="circle" size="large" icon={<StopOutlined />} onClick={handleStop} style={{ width: 72, height: 72, fontSize: 32 }} />
              </>
            )}
          </Space>

          {isRecording && (
            <Tag color={isPaused ? 'orange' : 'red'} style={{ marginTop: 24, fontSize: 14, padding: '4px 12px' }}>
              <AudioOutlined spin={!isPaused} />
              {isPaused ? ' 已暂停' : ' 录制中'}
            </Tag>
          )}
        </div>

        <Title level={5} style={{ marginBottom: 16 }}>实时转写内容</Title>

        {realtimeTranscript.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fafafa', borderRadius: 8, color: '#999' }}>
            <AudioOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
            <div>点击开始按钮进行实时转写</div>
          </div>
        ) : (
          <List dataSource={realtimeTranscript} renderItem={(item) => (
            <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <List.Item.Meta
                avatar={<Avatar style={{ backgroundColor: getSpeakerColor(item.speakerId) }} icon={<UserOutlined />} />}
                title={
                  <Space>
                    <Text strong>{getSpeakerName(item.speakerId)}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{formatTime(item.startTime)} - {formatTime(item.endTime)}</Text>
                  </Space>
                }
                description={<Text style={{ color: '#333', fontSize: 14, lineHeight: 1.6 }}>{item.content}</Text>}
              />
            </List.Item>
          )} />
        )}
        <div ref={transcriptEndRef} />
      </div>

      <Modal
        title="保存为会议"
        open={saveModalVisible}
        onOk={handleSaveMeeting}
        onCancel={() => setSaveModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">会议时长：{formatTime(recordingTime)}</Text>
          <br />
          <Text type="secondary">转写片段：{realtimeTranscript.length} 条</Text>
        </div>
        <div style={{ marginBottom: 8 }}><Text strong>会议标题</Text></div>
        <TextArea
          value={meetingTitle}
          onChange={(e) => setMeetingTitle(e.target.value)}
          placeholder="请输入会议标题"
          rows={3}
          autoSize
        />
      </Modal>
    </>
  )
}
