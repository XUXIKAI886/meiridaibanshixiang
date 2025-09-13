// 编码测试工具 - 验证中文字符处理是否正确

/**
 * 传统方法编码（经过验证的可靠方式）
 */
export function encodeToBase64Traditional(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
}

/**
 * 传统方法解码（经过验证的可靠方式）
 */
export function decodeFromBase64Traditional(base64: string): string {
  return decodeURIComponent(escape(atob(base64.replace(/\n/g, ''))))
}

/**
 * 现代方法编码
 */
export function encodeToBase64Modern(text: string): string {
  const utf8Bytes = new TextEncoder().encode(text)
  let binaryString = ''
  for (let i = 0; i < utf8Bytes.length; i++) {
    binaryString += String.fromCharCode(utf8Bytes[i])
  }
  return btoa(binaryString)
}

/**
 * 现代方法解码
 */
export function decodeFromBase64Modern(base64: string): string {
  const binaryString = atob(base64.replace(/\n/g, ''))
  const utf8Bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    utf8Bytes[i] = binaryString.charCodeAt(i)
  }
  return new TextDecoder().decode(utf8Bytes)
}

/**
 * 测试用例
 */
const testCases = [
  '测试中文编码',
  '心外无物，此心光明',
  '日拱一足',
  '🎯 完成每日任务',
  '特殊字符：！@#￥%……&*（）',
  '混合文本 English with 中文',
  '空格和标点符号：。，；：？！',
  '数字和中文：123测试456',
  '长文本：这是一个很长的中文测试文本，包含了各种标点符号和特殊字符，用来验证编码解码的正确性。',
  ''  // 空字符串
]

/**
 * 运行所有测试
 */
export function runEncodingTests(): void {
  console.log('🧪 开始编码测试...\n')
  
  let traditionalPassed = 0
  let modernPassed = 0
  
  testCases.forEach((testCase, index) => {
    console.log(`测试用例 ${index + 1}: "${testCase}"`)
    
    // 测试传统方法
    try {
      const encoded1 = encodeToBase64Traditional(testCase)
      const decoded1 = decodeFromBase64Traditional(encoded1)
      
      if (decoded1 === testCase) {
        console.log('  ✅ 传统方法: 通过')
        traditionalPassed++
      } else {
        console.log('  ❌ 传统方法: 失败')
        console.log(`    期望: "${testCase}"`)
        console.log(`    实际: "${decoded1}"`)
      }
    } catch (error) {
      console.log('  ❌ 传统方法: 异常', error)
    }
    
    // 测试现代方法
    try {
      const encoded2 = encodeToBase64Modern(testCase)
      const decoded2 = decodeFromBase64Modern(encoded2)
      
      if (decoded2 === testCase) {
        console.log('  ✅ 现代方法: 通过')
        modernPassed++
      } else {
        console.log('  ❌ 现代方法: 失败')
        console.log(`    期望: "${testCase}"`)
        console.log(`    实际: "${decoded2}"`)
      }
    } catch (error) {
      console.log('  ❌ 现代方法: 异常', error)
    }
    
    console.log('')
  })
  
  console.log('📊 测试结果汇总:')
  console.log(`传统方法: ${traditionalPassed}/${testCases.length} 通过`)
  console.log(`现代方法: ${modernPassed}/${testCases.length} 通过`)
  
  if (traditionalPassed === testCases.length) {
    console.log('✅ 推荐使用传统方法（btoa + unescape + encodeURIComponent）')
  } else if (modernPassed === testCases.length) {
    console.log('✅ 推荐使用现代方法（TextEncoder/TextDecoder）')
  } else {
    console.log('⚠️ 两种方法都有问题，需要进一步调试')
  }
}

/**
 * 测试特定字符串的编码
 */
export function testSpecificString(text: string): void {
  console.log(`🔍 测试字符串: "${text}"`)
  
  const traditional = {
    encoded: encodeToBase64Traditional(text),
    decoded: ''
  }
  
  const modern = {
    encoded: encodeToBase64Modern(text),
    decoded: ''
  }
  
  try {
    traditional.decoded = decodeFromBase64Traditional(traditional.encoded)
  } catch (e) {
    traditional.decoded = '解码失败: ' + e
  }
  
  try {
    modern.decoded = decodeFromBase64Modern(modern.encoded)
  } catch (e) {
    modern.decoded = '解码失败: ' + e
  }
  
  console.log('传统方法:')
  console.log(`  编码: ${traditional.encoded}`)
  console.log(`  解码: ${traditional.decoded}`)
  console.log(`  正确: ${traditional.decoded === text}`)
  
  console.log('现代方法:')
  console.log(`  编码: ${modern.encoded}`)
  console.log(`  解码: ${modern.decoded}`)
  console.log(`  正确: ${modern.decoded === text}`)
}

// 如果在浏览器控制台中运行
if (typeof window !== 'undefined') {
  (window as any).runEncodingTests = runEncodingTests;
  (window as any).testSpecificString = testSpecificString;
  console.log('💡 可以在控制台中运行:');
  console.log('  runEncodingTests() - 运行所有测试');
  console.log('  testSpecificString("你的测试文本") - 测试特定字符串');
}

