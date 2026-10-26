import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Check, X, Clock, ExternalLink, Database, Scale, Archive, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ModDashboard() {
  const [activeTab, setActiveTab] = useState<'pending' | 'scammers' | 'disputes'>('pending');
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
  }, []);

  useEffect(() => {
    if (isMod) {
      if (activeTab === 'pending') fetchPendingReports();
      if (activeTab === 'scammers') fetchScammers();
      if (activeTab === 'disputes') fetchDisputes();
    }
  }, [activeTab, isMod]);

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
    fetchPendingReports();
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

      if (orQuery.length > 0) {
        const { data: existingMatches } = await supabase.from('scammers').select('*').or(orQuery.join(',')).limit(1);
        if (existingMatches && existingMatches.length > 0) {
          scammerId = existingMatches[0].id;
          await supabase.from('scammers').update({
            verified_report_count: existingMatches[0].verified_report_count + 1,
            is_archived: false, // Unarchive if they scam again
            updated_at: new Date().toISOString()
          }).eq('id', scammerId);
        }
      }

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

  return (
    <div className="p-4 w-full max-w-6xl mx-auto mb-20 md:mb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-vangard-primary/20 p-3 rounded-xl border border-vangard-primary/30">
            <ShieldCheck className="w-8 h-8 text-vangard-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Moderator HQ</h1>
            <p className="text-gray-400 text-sm">Manage reports, records, and disputes.</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 mb-6 hide-scrollbar">
        <button onClick={() => setActiveTab('pending')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'pending' ? 'bg-vangard-card text-vangard-primary border border-vangard-primary/30' : 'bg-vangard-dark text-gray-500 hover:bg-gray-800 border border-gray-800'}`}>
          <Clock className="w-5 h-5" /> Pending Queue
        </button>
        <button onClick={() => setActiveTab('scammers')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'scammers' ? 'bg-vangard-card text-blue-400 border border-blue-400/30' : 'bg-vangard-dark text-gray-500 hover:bg-gray-800 border border-gray-800'}`}>
          <Database className="w-5 h-5" /> Verified Database
        </button>
        <button onClick={() => setActiveTab('disputes')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'disputes' ? 'bg-vangard-card text-yellow-400 border border-yellow-400/30' : 'bg-vangard-dark text-gray-500 hover:bg-gray-800 border border-gray-800'}`}>
          <Scale className="w-5 h-5" /> Active Disputes
        </button>
      </div>

      {loading && <div className="p-10 text-center text-gray-400">Loading data...</div>}

      {!loading && (
        <>
          {/* TAB 1: PENDING REPORTS */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="bg-vangard-card p-10 rounded-2xl border border-gray-800 text-center text-gray-500">No pending reports.</div>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="bg-vangard-card border border-gray-700 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold">{report.reported_name} <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 ml-2">{report.category}</span></h3>
                      <span className="text-xs text-gray-500">{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-300 grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p><span className="text-gray-500">Phone:</span> {report.phone_input || 'N/A'}</p>
                        <p><span className="text-gray-500">GCash:</span> {report.gcash_input || 'N/A'}</p>
                        <p><span className="text-gray-500">FB:</span> {report.facebook_input || 'N/A'}</p>
                      </div>
                      <div className="bg-vangard-dark p-3 rounded-xl border border-gray-800 h-24 overflow-y-auto">
                        <span className="text-gray-500 text-xs block mb-1">Description:</span>
                        {report.description}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveReport(report)} disabled={processingId === report.id} className="bg-green-600/20 text-green-500 px-4 py-2 rounded-lg font-bold flex-1">Approve</button>
                      <button onClick={() => handleRejectReport(report.id)} disabled={processingId === report.id} className="bg-red-600/20 text-red-500 px-4 py-2 rounded-lg font-bold flex-1">Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: VERIFIED SCAMMERS DATABASE */}
          {activeTab === 'scammers' && (
             <div className="bg-vangard-card rounded-2xl border border-gray-800 overflow-hidden overflow-x-auto shadow-lg">
               <table className="w-full text-left text-sm text-gray-300">
                 <thead className="bg-vangard-dark text-xs uppercase text-gray-500 border-b border-gray-800">
                   <tr>
                     <th className="px-6 py-4">Name</th>
                     <th className="px-6 py-4">Contact Info</th>
                     <th className="px-6 py-4 text-center">Flags</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-800">
                   {scammers.map(scammer => (
                     <tr key={scammer.id} className={`hover:bg-gray-800/30 transition-colors ${scammer.is_archived ? 'opacity-50' : ''}`}>
                       <td className="px-6 py-4 font-bold text-white whitespace-nowrap">{scammer.primary_name}</td>
                       <td className="px-6 py-4">
                         <div className="text-xs">
                           {scammer.phone_numbers.length > 0 && <div><span className="text-gray-500">Phone:</span> {scammer.phone_numbers[0]}</div>}
                           {scammer.gcash_numbers.length > 0 && <div><span className="text-gray-500">GCash:</span> {scammer.gcash_numbers[0]}</div>}
                         </div>
                       </td>
                       <td className="px-6 py-4 text-center">
                          <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded font-bold">{scammer.verified_report_count}</span>
                       </td>
                       <td className="px-6 py-4 text-center">
                         {scammer.is_archived 
                           ? <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-full text-xs">Archived</span>
                           : <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs">Active (Public)</span>
                         }
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => handleToggleArchive(scammer.id, scammer.is_archived, scammer.primary_name)}
                           disabled={processingId === scammer.id}
                           className="text-gray-400 hover:text-white bg-vangard-dark border border-gray-700 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                         >
                           <Archive className="w-4 h-4" /> {scammer.is_archived ? 'Restore' : 'Archive'}
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}

          {/* TAB 3: DISPUTES */}
          {activeTab === 'disputes' && (
             <div className="bg-vangard-card rounded-2xl border border-gray-800 overflow-hidden overflow-x-auto shadow-lg">
               <table className="w-full text-left text-sm text-gray-300">
                 <thead className="bg-vangard-dark text-xs uppercase text-gray-500 border-b border-gray-800">
                   <tr>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Disputed Record</th>
                     <th className="px-6 py-4">Contact Email</th>
                     <th className="px-6 py-4 min-w-[200px]">Reasoning</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-800">
                   {disputes.length === 0 ? (
                     <tr><td colSpan={6} className="text-center py-8 text-gray-500">No disputes active.</td></tr>
                   ) : (
                     disputes.map(dispute => (
                       <tr key={dispute.id} className="hover:bg-gray-800/30 transition-colors">
                         <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{new Date(dispute.created_at).toLocaleDateString()}</td>
                         <td className="px-6 py-4 font-bold text-white whitespace-nowrap">{dispute.scammers?.primary_name || 'Deleted Record'}</td>
                         <td className="px-6 py-4 text-blue-400">{dispute.contact_email}</td>
                         <td className="px-6 py-4 text-xs">{dispute.reason}</td>
                         <td className="px-6 py-4 text-center uppercase text-xs font-bold">
                            <span className={
                              dispute.status === 'pending' ? 'text-yellow-500' :
                              dispute.status === 'resolved' ? 'text-green-500' : 'text-gray-500'
                            }>{dispute.status}</span>
                         </td>
                         <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                           {dispute.status === 'pending' && (
                             <>
                               <button onClick={() => handleUpdateDispute(dispute.id, 'resolved')} className="text-green-500 hover:bg-green-500/10 px-3 py-1 rounded border border-green-500/20">Resolve</button>
                               <button onClick={() => handleUpdateDispute(dispute.id, 'rejected')} className="text-red-500 hover:bg-red-500/10 px-3 py-1 rounded border border-red-500/20">Reject</button>
                             </>
                           )}
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          )}
        </>
      )}
    </div>
  );
}