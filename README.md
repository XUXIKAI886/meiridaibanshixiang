# 日拱一足 Daily Practice

<div align="center">

![日拱一足](public/placeholder-logo.svg)

**心外无物，此心光明 - 简洁优雅的修身应用**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.9-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black)](https://ui.shadcn.com/)

</div>

## ✨ 功能特性

- 🎯 **修身养性** - 专注于每日功课管理，培养良好的修身节奏
- 🔄 **每日重置** - 功课在新的一天自动重置为未完成状态
- 👁️ **智能隐藏** - 今日跳过的功课明天会自动恢复，永不丢失
- ☁️ **云端同步** - 基于GitHub私有仓库的跨设备数据同步
- 🔐 **数据安全** - AES-256军用级加密保护您的隐私数据
- 🔄 **智能冲突** - 自动检测并解决多设备间的数据冲突
- 📡 **离线支持** - 网络断开时自动切换到离线模式
- 💾 **本地存储** - 数据保存在本地，无需联网即可使用  
- 🎨 **深色模式** - 支持浅色/深色主题切换
- 📱 **响应式设计** - 完美适配手机、平板和桌面设备
- ⚡ **快捷操作** - 回车键快速添加功课，一键重置所有状态
- 📊 **进度跟踪** - 实时显示今日功课完成进度和同步状态

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- pnpm (推荐) / npm / yarn

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 启动开发服务器

```bash
# 使用 pnpm
pnpm dev

# 或使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

打开 [http://localhost:3000](http://localhost:3000) 在浏览器中查看应用。

### 构建生产版本

```bash
# 构建
pnpm build

# 启动生产服务器
pnpm start
```

## 🚀 部署

### GitHub Pages 部署

1. **推送到GitHub仓库**
2. **在仓库设置中启用GitHub Pages**
3. **GitHub Actions会自动构建和部署**

```bash
# 本地构建（用于测试）
npm run build:github
```

### Vercel 部署

1. **连接GitHub仓库到Vercel**
2. **自动检测Next.js项目并部署**
3. **支持自动部署和预览**

### 手动部署

```bash
# 构建静态文件
npm run build
npm run export

# 上传 out/ 目录到任何静态文件托管服务
```

查看详细部署说明：[DEPLOYMENT.md](DEPLOYMENT.md)

## 🔧 云端同步技术方案

本项目实现了基于GitHub私有仓库的完整云端同步解决方案，包含：

### 核心技术特性
- **🔐 AES-256军用级加密** - 保护用户隐私数据
- **📡 双向实时同步** - 本地与云端无缝同步
- **🤖 智能冲突处理** - 自动检测并解决数据冲突
- **📱 多设备支持** - 跨设备访问相同数据
- **🔌 离线优先** - 网络断开时继续工作

### 技术实现
- **客户端架构** - 所有逻辑在浏览器中执行
- **去中心化存储** - 数据存储在用户的私有GitHub仓库
- **渐进增强** - 从本地存储平滑升级到云端同步
- **企业级安全** - 设备指纹和加密存储

### 开发者资源
📖 **完整技术方案**: [GITHUB_SYNC_SOLUTION.md](GITHUB_SYNC_SOLUTION.md)  
🚀 **产品开发文档**: [PRODUCT_SPEC.md](PRODUCT_SPEC.md)  
📋 **功能需求文档**: [REQUIREMENTS.md](REQUIREMENTS.md)  

> 💡 这个同步方案可以直接应用到任何需要跨设备数据同步的Web应用中，为开发者提供企业级的数据同步能力，同时保持用户数据的完全控制权。

## 🛠️ 技术栈

### 核心框架
- **[Next.js 14](https://nextjs.org/)** - React全栈框架，使用App Router
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的JavaScript
- **[React 18](https://reactjs.org/)** - 用户界面库

### 样式和UI
- **[Tailwind CSS 4](https://tailwindcss.com/)** - 实用优先的CSS框架
- **[shadcn/ui](https://ui.shadcn.com/)** - 高质量React组件库
- **[Radix UI](https://www.radix-ui.com/)** - 无障碍的底层UI原语
- **[Lucide React](https://lucide.dev/)** - 美观的SVG图标库

### 云端同步
- **[GitHub REST API](https://docs.github.com/en/rest)** - 数据存储和同步
- **[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)** - AES-256数据加密
- **[Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)** - GitHub身份验证

### 开发工具
- **[Geist Font](https://vercel.com/font)** - Vercel设计的现代字体
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Next.js主题切换
- **[class-variance-authority](https://cva.style/)** - 类型安全的CSS类变体
- **[clsx](https://github.com/lukeed/clsx)** & **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - 条件类名工具

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局组件
│   ├── page.tsx           # 主页面
│   └── globals.css        # 全局样式
├── components/            # React组件
│   ├── auth/              # 认证相关组件
│   │   └── auth-setup.tsx # GitHub认证设置
│   ├── sync/              # 同步相关组件
│   │   └── sync-status.tsx # 同步状态显示
│   ├── theme-provider.tsx # 主题提供者
│   └── ui/                # shadcn/ui组件库
├── hooks/                 # 自定义React Hooks
│   ├── use-mobile.ts      # 移动端检测
│   └── use-toast.ts       # Toast通知
├── lib/                   # 工具函数和核心逻辑
│   ├── auth-manager.ts    # 认证管理器
│   ├── data-migration.ts  # 数据迁移工具
│   ├── github-client.ts   # GitHub API客户端
│   ├── secure-storage.ts  # 安全存储工具
│   ├── sync-manager.ts    # 同步管理器
│   ├── types.ts           # TypeScript类型定义
│   └── utils.ts           # 样式合并工具
├── public/                # 静态资源
├── .github/workflows/     # GitHub Actions部署
├── components.json        # shadcn/ui配置
├── next.config.mjs        # Next.js配置
├── package.json           # 项目依赖
├── tailwind.config.js     # Tailwind CSS配置
└── tsconfig.json          # TypeScript配置
```

## 🎨 设计系统

### 颜色主题
- **浅色模式**: 简洁的白色背景配以柔和的灰色调
- **深色模式**: 舒适的深色背景，减少眼部疲劳
- **主题色**: 现代化的青色系 (`#0891b2` / `#06b6d4`)
- **强调色**: 优雅的紫色系 (`#6366f1` / `#8b5cf6`)

### 字体系统
- **Geist Sans**: 主要文字内容
- **Geist Mono**: 代码和等宽文字

## 📖 使用说明

### 基础功能
1. **添加功课**: 在输入框中输入修身功课内容，按回车或点击 + 按钮
2. **完成功课**: 点击功课前的复选框标记为已完成（会有划线效果）
3. **跳过功课**: 点击右侧的眼睛图标暂时隐藏功课（明天会自动恢复）
4. **删除功课**: 点击右侧的垃圾桶图标永久删除功课
5. **重置功课**: 点击"重置功课"按钮将所有功课标记为未完成并恢复隐藏的功课
6. **切换主题**: 点击右上角的主题切换按钮
7. **每日重置**: 应用会在新的一天自动重置所有功课状态并恢复被隐藏的功课

### 云端同步功能

#### 首次设置
1. **生成GitHub令牌**: 
   - 访问 [GitHub Personal Access Tokens](https://github.com/settings/tokens)
   - 创建新的Classic Token，选择 `repo` 权限
   - 复制生成的令牌（形如 `ghp_xxxxxxxxxxxx`）

2. **配置同步**:
   - 点击右上角的云端图标或"本地模式"按钮
   - 粘贴您的GitHub Personal Access Token
   - 点击"验证并配置"
   - 系统会自动创建私有仓库 `daily-habits-data`

3. **数据迁移**:
   - 现有的本地数据会自动迁移到云端
   - 迁移完成后即可享受跨设备同步

#### 日常使用
- **自动同步**: 数据变更后会自动同步到云端（延迟2秒）
- **状态显示**: 实时查看同步状态和网络连接状况
- **离线支持**: 网络断开时自动切换到离线模式
- **冲突处理**: 多设备间的数据冲突会自动检测并提示解决

#### 多设备设置
1. 在新设备上访问应用
2. 使用相同的GitHub令牌进行配置
3. 云端数据会自动同步到新设备
4. 现在您可以在任何设备上访问相同的功课数据

#### 安全说明
- 🔐 GitHub令牌使用AES-256加密存储在本地
- 🏠 数据存储在您的私有GitHub仓库中
- 🔒 仅您本人可以访问您的功课数据
- 📱 支持多设备，但每个设备需要单独配置

## 💡 设计理念

这个应用的设计理念是**修身养性**，专注于每日功课管理：

- 🎯 **专注性**: 只关注今日要完成的功课，避免功课堆积
- 🔄 **持续性**: 每日自动重置，但功课永不丢失，培养长期修身习惯
- 👁️ **灵活性**: 可以暂时跳过某个功课，不会影响长期坚持
- 🎨 **美观性**: 现代化的设计，愉悦的使用体验
- ⚡ **高效性**: 最少的操作步骤，最高的使用效率

## 🔧 自定义配置

### 添加新的UI组件

```bash
# 添加shadcn/ui组件
npx shadcn@latest add [component-name]
```

### 修改主题颜色

编辑 `app/globals.css` 中的CSS变量来自定义颜色主题：

```css
:root {
  --primary: #0891b2;      /* 主题色 */
  --secondary: #f9fafb;    /* 次要色 */
  --accent: #6366f1;       /* 强调色 */
  /* ... 更多颜色变量 */
}
```

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

1. Fork 这个仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个Pull Request

## 📄 许可证

这个项目使用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📈 版本历史

### v2.1.0 (2024-12) - 稳定性提升版本
- 🐛 **修复中文编码问题** - 替换废弃的编码方法，确保中文字符完美显示
- 🔄 **修复删除同步Bug** - 实现删除操作跟踪，确保删除的任务在云端也被移除
- 🛡️ **增强数据安全** - 优化编码算法，使用现代 TextEncoder/TextDecoder API
- 🧪 **添加调试工具** - 内置编码测试和数据修复工具
- ⚡ **提升同步性能** - 智能删除检测，避免误删恢复
- 📚 **完善文档** - 更新故障排除指南和最佳实践

### v2.0.0 (2024-12) - 云端同步版本
- 🆕 新增GitHub私有仓库云端同步功能
- 🔐 实现AES-256数据加密存储
- 🤖 添加智能冲突检测和解决机制
- 📡 支持多设备实时数据同步
- 🔌 完善离线模式支持
- 🎨 优化同步状态显示界面
- 🛠️ 重构数据存储架构

### v1.0.0 (2024-11) - 基础版本
- 🎯 实现每日功课管理核心功能
- 🔄 添加每日自动重置机制
- 👁️ 支持功课隐藏和恢复
- 💾 实现本地数据持久化
- 🎨 美化用户界面设计
- 📱 完善响应式布局
- 🌙 支持深色模式切换

## 🔧 故障排除

### 常见问题解决方案

#### 🔤 **中文显示乱码**
**现象**: 习惯文本显示为 `æ¯å¤©` 或 `â€` 等乱码字符  
**解决方案**:
1. 打开浏览器控制台（F12）
2. 运行以下修复脚本：
```javascript
// 一键修复中文乱码
(async function() {
  const todos = localStorage.getItem('dailyTodos');
  if (!todos) return;
  
  const data = JSON.parse(todos);
  const mappings = {
    'æ¯å¤©': '每天', 'ä¸»è¦': '主要', 'åºæ¬': '基本',
    'å·¥ä½œ': '工作', 'å­¦ä¹ ': '学习', 'ä¿®èº«': '修身'
  };
  
  const fixed = data.map(item => {
    let text = item.text;
    for (const [bad, good] of Object.entries(mappings)) {
      text = text.replace(new RegExp(bad, 'g'), good);
    }
    return { ...item, text: text.replace(/[âãÃ]/g, '') };
  });
  
  localStorage.setItem('dailyTodos', JSON.stringify(fixed));
  window.location.reload();
})();
```

#### 🔄 **删除的任务重新出现**
**现象**: 删除任务后同步，任务又重新出现了  
**原因**: 这是 v2.0.x 版本的已知Bug，已在 v2.1.0 修复  
**解决方案**: 
1. 确保使用最新版本 (v2.1.0+)
2. 清理旧的删除记录：
```javascript
// 清理删除记录并重新同步
localStorage.removeItem('deleted_habits');
syncManager.manualSync();
```

#### 🔐 **认证令牌失效**
**现象**: 提示"认证失败"或"令牌无效"  
**解决方案**:
1. 重新生成 GitHub Personal Access Token
2. 确保令牌具有 `repo` 权限
3. 在应用中重新配置令牌

#### 📡 **同步失败**
**现象**: 显示"同步出错"或网络错误  
**解决方案**:
1. 检查网络连接
2. 验证GitHub令牌是否有效
3. 手动触发同步：
```javascript
// 手动同步
syncManager.manualSync().then(result => {
  console.log('同步结果:', result);
});
```

#### 💾 **数据丢失**
**现象**: 习惯数据消失  
**恢复方案**:
1. **从云端恢复**：
```javascript
// 从云端拉取数据
syncManager.pull().then(data => {
  console.log('恢复的数据:', data);
});
```
2. **检查浏览器存储**：
   - 打开开发者工具 → Application → Local Storage
   - 查找 `dailyTodos` 键值

### 📊 **调试工具**

应用内置了多个调试工具，在控制台中可用：

```javascript
// 运行编码测试
runEncodingTests()

// 测试特定字符串
testSpecificString("你的测试文本")

// 修复损坏的数据
fixAllCorruptedData()

// 检查同步状态
syncManager.getSyncState()

// 检查认证状态
authManager.getAuthState()
```

## 📞 联系方式

如果您有任何问题或建议，请随时联系：

- 创建 [Issue](../../issues) 报告问题或建议功能
- 查看 [Discussions](../../discussions) 参与技术讨论
- 阅读 [Wiki](../../wiki) 获取详细文档

### 技术支持
- **云端同步问题**: 查看 [GITHUB_SYNC_SOLUTION.md](GITHUB_SYNC_SOLUTION.md)
- **部署相关问题**: 查看 [DEPLOYMENT.md](DEPLOYMENT.md)
- **功能需求**: 查看 [REQUIREMENTS.md](REQUIREMENTS.md)

---

<div align="center">

**用 ❤️ 和 ☕ 制作**

如果这个项目对您有帮助，请给它一个 ⭐

</div>
