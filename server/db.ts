import { eq, desc, and, or, like, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  customers, InsertCustomer, Customer,
  contactHistory, InsertContactHistory, ContactHistory,
  salesStages, InsertSalesStage, SalesStage,
  opportunities, InsertOpportunity, Opportunity,
  tasks, InsertTask, Task
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ========== 用户相关 ==========
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

// ========== 客户相关 ==========
export async function createCustomer(customer: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customers).values(customer);
  return result;
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}

export async function getAllCustomers(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (ownerId) {
    return await db.select().from(customers).where(eq(customers.ownerId, ownerId)).orderBy(desc(customers.updatedAt));
  }
  return await db.select().from(customers).orderBy(desc(customers.updatedAt));
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(customers).where(eq(customers.id, id));
}

export async function searchCustomers(searchTerm: string, filters?: {
  status?: string;
  industry?: string;
  source?: string;
  ownerId?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (searchTerm) {
    conditions.push(
      or(
        like(customers.companyName, `%${searchTerm}%`),
        like(customers.contactPerson, `%${searchTerm}%`),
        like(customers.email, `%${searchTerm}%`),
        like(customers.phone, `%${searchTerm}%`)
      )
    );
  }

  if (filters?.status) {
    conditions.push(eq(customers.status, filters.status as any));
  }
  if (filters?.industry) {
    conditions.push(eq(customers.industry, filters.industry));
  }
  if (filters?.source) {
    conditions.push(eq(customers.source, filters.source));
  }
  if (filters?.ownerId) {
    conditions.push(eq(customers.ownerId, filters.ownerId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  return await db.select().from(customers)
    .where(whereClause)
    .orderBy(desc(customers.updatedAt));
}

// ========== 联系历史相关 ==========
export async function createContactHistory(history: InsertContactHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(contactHistory).values(history);
}

export async function getContactHistoryByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contactHistory)
    .where(eq(contactHistory.customerId, customerId))
    .orderBy(desc(contactHistory.contactDate));
}

export async function deleteContactHistory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(contactHistory).where(eq(contactHistory.id, id));
}

// ========== 销售阶段相关 ==========
export async function createSalesStage(stage: InsertSalesStage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(salesStages).values(stage);
}

export async function getAllSalesStages() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(salesStages).orderBy(salesStages.order);
}

export async function updateSalesStage(id: number, data: Partial<InsertSalesStage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(salesStages).set(data).where(eq(salesStages.id, id));
}

export async function deleteSalesStage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(salesStages).where(eq(salesStages.id, id));
}

// ========== 销售机会相关 ==========
export async function createOpportunity(opportunity: InsertOpportunity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(opportunities).values(opportunity);
}

export async function getOpportunityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  return result[0];
}

export async function getAllOpportunities(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (ownerId) {
    return await db.select().from(opportunities)
      .where(eq(opportunities.ownerId, ownerId))
      .orderBy(desc(opportunities.updatedAt));
  }
  return await db.select().from(opportunities).orderBy(desc(opportunities.updatedAt));
}

export async function getOpportunitiesByStage(stageId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(opportunities)
    .where(eq(opportunities.stageId, stageId))
    .orderBy(desc(opportunities.updatedAt));
}

export async function updateOpportunity(id: number, data: Partial<InsertOpportunity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(opportunities).set(data).where(eq(opportunities.id, id));
}

export async function deleteOpportunity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(opportunities).where(eq(opportunities.id, id));
}

// ========== 任务相关 ==========
export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(tasks).values(task);
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function getAllTasks(assignedTo?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (assignedTo) {
    return await db.select().from(tasks)
      .where(eq(tasks.assignedTo, assignedTo))
      .orderBy(desc(tasks.createdAt));
  }
  return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getTasksByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks)
    .where(eq(tasks.customerId, customerId))
    .orderBy(desc(tasks.createdAt));
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(tasks).where(eq(tasks.id, id));
}

// ========== 数据分析相关 ==========
export async function getOpportunitiesGroupedByStage() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      stageId: opportunities.stageId,
      count: sql<number>`count(*)`,
      totalAmount: sql<number>`sum(${opportunities.amount})`,
    })
    .from(opportunities)
    .where(eq(opportunities.status, 'open'))
    .groupBy(opportunities.stageId);
}

export async function getCustomersBySource() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      source: customers.source,
      count: sql<number>`count(*)`,
    })
    .from(customers)
    .groupBy(customers.source);
}

export async function getOpportunitiesTrend(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      date: sql<string>`DATE(${opportunities.createdAt})`,
      count: sql<number>`count(*)`,
      totalAmount: sql<number>`sum(${opportunities.amount})`,
    })
    .from(opportunities)
    .where(
      and(
        gte(opportunities.createdAt, startDate),
        lte(opportunities.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${opportunities.createdAt})`);
}
