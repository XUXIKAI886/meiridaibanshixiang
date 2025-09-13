// 修复已损坏的中文数据工具

import { syncManager } from './sync-manager'
import { authManager } from './auth-manager'
import { HabitsData, HabitItem } from './types'

/**
 * 检测文本是否是损坏的中文（乱码）
 */
export function isCorruptedChinese(text: string): boolean {
  // 检测常见的乱码模式
  const corruptedPatterns = [
    /â[±¿]/g,  // â± â¿ 等
    /æ[^a-zA-Z]/g,  // æ 后跟非英文字符
    /ã/g,  // ã 字符
    /Ã/g,  // Ã 字符
    /â€/g, // â€ 模式
    /Â/g   // Â 字符
  ]
  
  return corruptedPatterns.some(pattern => pattern.test(text))
}

/**
 * 尝试修复损坏的中文文本
 */
export function fixCorruptedText(corruptedText: string): string {
  if (!corruptedText || !isCorruptedChinese(corruptedText)) {
    return corruptedText
  }
  
  try {
    // 方法1: 尝试重新编码
    const bytes = new TextEncoder().encode(corruptedText)
    const fixed1 = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    if (!isCorruptedChinese(fixed1)) {
      return fixed1
    }
    
    // 方法2: 尝试不同的字符集解码
    const latin1Bytes = corruptedText.split('').map(char => char.charCodeAt(0))
    const utf8Bytes = new Uint8Array(latin1Bytes)
    const fixed2 = new TextDecoder('utf-8', { fatal: false }).decode(utf8Bytes)
    if (!isCorruptedChinese(fixed2)) {
      return fixed2
    }
    
    // 方法3: 手动映射常见乱码
    let fixed3 = corruptedText
    const mappings: { [key: string]: string } = {
      'â±': '习',
      'â¿': '惯', 
      'æ': '每',
      'ã': '天',
      'Ã': '任',
      'â€': '务',
      'Â': ' '
    }
    
    for (const [corrupted, correct] of Object.entries(mappings)) {
      fixed3 = fixed3.replace(new RegExp(corrupted, 'g'), correct)
    }
    
    if (fixed3 !== corruptedText) {
      return fixed3
    }
    
  } catch (error) {
    console.warn('Failed to fix corrupted text:', error)
  }
  
  return corruptedText
}

/**
 * 修复习惯项中的损坏文本
 */
export function fixCorruptedHabit(habit: HabitItem): HabitItem {
  return {
    ...habit,
    text: fixCorruptedText(habit.text)
  }
}

/**
 * 修复完整的习惯数据
 */
export function fixCorruptedHabitsData(data: HabitsData): HabitsData {
  return {
    ...data,
    habits: data.habits.map(fixCorruptedHabit)
  }
}

/**
 * 扫描并修复本地数据
 */
export function fixLocalData(): { fixed: boolean; count: number } {
  try {
    const todosString = localStorage.getItem('dailyTodos')
    if (!todosString) {
      return { fixed: false, count: 0 }
    }
    
    const todos = JSON.parse(todosString)
    let fixedCount = 0
    let hasChanges = false
    
    const fixedTodos = todos.map((todo: any) => {
      if (isCorruptedChinese(todo.text)) {
        const fixedText = fixCorruptedText(todo.text)
        if (fixedText !== todo.text) {
          fixedCount++
          hasChanges = true
          return { ...todo, text: fixedText }
        }
      }
      return todo
    })
    
    if (hasChanges) {
      localStorage.setItem('dailyTodos', JSON.stringify(fixedTodos))
      console.log(`✅ 修复了 ${fixedCount} 个损坏的习惯项`)
      return { fixed: true, count: fixedCount }
    }
    
    return { fixed: false, count: 0 }
  } catch (error) {
    console.error('修复本地数据失败:', error)
    return { fixed: false, count: 0 }
  }
}

/**
 * 扫描并修复云端数据
 */
export async function fixCloudData(): Promise<{ fixed: boolean; count: number }> {
  if (!authManager.isAuthenticated()) {
    throw new Error('未认证，无法修复云端数据')
  }
  
  try {
    // 获取云端数据
    const client = authManager.getClient()
    const user = authManager.getUser()
    const repo = authManager.getRepository()
    
    if (!user || !repo) {
      throw new Error('用户或仓库信息不存在')
    }
    
    const cloudData = await client.readHabitsData(user.login, repo.name)
    
    // 检查是否有损坏的数据
    let fixedCount = 0
    let hasChanges = false
    
    const fixedHabits = cloudData.habits.map(habit => {
      if (isCorruptedChinese(habit.text)) {
        const fixedText = fixCorruptedText(habit.text)
        if (fixedText !== habit.text) {
          fixedCount++
          hasChanges = true
          return { ...habit, text: fixedText }
        }
      }
      return habit
    })
    
    if (hasChanges) {
      const fixedData: HabitsData = {
        ...cloudData,
        habits: fixedHabits,
        lastSync: new Date().toISOString()
      }
      
      // 获取当前文件的SHA
      let currentSha: string | undefined
      try {
        const fileInfo = await client.getFileContent(user.login, repo.name, 'data.json')
        currentSha = fileInfo.sha
      } catch (error) {
        currentSha = undefined
      }
      
      await client.writeHabitsData(user.login, repo.name, fixedData, currentSha)
      console.log(`✅ 修复了云端 ${fixedCount} 个损坏的习惯项`)
      return { fixed: true, count: fixedCount }
    }
    
    return { fixed: false, count: 0 }
  } catch (error) {
    console.error('修复云端数据失败:', error)
    throw error
  }
}

/**
 * 完整的数据修复流程
 */
export async function fixAllCorruptedData(): Promise<{
  local: { fixed: boolean; count: number }
  cloud: { fixed: boolean; count: number }
}> {
  console.log('🔧 开始修复损坏的数据...')
  
  // 修复本地数据
  const localResult = fixLocalData()
  
  // 修复云端数据（如果已认证）
  let cloudResult = { fixed: false, count: 0 }
  if (authManager.isAuthenticated()) {
    try {
      cloudResult = await fixCloudData()
    } catch (error) {
      console.error('修复云端数据时出错:', error)
    }
  }
  
  // 如果有修复，重新同步
  if (localResult.fixed || cloudResult.fixed) {
    try {
      await syncManager.manualSync()
      console.log('✅ 数据修复完成并已重新同步')
    } catch (error) {
      console.error('重新同步失败:', error)
    }
  } else {
    console.log('✅ 没有发现需要修复的数据')
  }
  
  return { local: localResult, cloud: cloudResult }
}

// 如果在浏览器环境中，将函数暴露到全局作用域
if (typeof window !== 'undefined') {
  (window as any).fixAllCorruptedData = fixAllCorruptedData;
  (window as any).fixLocalData = fixLocalData;
  (window as any).fixCloudData = fixCloudData;
  (window as any).fixCorruptedText = fixCorruptedText;
  (window as any).isCorruptedChinese = isCorruptedChinese;
  
  console.log('💡 数据修复工具已加载，可以在控制台中运行:');
  console.log('  fixAllCorruptedData() - 修复所有损坏的数据');
  console.log('  fixLocalData() - 只修复本地数据');  
  console.log('  fixCloudData() - 只修复云端数据');
  console.log('  fixCorruptedText("乱码文本") - 测试修复特定文本');
}

