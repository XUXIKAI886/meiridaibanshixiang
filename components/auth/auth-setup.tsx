"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  RefreshCw,
  Github,
  Shield,
  Database
} from 'lucide-react'
import { authManager, AuthState } from '@/lib/auth-manager'
import { GitHubAPIError } from '@/lib/types'

interface AuthSetupProps {
  onAuthSuccess?: () => void
}

export function AuthSetup({ onAuthSuccess }: AuthSetupProps) {
  const [token, setToken] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authState, setAuthState] = useState<AuthState>(authManager.getAuthState())

  useEffect(() => {
    const unsubscribe = authManager.onAuthStateChange(setAuthState)
    return unsubscribe
  }, [])

  const handleTokenSubmit = async () => {
    if (!token.trim()) {
      setError('请输入GitHub访问令牌')
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      const success = await authManager.setToken(token.trim())
      
      if (success) {
        setToken('')
        onAuthSuccess?.()
      }
    } catch (error) {
      console.error('Authentication failed:', error)
      
      if (error instanceof GitHubAPIError) {
        switch (error.status) {
          case 401:
            setError('访问令牌无效或已过期')
            break
          case 403:
            if (error.code === 'rate_limit_exceeded') {
              setError('API调用频率超限，请稍后再试')
            } else {
              setError('访问令牌权限不足，请确保令牌具有仓库访问权限')
            }
            break
          case 0:
            setError('网络连接失败，请检查网络设置')
            break
          default:
            setError(`GitHub API错误: ${error.message}`)
        }
      } else {
        setError(error instanceof Error ? error.message : '认证失败，请重试')
      }
    } finally {
      setIsValidating(false)
    }
  }

  const handleLogout = async () => {
    await authManager.clearAuth()
    setToken('')
    setError(null)
  }

  const handleTestConnection = async () => {
    setIsValidating(true)
    try {
      const isConnected = await authManager.testConnection()
      if (isConnected) {
        setError(null)
        alert('连接测试成功！')
      } else {
        setError('连接测试失败')
      }
    } catch (error) {
      setError(`连接测试失败: ${error}`)
    } finally {
      setIsValidating(false)
    }
  }

  // 如果已认证，显示状态信息
  if (authState.isAuthenticated && authState.user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub 认证状态
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 用户信息 */}
          <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img 
                src={authState.user.avatar_url} 
                alt={authState.user.login}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{authState.user.name || authState.user.login}</h3>
              <p className="text-sm text-muted-foreground">@{authState.user.login}</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              已认证
            </Badge>
          </div>

          {/* 权限状态 */}
          {authState.permissions && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                权限状态
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  {authState.permissions.hasRepoAccess ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">仓库访问权限</span>
                </div>
                <div className="flex items-center gap-2">
                  {authState.permissions.hasUserAccess ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">用户信息权限</span>
                </div>
              </div>
              
              {/* 速率限制信息 */}
              <div className="text-xs text-muted-foreground">
                API调用限制: {authState.permissions.rateLimit.remaining} / {authState.permissions.rateLimit.limit}
              </div>
            </div>
          )}

          {/* 数据仓库信息 */}
          {authState.repository && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                数据仓库
              </h4>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">私有</Badge>
                  <span className="font-mono text-sm">{authState.repository.full_name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  创建于: {new Date(authState.repository.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={isValidating}
            >
              {isValidating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              测试连接
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              disabled={isValidating}
            >
              注销
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // 未认证状态，显示令牌输入界面
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="w-5 h-5" />
          GitHub 认证设置
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 说明信息 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            请输入您的GitHub个人访问令牌以启用云端同步功能。
            <br />
            令牌需要具有 <code className="bg-muted px-1 rounded">repo</code> 权限以创建和管理私有仓库。
          </AlertDescription>
        </Alert>

        {/* 令牌输入 */}
        <div className="space-y-3">
          <Label htmlFor="token">GitHub 个人访问令牌</Label>
          <div className="relative">
            <Input
              id="token"
              type={showToken ? 'text' : 'password'}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
              disabled={isValidating}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            还没有访问令牌？{' '}
            <a 
              href="https://github.com/settings/tokens/new?scopes=repo&description=Daily%20Habits%20Sync" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              点击这里创建
            </a>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 提交按钮 */}
        <Button 
          onClick={handleTokenSubmit} 
          disabled={!token.trim() || isValidating}
          className="w-full"
        >
          {isValidating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              验证中...
            </>
          ) : (
            '连接 GitHub'
          )}
        </Button>

        {/* 安全说明 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>🔒 您的访问令牌将使用军用级AES-256加密存储在本地</p>
          <p>🛡️ 我们不会在服务器上存储您的任何敏感信息</p>
          <p>📱 令牌仅用于同步您的个人习惯数据到私有仓库</p>
        </div>
      </CardContent>
    </Card>
  )
}
