import { User } from "@supabase/supabase-js";
import { Session } from "inspector";

export interface SupabaseError {
    message: string;
    details?: string;
    code?: string;
  }

export type BaseErrorResponse = SupabaseError | Error;

export interface Bank {
    id: number;
    name: string;
    balance: number;
    user_id: string;
  }
  
  export interface Envelope {
    id: number;
    name: string;
    budget: number;
    spent: number;
    month: string;
    user_id: string;
  }
  
  export interface Transaction {
    id: number;
    amount: number;
    type: 'expense' | 'income';
    description: string;
    date: string;
    bank_account_id: number;
    envelope_id?: number;
    user_id: string;
    bank_accounts?: Bank;
    envelopes?: Envelope;
    pending?: boolean;
  }
  
  export interface MonthlySummary {
    id: number;
    user_id: string;
    month: string;
    total_income: number;
    total_expenses: number;
    category_expenses: Record<string, number>;
    created_at: string;
  }

export interface AuthResponse {
    data: {
      user: User | null;
      session: Session | null;
    };
    error: AuthError | null;
  }
  
  export interface DatabaseError extends SupabaseError {
    hint?: string;
    code: string;
  }

  export interface AuthError extends SupabaseError {
    status: number;
  }

  export type ErrorResponse = DatabaseError | AuthError | Error | BaseErrorResponse;

  export interface SupabaseResponse<T> {
    data: T | null;
    error: DatabaseError | null;
  }