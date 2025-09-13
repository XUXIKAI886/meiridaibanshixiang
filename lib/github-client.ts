// GitHub API客户端 - 封装GitHub REST API调用

import { 
  GitHubUser, 
  GitHubRepository, 
  PermissionStatus, 
  GitHubAPIError,
  HabitsData,
  BackupInfo
} from './types'

interface GitHubAPIResponse<T> {
  data: T
  status: number
  headers: Record<string, string>
}

interface RateLimit {
  limit: number
  remaining: number
  reset: number
  used: number
}

class GitHubClient {
  private baseURL = 'https://api.github.com'
  private token: string | null = null
  private rateLimitInfo: RateLimit | null = null

  constructor(token?: string) {
    if (token) {
      this.setToken(token)
    }
  }

  /**
   * 设置访问令牌
   */
  setToken(token: string): void {
    this.token = token
  }

  /**
   * 清除访问令牌
   */
  clearToken(): void {
    this.token = null
    this.rateLimitInfo = null
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return !!this.token
  }

  /**
   * 将字符串编码为Base64（正确处理中文）
   */
  private encodeToBase64(text: string): string {
    try {
      // 使用现代 TextEncoder API（更可靠）
      const utf8Bytes = new TextEncoder().encode(text)
      let binaryString = ''
      for (let i = 0; i < utf8Bytes.length; i++) {
        binaryString += String.fromCharCode(utf8Bytes[i])
      }
      return btoa(binaryString)
    } catch (error) {
      // 降级到传统方法（但避免使用废弃的 unescape）
      console.warn('Using fallback encoding method:', error)
      return btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    }
  }

