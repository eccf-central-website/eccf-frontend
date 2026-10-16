// Finance client page for the dashboard
"use client";

import React, { useEffect, useState } from 'react';
import FinanceStatsCards from '@/components/dashboard/finance/FinanceStatsCards';
import FinanceTable from '@/components/dashboard/finance/FinanceTable';
import RecordTransactionModal from '@/components/dashboard/finance/RecordTransactionModal';
import FinanceExportButton from '@/components/dashboard/finance/FinanceExportButton';
import { Button } from '@/components/dashboard/ui/button';

interface FinanceEntry {
  _id: string;
  transactionDate: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  description?: string;
  flutterwaveRef?: string;
}

export default function FinanceClient() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Fetch finance entries from Sanity (placeholder endpoint)
  useEffect(() => {
    async function fetchEntries() {
      const res = await fetch('/api/finance');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    }
    fetchEntries();
  }, []);

  const totalIncome = entries
    .filter((e) => e.type === 'Income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = entries
    .filter((e) => e.type === 'Expense')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Finance Ledger</h1>
        <div className="flex gap-2">
          <FinanceExportButton entries={entries} />
          <Button onClick={() => setShowModal(true)}>Record Transaction</Button>
        </div>
      </div>
      <FinanceStatsCards totalIncome={totalIncome} totalExpense={totalExpense} />
      <FinanceTable entries={entries} />
      {showModal && (
        <RecordTransactionModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            // Refresh data after recording
            fetch('/api/finance')
              .then((r) => r.json())
              .then(setEntries);
          }}
        />
      )}
    </div>
  );
}
