import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date } from "drizzle-orm/mysql-core";

/**
 * 用户表 - 核心认证和权限管理
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 客户表 - 存储客户基本信息
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  industry: varchar("industry", { length: 100 }),
  website: varchar("website", { length: 255 }),
  source: varchar("source", { length: 100 }), // 客户来源：广告、推荐、展会等
  status: mysqlEnum("status", ["active", "inactive", "potential"]).default("potential").notNull(),
  notes: text("notes"),
  ownerId: int("ownerId").notNull(), // 负责人
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * 联系历史记录表 - 记录与客户的所有互动
 */
export const contactHistory = mysqlTable("contactHistory", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  userId: int("userId").notNull(), // 记录人
  type: mysqlEnum("type", ["call", "email", "meeting", "visit", "other"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  contactDate: timestamp("contactDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContactHistory = typeof contactHistory.$inferSelect;
export type InsertContactHistory = typeof contactHistory.$inferInsert;

/**
 * 销售阶段表 - 定义销售流程的各个阶段
 */
export const salesStages = mysqlTable("salesStages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  order: int("order").notNull(), // 阶段顺序
  probability: int("probability").notNull(), // 成交概率 0-100
  color: varchar("color", { length: 20 }), // 用于可视化的颜色
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SalesStage = typeof salesStages.$inferSelect;
export type InsertSalesStage = typeof salesStages.$inferInsert;

/**
 * 销售机会表 - 跟踪潜在的销售机会
 */
export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 15, scale: 2 }), // 预计金额
  probability: int("probability").default(0).notNull(), // 成交概率 0-100
  stageId: int("stageId").notNull(),
  expectedCloseDate: date("expectedCloseDate"),
  actualCloseDate: date("actualCloseDate"),
  status: mysqlEnum("status", ["open", "won", "lost"]).default("open").notNull(),
  ownerId: int("ownerId").notNull(), // 负责人
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

/**
 * 任务表 - 管理待办任务
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  customerId: int("customerId"), // 关联客户（可选）
  opportunityId: int("opportunityId"), // 关联销售机会（可选）
  assignedTo: int("assignedTo").notNull(), // 分配给谁
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["todo", "in_progress", "completed", "cancelled"]).default("todo").notNull(),
  dueDate: date("dueDate"),
  completedAt: timestamp("completedAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
