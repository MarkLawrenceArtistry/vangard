import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, Moon, Sun } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PublicLayout() {
  const [isDark, setIsDark] = useState(false);
  const [session, setSession] = useState<any>(null);
  const location = useLocation();

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

    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    
    return () => authListener.subscription.unsubscribe();
  }, []);

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-vangard-dark transition-colors duration-300">
      <header className="sticky top-0 w-full z-50 bg-white/80 dark:bg-vangard-card/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-placeholder.png" alt="Vangard" className="w-8 h-8 rounded-lg object-cover bg-red-100 dark:bg-red-900/30" />
            <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">VANGARD</span>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Link 
              to="/report" 
              className={`text-sm font-bold hidden md:block ${location.pathname === '/report' ? 'text-vangard-primary' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
            >
              File a Report
            </Link>
            
            <button onClick={toggleTheme} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link 
              to={session ? "/dashboard" : "/login"}
              className="flex items-center gap-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
            >
              <User className="w-4 h-4" /> {session ? 'Portal' : 'Sign In'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}