  /**
   * 将Base64解码为字符串（正确处理中文）
   */
  private decodeFromBase64(base64: string): string {
    try {
      // 移除可能的换行符
      const cleanBase64 = base64.replace(/\n/g, '')
      
      // 使用现代 TextDecoder API（更可靠）
      const binaryString = atob(cleanBase64)
      const utf8Bytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        utf8Bytes[i] = binaryString.charCodeAt(i)
      }
      
      return new TextDecoder('utf-8').decode(utf8Bytes)
    } catch (error) {
      // 降级到传统方法（但避免使用废弃的 escape）
      console.warn('Using fallback decoding method:', error)
      try {
        const cleanBase64 = base64.replace(/\n/g, '')
        const binaryString = atob(cleanBase64)
        // 尝试直接解码
        return new TextDecoder('utf-8').decode(
          new Uint8Array([...binaryString].map(char => char.charCodeAt(0)))
        )
      } catch (fallbackError) {
        throw new Error(`Failed to decode Base64: ${error}`)
      }
    }
  }

  /**
   * 发送HTTP请求到GitHub API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<GitHubAPIResponse<T>> {
    if (!this.token) {
      throw new GitHubAPIError('No access token provided', 401)
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${this.token}`,
      'User-Agent': 'DailyHabits/1.0',
      ...((options.headers as Record<string, string>) || {})
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      // 更新速率限制信息
      this.updateRateLimitInfo(response)

      // 检查速率限制
      if (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0') {
        const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0')
        throw new GitHubAPIError(
          `Rate limit exceeded. Resets at ${new Date(resetTime * 1000).toISOString()}`,
          403,
          'rate_limit_exceeded'
        )
      }

      let data: T
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text() as unknown as T
      }

      if (!response.ok) {
        const error = data as any
        throw new GitHubAPIError(
          error.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          error.code
        )
      }

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      }
    } catch (error) {
      if (error instanceof GitHubAPIError) {
        throw error
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new GitHubAPIError('Network error: Unable to connect to GitHub', 0, 'network_error')
      }
      
      throw new GitHubAPIError(`Request failed: ${error}`, 500)
    }
  }

  /**
   * 更新速率限制信息
   */
  private updateRateLimitInfo(response: Response): void {
    const limit = response.headers.get('X-RateLimit-Limit')
    const remaining = response.headers.get('X-RateLimit-Remaining')
    const reset = response.headers.get('X-RateLimit-Reset')
    const used = response.headers.get('X-RateLimit-Used')

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        used: parseInt(used || '0')
      }
    }
  }

  /**
   * 获取速率限制信息
   */
  getRateLimitInfo(): RateLimit | null {
    return this.rateLimitInfo
  }

  /**
   * 公开的请求方法（供其他模块使用）
   */
  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<GitHubAPIResponse<T>> {
    return this.request<T>(endpoint, options)
  }

  /**
   * 验证令牌并获取用户信息
   */
  async validateToken(): Promise<GitHubUser> {
    const response = await this.request<GitHubUser>('/user')
    return response.data
  }

  /**
   * 检查令牌权限
   */
  async checkPermissions(): Promise<PermissionStatus> {
    const response = await this.request<GitHubUser>('/user')
    const scopes = response.headers['x-oauth-scopes']?.split(', ') || []
    
    return {
      hasRepoAccess: scopes.includes('repo') || scopes.includes('public_repo'),
      hasUserAccess: scopes.includes('user') || scopes.includes('user:email'),
      scopes,
      rateLimit: this.rateLimitInfo || { limit: 5000, remaining: 5000, reset: 0 }
    }
  }

  /**
   * 获取用户仓库列表
   */
  async getUserRepositories(options: {
    type?: 'all' | 'owner' | 'member'
    sort?: 'created' | 'updated' | 'pushed' | 'full_name'
    per_page?: number
  } = {}): Promise<GitHubRepository[]> {
    const params = new URLSearchParams({
      type: options.type || 'owner',
      sort: options.sort || 'updated',
      per_page: (options.per_page || 30).toString()
    })

    const response = await this.request<GitHubRepository[]>(`/user/repos?${params}`)
    return response.data
  }

  /**
   * 检查仓库是否存在
   */
  async repositoryExists(owner: string, repo: string): Promise<boolean> {
    try {
      await this.request(`/repos/${owner}/${repo}`)
      return true
    } catch (error) {
      if (error instanceof GitHubAPIError && error.status === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * 创建私有仓库
   */
  async createRepository(name: string, description?: string): Promise<GitHubRepository> {
    const response = await this.request<GitHubRepository>('/user/repos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description: description || '日拱一足 - 个人习惯数据存储',
        private: true,
        auto_init: true,
        license_template: 'mit'
      })
    })

    return response.data
  }

  /**
   * 获取文件内容
   */
  async getFileContent(
    owner: string, 
    repo: string, 
    path: string, 
    ref?: string
  ): Promise<{ content: string; sha: string; encoding: string }> {
    const params = ref ? `?ref=${ref}` : ''
    const response = await this.request<any>(`/repos/${owner}/${repo}/contents/${path}${params}`)
    
    if (response.data.type !== 'file') {
      throw new GitHubAPIError(`${path} is not a file`, 400)
    }

    return {
      content: response.data.content,
      sha: response.data.sha,
      encoding: response.data.encoding
    }
  }

  /**
   * 创建或更新文件
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<{ sha: string; commit: any }> {
    // 使用更稳定的方式处理UTF-8编码
    const base64Content = this.encodeToBase64(content)
    
    const body: any = {
      message,
      content: base64Content,
      branch: 'main'
    }

    if (sha) {
      body.sha = sha
    }

    const response = await this.request<any>(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    return {
      sha: response.data.content.sha,
      commit: response.data.commit
    }
  }

  /**
   * 读取习惯数据
   */
  async readHabitsData(owner: string, repo: string): Promise<HabitsData> {
    try {
      const fileInfo = await this.getFileContent(owner, repo, 'data.json')
      // 使用稳定的解码方法
      const jsonContent = this.decodeFromBase64(fileInfo.content)
      return JSON.parse(jsonContent)
    } catch (error) {
      if (error instanceof GitHubAPIError && error.status === 404) {
        // 文件不存在，返回默认数据
        return this.getDefaultHabitsData()
      }
      throw error
    }
  }

  /**
   * 写入习惯数据
   */
  async writeHabitsData(
    owner: string, 
    repo: string, 
    data: HabitsData,
    currentSha?: string
  ): Promise<string> {
    const message = `更新习惯数据 - ${new Date().toISOString()}`
    const content = JSON.stringify(data, null, 2)
    
    const result = await this.createOrUpdateFile(
      owner,
      repo,
      'data.json',
      content,
      message,
      currentSha
    )

    return result.sha
  }

  /**
   * 创建备份
   */
  async createBackup(
    owner: string,
    repo: string,
    data: HabitsData
  ): Promise<BackupInfo> {
    const timestamp = new Date().toISOString()
    const fileName = `backup-${timestamp.replace(/[:.]/g, '-')}.json`
    const path = `backups/${fileName}`
    const content = JSON.stringify(data, null, 2)
    const message = `创建数据备份 - ${timestamp}`

    const result = await this.createOrUpdateFile(owner, repo, path, content, message)

    return {
      id: result.sha,
      timestamp,
      fileName,
      size: content.length,
      recordCount: data.habits.length,
      sha: result.sha
    }
  }

  /**
   * 获取备份列表
   */
  async listBackups(owner: string, repo: string): Promise<BackupInfo[]> {
    try {
      const response = await this.request<any>(`/repos/${owner}/${repo}/contents/backups`)
      
      if (!Array.isArray(response.data)) {
        return []
      }

      return response.data
        .filter((item: any) => item.type === 'file' && item.name.endsWith('.json'))
        .map((item: any) => ({
          id: item.sha,
          timestamp: this.extractTimestampFromFileName(item.name),
          fileName: item.name,
          size: item.size,
          recordCount: 0, // 需要读取文件内容才能知道
          sha: item.sha
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
      if (error instanceof GitHubAPIError && error.status === 404) {
        return []
      }
      throw error
    }
  }

  /**
   * 从文件名提取时间戳
   */
  private extractTimestampFromFileName(fileName: string): string {
    const match = fileName.match(/backup-(.+)\.json$/)
    if (match) {
      return match[1].replace(/-/g, ':').replace(/T(\d{2}):(\d{2}):(\d{2})/, 'T$1:$2:$3')
    }
    return new Date().toISOString()
  }

  /**
   * 获取默认习惯数据
   */
  private getDefaultHabitsData(): HabitsData {
    return {
      version: '1.0',
      lastSync: new Date().toISOString(),
      lastResetDate: new Date().toDateString(),
      habits: [],
      settings: {
        theme: 'light',
        autoSync: true,
        syncInterval: 300000, // 5分钟
        encryptionEnabled: true
      }
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/user')
      return true
    } catch {
      return false
    }
  }
}

export { GitHubClient }
export type { RateLimit }
