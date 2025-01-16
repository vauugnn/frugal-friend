'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import Image from 'next/image';
import Overview from '../components/Overview';
import BanksList from '../components/BanksList';
import EnvelopesList from '../components/EnvelopesList';
import TransactionForm from '../components/TransactionForm';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Bank, Envelope, Transaction } from '../types';

interface DashboardData {
  banks: Bank[];
  transactions: Transaction[];
  envelopes: Envelope[];
  totalMoney: number;
  totalExpenses: number;
}

export default function DashboardPage() {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [data, setData] = useState<DashboardData>({
    banks: [],
    transactions: [],
    envelopes: [],
    totalMoney: 0,
    totalExpenses: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { signOut } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [banksResponse, transactionsResponse, envelopesResponse] = await Promise.all([
        supabase
          .from('bank_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('transactions')
          .select('*, bank_accounts(*), envelopes(*)')
          .eq('user_id', user.id)
          .gte('date', startOfMonth)
          .order('date', { ascending: false }),
        supabase
          .from('envelopes')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', now.toISOString().slice(0, 7))
          .order('created_at', { ascending: false })
      ]);

      if (banksResponse.error || transactionsResponse.error || envelopesResponse.error) {
        throw new Error('Failed to fetch data');
      }

      setData({
        banks: banksResponse.data || [],
        transactions: transactionsResponse.data || [],
        envelopes: envelopesResponse.data || [],
        totalMoney: (banksResponse.data || []).reduce((sum, bank) => 
          sum + Number(bank.balance), 0),
        totalExpenses: (transactionsResponse.data || [])
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const setupRealtimeSubscriptions = useCallback(() => {
    console.log('Setting up real-time subscriptions');
    
    const transactions = supabase
      .channel('transactions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, () => {
        console.log('Transaction changed, fetching new data');
        fetchDashboardData();
      })
      .subscribe();

    const banks = supabase
      .channel('banks_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bank_accounts'
      }, () => {
        console.log('Bank changed, fetching new data');
        fetchDashboardData();
      })
      .subscribe();

    const envelopes = supabase
      .channel('envelopes_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'envelopes'
      }, () => {
        console.log('Envelope changed, fetching new data');
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(transactions);
      supabase.removeChannel(banks);
      supabase.removeChannel(envelopes);
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
    const cleanup = setupRealtimeSubscriptions();
    return () => {
      cleanup();
    };
  }, [fetchDashboardData, setupRealtimeSubscriptions]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center">
            <div className="flex items-center gap-2">
              <Image
                src="https://i.imgur.com/BdvDqOW.png"
                alt="Logo"
                width={32}
                height={32}
                className="w-8 h-8"
                unoptimized
              />
              <h1 className="text-2xl font-bold">Frugal Friend</h1>
            </div>
            <div className="flex w-full sm:w-auto gap-2 sm:gap-4">
              <Button 
                onClick={() => setIsTransactionFormOpen(true)}
                className="flex-1 sm:flex-none bg-[#7c3aed]"
              >
                Add Transaction
              </Button>
              <Button 
                variant="outline" 
                onClick={signOut}
                className="flex-1 sm:flex-none"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <Tabs defaultValue="overview">
          <TabsList className="bg-white p-1 rounded-lg shadow-sm mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="envelopes">Categories</TabsTrigger>
            <TabsTrigger value="banks">Banks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Overview data={data} onUpdate={fetchDashboardData} />
          </TabsContent>

          <TabsContent value="envelopes">
            <EnvelopesList data={data.envelopes} onUpdate={fetchDashboardData} />
          </TabsContent>

          <TabsContent value="banks">
            <BanksList data={data.banks} onUpdate={fetchDashboardData} />
          </TabsContent>
        </Tabs>
      </main>

      {isTransactionFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Transaction</h2>
                <button 
                  onClick={() => setIsTransactionFormOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <TransactionForm 
                banks={data.banks}
                envelopes={data.envelopes}
                onSuccess={() => {
                  setIsTransactionFormOpen(false);
                  fetchDashboardData();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}