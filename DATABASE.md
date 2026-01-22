# CRM系统数据库设计文档

本文档详细说明CRM客户关系管理系统的数据库结构设计。

---

## 数据库概览

- **数据库类型**: MySQL 8.0+ / TiDB
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **ORM**: Drizzle ORM
- **表数量**: 6张核心业务表

---

## 表结构详细说明

### 1. users（用户表）

存储系统用户信息，支持OAuth认证。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 用户ID |
| openId | VARCHAR(64) | NOT NULL, UNIQUE | OAuth唯一标识 |
| name | TEXT | NULL | 用户姓名 |
| email | VARCHAR(320) | NULL | 邮箱地址 |
| loginMethod | VARCHAR(64) | NULL | 登录方式 |
| role | ENUM('user', 'admin') | NOT NULL, DEFAULT 'user' | 用户角色 |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |
| lastSignedIn | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 最后登录时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE KEY (openId)

**说明**:
- `role`字段用于权限控制，管理员拥有全部权限
- `openId`是OAuth系统返回的唯一标识
- 首个注册用户自动成为管理员

---

### 2. customers（客户表）

存储客户基本信息和档案。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 客户ID |
| companyName | VARCHAR(255) | NOT NULL | 公司名称 |
| contactPerson | VARCHAR(100) | NULL | 联系人姓名 |
| phone | VARCHAR(20) | NULL | 联系电话 |
| email | VARCHAR(320) | NULL | 邮箱地址 |
| address | TEXT | NULL | 公司地址 |
| industry | VARCHAR(100) | NULL | 所属行业 |
| website | VARCHAR(255) | NULL | 公司网站 |
| source | VARCHAR(50) | NULL | 客户来源（如：网站、推荐、展会等） |
| status | ENUM('potential', 'active', 'inactive', 'lost') | NOT NULL, DEFAULT 'potential' | 客户状态 |
| notes | TEXT | NULL | 备注信息 |
| createdBy | INT | NOT NULL | 创建人ID |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (createdBy)
- INDEX (status)
- INDEX (source)

**外键**:
- createdBy → users(id)

**客户状态说明**:
- `potential`: 潜在客户
- `active`: 活跃客户
- `inactive`: 不活跃客户
- `lost`: 流失客户

---

### 3. contact_history（联系历史表）

记录与客户的所有互动历史。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 记录ID |
| customerId | INT | NOT NULL | 关联客户ID |
| type | ENUM('call', 'email', 'meeting', 'visit', 'other') | NOT NULL | 联系方式 |
| subject | VARCHAR(255) | NOT NULL | 主题 |
| content | TEXT | NULL | 详细内容 |
| contactDate | TIMESTAMP | NOT NULL | 联系日期 |
| createdBy | INT | NOT NULL | 创建人ID |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (customerId)
- INDEX (createdBy)
- INDEX (contactDate)

**外键**:
- customerId → customers(id) ON DELETE CASCADE
- createdBy → users(id)

**联系类型说明**:
- `call`: 电话沟通
- `email`: 邮件往来
- `meeting`: 会议
- `visit`: 拜访
- `other`: 其他方式

---

### 4. sales_stages（销售阶段表）

定义销售流程的各个阶段。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 阶段ID |
| name | VARCHAR(50) | NOT NULL | 阶段名称 |
| description | TEXT | NULL | 阶段描述 |
| order | INT | NOT NULL | 排序顺序 |
| probability | INT | NOT NULL, DEFAULT 0 | 成交概率（0-100） |
| color | VARCHAR(20) | NULL | 显示颜色（十六进制） |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (order)

**预置阶段**:
1. 线索（概率10%，颜色#e0e7ff）
2. 洽谈（概率30%，颜色#c7d2fe）
3. 报价（概率50%，颜色#a5b4fc）
4. 谈判（概率70%，颜色#818cf8）
5. 成交（概率100%，颜色#6366f1）

---

### 5. opportunities（销售机会表）

