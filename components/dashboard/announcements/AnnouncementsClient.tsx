// Announcements Engine client component
"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/dashboard/ui/button';

interface Announcement {
  _id: string;
  title: string;
  content?: string;
  publishDate: string;
  isPublished: boolean;
}

export default function AnnouncementsClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch('/api/announcements');
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data);
        }
      } catch {
        // API may not exist yet
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  return (
    <section className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sunday Announcements Engine</h1>
        <Button onClick={() => { setEditingItem(null); setShowEditor(true); }}>
          New Announcement
        </Button>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <AnnouncementEditor
          item={editingItem}
          onClose={() => setShowEditor(false)}
          onSuccess={() => {
            setShowEditor(false);
            // Refresh
            fetch('/api/announcements')
              .then((r) => r.json())
              .then(setAnnouncements)
              .catch(() => {});
          }}
        />
      )}

      {loading ? (
        <p className="text-gray-500">Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <p className="text-gray-500">No announcements yet. Create one above.</p>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a._id}
              className="rounded-lg border bg-white p-4 shadow-sm flex justify-between items-start"
            >
              <div>
                <h3 className="font-semibold text-lg">{a.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Publish: {a.publishDate} &middot;{' '}
                  <span className={a.isPublished ? 'text-green-600' : 'text-amber-600'}>
                    {a.isPublished ? 'Published' : 'Draft'}
                  </span>
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditingItem(a); setShowEditor(true); }}
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// --- Inline Announcement Editor ---

function AnnouncementEditor({
  item,
  onClose,
  onSuccess,
}: {
  item: Announcement | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: item?.title ?? '',
    content: item?.content ?? '',
    publishDate: item?.publishDate ?? new Date().toISOString().slice(0, 10),
    isPublished: item?.isPublished ?? false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      alert('Title is required');
      return;
    }
    try {
      const method = item ? 'PUT' : 'POST';
      const body = item ? { ...form, _id: item._id } : form;
      const res = await fetch('/api/announcements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.text();
        alert('Error: ' + err);
      }
    } catch {
      alert('Unexpected error');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">
          {item ? 'Edit Announcement' : 'New Announcement'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Content</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={5}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Publish Date</label>
            <input
              type="date"
              name="publishDate"
              value={form.publishDate}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={form.isPublished}
              onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
            />
            <label htmlFor="isPublished" className="text-sm font-medium">
              Publish immediately
            </label>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
