// =============================================
// ADD EXPENSE MODAL COMPONENT
// File: src/components/admin/projects/AddExpenseModal.tsx
// =============================================

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import type { ProjectBudgetItem, BudgetTransactionCreate } from '@/lib/types/budget';
import { createBudgetTransaction } from '@/lib/queries/budget';
import { FileUpload } from '@/components/ui/file-upload';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  budgetItems: ProjectBudgetItem[];
  onSuccess: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  open,
  onClose,
  projectId,
  budgetItems,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BudgetTransactionCreate>({
    project_id: projectId,
    amount: 0,
    transaction_type: 'expense',
    description: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [documentId, setDocumentId] = useState<string>('');

  useEffect(() => {
    if (open) {
      setFormData({
        project_id: projectId,
        amount: 0,
        transaction_type: 'expense',
        description: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });
      setSelectedDate(new Date());
      setDocumentId('');
    }
  }, [open, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast({
        title: 'กรุณากรอกข้อมูล',
        description: 'กรุณากรอกคำอธิบายธุรกรรม',
        variant: 'destructive'
      });
      return;
    }

    if (formData.amount <= 0) {
      toast({
        title: 'กรุณากรอกข้อมูล',
        description: 'จำนวนเงินต้องมากกว่า 0',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      await createBudgetTransaction({
        ...formData,
        document_id: documentId || undefined
      });

      toast({
        title: 'สำเร็จ',
        description: 'เพิ่มธุรกรรมแล้ว'
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มธุรกรรมได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({
        ...prev,
        transaction_date: format(date, 'yyyy-MM-dd')
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>เพิ่มรายจ่าย</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="transaction_type">ประเภทธุรกรรม</Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(value: 'expense' | 'refund' | 'adjustment') =>
                setFormData(prev => ({ ...prev, transaction_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">รายจ่าย</SelectItem>
                <SelectItem value="refund">คืนเงิน</SelectItem>
                <SelectItem value="adjustment">ปรับปรุง</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Budget Item */}
          <div className="space-y-2">
            <Label htmlFor="budget_item">รายการงบประมาณ (ไม่บังคับ)</Label>
            <Select
              value={formData.budget_item_id || ''}
              onValueChange={(value) =>
                setFormData(prev => ({
                  ...prev,
                  budget_item_id: value || undefined
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกหรือเว้นว่าง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ไม่ระบุรายการ</SelectItem>
                {budgetItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.item_name} ({item.category?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                amount: parseFloat(e.target.value) || 0
              }))}
              placeholder="0.00"
              required
            />
          </div>

          {/* Transaction Date */}
          <div className="space-y-2">
            <Label>วันที่ทำธุรกรรม</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: th })
                  ) : (
                    <span>เลือกวันที่</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบาย</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              placeholder="อธิบายรายละเอียดของธุรกรรม"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ (ไม่บังคับ)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>เอกสารหลักฐาน (ไม่บังคับ)</Label>
            <FileUpload
              category="budget"
              department="projects"
              onUploadComplete={(fileData) => {
                setDocumentId(fileData.id);
                toast({
                  title: 'อัพโหลดสำเร็จ',
                  description: 'เอกสารถูกอัพโหลดแล้ว'
                });
              }}
              onUploadError={(error) => {
                console.error('Upload error:', error);
                toast({
                  title: 'เกิดข้อผิดพลาด',
                  description: 'ไม่สามารถอัพโหลดเอกสารได้',
                  variant: 'destructive'
                });
              }}
            />
            {documentId && (
              <p className="text-sm text-green-600">เอกสารถูกอัพโหลดแล้ว</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};