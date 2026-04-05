// =============================================
// BUDGET CATEGORY BREAKDOWN CHART COMPONENT
// File: src/components/admin/projects/BudgetCategoryBreakdown.tsx
// =============================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getCategorySummary } from '@/lib/queries/budget';
import { formatCurrency } from '@/lib/utils';

interface CategorySummary {
  category_id: string;
  category_name: string;
  category_code: string;
  total_planned: number;
  total_used: number;
  remaining: number;
  utilization_percentage: number;
}

interface BudgetCategoryBreakdownProps {
  projectId: string;
  refresh?: boolean;
}

export const BudgetCategoryBreakdown: React.FC<BudgetCategoryBreakdownProps> = ({
  projectId,
  refresh = false
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);

  useEffect(() => {
    loadCategorySummary();
  }, [projectId, refresh]);

  const loadCategorySummary = async () => {
    try {
      setLoading(true);
      const data = await getCategorySummary(projectId);
      setCategorySummary(data || []);
    } catch (error) {
      console.error('Error loading category summary:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลหมวดหมู่ได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (utilization: number) => {
    if (utilization >= 100) return 'text-red-600';
    if (utilization >= 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (utilization: number) => {
    if (utilization >= 100) return 'bg-red-500';
    if (utilization >= 90) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">กำลังโหลด...</div>
        </CardContent>
      </Card>
    );
  }

  if (categorySummary.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>การใช้งบประมาณตามหมวดหมู่</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            ไม่มีข้อมูลหมวดหมู่
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPlanned = categorySummary.reduce((sum, cat) => sum + cat.total_planned, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>การใช้งบประมาณตามหมวดหมู่</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categorySummary.map((category) => (
          <div key={category.category_id} className="space-y-2 pb-4 border-b last:border-b-0 last:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{category.category_code}</Badge>
                <div>
                  <p className="font-medium">{category.category_name}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(category.total_planned)} งบประมาณ
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-sm ${getStatusColor(category.utilization_percentage)}`}>
                  {category.utilization_percentage.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(category.total_used)} ใช้แล้ว
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress
                value={Math.min(category.utilization_percentage, 100)}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>ใช้: {formatCurrency(category.total_used)}</span>
                <span>คงเหลือ: {formatCurrency(category.remaining)}</span>
              </div>
            </div>

            {/* Status */}
            {category.utilization_percentage >= 100 && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                ⚠️ เกินงบประมาณ {formatCurrency(Math.abs(category.remaining))}
              </div>
            )}
            {category.utilization_percentage >= 90 && category.utilization_percentage < 100 && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                ⚠️ ใช้งบประมาณไปแล้ว {category.utilization_percentage.toFixed(1)}% คงเหลือ {formatCurrency(category.remaining)}
              </div>
            )}
          </div>
        ))}

        {/* Summary */}
        <div className="pt-4 border-t-2 space-y-2 mt-4">
          <div className="flex justify-between font-semibold">
            <span>รวมงบประมาณทั้งหมด</span>
            <span>{formatCurrency(totalPlanned)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">รวมใช้ไป</span>
            <span className="text-red-600">
              {formatCurrency(categorySummary.reduce((sum, cat) => sum + cat.total_used, 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">รวมคงเหลือ</span>
            <span className="text-green-600">
              {formatCurrency(categorySummary.reduce((sum, cat) => sum + cat.remaining, 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
