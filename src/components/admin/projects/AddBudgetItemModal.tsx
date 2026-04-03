// =============================================
// ADD BUDGET ITEM MODAL COMPONENT
// File: src/components/admin/projects/AddBudgetItemModal.tsx
// =============================================

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import type { ProjectBudgetItem, BudgetCategory, ProjectBudgetItemCreate } from '@/lib/types/budget';
import { createProjectBudgetItem, updateProjectBudgetItem } from '@/lib/queries/budget';

interface AddBudgetItemModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  categories: BudgetCategory[];
  editingItem?: ProjectBudgetItem | null;
  onSuccess: () => void;
}

export const AddBudgetItemModal: React.FC<AddBudgetItemModalProps> = ({
  open,
  onClose,
  projectId,
  categories,
  editingItem,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProjectBudgetItemCreate>({
    project_id: projectId,
    category_id: '',
    item_name: '',
    planned_amount: 0,
    description: ''
  });

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setFormData({
          project_id: projectId,
          category_id: editingItem.category_id,
          item_name: editingItem.item_name,
          planned_amount: editingItem.planned_amount,
          description: editingItem.description || ''
        });
      } else {
        setFormData({
          project_id: projectId,
          category_id: '',
          item_name: '',
          planned_amount: 0,
          description: ''
        });
      }
    }
  }, [open, editingItem, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_id) {
      toast({
        title: 'กรุณากรอกข้อมูล',
        description: 'กรุณาเลือกหมวดหมู่',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.item_name.trim()) {
      toast({
        title: 'กรุณากรอกข้อมูล',
        description: 'กรุณากรอกชื่อรายการ',
        variant: 'destructive'
      });
      return;
    }

    if (formData.planned_amount <= 0) {
      toast({
        title: 'กรุณากรอกข้อมูล',
        description: 'จำนวนเงินต้องมากกว่า 0',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      if (editingItem) {
        await updateProjectBudgetItem(editingItem.id, formData);
        toast({
          title: 'สำเร็จ',
          description: 'แก้ไขรายการงบประมาณแล้ว'
        });
      } else {
        await createProjectBudgetItem(formData);
        toast({
          title: 'สำเร็จ',
          description: 'เพิ่มรายการงบประมาณแล้ว'
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving budget item:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: editingItem ? 'ไม่สามารถแก้ไขรายการได้' : 'ไม่สามารถเพิ่มรายการได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'แก้ไขรายการงบประมาณ' : 'เพิ่มรายการงบประมาณ'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">หมวดหมู่</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, category_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="item_name">ชื่อรายการ</Label>
            <Input
              id="item_name"
              value={formData.item_name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                item_name: e.target.value
              }))}
              placeholder="เช่น ค่าอาหารประชุม, ค่าวัสดุอุปกรณ์"
              required
            />
          </div>

          {/* Planned Amount */}
          <div className="space-y-2">
            <Label htmlFor="planned_amount">จำนวนเงินวางแผน (บาท)</Label>
            <Input
              id="planned_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.planned_amount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                planned_amount: parseFloat(e.target.value) || 0
              }))}
              placeholder="0.00"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบาย (ไม่บังคับ)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              placeholder="รายละเอียดเพิ่มเติมของรายการงบประมาณ"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : editingItem ? 'แก้ไข' : 'เพิ่ม'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};