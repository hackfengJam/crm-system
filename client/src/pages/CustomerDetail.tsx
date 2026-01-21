import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, Phone, Mail, MapPin, Globe, Plus, Calendar, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const [, setLocation] = useLocation();
  const customerId = params?.id ? parseInt(params.id) : 0;

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyForm, setHistoryForm] = useState({
    type: "call" as const,
    subject: "",
    content: "",
    contactDate: new Date().toISOString().split('T')[0],
  });

  const { data: customer, isLoading } = trpc.customers.getById.useQuery({ id: customerId });
  const { data: history, refetch: refetchHistory } = trpc.contactHistory.listByCustomer.useQuery({ customerId });
  const { data: tasks } = trpc.tasks.listByCustomer.useQuery({ customerId });

  const createHistoryMutation = trpc.contactHistory.create.useMutation({
    onSuccess: () => {
      toast.success("联系记录添加成功");
      setIsHistoryOpen(false);
      setHistoryForm({
        type: "call",
        subject: "",
        content: "",
        contactDate: new Date().toISOString().split('T')[0],
      });
      refetchHistory();
    },
    onError: (error) => {
      toast.error(error.message || "添加失败");
    },
  });

  const handleHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createHistoryMutation.mutate({
      customerId,
      ...historyForm,
      contactDate: new Date(historyForm.contactDate),
    });
  };

  if (isLoading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">客户不存在</p>
        <Button onClick={() => setLocation("/customers")} className="mt-4">
          返回客户列表
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      potential: "bg-blue-100 text-blue-800",
    };
    const labels = {
      active: "活跃",
      inactive: "不活跃",
      potential: "潜在",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      call: "电话",
      email: "邮件",
      meeting: "会议",
      visit: "拜访",
      other: "其他",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/customers")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{customer.companyName}</h1>
          <p className="text-muted-foreground mt-1">客户详细信息</p>
        </div>
        {getStatusBadge(customer.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">公司名称</div>
                <div className="font-medium">{customer.companyName}</div>
              </div>
            </div>
            {customer.contactPerson && (
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">联系人</div>
                  <div className="font-medium">{customer.contactPerson}</div>
                </div>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">电话</div>
                  <div className="font-medium">{customer.phone}</div>
                </div>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">邮箱</div>
                  <div className="font-medium">{customer.email}</div>
                </div>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">地址</div>
                  <div className="font-medium">{customer.address}</div>
                </div>
              </div>
            )}
            {customer.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">网站</div>
                  <a href={customer.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {customer.website}
                  </a>
                </div>
              </div>
            )}
            {customer.industry && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">行业</div>
                <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                  {customer.industry}
                </span>
              </div>
            )}
            {customer.source && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">客户来源</div>
                <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                  {customer.source}
                </span>
              </div>
            )}
            {customer.notes && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">备注</div>
                <p className="text-sm">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>联系历史</CardTitle>
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  添加记录
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加联系记录</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleHistorySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">联系类型</Label>
                    <Select value={historyForm.type} onValueChange={(value: any) => setHistoryForm({ ...historyForm, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">电话</SelectItem>
                        <SelectItem value="email">邮件</SelectItem>
                        <SelectItem value="meeting">会议</SelectItem>
                        <SelectItem value="visit">拜访</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">主题</Label>
                    <Input
                      id="subject"
                      value={historyForm.subject}
                      onChange={(e) => setHistoryForm({ ...historyForm, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactDate">联系日期</Label>
                    <Input
                      id="contactDate"
                      type="date"
                      value={historyForm.contactDate}
                      onChange={(e) => setHistoryForm({ ...historyForm, contactDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">内容</Label>
                    <Textarea
                      id="content"
                      value={historyForm.content}
                      onChange={(e) => setHistoryForm({ ...historyForm, content: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsHistoryOpen(false)}>
                      取消
                    </Button>
                    <Button type="submit" disabled={createHistoryMutation.isPending}>
                      {createHistoryMutation.isPending ? "添加中..." : "添加记录"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="border-l-2 border-primary pl-4 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-primary">{getTypeLabel(item.type)}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.contactDate), 'yyyy-MM-dd')}
                      </span>
                    </div>
                    <div className="font-medium text-sm mb-1">{item.subject}</div>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                暂无联系记录
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>相关任务</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{task.title}</div>
                    {task.dueDate && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.dueDate), 'yyyy-MM-dd')}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待办'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              暂无相关任务
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
