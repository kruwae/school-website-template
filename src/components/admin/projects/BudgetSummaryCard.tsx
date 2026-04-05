// =============================================
// BUDGET SUMMARY CARD COMPONENT
// File: src/components/admin/projects/BudgetSummaryCard.tsx
// =============================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react';
import type { ProjectBudgetSummary } from '@/lib/types/budget';
import { formatCurrency } from '@/lib/utils';

interface BudgetSummaryCardProps {
  summary: ProjectBudgetSummary;
  clickable?: boolean;
  onClick?: () => void;
}

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  summary,
  clickable = false,
  onClick
}) => {
  const utilization = summary.total_planned > 0 
    ? (summary.total_used / summary.total_planned) * 100 
    : 0;
  
  const isOverBudget = summary.remaining_budget < 0;
  const isCritical = utilization > 90 && !isOverBudget;
  const isHealthy = utilization <= 70;

  const getStatusColor = () => {
    if (isOverBudget) return 'border-red-200 bg-red-50';
    if (isCritical) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isCritical) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = () => {
    if (isOverBudget) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          เกินงบประมาณ
        </Badge>
      );
    }
    if (isCritical) {
      return (
        <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3" />
          ใกล้เต็ม
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" />
        สุขภาพดี
      </Badge>
    );
  };

  return (
    <Card 
      className={`border-2 cursor-pointer ${getStatusColor()} transition-all hover:shadow-lg ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{summary.project_title}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="text-sm font-medium text-gray-600">
          สถานะ: <span className="capitalize">{summary.project_status}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ใช้จริง</span>
            <span className="font-semibold">{utilization.toFixed(1)}%</span>
          </div>
          <Progress 
            value={Math.min(utilization, 100)} 
            className="h-2"
          />
          <div className="text-xs text-gray-500">
            {formatCurrency(summary.total_used)} / {formatCurrency(summary.total_planned)}
          </div>
        </div>

        {/* Budget Details */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-xs text-gray-500">วางแผน</div>
            <div className="text-sm font-semibold">{formatCurrency(summary.total_planned)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">ใช้แล้ว</div>
            <div className="text-sm font-semibold text-red-600">{formatCurrency(summary.total_used)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">คงเหลือ</div>
            <div className={`text-sm font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(summary.remaining_budget))}
            </div>
          </div>
        </div>

        {/* Transaction Stats */}
        <div className="flex gap-2 text-xs text-gray-600 pt-2 border-t">
          <span>📋 {summary.budget_items_count} รายการ</span>
          <span>📝 {summary.transactions_count} ธุรกรรม</span>
        </div>
      </CardContent>
    </Card>
  );
};
