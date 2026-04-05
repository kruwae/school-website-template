// =============================================
// BUDGET CATEGORY SELECTOR COMPONENT
// File: src/components/admin/projects/BudgetCategorySelector.tsx
// =============================================

import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { BudgetCategory } from '@/lib/types/budget';

interface BudgetCategorySelectorProps {
  categories: BudgetCategory[];
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const BudgetCategorySelector: React.FC<BudgetCategorySelectorProps> = ({
  categories,
  value,
  onChange,
  disabled = false,
  placeholder = 'เลือกหมวดหมู่'
}) => {
  const selectedCategory = categories.find(cat => cat.id === value);

  return (
    <div className="w-full">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {categories.map(category => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <span>{category.code}</span>
                <span className="text-gray-600">-</span>
                <span>{category.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedCategory && (
        <div className="mt-2 p-2 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">{selectedCategory.description}</p>
        </div>
      )}
    </div>
  );
};
