import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// 权限检查中间件
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: '需要管理员权限' 
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // 客户管理
  customers: router({
    list: protectedProcedure
      .input(z.object({
        ownerId: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const ownerId = ctx.user.role === 'admin' ? input?.ownerId : ctx.user.id;
        return await db.getAllCustomers(ownerId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCustomerById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        companyName: z.string().min(1, "公司名称不能为空"),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email("邮箱格式不正确").optional().or(z.literal("")),
        address: z.string().optional(),
        industry: z.string().optional(),
        website: z.string().optional(),
        source: z.string().optional(),
        status: z.enum(["active", "inactive", "potential"]).default("potential"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createCustomer({
          ...input,
          ownerId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        companyName: z.string().min(1).optional(),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().optional(),
        industry: z.string().optional(),
        website: z.string().optional(),
        source: z.string().optional(),
        status: z.enum(["active", "inactive", "potential"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateCustomer(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteCustomer(input.id);
      }),

    search: protectedProcedure
      .input(z.object({
        searchTerm: z.string(),
        status: z.string().optional(),
        industry: z.string().optional(),
        source: z.string().optional(),
        ownerId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const filters = {
          ...input,
          ownerId: ctx.user.role === 'admin' ? input.ownerId : ctx.user.id,
        };
        return await db.searchCustomers(input.searchTerm, filters);
      }),
  }),

  // 联系历史
  contactHistory: router({
    listByCustomer: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getContactHistoryByCustomer(input.customerId);
      }),

    create: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        type: z.enum(["call", "email", "meeting", "visit", "other"]),
        subject: z.string().min(1, "主题不能为空"),
        content: z.string().min(1, "内容不能为空"),
        contactDate: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createContactHistory({
          ...input,
          userId: ctx.user.id,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteContactHistory(input.id);
      }),
  }),

  // 销售阶段
  salesStages: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllSalesStages();
    }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1, "阶段名称不能为空"),
        description: z.string().optional(),
        order: z.number(),
        probability: z.number().min(0).max(100),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createSalesStage(input);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        order: z.number().optional(),
        probability: z.number().min(0).max(100).optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateSalesStage(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteSalesStage(input.id);
      }),
  }),

  // 销售机会
  opportunities: router({
    list: protectedProcedure
      .input(z.object({
        ownerId: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const ownerId = ctx.user.role === 'admin' ? input?.ownerId : ctx.user.id;
        return await db.getAllOpportunities(ownerId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getOpportunityById(input.id);
      }),

    listByStage: protectedProcedure
      .input(z.object({ stageId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOpportunitiesByStage(input.stageId);
      }),

    create: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        name: z.string().min(1, "机会名称不能为空"),
        description: z.string().optional(),
        amount: z.string().optional(),
        probability: z.number().min(0).max(100).default(0),
        stageId: z.number(),
        expectedCloseDate: z.string().optional(),
        status: z.enum(["open", "won", "lost"]).default("open"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { expectedCloseDate, ...rest } = input;
        return await db.createOpportunity({
          ...rest,
          expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
          ownerId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        customerId: z.number().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        amount: z.string().optional(),
        probability: z.number().min(0).max(100).optional(),
        stageId: z.number().optional(),
        expectedCloseDate: z.string().optional(),
        actualCloseDate: z.string().optional(),
        status: z.enum(["open", "won", "lost"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, expectedCloseDate, actualCloseDate, ...rest } = input;
        const data: any = { ...rest };
        if (expectedCloseDate !== undefined) {
          data.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
        }
        if (actualCloseDate !== undefined) {
          data.actualCloseDate = actualCloseDate ? new Date(actualCloseDate) : null;
        }
        return await db.updateOpportunity(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteOpportunity(input.id);
      }),
  }),

  // 任务管理
  tasks: router({
    list: protectedProcedure
      .input(z.object({
        assignedTo: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const assignedTo = ctx.user.role === 'admin' ? input?.assignedTo : ctx.user.id;
        return await db.getAllTasks(assignedTo);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTaskById(input.id);
      }),

    listByCustomer: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTasksByCustomer(input.customerId);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1, "任务标题不能为空"),
        description: z.string().optional(),
        customerId: z.number().optional(),
        opportunityId: z.number().optional(),
        assignedTo: z.number(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        status: z.enum(["todo", "in_progress", "completed", "cancelled"]).default("todo"),
        dueDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { dueDate, ...rest } = input;
        return await db.createTask({
          ...rest,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          createdBy: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        customerId: z.number().optional(),
        opportunityId: z.number().optional(),
        assignedTo: z.number().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
        dueDate: z.string().optional(),
        completedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, dueDate, ...rest } = input;
        const data: any = { ...rest };
        if (dueDate !== undefined) {
          data.dueDate = dueDate ? new Date(dueDate) : null;
        }
        return await db.updateTask(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteTask(input.id);
      }),
  }),

  // 数据分析
  analytics: router({
    opportunitiesByStage: protectedProcedure.query(async () => {
      return await db.getOpportunitiesGroupedByStage();
    }),

    customersBySource: protectedProcedure.query(async () => {
      return await db.getCustomersBySource();
    }),

    opportunitiesTrend: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getOpportunitiesTrend(input.startDate, input.endDate);
      }),

    summary: protectedProcedure.query(async ({ ctx }) => {
      const ownerId = ctx.user.role === 'admin' ? undefined : ctx.user.id;
      const customers = await db.getAllCustomers(ownerId);
      const opportunities = await db.getAllOpportunities(ownerId);
      const tasks = await db.getAllTasks(ctx.user.id);

      const openOpportunities = opportunities.filter(o => o.status === 'open');
      const wonOpportunities = opportunities.filter(o => o.status === 'won');
      const totalRevenue = wonOpportunities.reduce((sum, o) => sum + Number(o.amount || 0), 0);
      const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');

      return {
        totalCustomers: customers.length,
        activeCustomers: customers.filter(c => c.status === 'active').length,
        totalOpportunities: openOpportunities.length,
        totalRevenue,
        pendingTasks: pendingTasks.length,
      };
    }),
  }),

  // 用户管理
  users: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
  }),
});

export type AppRouter = typeof appRouter;
