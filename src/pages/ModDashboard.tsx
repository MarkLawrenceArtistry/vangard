import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModDashboardProps {
  tab: 'pending' | 'scammers' | 'disputes';
}

export default function ModDashboard({ tab }: ModDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [isMod, setIsMod] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Data States
  const [reports, setReports] = useState<any[]>([]);
  const [scammers, setScammers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAccessAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isMod) {
      if (tab === 'pending') fetchPendingReports();
      if (tab === 'scammers') fetchScammers();
      if (tab === 'disputes') fetchDisputes();
    }
  }, [tab, isMod]);

  const checkAccessAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();

    if (!profile || (profile.role !== 'moderator' && profile.role !== 'admin')) {
      alert('Access Denied: Moderators only.');
      navigate('/');
      return;
    }

    setIsMod(true);
  };

  // --- FETCHERS ---
  const fetchPendingReports = async () => {
    setLoading(true);
    const { data } = await supabase.from('reports').select('*').eq('status', 'pending').order('created_at', { ascending: true });
    setReports(data || []);
    setLoading(false);
  };

  const fetchScammers = async () => {
    setLoading(true);
    const { data } = await supabase.from('scammers').select('*').order('created_at', { ascending: false });
    setScammers(data || []);
    setLoading(false);
  };

  const fetchDisputes = async () => {
    setLoading(true);
    // Join with scammers table to get the primary_name
    const { data } = await supabase.from('disputes').select('*, scammers(primary_name)').order('created_at', { ascending: false });
    setDisputes(data || []);
    setLoading(false);
  };

  // --- ACTIONS ---
  
  // 1. REPORT ACTIONS
  const handleRejectReport = async (reportId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    setProcessingId(reportId);
    await supabase.from('reports').update({ status: 'rejected', moderator_notes: reason }).eq('id', reportId);
    setReports(reports.filter(r => r.id !== reportId));
    setProcessingId(null);
  };

  const handleApproveReport = async (report: any) => {
    if (!confirm(`Approve report against ${report.reported_name}?`)) return;
    setProcessingId(report.id);
    try {
      const normalizeInput = (input: string | null) => {
        if (!input) return null;
        let cleaned = input.replace(/[\s\-\(\)]/g, '');
        if (cleaned.startsWith('09') && cleaned.length === 11) cleaned = '+63' + cleaned.substring(1);
        return cleaned.toLowerCase();
      };

      const cleanPhone = normalizeInput(report.phone_input);
      const cleanGcash = normalizeInput(report.gcash_input);
      const cleanFacebook = report.facebook_input ? report.facebook_input.trim() : null;

      let orQuery = [];
      if (cleanPhone) orQuery.push(`phone_numbers.cs.{${cleanPhone}}`);
      if (cleanGcash) orQuery.push(`gcash_numbers.cs.{${cleanGcash}}`);
      if (cleanFacebook) orQuery.push(`facebook_links.cs.{${cleanFacebook}}`);

      let scammerId;

      // Check if scammer already exists
      if (orQuery.length > 0) {
        const { data: existingMatches } = await supabase.from('scammers').select('*').or(orQuery.join(',')).limit(1);
        if (existingMatches && existingMatches.length > 0) {
          scammerId = existingMatches[0].id;
          // Increment verified reports and unarchive if previously archived
          await supabase.from('scammers').update({
            verified_report_count: existingMatches[0].verified_report_count + 1,
            is_archived: false, 
            updated_at: new Date().toISOString()
          }).eq('id', scammerId);
        }
      }

      // If new scammer, insert record
      if (!scammerId) {
        const { data: newScammer } = await supabase.from('scammers').insert({
          primary_name: report.reported_name,
          phone_numbers: cleanPhone ? [cleanPhone] : [],
          gcash_numbers: cleanGcash ? [cleanGcash] : [],
          facebook_links: cleanFacebook ? [cleanFacebook] : [],
          verified_report_count: 1
        }).select().single();
        scammerId = newScammer?.id;
      }

      // Mark report as approved and link to scammer DB entry
      await supabase.from('reports').update({ status: 'approved', scammer_id: scammerId }).eq('id', report.id);
      setReports(reports.filter(r => r.id !== report.id));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setProcessingId(null);
  };

  // 2. SCAMMER ACTIONS (ARCHIVE)
  const handleToggleArchive = async (scammerId: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? "UNARCHIVE" : "ARCHIVE (HIDE)";
    if (!confirm(`Are you sure you want to ${action} the record for ${name}?`)) return;
    
    setProcessingId(scammerId);
    await supabase.from('scammers').update({ is_archived: !currentStatus }).eq('id', scammerId);
    setScammers(scammers.map(s => s.id === scammerId ? { ...s, is_archived: !currentStatus } : s));
    setProcessingId(null);
  };

  // 3. DISPUTE ACTIONS
  const handleUpdateDispute = async (disputeId: string, newStatus: string) => {
    if (!confirm(`Mark this dispute as ${newStatus.toUpperCase()}?`)) return;
    setProcessingId(disputeId);
    await supabase.from('disputes').update({ status: newStatus }).eq('id', disputeId);
    setDisputes(disputes.map(d => d.id === disputeId ? { ...d, status: newStatus } : d));
    setProcessingId(null);
  };

  if (!isMod) return null;

  const tabTitles = {
    pending: "Pending Reports Queue",
    scammers: "Verified Public Database",
    disputes: "Active Disputes"
  };

  return (
    <div className="w-full mx-auto max-w-6xl animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="bg-red-50 dark:bg-vangard-primary/10 p-3.5 rounded-2xl border border-red-100 dark:border-vangard-primary/20 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-vangard-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Moderator HQ</h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1 uppercase tracking-wider">
            Viewing: <span className="text-vangard-primary">{tabTitles[tab]}</span>
          </p>
        </div>
      </div>

      {loading && (
        <div className="p-20 flex flex-col items-center justify-center text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-vangard-primary rounded-full animate-spin mb-4"></div>
          <span className="font-bold animate-pulse">Loading secure data...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* TAB 1: PENDING REPORTS */}
          {tab === 'pending' && (
            <div className="space-y-6">
              {reports.length === 0 ? (
                <div className="bg-white dark:bg-vangard-card p-12 rounded-3xl border border-gray-200 dark:border-gray-800 text-center shadow-sm">
                  <h3 className="text-xl font-black text-gray-900 dark:text-gray-300">Queue is empty</h3>
                  <p className="text-gray-500 font-medium mt-2">No pending reports to review at this time.</p>
                </div>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="bg-white dark:bg-vangard-card border border-gray-200 dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                          {report.reported_name} 
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md text-gray-600 dark:text-gray-300 font-bold tracking-wide uppercase">
                            {report.category}
                          </span>
                        </h3>
                      </div>
                      <span className="text-sm font-bold text-gray-400">{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-3 text-sm font-medium">
                        <div className="bg-gray-50 dark:bg-vangard-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Phone Number</p>
                          <p className="text-gray-900 dark:text-gray-200">{report.phone_input || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-vangard-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">GCash Number</p>
                          <p className="text-gray-900 dark:text-gray-200">{report.gcash_input || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-vangard-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Facebook Link</p>
                          <p className="text-blue-600 dark:text-blue-400 break-all">{report.facebook_input || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-vangard-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-800 h-full max-h-64 overflow-y-auto">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase block mb-2">Incident Description:</span>
                        <p className="text-gray-800 dark:text-gray-300 text-sm leading-relaxed">{report.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <button 
                        onClick={() => handleApproveReport(report)} 
                        disabled={processingId === report.id} 
                        className="bg-green-100 text-green-700 dark:bg-green-600/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-600/30 px-6 py-3.5 rounded-xl font-black flex-1 transition-colors"
                      >
                        Approve & Verify
                      </button>
                      <button 
                        onClick={() => handleRejectReport(report.id)} 
                        disabled={processingId === report.id} 
                        className="bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-600/30 px-6 py-3.5 rounded-xl font-black flex-1 transition-colors"
                      >
                        Reject Report
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: VERIFIED SCAMMERS DATABASE */}
          {tab === 'scammers' && (
             <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                   <thead className="bg-gray-50 dark:bg-vangard-dark text-xs uppercase font-black text-gray-500 border-b border-gray-200 dark:border-gray-800 tracking-wider">
                     <tr>
                       <th className="px-6 py-5">Name</th>
                       <th className="px-6 py-5">Contact Info</th>
                       <th className="px-6 py-5 text-center">Flags</th>
                       <th className="px-6 py-5 text-center">Status</th>
                       <th className="px-6 py-5 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {scammers.map(scammer => (
                       <tr key={scammer.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${scammer.is_archived ? 'opacity-50' : ''}`}>
                         <td className="px-6 py-5 font-black text-gray-900 dark:text-white whitespace-nowrap text-base">{scammer.primary_name}</td>
                         <td className="px-6 py-5">
                           <div className="text-sm font-medium space-y-1">
                             {scammer.phone_numbers.length > 0 && <div><span className="text-gray-400">Phone:</span> <span className="text-gray-900 dark:text-gray-200">{scammer.phone_numbers[0]}</span></div>}
                             {scammer.gcash_numbers.length > 0 && <div><span className="text-gray-400">GCash:</span> <span className="text-gray-900 dark:text-gray-200">{scammer.gcash_numbers[0]}</span></div>}
                           </div>
                         </td>
                         <td className="px-6 py-5 text-center">
                            <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 px-3 py-1.5 rounded-lg font-black border border-red-100 dark:border-red-900/30">
                              {scammer.verified_report_count}
                            </span>
                         </td>
                         <td className="px-6 py-5 text-center">
                           {scammer.is_archived 
                             ? <span className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 px-3 py-1.5 rounded-full text-xs font-bold">Archived</span>
                             : <span className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 px-3 py-1.5 rounded-full text-xs font-bold">Active</span>
                           }
                         </td>
                         <td className="px-6 py-5 text-right">
                           <button 
                             onClick={() => handleToggleArchive(scammer.id, scammer.is_archived, scammer.primary_name)}
                             disabled={processingId === scammer.id}
                             className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-vangard-dark border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl font-bold transition-colors inline-flex items-center gap-2 text-xs"
                           >
                             <Archive className="w-4 h-4" /> {scammer.is_archived ? 'Restore' : 'Archive'}
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {/* TAB 3: DISPUTES */}
          {tab === 'disputes' && (
             <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                   <thead className="bg-gray-50 dark:bg-vangard-dark text-xs uppercase font-black text-gray-500 border-b border-gray-200 dark:border-gray-800 tracking-wider">
                     <tr>
                       <th className="px-6 py-5">Date</th>
                       <th className="px-6 py-5">Target Record</th>
                       <th className="px-6 py-5">Contact Email</th>
                       <th className="px-6 py-5 min-w-[250px]">Reasoning</th>
                       <th className="px-6 py-5 text-center">Status</th>
                       <th className="px-6 py-5 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {disputes.length === 0 ? (
                       <tr><td colSpan={6} className="text-center py-12 text-gray-500 font-bold">No active disputes found.</td></tr>
                     ) : (
                       disputes.map(dispute => (
                         <tr key={dispute.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                           <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-gray-500">{new Date(dispute.created_at).toLocaleDateString()}</td>
                           <td className="px-6 py-5 font-black text-gray-900 dark:text-white whitespace-nowrap">{dispute.scammers?.primary_name || 'Deleted Record'}</td>
                           <td className="px-6 py-5 text-blue-600 dark:text-blue-400 font-medium">{dispute.contact_email}</td>
                           <td className="px-6 py-5 text-sm font-medium">{dispute.reason}</td>
                           <td className="px-6 py-5 text-center uppercase text-xs font-black">
                              <span className={
                                dispute.status === 'pending' ? 'text-yellow-600 dark:text-yellow-500' :
                                dispute.status === 'resolved' ? 'text-green-600 dark:text-green-500' : 'text-gray-500'
                              }>{dispute.status}</span>
                           </td>
                           <td className="px-6 py-5 text-right space-x-2 whitespace-nowrap">
                             {dispute.status === 'pending' && (
                               <>
                                 <button onClick={() => handleUpdateDispute(dispute.id, 'resolved')} className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20 px-4 py-2 rounded-xl font-bold transition-colors">Resolve</button>
                                 <button onClick={() => handleUpdateDispute(dispute.id, 'rejected')} className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-4 py-2 rounded-xl font-bold transition-colors">Reject</button>
                               </>
                             )}
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
          )}
        </>
      )}
    </div>
  );
}