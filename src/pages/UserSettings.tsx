import { useState } from 'react'
import { Form, Switch, Select, Input, Tag, Button, Progress, List, Card, Typography, Space, message } from 'antd'
import { PlusOutlined, CloseOutlined, SettingOutlined, SafetyOutlined, FileTextOutlined, SyncOutlined } from '@ant-design/icons'
import { useMeetingStore } from '@/store'

const { Title, Text } = Typography
const { Option } = Select

export default function UserSettings() {
  const { settings, processingStatus, updateSettings, addSensitiveWord, removeSensitiveWord, addCommonWord, removeCommonWord } = useMeetingStore()
  const [sensitiveInput, setSensitiveInput] = useState('')
  const [commonInput, setCommonInput] = useState('')
  const [form] = Form.useForm()

  const handleAddSensitiveWord = () => {
    const word = sensitiveInput.trim()
    if (!word) {
      message.warning('请输入敏感词')
      return
    }
    if (settings.sensitiveWords.includes(word)) {
      message.warning('该敏感词已存在')
      return
    }
    addSensitiveWord(word)
    setSensitiveInput('')
    message.success('添加成功')
  }

  const handleAddCommonWord = () => {
    const word = commonInput.trim()
    if (!word) {
      message.warning('请输入常用词')
      return
    }
    if (settings.commonWords.includes(word)) {
      message.warning('该常用词已存在')
      return
    }
    addCommonWord(word)
    setCommonInput('')
    message.success('添加成功')
  }

  const getStepText = (step: string) => {
    const stepMap: Record<string, string> = {
      uploading: '上传中',
      transcribing: '转写中',
      analyzing: '分析中',
      summarizing: '摘要生成中',
      completed: '已完成',
      error: '处理失败'
    }
    return stepMap[step] || step
  }

  const getStepColor = (step: string) => {
    if (step === 'completed') return 'success'
    if (step === 'error') return 'exception'
    return 'active'
  }

  return (
    <>
      <div className="page-header">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>用户设置</Title>
        </div>
      </div>

      <div className="page-body">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card
            title={
              <Space>
                <SettingOutlined />
                <span>通用设置</span>
              </Space>
            }
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                theme: settings.theme,
                autoSave: settings.autoSave,
                language: settings.language,
                notificationEnabled: settings.notificationEnabled
              }}
              onValuesChange={(changedValues) => {
                updateSettings(changedValues)
              }}
            >
              <Form.Item label="主题模式" name="theme">
                <Select style={{ width: 200 }}>
                  <Option value="light">浅色模式</Option>
                  <Option value="dark">深色模式</Option>
                </Select>
              </Form.Item>
              <Form.Item label="自动保存" name="autoSave" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="语言" name="language">
                <Select style={{ width: 200 }}>
                  <Option value="zh-CN">简体中文</Option>
                  <Option value="en-US">English</Option>
                  <Option value="ja-JP">日本語</Option>
                </Select>
              </Form.Item>
              <Form.Item label="通知提醒" name="notificationEnabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Form>
          </Card>

          <Card
            title={
              <Space>
                <SafetyOutlined />
                <span>敏感词管理</span>
              </Space>
            }
            extra={<Text type="secondary">共 {settings.sensitiveWords.length} 个</Text>}
          >
            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="输入敏感词，按回车添加"
                value={sensitiveInput}
                onChange={(e) => setSensitiveInput(e.target.value)}
                onPressEnter={handleAddSensitiveWord}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSensitiveWord}>
                添加
              </Button>
            </Space.Compact>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {settings.sensitiveWords.map((word) => (
                <Tag
                  key={word}
                  color="red"
                  closeIcon={<CloseOutlined />}
                  onClose={() => removeSensitiveWord(word)}
                  style={{ margin: 0 }}
                >
                  {word}
                </Tag>
              ))}
              {settings.sensitiveWords.length === 0 && (
                <Text type="secondary">暂无敏感词</Text>
              )}
            </div>
          </Card>

          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>常用词管理</span>
              </Space>
            }
            extra={<Text type="secondary">共 {settings.commonWords.length} 个</Text>}
          >
            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="输入常用词，按回车添加"
                value={commonInput}
                onChange={(e) => setCommonInput(e.target.value)}
                onPressEnter={handleAddCommonWord}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCommonWord}>
                添加
              </Button>
            </Space.Compact>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {settings.commonWords.map((word) => (
                <Tag
                  key={word}
                  color="default"
                  closeIcon={<CloseOutlined />}
                  onClose={() => removeCommonWord(word)}
                  style={{ margin: 0 }}
                >
                  {word}
                </Tag>
              ))}
              {settings.commonWords.length === 0 && (
                <Text type="secondary">暂无常用词</Text>
              )}
            </div>
          </Card>

          <Card
            title={
              <Space>
                <SyncOutlined />
                <span>处理状态</span>
              </Space>
            }
          >
            <List
              dataSource={processingStatus}
              locale={{ emptyText: '暂无处理任务' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.meetingTitle}</span>
                        <Tag color={item.step === 'completed' ? 'green' : item.step === 'error' ? 'red' : 'blue'}>
                          {getStepText(item.step)}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text type="secondary">{item.message}</Text>
                        <Progress
                          percent={item.progress}
                          size="small"
                          status={getStepColor(item.step)}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          开始时间：{new Date(item.startTime).toLocaleString('zh-CN')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Space>
      </div>
    </>
  )
}
