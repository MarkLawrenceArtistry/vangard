import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, Moon, Sun, ShieldAlert, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PublicLayout() {
  const [isDark, setIsDark] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const location = useLocation();

  useEffect(() => {
    // Offline Listener
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
      
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-red-500 text-white text-xs font-bold px-4 py-2.5 flex justify-center items-center gap-2 z-[100] relative">
          <WifiOff className="w-4 h-4" /> You are currently offline. Searching and reporting are unavailable.
        </div>
      )}

      <header className="sticky top-0 w-full z-50 bg-white/80 dark:bg-vangard-card/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-placeholder.png" alt="Vangard" className="w-7 h-7 rounded-lg object-cover bg-red-100 dark:bg-red-900/30" />
            <span className="font-black text-lg tracking-tight text-gray-900 dark:text-white">VANGARD</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <Link
                to="/wall-of-shame"
                className={`text-[11px] md:text-xs font-bold hidden sm:block ${location.pathname === '/wall-of-shame' ? 'text-vangard-primary' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
            >
                Wall of Shame
            </Link>

            <Link
              to="/report"
              className={`text-xs font-bold hidden md:block ${location.pathname === '/report' ? 'text-vangard-primary' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
            >
              File a Report
            </Link>

            <button onClick={toggleTheme} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to={session ? "/dashboard" : "/login"}
              className="flex items-center gap-1.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-3 py-1.5 rounded-lg font-bold text-xs hover:scale-105 transition-transform"
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate max-w-[120px] md:max-w-[200px]">
                {session ? session.user.email : 'Sign In'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6">
        <Outlet />
      </main>

      <footer className="w-full bg-white dark:bg-vangard-card border-t border-gray-200 dark:border-gray-800 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left text-xs font-medium text-gray-500 dark:text-gray-400">
          <ShieldAlert className="w-6 h-6 text-gray-400 flex-shrink-0" />
          <p>
            <strong className="text-gray-700 dark:text-gray-300">Disclaimer:</strong> VANGARD is a community-driven tool designed to reduce the chances of, and prevent users from, being scammed. We hold absolutely no legal authority, and we cannot recover funds or "save" users once a scam has occurred. Please exercise extreme caution and transact at your own risk.
          </p>
        </div>
      </footer>
    </div>
  );
}