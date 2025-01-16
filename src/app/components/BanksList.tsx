import { useState } from 'react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { Bank } from '../types';

interface BanksListProps {
  data: Bank[];
  onUpdate: () => Promise<void>;
}

export default function BanksList({ data, onUpdate }: BanksListProps) {
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState<Bank | null>(null);
  const [newBankName, setNewBankName] = useState('');
  const [newBankBalance, setNewBankBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddBank = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate number input
      const balance = Number(newBankBalance);
      if (isNaN(balance) || balance < 0) {
        throw new Error('Please enter a valid balance amount');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: insertError } = await supabase
        .from('bank_accounts')
        .insert([{
          name: newBankName,
          balance: balance,
          user_id: user.id
        }]);

      if (insertError) throw insertError;

      setNewBankName('');
      setNewBankBalance('');
      setIsAddingBank(false);
      await onUpdate();
    } catch (err) {
      console.error('Error adding bank:', err);
      setError(err instanceof Error ? err.message : 'Failed to add bank');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBank = async () => {
    if (!isEditingBank) return;
    
    try {
      setLoading(true);
      setError(null);

      // Validate input
      const balance = Number(newBankBalance);
      if (isNaN(balance) || balance < 0) {
        throw new Error('Please enter a valid balance amount');
      }

      const { error: updateError } = await supabase
        .from('bank_accounts')
        .update({
          name: newBankName,
          balance: balance
        })
        .eq('id', isEditingBank.id);

      if (updateError) throw updateError;

      setNewBankName('');
      setNewBankBalance('');
      setIsEditingBank(null);
      await onUpdate();
    } catch (err) {
      console.error('Error updating bank:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bank');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bank');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (bank: Bank) => {
    setIsEditingBank(bank);
    setNewBankName(bank.name);
    setNewBankBalance(bank.balance.toString());
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Bank Accounts</h2>
        <Button onClick={() => setIsAddingBank(true)}>
          Add Bank Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((bank) => (
          <Card key={bank.id}>
            <CardHeader className="flex flex-row justify-between items-center">
              <h3 className="font-semibold">{bank.name}</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(bank)}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteBank(bank.id)}
                  disabled={loading}
                >
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ₱{bank.balance.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(isAddingBank || isEditingBank) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="font-semibold">
                {isEditingBank ? 'Edit Bank Account' : 'Add New Bank Account'}
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Bank name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Balance
                  </label>
                  <input
                    type="number"
                    value={newBankBalance}
                    onChange={(e) => setNewBankBalance(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Initial balance"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingBank(false);
                      setIsEditingBank(null);
                      setNewBankName('');
                      setNewBankBalance('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={isEditingBank ? handleEditBank : handleAddBank}
                    disabled={loading || !newBankName.trim() || !newBankBalance}
                  >
                    {loading ? 'Saving...' : isEditingBank ? 'Save Changes' : 'Add'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}