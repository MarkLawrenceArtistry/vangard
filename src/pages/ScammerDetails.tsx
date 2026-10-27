import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertOctagon, Phone, Smartphone, Link as LinkIcon, Calendar, ArrowLeft, ShieldAlert, MessageSquareWarning, Flame  } from 'lucide-react';

import AuthModal from '../components/AuthModal';
import DisputeModal from '../components/DisputeModal';

const linkify = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline font-bold break-all">{part}</a>;
    }
    return part;
  });
};

export default function ScammerDetails() {
  const { id } = useParams();
  const [scammer, setScammer] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const fetchData = async () => {
      setLoading(true);
      const { data: scamData } = await supabase.from('scammers').select('*').eq('id', id).single();
      if (scamData) setScammer(scamData);

      const { data: reportData } = await supabase.from('reports').select('*').eq('scammer_id', id).eq('status', 'approved').order('created_at', { ascending: false });
      if (reportData) setReports(reportData);
      setLoading(false);
    };
    fetchData();
  }, [id]);

    const handleDisputeClick = () => {
        if (!session) {
            setAuthModalOpen(true);
        } else {
            setDisputeModalOpen(true);
        }
    };

  if (loading) return <div className="text-center py-20 font-bold text-gray-500 animate-pulse text-sm">Loading Records...</div>;
  if (!scammer) return <div className="text-center py-20 font-bold text-gray-500 text-sm">Record not found.</div>;

  const renderPhones = scammer.phone_numbers.filter((p:string) => p.toUpperCase() !== 'N/A');
  const renderGcash = scammer.gcash_numbers.filter((g:string) => g.toUpperCase() !== 'N/A');
  const renderFacebook = scammer.facebook_links.filter((f:string) => f.toUpperCase() !== 'N/A');

  return (
    <div className="w-full max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-5">
    <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold transition-colors text-[11px] sm:text-xs">
      <ArrowLeft className="w-3.5 h-3.5" /> Back to Search
    </Link>

    <Link to="/wall-of-shame" className="inline-flex items-center gap-1.5 text-vangard-primary hover:text-red-600 font-bold transition-colors text-[11px] sm:text-xs">
      <Flame className="w-3.5 h-3.5" /> Wall of Shame
    </Link>
  </div>

      <div className="bg-white dark:bg-vangard-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-red-600"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 mt-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">{scammer.primary_name}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-800/50 inline-flex px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
              <Calendar className="w-4 h-4" /> Added: {new Date(scammer.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full md:w-auto">
            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-5 py-3 rounded-xl flex justify-center items-center gap-2 font-black text-sm border border-red-100 dark:border-red-900/30">
              <AlertOctagon className="w-5 h-5" /> {scammer.verified_report_count} Verified Flags
            </div>
            <button onClick={handleDisputeClick} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-5 py-3 rounded-xl flex justify-center items-center gap-2 font-bold text-sm transition-colors border border-gray-200 dark:border-gray-700">
              <MessageSquareWarning className="w-5 h-5" /> Dispute Record
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium">
          {renderPhones.map((phone: string, i: number) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-vangard-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm"><Phone className="w-4 h-4 text-gray-500" /></div>
              <span className="text-gray-800 dark:text-gray-200">{phone}</span>
            </div>
          ))}
          {renderGcash.filter((g:string) => !renderPhones.includes(g)).map((gcash: string, i: number) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-vangard-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm"><Smartphone className="w-4 h-4 text-blue-500" /></div>
              <span className="text-gray-800 dark:text-gray-200">GCash: {gcash}</span>
            </div>
          ))}
          {renderFacebook.map((link: string, i: number) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-vangard-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 md:col-span-2">
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm"><LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0" /></div>
              <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">{link}</a>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-gray-400" /> Verified Incident Reports
        </h2>
        
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white dark:bg-vangard-card p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">{report.category}</span>
                <span className="text-xs font-bold text-gray-400">{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-medium break-words break-all">
                {linkify(report.description)}
              </p>
            </div>
          ))}
        </div>
      </div>
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onSuccess={() => { setAuthModalOpen(false); setDisputeModalOpen(true); supabase.auth.getSession().then(({ data }) => setSession(data.session)); }} 
        />
        <DisputeModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        scammerId={scammer.id}
        scammerName={scammer.primary_name}
        userId={session?.user?.id}
        defaultEmail={session?.user?.email || ''}
        />
    </div>
  );
}