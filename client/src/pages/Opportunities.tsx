import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Opportunities() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: 0,
    name: "",
    description: "",
    amount: "",
    probability: 50,
    stageId: 0,
    expectedCloseDate: "",
    notes: "",
  });

  const { data: opportunities, isLoading, refetch } = trpc.opportunities.list.useQuery();
  const { data: stages } = trpc.salesStages.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  
  const createMutation = trpc.opportunities.create.useMutation({
    onSuccess: () => {
      toast.success("销售机会创建成功");
      setIsCreateOpen(false);
      setFormData({
        customerId: 0,
        name: "",
        description: "",
        amount: "",
        probability: 50,
        stageId: 0,
        expectedCloseDate: "",
        notes: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  const updateMutation = trpc.opportunities.update.useMutation({
    onSuccess: () => {
      toast.success("阶段更新成功");
      refetch();
    },
  });

  useEffect(() => {
    if (stages && stages.length > 0 && formData.stageId === 0) {
      setFormData(prev => ({ ...prev, stageId: stages[0].id }));
    }
  }, [stages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.customerId === 0) {
      toast.error("请选择客户");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleStageChange = (opportunityId: number, newStageId: number) => {
    updateMutation.mutate({ id: opportunityId, stageId: newStageId });
  };

  const getOpportunitiesByStage = (stageId: number) => {
    return opportunities?.filter(opp => opp.stageId === stageId && opp.status === 'open') || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">销售机会</h1>
          <p className="text-muted-foreground mt-2">跟踪和管理销售机会</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              创建机会
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建销售机会</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="customerId">客户 *</Label>
                  <Select 
                    value={formData.customerId.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, customerId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择客户" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">机会名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">预计金额</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="probability">成交概率 (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stageId">销售阶段 *</Label>
                  <Select 
                    value={formData.stageId.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, stageId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages?.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id.toString()}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedCloseDate">预计成交日期</Label>
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  />
                </div>
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
              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "创建中..." : "创建机会"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stages && stages.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageOpportunities = getOpportunitiesByStage(stage.id);
            const totalAmount = stageOpportunities.reduce((sum, opp) => sum + Number(opp.amount || 0), 0);

            return (
              <div key={stage.id} className="flex-shrink-0 w-80">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{stage.name}</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {stageOpportunities.length} 个
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      总额: ¥{totalAmount.toLocaleString()}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stageOpportunities.length > 0 ? (
                      stageOpportunities.map((opp) => {
                        const customer = customers?.find(c => c.id === opp.customerId);
                        return (
                          <Card key={opp.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 space-y-2">
                              <div className="font-medium">{opp.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {customer?.companyName}
                              </div>
                              {opp.amount && (
                                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                                  <DollarSign className="h-4 w-4" />
                                  ¥{Number(opp.amount).toLocaleString()}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  {opp.probability}%
                                </div>
                                {opp.expectedCloseDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(opp.expectedCloseDate), 'MM/dd')}
                                  </div>
                                )}
                              </div>
                              <div className="pt-2">
                                <Select
                                  value={opp.stageId.toString()}
                                  onValueChange={(value) => handleStageChange(opp.id, parseInt(value))}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stages.map((s) => (
                                      <SelectItem key={s.id} value={s.id.toString()}>
                                        {s.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        暂无机会
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">请先配置销售阶段</p>
            <p className="text-sm text-muted-foreground mt-2">管理员可以在设置中配置销售流程阶段</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
