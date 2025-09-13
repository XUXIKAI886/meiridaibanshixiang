// 数据迁移工具 - 本地数据迁移到云端

import { syncManager } from './sync-manager'
import { authManager } from './auth-manager'
import { HabitsData, HabitItem } from './types'

interface MigrationResult {
  success: boolean
  migratedCount: number
  error?: string
}

class DataMigration {
  /**
   * 检查是否有本地数据需要迁移
   */
  static hasLocalData(): boolean {
    try {
      const todos = localStorage.getItem('dailyTodos')
      return !!(todos && JSON.parse(todos).length > 0)
    } catch {
      return false
    }
  }

  /**
   * 获取本地数据统计
   */
  static getLocalDataStats(): { count: number; oldestDate: string | null } {
    try {
      const todos = localStorage.getItem('dailyTodos')
      if (!todos) return { count: 0, oldestDate: null }

      const parsedTodos = JSON.parse(todos) as Array<{
        id: string
        text: string
        completed: boolean
        hidden?: boolean
        createdAt: string
      }>

      const count = parsedTodos.length
      const oldestDate = parsedTodos.reduce((oldest, todo) => {
        const todoDate = new Date(todo.createdAt)
        return !oldest || todoDate < new Date(oldest) ? todo.createdAt : oldest
      }, null as string | null)

      return { count, oldestDate }
    } catch {
      return { count: 0, oldestDate: null }
    }
  }

  /**
   * 执行数据迁移
   */
  static async migrateLocalData(): Promise<MigrationResult> {
    try {
      if (!authManager.isAuthenticated()) {
        throw new Error('用户未认证，无法执行迁移')
      }

      if (!this.hasLocalData()) {
        return {
          success: true,
          migratedCount: 0
        }
      }

      // 获取本地数据
      const localData = this.getLocalHabitsData()
      
      // 检查云端是否已有数据
      const remoteData = await this.getRemoteData()
      
      if (remoteData.habits.length > 0) {
        // 云端已有数据，执行合并
        const mergedData = this.mergeLocalAndRemote(localData, remoteData)
        await syncManager.push(mergedData)
        
        return {
          success: true,
          migratedCount: localData.habits.length
        }
      } else {
        // 云端没有数据，直接推送本地数据
        await syncManager.push(localData)
        
        return {
          success: true,
          migratedCount: localData.habits.length
        }
      }
    } catch (error) {
      console.error('Data migration failed:', error)
      
      return {
        success: false,
        migratedCount: 0,
        error: error instanceof Error ? error.message : '迁移失败'
      }
    }
  }

  /**
   * 获取本地习惯数据
   */
  private static getLocalHabitsData(): HabitsData {
    try {
      const todosString = localStorage.getItem('dailyTodos')
      const lastResetDate = localStorage.getItem('lastResetDate') || new Date().toDateString()

      const habits: HabitItem[] = []

      if (todosString) {
        const todos = JSON.parse(todosString) as Array<{
          id: string
          text: string
          completed: boolean
          hidden?: boolean
          createdAt: string
        }>

        habits.push(...todos.map(todo => ({
          id: todo.id,
          text: todo.text,
          completed: todo.completed,
          hidden: todo.hidden || false,
          createdAt: todo.createdAt,
          updatedAt: todo.createdAt // 如果没有更新时间，使用创建时间
        })))
      }

      return {
        version: '1.0',
        lastSync: new Date().toISOString(),
        lastResetDate,
        habits,
        settings: {
          theme: 'light',
          autoSync: true,
          syncInterval: 300000,
          encryptionEnabled: true
        }
      }
    } catch (error) {
      console.error('Failed to get local habits data:', error)
      return this.getDefaultHabitsData()
    }
  }

  /**
   * 获取远程数据
   */
  private static async getRemoteData(): Promise<HabitsData> {
    try {
      const client = authManager.getClient()
      const user = authManager.getUser()
      const repo = authManager.getRepository()

      if (!user || !repo) {
        throw new Error('用户或仓库信息不存在')
      }

      return await client.readHabitsData(user.login, repo.name)
    } catch (error) {
      // 如果远程文件不存在，返回默认数据
      return this.getDefaultHabitsData()
    }
  }

  /**
   * 合并本地和远程数据
   */
  private static mergeLocalAndRemote(local: HabitsData, remote: HabitsData): HabitsData {
    const localHabits = new Map(local.habits.map(h => [h.id, h]))
    const remoteHabits = new Map(remote.habits.map(h => [h.id, h]))
    const mergedHabits: HabitItem[] = []

    // 获取所有习惯ID
    const allIds = new Set([...localHabits.keys(), ...remoteHabits.keys()])

    for (const id of allIds) {
      const localHabit = localHabits.get(id)
      const remoteHabit = remoteHabits.get(id)

      if (localHabit && remoteHabit) {
        // 两边都有，选择较新的（本地优先，因为这是迁移操作）
        mergedHabits.push(localHabit)
      } else if (localHabit) {
        // 只有本地有
        mergedHabits.push(localHabit)
      } else if (remoteHabit) {
        // 只有远程有
        mergedHabits.push(remoteHabit)
      }
    }

    return {
      version: '1.0',
      lastSync: new Date().toISOString(),
      lastResetDate: local.lastResetDate,
      habits: mergedHabits.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
      settings: {
        ...remote.settings,
        ...local.settings // 本地设置优先
      }
    }
  }

  /**
   * 获取默认习惯数据
   */
  private static getDefaultHabitsData(): HabitsData {
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
   * 清理本地数据（迁移后可选）
   */
  static clearLocalData(): void {
    try {
      localStorage.removeItem('dailyTodos')
      localStorage.removeItem('lastResetDate')
    } catch (error) {
      console.error('Failed to clear local data:', error)
    }
  }

  /**
   * 创建本地数据备份
   */
  static createLocalBackup(): string | null {
    try {
      const todos = localStorage.getItem('dailyTodos')
      const lastResetDate = localStorage.getItem('lastResetDate')
      
      if (!todos) return null

      const backup = {
        todos: JSON.parse(todos),
        lastResetDate,
        timestamp: new Date().toISOString()
      }

      const backupString = JSON.stringify(backup, null, 2)
      
      // 可以保存到文件或返回给用户
      return backupString
    } catch (error) {
      console.error('Failed to create local backup:', error)
      return null
    }
  }

  /**
   * 从备份恢复本地数据
   */
  static restoreFromBackup(backupString: string): boolean {
    try {
      const backup = JSON.parse(backupString)
      
      if (backup.todos && Array.isArray(backup.todos)) {
        localStorage.setItem('dailyTodos', JSON.stringify(backup.todos))
        
        if (backup.lastResetDate) {
          localStorage.setItem('lastResetDate', backup.lastResetDate)
        }
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to restore from backup:', error)
      return false
    }
  }
}

export { DataMigration }
export type { MigrationResult }
