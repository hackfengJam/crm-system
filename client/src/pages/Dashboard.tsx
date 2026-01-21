import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, CheckSquare, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading } = trpc.analytics.summary.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">仪表盘</h1>
          <p className="text-muted-foreground mt-2">欢迎回来，查看您的业务概况</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "客户总数",
      value: summary?.totalCustomers || 0,
      description: `活跃客户 ${summary?.activeCustomers || 0} 个`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "销售机会",
      value: summary?.totalOpportunities || 0,
      description: "进行中的机会",
      icon: Briefcase,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "待办任务",
      value: summary?.pendingTasks || 0,
      description: "需要处理的任务",
      icon: CheckSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "总营收",
      value: `¥${(summary?.totalRevenue || 0).toLocaleString()}`,
      description: "已成交金额",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground mt-2">欢迎回来，查看您的业务概况</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/customers"
              className="block p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="font-medium">添加新客户</div>
              <div className="text-sm text-muted-foreground">创建新的客户档案</div>
            </a>
            <a
              href="/opportunities"
              className="block p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="font-medium">创建销售机会</div>
              <div className="text-sm text-muted-foreground">跟踪新的销售机会</div>
            </a>
            <a
              href="/tasks"
              className="block p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="font-medium">添加任务</div>
              <div className="text-sm text-muted-foreground">创建新的待办任务</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              暂无最近活动
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
