import { useState } from 'react';
import { X, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-vangard-card w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 relative max-h-[95dvh] flex flex-col overflow-hidden">
        
        {/* Close Button - Stays fixed in the corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto hide-scrollbar">
          <div className="flex justify-center mb-4 sm:mb-6 mt-2 sm:mt-0">
            <div className="bg-red-50 dark:bg-vangard-dark p-3 sm:p-4 rounded-full border border-red-100 dark:border-gray-700 shadow-sm">
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-vangard-primary" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-center mb-6 text-gray-900 dark:text-white">Account Required</h2>

          {/* Upgraded Info Box */}
          <div className="bg-gray-50 dark:bg-vangard-dark rounded-xl p-4 sm:p-5 mb-6 text-[13px] sm:text-sm text-gray-600 dark:text-gray-300 space-y-2 border border-gray-100 dark:border-gray-700 font-medium">
            <p className="font-bold text-gray-900 dark:text-white mb-3">To complete this action, please sign in:</p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> 
                Track the live status of your reports.
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> 
                Ensure accountability & prevent defamation.
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> 
                Maintain community safety & stop bots.
              </li>
            </ul>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3.5 sm:space-y-4">
            {error && <div className="text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl text-sm font-bold text-center border border-red-200 dark:border-red-900/30">{error}</div>}

            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 sm:p-4 bg-gray-50 dark:bg-vangard-dark border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all font-medium text-sm sm:text-base"
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 sm:p-4 bg-gray-50 dark:bg-vangard-dark border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all font-medium text-sm sm:text-base"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-vangard-primary hover:bg-red-600 text-white font-black py-3.5 sm:py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center mt-2 text-sm sm:text-base"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-6">
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