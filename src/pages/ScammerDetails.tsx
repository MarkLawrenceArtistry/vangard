import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertOctagon, Phone, Smartphone, Link as LinkIcon, Calendar, ArrowLeft, ShieldAlert } from 'lucide-react';

// Helper function to turn URLs in text into clickable anchor tags
const linkify = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline font-bold break-all">
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function ScammerDetails() {
  const { id } = useParams();
  const [scammer, setScammer] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: scamData } = await supabase.from('scammers').select('*').eq('id', id).single();
      if (scamData) setScammer(scamData);

      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .eq('scammer_id', id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
        
      if (reportData) setReports(reportData);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-20 font-bold text-gray-500 animate-pulse text-sm">Loading Records...</div>;
  if (!scammer) return <div className="text-center py-20 font-bold text-gray-500 text-sm">Record not found.</div>;

  // Render arrays safely mapping "N/A" out if it slipped through
  const renderPhones = scammer.phone_numbers.filter((p:string) => p.toUpperCase() !== 'N/A');
  const renderGcash = scammer.gcash_numbers.filter((g:string) => g.toUpperCase() !== 'N/A');
  const renderFacebook = scammer.facebook_links.filter((f:string) => f.toUpperCase() !== 'N/A');

  return (
    <div className="w-full max-w-4xl mx-auto pb-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold mb-5 transition-colors text-xs">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Search
      </Link>

      <div className="bg-white dark:bg-vangard-card border border-red-100 dark:border-red-900/30 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-vangard-primary"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-5 mt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1.5">{scammer.primary_name}</h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <Calendar className="w-3.5 h-3.5" /> Added: {new Date(scammer.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl flex items-center gap-1.5 font-black text-sm">
            <AlertOctagon className="w-4 h-4" /> {scammer.verified_report_count} Verified Flags
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-medium">
          {renderPhones.map((phone: string, i: number) => (
            <div key={i} className="flex items-center gap-2.5 bg-gray-50 dark:bg-vangard-dark p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <Phone className="w-4 h-4 text-gray-400" /> <span className="text-gray-700 dark:text-gray-200">{phone}</span>
            </div>
          ))}
          {/* Deduplicate rendering if phone and gcash are strictly identical now */}
          {renderGcash.filter((g:string) => !renderPhones.includes(g)).map((gcash: string, i: number) => (
            <div key={i} className="flex items-center gap-2.5 bg-gray-50 dark:bg-vangard-dark p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <Smartphone className="w-4 h-4 text-vangard-primary" /> <span className="text-gray-700 dark:text-gray-200">GCash: {gcash}</span>
            </div>
          ))}
          {renderFacebook.map((link: string, i: number) => (
            <div key={i} className="flex items-center gap-2.5 bg-gray-50 dark:bg-vangard-dark p-3 rounded-xl border border-gray-100 dark:border-gray-800 md:col-span-2">
              <LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">{link}</a>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-gray-400" /> Verified Incident Reports
        </h2>
        
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white dark:bg-vangard-card p-5 md:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">{report.category}</span>
                <span className="text-[11px] font-bold text-gray-400">{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
              
              {/* Added Break-words and Linkify processing */}
              <p className="text-gray-700 dark:text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-medium break-words break-all">
                {linkify(report.description)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}