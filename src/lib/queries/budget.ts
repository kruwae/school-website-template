// =============================================
// PROJECT BUDGET MANAGEMENT QUERIES
// File: src/lib/queries/budget.ts
// =============================================

import { supabase } from '@/integrations/supabase/client';
import type {
  BudgetCategory,
  ProjectBudgetItem,
  BudgetTransaction,
  ProjectBudgetSummary,
  BudgetTransactionCreate,
  ProjectBudgetItemCreate,
  BudgetCategoryCreate,
  BudgetDashboardStats,
  BudgetReportFilters
} from '@/lib/types/budget';

// =============================================
// BUDGET CATEGORIES
// =============================================

export const getBudgetCategories = async (): Promise<BudgetCategory[]> => {
  const { data, error } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createBudgetCategory = async (category: BudgetCategoryCreate): Promise<BudgetCategory> => {
  const { data, error } = await supabase
    .from('budget_categories')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBudgetCategory = async (id: string, updates: Partial<BudgetCategoryCreate>): Promise<BudgetCategory> => {
  const { data, error } = await supabase
    .from('budget_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// =============================================
// PROJECT BUDGET ITEMS
// =============================================

export const getProjectBudgetItems = async (projectId: string): Promise<ProjectBudgetItem[]> => {
  const { data, error } = await supabase
    .from('project_budget_items')
    .select(`
      *,
      category:budget_categories(*)
    `)
    .eq('project_id', projectId)
    .order('created_at');

  if (error) throw error;
  return data || [];
};

export const createProjectBudgetItem = async (item: ProjectBudgetItemCreate): Promise<ProjectBudgetItem> => {
  const { data, error } = await supabase
    .from('project_budget_items')
    .insert(item)
    .select(`
      *,
      category:budget_categories(*)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const updateProjectBudgetItem = async (id: string, updates: Partial<ProjectBudgetItemCreate>): Promise<ProjectBudgetItem> => {
  const { data, error } = await supabase
    .from('project_budget_items')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      category:budget_categories(*)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const deleteProjectBudgetItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('project_budget_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// =============================================
// BUDGET TRANSACTIONS
// =============================================

export const getProjectBudgetTransactions = async (projectId: string): Promise<BudgetTransaction[]> => {
  const { data, error } = await supabase
    .from('budget_transactions')
    .select(`
      *,
      budget_item:project_budget_items(*, category:budget_categories(*)),
      created_by_user:app_users(id, name, email),
      document:documents(id, file_name, file_url)
    `)
    .eq('project_id', projectId)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createBudgetTransaction = async (transaction: BudgetTransactionCreate): Promise<BudgetTransaction> => {
  const { data, error } = await supabase
    .from('budget_transactions')
    .insert({
      ...transaction,
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select(`
      *,
      budget_item:project_budget_items(*, category:budget_categories(*)),
      created_by_user:app_users(id, name, email),
      document:documents(id, file_name, file_url)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const updateBudgetTransaction = async (id: string, updates: Partial<BudgetTransactionCreate>): Promise<BudgetTransaction> => {
  const { data, error } = await supabase
    .from('budget_transactions')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      budget_item:project_budget_items(*, category:budget_categories(*)),
      created_by_user:app_users(id, name, email),
      document:documents(id, file_name, file_url)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const deleteBudgetTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('budget_transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// =============================================
// BUDGET SUMMARY & REPORTS
// =============================================

export const getProjectBudgetSummary = async (projectId: string): Promise<ProjectBudgetSummary | null> => {
  const { data, error } = await supabase
    .from('project_budget_summary')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
};

export const getAllProjectsBudgetSummary = async (): Promise<ProjectBudgetSummary[]> => {
  const { data, error } = await supabase
    .from('project_budget_summary')
    .select('*')
    .order('project_title');

  if (error) {
    console.warn('project_budget_summary view unavailable, falling back to projects table:', error);

    const fallback = await supabase
      .from('projects')
      .select('id, title, status, budget_amount, budget_used')
      .order('title');

    if (fallback.error) {
      throw fallback.error;
    }

    return (fallback.data || []).map((project: any): ProjectBudgetSummary => ({
      project_id: project.id,
      project_title: project.title,
      project_status: project.status,
      total_planned: Number(project.budget_amount) || 0,
      total_used: Number(project.budget_used) || 0,
      remaining_budget: (Number(project.budget_amount) || 0) - (Number(project.budget_used) || 0),
      budget_items_count: 0,
      transactions_count: 0
    }));
  }

  return data || [];
};

export const getBudgetDashboardStats = async (): Promise<BudgetDashboardStats> => {
  const emptyStats: BudgetDashboardStats = {
    total_projects: 0,
    total_budget_allocated: 0,
    total_budget_used: 0,
    total_budget_remaining: 0,
    projects_over_budget: 0,
    recent_transactions: []
  };

  try {
    // 1) Try main summary view
    const response = await supabase
      .from('project_budget_summary')
      .select('total_planned, total_used, remaining_budget');

    let summary = (response.error || !response.data ? [] : response.data) as Array<{ total_planned: number; total_used: number; remaining_budget: number }>;

    // 2) If no summary, fallback to project budget fields
    if (!summary || summary.length === 0) {
      const projectResp = await supabase
        .from('projects')
        .select('id, budget_amount, budget_used');

      if (projectResp.error || !projectResp.data) {
        return emptyStats;
      }

      const projects = projectResp.data;
      const totalBudgetAllocated = projects.reduce((sum: number, item: any) => sum + (Number(item.budget_amount) || 0), 0);
      const totalBudgetUsed = projects.reduce((sum: number, item: any) => sum + (Number(item.budget_used) || 0), 0);
      const totalBudgetRemaining = totalBudgetAllocated - totalBudgetUsed;
      const projectsOverBudget = projects.filter((item: any) => (Number(item.budget_used) || 0) > (Number(item.budget_amount) || 0)).length;

      const transactionsResult = await supabase
        .from('budget_transactions')
        .select('*, budget_item:project_budget_items(item_name, category:budget_categories(name)), created_by_user:app_users(name), project:projects(title)')
        .order('created_at', { ascending: false })
        .limit(10);

      const recentTransactions = transactionsResult.error ? [] : (transactionsResult.data || []);

      return {
        total_projects: projects.length,
        total_budget_allocated: totalBudgetAllocated,
        total_budget_used: totalBudgetUsed,
        total_budget_remaining: totalBudgetRemaining,
        projects_over_budget: projectsOverBudget,
        recent_transactions: recentTransactions
      };
    }

    const totalBudgetAllocated = summary.reduce((sum, item) => sum + (item.total_planned || 0), 0);
    const totalBudgetUsed = summary.reduce((sum, item) => sum + (item.total_used || 0), 0);
    const totalBudgetRemaining = summary.reduce((sum, item) => sum + (item.remaining_budget || 0), 0);
    const projectsOverBudget = summary.filter(item => (item.remaining_budget || 0) < 0).length;

    const transactionsResult = await supabase
      .from('budget_transactions')
      .select('*, budget_item:project_budget_items(item_name, category:budget_categories(name)), created_by_user:app_users(name), project:projects(title)')
      .order('created_at', { ascending: false })
      .limit(10);

    const recentTransactions = transactionsResult.error ? [] : (transactionsResult.data || []);

    return {
      total_projects: summary.length,
      total_budget_allocated: totalBudgetAllocated,
      total_budget_used: totalBudgetUsed,
      total_budget_remaining: totalBudgetRemaining,
      projects_over_budget: projectsOverBudget,
      recent_transactions: recentTransactions
    };
  } catch (error) {
    console.warn('getBudgetDashboardStats error:', error);
    return emptyStats;
  }
};

// =============================================
// FILTERED REPORTS
// =============================================

export const getFilteredBudgetTransactions = async (filters: BudgetReportFilters): Promise<BudgetTransaction[]> => {
  let query = supabase
    .from('budget_transactions')
    .select(`
      *,
      budget_item:project_budget_items(item_name, category:budget_categories(name)),
      created_by_user:app_users(name),
      project:projects(title),
      document:documents(file_name, file_url)
    `);

  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id);
  }

  if (filters.category_id) {
    query = query.eq('budget_item.category_id', filters.category_id);
  }

  if (filters.transaction_type) {
    query = query.eq('transaction_type', filters.transaction_type);
  }

  if (filters.date_from) {
    query = query.gte('transaction_date', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('transaction_date', filters.date_to);
  }

  const { data, error } = await query
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return data || [];
};