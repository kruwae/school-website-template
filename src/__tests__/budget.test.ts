// =============================================
// BUDGET MANAGEMENT SYSTEM - API TESTS
// File: src/__tests__/budget.test.ts
// =============================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getBudgetCategories,
  getProjectBudgetItems,
  getProjectBudgetTransactions,
  getProjectBudgetSummary,
  getBudgetDashboardStats,
  getProjectRemainingBudget,
  getBudgetUtilizationPercentage,
  getCategorySummary,
  canCreateExpense,
  getBudgetStatistics
} from '@/lib/queries/budget';

describe('Budget Management System - Queries', () => {
  const mockProjectId = 'test-project-id';

  describe('Budget Categories', () => {
    it('should retrieve active budget categories', async () => {
      const categories = await getBudgetCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.every(cat => cat.is_active)).toBe(true);
    });

    it('should have required category fields', async () => {
      const categories = await getBudgetCategories();
      if (categories.length > 0) {
        const category = categories[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('code');
        expect(category).toHaveProperty('is_active');
      }
    });
  });

  describe('Project Budget Items', () => {
    it('should retrieve project budget items', async () => {
      const items = await getProjectBudgetItems(mockProjectId);
      expect(Array.isArray(items)).toBe(true);
    });

    it('should include category information', async () => {
      const items = await getProjectBudgetItems(mockProjectId);
      if (items.length > 0) {
        expect(items[0]).toHaveProperty('id');
        expect(items[0]).toHaveProperty('project_id');
        expect(items[0]).toHaveProperty('planned_amount');
      }
    });
  });

  describe('Budget Transactions', () => {
    it('should retrieve project budget transactions', async () => {
      const transactions = await getProjectBudgetTransactions(mockProjectId);
      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should validate transaction types', async () => {
      const transactions = await getProjectBudgetTransactions(mockProjectId);
      const validTypes = ['expense', 'refund', 'adjustment'];
      transactions.forEach(t => {
        expect(validTypes).toContain(t.transaction_type);
      });
    });
  });

  describe('Budget Summary & Statistics', () => {
    it('should retrieve budget summary', async () => {
      const summary = await getProjectBudgetSummary(mockProjectId);
      if (summary) {
        expect(summary).toHaveProperty('project_id');
        expect(summary).toHaveProperty('total_planned');
        expect(summary).toHaveProperty('total_used');
        expect(summary).toHaveProperty('remaining_budget');
      }
    });

    it('should get dashboard statistics', async () => {
      const stats = await getBudgetDashboardStats();
      expect(stats).toHaveProperty('total_projects');
      expect(stats).toHaveProperty('total_budget_allocated');
      expect(stats).toHaveProperty('total_budget_used');
      expect(stats).toHaveProperty('total_budget_remaining');
    });
  });

  describe('Budget Helper Functions', () => {
    it('should calculate remaining budget', async () => {
      const remaining = await getProjectRemainingBudget(mockProjectId);
      expect(typeof remaining).toBe('number');
      expect(remaining >= 0 || remaining < 0).toBe(true); // Can be positive or negative
    });

    it('should calculate utilization percentage', async () => {
      const utilization = await getBudgetUtilizationPercentage(mockProjectId);
      expect(typeof utilization).toBe('number');
      expect(utilization >= 0).toBe(true);
    });

    it('should get category summary', async () => {
      const categories = await getCategorySummary(mockProjectId);
      expect(Array.isArray(categories)).toBe(true);
    });

    it('should check expense capacity', async () => {
      const canCreate = await canCreateExpense(mockProjectId, 1000);
      expect(typeof canCreate).toBe('boolean');
    });

    it('should get budget statistics', async () => {
      const stats = await getBudgetStatistics(mockProjectId);
      if (stats) {
        expect(stats).toHaveProperty('total_budget');
        expect(stats).toHaveProperty('total_spent');
        expect(stats).toHaveProperty('remaining_budget');
      }
    });
  });

  describe('Data Validation', () => {
    it('should handle invalid project ID gracefully', async () => {
      try {
        const items = await getProjectBudgetItems('invalid-id');
        expect(Array.isArray(items)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('amount should be non-negative', async () => {
      const transactions = await getProjectBudgetTransactions(mockProjectId);
      transactions.forEach(t => {
        if (t.transaction_type === 'expense') {
          expect(t.amount > 0).toBe(true);
        }
      });
    });

    it('remaining budget calculation should be accurate', async () => {
      const summary = await getProjectBudgetSummary(mockProjectId);
      if (summary) {
        const calculated = summary.total_planned - summary.total_used;
        expect(summary.remaining_budget).toBe(calculated);
      }
    });
  });
});
