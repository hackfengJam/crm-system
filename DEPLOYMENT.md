# CRM系统私有化部署文档

本文档提供CRM客户关系管理系统的完整私有化部署指南，适用于本地服务器或云服务器环境。

---

## 目录

1. [系统要求](#系统要求)
2. [架构说明](#架构说明)
3. [环境准备](#环境准备)
4. [数据库部署](#数据库部署)
5. [应用部署](#应用部署)
6. [生产环境配置](#生产环境配置)
7. [反向代理配置](#反向代理配置)
8. [SSL证书配置](#ssl证书配置)
9. [系统维护](#系统维护)
10. [故障排查](#故障排查)

---

## 系统要求

### 硬件要求

- **CPU**: 2核心及以上
- **内存**: 4GB及以上（推荐8GB）
- **磁盘**: 20GB可用空间（推荐SSD）
- **网络**: 稳定的网络连接

### 软件要求

- **操作系统**: Ubuntu 20.04/22.04 LTS 或 CentOS 7/8（推荐Ubuntu 22.04）
- **Node.js**: v18.x 或更高版本
- **数据库**: MySQL 8.0+ 或 TiDB（兼容MySQL协议）
- **包管理器**: pnpm（会自动安装）
- **反向代理**: Nginx（可选，推荐用于生产环境）

---

## 架构说明

### 技术栈

**前端**
- React 19 + TypeScript
- Tailwind CSS 4（优雅的紫色系设计）
- tRPC React Query（类型安全的API调用）
- Recharts（数据可视化）
- shadcn/ui（UI组件库）

**后端**
- Node.js + Express 4
- tRPC 11（端到端类型安全）
- Drizzle ORM（数据库操作）
- JWT（用户认证）

**数据库**
- MySQL 8.0+（或兼容的数据库如TiDB）

### 系统架构

```
┌─────────────┐
│   用户浏览器   │
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────┐
│    Nginx     │ (反向代理 + SSL)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Node.js App │ (Express + tRPC)
│  Port: 3000  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│    MySQL     │
│  Port: 3306  │
└─────────────┘
```

---

## 环境准备

### 1. 安装Node.js

```bash
# 使用NodeSource安装Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应显示 v20.x.x
npm --version
```

### 2. 安装pnpm

```bash
npm install -g pnpm
pnpm --version
```

### 3. 安装MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

### 4. 安装Nginx（可选，用于生产环境）

```bash
sudo apt update
sudo apt install nginx

# 启动Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 数据库部署

### 1. 创建数据库

```bash
# 登录MySQL
sudo mysql -u root -p

# 在MySQL中执行
CREATE DATABASE crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建数据库用户
CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'your_secure_password';

# 授予权限
GRANT ALL PRIVILEGES ON crm_system.* TO 'crm_user'@'localhost';
FLUSH PRIVILEGES;

# 退出
EXIT;
```

### 2. 数据库连接字符串

记录数据库连接信息，格式如下：

```
mysql://crm_user:your_secure_password@localhost:3306/crm_system
```

### 3. 数据库表结构

数据库表结构已在代码中定义（`drizzle/schema.ts`），部署时会自动创建。包含以下表：

- **users**: 用户表
- **customers**: 客户信息表
- **contact_history**: 联系历史记录表
- **sales_stages**: 销售阶段表
- **opportunities**: 销售机会表
- **tasks**: 任务表

---

## 应用部署

### 1. 上传代码到服务器

```bash
# 方式1: 使用Git（推荐）
cd /opt
sudo git clone <your-repository-url> crm-system
cd crm-system

# 方式2: 使用SCP上传压缩包
# 在本地打包
tar -czf crm-system.tar.gz crm-system/
# 上传到服务器
scp crm-system.tar.gz user@server:/opt/
# 在服务器上解压
cd /opt
tar -xzf crm-system.tar.gz
```

### 2. 安装依赖

```bash
cd /opt/crm-system
pnpm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
nano .env
```

添加以下内容（**请根据实际情况修改**）：

```env
# 数据库配置
DATABASE_URL=mysql://crm_user:your_secure_password@localhost:3306/crm_system

# JWT密钥（请生成强随机字符串）
JWT_SECRET=your_very_long_random_secret_key_here_at_least_32_characters

# OAuth配置（如果使用Manus OAuth，需要配置以下项）
# 如果不使用OAuth，可以修改代码实现自定义认证
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=your_app_id

# 应用配置
NODE_ENV=production
PORT=3000

# 应用信息
VITE_APP_TITLE=CRM客户关系管理系统
VITE_APP_LOGO=/logo.png

# 所有者信息（首个用户将自动成为管理员）
OWNER_OPEN_ID=your_owner_openid
OWNER_NAME=管理员
```

**生成JWT密钥的方法**：

```bash
# 方法1: 使用OpenSSL
openssl rand -base64 32

# 方法2: 使用Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. 初始化数据库

```bash
# 推送数据库schema
pnpm db:push

# 初始化销售阶段数据
node -e "
const { drizzle } = require('drizzle-orm/mysql2');
const { salesStages } = require('./drizzle/schema.ts');

const db = drizzle(process.env.DATABASE_URL);

const stages = [
  { name: '线索', description: '初步接触的潜在客户', order: 1, probability: 10, color: '#e0e7ff' },
  { name: '洽谈', description: '正在沟通需求', order: 2, probability: 30, color: '#c7d2fe' },
  { name: '报价', description: '已提供报价方案', order: 3, probability: 50, color: '#a5b4fc' },
  { name: '谈判', description: '商务谈判阶段', order: 4, probability: 70, color: '#818cf8' },
  { name: '成交', description: '签约成交', order: 5, probability: 100, color: '#6366f1' },
];

(async () => {
  for (const stage of stages) {
    await db.insert(salesStages).values(stage);
  }
  console.log('销售阶段初始化成功');
  process.exit(0);
})();
"
```

### 5. 构建应用

```bash
# 构建前端和后端
pnpm build
```

构建完成后，会生成：
- `client/dist/`: 前端静态文件
- `dist/`: 后端编译文件

### 6. 启动应用

**开发模式**（不推荐生产环境）：

```bash
pnpm dev
```

**生产模式**：

```bash
pnpm start
```

### 7. 使用PM2管理进程（推荐）

PM2是Node.js应用的进程管理器，可以确保应用持续运行。

```bash
# 安装PM2
sudo npm install -g pm2

# 启动应用
pm2 start dist/index.js --name crm-system

# 查看状态
pm2 status

# 查看日志
pm2 logs crm-system

# 设置开机自启
pm2 startup
pm2 save

# 其他常用命令
pm2 restart crm-system  # 重启
pm2 stop crm-system     # 停止
pm2 delete crm-system   # 删除
```

---

## 生产环境配置

### PM2配置文件

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'crm-system',
    script: './dist/index.js',
    instances: 2,  // 使用2个实例（根据CPU核心数调整）
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

使用配置文件启动：

```bash
pm2 start ecosystem.config.js
```

---

## 反向代理配置

### Nginx配置

创建Nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/crm-system
```

添加以下内容：

```nginx
# HTTP服务器（重定向到HTTPS）
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS服务器
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL证书配置（后续配置）
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 日志
    access_log /var/log/nginx/crm-access.log;
    error_log /var/log/nginx/crm-error.log;
    
    # 客户端上传大小限制
    client_max_body_size 10M;
    
    # 代理到Node.js应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/crm-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

---

## SSL证书配置

### 使用Let's Encrypt免费证书

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书并自动配置Nginx
sudo certbot --nginx -d your-domain.com

# 证书会自动续期，可以测试续期
sudo certbot renew --dry-run
```

### 使用自签名证书（仅用于测试）

```bash
# 创建SSL目录
sudo mkdir -p /etc/nginx/ssl

# 生成自签名证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/key.pem \
  -out /etc/nginx/ssl/cert.pem
```

---

## 系统维护

### 日志管理

```bash
# 查看应用日志
pm2 logs crm-system

# 查看Nginx日志
sudo tail -f /var/log/nginx/crm-access.log
sudo tail -f /var/log/nginx/crm-error.log

# 清理旧日志
pm2 flush
```

### 数据库备份

```bash
# 创建备份脚本
nano /opt/backup-crm.sh
```

添加以下内容：

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/crm"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="crm_system"
DB_USER="crm_user"
DB_PASS="your_secure_password"

mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/crm_$DATE.sql.gz

# 删除30天前的备份
find $BACKUP_DIR -name "crm_*.sql.gz" -mtime +30 -delete

echo "备份完成: crm_$DATE.sql.gz"
```

设置定时备份：

```bash
# 添加执行权限
chmod +x /opt/backup-crm.sh

# 添加到crontab（每天凌晨2点备份）
crontab -e
# 添加以下行
0 2 * * * /opt/backup-crm.sh
```

### 数据库恢复

```bash
# 解压备份文件
gunzip crm_20240122_020000.sql.gz

# 恢复数据库
mysql -u crm_user -p crm_system < crm_20240122_020000.sql
```

### 应用更新

```bash
# 拉取最新代码
cd /opt/crm-system
git pull

# 安装新依赖
pnpm install

# 更新数据库schema
pnpm db:push

# 重新构建
pnpm build

# 重启应用
pm2 restart crm-system
```

---

## 故障排查

### 应用无法启动

```bash
# 检查端口占用
sudo netstat -tulpn | grep 3000

# 检查PM2状态
pm2 status

# 查看详细日志
pm2 logs crm-system --lines 100

# 检查环境变量
pm2 env 0
```

### 数据库连接失败

```bash
# 测试数据库连接
mysql -u crm_user -p -h localhost crm_system

# 检查MySQL服务状态
sudo systemctl status mysql

# 查看MySQL错误日志
sudo tail -f /var/log/mysql/error.log
```

### Nginx配置问题

```bash
# 测试Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 重启Nginx
sudo systemctl restart nginx
```

### 性能问题

```bash
# 查看系统资源使用
htop

# 查看Node.js进程内存使用
pm2 monit

# 数据库性能分析
mysql -u root -p -e "SHOW PROCESSLIST;"
```

---

## 安全建议

1. **定期更新系统和依赖**
   ```bash
   sudo apt update && sudo apt upgrade
   pnpm update
   ```

2. **配置防火墙**
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

3. **限制数据库访问**
   - 仅允许本地连接
   - 使用强密码
   - 定期更换密码

4. **启用访问日志监控**
   - 定期检查异常访问
   - 配置日志告警

5. **数据加密**
   - 使用HTTPS
   - 敏感数据加密存储

---

## 联系支持

如遇到部署问题，请检查：

1. 系统日志：`pm2 logs`
2. Nginx日志：`/var/log/nginx/`
3. MySQL日志：`/var/log/mysql/`
4. 系统资源：`htop` 或 `top`

---

## 附录

### 常用命令速查

```bash
# PM2
pm2 start/stop/restart/delete crm-system
pm2 logs crm-system
pm2 monit

# Nginx
sudo systemctl start/stop/restart nginx
sudo nginx -t

# MySQL
sudo systemctl start/stop/restart mysql
mysql -u crm_user -p crm_system

# 系统
sudo systemctl status <service>
sudo journalctl -u <service> -f
```

### 默认端口

- Node.js应用: 3000
- MySQL: 3306
- Nginx HTTP: 80
- Nginx HTTPS: 443

---

**部署文档版本**: 1.0  
**最后更新**: 2026-01-22
