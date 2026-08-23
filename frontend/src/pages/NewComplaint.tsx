import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const NewComplaint: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('PLUMBING');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/complaints', {
        title,
        description,
        category,
        photoUrl: photoUrl || undefined
      });
      navigate('/complaints');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/complaints" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Complaints
      </Link>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Raise New Complaint</h1>
        <p className="text-slate-500 text-sm mb-6">Describe the issue clearly so management can resolve it quickly.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Issue Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Leaking pipe in hallway"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="SECURITY">Security</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              required
              rows={4}
              placeholder="Provide exact details, location, and symptoms..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Photo URL (Optional)</label>
            <input
              type="url"
              placeholder="https://example.com/photo.jpg"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/complaints"
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewComplaint;