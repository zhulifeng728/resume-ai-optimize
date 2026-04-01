# 快速开始 - 本地安装版

## 安装数据库

### 1. PostgreSQL 16
下载：https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
- 安装时设置密码（记住！）
- 打开 SQL Shell 或 pgAdmin 创建数据库：`CREATE DATABASE resumeai;`

### 2. Memurai（Redis 兼容）
下载：https://www.memurai.com/get-memurai
- 安装后自动启动，默认端口 6379

## 配置项目

编辑 `packages/backend/.env`，修改第一行：
```
DATABASE_URL=postgresql://postgres:你的密码@localhost:5432/resumeai
```

## 启动

```bash
pnpm install          # 安装依赖
pnpm db:migrate       # 初始化数据库（输入 init）
pnpm dev              # 启动项目
```

访问：http://localhost:5173

---

详细文档见 `INSTALL_LOCAL.md`
