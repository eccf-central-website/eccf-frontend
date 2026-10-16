// Welfare Desk client component
"use client";

import React, { useEffect, useState } from 'react';

interface WelfareRequest {
  _id: string;
  studentName: string;
  hall: string;
  status: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  createdAt?: string;
}

export default function WelfareClient() {
  const [requests, setRequests] = useState<WelfareRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch('/api/welfare');
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        }
      } catch {
        // API may not exist yet
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const resolvedCount = requests.filter((r) => r.status === 'resolved').length;

  return (
    <section className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Welfare Desk</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading welfare requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">No welfare requests recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Student</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Hall</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Resolution</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-2 text-sm">{r.studentName}</td>
                  <td className="px-4 py-2 text-sm">{r.hall}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'resolved'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {r.status === 'resolved' ? 'Resolved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {r.resolutionNotes ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
