// 核心数据类型定义

export interface HabitItem {
  id: string
  text: string
  completed: boolean
  hidden: boolean
  createdAt: string
  updatedAt: string
}

export interface HabitsData {
  version: string
  lastSync: string
  lastResetDate: string
  habits: HabitItem[]
  settings: AppSettings
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  autoSync: boolean
  syncInterval: number
  encryptionEnabled: boolean
}

// GitHub相关类型
export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  name: string
  email: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  default_branch: string
  created_at: string
  updated_at: string
}

export interface PermissionStatus {
  hasRepoAccess: boolean
  hasUserAccess: boolean
  scopes: string[]
  rateLimit: {
    limit: number
    remaining: number
    reset: number
  }
}

// 同步相关类型
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline' | 'conflict' | 'success'

export interface SyncResult {
  success: boolean
  conflicts: ConflictInfo[]
  lastSyncTime: Date
  syncedRecords: number
  error?: string
}

export interface ConflictInfo {
  id: string
  type: 'modify' | 'delete' | 'create'
  local: HabitItem | null
  remote: HabitItem | null
  timestamp: {
    local: string
    remote: string
  }
}

export type ConflictResolution = 'local' | 'remote' | 'merge' | 'manual'

// 备份相关类型
export interface BackupInfo {
  id: string
  timestamp: string
  fileName: string
  size: number
  recordCount: number
  sha: string
}

// 认证相关类型
export interface AuthConfig {
  token: string
  username: string
  userId: number
  repoName: string
  repoFullName: string
}

// 错误类型
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'GitHubAPIError'
  }
}

export class SyncError extends Error {
  constructor(
    message: string,
    public type: 'network' | 'conflict' | 'auth' | 'storage'
  ) {
    super(message)
    this.name = 'SyncError'
  }
}

export class EncryptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EncryptionError'
  }
}
