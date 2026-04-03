// =============================================
// PROJECT BUDGET PAGE COMPONENT
// File: src/components/admin/projects/ProjectBudgetPage.tsx
// =============================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, DollarSign, TrendingUp, AlertTriangle, FileText, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

import type {
  ProjectBudgetItem,
  BudgetTransaction,
  ProjectBudgetSummary,
  BudgetCategory
} from '@/lib/types/budget';

import {
  getProjectBudgetItems,
  getProjectBudgetTransactions,
  getProjectBudgetSummary,
  getBudgetCategories,
  deleteProjectBudgetItem,
  deleteBudgetTransaction
} from '@/lib/queries/budget';

import { AddExpenseModal } from './AddExpenseModal';
import { AddBudgetItemModal } from './AddBudgetItemModal';

interface ProjectBudgetPageProps {
  projectId: string;
  projectTitle: string;
}

export const ProjectBudgetPage: React.FC<ProjectBudgetPageProps> = ({
  projectId,
  projectTitle
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ProjectBudgetSummary | null>(null);
  const [budgetItems, setBudgetItems] = useState<ProjectBudgetItem[]>([]);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBudgetItemModal, setShowBudgetItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectBudgetItem | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, itemsData, transactionsData, categoriesData] = await Promise.all([
        getProjectBudgetSummary(projectId),
        getProjectBudgetItems(projectId),
        getProjectBudgetTransactions(projectId),
        getBudgetCategories()
      ]);

      setSummary(summaryData);
      setBudgetItems(itemsData);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading budget data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลงบประมาณได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudgetItem = async (itemId: string) => {
    if (!confirm('คุณต้องการลบรายการงบประมาณนี้ใช่หรือไม่?')) return;

    try {
      await deleteProjectBudgetItem(itemId);
      toast({
        title: 'สำเร็จ',
        description: 'ลบรายการงบประมาณแล้ว'
      });
      loadData();
    } catch (error) {
      console.error('Error deleting budget item:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบรายการงบประมาณได้',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('คุณต้องการลบธุรกรรมนี้ใช่หรือไม่?')) return;

    try {
      await deleteBudgetTransaction(transactionId);
      toast({
        title: 'สำเร็จ',
        description: 'ลบธุรกรรมแล้ว'
      });
      loadData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบธุรกรรมได้',
        variant: 'destructive'
      });
    }
  };

  const getBudgetProgress = (item: ProjectBudgetItem) => {
    const used = transactions
      .filter(t => t.budget_item_id === item.id && t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const percentage = item.planned_amount > 0 ? (used / item.planned_amount) * 100 : 0;
    return { used, percentage };
  };

  if (loading) {
    return <div className="flex justify-center p-8">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">งบประมาณโครงการ</h1>
          <p className="text-muted-foreground">{projectTitle}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowBudgetItemModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มรายการงบประมาณ
          </Button>
          <Button variant="outline" onClick={() => setShowExpenseModal(true)}>
            <DollarSign className="w-4 h-4 mr-2" />
            เพิ่มรายจ่าย
          </Button>
        </div>
      </div>

      {/* Budget Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">งบประมาณรวม</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_planned)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ใช้ไปแล้ว</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_used)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">คงเหลือ</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.remaining_budget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(summary.remaining_budget)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">สถานะ</CardTitle>
              {summary.remaining_budget < 0 ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-green-600" />
              )}
            </CardHeader>
            <CardContent>
              <Badge variant={summary.remaining_budget < 0 ? 'destructive' : 'default'}>
                {summary.remaining_budget < 0 ? 'เกินงบประมาณ' : 'ปกติ'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Details Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">รายการงบประมาณ ({budgetItems.length})</TabsTrigger>
          <TabsTrigger value="transactions">ธุรกรรม ({transactions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="grid gap-4">
            {budgetItems.map((item) => {
              const { used, percentage } = getBudgetProgress(item);
              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.item_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {item.category?.name} • วางแผน: {formatCurrency(item.planned_amount)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item);
                            setShowBudgetItemModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBudgetItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>ใช้ไปแล้ว: {formatCurrency(used)}</span>
                        <span>คงเหลือ: {formatCurrency(item.planned_amount - used)}</span>
                      </div>
                      <Progress value={Math.min(percentage, 100)} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% ของงบประมาณ
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {budgetItems.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">ยังไม่มีรายการงบประมาณ</p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowBudgetItemModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มรายการงบประมาณ
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          transaction.transaction_type === 'expense' ? 'destructive' :
                          transaction.transaction_type === 'refund' ? 'default' : 'secondary'
                        }>
                          {transaction.transaction_type === 'expense' ? 'รายจ่าย' :
                           transaction.transaction_type === 'refund' ? 'คืนเงิน' : 'ปรับปรุง'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(transaction.transaction_date).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      <p className="font-medium">{transaction.description}</p>
                      {transaction.budget_item && (
                        <p className="text-sm text-muted-foreground">
                          รายการ: {transaction.budget_item.item_name}
                        </p>
                      )}
                      {transaction.created_by_user && (
                        <p className="text-xs text-muted-foreground">
                          โดย: {transaction.created_by_user.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`font-bold text-lg ${
                        transaction.transaction_type === 'expense' ? 'text-red-600' :
                        transaction.transaction_type === 'refund' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {transaction.transaction_type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement edit transaction
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {transaction.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{transaction.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {transactions.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">ยังไม่มีธุรกรรม</p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowExpenseModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มรายจ่าย
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddExpenseModal
        open={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        projectId={projectId}
        budgetItems={budgetItems}
        onSuccess={loadData}
      />

      <AddBudgetItemModal
        open={showBudgetItemModal}
        onClose={() => {
          setShowBudgetItemModal(false);
          setEditingItem(null);
        }}
        projectId={projectId}
        categories={categories}
        editingItem={editingItem}
        onSuccess={loadData}
      />
    </div>
  );
};