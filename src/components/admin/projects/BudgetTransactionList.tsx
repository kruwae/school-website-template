// =============================================
// BUDGET TRANSACTION LIST COMPONENT
// File: src/components/admin/projects/BudgetTransactionList.tsx
// =============================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Edit2, Trash2, Download, DollarSign, RefreshCw, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BudgetTransaction } from '@/lib/types/budget';
import { getProjectBudgetTransactions, deleteBudgetTransaction } from '@/lib/queries/budget';
import { formatCurrency } from '@/lib/utils';

interface BudgetTransactionListProps {
  projectId: string;
  onEdit: (transaction: BudgetTransaction) => void;
  onAddNew: () => void;
  refresh?: boolean;
}

export const BudgetTransactionList: React.FC<BudgetTransactionListProps> = ({
  projectId,
  onEdit,
  onAddNew,
  refresh = false
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<BudgetTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'refund' | 'adjustment'>('all');

  useEffect(() => {
    loadTransactions();
  }, [projectId, refresh]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterType]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getProjectBudgetTransactions(projectId);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดรายการธุรกรรมได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(term) ||
        t.budget_item?.item_name.toLowerCase().includes(term) ||
        t.created_by_user?.name.toLowerCase().includes(term)
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('คุณแน่ใจหรือว่าต้องการลบรายการนี้?')) return;

    try {
      await deleteBudgetTransaction(transactionId);
      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบรายการธุรกรรมสำเร็จแล้ว'
      });
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบรายการได้',
        variant: 'destructive'
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <DollarSign className="w-4 h-4 text-red-600" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case 'adjustment':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getTransactionBadge = (type: string) => {
    const variants: Record<string, any> = {
      expense: { label: 'รายจ่าย', variant: 'destructive' },
      refund: { label: 'คืนเงิน', variant: 'secondary' },
      adjustment: { label: 'ปรับปรุง', variant: 'secondary' }
    };
    const config = variants[type] || variants.expense;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>รายการธุรกรรม</CardTitle>
          <Button onClick={onAddNew} size="sm">เพิ่มรายการ</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <Input
            placeholder="ค้นหารายการ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="expense">รายจ่าย</SelectItem>
              <SelectItem value="refund">คืนเงิน</SelectItem>
              <SelectItem value="adjustment">ปรับปรุง</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            ไม่มีรายการธุรกรรม
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>รายการ</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>คิดจาก</TableHead>
                  <TableHead>สร้างโดย</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.transaction_date).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>{getTransactionBadge(transaction.transaction_type)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.budget_item && (
                          <p className="text-sm text-gray-500">
                            {transaction.budget_item.category?.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {transaction.transaction_type === 'refund' ? '-' : ''}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {transaction.budget_item?.item_name || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {transaction.created_by_user?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(transaction)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="text-sm text-gray-600 pt-2">
          แสดง {filteredTransactions.length} จาก {transactions.length} รายการ
        </div>
      </CardContent>
    </Card>
  );
};
