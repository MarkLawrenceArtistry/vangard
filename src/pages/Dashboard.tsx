import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, User, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import AuthModal from '../components/AuthModal';

// Define the shape of our report data
interface Report {
  id: string;
  reported_name: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_needed';
  created_at: string;
}

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check auth status and fetch reports on component mount
  useEffect(() => {
    const fetchSessionAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        await fetchMyReports();
      }
      setLoading(false);
    };

    fetchSessionAndData();

    // Listen for auth changes (like signing in via the modal or signing out)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchMyReports();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchMyReports = async () => {
    // Note: Our Supabase RLS policy ensures users can only fetch their own reports!
    const { data, error } = await supabase
      .from('reports')
      .select('id, reported_name, category, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error.message);
    } else {
      setReports(data || []);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setReports([]);
  };

  // Helper to style status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"><Clock className="w-3 h-3" /> Pending Review</span>;
      case 'approved':
        return <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</span>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10"><Clock className="w-8 h-8 animate-spin text-vangard-primary" /></div>;
  }

  // --- UN-AUTHENTICATED VIEW ---
  if (!session) {
    return (
      <div className="p-4 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-vangard-card p-6 rounded-full mb-6 border border-gray-800">
          <User className="w-12 h-12 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">My Dashboard</h1>
        <p className="text-gray-400 mb-6 max-w-md">
          Sign in to track the status of your submitted scam reports and manage your account.
        </p>
        <button 
          onClick={() => setShowAuthModal(true)}
          className="bg-vangard-primary hover:bg-red-600 px-8 py-3 rounded-xl font-bold transition-colors"
        >
          Sign In / Create Account
        </button>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={() => setShowAuthModal(false)} 
        />
      </div>
    );
  }

  // --- AUTHENTICATED VIEW ---
  return (
    <div className="p-4 max-w-4xl mx-auto mb-20 md:mb-10">
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-vangard-card p-6 rounded-2xl border border-gray-800 shadow-lg mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="text-vangard-primary" /> My Account
          </h1>
          <p className="text-gray-400 text-sm mt-1">{session.user.email}</p>
        </div>
        <button 
          onClick={handleSignOut}
          className="mt-4 md:mt-0 flex items-center gap-2 text-gray-400 hover:text-white bg-vangard-dark px-4 py-2 rounded-lg border border-gray-700 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Submissions List */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="text-vangard-accent" /> My Submissions
        </h2>
        
        {reports.length === 0 ? (
          <div className="bg-vangard-card border border-gray-800 rounded-2xl p-10 text-center flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-300">No reports submitted yet</h3>
            <p className="text-gray-500 text-sm mt-2">When you file a report against a scammer, you can track its review status here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-vangard-card border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all hover:border-gray-600">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg">{report.reported_name}</h3>
                    {getStatusBadge(report.status)}
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <span className="bg-vangard-dark px-2 py-0.5 rounded text-xs border border-gray-700">{report.category}</span>
                    <span>•</span>
                    <span>{new Date(report.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                
                {/* Visual indicator for next steps based on status */}
                {report.status === 'pending' && (
                  <div className="text-xs text-gray-500 bg-vangard-dark px-3 py-2 rounded-lg border border-gray-800">
                    Awaiting Moderator Review
                  </div>
                )}
                {report.status === 'approved' && (
                  <div className="text-xs text-green-500 bg-green-500/5 px-3 py-2 rounded-lg border border-green-900/30">
                    Published to Public Registry
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}