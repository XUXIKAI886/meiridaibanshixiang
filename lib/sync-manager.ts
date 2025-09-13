// 数据同步管理器 - 实现本地与GitHub的双向同步

import { authManager } from './auth-manager'
import { secureStorage } from './secure-storage'
import { 
  HabitsData, 
  HabitItem, 
  SyncStatus, 
  SyncResult, 
  ConflictInfo, 
  ConflictResolution,
  SyncError 
} from './types'

interface SyncConfig {
  autoSync: boolean
  syncInterval: number // 毫秒
  retryAttempts: number
  retryDelay: number // 毫秒
}

interface SyncState {
  status: SyncStatus
  lastSyncTime: Date | null
  lastError: string | null
  pendingChanges: boolean
  conflictCount: number
}

class SyncManager {
  private static instance: SyncManager
  private syncState: SyncState = {
    status: 'idle',
    lastSyncTime: null,
    lastError: null,
    pendingChanges: false,
    conflictCount: 0
  }
  private config: SyncConfig = {
    autoSync: true,
    syncInterval: 5 * 60 * 1000, // 5分钟
    retryAttempts: 3,
    retryDelay: 2000 // 2秒
  }
  private listeners: Array<(state: SyncState) => void> = []
  private syncTimer: NodeJS.Timeout | null = null
  private isOnline = true
  private lastDataHash = ''

  private constructor() {
    this.initializeSync()
    this.setupNetworkMonitoring()
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  /**
   * 初始化同步管理器
   */
  private async initializeSync(): Promise<void> {
    try {
      // 加载同步配置
      const storedConfig = await secureStorage.getItem<SyncConfig>('sync_config', true)
      if (storedConfig) {
        this.config = { ...this.config, ...storedConfig }
      }

      // 加载上次同步状态
      const storedState = await secureStorage.getItem<Partial<SyncState>>('sync_state', true)
      if (storedState) {
        // 确保 lastSyncTime 是 Date 对象而不是字符串
        if (storedState.lastSyncTime && typeof storedState.lastSyncTime === 'string') {
          storedState.lastSyncTime = new Date(storedState.lastSyncTime)
        }
        this.syncState = { ...this.syncState, ...storedState }
      }

      // 监听认证状态变化
      authManager.onAuthStateChange((authState) => {
        if (authState.isAuthenticated && this.config.autoSync) {
          this.startAutoSync()
        } else {
          this.stopAutoSync()
        }
      })

      // 如果已认证且启用自动同步，开始同步
      if (authManager.isAuthenticated() && this.config.autoSync) {
        this.startAutoSync()
      }
    } catch (error) {
      console.error('Failed to initialize sync manager:', error)
    }
  }

  /**
   * 设置网络状态监控
   */
  private setupNetworkMonitoring(): void {
    // 监听在线/离线状态
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        if (authManager.isAuthenticated() && this.config.autoSync) {
          this.sync() // 网络恢复时立即同步
        }
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
        this.updateSyncState({ status: 'offline' })
      })

