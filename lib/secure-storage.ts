// 安全存储模块 - 使用Web Crypto API实现AES-256加密

import { EncryptionError } from './types'

interface EncryptedData {
  iv: number[]
  data: number[]
}

class SecureStorage {
  private static instance: SecureStorage
  private keyCache: CryptoKey | null = null
  private fingerprintCache: string | null = null

  private constructor() {}

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage()
    }
    return SecureStorage.instance
  }

  /**
   * 生成设备指纹
   */
  async generateDeviceFingerprint(): Promise<string> {
    if (this.fingerprintCache) {
      return this.fingerprintCache
    }

    try {
      const components = [
        navigator.userAgent,
        navigator.language,
        `${screen.width}x${screen.height}`,
        new Date().getTimezoneOffset().toString(),
        navigator.hardwareConcurrency?.toString() || '0',
        navigator.platform,
        // 添加一些随机性，但保持在同一设备上的一致性
        localStorage.getItem('device-id') || this.generateDeviceId()
      ]

      const fingerprint = components.join('|')
      const encoder = new TextEncoder()
      const hash = await crypto.subtle.digest('SHA-256', encoder.encode(fingerprint))
      
      this.fingerprintCache = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      return this.fingerprintCache
    } catch (error) {
      throw new EncryptionError(`Failed to generate device fingerprint: ${error}`)
    }
  }

  /**
   * 生成设备ID（首次访问时创建）
   */
  private generateDeviceId(): string {
    const deviceId = crypto.randomUUID()
    localStorage.setItem('device-id', deviceId)
    return deviceId
  }

  /**
   * 基于设备指纹生成加密密钥
   */
  private async generateKey(seed?: string): Promise<CryptoKey> {
    if (this.keyCache && !seed) {
      return this.keyCache
    }

    try {
      const fingerprint = await this.generateDeviceFingerprint()
      const keyMaterial = seed ? `${fingerprint}-${seed}` : fingerprint
      
      const encoder = new TextEncoder()
      const importedKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(keyMaterial),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      )

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('daily-habits-salt-2024'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        importedKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )

      if (!seed) {
        this.keyCache = key
      }

      return key
    } catch (error) {
      throw new EncryptionError(`Failed to generate encryption key: ${error}`)
    }
  }

  /**
   * 加密数据
   */
  async encrypt(data: string, seed?: string): Promise<string> {
    try {
      const key = await this.generateKey(seed)
      const encoder = new TextEncoder()
      const plaintext = encoder.encode(data)
      const iv = crypto.getRandomValues(new Uint8Array(12))

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        plaintext
      )

      const encryptedData: EncryptedData = {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted))
      }

      return btoa(JSON.stringify(encryptedData))
    } catch (error) {
      throw new EncryptionError(`Encryption failed: ${error}`)
    }
  }

  /**
   * 解密数据
   */
  async decrypt(encryptedString: string, seed?: string): Promise<string> {
    try {
      const key = await this.generateKey(seed)
      const encryptedData: EncryptedData = JSON.parse(atob(encryptedString))
      
      const iv = new Uint8Array(encryptedData.iv)
      const data = new Uint8Array(encryptedData.data)

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      )

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      throw new EncryptionError(`Decryption failed: ${error}`)
    }
  }

  /**
   * 安全存储项目
   */
  async setItem(key: string, value: any, encrypt: boolean = true): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      
      if (encrypt) {
        const encryptedValue = await this.encrypt(serializedValue)
        localStorage.setItem(`encrypted_${key}`, encryptedValue)
      } else {
        localStorage.setItem(key, serializedValue)
      }
    } catch (error) {
      throw new EncryptionError(`Failed to store item: ${error}`)
    }
  }

  /**
   * 安全获取项目
   */
  async getItem<T>(key: string, encrypted: boolean = true): Promise<T | null> {
    try {
      const storageKey = encrypted ? `encrypted_${key}` : key
      const storedValue = localStorage.getItem(storageKey)
      
      if (!storedValue) {
        return null
      }

      if (encrypted) {
        const decryptedValue = await this.decrypt(storedValue)
        return JSON.parse(decryptedValue)
      } else {
        return JSON.parse(storedValue)
      }
    } catch (error) {
      console.warn(`Failed to retrieve item ${key}:`, error)
      return null
    }
  }

  /**
   * 删除项目
   */
  removeItem(key: string, encrypted: boolean = true): void {
    const storageKey = encrypted ? `encrypted_${key}` : key
    localStorage.removeItem(storageKey)
  }

  /**
   * 清除所有加密数据
   */
  clearAll(): void {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('encrypted_')
    )
    
    keys.forEach(key => localStorage.removeItem(key))
    this.keyCache = null
    this.fingerprintCache = null
  }

  /**
   * 验证加密功能是否可用
   */
  async testEncryption(): Promise<boolean> {
    try {
      const testData = 'test-encryption-' + Date.now()
      const encrypted = await this.encrypt(testData)
      const decrypted = await this.decrypt(encrypted)
      return testData === decrypted
    } catch {
      return false
    }
  }

  /**
   * 获取存储大小信息
   */
  getStorageInfo(): { used: number; available: number } {
    try {
      const test = 'test'
      let used = 0
      
      // 估算已使用空间
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }

      // 测试可用空间（简单估算）
      let available = 0
      try {
        const testKey = 'storage-test'
        const testValue = 'x'.repeat(1024) // 1KB
        let testSize = 1024
        
        while (testSize < 10 * 1024 * 1024) { // 最多测试10MB
          try {
            localStorage.setItem(testKey, 'x'.repeat(testSize))
            localStorage.removeItem(testKey)
            available = testSize
            testSize *= 2
          } catch {
            break
          }
        }
      } catch {
        available = 5 * 1024 * 1024 // 默认5MB
      }

      return { used, available }
    } catch {
      return { used: 0, available: 5 * 1024 * 1024 }
    }
  }
}

// 导出单例实例
export const secureStorage = SecureStorage.getInstance()

// 导出类型和错误
export { SecureStorage, EncryptionError }
