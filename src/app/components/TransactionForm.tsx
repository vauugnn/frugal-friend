import { useState } from 'react';
import { Button } from "../components/ui/button";
import { supabase } from "../lib/supabase";
import { Bank } from '../types';

interface EnvelopeData {
  id: number;
  name: string;
  spent: number;
  month: string;
}

interface TransactionFormProps {
  banks: Bank[];
  envelopes: EnvelopeData[];
  onSuccess: () => void;
}

export default function TransactionForm({ banks, envelopes, onSuccess }: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedEnvelope, setSelectedEnvelope] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      // Validate inputs
      if (!description || !amount || !selectedBank) {
        throw new Error('Please fill in all required fields');
      }
  
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
  
      const transactionAmount = Number(amount);
      const bankId = Number(selectedBank);
      const envelopeId = selectedEnvelope ? Number(selectedEnvelope) : null;

      // 1. First, fetch current bank balance
      const { data: currentBank } = await supabase
        .from('bank_accounts')
        .select('balance')
        .eq('id', bankId)
        .single();

      if (!currentBank) throw new Error('Bank account not found');

      // Calculate new bank balance
      const newBalance = type === 'expense'
        ? currentBank.balance - transactionAmount
        : currentBank.balance + transactionAmount;

      // Start collecting our updates
      const updates = [];

      // 2. Update bank balance
      updates.push(
        supabase
          .from('bank_accounts')
          .update({ balance: newBalance })
          .eq('id', bankId)
      );

      // 3. If this is an expense with a selected envelope, update envelope spent amount
      if (type === 'expense' && envelopeId) {
        const { data: currentEnvelope } = await supabase
          .from('envelopes')
          .select('spent')
          .eq('id', envelopeId)
          .single();

        if (!currentEnvelope) throw new Error('Envelope not found');

        const newSpent = currentEnvelope.spent + transactionAmount;

        updates.push(
          supabase
            .from('envelopes')
            .update({ spent: newSpent })
            .eq('id', envelopeId)
        );
      }

      // 4. Create the transaction record
      updates.push(
        supabase
          .from('transactions')
          .insert([{
            description,
            amount: transactionAmount,
            type,
            date: new Date().toISOString(),
            bank_account_id: bankId,
            envelope_id: envelopeId,
            user_id: user.id
          }])
      );

      // Execute all updates
      const results = await Promise.all(updates);

      // Check for any errors
      const updateError = results.find(result => result.error);
      if (updateError) {
        throw updateError.error;
      }

      // Success! Reset form and notify parent
      setDescription('');
      setAmount('');
      setSelectedBank('');
      setSelectedEnvelope('');
      onSuccess();

    } catch (err) {
      console.error('Error adding transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numbers = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    if (numbers.split('.').length > 2) return amount;
    return numbers;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={type === 'expense' ? 'default' : 'outline'}
            onClick={() => setType('expense')}
          >
            Expense
          </Button>
          <Button
            type="button"
            variant={type === 'income' ? 'default' : 'outline'}
            onClick={() => setType('income')}
          >
            Income
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter description"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Amount</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(formatAmount(e.target.value))}
          className="w-full p-2 border rounded-md"
          placeholder="0.00"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Bank Account</label>
        <select
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        >
          <option value="">Select bank account</option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.name} (₱{bank.balance.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      {type === 'expense' && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Category (Optional)
          </label>
          <select
            value={selectedEnvelope}
            onChange={(e) => setSelectedEnvelope(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select category</option>
            {envelopes.map((envelope) => (
              <option key={envelope.id} value={envelope.id}>
                {envelope.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
            Adding...
          </div>
        ) : (
          'Add Transaction'
        )}
      </Button>
    </form>
  );
}