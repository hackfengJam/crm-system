import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Tasks() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customerId: undefined as number | undefined,
    opportunityId: undefined as number | undefined,
    assignedTo: user?.id || 0,
    priority: "medium" as const,
    dueDate: "",
  });

  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: opportunities } = trpc.opportunities.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("任务创建成功");
      setIsCreateOpen(false);
      setFormData({
        title: "",
        description: "",
        customerId: undefined,
        opportunityId: undefined,
        assignedTo: user?.id || 0,
        priority: "medium",
        dueDate: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("任务更新成功");
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateMutation.mutate({
      id: taskId,
      status: newStatus as any,
      completedAt: newStatus === 'completed' ? new Date() : undefined,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      urgent: '紧急',
      high: '高',
      medium: '中',
      low: '低',
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      todo: '待办',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status] || status;
  };

  const filterTasksByStatus = (status: string) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  if (isLoading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  const todoTasks = filterTasksByStatus('todo');
  const inProgressTasks = filterTasksByStatus('in_progress');
  const completedTasks = filterTasksByStatus('completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">任务管理</h1>
          <p className="text-muted-foreground mt-2">创建和跟踪您的任务</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              创建任务
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建新任务</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">任务标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">关联客户</Label>
                  <Select 
                    value={formData.customerId?.toString() || "none"} 
                    onValueChange={(value) => setFormData({ ...formData, customerId: value === "none" ? undefined : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择客户（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opportunityId">关联机会</Label>
                  <Select 
                    value={formData.opportunityId?.toString() || "none"} 
                    onValueChange={(value) => setFormData({ ...formData, opportunityId: value === "none" ? undefined : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择机会（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {opportunities?.map((opp) => (
                        <SelectItem key={opp.id} value={opp.id.toString()}>
                          {opp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">分配给 *</Label>
                  <Select 
                    value={formData.assignedTo.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, assignedTo: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">优先级</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="urgent">紧急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="dueDate">截止日期</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "创建中..." : "创建任务"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="todo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todo">
            待办 ({todoTasks.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            进行中 ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            已完成 ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="space-y-4">
          {todoTasks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {todoTasks.map((task) => {
                const customer = customers?.find(c => c.id === task.customerId);
                const assignedUser = users?.find(u => u.id === task.assignedTo);
                return (
                  <Card key={task.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      {customer && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">客户: </span>
                          {customer.companyName}
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          截止: {format(new Date(task.dueDate), 'yyyy-MM-dd')}
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground">分配给: </span>
                        {assignedUser?.name || assignedUser?.email}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(task.id, 'in_progress')}
                          className="flex-1"
                        >
                          开始
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(task.id, 'completed')}
                          className="flex-1"
                        >
                          完成
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无待办任务</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {inProgressTasks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {inProgressTasks.map((task) => {
                const customer = customers?.find(c => c.id === task.customerId);
                const assignedUser = users?.find(u => u.id === task.assignedTo);
                return (
                  <Card key={task.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      {customer && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">客户: </span>
                          {customer.companyName}
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          截止: {format(new Date(task.dueDate), 'yyyy-MM-dd')}
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground">分配给: </span>
                        {assignedUser?.name || assignedUser?.email}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(task.id, 'todo')}
                          className="flex-1"
                        >
                          返回待办
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(task.id, 'completed')}
                          className="flex-1"
                        >
                          完成
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无进行中的任务</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTasks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {completedTasks.map((task) => {
                const customer = customers?.find(c => c.id === task.customerId);
                const assignedUser = users?.find(u => u.id === task.assignedTo);
                return (
                  <Card key={task.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500 opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          {task.title}
                        </CardTitle>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      {customer && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">客户: </span>
                          {customer.companyName}
                        </div>
                      )}
                      {task.completedAt && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          完成于: {format(new Date(task.completedAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground">分配给: </span>
                        {assignedUser?.name || assignedUser?.email}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无已完成的任务</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
