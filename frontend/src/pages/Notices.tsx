import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Notice } from '../types';
import { useAuth } from '../context/AuthContext';
import { Bell, Pin, Trash2, Plus, Search, Filter, ShieldCheck } from 'lucide-react';

const Notices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Admin form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [importantOnly, setImportantOnly] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data);
    } catch (error) {
      console.error('Failed to fetch notices', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setSubmitting(true);
    try {
      await api.post('/notices', { title, content, isImportant });
      setTitle('');
      setContent('');
      setIsImportant(false);
      fetchNotices();
    } catch (error) {
      console.error('Failed to create notice', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (error) {
      console.error('Failed to delete notice', error);
    }
  };

  const visibleNotices = notices.filter((notice) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || notice.title.toLowerCase().includes(query) || notice.content.toLowerCase().includes(query);
    return matchesSearch && (!importantOnly || notice.isImportant);
  });

  if (loading) return <div className="p-8 text-slate-500">Loading notices...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Society announcements</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Official updates
          </span>
        </div>
        <p className="text-slate-500">Announcements published by the society admin for every resident.</p>
      </div>

      {/* Admin Create Notice Form */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-blue-600" /> Post New Announcement
          </h3>
          <p className="mb-4 text-sm text-slate-500">Admin-only composer. Important announcements are pinned and emailed to residents.</p>
          <form onSubmit={handleCreateNotice} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notice Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Water supply interruption on Tuesday"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
              <textarea
                required
                rows={3}
                placeholder="Provide detailed instructions or information..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-slate-700">Mark as Important (Pins to top & emails residents)</span>
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Notice'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notices"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="button"
            onClick={() => setImportantOnly(!importantOnly)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${importantOnly ? 'bg-amber-100 text-amber-800' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter className="h-4 w-4" /> {importantOnly ? 'Important only' : 'All notices'}
          </button>
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {visibleNotices.map((n) => (
          <div 
            key={n.id} 
            className={`bg-white p-6 rounded-2xl shadow-sm border transition ${
              n.isImportant ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                {n.isImportant && (
                  <span className="flex items-center text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    <Pin className="h-3 w-3 mr-1 fill-amber-800" /> Pinned Important
                  </span>
                )}
                <h3 className="text-lg font-bold text-slate-900">{n.title}</h3>
              </div>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => handleDeleteNotice(n.id)}
                  className="text-slate-400 hover:text-red-600 p-1 transition"
                  title="Delete Notice"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-slate-700 text-sm whitespace-pre-wrap mb-4">{n.content}</p>
            <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>Posted by {n.createdBy?.name || 'Management'}</span>
              <span>{new Date(n.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        ))}

        {visibleNotices.length === 0 && (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-500 border border-slate-200">
            <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p>No notices have been posted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notices;