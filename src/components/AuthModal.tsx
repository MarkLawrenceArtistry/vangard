import { useState } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'discord') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-vangard-card w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative transform transition-all">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-gray-800 p-2 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-red-50 dark:bg-vangard-dark p-4 rounded-full border border-red-100 dark:border-gray-700 shadow-sm">
              <ShieldCheck className="w-10 h-10 text-vangard-primary" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-center mb-2 text-gray-900 dark:text-white">Account Required</h2>
          
          <div className="bg-gray-50 dark:bg-vangard-dark rounded-2xl p-5 mb-8 text-sm text-gray-600 dark:text-gray-300 space-y-2 border border-gray-100 dark:border-gray-700 font-medium">
            <p className="font-bold text-gray-900 dark:text-white mb-2">To complete this action, please sign in:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Track the live status of your reports.</li>
              <li>Ensure accountability & prevent defamation.</li>
              <li>Maintain community safety & stop bots.</li>
            </ul>
          </div>

          <div className="space-y-3 mb-6">
            <button 
              onClick={() => handleOAuth('google')} 
              className="w-full bg-white dark:bg-gray-100 text-gray-900 font-bold py-3.5 rounded-2xl border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
            >
              Sign in with Google
            </button>
            <button 
              onClick={() => handleOAuth('discord')} 
              className="w-full bg-[#5865F2] text-white font-bold py-3.5 rounded-2xl hover:bg-[#4752C4] transition-colors flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
            >
              Sign in with Discord
            </button>
          </div>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">Or use email</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && <div className="text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl text-sm font-bold text-center border border-red-200 dark:border-red-900/30">{error}</div>}
            
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-vangard-dark border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all font-medium"
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-vangard-dark border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all font-medium"
            />
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-vangard-primary hover:bg-red-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl flex justify-center items-center mt-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-vangard-primary font-bold hover:underline">
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}