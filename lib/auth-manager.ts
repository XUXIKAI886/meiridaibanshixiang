// 认证管理器 - 安全的GitHub令牌管理

import { secureStorage } from './secure-storage'
import { GitHubClient } from './github-client'
import { 
  AuthConfig, 
  GitHubUser, 
  PermissionStatus, 
  GitHubAPIError,
  GitHubRepository 
} from './types'

interface AuthState {
  isAuthenticated: boolean
  user: GitHubUser | null
  permissions: PermissionStatus | null
  repository: GitHubRepository | null
  lastValidation: Date | null
}

class AuthManager {
  private static instance: AuthManager
  private client: GitHubClient
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    permissions: null,
    repository: null,
    lastValidation: null
  }
  private listeners: Array<(state: AuthState) => void> = []

  private constructor() {
    this.client = new GitHubClient()
    this.initializeAuth()
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * 初始化认证状态
   */
  private async initializeAuth(): Promise<void> {
    try {
      const authConfig = await this.getStoredAuthConfig()
      if (authConfig) {
        this.client.setToken(authConfig.token)
        
        // 验证存储的令牌是否仍然有效
        const isValid = await this.validateStoredToken()
        if (isValid) {
          await this.loadAuthState()
        } else {
          await this.clearAuth()
        }
      }
    } catch (error) {
      console.warn('Failed to initialize auth:', error)
      await this.clearAuth()
    }
  }

  /**
   * 设置GitHub访问令牌
   */
  async setToken(token: string): Promise<boolean> {
    try {
      // 验证令牌格式
      if (!this.isValidTokenFormat(token)) {
        throw new Error('Invalid token format')
      }

      // 创建临时客户端进行验证
      const tempClient = new GitHubClient(token)
      
      // 验证令牌
      const user = await tempClient.validateToken()
      const permissions = await tempClient.checkPermissions()

      // 检查必要权限
      if (!permissions.hasRepoAccess) {
        throw new Error('Token missing required repository permissions')
      }

      // 验证通过，保存令牌
      this.client.setToken(token)
      
      // 获取或创建数据仓库
      const repository = await this.getOrCreateDataRepository(user.login)

      // 保存认证配置
      const authConfig: AuthConfig = {
        token,
        username: user.login,
        userId: user.id,
        repoName: repository.name,
        repoFullName: repository.full_name
      }

      await this.saveAuthConfig(authConfig)

      // 更新认证状态
      this.authState = {
        isAuthenticated: true,
        user,
        permissions,
        repository,
        lastValidation: new Date()
      }

      this.notifyListeners()
      return true

    } catch (error) {
      console.error('Failed to set token:', error)
      await this.clearAuth()
      
      if (error instanceof GitHubAPIError) {
        throw error
      }
      throw new Error(`Authentication failed: ${error}`)
    }
  }

  /**
   * 获取当前令牌
   */
  async getToken(): Promise<string | null> {
    try {
      const authConfig = await this.getStoredAuthConfig()
      return authConfig?.token || null
    } catch {
      return null
    }
  }

  /**
   * 清除认证信息
   */
  async clearAuth(): Promise<void> {
    this.client.clearToken()
    await secureStorage.removeItem('auth_config')
    
    this.authState = {
      isAuthenticated: false,
      user: null,
      permissions: null,
      repository: null,
      lastValidation: null
    }

    this.notifyListeners()
  }

  /**
   * 验证当前令牌
   */
  async validateToken(): Promise<boolean> {
    try {
      if (!this.client.isAuthenticated()) {
        return false
      }

      const user = await this.client.validateToken()
      const permissions = await this.client.checkPermissions()

      // 更新用户信息和权限
      this.authState.user = user
      this.authState.permissions = permissions
      this.authState.lastValidation = new Date()
      this.authState.isAuthenticated = true

      this.notifyListeners()
      return true
    } catch (error) {
      console.error('Token validation failed:', error)
      this.authState.isAuthenticated = false
      this.notifyListeners()
      return false
    }
  }

  /**
   * 获取认证状态
   */
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated
  }

  /**
   * 获取GitHub客户端
   */
  getClient(): GitHubClient {
    if (!this.authState.isAuthenticated) {
      throw new Error('Not authenticated')
    }
    return this.client
  }

  /**
   * 获取用户信息
   */
  getUser(): GitHubUser | null {
    return this.authState.user
  }

  /**
   * 获取权限信息
   */
  getPermissions(): PermissionStatus | null {
    return this.authState.permissions
  }

  /**
   * 获取数据仓库信息
   */
  getRepository(): GitHubRepository | null {
    return this.authState.repository
  }

  /**
   * 监听认证状态变化
   */
  onAuthStateChange(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 刷新权限信息
   */
  async refreshPermissions(): Promise<PermissionStatus | null> {
    try {
      if (!this.client.isAuthenticated()) {
        return null
      }

      const permissions = await this.client.checkPermissions()
      this.authState.permissions = permissions
      this.notifyListeners()
      
      return permissions
    } catch (error) {
      console.error('Failed to refresh permissions:', error)
      return null
    }
  }

  /**
   * 获取速率限制信息
   */
  getRateLimitInfo() {
    return this.client.getRateLimitInfo()
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.client.testConnection()
    } catch {
      return false
    }
  }

  // 私有方法

  /**
   * 验证令牌格式
   */
  private isValidTokenFormat(token: string): boolean {
    // GitHub Personal Access Token格式: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    // GitHub App Token格式: ghs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    const tokenRegex = /^gh[ps]_[A-Za-z0-9]{36}$/
    return tokenRegex.test(token.trim())
  }

  /**
   * 验证存储的令牌
   */
  private async validateStoredToken(): Promise<boolean> {
    try {
      const authConfig = await this.getStoredAuthConfig()
      if (!authConfig) return false

      // 检查令牌是否在24小时内验证过
      if (this.authState.lastValidation) {
        const hoursSinceLastValidation = 
          (Date.now() - this.authState.lastValidation.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceLastValidation < 24) {
          return true
        }
      }

      // 重新验证令牌
      return await this.validateToken()
    } catch {
      return false
    }
  }

  /**
   * 加载认证状态
   */
  private async loadAuthState(): Promise<void> {
    try {
      const authConfig = await this.getStoredAuthConfig()
      if (!authConfig) return

      // 设置客户端令牌
      this.client.setToken(authConfig.token)

      // 获取用户信息
      const user = await this.client.validateToken()
      const permissions = await this.client.checkPermissions()

      // 获取仓库信息
      const repository = await this.client.makeRequest<GitHubRepository>(
        `/repos/${authConfig.repoFullName}`
      ).then(response => response.data).catch(() => null)

      this.authState = {
        isAuthenticated: true,
        user,
        permissions,
        repository,
        lastValidation: new Date()
      }

      this.notifyListeners()
    } catch (error) {
      console.error('Failed to load auth state:', error)
      throw error
    }
  }

  /**
   * 获取或创建数据仓库
   */
  private async getOrCreateDataRepository(username: string): Promise<GitHubRepository> {
    const repoName = 'daily-habits-data'
    
    try {
      // 检查仓库是否已存在
      const exists = await this.client.repositoryExists(username, repoName)
      
      if (exists) {
        // 获取现有仓库信息
        const response = await this.client.makeRequest<GitHubRepository>(
          `/repos/${username}/${repoName}`
        )
        return response.data
      } else {
        // 创建新仓库
        return await this.client.createRepository(
          repoName,
          '日拱一足 - 个人习惯数据存储仓库（自动创建）'
        )
      }
    } catch (error) {
      throw new Error(`Failed to setup data repository: ${error}`)
    }
  }

  /**
   * 保存认证配置
   */
  private async saveAuthConfig(config: AuthConfig): Promise<void> {
    await secureStorage.setItem('auth_config', config, true)
  }

  /**
   * 获取存储的认证配置
   */
  private async getStoredAuthConfig(): Promise<AuthConfig | null> {
    return await secureStorage.getItem<AuthConfig>('auth_config', true)
  }

  /**
   * 通知状态变化监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getAuthState())
      } catch (error) {
        console.error('Auth state listener error:', error)
      }
    })
  }
}

// 导出单例实例
export const authManager = AuthManager.getInstance()

// 导出类型
export { AuthManager }
export type { AuthState }
