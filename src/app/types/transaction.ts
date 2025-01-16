export interface Transaction {
  id: number;
  amount: number;
  type: 'expense' | 'income';
  description: string;
  date: string;
  bank_accounts?: { name: string };
  envelopes?: { name: string };
  pending?: boolean;
}