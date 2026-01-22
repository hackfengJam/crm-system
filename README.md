# CRM客户关系管理系统

一个功能完整、视觉优雅的企业级CRM系统，采用现代化技术栈构建，支持私有化部署。

![CRM系统](https://img.shields.io/badge/version-1.0.0-blue) ![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green) ![License](https://img.shields.io/badge/license-MIT-orange)

---

## 功能特性

### 核心业务功能

✅ **客户管理**
- 完整的客户档案管理（公司信息、联系人、联系方式等）
- 客户状态跟踪（潜在、活跃、不活跃、流失）
- 客户来源分析
- 强大的搜索和筛选功能

✅ **联系历史记录**
- 记录所有客户互动（电话、邮件、会议、拜访）
- 时间线视图展示
- 支持添加详细备注

✅ **销售机会管理**
- 创建和跟踪销售机会
- 预计金额和成交概率管理
- 成交日期预测
- 机会状态管理（进行中、已成交、已丢单）

✅ **销售阶段管理**
- 可视化销售漏斗
- 看板视图展示各阶段机会
- 拖拽式阶段推进
- 自定义销售流程

✅ **任务管理**
- 创建和分配任务
- 优先级设置（低、中、高、紧急）
- 截止日期提醒
- 任务状态跟踪（待办、进行中、已完成）

✅ **数据分析**
- 销售漏斗可视化
- 客户来源分析
- 关键指标展示（客户总数、销售机会、总营收、转化率）
- 销售阶段统计

✅ **用户权限管理**
- 基于角色的访问控制（管理员/普通用户）
- 用户认证和授权
- 数据权限隔离

---

## 技术架构

### 前端技术栈

- **框架**: React 19 + TypeScript
- **样式**: Tailwind CSS 4（优雅的紫色系设计）
- **UI组件**: shadcn/ui
- **状态管理**: tRPC React Query
- **图表**: Recharts
- **路由**: Wouter
- **表单**: React Hook Form + Zod

### 后端技术栈

- **运行时**: Node.js 18+
- **框架**: Express 4
- **API**: tRPC 11（端到端类型安全）
- **数据库**: MySQL 8.0+ / TiDB
- **ORM**: Drizzle ORM
- **认证**: JWT + OAuth

### 开发工具

- **构建工具**: Vite 7
- **包管理**: pnpm
- **代码检查**: TypeScript
- **测试**: Vitest

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- MySQL >= 8.0 或 TiDB
- pnpm（推荐）或 npm

### 本地开发

1. **克隆项目**

```bash
git clone <repository-url>
cd crm-system
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

创建 `.env` 文件：

```env
DATABASE_URL=mysql://user:password@localhost:3306/crm_system
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
PORT=3000
```

4. **初始化数据库**

```bash
# 推送数据库schema
pnpm db:push

# 初始化销售阶段数据（可选）
# 参考DEPLOYMENT.md
```

5. **启动开发服务器**

```bash
pnpm dev
```

访问 `http://localhost:3000` 查看应用。

---

## 生产部署

详细的生产环境部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)，包括：

- 服务器环境准备
- 数据库配置
- Nginx反向代理配置
- SSL证书配置
- PM2进程管理
- 系统维护和备份策略

---

## 项目结构

```
crm-system/
├── client/                 # 前端代码
│   ├── public/            # 静态资源
│   └── src/
│       ├── components/    # UI组件
│       ├── pages/         # 页面组件
│       ├── lib/           # 工具库
│       ├── hooks/         # 自定义Hooks
│       ├── contexts/      # React Context
│       ├── App.tsx        # 应用入口
│       └── index.css      # 全局样式
├── server/                # 后端代码
│   ├── _core/            # 核心框架代码
│   ├── db.ts             # 数据库查询函数
│   ├── routers.ts        # tRPC路由定义
│   └── *.test.ts         # 单元测试
├── drizzle/              # 数据库相关
│   └── schema.ts         # 数据库Schema定义
├── shared/               # 前后端共享代码
├── DEPLOYMENT.md         # 部署文档
├── DATABASE.md           # 数据库设计文档
├── package.json          # 项目配置
└── README.md            # 本文件
```

---

## 可用脚本

```bash
# 开发
pnpm dev              # 启动开发服务器

# 构建
pnpm build            # 构建生产版本

# 生产
pnpm start            # 启动生产服务器

# 数据库
pnpm db:push          # 推送数据库schema变更

# 测试
pnpm test             # 运行单元测试

# 代码检查
pnpm check            # TypeScript类型检查
pnpm format           # 格式化代码
```

---

## 核心功能截图

### 仪表盘
展示关键业务指标和快速操作入口。

### 客户管理
完整的客户档案管理和搜索功能。

### 销售机会看板
可视化展示销售漏斗和机会分布。

### 任务管理
按状态分类的任务管理界面。

### 数据分析
销售数据可视化和趋势分析。

---

## 数据库设计

系统使用6张核心业务表：

1. **users** - 用户表
2. **customers** - 客户表
3. **contact_history** - 联系历史表
4. **sales_stages** - 销售阶段表
5. **opportunities** - 销售机会表
6. **tasks** - 任务表

详细的数据库设计请参考 [DATABASE.md](./DATABASE.md)。

---

## API文档

本系统使用tRPC实现类型安全的API，主要路由包括：

### 认证相关
- `auth.me` - 获取当前用户信息
- `auth.logout` - 用户登出

### 客户管理
- `customers.list` - 获取客户列表
- `customers.getById` - 获取客户详情
- `customers.create` - 创建客户
- `customers.update` - 更新客户
- `customers.delete` - 删除客户
- `customers.search` - 搜索客户

### 联系历史
- `contactHistory.listByCustomer` - 获取客户联系历史
- `contactHistory.create` - 创建联系记录
- `contactHistory.update` - 更新联系记录
- `contactHistory.delete` - 删除联系记录

### 销售机会
- `opportunities.list` - 获取机会列表
- `opportunities.getById` - 获取机会详情
- `opportunities.create` - 创建机会
- `opportunities.update` - 更新机会
- `opportunities.delete` - 删除机会
- `opportunities.updateStage` - 更新机会阶段

### 销售阶段
- `salesStages.list` - 获取阶段列表

### 任务管理
- `tasks.list` - 获取任务列表
- `tasks.create` - 创建任务
- `tasks.update` - 更新任务
- `tasks.delete` - 删除任务

### 数据分析
- `analytics.summary` - 获取汇总数据
- `analytics.opportunitiesByStage` - 按阶段统计机会
- `analytics.customersBySource` - 按来源统计客户

### 用户管理
- `users.list` - 获取用户列表

---

## 安全性

### 认证和授权
- JWT Token认证
- 基于角色的访问控制（RBAC）
- 会话管理

### 数据安全
- SQL注入防护（使用ORM）
- XSS防护
- CSRF防护
- 密码加密存储

### 网络安全
- HTTPS加密传输
- 安全的HTTP头配置
- 速率限制

---

## 性能优化

### 前端优化
- 代码分割和懒加载
- 图片优化和CDN
- 浏览器缓存策略
- React性能优化（useMemo, useCallback）

### 后端优化
- 数据库索引优化
- 查询优化
- 连接池管理
- 缓存策略

### 部署优化
- Gzip压缩
- 静态资源CDN
- 负载均衡
- PM2集群模式

---

## 浏览器支持

- Chrome（推荐）
- Firefox
- Safari
- Edge

建议使用最新版本的现代浏览器以获得最佳体验。

---

## 常见问题

### 如何修改OAuth认证方式？

系统默认使用Manus OAuth，如需使用自定义认证，请修改 `server/_core/auth.ts` 和相关配置。

### 如何自定义销售阶段？

可以直接在数据库的 `sales_stages` 表中添加、修改或删除阶段，系统会自动同步。

### 如何备份数据？

参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的数据库备份章节，提供了自动备份脚本。

### 如何扩展新功能？

1. 在 `drizzle/schema.ts` 中定义新表
2. 在 `server/db.ts` 中添加查询函数
3. 在 `server/routers.ts` 中添加API路由
4. 在 `client/src/pages/` 中创建页面组件
5. 编写单元测试

---

## 开发指南

### 添加新功能的流程

1. **数据库设计**
   - 在 `drizzle/schema.ts` 定义表结构
   - 运行 `pnpm db:push` 推送变更

2. **后端开发**
   - 在 `server/db.ts` 添加数据访问函数
   - 在 `server/routers.ts` 添加tRPC路由
   - 编写单元测试

3. **前端开发**
   - 在 `client/src/pages/` 创建页面
   - 使用 `trpc.*` hooks调用API
   - 在 `client/src/App.tsx` 添加路由

4. **测试验证**
   - 运行 `pnpm test` 确保测试通过
   - 手动测试功能完整性

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint规则
- 使用Prettier格式化代码
- 编写有意义的注释

---

## 贡献指南

欢迎贡献代码、报告问题或提出建议。

### 提交Issue

- 清晰描述问题或建议
- 提供复现步骤（如果是bug）
- 附上相关截图或日志

### 提交Pull Request

1. Fork项目
2. 创建特性分支
3. 提交代码并编写测试
4. 确保所有测试通过
5. 提交Pull Request

---

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](./LICENSE) 文件。

---

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交Issue
- 发送邮件至项目维护者

---

## 更新日志

### v1.0.0 (2026-01-22)

**首次发布**

- ✅ 完整的客户管理功能
- ✅ 联系历史记录
- ✅ 销售机会跟踪
- ✅ 销售阶段管理
- ✅ 任务管理系统
- ✅ 数据分析和可视化
- ✅ 用户认证和权限管理
- ✅ 优雅的紫色系UI设计
- ✅ 完整的部署文档
- ✅ 单元测试覆盖

---

## 致谢

感谢以下开源项目：

- [React](https://react.dev/)
- [tRPC](https://trpc.io/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)

---

**项目版本**: 1.0.0  
**最后更新**: 2026-01-22
