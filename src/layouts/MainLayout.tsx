import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Search, ShieldAlert, User, Scale, Menu, X, Moon, Sun, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const location = useLocation(); // Used to close mobile sidebar on route change

  // Initialize theme & check mod status
  useEffect(() => {
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }

    // Check if user is Mod/Admin to show the Mod HQ tab
    const checkMod = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data && (data.role === 'moderator' || data.role === 'admin')) {
          setIsMod(true);
        }
      }
    };
    checkMod();
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const NavItem = ({ to, icon: Icon, label, alert }: { to: string, icon: any, label: string, alert?: boolean }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium
        ${isActive 
          ? 'bg-vangard-primary text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
        }
        ${alert && !useLocation().pathname.includes(to) ? 'text-yellow-600 dark:text-yellow-500' : ''}
      `}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-vangard-dark text-gray-900 dark:text-white transition-colors duration-300 flex">
      
      {/* MOBILE TOP HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-vangard-card border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-40 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <div className="bg-vangard-primary p-1.5 rounded-lg">
            <ShieldAlert className="text-white w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-wide">VANGARD</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR (Desktop fixed, Mobile off-canvas) */}
      <aside className={`
        fixed top-0 bottom-0 left-0 w-[280px] bg-white dark:bg-vangard-card border-r border-gray-200 dark:border-gray-800 z-50 
        flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header & Close Button */}
        <div className="h-24 px-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="bg-vangard-primary p-2 rounded-xl shadow-[0_4px_10px_rgba(239,68,68,0.3)]">
              <ShieldAlert className="text-white w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-wide">VANGARD</span>
          </div>
          <button 
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <NavItem to="/" icon={Search} label="Search Database" />
          <NavItem to="/report" icon={ShieldAlert} label="File a Report" />
          <NavItem to="/dashboard" icon={User} label="My Account" />
          
          {isMod && (
            <>
              <div className="pt-4 pb-2 px-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Administration</span>
              </div>
              <NavItem to="/mod" icon={ShieldCheck} label="Moderator HQ" alert />
            </>
          )}
        </div>

        {/* Sidebar Footer (Theme Toggle & Legal) */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <span className="flex items-center gap-3">
              {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-blue-600" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          
          <div className="mt-6 px-2 flex items-start gap-2 text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
            <Scale className="w-4 h-4 flex-shrink-0" />
            <p>VANGARD is a community registry. Reports are user-submitted allegations, not legal findings.</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-[280px] pt-16 md:pt-0 min-h-screen w-full transition-colors duration-300">
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-20">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
}