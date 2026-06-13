import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Badge } from 'antd'
import type { MenuProps } from 'antd/es/menu'
import {
  UploadOutlined,
  AudioOutlined,
  EditOutlined,
  CheckSquareOutlined,
  SearchOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useMeetingStore } from '@/store'

const menuItems = [
  {
    key: '/audio-import',
    icon: <UploadOutlined />,
    label: '录音导入'
  },
  {
    key: '/realtime',
    icon: <AudioOutlined />,
    label: '实时转写'
  },
  {
    key: '/editor',
    icon: <EditOutlined />,
    label: '纪要编辑'
  },
  {
    key: '/tasks',
    icon: <CheckSquareOutlined />,
    label: '任务提取'
  },
  {
    key: '/knowledge',
    icon: <SearchOutlined />,
    label: '知识检索'
  },
  {
    key: '/templates',
    icon: <FileTextOutlined />,
    label: '模板中心'
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '个人设置'
  }
]

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { processingStatus } = useMeetingStore()
  const [collapsed] = useState(false)

  const processingCount = processingStatus.filter(s => s.step !== 'completed' && s.step !== 'error').length

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ marginRight: '12px', fontSize: '24px' }}>🎙️</span>
          {!collapsed && <span>智能会议助手</span>}
        </div>
        <nav className="sidebar-menu">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems.map((item) => 
              item.key === '/tasks' && processingCount > 0
                ? {
                    ...item,
                    label: (
                      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {item.label}
                        <Badge count={processingCount} size="small" />
                      </span>
                    )
                  }
                : item
            ) as MenuProps['items']}
            onClick={handleMenuClick}
          />
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
