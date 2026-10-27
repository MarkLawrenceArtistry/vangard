import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, ShieldAlert, ArrowLeft, ArrowRight, AlertOctagon, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 10;

export default function WallOfShame() {
  const [scammers, setScammers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchScammers(page);
  }, [page]);

  const fetchScammers = async (currentPage: number) => {
    setLoading(true);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      const { data, count, error } = await supabase
        .from('scammers')
        .select('*', { count: 'exact' })
        .eq('is_archived', false)
        .order('verified_report_count', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setScammers(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500 bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30';
    if (rank === 2) return 'text-gray-400 bg-gray-50 border-gray-200 dark:bg-gray-400/10 dark:border-gray-400/30';
    if (rank === 3) return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-600/10 dark:border-amber-600/30';
    return 'text-gray-500 bg-gray-50 border-gray-100 dark:text-gray-400 dark:bg-gray-800/50 dark:border-gray-700/50';
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Back Button */}
      <div className="flex justify-start mb-5">
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold transition-colors text-[11px] sm:text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Search
        </Link>
      </div>

      {/* Header Section */}
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="bg-red-50 dark:bg-red-500/10 p-3 sm:p-4 rounded-full mb-3 sm:mb-4 border border-red-100 dark:border-red-900/30 shadow-sm">
          <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-vangard-primary" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2 text-gray-900 dark:text-white uppercase">
          Wall of Shame
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg text-xs sm:text-sm font-medium leading-relaxed px-4">
          The most reported and verified scammers in our database. Stay vigilant and avoid transacting with these individuals.
        </p>
      </div>

      {/* Leaderboard List */}
      <div className="bg-white dark:bg-vangard-card rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden mb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-gray-400">
            <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-vangard-primary rounded-full animate-spin mb-3"></div>
            <span className="text-xs sm:text-sm font-bold">Loading Database...</span>
          </div>
        ) : scammers.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
            No verified scammers found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {scammers.map((scammer, index) => {
              const rank = (page - 1) * PAGE_SIZE + index + 1;
              
              // Extract the first available valid number
              let primaryContact = '';
              if (scammer.phone_numbers?.length > 0 && scammer.phone_numbers[0].toUpperCase() !== 'N/A') {
                primaryContact = scammer.phone_numbers[0];
              } else if (scammer.gcash_numbers?.length > 0 && scammer.gcash_numbers[0].toUpperCase() !== 'N/A') {
                primaryContact = scammer.gcash_numbers[0];
              }

              // Reformat +63 to 09
              if (primaryContact.startsWith('+63')) {
                primaryContact = '0' + primaryContact.substring(3);
              }

              // Format inline string: (09123456789) Scammer Name
              const displayName = primaryContact 
                ? `(${primaryContact}) ${scammer.primary_name}` 
                : scammer.primary_name;

              return (
                <div key={scammer.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl font-black text-sm sm:text-base border shadow-sm ${getRankColor(rank)}`}>
                    {rank === 1 ? <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> : `#${rank}`}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Changed font-black to font-medium to remove bold formatting */}
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                      {displayName}
                    </h3>
                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500" />
                      <span className="text-red-600 dark:text-red-400 font-bold">{scammer.verified_report_count}</span> verified flags
                    </div>
                  </div>

                  {/* Action */}
                  <Link
                    to={`/scammer/${scammer.id}`}
                    className="flex-shrink-0 bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs transition-transform hover:scale-105 shadow-md flex items-center gap-1.5"
                  >
                    <span className="hidden sm:inline">View Details</span>
                    <AlertOctagon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-vangard-card border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors flex items-center gap-1 sm:gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Previous</span>
          </button>
          
          <span className="text-[11px] sm:text-xs font-black text-gray-500 dark:text-gray-400">
            PAGE {page} OF {totalPages}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors flex items-center gap-1 sm:gap-2"
          >
            <span className="hidden sm:inline">Next</span> <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      )}
    </div>
  );
}