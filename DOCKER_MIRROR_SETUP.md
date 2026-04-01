# Docker 镜像加速配置指南

## 问题
无法从 Docker Hub 拉取镜像（网络超时）

## 解决方案

### 方案 1：使用国内镜像源（推荐）

1. 打开 Docker Desktop
2. 点击右上角设置图标 ⚙️
3. 选择 "Docker Engine"
4. 在 JSON 配置中添加镜像源：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.nju.edu.cn",
    "https://docker.mirrors.sjtug.sjtu.edu.cn"
  ]
}
```

5. 点击 "Apply & Restart"
6. 等待 Docker 重启完成
7. 重新运行：`pnpm docker:up`

### 方案 2：本地安装 PostgreSQL 和 Redis（无需 Docker）

参考项目中的 `INSTALL_LOCAL.md` 文件：

**macOS 安装：**

```bash
# 安装 Homebrew（如果还没装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 PostgreSQL 16
brew install postgresql@16

# 启动 PostgreSQL
brew services start postgresql@16

# 创建数据库
createdb resumeai

# 安装 Redis
brew install redis

# 启动 Redis
brew services start redis
```

然后修改 `.env` 文件中的数据库连接：
```env
DATABASE_URL=postgresql://你的用户名@localhost:5432/resumeai
```

### 方案 3：使用阿里云镜像（需要注册）

1. 访问：https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors
2. 登录阿里云账号
3. 获取专属加速地址
4. 按方案 1 的步骤配置到 Docker Desktop

---

## 验证配置

配置完成后，运行以下命令验证：

```bash
# 测试拉取镜像
docker pull redis:7-alpine

# 如果成功，再启动项目服务
pnpm docker:up
```
