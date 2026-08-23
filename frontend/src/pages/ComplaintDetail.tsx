import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Complaint } from '../types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, MessageSquare, AlertCircle, CheckCircle2, Wrench, Send } from 'lucide-react';

const ComplaintDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Admin update states
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [commentMessage, setCommentMessage] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
      setNewStatus(res.data.status);
    } catch (error) {
      console.error('Failed to fetch complaint details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || newStatus === complaint?.status) return;
    
    setUpdateLoading(true);
    try {
      await api.patch(`/complaints/${id}/status`, { status: newStatus, note });
      setNote(''); // Clear note field
      fetchComplaint(); // Refresh the page data
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentMessage.trim()) return;

    setCommentLoading(true);
    try {
      await api.post(`/complaints/${id}/comments`, { message: commentMessage });
      setCommentMessage('');
      await fetchComplaint();
    } catch (error) {
      console.error('Failed to add complaint comment', error);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading details...</div>;
  if (!complaint) return <div className="p-8 text-red-500">Complaint not found.</div>;

  const latestUpdate = complaint.history?.[complaint.history.length - 1];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/complaints" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Complaints
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{complaint.title}</h1>
              <p className="text-sm text-slate-500 mt-1">Category: {complaint.category} • Priority: {complaint.priority}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-bold rounded-full border ${
              complaint.status === 'OPEN' ? 'bg-amber-100 text-amber-800 border-amber-200' :
              complaint.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              {complaint.status.replace('_', ' ')}
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm whitespace-pre-wrap border border-slate-100">
            {complaint.description}
          </div>
          {complaint.photoUrl && (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <img src={complaint.photoUrl} alt="Complaint supporting evidence" className="max-h-96 w-full object-contain" />
            </div>
          )}
          {complaint.status === 'RESOLVED' ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold">This issue has been resolved</p>
                <p className="mt-1 text-sm text-emerald-800">
                  {latestUpdate?.note || 'The maintenance team marked this complaint as complete.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
              <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="font-semibold">Your request is being tracked</p>
                <p className="mt-1 text-sm text-blue-800">Management will add progress notes here as the issue moves toward resolution.</p>
              </div>
            </div>
          )}
          {latestUpdate?.note && complaint.status !== 'RESOLVED' && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Latest solution update</p>
              <p className="mt-2 text-sm text-slate-700">{latestUpdate.note}</p>
              <p className="mt-1 text-xs text-slate-400">Added by {latestUpdate.actor.name}</p>
            </div>
          )}
          {complaint.isOverdue && (
            <div className="mt-4 flex items-center text-sm font-medium text-red-700 bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle className="h-5 w-5 mr-2" /> This complaint is overdue!
            </div>
          )}
        </div>

        {/* History Timeline */}
        <div className="p-6 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-slate-400" /> Resolution Timeline
          </h3>
          <div className="space-y-6">
            {complaint.history?.map((record) => (
              <div key={record.id} className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 border-2 border-white"></div>
                <p className="text-sm font-semibold text-slate-900">
                  Status updated to <span className="text-blue-600">{record.newStatus.replace('_', ' ')}</span> by {record.actor.name} ({record.actor.role})
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(record.createdAt).toLocaleString()}
                </p>
                {record.note && (
                  <div className="mt-2 text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-start">
                    <MessageSquare className="h-4 w-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                    <span>{record.note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center text-lg font-bold text-slate-900">
                <MessageSquare className="mr-2 h-5 w-5 text-blue-600" /> Conversation
              </h3>
              <p className="mt-1 text-sm text-slate-500">Private replies between the resident and society admin.</p>
            </div>
          </div>
          <div className="space-y-3">
            {complaint.comments?.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{comment.author.name} <span className="font-normal text-slate-400">({comment.author.role === 'ADMIN' ? 'Admin' : 'Resident'})</span></p>
                  <p className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</p>
                </div>
                <p className="mt-1 text-sm text-slate-700">{comment.message}</p>
              </div>
            ))}
            {!complaint.comments?.length && <p className="text-sm text-slate-500">No replies yet. Start the conversation below.</p>}
          </div>
          <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={commentMessage}
              onChange={(e) => setCommentMessage(e.target.value)}
              placeholder="Ask a question or share an update..."
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button type="submit" disabled={commentLoading || !commentMessage.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              <Send className="h-4 w-4" /> {commentLoading ? 'Sending...' : 'Reply'}
            </button>
          </form>
        </div>

        {/* Admin Action Section */}
        {user?.role === 'ADMIN' && complaint.status !== 'RESOLVED' && (
          <div className="p-6 border-t border-slate-200 bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Update Status</h3>
            <form onSubmit={handleStatusUpdate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
                <select 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Solution or progress note (Optional)</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Explain the fix, action taken, or next step..."
                />
              </div>
              <button 
                type="submit" 
                disabled={updateLoading}
                className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {updateLoading ? 'Saving...' : 'Save Update'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetail;