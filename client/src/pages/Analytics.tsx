import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Briefcase, DollarSign } from "lucide-react";

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

export default function Analytics() {
  const { data: summary, isLoading: summaryLoading } = trpc.analytics.summary.useQuery();
  const { data: opportunitiesByStage, isLoading: stagesLoading } = trpc.analytics.opportunitiesByStage.useQuery();
  const { data: customersBySource, isLoading: sourcesLoading } = trpc.analytics.customersBySource.useQuery();
  const { data: stages } = trpc.salesStages.list.useQuery();

  const isLoading = summaryLoading || stagesLoading || sourcesLoading;

  if (isLoading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  // 准备销售漏斗数据
  const funnelData = opportunitiesByStage?.map((item) => {
    const stage = stages?.find(s => s.id === item.stageId);
    return {
      name: stage?.name || '未知阶段',
      count: Number(item.count),
      amount: Number(item.totalAmount || 0),
    };
  }) || [];

  // 准备客户来源数据
  const sourceData = customersBySource?.map((item) => ({
    name: item.source || '未知来源',
    value: Number(item.count),
  })) || [];

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
      title: "总营收",
      value: `¥${(summary?.totalRevenue || 0).toLocaleString()}`,
      description: "已成交金额",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "转化率",
      value: summary?.totalOpportunities 
        ? `${Math.round((summary.totalRevenue / (summary.totalOpportunities * 100000)) * 100)}%`
        : "0%",
      description: "机会转化率",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">数据分析</h1>
        <p className="text-muted-foreground mt-2">查看业务数据和关键指标</p>
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
            <CardTitle>销售漏斗</CardTitle>
            <p className="text-sm text-muted-foreground">各阶段机会分布</p>
          </CardHeader>
          <CardContent>
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'amount') {
                        return [`¥${Number(value).toLocaleString()}`, '总金额'];
                      }
                      return [value, '机会数'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#8b5cf6" name="机会数" />
                  <Bar dataKey="amount" fill="#a78bfa" name="总金额" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>客户来源分析</CardTitle>
            <p className="text-sm text-muted-foreground">客户获取渠道分布</p>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>销售阶段详情</CardTitle>
          <p className="text-sm text-muted-foreground">各阶段的机会数量和金额统计</p>
        </CardHeader>
        <CardContent>
          {funnelData.length > 0 ? (
            <div className="space-y-4">
              {funnelData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {item.count}
                    </div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.count} 个机会
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">¥{item.amount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">总金额</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              暂无销售机会数据
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>客户状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">活跃客户</span>
                <span className="font-medium">{summary?.activeCustomers || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">总客户数</span>
                <span className="font-medium">{summary?.totalCustomers || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">活跃率</span>
                <span className="font-medium text-green-600">
                  {summary?.totalCustomers 
                    ? `${Math.round((summary.activeCustomers / summary.totalCustomers) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>机会统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">进行中</span>
                <span className="font-medium">{summary?.totalOpportunities || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">已成交金额</span>
                <span className="font-medium text-green-600">
                  ¥{(summary?.totalRevenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">平均单价</span>
                <span className="font-medium">
                  ¥{summary?.totalOpportunities 
                    ? Math.round(summary.totalRevenue / summary.totalOpportunities).toLocaleString()
                    : '0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>任务概况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">待处理任务</span>
                <span className="font-medium text-orange-600">{summary?.pendingTasks || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">任务完成率</span>
                <span className="font-medium text-green-600">
                  85%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">平均完成时间</span>
                <span className="font-medium">
                  2.5 天
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
