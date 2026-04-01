# ResumeAI 本地安装指南（无需 Docker）

本指南适用于不想安装 Docker 的 Windows 用户。

## 第一步：安装 PostgreSQL 16

### 1.1 下载安装器
访问：https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

选择：**PostgreSQL 16.x for Windows x86-64**

### 1.2 安装步骤
1. 运行下载的 `.exe` 安装器
2. 安装路径：默认即可（`C:\Program Files\PostgreSQL\16`）
3. 组件选择：全部勾选（PostgreSQL Server, pgAdmin 4, Command Line Tools）
4. **重要：设置密码**
   - 为 `postgres` 超级用户设置密码
   - **记住这个密码**，后面配置要用
5. 端口：默认 `5432`
6. 区域设置：默认即可
7. 完成安装

### 1.3 创建数据库
安装完成后，打开 **SQL Shell (psql)**：

```sql
-- 输入密码后执行
CREATE DATABASE resumeai;

-- 验证创建成功
\l
-- 应该能看到 resumeai 数据库

-- 退出
\q
```

或者使用 **pgAdmin 4**（图形界面）：
1. 打开 pgAdmin 4
2. 连接到 PostgreSQL 16（输入密码）
3. 右键 `Databases` → `Create` → `Database`
4. 名称填 `resumeai`，点击 `Save`

---

## 第二步：安装 Memurai（Redis 兼容）

### 2.1 下载
访问：https://www.memurai.com/get-memurai

点击 **Download Memurai Developer**（免费开发版）

### 2.2 安装
1. 运行 `.msi` 安装器
2. 全部默认选项，一路 Next
3. 安装完成后，Memurai 会自动启动并在后台运行
4. 默认端口：`6379`

### 2.3 验证安装
打开命令行（CMD 或 PowerShell）：

```bash
# 测试连接
memurai-cli ping
# 应该返回：PONG
```

---

## 第三步：配置项目

### 3.1 修改后端环境变量

编辑文件：`G:\project\resume-ai-optimize\packages\backend\.env`

```env
# 修改这一行，把 "你的PG密码" 替换成第一步设置的密码
DATABASE_URL=postgresql://postgres:你的PG密码@localhost:5432/resumeai

# Redis 保持不变
REDIS_URL=redis://localhost:6379

# 其他配置保持不变
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-jwt-refresh-secret-change-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**示例：** 如果你的 PostgreSQL 密码是 `mypassword123`，那么：
```
DATABASE_URL=postgresql://postgres:mypassword123@localhost:5432/resumeai
```

---

## 第四步：安装依赖并启动

### 4.1 安装 pnpm（如果还没装）
```bash
npm install -g pnpm
```

### 4.2 安装项目依赖
在项目根目录 `G:\project\resume-ai-optimize\` 执行：

```bash
pnpm install
```

### 4.3 初始化数据库表
```bash
pnpm db:migrate
```

执行后会提示输入 migration 名称，输入 `init` 即可。

### 4.4 启动项目
```bash
pnpm dev
```

启动成功后：
- 后端 API：http://localhost:3000
- 前端页面：http://localhost:5173

---

## 常见问题

### Q1: PostgreSQL 连接失败
**错误：** `ECONNREFUSED` 或 `password authentication failed`

**解决：**
1. 确认 PostgreSQL 服务正在运行
   - 打开 `services.msc`
   - 找到 `postgresql-x64-16`
   - 确保状态是"正在运行"
2. 检查 `.env` 文件中的密码是否正确
3. 确认数据库 `resumeai` 已创建

### Q2: Redis 连接失败
**错误：** `ECONNREFUSED 127.0.0.1:6379`

**解决：**
1. 确认 Memurai 服务正在运行
   - 打开任务管理器
   - 查看"服务"标签
   - 找到 `Memurai` 服务
2. 或者重启 Memurai 服务：
   ```bash
   net stop Memurai
   net start Memurai
   ```

### Q3: 端口被占用
**错误：** `Port 3000 is already in use`

**解决：**
修改 `packages/backend/.env` 中的 `PORT=3000` 为其他端口，如 `PORT=3001`

### Q4: Prisma migrate 失败
**错误：** `P1001: Can't reach database server`

**解决：**
1. 确认 PostgreSQL 正在运行
2. 测试连接：
   ```bash
   psql -U postgres -h localhost -d resumeai
   # 输入密码，能连上说明配置正确
   ```

---

## 性能优化建议

### 关闭不用的服务
如果不开发时想节省资源，可以停止服务：

```bash
# 停止 PostgreSQL
net stop postgresql-x64-16

# 停止 Memurai
net stop Memurai

# 需要时再启动
net start postgresql-x64-16
net start Memurai
```

### 设置为手动启动
1. 打开 `services.msc`
2. 找到 `postgresql-x64-16` 和 `Memurai`
3. 右键 → 属性 → 启动类型 → 改为"手动"
4. 这样开机不会自动启动，需要时手动启动

---

## 卸载（如果不需要了）

### 卸载 PostgreSQL
控制面板 → 程序和功能 → 卸载 PostgreSQL 16

### 卸载 Memurai
控制面板 → 程序和功能 → 卸载 Memurai

---

## 下一步

安装完成后，访问 http://localhost:5173 开始使用 ResumeAI！

1. 注册账号
2. 在"设置 → API Keys"中添加你的 AI API Key（推荐 NVIDIA NIM 免费版）
3. 上传简历
4. 输入 JD
5. 开始 AI 优化
