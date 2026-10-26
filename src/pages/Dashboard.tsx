import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Clock, CheckCircle, XCircle, FileText, Ban } from 'lucide-react';

interface Report { id: string; reported_name: string; category: string; status: string; created_at: string; }

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        
        // Fetch Profile for Suspension check
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(profileData);

        const { data } = await supabase.from('reports').select('id, reported_name, category, status, created_at').eq('reporter_id', session.user.id).order('created_at', { ascending: false });
        setReports(data || []);
      }
      setLoading(false);
    };
    fetchSessionAndData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20"><Clock className="w-3 h-3" /> Pending</span>;
      case 'approved': return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'rejected': return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500 border border-red-200 dark:border-red-500/20"><XCircle className="w-3 h-3" /> Rejected</span>;
      default: return null;
    }
  };

  if (loading || !session) return <div className="flex justify-center p-20"><Clock className="w-8 h-8 animate-spin text-vangard-primary" /></div>;

  return (
    <div className="w-full mx-auto max-w-4xl">
      
      {/* SUSPENSION BANNER */}
      {profile?.status === 'suspended' && (
        <div className="mb-6 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm flex items-start gap-4">
          <Ban className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-red-800 dark:text-red-400 text-lg">Account Suspended</h3>
            <p className="text-red-700 dark:text-red-300 text-sm font-medium mt-1">
              Your account has been suspended until <strong>{new Date(profile.suspended_until).toLocaleString()}</strong> due to a violation of our terms. You cannot submit new reports during this time.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-vangard-card p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <User className="text-vangard-primary w-6 h-6 md:w-7 md:h-7" /> User Portal
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-xs md:text-sm mt-1">{session.user.email}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="text-gray-400 w-5 h-5" /> My Submissions
        </h2>
        
        {reports.length === 0 ? (
          <div className="bg-white dark:bg-vangard-card border border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center flex flex-col items-center">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-300">No reports submitted</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white dark:bg-vangard-card border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{report.reported_name}</h3>
                    {getStatusBadge(report.status)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                    <span>{report.category}</span>
                    <span>•</span>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}