跟踪销售机会和交易进展。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 机会ID |
| name | VARCHAR(255) | NOT NULL | 机会名称 |
| customerId | INT | NOT NULL | 关联客户ID |
| stageId | INT | NOT NULL | 当前阶段ID |
| amount | DECIMAL(15,2) | NULL | 预计金额 |
| probability | INT | NOT NULL, DEFAULT 0 | 成交概率（0-100） |
| expectedCloseDate | DATE | NULL | 预计成交日期 |
| actualCloseDate | DATE | NULL | 实际成交日期 |
| status | ENUM('open', 'won', 'lost') | NOT NULL, DEFAULT 'open' | 机会状态 |
| description | TEXT | NULL | 机会描述 |
| lostReason | TEXT | NULL | 丢单原因 |
| createdBy | INT | NOT NULL | 创建人ID |
| assignedTo | INT | NULL | 负责人ID |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (customerId)
- INDEX (stageId)
- INDEX (createdBy)
- INDEX (assignedTo)
- INDEX (status)
- INDEX (expectedCloseDate)

**外键**:
- customerId → customers(id) ON DELETE CASCADE
- stageId → sales_stages(id)
- createdBy → users(id)
- assignedTo → users(id)

**机会状态说明**:
- `open`: 进行中
- `won`: 已成交
- `lost`: 已丢单

---

### 6. tasks（任务表）

管理与客户和销售机会相关的任务。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 任务ID |
| title | VARCHAR(255) | NOT NULL | 任务标题 |
| description | TEXT | NULL | 任务描述 |
| customerId | INT | NULL | 关联客户ID |
| opportunityId | INT | NULL | 关联机会ID |
| assignedTo | INT | NOT NULL | 负责人ID |
| priority | ENUM('low', 'medium', 'high', 'urgent') | NOT NULL, DEFAULT 'medium' | 优先级 |
| status | ENUM('todo', 'in_progress', 'completed', 'cancelled') | NOT NULL, DEFAULT 'todo' | 任务状态 |
| dueDate | DATE | NULL | 截止日期 |
| completedAt | TIMESTAMP | NULL | 完成时间 |
| createdBy | INT | NOT NULL | 创建人ID |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (customerId)
- INDEX (opportunityId)
- INDEX (assignedTo)
- INDEX (createdBy)
- INDEX (status)
- INDEX (dueDate)

**外键**:
- customerId → customers(id) ON DELETE CASCADE
- opportunityId → opportunities(id) ON DELETE CASCADE
- assignedTo → users(id)
- createdBy → users(id)

**优先级说明**:
- `low`: 低优先级
- `medium`: 中等优先级
- `high`: 高优先级
- `urgent`: 紧急

**任务状态说明**:
- `todo`: 待办
- `in_progress`: 进行中
- `completed`: 已完成
- `cancelled`: 已取消

---

## 实体关系图（ER图）

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       │ 1:N
       │
       ├─────────────────────────┐
       │                         │
       ↓                         ↓
┌─────────────┐           ┌─────────────┐
│  customers  │           │    tasks    │
└──────┬──────┘           └─────────────┘
       │                         ↑
       │ 1:N                     │
       │                         │
       ├─────────────┬───────────┘
       │             │
       ↓             ↓
┌─────────────┐  ┌──────────────┐
│contact_     │  │opportunities │
│history      │  └──────┬───────┘
└─────────────┘         │
                        │ N:1
                        │
                        ↓
                 ┌─────────────┐
                 │sales_stages │
                 └─────────────┘
```

**关系说明**:
- 一个用户可以创建多个客户
- 一个客户可以有多条联系历史
- 一个客户可以有多个销售机会
- 一个销售机会属于一个销售阶段
- 一个任务可以关联一个客户或一个销售机会

---

## 数据迁移

### 初始化数据库

```bash
# 1. 推送schema到数据库
pnpm db:push

