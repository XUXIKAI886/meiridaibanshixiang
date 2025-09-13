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
- 💾 **本地存储** - 数据保存在本地，无需联网即可使用  
- 🎨 **深色模式** - 支持浅色/深色主题切换
- 📱 **响应式设计** - 完美适配手机、平板和桌面设备
- ⚡ **快捷操作** - 回车键快速添加功课，一键重置所有状态
- 📊 **进度跟踪** - 实时显示今日功课完成进度

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
│   ├── theme-provider.tsx # 主题提供者
│   └── ui/               # shadcn/ui组件库
├── hooks/                # 自定义React Hooks
│   ├── use-mobile.ts     # 移动端检测
│   └── use-toast.ts      # Toast通知
├── lib/                  # 工具函数
│   └── utils.ts          # 样式合并工具
├── public/               # 静态资源
├── components.json       # shadcn/ui配置
├── next.config.mjs       # Next.js配置
├── package.json          # 项目依赖
├── tailwind.config.js    # Tailwind CSS配置
└── tsconfig.json         # TypeScript配置
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

1. **添加功课**: 在输入框中输入修身功课内容，按回车或点击 + 按钮
2. **完成功课**: 点击功课前的复选框标记为已完成（会有划线效果）
3. **跳过功课**: 点击右侧的眼睛图标暂时隐藏功课（明天会自动恢复）
4. **重置功课**: 点击"重置功课"按钮将所有功课标记为未完成并恢复隐藏的功课
5. **切换主题**: 点击右上角的主题切换按钮
6. **每日重置**: 应用会在新的一天自动重置所有功课状态并恢复被隐藏的功课

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

## 📞 联系方式

如果您有任何问题或建议，请随时联系：

- 创建 [Issue](../../issues)
- 发送邮件到 [your-email@example.com](mailto:your-email@example.com)

---

<div align="center">

**用 ❤️ 和 ☕ 制作**

如果这个项目对您有帮助，请给它一个 ⭐

</div>
