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
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Wrench className="h-6 w-6 text-blue-600 mr-2" />
          <span className="text-xl font-black text-slate-900 tracking-tight">SocietyFix</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout at bottom of sidebar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 font-medium">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
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
            <Wrench className="h-6 w-6 text-blue-600 mr-2" />
            <span className="text-xl font-black text-slate-900">SocietyFix</span>
          </div>
          <button onClick={logout} className="p-2 text-slate-500 hover:text-red-600">
            <LogOut className="h-6 w-6" />
          </button>
        </header>

        {/* Dynamic Page Content goes inside Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default Layout;