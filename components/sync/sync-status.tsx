"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react'
import { syncManager, SyncState } from '@/lib/sync-manager'
import { authManager, AuthState } from '@/lib/auth-manager'
import { SyncError } from '@/lib/types'

interface SyncStatusProps {
  className?: string
  compact?: boolean
}

export function SyncStatus({ className = '', compact = false }: SyncStatusProps) {
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getSyncState())
  const [authState, setAuthState] = useState<AuthState>(authManager.getAuthState())
  const [isManualSyncing, setIsManualSyncing] = useState(false)

  useEffect(() => {
    const unsubscribeSync = syncManager.onSyncStateChange(setSyncState)
    const unsubscribeAuth = authManager.onAuthStateChange(setAuthState)
    
    return () => {
      unsubscribeSync()
      unsubscribeAuth()
    }
  }, [])

  const handleManualSync = async () => {
    if (!authState.isAuthenticated) return

    setIsManualSyncing(true)
    try {
      await syncManager.manualSync()
    } catch (error) {
      console.error('Manual sync failed:', error)
    } finally {
      setIsManualSyncing(false)
    }
  }

  const getStatusInfo = () => {
    if (!authState.isAuthenticated) {
      return {
        icon: CloudOff,
        text: compact ? '离线' : '本地模式',
        variant: 'secondary' as const,
        color: 'text-gray-500'
      }
    }

    if (!syncManager.isNetworkAvailable()) {
      return {
        icon: WifiOff,
        text: compact ? '无网络' : '网络不可用',
        variant: 'destructive' as const,
        color: 'text-red-500'
      }
    }

    switch (syncState.status) {
      case 'syncing':
        return {
          icon: RefreshCw,
          text: compact ? '同步中' : '正在同步...',
          variant: 'default' as const,
          color: 'text-blue-500',
          spinning: true
        }
      case 'success':
        return {
          icon: CheckCircle,
          text: compact ? '已同步' : '同步成功',
          variant: 'default' as const,
          color: 'text-green-500'
        }
      case 'error':
        return {
          icon: XCircle,
          text: compact ? '同步失败' : '同步出错',
          variant: 'destructive' as const,
          color: 'text-red-500'
        }
      case 'conflict':
        return {
          icon: AlertTriangle,
          text: compact ? '有冲突' : `${syncState.conflictCount} 个冲突`,
          variant: 'destructive' as const,
          color: 'text-orange-500'
        }
      case 'offline':
        return {
          icon: WifiOff,
          text: compact ? '离线' : '离线模式',
          variant: 'secondary' as const,
          color: 'text-gray-500'
        }
      default:
        return {
          icon: Cloud,
          text: compact ? '就绪' : '准备同步',
          variant: 'outline' as const,
          color: 'text-gray-600'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  // 紧凑模式
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StatusIcon 
          className={`w-4 h-4 ${statusInfo.color} ${statusInfo.spinning ? 'animate-spin' : ''}`} 
        />
        <span className="text-sm font-medium">{statusInfo.text}</span>
        {syncState.pendingChanges && (
          <div className="w-2 h-2 bg-orange-500 rounded-full" title="有未同步的更改" />
        )}
      </div>
    )
  }

  // 完整模式
  return (
    <div className={`space-y-3 ${className}`}>
      {/* 状态显示 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon 
            className={`w-5 h-5 ${statusInfo.color} ${statusInfo.spinning ? 'animate-spin' : ''}`} 
          />
          <div>
            <div className="font-medium">{statusInfo.text}</div>
            {syncState.lastSyncTime && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                上次同步: {formatTimeAgo(syncState.lastSyncTime)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 未同步更改指示器 */}
          {syncState.pendingChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              有更改
            </Badge>
          )}

          {/* 手动同步按钮 */}
          {authState.isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={isManualSyncing || syncState.status === 'syncing'}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isManualSyncing ? 'animate-spin' : ''}`} />
              {isManualSyncing ? '同步中' : '同步'}
            </Button>
          )}
        </div>
      </div>

      {/* 网络状态 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {syncManager.isNetworkAvailable() ? (
          <>
            <Wifi className="w-4 h-4 text-green-500" />
            <span>网络已连接</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-500" />
            <span>网络未连接</span>
          </>
        )}
        
        {authState.isAuthenticated && authState.repository && (
          <>
            <span className="mx-2">•</span>
            <span>数据仓库: {authState.repository.name}</span>
          </>
        )}
      </div>

      {/* 错误信息 */}
      {syncState.lastError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{syncState.lastError}</AlertDescription>
        </Alert>
      )}

      {/* 冲突提示 */}
      {syncState.status === 'conflict' && syncState.conflictCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            检测到 {syncState.conflictCount} 个数据冲突，需要手动解决。
            <Button variant="link" className="p-0 h-auto ml-1" onClick={() => {
              // TODO: 打开冲突解决界面
              console.log('Open conflict resolution')
            }}>
              立即解决
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 速率限制信息 */}
      {authState.permissions?.rateLimit && (
        <div className="text-xs text-muted-foreground">
          API 调用: {authState.permissions.rateLimit.remaining} / {authState.permissions.rateLimit.limit} 剩余
        </div>
      )}
    </div>
  )
}

/**
 * 格式化时间为相对时间
 */
function formatTimeAgo(date: Date | string | null): string {
  if (!date) return '未知'
  
  // 确保 date 是 Date 对象
  const dateObj = date instanceof Date ? date : new Date(date)
  
  // 验证日期是否有效
  if (isNaN(dateObj.getTime())) {
    return '无效时间'
  }
  
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) {
    return '刚刚'
  } else if (diffMins < 60) {
    return `${diffMins} 分钟前`
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`
  } else if (diffDays < 7) {
    return `${diffDays} 天前`
  } else {
    return dateObj.toLocaleDateString()
  }
}
