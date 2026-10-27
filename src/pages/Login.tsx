import { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const isFromReport = new URLSearchParams(location.search).get('redirect') === '/report';
  const [isLogin, setIsLogin] = useState(!isFromReport);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard');
    });
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const redirectTo = new URLSearchParams(location.search).get('redirect') || '/dashboard';

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(redirectTo);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.session) {
          navigate(redirectTo);
        } else {
          alert("Success! Please check your email for the confirmation link. (Turn off 'Confirm Email' in Supabase to skip this step)");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'discord') => {
    const redirectTo = new URLSearchParams(location.search).get('redirect') || '/dashboard';
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${redirectTo}` }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4 w-full py-8">
      <div className="bg-white dark:bg-vangard-card w-full max-w-md rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all p-6 sm:p-8">

        <div className="flex justify-center mb-4 sm:mb-6 mt-2 sm:mt-0">
          <div className="bg-red-50 dark:bg-vangard-dark p-3 sm:p-4 rounded-full border border-red-100 dark:border-gray-700 shadow-sm">
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-vangard-primary" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-center mb-6 text-gray-900 dark:text-white">
          {isLogin ? 'Welcome Back' : 'Account Required'}
        </h2>

        {/* Benefits/Info Box */}
        <div className="bg-gray-50 dark:bg-vangard-dark rounded-xl p-4 sm:p-5 mb-6 text-[13px] sm:text-sm text-gray-600 dark:text-gray-300 space-y-2 border border-gray-100 dark:border-gray-700 font-medium">
          <p className="font-bold text-gray-900 dark:text-white mb-3">
            {isLogin ? "Sign in to access your portal:" : "To file a report, please register:"}
          </p>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              Track the live status of your reports.
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              Ensure authenticity & prevent defamation.
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              Maintain community safety & stop bots.
            </li>
          </ul>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3.5 sm:space-y-4">
          {error && (
            <div className="text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl text-sm font-bold text-center border border-red-200 dark:border-red-900/30">
              {error}
            </div>
          )}

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
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-vangard-primary font-bold hover:underline"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}