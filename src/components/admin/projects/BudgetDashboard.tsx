// =============================================
// BUDGET EXECUTIVE DASHBOARD COMPONENT
// File: src/components/admin/projects/BudgetDashboard.tsx
// =============================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

import type { BudgetDashboardStats, ProjectBudgetSummary, BudgetTransaction } from '@/lib/types/budget';
import {
  getBudgetDashboardStats,
  getAllProjectsBudgetSummary,
  getFilteredBudgetTransactions
} from '@/lib/queries/budget';

export const BudgetDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BudgetDashboardStats | null>(null);
  const [projectsSummary, setProjectsSummary] = useState<ProjectBudgetSummary[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<BudgetTransaction[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, projectsData] = await Promise.all([
        getBudgetDashboardStats(),
        getAllProjectsBudgetSummary()
      ]);

      setStats(statsData);
      setProjectsSummary(projectsData);
      setRecentTransactions(statsData.recent_transactions);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // TODO: Implement CSV/PDF export
    toast({
      title: 'ฟีเจอร์นี้ยังไม่พร้อมใช้งาน',
      description: 'การส่งออกรายงานจะถูกเพิ่มในภายหลัง'
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">กำลังโหลดแดชบอร์ด...</div>;
  }

  if (!stats) {
    return <div className="flex justify-center p-8">ไม่พบข้อมูล</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">แดชบอร์ดงบประมาณ</h1>
          <p className="text-muted-foreground">ภาพรวมงบประมาณโครงการทั้งหมด</p>
        </div>
        <Button onClick={exportReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          ส่งออกรายงาน
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งบประมาณรวม</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_budget_allocated)}</div>
            <p className="text-xs text-muted-foreground">
              จาก {stats.total_projects} โครงการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ใช้ไปแล้ว</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_budget_used)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_budget_allocated > 0
                ? `${((stats.total_budget_used / stats.total_budget_allocated) * 100).toFixed(1)}%`
                : '0%'
              } ของงบประมาณรวม
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คงเหลือ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.total_budget_remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(stats.total_budget_remaining)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total_budget_remaining < 0 ? 'เกินงบประมาณ' : 'คงเหลือ'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">โครงการเสี่ยง</CardTitle>
            {stats.projects_over_budget > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-green-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.projects_over_budget > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.projects_over_budget}
            </div>
            <p className="text-xs text-muted-foreground">
              โครงการที่ใช้เงินเกินงบ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">ภาพรวมโครงการ</TabsTrigger>
          <TabsTrigger value="transactions">ธุรกรรมล่าสุด</TabsTrigger>
          <TabsTrigger value="analytics">วิเคราะห์</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>สถานะงบประมาณโครงการ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectsSummary.map((project) => {
                  const usagePercentage = project.total_planned > 0
                    ? (project.total_used / project.total_planned) * 100
                    : 0;

                  return (
                    <div key={project.project_id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{project.project_title}</h4>
                          <p className="text-sm text-muted-foreground">
                            สถานะ: {project.project_status}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(project.total_used)} / {formatCurrency(project.total_planned)}
                          </div>
                          <Badge variant={project.remaining_budget < 0 ? 'destructive' : 'default'}>
                            {project.remaining_budget < 0 ? 'เกินงบ' : 'ปกติ'}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{usagePercentage.toFixed(1)}% ใช้แล้ว</span>
                        <span>คงเหลือ: {formatCurrency(project.remaining_budget)}</span>
                      </div>
                    </div>
                  );
                })}
                {projectsSummary.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    ยังไม่มีข้อมูลโครงการ
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ธุรกรรมล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center border-b pb-4">
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
                      <p className="text-sm text-muted-foreground">
                        โครงการ: {transaction.project?.title}
                      </p>
                    </div>
                    <div className={`font-bold text-lg ${
                      transaction.transaction_type === 'expense' ? 'text-red-600' :
                      transaction.transaction_type === 'refund' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {transaction.transaction_type === 'expense' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    ยังไม่มีธุรกรรม
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  การใช้จ่ายรายเดือน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>กราฟแสดงการใช้จ่ายรายเดือน</p>
                  <p className="text-sm">ฟีเจอร์นี้จะถูกเพิ่มในภายหลัง</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  สัดส่วนหมวดหมู่
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>กราฟแสดงสัดส่วนหมวดหมู่</p>
                  <p className="text-sm">ฟีเจอร์นี้จะถูกเพิ่มในภายหลัง</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};