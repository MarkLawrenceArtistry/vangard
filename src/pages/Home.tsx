import { useState } from 'react';
import { Search, ShieldAlert, ArrowRight, AlertOctagon, Phone, Smartphone, Link as LinkIcon, Calendar, MessageSquareWarning } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setHasSearched(false);
    setResults([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    let query = searchQuery.replace(/[\s\-\(\)]/g, '');
    if (query.startsWith('09') && query.length === 11) query = '+63' + query.substring(1);
    query = query.toLowerCase();
    
    try {
      const { data, error } = await supabase
        .from('scammers')
        .select('*')
        .eq('is_archived', false)
        .or(`primary_name.ilike.%${query}%,phone_numbers.cs.{${query}},gcash_numbers.cs.{${query}},facebook_links.cs.{${query}}`);
        
      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDispute = async (scammerId: string) => {
    const email = prompt("Enter your email address so our team can contact you:");
    if (!email) return;
    const reason = prompt("Briefly explain why this record is inaccurate or resolved:");
    if (!reason) return;

    try {
      const { error } = await supabase.from('disputes').insert({
        scammer_id: scammerId,
        contact_email: email,
        reason: reason
      });
      if (error) throw error;
      alert("Dispute submitted successfully. Our moderation team will review and contact you.");
    } catch (err: any) {
      alert("Error submitting dispute: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center pt-8 md:pt-20 pb-24 w-full">
      <div className="text-center mb-6 flex flex-col items-center">
        <div className="bg-red-50 dark:bg-red-500/10 p-3.5 rounded-3xl mb-4 shadow-sm border border-red-100 dark:border-red-900/20">
          <ShieldAlert className="w-8 h-8 text-vangard-primary" />
        </div>
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight mb-3 text-gray-900 dark:text-white">
          Verify Before <br className="md:hidden" /> You Transact
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl text-xs md:text-sm font-medium leading-relaxed px-4">
          The community-driven registry protecting online buyers and sellers. Search by Name, GCash, Phone, or Facebook Link.
        </p>
      </div>

      <form onSubmit={handleSearch} className="w-full max-w-xl relative mb-10">
        <div className="relative group shadow-sm dark:shadow-2xl rounded-2xl transition-shadow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-vangard-primary transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full p-4 pl-12 text-sm bg-white dark:bg-vangard-card border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all placeholder:text-gray-400 dark:text-white text-gray-900 font-medium shadow-sm"
            placeholder="Search scammers..."
            value={searchQuery}
            onChange={handleInputChange}
            required
          />
          <button type="submit" disabled={isSearching} className="absolute inset-y-2 right-2 px-5 bg-vangard-primary hover:bg-red-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 text-xs">
            {isSearching ? 'Scanning...' : 'Search'}
          </button>
        </div>
      </form>

      <div className="w-full max-w-3xl">
        {isSearching && <div className="text-center text-gray-400 font-bold py-10">Scanning Database...</div>}
        
        {!isSearching && hasSearched && results.length === 0 && (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 rounded-3xl p-8 text-center shadow-sm">
            <h2 className="text-xl md:text-2xl font-black text-green-700 dark:text-green-400 mb-2">No Records Found</h2>
            <p className="text-green-600/80 dark:text-green-200/70 text-sm max-w-md mx-auto font-medium">We couldn't find any verified scam reports matching "{searchQuery}". Stay vigilant.</p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-vangard-primary font-black text-base md:text-lg mb-2">
              <AlertOctagon className="w-5 h-5" /> <h2>Found {results.length} Match{results.length > 1 ? 'es' : ''}</h2>
            </div>
            
            {results.map((s) => (
              <div key={s.id} className="bg-white dark:bg-vangard-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-red-600"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 mt-1">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">{s.primary_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" /> Updated: {new Date(s.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                    <Link 
                      to={`/scammer/${s.id}`}
                      className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2.5 rounded-xl flex justify-center items-center gap-2 font-bold text-xs transition-transform hover:scale-105 shadow-md"
                    >
                      <AlertOctagon className="w-4 h-4" /> View {s.verified_report_count} Flags
                    </Link>
                    <button 
                      onClick={() => handleDispute(s.id)}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2.5 rounded-xl flex justify-center items-center gap-2 font-bold text-xs transition-colors"
                    >
                      <MessageSquareWarning className="w-4 h-4" /> Dispute
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-medium bg-gray-50/50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                  {s.phone_numbers.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm"><Phone className="w-4 h-4 text-gray-500" /></div>
                      <span className="text-gray-800 dark:text-gray-200">{s.phone_numbers.join(', ')}</span>
                    </div>
                  )}
                  {s.gcash_numbers.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm"><Smartphone className="w-4 h-4 text-blue-500" /></div>
                      <span className="text-gray-800 dark:text-gray-200">GCash: {s.gcash_numbers.join(', ')}</span>
                    </div>
                  )}
                  {s.facebook_links.length > 0 && (
                    <div className="flex flex-col gap-2 md:col-span-2 mt-2">
                      {s.facebook_links.map((link: string, idx: number) => (
                         <div key={idx} className="flex items-center gap-3">
                           <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm"><LinkIcon className="w-4 h-4 text-blue-500" /></div>
                           <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                             {link}
                           </a>
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 pt-6 flex flex-col items-center gap-3 text-center md:hidden">
        <span className="text-sm font-medium text-gray-500">Scammed by someone else?</span>
        <button onClick={() => navigate('/report')} className="flex items-center gap-2 text-vangard-primary font-black bg-red-50 dark:bg-red-500/10 px-5 py-2.5 rounded-full border border-red-100 dark:border-red-900/30">
          File a Report <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}