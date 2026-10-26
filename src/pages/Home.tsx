import { useState } from 'react';
import { Search, ShieldAlert, ArrowRight, AlertOctagon, Phone, Smartphone, Link as LinkIcon, Calendar, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Define the Scammer Data Structure
interface Scammer {
  id: string;
  primary_name: string;
  phone_numbers: string[];
  gcash_numbers: string[];
  facebook_links: string[];
  verified_report_count: number;
  updated_at: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Scammer[]>([]);
  const navigate = useNavigate();

  // The Normalization Engine
  const normalizeInput = (input: string) => {
    let cleaned = input.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('09') && cleaned.length === 11) {
      cleaned = '+63' + cleaned.substring(1);
    }
    return cleaned.toLowerCase();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    const query = normalizeInput(searchQuery);
    
    try {
      // Search Supabase: 
      // ilike = case-insensitive partial match for Name
      // cs = "contains" for checking if the query exists inside the arrays
      const { data, error } = await supabase
        .from('scammers')
        .select('*')
        .eq('is_archived', false)
        .or(`primary_name.ilike.%${query}%,phone_numbers.cs.{${query}},gcash_numbers.cs.{${query}},facebook_links.cs.{${query}}`);

      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      console.error("Search error:", err.message);
      alert("Error searching database. Check console.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleDispute = async (scammerId: string, scammerName: string) => {
    const email = prompt(`You are initiating a dispute for the record: ${scammerName}\n\nPlease enter your contact email address:`);
    if (!email) return;
    
    const reason = prompt(`Please provide evidence or reasoning for why this record should be removed:`);
    if (!reason) return;

    try {
      const { error } = await supabase.from('disputes').insert({
        scammer_id: scammerId,
        contact_email: email,
        reason: reason
      });

      if (error) throw error;
      alert("Dispute submitted successfully. Our moderators will review your claim and contact you.");
    } catch (err: any) {
      alert("Failed to submit dispute: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-[75vh] px-4 pt-10 pb-20">
      
      {/* Brand & Hero Section */}
      <div className="text-center mb-8 flex flex-col items-center mt-4">
        <div className="bg-vangard-card p-4 rounded-full mb-4 shadow-lg border border-gray-800">
          <ShieldAlert className="w-12 h-12 text-vangard-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
          VANGARD Registry
        </h1>
        <p className="text-gray-400 max-w-md text-sm md:text-base">
          The centralized database for verifying online buyers and sellers. Search by phone, GCash, or Facebook link.
        </p>
      </div>

      {/* Search Engine Form */}
      <form onSubmit={handleSearch} className="w-full max-w-2xl relative mb-10">
        <div className="relative group shadow-2xl">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="w-6 h-6 text-gray-400 group-focus-within:text-vangard-accent transition-colors" />
          </div>
          
          <input
            type="text"
            className="block w-full p-5 pl-12 text-lg md:text-xl text-white bg-vangard-card border border-gray-700 rounded-2xl focus:ring-2 focus:ring-vangard-accent focus:border-transparent outline-none transition-all"
            placeholder="Enter Name, GCash, Phone, or FB Link..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
          
          <button
            type="submit"
            disabled={isSearching}
            className="absolute inset-y-2 right-2 px-6 bg-vangard-primary hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* SEARCH RESULTS AREA */}
      <div className="w-full max-w-3xl">
        {isSearching && (
          <div className="text-center text-gray-400 animate-pulse py-10">
            Scanning VANGARD Database...
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center shadow-lg">
            <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">No Records Found</h2>
            <p className="text-green-200/70 text-sm max-w-md mx-auto">
              We couldn't find any verified scam reports matching "{searchQuery}". 
              However, always remain cautious during online transactions.
            </p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-vangard-primary font-bold border-b border-gray-800 pb-2">
              <AlertOctagon /> 
              <h2>Found {results.length} Verified Match{results.length > 1 ? 'es' : ''}</h2>
            </div>
            
            {results.map((scammer) => (
              <div key={scammer.id} className="bg-vangard-card border border-red-900/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                {/* Red warning accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-vangard-primary"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-white mb-1">{scammer.primary_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" /> Last updated: {new Date(scammer.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl flex items-center gap-2 font-bold whitespace-nowrap">
                    <AlertOctagon className="w-5 h-5" />
                    {scammer.verified_report_count} Verified Flags
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                  {scammer.phone_numbers.length > 0 && (
                    <div className="flex items-center gap-3 bg-vangard-dark p-3 rounded-lg border border-gray-800">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-200">{scammer.phone_numbers.join(', ')}</span>
                    </div>
                  )}
                  {scammer.gcash_numbers.length > 0 && (
                    <div className="flex items-center gap-3 bg-vangard-dark p-3 rounded-lg border border-gray-800">
                      <Smartphone className="w-4 h-4 text-vangard-accent" />
                      <span className="text-gray-200">GCash: {scammer.gcash_numbers.join(', ')}</span>
                    </div>
                  )}
                  {scammer.facebook_links.length > 0 && (
                    <div className="flex flex-col gap-2 bg-vangard-dark p-3 rounded-lg border border-gray-800 md:col-span-2">
                      {scammer.facebook_links.map((link, idx) => (
                         <div key={idx} className="flex items-center gap-3">
                           <LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                           <a href={link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate">
                             {link}
                           </a>
                         </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DISPUTE BUTTON */}
                <div className="flex justify-end border-t border-red-900/30 pt-4 mt-2">
                  <button 
                    onClick={() => handleDispute(scammer.id, scammer.primary_name)}
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <Scale className="w-4 h-4" /> Dispute this record
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form-First CTA */}
      <div className="flex flex-col items-center gap-3 mt-12 pt-8 border-t border-gray-800 w-full max-w-xl text-center">
        <span className="text-sm text-gray-500">Have you been scammed by someone not on this list?</span>
        <button 
          onClick={() => navigate('/report')}
          className="flex items-center gap-2 text-vangard-accent hover:text-blue-400 font-bold transition-colors bg-blue-500/10 px-6 py-3 rounded-xl hover:bg-blue-500/20"
        >
          File a New Scam Report <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}