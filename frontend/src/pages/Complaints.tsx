import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import type { Complaint } from '../types';
import { Plus, AlertCircle, Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(searchParams.get('overdue') === 'true');

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter, fromDate, toDate]);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints', {
        params: {
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        },
      });
      setComplaints(res.data);
    } catch (error) {
      console.error('Failed to fetch complaints', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OPEN': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || complaint.title.toLowerCase().includes(query) ||
      complaint.resident?.name.toLowerCase().includes(query);
    return matchesSearch && (!overdueOnly || complaint.isOverdue);
  });

  if (loading) return <div className="p-8 text-slate-500">Loading complaints...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Complaints</h1>
          <p className="text-slate-500">Manage and track society issues.</p>
        </div>
        {/* Only Residents can create new complaints */}
        {user?.role === 'RESIDENT' && (
          <Link to="/complaints/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium transition">
            <Plus className="h-5 w-5 mr-1" /> New Complaint
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaints or residents"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">All categories</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="CLEANING">Cleaning</option>
              <option value="SECURITY">Security</option>
              <option value="LIFT">Lift</option>
              <option value="OTHER">Other</option>
            </select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="To date" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
            <button
              type="button"
              onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setFromDate(''); setToDate(''); setOverdueOnly(false); }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Title & Resident</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition duration-150">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <Link to={`/complaints/${c.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                          {c.title}
                        </Link>
                        {/* Dynamic Overdue Badge */}
                        {c.isOverdue && (
                          <span className="ml-3 flex items-center text-[10px] uppercase tracking-wider font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            <AlertCircle className="h-3 w-3 mr-1" /> Overdue
                          </span>
                        )}
                      </div>
                      {user?.role === 'ADMIN' && c.resident && (
                        <span className="text-xs text-slate-500 mt-1">
                          {c.resident.name} (Apt {c.resident.apartmentNumber})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full border ${getStatusColor(c.status)}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                    {c.category}
                    <span className="ml-2 text-xs text-slate-400">{c.priority}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No complaints found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Complaints;