# 🚀 部署指南

本文档将指导您如何部署"日拱一足"应用。我们提供两种部署方案：

## 📖 目录

- [GitHub Pages 部署（免费，推荐）](#github-pages-部署)
- [Vercel 部署（最佳性能）](#vercel-部署)
- [部署后访问](#部署后访问)
- [故障排除](#故障排除)

---

## 🆓 GitHub Pages 部署

### 特点
- ✅ **完全免费**
- ✅ **自动部署**
- ✅ **GitHub 集成**
- ⚠️ 静态网站（无服务端功能）

### 设置步骤

#### 1. 启用 GitHub Pages
1. 打开您的 GitHub 仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Pages**
4. 在 **Source** 下选择 **GitHub Actions**

#### 2. 触发部署
- **自动触发**：推送代码到 `main` 分支
- **手动触发**：在 Actions 页面点击 "Run workflow"

#### 3. 等待部署完成
- 查看 **Actions** 标签页的部署进度
- 通常需要 2-5 分钟完成

#### 4. 访问应用
部署完成后，应用将在以下地址可用：
```
https://XUXIKAI886.github.io/meiridaibanshixiang/
```

---

## ⚡ Vercel 部署

### 特点
- ✅ **最佳性能**
- ✅ **全功能支持**
- ✅ **自动 HTTPS**
- ✅ **全球 CDN**
- ⚠️ 需要注册 Vercel 账号

### 方法一：直接连接（推荐）

#### 1. 访问 Vercel
前往 [vercel.com](https://vercel.com) 并使用 GitHub 账号登录

#### 2. 导入项目
1. 点击 **"New Project"**
2. 选择您的 GitHub 仓库 `meiridaibanshixiang`
3. 点击 **"Import"**

#### 3. 配置项目
- **Framework Preset**: Next.js（自动检测）
- **Root Directory**: `./`（默认）
- **Build Settings**: 保持默认

#### 4. 部署
1. 点击 **"Deploy"**
2. 等待 2-3 分钟完成构建
3. 获得形如 `https://your-app.vercel.app` 的访问地址

### 方法二：GitHub Actions（高级）

#### 1. 获取 Vercel 配置
```bash
# 在本地项目根目录运行
npx vercel login
npx vercel --confirm
```

#### 2. 获取必要的 Secret
运行以下命令获取配置：
```bash
npx vercel env ls
```

#### 3. 设置 GitHub Secrets
在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中添加：
- `VERCEL_TOKEN`: 您的 Vercel 令牌
- `VERCEL_ORG_ID`: 组织 ID
- `VERCEL_PROJECT_ID`: 项目 ID

#### 4. 启用 Vercel 工作流
编辑 `.github/workflows/vercel.yml`，取消注释 `on:` 配置

---

## 🌐 部署后访问

### GitHub Pages
```
https://XUXIKAI886.github.io/meiridaibanshixiang/
```

### Vercel
```
https://your-project-name.vercel.app
```

---

## 🔧 故障排除

### GitHub Pages 常见问题

#### 问题：页面显示 404
**解决方案**：
1. 确认 GitHub Pages 已启用
2. 检查 Actions 是否成功运行
3. 确认访问地址正确

#### 问题：样式丢失
**解决方案**：
1. 检查 `basePath` 配置是否正确
2. 确认 `NEXT_PUBLIC_BASE_PATH` 环境变量设置

#### 问题：构建失败
**解决方案**：
1. 检查 `package.json` 中的依赖
2. 查看 Actions 日志中的错误信息
3. 确认 Node.js 版本兼容（18+）

### Vercel 常见问题

#### 问题：函数超时
**解决方案**：
- 优化代码性能
- 检查是否有死循环或长时间运行的任务

#### 问题：环境变量问题
**解决方案**：
1. 在 Vercel 控制台中设置环境变量
2. 重新部署项目

---

## 📊 部署对比

| 特性 | GitHub Pages | Vercel |
|------|-------------|---------|
| 价格 | 免费 | 免费额度 + 付费 |
| 性能 | 良好 | 优秀 |
| 功能 | 静态网站 | 全功能 |
| 设置难度 | 简单 | 非常简单 |
| 自定义域名 | 支持 | 支持 |
| HTTPS | 自动 | 自动 |
| 全球 CDN | ✅ | ✅ |

## 🎯 推荐选择

- **初学者 / 个人项目**: GitHub Pages
- **生产环境 / 商业项目**: Vercel
- **静态展示**: GitHub Pages
- **需要服务端功能**: Vercel

---

需要帮助？请在 GitHub Issues 中提问！
