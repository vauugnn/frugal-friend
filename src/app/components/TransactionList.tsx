import { useState } from 'react';
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { supabase } from "../lib/supabase";

interface Transaction {
  id: number;
  amount: number;
  type: 'expense' | 'income';
  description: string;
  date: string;
  bank_account_id: number;
  envelope_id?: number | null;
  bank_accounts?: { name: string };
  envelopes?: { name: string };
}

interface TransactionListProps {
  transactions: Transaction[];
  onUpdate: () => void;
  isOffline?: boolean;
}

const TransactionList = ({ transactions, onUpdate, isOffline }: TransactionListProps) => {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (transaction: Transaction) => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Get current bank balance
      const { data: currentBank } = await supabase
        .from('bank_accounts')
        .select('balance')
        .eq('id', transaction.bank_account_id)
        .single();

      if (!currentBank) throw new Error('Bank account not found');

      // Calculate new bank balance - reverse the original transaction
      const newBalance = transaction.type === 'expense'
        ? currentBank.balance + transaction.amount  // Add back for expense
        : currentBank.balance - transaction.amount; // Subtract for income

      const updates = [];

      // 2. Update bank balance
      updates.push(
        supabase
          .from('bank_accounts')
          .update({ balance: newBalance })
          .eq('id', transaction.bank_account_id)
      );

      // 3. If it was an expense with an envelope, update envelope spent amount
      if (transaction.type === 'expense' && transaction.envelope_id) {
        const { data: currentEnvelope } = await supabase
          .from('envelopes')
          .select('spent')
          .eq('id', transaction.envelope_id)
          .single();

        if (!currentEnvelope) throw new Error('Envelope not found');

        // Calculate new spent amount by subtracting the transaction amount
        const newSpent = currentEnvelope.spent - transaction.amount;

        updates.push(
          supabase
            .from('envelopes')
            .update({ spent: newSpent })
            .eq('id', transaction.envelope_id)
        );
      }

      // 4. Delete the transaction
      updates.push(
        supabase
          .from('transactions')
          .delete()
          .eq('id', transaction.id)
      );

      // Execute all updates
      const results = await Promise.all(updates);

      // Check for any errors
      const updateError = results.find(result => result.error);
      if (updateError) {
        throw updateError.error;
      }

      setDeleteId(null);
      onUpdate();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Recent Transactions</h3>
          {isOffline && (
            <span className="text-sm text-yellow-600">⚠️ Offline Mode</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">{transaction.description}</p>
                <p className="text-sm text-gray-500">
                  {new Date(transaction.date).toLocaleDateString()} • 
                  {transaction.bank_accounts?.name}
                  {transaction.envelopes?.name && ` • ${transaction.envelopes.name}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(transaction.type === 'income' ? '+' : '-') + 
                    transaction.amount.toLocaleString('en-PH', {
                      style: 'currency',
                      currency: 'PHP'
                    })}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDeleteId(transaction.id)}
                  disabled={isOffline || loading}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h4 className="font-semibold mb-4">Confirm Delete</h4>
            <p>Are you sure you want to delete this transaction? This will update your bank balance and category spending accordingly.</p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setDeleteId(null)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  const transaction = transactions.find(t => t.id === deleteId);
                  if (transaction) {
                    handleDelete(transaction);
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TransactionList;