import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(role: "admin" | "user" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("customers", () => {
  it("should create a customer successfully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customers.create({
      companyName: "测试公司",
      contactPerson: "张三",
      phone: "13800138000",
      email: "test@test.com",
      status: "potential",
    });

    expect(result).toBeDefined();
  });

  it("should list customers for authenticated user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const customers = await caller.customers.list();

    expect(Array.isArray(customers)).toBe(true);
  });

  it("should search customers by company name", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 先创建一个客户
    await caller.customers.create({
      companyName: "搜索测试公司",
      contactPerson: "李四",
      phone: "13900139000",
      email: "search@test.com",
      status: "active",
    });

    // 搜索客户
    const results = await caller.customers.search({
      searchTerm: "搜索测试",
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.companyName).toContain("搜索测试");
  });

  it("should require company name when creating customer", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.customers.create({
        companyName: "",
        status: "potential",
      })
    ).rejects.toThrow();
  });
});

describe("contactHistory", () => {
  it("should create contact history for a customer", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 先创建一个客户
    await caller.customers.create({
      companyName: "历史测试公司",
      status: "active",
    });

    const customers = await caller.customers.list();
    const customerId = customers[0]?.id;

    if (customerId) {
      const result = await caller.contactHistory.create({
        customerId,
        type: "call",
        subject: "初次沟通",
        content: "讨论了项目需求",
        contactDate: new Date(),
      });

      expect(result).toBeDefined();
    }
  });

  it("should list contact history for a customer", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const customers = await caller.customers.list();
    const customerId = customers[0]?.id;

    if (customerId) {
      const history = await caller.contactHistory.listByCustomer({ customerId });
      expect(Array.isArray(history)).toBe(true);
    }
  });
});
