import { useState } from 'react';
import { X, ShieldCheck, Mail, Loader2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-vangard-card w-full max-w-md rounded-2xl shadow-2xl border border-gray-700 overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="bg-vangard-dark p-3 rounded-full border border-gray-700">
              <ShieldCheck className="w-8 h-8 text-vangard-primary" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2">Account Required</h2>
          
          <div className="bg-vangard-dark rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-2 border border-gray-700">
            <p className="font-semibold text-white mb-1">To complete submission, please sign in:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Track the live status of your report.</li>
              <li>Ensure accountability & prevent defamation.</li>
              <li>Maintain community safety & stop spam bots.</li>
            </ul>
          </div>

          <div className="space-y-3 mb-6">
            <button onClick={() => handleOAuth('google')} className="w-full bg-white text-gray-900 font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
              Sign in with Google
            </button>
            <button onClick={() => handleOAuth('discord')} className="w-full bg-[#5865F2] text-white font-semibold py-2.5 rounded-xl hover:bg-[#4752C4] transition-colors flex items-center justify-center gap-2">
              Sign in with Discord
            </button>
          </div>

          <div className="relative flex items-center py-2 mb-4">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">Or use email</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && <div className="text-red-400 text-sm text-center">{error}</div>}
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-vangard-dark border border-gray-700 rounded-xl focus:ring-2 focus:ring-vangard-accent outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-vangard-dark border border-gray-700 rounded-xl focus:ring-2 focus:ring-vangard-accent outline-none"
            />
            <button type="submit" disabled={loading} className="w-full bg-vangard-primary hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-vangard-accent hover:underline">
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}