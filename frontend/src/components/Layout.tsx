import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Wrench, Bell, LogOut, User as UserIcon } from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Define our navigation links
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Complaints', path: '/complaints', icon: Wrench },
    { name: 'Notices', path: '/notices', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex">
      
      {/* Sidebar */}
      <div className="w-72 bg-[#14213d] text-white flex-col hidden md:flex">
        <div className="h-24 flex items-center px-7 border-b border-white/10">
          <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center mr-3 shadow-lg shadow-blue-950/30">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">SocietyFix</span>
            <p className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">Resident operations</p>
          </div>
        </div>
        
        <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-950/20' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout at bottom of sidebar */}
        <div className="p-5 border-t border-white/10 bg-black/10">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 font-medium">{user?.role === 'ADMIN' ? 'Community admin' : 'Resident'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full justify-center px-4 py-2.5 text-sm font-medium text-red-200 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header (visible only on small screens) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center mr-2">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">SocietyFix</span>
          </div>
          <button onClick={logout} className="p-2 text-slate-500 hover:text-red-600">
            <LogOut className="h-6 w-6" />
          </button>
        </header>

        {/* Dynamic Page Content goes inside Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default Layout;