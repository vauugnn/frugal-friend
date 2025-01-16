// src/components/Overview.tsx
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { supabase } from "../lib/supabase";
import TransactionList from "./TransactionList";
import TransactionChart from "./TransactionChart";
import { useNetwork } from '../hooks/useNetwork';
import { localDB } from '../lib/indexedDB';
import type { Transaction, Bank, Envelope } from '../types';

interface OverviewProps {
  data: {
    totalMoney: number;
    totalExpenses: number;
    transactions: Transaction[];
    envelopes: Envelope[];
    banks: Bank[];
  };
  onUpdate?: () => void;
}

export default function Overview({ data, onUpdate }: OverviewProps) {
  const { isOnline } = useNetwork();
  const [offlineData, setOfflineData] = useState<Transaction[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBank, setCurrentBank] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentBank < data.banks.length - 1) {
      setCurrentBank(prev => prev + 1);
    }

    if (isRightSwipe && currentBank > 0) {
      setCurrentBank(prev => prev - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Calculate totals from transactions
  const transactions = useMemo(() => 
    isOnline ? (data?.transactions ?? []) : offlineData,
    [isOnline, data?.transactions, offlineData]
  );

  // Cache transactions for offline
  useEffect(() => {
    if (data?.transactions?.length > 0) {
      localDB.transactions
        .bulkPut(data.transactions)
        .catch(err => console.error('Failed to cache:', err));
    }
  }, [data?.transactions]);

  // Load offline data
  useEffect(() => {
    if (!isOnline) {
      localDB.transactions
        .toArray()
        .then(data => setOfflineData(data as Transaction[]))
        .catch(err => {
          console.error('Failed to load offline:', err);
          setError('Failed to load offline data');
        });
    }
  }, [isOnline]);

  // Sync when back online
  useEffect(() => {
    if (isOnline && offlineData.length > 0) {
      const syncData = async () => {
        setSyncing(true);
        try {
          const pendingTransactions = offlineData.filter(t => t.pending);
          
          for (const transaction of pendingTransactions) {
            const { error: uploadError } = await supabase
              .from('transactions')
              .insert([transaction]);
            
            if (uploadError) throw uploadError;
            await localDB.transactions.delete(transaction.id);
          }
          
          onUpdate?.();
          setOfflineData([]);
        } catch (err) {
          console.error('Sync failed:', err);
          setError('Failed to sync offline transactions');
        } finally {
          setSyncing(false);
        }
      };
      syncData();
    }
  }, [isOnline, offlineData, onUpdate]);

  return (
    <div className="space-y-6">
      {!isOnline && (
        <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700">
          You&apos;re currently offline. Some features may be limited.
        </div>
      )}
      
      {syncing && (
        <div className="bg-blue-50 p-4 rounded-lg text-blue-700 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-700 rounded-full border-t-transparent" />
          Syncing changes...
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Total Balance</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {data.totalMoney.toLocaleString('en-PH', { 
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">Monthly Expenses</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {data.totalExpenses.toLocaleString('en-PH', { 
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">{data.banks[currentBank]?.name || 'Bank Account'}</h3>
          </CardHeader>
          <CardContent>
            <div className="relative px-6">
              <div 
                className="overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentBank * 100}%)` }}
                >
                  {data.banks.map((bank) => (
                    <div 
                      key={bank.id}
                      className="w-full flex-shrink-0 flex justify-center items-center py-2"
                    >
                      <span className={`text-2xl font-bold ${
                        bank.balance >= 0 ? 'text-primary' : 'text-destructive'
                      }`}>
                        {bank.balance.toLocaleString('en-PH', {
                          style: 'currency',
                          currency: 'PHP',
                          minimumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {data.banks.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {data.banks.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBank(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        index === currentBank ? 'bg-primary' : 'bg-gray-200'
                      }`}
                      aria-label={`Go to bank ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {data.banks.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentBank(prev => Math.max(prev - 1, 0))}
                    className="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    disabled={currentBank === 0}
                    aria-label="Previous bank"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentBank(prev => Math.min(prev + 1, data.banks.length - 1))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    disabled={currentBank === data.banks.length - 1}
                    aria-label="Next bank"
                  >
                    →
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Transaction History</h3>
        </CardHeader>
        <CardContent className="h-[300px]">
          <TransactionChart transactions={transactions} />
        </CardContent>
      </Card>

      <TransactionList 
        transactions={transactions}
        onUpdate={onUpdate || (() => {})}
        isOffline={!isOnline}
      />
    </div>
  );
}