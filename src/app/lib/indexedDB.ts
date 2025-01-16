// src/lib/indexedDB.ts
import Dexie, { Table } from 'dexie';
import { Transaction } from '../types/transaction';

class BudgetDB extends Dexie {
  transactions!: Table<Transaction>;

  constructor() {
    super('BudgetBestie');
    
    this.version(1).stores({
      transactions: '++id, type, date, amount, description'
    });
  }
}

export const localDB = new BudgetDB();