// UTF-8编码工具函数 - 确保中文字符正确处理

/**
 * 将字符串编码为Base64（支持中文）
 */
export function encodeUTF8ToBase64(text: string): string {
  try {
    // 使用现代TextEncoder API
    const utf8Bytes = new TextEncoder().encode(text)
    return btoa(String.fromCharCode(...utf8Bytes))
  } catch (error) {
    // 降级到传统方法
    return btoa(unescape(encodeURIComponent(text)))
  }
}

/**
 * 将Base64解码为字符串（支持中文）
 */
export function decodeBase64ToUTF8(base64: string): string {
  try {
    // 移除可能的换行符
    const cleanBase64 = base64.replace(/\n/g, '')
    
    // 使用现代TextDecoder API
    const binaryString = atob(cleanBase64)
    const utf8Bytes = new Uint8Array(binaryString.length)
    
    for (let i = 0; i < binaryString.length; i++) {
      utf8Bytes[i] = binaryString.charCodeAt(i)
    }
    
    return new TextDecoder('utf-8').decode(utf8Bytes)
  } catch (error) {
    // 降级到传统方法
    try {
      return decodeURIComponent(escape(atob(base64)))
    } catch (fallbackError) {
      throw new Error(`Failed to decode Base64: ${error}`)
    }
  }
}

/**
 * 测试编码解码是否正确
 */
export function testEncoding(): boolean {
  const testStrings = [
    '测试中文编码',
    '🎯 日拱一足',
    '心外无物，此心光明',
    'English text with 中文 mixed',
    '特殊字符：！@#￥%……&*（）',
    '👨‍💻 Emoji with text 💡'
  ]

  for (const testString of testStrings) {
    try {
      const encoded = encodeUTF8ToBase64(testString)
      const decoded = decodeBase64ToUTF8(encoded)
      
      if (decoded !== testString) {
        console.error(`Encoding test failed for: ${testString}`)
        console.error(`Expected: ${testString}`)
        console.error(`Got: ${decoded}`)
        return false
      }
    } catch (error) {
      console.error(`Encoding error for: ${testString}`, error)
      return false
    }
  }

  console.log('✅ All encoding tests passed!')
  return true
}

/**
 * 修复已损坏的中文数据
 */
export function fixCorruptedText(corruptedText: string): string {
  try {
    // 尝试检测是否是错误编码的结果
    if (corruptedText.includes('â') || corruptedText.includes('Ã')) {
      // 可能是UTF-8被当作ISO-8859-1解码的结果
      const bytes = new TextEncoder().encode(corruptedText)
      return new TextDecoder('utf-8').decode(bytes)
    }
    
    return corruptedText
  } catch (error) {
    console.warn('Failed to fix corrupted text:', error)
    return corruptedText
  }
}

/**
 * 验证字符串是否包含有效的UTF-8字符
 */
export function isValidUTF8(text: string): boolean {
  try {
    // 尝试编码再解码，如果相同则是有效的UTF-8
    const encoded = new TextEncoder().encode(text)
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded)
    return decoded === text
  } catch (error) {
    return false
  }
}

