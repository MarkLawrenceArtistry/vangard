import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { User, Scale, Menu, X, Moon, Sun, LogOut, Clock, Database, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PortalLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMod, setIsMod] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (data && (data.role === 'moderator' || data.role === 'admin')) setIsMod(true);
    };
    checkSession();
  }, [navigate]);

  useEffect(() => setIsSidebarOpen(false), [location.pathname]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 font-semibold text-sm
        ${isActive 
          ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50' 
          : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
        }
      `}
    >
      {({ isActive }) => (
        <>
          <Icon className="w-5 h-5 opacity-70" />
          <span className="flex-1">{label}</span>
          {/* Yellow dot indicator from screenshot */}
          {isActive && <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></span>}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-vangard-dark transition-colors duration-300">
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-vangard-card/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <img src="/logo-placeholder.png" alt="Vangard" className="w-8 h-8 rounded-lg object-cover bg-red-100" />
          <span className="font-black text-lg tracking-tight">PORTAL</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {isSidebarOpen && <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`
        fixed top-0 bottom-0 left-0 w-[260px] bg-white dark:bg-vangard-card border-r border-gray-200 dark:border-gray-800 z-50 
        flex flex-col transition-transform duration-300 shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-placeholder.png" alt="Vangard" className="w-8 h-8 rounded-xl object-cover bg-red-100" />
            <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">PORTAL</span>
          </div>
          <button className="md:hidden p-2 text-gray-500 rounded-lg" onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-8">
          <div>
            <div className="px-3 mb-3">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Personal</span>
            </div>
            <div className="space-y-1">
              <NavItem to="/dashboard" icon={User} label="My Dashboard" />
            </div>
          </div>

          {isMod && (
            <div>
              <div className="px-3 mb-3">
                {/* Red heading from screenshot */}
                <span className="text-[11px] font-black text-vangard-primary uppercase tracking-widest">Administration</span>
              </div>
              <div className="space-y-1 border-l-2 border-red-100 dark:border-red-900/30 ml-3 pl-2">
                <NavItem to="/mod/pending" icon={Clock} label="Pending Queue" />
                <NavItem to="/mod/database" icon={Database} label="Verified Database" />
                <NavItem to="/mod/disputes" icon={Scale} label="Disputes" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <Link to="/" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-bold">
            <ArrowLeft className="w-4 h-4" /> Back to Public
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-bold">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-3">
              {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-[260px] pt-16 md:pt-0 w-full">
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-20">
          <Outlet />
        </div>
      </main>
    </div>
  );
}