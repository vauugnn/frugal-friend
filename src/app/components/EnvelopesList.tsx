'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import type { Envelope } from '../types';

interface EnvelopesListProps {
  data: Envelope[];
  onUpdate: () => Promise<void>;
}

export default function EnvelopesList({ data, onUpdate }: EnvelopesListProps) {
  const [isAddingEnvelope, setIsAddingEnvelope] = useState(false);
  const [newEnvelopeName, setNewEnvelopeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddEnvelope = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: insertError } = await supabase
        .from('envelopes')
        .insert([{
          name: newEnvelopeName,
          spent: 0,
          month: new Date().toISOString().slice(0, 7),
          user_id: user.id
        }]);

      if (insertError) throw insertError;

      setNewEnvelopeName('');
      setIsAddingEnvelope(false);
      onUpdate();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnvelope = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('envelopes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      onUpdate();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Categories</h2>
        <Button onClick={() => setIsAddingEnvelope(true)}>
          Add Category
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((envelope) => (
          <Card key={envelope.id}>
            <CardHeader className="flex flex-row justify-between items-center">
              <h3 className="font-semibold">{envelope.name}</h3>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeleteEnvelope(envelope.id)}
                disabled={loading}
              >
                Delete
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Spent: ₱{envelope.spent.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isAddingEnvelope && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="font-semibold">Add New Category</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newEnvelopeName}
                  onChange={(e) => setNewEnvelopeName(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Category name"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingEnvelope(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddEnvelope}
                    disabled={loading || !newEnvelopeName.trim()}
                  >
                    {loading ? 'Adding...' : 'Add'}
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