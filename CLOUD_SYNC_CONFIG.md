# 云同步配置指南（开发者）

## 概述

云同步功能已简化为单一入口，玩家只需注册昵称和 PIN 码即可使用。系统会自动同时向 NAS 和 Supabase 同步数据，提高数据可靠性。

## 架构

```
玩家设备
    ↓
┌─────────────────────────┐
│   云同步核心逻辑         │
│   cloudSync.ts          │
└────────┬────────────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌───────┐  ┌──────────┐
│ NAS   │  │ Supabase │
│(主备) │  │ (主备)   │
└───────┘  └──────────┘
```

## 配置步骤

### 1. Supabase 配置（可选）

1. 创建 [Supabase](https://supabase.com) 项目
2. 获取 Project URL 和 anon key
3. 编辑 `index.html`:
```html
<meta name="supabase-url" content="https://your-project.supabase.co" />
<meta name="supabase-key" content="your-anon-key" />
```
4. 在 SQL Editor 执行:
```sql
create table sudoku_save (
  id text primary key,
  nickname text not null,
  pin text not null,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_sudoku_save_nickname_pin on sudoku_save(nickname, pin);

alter table sudoku_save enable row level security;

create policy "Enable all access for authenticated users"
  on sudoku_save
  for all
  using (true)
  with check (true);
```

### 2. NAS 配置（可选）

在 NAS 上启用 WebDAV 服务:

**Synology NAS:**
1. 控制面板 → 应用程序终端
2. 启用 WebDAV 和 HTTPS（端口 5006）
3. 创建共享文件夹（如 `Sudoku`）并设置权限

**NAS 配置存储:**
- 存储在浏览器 localStorage
- 格式: `sudoku.nasConfig.v1`
- 玩家首次登录时需要配置

## 同步机制

### 同时备份策略
```typescript
const syncToCloud = async (data) => {
  const nasSuccess = await syncToNas(data)
  const supabaseSuccess = await syncToSupabase(data)
  return nasSuccess || supabaseSuccess  // 任一成功即成功
}
```

### 数据恢复策略
```typescript
const syncFromCloud = async () => {
  const nasData = await syncFromNas()
  const supabaseData = await syncFromSupabase()
  
  if (!nasData && !supabaseData) return null
  if (!nasData) return supabaseData
  if (!supabaseData) return nasData
  
  // 优先使用最新版本
  return nasData.version >= supabaseData.version ? nasData : supabaseData
}
```

## 玩家使用流程

1. **开启云同步**
   - 设置 → 云同步 → 开启

2. **首次登录**
   - 弹出身份设置窗口
   - 输入昵称（最多20字符）
   - 输入 PIN 码（4-6位数字）
   - 点击"开始同步"

3. **正常使用**
   - 数据自动同步（页面隐藏时）
   - 可手动点击"立即同步"
   - 显示最后同步时间

## 数据安全

### 玩家身份
- 玩家 ID = `base64(nickname:pin)`
- 不存储明文密码
- 无法从 ID 反推 PIN

### 传输安全
- NAS: HTTP Basic Auth
- Supabase: HTTPS + SDK 认证

### 备份策略
- 双重备份，任一服务可用即可恢复
- 版本号控制，优先使用最新数据

## 配置检查

```javascript
import { isCloudConfigured, isSupabaseConfigured, isNasConfigured } from './cloudSync'

console.log('Supabase配置:', isSupabaseConfigured())
console.log('NAS配置:', isNasConfigured())
console.log('云同步可用:', isCloudConfigured())
```

## 故障排查

### 同步失败
1. 检查网络连接
2. 确认服务配置正确
3. 尝试手动同步
4. 查看浏览器控制台错误

### 数据不一致
- 系统自动选择最新版本
- 可手动触发完整同步

### 权限问题
- 检查 NAS 用户权限
- 确认 Supabase RLS 策略
