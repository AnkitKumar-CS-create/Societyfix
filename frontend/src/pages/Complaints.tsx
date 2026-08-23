import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Complaint } from '../types';
import { Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
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
              {complaints.map((c) => (
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
              {complaints.length === 0 && (
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