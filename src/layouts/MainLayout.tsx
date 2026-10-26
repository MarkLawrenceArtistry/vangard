import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { User, Scale, Menu, X, Moon, Sun, Search, LogOut, Clock, Database, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const [session, setSession] = useState<any>(null);
  
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
      setSession(session);
      if (session) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data && (data.role === 'moderator' || data.role === 'admin')) {
          setIsMod(true);
        }
      }
    };
    
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setIsMod(false);
      checkSession();
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // REDUCED PADDING AND SOFTER ACTIVE STATE
  const NavItem = ({ to, icon: Icon, label, alert }: { to: string, icon: any, label: string, alert?: boolean }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 font-semibold text-sm
        ${isActive 
          ? 'bg-red-50 text-vangard-primary dark:bg-red-500/10 dark:text-red-400' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
        }
      `}
    >
      <Icon className="w-[18px] h-[18px]" />
      <span className="flex-1">{label}</span>
      {alert && !useLocation().pathname.includes(to) && (
        <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen flex">
      {/* MOBILE HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-vangard-card/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          {/* IMAGE LOGO */}
          <img src="/logo-placeholder.png" alt="Vangard" className="w-8 h-8 rounded-lg object-cover bg-red-100 dark:bg-red-900/30" />
          <span className="font-black text-lg tracking-tight">VANGARD</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 text-gray-600 dark:text-gray-300 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed top-0 bottom-0 left-0 w-[260px] bg-white dark:bg-vangard-card border-r border-gray-100 dark:border-gray-800 z-50 
        flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* IMAGE LOGO */}
            <img src="/logo-placeholder.png" alt="Vangard" className="w-8 h-8 rounded-xl object-cover shadow-sm bg-red-100 dark:bg-red-900/30" />
            <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">VANGARD</span>
          </div>
          <button className="md:hidden p-2 text-gray-500 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6">
          
          {/* PUBLIC TABS (Only 2) */}
          <div>
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Public</span>
            </div>
            <div className="space-y-1">
              <NavItem to="/" icon={Search} label="Search Engine" />
              <NavItem to="/report" icon={ShieldAlert} label="File a Report" />
            </div>
          </div>

          {/* INSIDE: ADMINISTRATION / USER QUEUE (Requires Login) */}
          {session && (
            <div>
              <div className="px-3 mb-2">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Personal</span>
              </div>
              <div className="space-y-1">
                <NavItem to="/dashboard" icon={User} label="My Dashboard" />
              </div>
            </div>
          )}

          {isMod && (
            <div>
              <div className="px-3 mb-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-vangard-primary uppercase tracking-widest">Administration</span>
              </div>
              <div className="space-y-1 border-l-2 border-red-100 dark:border-red-900/30 ml-2 pl-2">
                <NavItem to="/mod/pending" icon={Clock} label="Pending Queue" alert />
                <NavItem to="/mod/database" icon={Database} label="Verified Database" />
                <NavItem to="/mod/disputes" icon={Scale} label="Disputes" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-50 dark:border-gray-800 space-y-2">
          {session && (
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-bold"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          )}
          
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-600 dark:text-gray-400"
          >
            <span className="flex items-center gap-3">
              {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 md:ml-[260px] pt-16 md:pt-0 min-h-screen w-full">
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-20">
          <Outlet />
        </div>
      </main>
    </div>
  );
}