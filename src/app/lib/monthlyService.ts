// src/lib/monthlyService.ts
import { supabase } from './supabase';

export interface MonthlySummary {
  id: number;
  user_id: string;
  month: string;
  total_income: number;
  total_expenses: number;
  category_expenses: Record<string, number>;
  created_at: string;
}

export const monthlyService = {
  async createMonthlySummary(userId: string, month: string) {
    try {
      // Get all transactions for the month
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          amount,
          type,
          envelopes (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .like('date', `${month}%`);

      if (transactionError) throw transactionError;

      // Calculate totals
      const summary = transactions?.reduce(
        (acc, transaction) => {
          if (transaction.type === 'income') {
            acc.total_income += transaction.amount;
          } else {
            acc.total_expenses += transaction.amount;
            if (transaction.envelopes?.[0]?.name) {
              acc.category_expenses[transaction.envelopes[0].name] = 
                (acc.category_expenses[transaction.envelopes[0].name] || 0) + transaction.amount;
            }
          }
          return acc;
        },
        { 
          total_income: 0, 
          total_expenses: 0, 
          category_expenses: {} as Record<string, number> 
        }
      );

      if (!summary) throw new Error('Failed to calculate summary');

      // Insert the summary
      const { data, error } = await supabase
        .from('monthly_summaries')
        .upsert({
          user_id: userId,
          month,
          total_income: summary.total_income,
          total_expenses: summary.total_expenses,
          category_expenses: summary.category_expenses
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating monthly summary:', error);
      throw error;
    }
  },

  async checkAndCreateMonthlySummary(userId: string) {
    const now = new Date();
    const today = now.getDate();
    
    // If it's the first day of the month, create summary for last month
    if (today === 1) {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
        .toISOString()
        .slice(0, 7);
      
      // Check if summary already exists for last month
      const { data: existing } = await supabase
        .from('monthly_summaries')
        .select()
        .eq('user_id', userId)
        .eq('month', lastMonth)
        .single();

      if (!existing) {
        await this.createMonthlySummary(userId, lastMonth);
      }
    }
  },

  async getMonthlySummaries(userId: string, limit = 12) {
    try {
      const { data, error } = await supabase
        .from('monthly_summaries')
        .select()
        .eq('user_id', userId)
        .order('month', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching monthly summaries:', error);
      throw error;
    }
  }
};