import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, Clock, FolderOpen } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user?.role === 'ADMIN') {
          // Fetch admin analytics
          const res = await api.get('/admin/dashboard');
          setStats(res.data);
        } else {
          // Fetch resident's own complaints to calculate simple stats
          const res = await api.get('/complaints');
          const complaints = res.data;
          const open = complaints.filter((c: any) => c.status === 'OPEN').length;
          const resolved = complaints.filter((c: any) => c.status === 'RESOLVED').length;
          setStats({
            overview: { total: complaints.length, open, resolved },
            isResident: true
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) return <div className="p-8 text-slate-500">Loading dashboard...</div>;
  if (!stats) return <div className="p-8 text-red-500">Failed to load data.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back, {user?.name}. Here is what's happening.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={stats.overview.total} icon={FolderOpen} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Open" value={stats.overview.open} icon={AlertCircle} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Resolved" value={stats.overview.resolved} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
        
        {/* Only Admins see the Overdue stat card */}
        {!stats.isResident && (
          <StatCard title="Overdue" value={stats.overview.overdue} icon={Clock} color="text-red-600" bg="bg-red-50" />
        )}
      </div>

      {/* Admin Chart Section */}
      {!stats.isResident && stats.charts?.byCategory?.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Complaints by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.charts.byCategory}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.charts.byCategory.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable UI Component for the Cards
const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
    <div className={`${bg} p-4 rounded-xl mr-4`}>
      <Icon className={`h-6 w-6 ${color}`} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
    </div>
  </div>
);

export default Dashboard;