# 2. 初始化销售阶段数据
# 参考DEPLOYMENT.md中的初始化脚本
```

### 数据导入导出

**导出数据**:
```bash
mysqldump -u crm_user -p crm_system > crm_backup.sql
```

**导入数据**:
```bash
mysql -u crm_user -p crm_system < crm_backup.sql
```

---

## 性能优化建议

### 1. 索引优化

已为常用查询字段创建索引：
- 外键字段
- 状态字段
- 日期字段
- 创建人/负责人字段

### 2. 查询优化

```sql
-- 使用索引的查询示例
SELECT * FROM customers WHERE status = 'active';
SELECT * FROM tasks WHERE assignedTo = 1 AND status = 'todo';
SELECT * FROM opportunities WHERE stageId = 3 ORDER BY expectedCloseDate;
```

### 3. 分页查询

```sql
-- 使用LIMIT进行分页
SELECT * FROM customers 
ORDER BY createdAt DESC 
LIMIT 20 OFFSET 0;
```

### 4. 定期维护

```sql
-- 分析表
ANALYZE TABLE customers;
ANALYZE TABLE opportunities;
ANALYZE TABLE tasks;

-- 优化表
OPTIMIZE TABLE customers;
OPTIMIZE TABLE opportunities;
OPTIMIZE TABLE tasks;
```

---

## 数据安全

### 1. 备份策略

- **频率**: 每天自动备份
- **保留期**: 30天
- **存储位置**: 独立备份服务器

### 2. 访问控制

- 使用独立数据库用户
- 限制远程访问
- 使用强密码策略

### 3. 数据加密

- 传输加密：使用SSL连接
- 存储加密：敏感字段加密存储（如需要）

---

## 常见查询示例

### 统计查询

```sql
-- 客户总数
SELECT COUNT(*) FROM customers;

-- 活跃客户数
SELECT COUNT(*) FROM customers WHERE status = 'active';

-- 各阶段机会分布
SELECT s.name, COUNT(o.id) as count, SUM(o.amount) as total_amount
FROM opportunities o
JOIN sales_stages s ON o.stageId = s.id
WHERE o.status = 'open'
GROUP BY s.id, s.name
ORDER BY s.order;

-- 客户来源分析
SELECT source, COUNT(*) as count
FROM customers
GROUP BY source
ORDER BY count DESC;

-- 待办任务统计
SELECT COUNT(*) FROM tasks 
WHERE status IN ('todo', 'in_progress');
```

### 业务查询

```sql
-- 查询客户及其联系历史
SELECT c.*, ch.type, ch.subject, ch.contactDate
FROM customers c
LEFT JOIN contact_history ch ON c.id = ch.customerId
WHERE c.id = 1
ORDER BY ch.contactDate DESC;

-- 查询销售机会及客户信息
SELECT o.*, c.companyName, s.name as stageName
FROM opportunities o
JOIN customers c ON o.customerId = c.id
JOIN sales_stages s ON o.stageId = s.id
WHERE o.status = 'open'
ORDER BY o.expectedCloseDate;

-- 查询用户的任务列表
SELECT t.*, c.companyName, o.name as opportunityName
FROM tasks t
LEFT JOIN customers c ON t.customerId = c.id
LEFT JOIN opportunities o ON t.opportunityId = o.id
WHERE t.assignedTo = 1 AND t.status != 'completed'
ORDER BY t.dueDate;
```

---

## 数据字典总结

| 表名 | 说明 | 记录数预估 | 增长速度 |
|------|------|-----------|---------|
| users | 用户表 | 10-100 | 慢 |
| customers | 客户表 | 1000-10000 | 中 |
| contact_history | 联系历史表 | 10000-100000 | 快 |
| sales_stages | 销售阶段表 | 5-10 | 几乎不变 |
| opportunities | 销售机会表 | 1000-10000 | 中 |
| tasks | 任务表 | 5000-50000 | 快 |

---

**数据库文档版本**: 1.0  
**最后更新**: 2026-01-22
