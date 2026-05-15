# 🧩 数独

一款功能丰富的经典 9×9 数独网页游戏，支持 **PWA 离线运行**、**多种主题**、**成就系统** 和 **云同步备份**。

## ✨ 功能特性

### 🎮 游戏功能
- **完整数独体验** — 标准 9×9 数独，支持候选数标注
- **6 种难度** — 新手、简单、中等、困难、专家、地狱
- **每日挑战** — 每天一个独一无二的谜题
- **多种输入模式** — 先格后数 / 先数后格，左右手键盘布局
- **智能提示系统** — 3 级提示（高亮候选、高亮数字、直接填入）
- **实时错误检测** — 可选实时标红错误数字
- **自动候选数** — 可选自动填入候选数

### 🏆 成就系统
21 项成就等你解锁，涵盖 4 个等级：
| 等级 | 描述 |
|------|------|
| 🥉 铜 | 初次通关、简单起步、每周打卡、半百之路 |
| 🥈 银 | 中等高手、困难征服者、闪电手、独立思考 |
| 🥇 金 | 马拉松、百日坚持、专家之路 |
| 💎 铂金 | 全能玩家、传奇玩家 |

### 🎨 主题系统
8 种视觉主题，适配浅色/深色模式：
- **经典** · **沙** · **苔** · **岩**
- **海** · **林** · **暮**
- **高对比度**（色弱友好）

### ☁️ 云同步（双重备份）
- **Supabase 云端** — 免费云数据库，外网可用
- **NAS 局域网** — WebDAV 协议同步到本地 NAS
- 两种方案同时备份，提升数据安全性
- 玩家通过昵称 + PIN 码身份识别

### 📊 统计系统
- 全局统计数据（总时长、通关数、提示次数、错误次数）
- 各难度详细统计（完成局数、最佳/平均用时）
- 每日挑战打卡记录

### 📱 PWA 支持
- 支持"添加到主屏幕"，全屏运行如原生 App
- 离线单文件构建，不依赖网络即可运行
- Service Worker 缓存，快速加载

### 🎵 音效与反馈
- 操作音效反馈
- 震动反馈（移动端）
- 胜利庆祝动画 + 五彩纸屑效果

## 🖥️ 截图预览

| 首页 | 游戏 | 统计 | 设置 |
|------|------|------|------|
| 数独网格 Logo + 菜单卡片 | 标准数独棋盘 | 全局数据 + 成就 | 主题/输入/云同步 |

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 构建离线单文件版本
npm run build:offline

# 预览生产构建
npm run preview
```

### 访问
开发服务器默认运行在 `http://localhost:5173`

## 🏗️ 项目结构

```
sudoku/
├── public/                    # 静态资源（图标、manifest）
│   ├── icon.svg               # PWA 图标源文件
│   ├── favicon.svg            # 浏览器标签页图标
│   ├── apple-touch-icon.png   # iOS 主屏幕图标
│   └── *.png                  # 各尺寸 PWA 图标
├── src/
│   ├── main.tsx               # 入口文件
│   ├── App.tsx                # 主应用（路由、状态管理）
│   ├── index.css              # 全局样式 + 主题变量
│   ├── types.ts               # TypeScript 类型定义
│   ├── defaults.ts            # 默认配置
│   ├── theme.ts               # 主题切换逻辑
│   ├── storage.ts             # localStorage 持久化
│   ├── version.ts             # 版本号
│   ├── sound.ts               # 音效系统
│   ├── ui.tsx                 # 通用 UI 组件
│   ├── icons.tsx              # SVG 图标组件
│   ├── achievements.ts        # 成就逻辑
│   ├── cloudSync.ts           # 云同步核心（Supabase）
│   ├── nasSync.ts             # NAS 同步核心（WebDAV）
│   ├── syncQueue.ts           # 同步重试队列
│   ├── screens/
│   │   ├── Home.tsx           # 首页
│   │   ├── Game.tsx           # 游戏页面
│   │   ├── Victory.tsx        # 胜利庆祝页面
│   │   ├── Stats.tsx          # 统计页面
│   │   ├── Settings.tsx       # 设置页面
│   │   ├── Changelog.tsx      # 更新日志页面
│   │   ├── CloudSyncSetup.tsx # 云同步身份设置弹窗
│   │   └── NasSetup.tsx       # NAS 配置弹窗
│   ├── game/
│   │   ├── game.ts            # 游戏核心逻辑
│   │   └── codec.ts           # 游戏状态编解码
│   ├── sudoku/
│   │   ├── grid.ts            # 网格操作
│   │   ├── solver.ts          # 数独求解器
│   │   ├── hints.ts           # 提示生成
│   │   ├── rng.ts             # 随机数生成器
│   │   └── transform.ts       # 网格变换
│   └── puzzles/
│       ├── library.ts         # 谜题库
│       └── puzzles.ts         # 谜题生成
├── vite.config.ts             # Vite 主配置
├── vite.offline.config.ts     # 离线构建配置
├── vite-plugin-changelog.ts   # 自动生成更新日志插件
├── tsconfig.json              # TypeScript 配置
├── package.json
└── README.md
```

## 🛠️ 构建说明

### 生产构建
```bash
npm run build
```
生成到 `dist/` 目录，包含：
- 优化的 JS/CSS 资源
- PWA Service Worker
- 浏览器兼容（legacy 构建）

### 离线单文件构建
```bash
npm run build:offline
```
生成到 `dist-offline/` 目录，特点：
- 所有 JS/CSS 内联到单个 HTML 文件
- 可离线独立运行
- 同样包含 PWA 支持

## ☁️ 云同步配置

### Supabase（推荐）
1. 在 [supabase.com](https://supabase.com) 创建项目
2. 执行 SQL 创建数据表（详见 `SUPABASE_SETUP.md`）
3. 在 `index.html` 中填入 API 凭证：
   ```html
   <meta name="supabase-url" content="https://你的项目.supabase.co" />
   <meta name="supabase-key" content="你的anon_key" />
   ```

### NAS（可选）
1. 在 NAS 上启用 WebDAV 服务
2. 创建同步文件夹
3. 在 `index.html` 中配置：
   ```html
   <meta name="nas-url" content="http://你的NAS地址:端口" />
   <meta name="nas-username" content="用户名" />
   <meta name="nas-password" content="密码" />
   <meta name="nas-path" content="/同步路径" />
   ```

> **注意**：生产环境中 NAS 同步需解决 CORS 跨域问题，推荐通过反向代理（如 Nginx）添加 CORS 头。

## 🧪 技术栈

| 技术 | 用途 |
|------|------|
| **React 19** | UI 框架 |
| **TypeScript** | 类型安全 |
| **Vite 8** | 构建工具 |
| **Supabase JS** | 云数据库客户端 |
| **PWA** | 离线/主屏幕支持 |
| **Web Audio API** | 音效生成 |
| **CSS 自定义属性** | 主题系统 |

## 📄 许可

MIT License

## 🙏 致谢

感谢所有使用和测试本应用的朋友们！