// =============================================
// PROJECT BUDGET MANAGEMENT TYPES
// File: src/lib/types/budget.ts
// =============================================

export interface BudgetCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectBudgetItem {
  id: string;
  project_id: string;
  category_id: string;
  item_name: string;
  planned_amount: number;
  description?: string;
  created_at: string;
  updated_at: string;
  // Relations
  category?: BudgetCategory;
}

export interface BudgetTransaction {
  id: string;
  project_id: string;
  budget_item_id?: string;
  amount: number;
  transaction_type: 'expense' | 'refund' | 'adjustment';
  description: string;
  transaction_date: string;
  created_by?: string;
  document_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  budget_item?: ProjectBudgetItem;
  created_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  document?: {
    id: string;
    file_name: string;
    file_url: string;
  };
}

export interface ProjectBudgetSummary {
  project_id: string;
  project_title: string;
  project_status: string;
  total_planned: number;
  total_used: number;
  remaining_budget: number;
  budget_items_count: number;
  transactions_count: number;
}

export interface BudgetTransactionCreate {
  project_id: string;
  budget_item_id?: string;
  amount: number;
  transaction_type: 'expense' | 'refund' | 'adjustment';
  description: string;
  transaction_date?: string;
  document_id?: string;
  notes?: string;
}

export interface ProjectBudgetItemCreate {
  project_id: string;
  category_id: string;
  item_name: string;
  planned_amount: number;
  description?: string;
}

export interface BudgetCategoryCreate {
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}

// =============================================
// BUDGET DASHBOARD TYPES
// =============================================

export interface BudgetDashboardStats {
  total_projects: number;
  total_budget_allocated: number;
  total_budget_used: number;
  total_budget_remaining: number;
  projects_over_budget: number;
  recent_transactions: BudgetTransaction[];
}

export interface BudgetReportFilters {
  project_id?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  transaction_type?: 'expense' | 'refund' | 'adjustment';
}