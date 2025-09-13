# 🔧 同步问题排查指南

## 常见同步错误解决方案

### 1. "sha" wasn't supplied 错误

#### 问题描述
在新设备上输入GitHub令牌后，同步时出现错误：
```
Failed to save remote data: GitHubAPIError: Invalid request. "sha" wasn't supplied.
```

#### 原因分析
- GitHub API在更新现有文件时需要当前文件的SHA值来防止冲突
- 新设备首次同步时，本地没有记录远程文件的SHA值
- 同步管理器尝试更新文件但未提供必要的SHA参数

#### 解决方案
已在 `lib/sync-manager.ts` 中修复此问题：

1. **自动获取SHA**: 在保存远程数据前，先获取现有文件的SHA值
2. **智能判断**: 如果文件不存在，则不需要SHA（创建新文件）
3. **安全更新**: 使用正确的SHA值更新现有文件

#### 修复代码
```typescript
// 修复前（会出错）
await client.writeHabitsData(user.login, repo.name, data)

// 修复后（正确处理）
let currentSha: string | undefined
try {
  const fileInfo = await client.getFileContent(user.login, repo.name, 'data.json')
  currentSha = fileInfo.sha
} catch (error) {
  currentSha = undefined // 文件不存在
}
await client.writeHabitsData(user.login, repo.name, data, currentSha)
```

### 2. 网络连接问题

#### 问题描述
显示"网络未连接"或同步超时

#### 解决方案
1. 检查网络连接
2. 确认GitHub服务状态
3. 检查防火墙设置
4. 等待自动重试（30秒后）

### 3. 认证失败

#### 问题描述
- 令牌无效
- 权限不足

#### 解决方案
1. **重新生成GitHub令牌**：
   - 访问 [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
   - 删除旧令牌，创建新的Classic Token
   - 确保选择 `repo` 权限

2. **重新配置**：
   - 清除当前认证信息
   - 输入新的令牌
   - 重新验证

### 4. 数据冲突

#### 问题描述
多设备间数据不一致，显示冲突状态

#### 解决方案
1. **查看冲突详情**：点击"立即解决"按钮
2. **选择解决策略**：
   - 使用本地版本
   - 使用云端版本
   - 智能合并
3. **确认解决**：应用选择的策略

### 5. 中文字符乱码

#### 问题描述
同步后中文显示为乱码，如：`â±â¿ææå¥½ææ©ææ¡æ¾â`

#### 原因分析
- GitHub API的Base64编码/解码处理中文字符时出现问题
- UTF-8字符被错误地编码或解码

#### 解决方案
已在 `lib/github-client.ts` 中修复此问题，同时提供数据修复工具：

##### 方案一：自动修复已损坏的数据（推荐）
```javascript
// 在浏览器控制台执行以下命令
fixAllCorruptedData().then(result => {
  console.log('修复结果:', result)
  // 页面会自动重新加载显示修复后的数据
  location.reload()
})
```

##### 方案二：分步修复
1. **修复本地数据**：
   ```javascript
   fixLocalData()  // 修复本地存储中的乱码
   ```

2. **修复云端数据**：
   ```javascript
   fixCloudData().then(result => {
     console.log('云端修复结果:', result)
   })
   ```

3. **重新同步**：
   ```javascript
   syncManager.manualSync().then(() => {
     console.log('重新同步完成')
     location.reload()
   })
   ```

##### 方案三：测试和验证
1. **测试编码功能**：
   ```javascript
   runEncodingTests()  // 验证编码解码是否正常
   ```

2. **测试特定文本**：
   ```javascript
   testSpecificString("测试中文编码")
   ```

3. **检查文本是否损坏**：
   ```javascript
   isCorruptedChinese("â±â¿ææå¥½")  // 返回 true 表示是乱码
   ```

#### 技术修复详情
```typescript
// 修复前（会乱码）
content: btoa(unescape(encodeURIComponent(content)))
const jsonContent = atob(fileInfo.content)

// 修复后（正确处理中文）
const utf8Bytes = new TextEncoder().encode(content)
const base64Content = btoa(String.fromCharCode(...utf8Bytes))

const binaryString = atob(base64Content)
const utf8Bytes = new Uint8Array(binaryString.length)
for (let i = 0; i < binaryString.length; i++) {
  utf8Bytes[i] = binaryString.charCodeAt(i)
}
const jsonContent = new TextDecoder().decode(utf8Bytes)
```

### 6. API速率限制

#### 问题描述
GitHub API调用超出限制（5000次/小时）

#### 解决方案
1. **等待重置**：每小时重置一次
2. **减少同步频率**：在设置中调整同步间隔
3. **检查使用情况**：查看API剩余次数

## 🛠️ 手动修复步骤

如果自动修复未能解决问题，可以尝试以下步骤：

### 重置同步状态
1. 打开浏览器开发者工具（F12）
2. 进入 Console 标签
3. 执行以下命令：
```javascript
// 清除本地认证信息
localStorage.removeItem('encrypted_auth_config')

// 清除同步状态
localStorage.removeItem('encrypted_sync_state')

// 刷新页面
location.reload()
```

### 强制重新同步
```javascript
// 手动触发同步
syncManager.manualSync().then(result => {
  console.log('同步结果:', result)
}).catch(error => {
  console.error('同步错误:', error)
})
```

### 数据备份与恢复
```javascript
// 创建本地数据备份
const backup = localStorage.getItem('dailyTodos')
console.log('本地数据备份:', backup)

// 从云端拉取数据
syncManager.pull().then(data => {
  console.log('云端数据:', data)
}).catch(error => {
  console.error('拉取失败:', error)
})
```

## 📞 获取帮助

如果以上方案都无法解决问题，请：

1. **记录错误信息**：
   - 完整的错误消息
   - 浏览器版本
   - 操作系统版本
   - 重现步骤

2. **检查日志**：
   - 打开浏览器开发者工具
   - 查看Console中的错误信息
   - 截图保存相关信息

3. **联系支持**：
   - 创建 [GitHub Issue](../../issues)
   - 提供详细的错误信息
   - 描述问题发生的具体场景

## 📈 预防措施

为避免同步问题，建议：

1. **定期备份**：
   - 使用应用内的备份功能
   - 手动导出重要数据

2. **稳定网络**：
   - 在稳定的网络环境下进行同步
   - 避免在网络不稳定时频繁操作

3. **正确配置**：
   - 使用正确的GitHub令牌权限
   - 不要与他人分享GitHub令牌
   - 定期更新令牌（建议每6个月）

4. **渐进式操作**：
   - 首次设置时逐步操作
   - 确认每一步都成功后再继续
   - 避免同时在多个设备上进行初始设置
