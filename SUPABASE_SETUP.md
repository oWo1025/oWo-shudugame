# 云同步配置指南

## 1. Supabase 配置

### 步骤 1：创建 Supabase 项目
1. 访问 [Supabase](https://supabase.com) 并创建账户
2. 点击 "New Project" 创建新项目
3. 填写项目信息，等待项目初始化

### 步骤 2：获取 API 凭证
1. 在项目 dashboard 中，点击左侧菜单 "Project Settings" → "API"
2. 复制以下信息：
   - **Project URL** (类似 `https://xxx.supabase.co`)
   - **anon/public key** (长字符串)

### 步骤 3：创建数据表
在 SQL Editor 中执行以下 SQL：

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

### 步骤 4：配置应用
编辑 `index.html` 文件，填入你的 Supabase 凭证：

```html
<meta name="supabase-url" content="https://your-project.supabase.co" />
<meta name="supabase-key" content="your-anon-key" />
```

## 2. NAS 配置 (可选)

如果需要同步到 NAS，可以：
1. 使用 Supabase Edge Functions 代理请求到 NAS
2. 或者使用 WebDAV 协议（需要扩展开发）

## 3. 使用说明

1. 进入设置页面
2. 开启云同步开关
3. 输入昵称和 PIN 码（首次使用会自动注册）
4. 数据会自动在后台同步

## 注意事项

- 不同昵称和 PIN 码组合代表不同玩家
- PIN 码用于简单区分用户，不提供强加密保护
- 建议定期备份数据
