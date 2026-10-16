"use client";

import { Button } from '@/components/dashboard/ui/button';

interface ExportFinanceEntry {
  transactionDate: string;
  type: string;
  amount: number;
  category: string;
  description?: string;
  flutterwaveRef?: string;
}

export default function FinanceExportButton({ entries }: { entries: ExportFinanceEntry[] }) {
  const handleExport = () => {
    const header = ['Transaction Date', 'Type', 'Amount', 'Category', 'Description', 'Flutterwave Ref'];
    const rows = entries.map((e) => [
      e.transactionDate,
      e.type,
      e.amount,
      e.category,
      e.description || '',
      e.flutterwaveRef || '',
    ]);
    const csvContent = [header, ...rows]
      .map((r) => r.map((v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'finance_ledger.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleExport} variant="outline">
      Export CSV
    </Button>
  );
}
