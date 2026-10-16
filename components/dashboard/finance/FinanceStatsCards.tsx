// Finance stats cards component
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/dashboard/ui/card';

export default function FinanceStatsCards({ totalIncome, totalExpense }: { totalIncome: number; totalExpense: number }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Total Income</h3>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">₦{totalIncome.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Total Expense</h3>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">₦{totalExpense.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