      this.isOnline = navigator.onLine
    }
  }

  /**
   * 执行完整同步
   */
  async sync(): Promise<SyncResult> {
    if (!authManager.isAuthenticated()) {
      throw new SyncError('Not authenticated', 'auth')
    }

    if (!this.isOnline) {
      throw new SyncError('Network unavailable', 'network')
    }

    this.updateSyncState({ status: 'syncing', lastError: null })

    try {
      // 获取本地数据
      const localData = await this.getLocalData()
      
      // 获取远程数据
      const remoteData = await this.getRemoteData()

      // 检测冲突
      const conflicts = this.detectConflicts(localData, remoteData)

      if (conflicts.length > 0) {
        this.updateSyncState({ 
          status: 'conflict', 
          conflictCount: conflicts.length 
        })
        
        return {
          success: false,
          conflicts,
          lastSyncTime: new Date(),
          syncedRecords: 0,
          error: `发现 ${conflicts.length} 个数据冲突，需要手动解决`
        }
      }

      // 合并数据
      const mergedData = this.mergeData(localData, remoteData)

      // 保存到本地和远程
      await Promise.all([
        this.saveLocalData(mergedData),
        this.saveRemoteData(mergedData)
      ])

      // 更新同步状态
      const now = new Date()
      this.updateSyncState({
        status: 'success',
        lastSyncTime: now,
        pendingChanges: false,
        conflictCount: 0
      })

      // 保存状态到存储
      await this.saveSyncState()

      return {
        success: true,
        conflicts: [],
        lastSyncTime: now,
        syncedRecords: mergedData.habits.length
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失败'
      
      this.updateSyncState({ 
        status: 'error',
        lastError: errorMessage
      })

      if (error instanceof SyncError) {
        throw error
      }

      throw new SyncError(errorMessage, 'storage')
    }
  }

  /**
   * 推送本地数据到远程
   */
  async push(data?: HabitsData): Promise<void> {
    if (!authManager.isAuthenticated()) {
      throw new SyncError('Not authenticated', 'auth')
    }

    const dataToSync = data || await this.getLocalData()
    await this.saveRemoteData(dataToSync)
    
    this.updateSyncState({ pendingChanges: false })
  }

  /**
   * 从远程拉取数据
   */
  async pull(): Promise<HabitsData> {
    if (!authManager.isAuthenticated()) {
      throw new SyncError('Not authenticated', 'auth')
    }

    const remoteData = await this.getRemoteData()
    await this.saveLocalData(remoteData)
    
    return remoteData
  }

  /**
   * 检测数据冲突
   */
  detectConflicts(local: HabitsData, remote: HabitsData): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []

    // 创建习惯ID映射
    const localHabits = new Map(local.habits.map(h => [h.id, h]))
    const remoteHabits = new Map(remote.habits.map(h => [h.id, h]))

    // 检查所有习惯ID
    const allIds = new Set([...localHabits.keys(), ...remoteHabits.keys()])

    for (const id of allIds) {
      const localHabit = localHabits.get(id)
      const remoteHabit = remoteHabits.get(id)

      if (!localHabit && remoteHabit) {
        // 远程有，本地没有（可能是其他设备添加的）
        continue // 这不是冲突，直接合并
      } else if (localHabit && !remoteHabit) {
        // 本地有，远程没有（可能是其他设备删除的）
        continue // 这不是冲突，直接合并
      } else if (localHabit && remoteHabit) {
        // 两边都有，检查是否有冲突
        if (this.hasConflict(localHabit, remoteHabit)) {
          conflicts.push({
            id,
            type: 'modify',
            local: localHabit,
            remote: remoteHabit,
            timestamp: {
              local: localHabit.updatedAt || localHabit.createdAt,
              remote: remoteHabit.updatedAt || remoteHabit.createdAt
            }
          })
        }
      }
    }

    return conflicts
  }

  /**
   * 检查两个习惯项是否有冲突
   */
  private hasConflict(local: HabitItem, remote: HabitItem): boolean {
    // 如果文本内容不同
    if (local.text !== remote.text) return true
    
    // 如果完成状态不同且修改时间接近（可能是并发修改）
    if (local.completed !== remote.completed) {
      const localTime = new Date(local.updatedAt || local.createdAt).getTime()
      const remoteTime = new Date(remote.updatedAt || remote.createdAt).getTime()
      const timeDiff = Math.abs(localTime - remoteTime)
      
      // 如果修改时间相差小于1小时，认为是冲突
      return timeDiff < 60 * 60 * 1000
    }

    return false
  }

  /**
   * 合并本地和远程数据
   */
  private mergeData(local: HabitsData, remote: HabitsData): HabitsData {
    const localHabits = new Map(local.habits.map(h => [h.id, h]))
    const remoteHabits = new Map(remote.habits.map(h => [h.id, h]))
    const mergedHabits: HabitItem[] = []

    // 获取删除记录
    const deletedIds = this.getDeletedHabitsIds()

    // 获取所有习惯ID
    const allIds = new Set([...localHabits.keys(), ...remoteHabits.keys()])

    for (const id of allIds) {
      const localHabit = localHabits.get(id)
      const remoteHabit = remoteHabits.get(id)

      // 如果这个ID在删除列表中，跳过（真正删除）
      if (deletedIds.has(id)) {
        continue
      }

      if (localHabit && remoteHabit) {
        // 两边都有，选择较新的
        const localTime = new Date(localHabit.updatedAt || localHabit.createdAt).getTime()
        const remoteTime = new Date(remoteHabit.updatedAt || remoteHabit.createdAt).getTime()
        
        mergedHabits.push(localTime >= remoteTime ? localHabit : remoteHabit)
      } else if (localHabit) {
        // 只有本地有（新增的本地习惯）
        mergedHabits.push(localHabit)
      } else if (remoteHabit) {
        // 只有远程有，需要判断：
        // 1. 如果远程数据比上次同步新，认为是远程新增
        // 2. 如果远程数据比较旧，可能是本地删除的，需要检查删除时间
        const remoteTime = new Date(remoteHabit.updatedAt || remoteHabit.createdAt).getTime()
        const lastSyncTime = new Date(local.lastSync || 0).getTime()
        
        if (remoteTime > lastSyncTime) {
          // 远程新增的习惯，添加到本地
          mergedHabits.push(remoteHabit)
        } else {
          // 可能是本地已删除的老数据，检查删除记录
          if (!this.wasRecentlyDeleted(id)) {
            // 如果不在最近删除列表中，保留远程数据（避免数据丢失）
            mergedHabits.push(remoteHabit)
          }
        }
      }
    }

    // 清理过期的删除记录
    this.cleanupDeletedIds()

    // 返回合并后的数据，使用较新的元数据
    const localTime = new Date(local.lastSync).getTime()
    const remoteTime = new Date(remote.lastSync).getTime()
    const newerMeta = localTime >= remoteTime ? local : remote

    return {
      ...newerMeta,
      habits: mergedHabits.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
      lastSync: new Date().toISOString()
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflicts(
    conflicts: ConflictInfo[], 
    resolutions: ConflictResolution[]
  ): Promise<HabitsData> {
    if (conflicts.length !== resolutions.length) {
      throw new Error('冲突数量与解决方案数量不匹配')
    }

    const localData = await this.getLocalData()
    const remoteData = await this.getRemoteData()
    
    // 应用冲突解决方案
    const resolvedHabits = new Map(localData.habits.map(h => [h.id, h]))

    for (let i = 0; i < conflicts.length; i++) {
      const conflict = conflicts[i]
      const resolution = resolutions[i]

      switch (resolution) {
        case 'local':
          // 保持本地版本
          break
        case 'remote':
          // 使用远程版本
          if (conflict.remote) {
            resolvedHabits.set(conflict.id, conflict.remote)
          } else {
            resolvedHabits.delete(conflict.id)
          }
          break
        case 'merge':
          // 智能合并（如果可能）
          if (conflict.local && conflict.remote) {
            const merged = this.mergeHabitItems(conflict.local, conflict.remote)
            resolvedHabits.set(conflict.id, merged)
          }
          break
      }
    }

    const resolvedData: HabitsData = {
      ...localData,
      habits: Array.from(resolvedHabits.values()),
      lastSync: new Date().toISOString()
    }

    // 保存解决后的数据
    await Promise.all([
      this.saveLocalData(resolvedData),
      this.saveRemoteData(resolvedData)
    ])

    this.updateSyncState({
      status: 'success',
      conflictCount: 0,
      lastSyncTime: new Date()
    })

    return resolvedData
  }

  /**
   * 合并两个习惯项
   */
  private mergeHabitItems(local: HabitItem, remote: HabitItem): HabitItem {
    const localTime = new Date(local.updatedAt || local.createdAt).getTime()
    const remoteTime = new Date(remote.updatedAt || remote.createdAt).getTime()

    // 使用较新的修改时间作为基准
    const newer = localTime >= remoteTime ? local : remote
    const older = localTime >= remoteTime ? remote : local

    return {
      ...newer,
      // 如果文本不同，优先使用较新的
      text: newer.text || older.text,
      // 完成状态使用较新的
      completed: newer.completed,
      // 隐藏状态使用较新的
      hidden: newer.hidden,
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 获取本地数据
   */
  private async getLocalData(): Promise<HabitsData> {
    try {
      // 从localStorage读取当前数据格式
      const todosString = localStorage.getItem('dailyTodos')
      const lastResetDate = localStorage.getItem('lastResetDate') || new Date().toDateString()

      if (todosString) {
        const todos = JSON.parse(todosString) as Array<{
          id: string
          text: string
          completed: boolean
          hidden?: boolean
          createdAt: string
        }>

        const habits: HabitItem[] = todos.map(todo => ({
          id: todo.id,
          text: todo.text,
          completed: todo.completed,
          hidden: todo.hidden || false,
          createdAt: todo.createdAt,
          updatedAt: todo.createdAt // 如果没有更新时间，使用创建时间
        }))

        return {
          version: '1.0',
          lastSync: new Date().toISOString(),
          lastResetDate,
          habits,
          settings: {
            theme: 'light',
            autoSync: this.config.autoSync,
            syncInterval: this.config.syncInterval,
            encryptionEnabled: true
          }
        }
      }

      // 返回默认数据
      return this.getDefaultHabitsData()
    } catch (error) {
      console.error('Failed to get local data:', error)
      return this.getDefaultHabitsData()
    }
  }

  /**
   * 获取远程数据
   */
  private async getRemoteData(): Promise<HabitsData> {
    const client = authManager.getClient()
    const user = authManager.getUser()
    const repo = authManager.getRepository()

    if (!user || !repo) {
      throw new SyncError('User or repository not found', 'auth')
    }

    try {
      return await client.readHabitsData(user.login, repo.name)
    } catch (error) {
      console.error('Failed to get remote data:', error)
      // 如果远程文件不存在，返回默认数据
      return this.getDefaultHabitsData()
    }
  }

  /**
   * 保存本地数据
   */
  private async saveLocalData(data: HabitsData): Promise<void> {
    try {
      // 转换为原来的格式保存到localStorage
      const todos = data.habits.map(habit => ({
        id: habit.id,
        text: habit.text,
        completed: habit.completed,
        hidden: habit.hidden,
        createdAt: habit.createdAt
      }))

      localStorage.setItem('dailyTodos', JSON.stringify(todos))
      localStorage.setItem('lastResetDate', data.lastResetDate)

      // 同时保存完整数据到加密存储
      await secureStorage.setItem('habits_data', data, true)
    } catch (error) {
      throw new SyncError(`Failed to save local data: ${error}`, 'storage')
    }
  }

  /**
   * 保存远程数据
   */
  private async saveRemoteData(data: HabitsData): Promise<void> {
    const client = authManager.getClient()
    const user = authManager.getUser()
    const repo = authManager.getRepository()

    if (!user || !repo) {
      throw new SyncError('User or repository not found', 'auth')
    }

    try {
      // 尝试获取现有文件的SHA值
      let currentSha: string | undefined
      try {
        const fileInfo = await client.getFileContent(user.login, repo.name, 'data.json')
        currentSha = fileInfo.sha
      } catch (error) {
        // 文件不存在，不需要SHA（创建新文件）
        currentSha = undefined
      }

      await client.writeHabitsData(user.login, repo.name, data, currentSha)
    } catch (error) {
      throw new SyncError(`Failed to save remote data: ${error}`, 'network')
    }
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
        syncInterval: 300000,
        encryptionEnabled: true
      }
    }
  }

  /**
   * 更新同步状态
   */
  private updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates }
    this.notifyListeners()
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getSyncState())
      } catch (error) {
        console.error('Sync state listener error:', error)
      }
    })
  }

  /**
   * 保存同步状态
   */
  private async saveSyncState(): Promise<void> {
    try {
      await secureStorage.setItem('sync_state', this.syncState, true)
    } catch (error) {
      console.error('Failed to save sync state:', error)
    }
  }

  /**
   * 开始自动同步
   */
  private startAutoSync(): void {
    this.stopAutoSync() // 确保没有重复的定时器

    if (this.config.autoSync && this.config.syncInterval > 0) {
      this.syncTimer = setInterval(() => {
        if (authManager.isAuthenticated() && this.isOnline) {
          this.sync().catch(error => {
            console.error('Auto sync failed:', error)
          })
        }
      }, this.config.syncInterval)
    }
  }

  /**
   * 停止自动同步
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  // 删除跟踪方法

  /**
   * 获取已删除的习惯ID集合
   */
  private getDeletedHabitsIds(): Set<string> {
    try {
      const deletedIds = localStorage.getItem('deleted_habits')
      if (!deletedIds) return new Set()
      
      const data = JSON.parse(deletedIds) as Array<{id: string, deletedAt: string}>
      return new Set(data.map(item => item.id))
    } catch {
      return new Set()
    }
  }

  /**
   * 检查习惯是否最近被删除（7天内）
   */
  private wasRecentlyDeleted(id: string): boolean {
    try {
      const deletedIds = localStorage.getItem('deleted_habits')
      if (!deletedIds) return false
      
      const data = JSON.parse(deletedIds) as Array<{id: string, deletedAt: string}>
      const deletedItem = data.find(item => item.id === id)
      
      if (!deletedItem) return false
      
      const deletedTime = new Date(deletedItem.deletedAt).getTime()
      const now = Date.now()
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
      
      return deletedTime > sevenDaysAgo
    } catch {
      return false
    }
  }

  /**
   * 清理过期的删除记录（超过7天）
   */
  private cleanupDeletedIds(): void {
    try {
      const deletedIds = localStorage.getItem('deleted_habits')
      if (!deletedIds) return
      
      const data = JSON.parse(deletedIds) as Array<{id: string, deletedAt: string}>
      const now = Date.now()
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
      
      const validDeletes = data.filter(item => {
        const deletedTime = new Date(item.deletedAt).getTime()
        return deletedTime > sevenDaysAgo
      })
      
      if (validDeletes.length !== data.length) {
        localStorage.setItem('deleted_habits', JSON.stringify(validDeletes))
      }
    } catch (error) {
      console.error('Failed to cleanup deleted IDs:', error)
    }
  }

  /**
   * 标记习惯为已删除
   */
  markHabitAsDeleted(id: string): void {
    try {
      const deletedIds = localStorage.getItem('deleted_habits')
      const data = deletedIds ? JSON.parse(deletedIds) : []
      
      // 检查是否已存在
      const existingIndex = data.findIndex((item: any) => item.id === id)
      
      if (existingIndex === -1) {
        // 添加新的删除记录
        data.push({
          id,
          deletedAt: new Date().toISOString()
        })
        
        localStorage.setItem('deleted_habits', JSON.stringify(data))
        console.log(`Marked habit ${id} as deleted`)
      }
    } catch (error) {
      console.error('Failed to mark habit as deleted:', error)
    }
  }

  // 公共方法

  /**
   * 获取同步状态
   */
  getSyncState(): SyncState {
    return { ...this.syncState }
  }

  /**
   * 监听同步状态变化
   */
  onSyncStateChange(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener)
    
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 设置同步配置
   */
  async setConfig(config: Partial<SyncConfig>): Promise<void> {
    this.config = { ...this.config, ...config }
    await secureStorage.setItem('sync_config', this.config, true)

    // 重新启动自动同步
    if (authManager.isAuthenticated()) {
      this.startAutoSync()
    }
  }

  /**
   * 获取同步配置
   */
  getConfig(): SyncConfig {
    return { ...this.config }
  }

  /**
   * 标记有待同步的更改
   */
  markPendingChanges(): void {
    this.updateSyncState({ pendingChanges: true })
  }

  /**
   * 手动触发同步
   */
  async manualSync(): Promise<SyncResult> {
    return this.sync()
  }

  /**
   * 获取网络状态
   */
  isNetworkAvailable(): boolean {
    return this.isOnline
  }
}

// 导出单例实例
export const syncManager = SyncManager.getInstance()

// 导出类型
export { SyncManager }
export type { SyncConfig, SyncState }
