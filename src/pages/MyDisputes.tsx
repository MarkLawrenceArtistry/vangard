import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquareWarning, Clock, Mail, CheckCircle, XCircle, X } from 'lucide-react';

export default function MyDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState("");

  useEffect(() => {
    const fetchDisputes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('disputes').select('*, scammers(primary_name)').eq('user_id', session.user.id).order('created_at', { ascending: false });
        setDisputes(data || []);
      }
      setLoading(false);
    };
    fetchDisputes();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500"><Clock className="w-3 h-3" /> Pending Review</span>;
      case 'awaiting_evidence': return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500"><Mail className="w-3 h-3" /> Evidence Required</span>;
      case 'resolved': return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500"><CheckCircle className="w-3 h-3" /> Resolved</span>;
      case 'rejected': return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500"><XCircle className="w-3 h-3" /> Rejected</span>;
      default: return null;
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Clock className="w-8 h-8 animate-spin text-vangard-primary" /></div>;

  return (
    <div className="w-full mx-auto max-w-4xl">
      <div className="bg-white dark:bg-vangard-card p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
        <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquareWarning className="text-yellow-500 w-6 h-6" /> My Disputes
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-xs md:text-sm mt-1">Track the status of your submitted disputes.</p>
      </div>

      {disputes.length === 0 ? (
        <div className="bg-white dark:bg-vangard-card border border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center">
          <MessageSquareWarning className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-300">No disputes submitted</h3>
        </div>
      ) : (
        <div className="grid gap-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white dark:bg-vangard-card border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Target: {dispute.scammers?.primary_name || 'Deleted'}</h3>
                  {getStatusBadge(dispute.status)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Submitted: {new Date(dispute.created_at).toLocaleDateString()}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mt-2">"{dispute.reason}"</p>
              </div>
              
              {dispute.admin_message && (
                <button 
                  onClick={() => { setActiveMessage(dispute.admin_message); setMessageModalOpen(true); }}
                  className="shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors border border-blue-100 dark:border-blue-900/30"
                >
                  Check Admin Message
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {messageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-vangard-card w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 relative">
            <button onClick={() => setMessageModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 p-2 rounded-full"><X className="w-4 h-4" /></button>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Mail className="text-blue-500 w-5 h-5"/> Message from Moderation Team</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-gray-200 dark:border-gray-700 font-medium leading-relaxed">
              {activeMessage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}