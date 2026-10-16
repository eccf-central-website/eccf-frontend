// Finance table component using simple HTML table
import React from 'react';

interface FinanceEntry {
  _id: string;
  transactionDate: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  description?: string;
}

export default function FinanceTable({ entries }: { entries: FinanceEntry[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Type</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Amount (NGN)</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Description</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((e) => (
            <tr key={e._id}>
              <td className="px-4 py-2 text-sm text-gray-700">{e.transactionDate}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{e.type}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{e.category}</td>
              <td className="px-4 py-2 text-sm text-gray-700 text-right">{e.amount.toLocaleString()}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
