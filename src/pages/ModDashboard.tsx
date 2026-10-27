import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Archive, Trash2, Edit2, Plus, Mail, Ban, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModDashboardProps {
  tab: 'pending' | 'scammers' | 'disputes' | 'categories' | 'users';
}

export default function ModDashboard({ tab }: ModDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [isMod, setIsMod] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [reports, setReports] = useState<any[]>([]);
  const [scammers, setScammers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const [adminMessageModalOpen, setAdminMessageModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [adminMessageText, setAdminMessageText] = useState("");

  // Search states
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    checkAccessAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reset search when switching tabs
    setSearchInput('');
    setSearchQuery('');

    if (isMod) {
      if (tab === 'pending') fetchPendingReports();
      if (tab === 'scammers') fetchScammers();
      if (tab === 'disputes') fetchDisputes();
      if (tab === 'categories') fetchCategories();
      if (tab === 'users') fetchUsers();
    }
  }, [tab, isMod]);

  const checkAccessAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();

    if (!profile || (profile.role !== 'moderator' && profile.role !== 'admin')) {
      alert('Access Denied: Moderators only.');
      navigate('/');
      return;
    }

    setIsMod(true);
  };

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
    const { data } = await supabase.from('disputes').select('*, scammers(primary_name)').order('created_at', { ascending: false });
    setDisputes(data || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim().toLowerCase());
  };

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
            is_archived: false,
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

  const handleToggleArchive = async (scammerId: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? "UNARCHIVE" : "ARCHIVE (HIDE)";
    if (!confirm(`Are you sure you want to ${action} the record for ${name}?`)) return;

    setProcessingId(scammerId);
    await supabase.from('scammers').update({ is_archived: !currentStatus }).eq('id', scammerId);
    setScammers(scammers.map(s => s.id === scammerId ? { ...s, is_archived: !currentStatus } : s));
    setProcessingId(null);
  };

  const handleUpdateDispute = async (disputeId: string, newStatus: string) => {
    if (!confirm(`Mark this dispute as ${newStatus.toUpperCase()}?`)) return;
    setProcessingId(disputeId);
    try {
      const { data, error } = await supabase
        .from('disputes')
        .update({ status: newStatus })
        .eq('id', disputeId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update blocked by Database Security Policy.");

      setDisputes(disputes.map(d => d.id === disputeId ? { ...d, status: newStatus } : d));
    } catch (err: any) {
      alert("Error updating dispute: " + err.message);
    }
    setProcessingId(null);
  };

  const openAdminMessageModal = (dispute: any) => {
    setSelectedDispute(dispute);
    setAdminMessageText(`Hello,\n\nPlease email your full evidences to vangard-bns@gmail.com. Include any relevant screenshots, transaction receipts, or conversation logs as attachments.\n\nImportant: The subject of your email MUST be your contact mobile number.\n\nThank you,\nVANGARD Moderation Team`);
    setAdminMessageModalOpen(true);
    };

    const sendAdminMessage = async () => {
    if (!selectedDispute || !adminMessageText.trim()) return;
    setProcessingId(selectedDispute.id);
    try {
        const { error } = await supabase
        .from('disputes')
        .update({ status: 'awaiting_evidence', admin_message: adminMessageText })
        .eq('id', selectedDispute.id);

        if (error) throw error;

        setDisputes(disputes.map(d => d.id === selectedDispute.id ? { ...d, status: 'awaiting_evidence', admin_message: adminMessageText } : d));
        setAdminMessageModalOpen(false);
    } catch (err: any) {
        alert("Error: " + err.message);
    }
    setProcessingId(null);
    };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      const { data, error } = await supabase.from('categories').insert([{ name: newCategory.trim() }]).select().single();
      if (error) throw error;
      setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartEditCategory = (c: any) => {
    setEditingCategoryId(c.id);
    setEditCategoryName(c.name);
  };

  const handleSaveCategory = async (id: string) => {
    if (!editCategoryName.trim()) return;
    setProcessingId(id);
    try {
      const { error } = await supabase.from('categories').update({ name: editCategoryName.trim() }).eq('id', id);
      if (error) throw error;
      setCategories(categories.map(c => c.id === id ? { ...c, name: editCategoryName.trim() } : c).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingCategoryId(null);
    } catch (err: any) {
      alert(err.message);
    }
    setProcessingId(null);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;
    setProcessingId(id);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
    setProcessingId(null);
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'suspend' | 'restore') => {
    const actionText = action === 'ban' ? 'Archive/Ban' : action === 'suspend' ? 'Suspend for 7 Days' : 'Restore';
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) return;

    setProcessingId(userId);
    try {
      let updates: any = {};
      if (action === 'ban') {
        updates = { status: 'banned', suspended_until: null };
      } else if (action === 'suspend') {
        const suspendDate = new Date();
        suspendDate.setDate(suspendDate.getDate() + 7);
        updates = { status: 'suspended', suspended_until: suspendDate.toISOString() };
      } else if (action === 'restore') {
        updates = { status: 'active', suspended_until: null };
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
    } catch (err: any) {
      alert("Error updating user: " + err.message);
    }
    setProcessingId(null);
  };

  if (!isMod) return null;

  const tabTitles = {
    pending: "Pending Reports Queue",
    scammers: "Verified Public Database",
    disputes: "Active Disputes",
    categories: "Manage Categories",
    users: "User Management"
  };

  const filteredReports = reports.filter(r =>
    searchQuery === '' ||
    r.reported_name?.toLowerCase().includes(searchQuery) ||
    r.phone_input?.toLowerCase().includes(searchQuery) ||
    r.gcash_input?.toLowerCase().includes(searchQuery) ||
    r.description?.toLowerCase().includes(searchQuery) ||
    r.category?.toLowerCase().includes(searchQuery)
  );

  const filteredScammers = scammers.filter(s =>
    searchQuery === '' ||
    s.primary_name?.toLowerCase().includes(searchQuery) ||
    s.phone_numbers?.some((p: string) => p.toLowerCase().includes(searchQuery)) ||
    s.gcash_numbers?.some((g: string) => g.toLowerCase().includes(searchQuery)) ||
    s.facebook_links?.some((f: string) => f.toLowerCase().includes(searchQuery))
  );

  const filteredDisputes = disputes.filter(d =>
    searchQuery === '' ||
    d.scammers?.primary_name?.toLowerCase().includes(searchQuery) ||
    d.contact_email?.toLowerCase().includes(searchQuery) ||
    d.reason?.toLowerCase().includes(searchQuery)
  );

  const filteredCategories = categories.filter(c =>
    searchQuery === '' ||
    c.name?.toLowerCase().includes(searchQuery)
  );

  const filteredUsers = users.filter(u =>
    searchQuery === '' ||
    u.id?.toLowerCase().includes(searchQuery) ||
    u.email?.toLowerCase().includes(searchQuery) ||
    u.role?.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="w-full mx-auto max-w-6xl animate-in fade-in duration-500">

      {/* Header - Adjusted font sizes */}
      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="bg-red-50 dark:bg-vangard-primary/10 p-2.5 rounded-xl border border-red-100 dark:border-vangard-primary/20 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-vangard-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">Moderator HQ</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
            Viewing: <span className="text-vangard-primary">{tabTitles[tab]}</span>
          </p>
        </div>
      </div>

      {!loading && (
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <form onSubmit={handleSearchSubmit} className="w-full sm:max-w-md relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Search ${tabTitles[tab].toLowerCase()}...`}
              className="w-full pl-11 pr-24 py-2.5 bg-white dark:bg-vangard-card border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-sm text-gray-900 dark:text-white shadow-sm"
            />
            <button
              type="submit"
              className="absolute inset-y-1.5 right-1.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-xs transition-colors shadow-sm"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {loading && (
        <div className="p-20 flex flex-col items-center justify-center text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-vangard-primary rounded-full animate-spin mb-4"></div>
          <span className="text-sm">Loading secure data...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* Pending Tab */}
          {tab === 'pending' && (
             <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                   <thead className="bg-gray-50 dark:bg-vangard-dark text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                     <tr>
                       <th className="px-6 py-4 font-normal">Date / Target</th>
                       <th className="px-6 py-4 font-normal">Contact Details</th>
                       <th className="px-6 py-4 font-normal min-w-[300px]">Incident Description</th>
                       <th className="px-6 py-4 font-normal text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {filteredReports.length === 0 ? (
                       <tr><td colSpan={4} className="text-center py-10 text-gray-500 text-sm">No pending reports found matching "{searchQuery}".</td></tr>
                     ) : (
                       filteredReports.map(report => (
                         <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                           <td className="px-6 py-4">
                             <div className="text-[10px] text-gray-400 mb-1">{new Date(report.created_at).toLocaleDateString()}</div>
                             <div className="text-gray-900 dark:text-white text-sm mb-1.5">{report.reported_name}</div>
                             <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                               {report.category}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-xs">
                             <div className="space-y-1.5">
                               {report.phone_input && report.phone_input !== 'N/A' && <div><span className="text-gray-400">Phone:</span> <span className="text-gray-900 dark:text-gray-200">{report.phone_input}</span></div>}
                               {report.gcash_input && report.gcash_input !== 'N/A' && <div><span className="text-gray-400">GCash:</span> <span className="text-gray-900 dark:text-gray-200">{report.gcash_input}</span></div>}
                               {report.facebook_input && report.facebook_input !== 'N/A' && <div><span className="text-gray-400">FB:</span> <a href={report.facebook_input} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Profile</a></div>}
                             </div>
                           </td>
                           <td className="px-6 py-4">
                             <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-vangard-dark p-3 rounded-xl border border-gray-100 dark:border-gray-800 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                               {report.description}
                             </div>
                           </td>
                           <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap align-top pt-6">
                             <button onClick={() => handleApproveReport(report)} disabled={processingId === report.id} className="text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs inline-flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5"/> Verify</button>
                             <button onClick={() => handleRejectReport(report.id)} disabled={processingId === report.id} className="text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs inline-flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5"/> Reject</button>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {/* Database Tab */}
          {tab === 'scammers' && (
             <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                   <thead className="bg-gray-50 dark:bg-vangard-dark text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                     <tr>
                       <th className="px-6 py-4 font-normal">Name</th>
                       <th className="px-6 py-4 font-normal">Contact Info</th>
                       <th className="px-6 py-4 font-normal text-center">Flags</th>
                       <th className="px-6 py-4 font-normal text-center">Status</th>
                       <th className="px-6 py-4 font-normal text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {filteredScammers.length === 0 ? (
                       <tr><td colSpan={5} className="text-center py-10 text-gray-500 text-sm">No verified scammers found matching "{searchQuery}".</td></tr>
                     ) : (
                       filteredScammers.map(scammer => (
                         <tr key={scammer.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${scammer.is_archived ? 'opacity-50' : ''}`}>
                           <td className="px-6 py-4 text-gray-900 dark:text-white whitespace-nowrap text-sm">{scammer.primary_name}</td>
                           <td className="px-6 py-4">
                             <div className="text-xs space-y-1">
                               {scammer.phone_numbers.length > 0 && <div><span className="text-gray-400">Phone:</span> <span className="text-gray-900 dark:text-gray-200">{scammer.phone_numbers[0]}</span></div>}
                               {scammer.gcash_numbers.length > 0 && <div><span className="text-gray-400">GCash:</span> <span className="text-gray-900 dark:text-gray-200">{scammer.gcash_numbers[0]}</span></div>}
                             </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 px-2 py-1 rounded text-xs border border-red-100 dark:border-red-900/30">
                                {scammer.verified_report_count}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                             {scammer.is_archived
                               ? <span className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 px-2 py-1 rounded text-[10px]">Archived</span>
                               : <span className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 px-2 py-1 rounded text-[10px]">Active</span>
                             }
                           </td>
                           <td className="px-6 py-4 text-right">
                             <button
                               onClick={() => handleToggleArchive(scammer.id, scammer.is_archived, scammer.primary_name)}
                               disabled={processingId === scammer.id}
                               className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-vangard-dark border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
                             >
                               <Archive className="w-3.5 h-3.5" /> {scammer.is_archived ? 'Restore' : 'Archive'}
                             </button>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {/* Disputes Tab */}
          {tab === 'disputes' && (
             <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                   <thead className="bg-gray-50 dark:bg-vangard-dark text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                     <tr>
                       <th className="px-6 py-4 font-normal">Date</th>
                       <th className="px-6 py-4 font-normal">Target Record</th>
                       <th className="px-6 py-4 font-normal">Contact Email</th>
                       <th className="px-6 py-4 font-normal min-w-[200px]">Reasoning</th>
                       <th className="px-6 py-4 font-normal text-center">Status</th>
                       <th className="px-6 py-4 font-normal text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {filteredDisputes.length === 0 ? (
                       <tr><td colSpan={6} className="text-center py-10 text-gray-500 text-sm">No active disputes found matching "{searchQuery}".</td></tr>
                     ) : (
                       filteredDisputes.map(dispute => (
                         <tr key={dispute.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                           <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-500">{new Date(dispute.created_at).toLocaleDateString()}</td>
                           <td className="px-6 py-4 text-gray-900 dark:text-white whitespace-nowrap text-sm">{dispute.scammers?.primary_name || 'Deleted Record'}</td>
                           <td className="px-6 py-4 text-blue-600 dark:text-blue-400 text-xs">{dispute.contact_email}</td>
                           <td className="px-6 py-4 text-xs">{dispute.reason}</td>
                           <td className="px-6 py-4 text-center text-[10px]">
                              <span className={`px-2 py-1 rounded ${
                                dispute.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500' :
                                dispute.status === 'awaiting_evidence' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500' :
                                dispute.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                              }`}>{dispute.status.replace('_', ' ')}</span>
                           </td>
                           <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                             {(dispute.status === 'pending' || dispute.status === 'awaiting_evidence') && (
                               <>
                                 <button onClick={() => openAdminMessageModal(dispute)} disabled={processingId === dispute.id} className="text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs inline-flex items-center gap-1"><Mail className="w-3 h-3"/> Ask Evidence</button>
                                 <button onClick={() => handleUpdateDispute(dispute.id, 'resolved')} disabled={processingId === dispute.id} className="text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs">Resolve</button>
                                 <button onClick={() => handleUpdateDispute(dispute.id, 'rejected')} disabled={processingId === dispute.id} className="text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs">Reject</button>
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

          {/* Categories Tab */}
          {tab === 'categories' && (
            <div className="max-w-3xl">
              <form onSubmit={handleAddCategory} className="mb-6 flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter new category name..."
                  className="flex-1 p-3 bg-white dark:bg-vangard-card border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none text-sm text-gray-900 dark:text-white shadow-sm transition-all"
                />
                <button
                  type="submit"
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl text-sm flex justify-center items-center gap-2 shadow-sm transition-transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </form>

              <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-vangard-dark text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-normal">Category Name</th>
                      <th className="px-6 py-4 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredCategories.length === 0 ? (
                       <tr><td colSpan={2} className="text-center py-10 text-gray-500 text-sm">No categories exist matching "{searchQuery}".</td></tr>
                    ) : (
                      filteredCategories.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {editingCategoryId === c.id ? (
                              <input 
                                autoFocus
                                type="text"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none"
                              />
                            ) : (
                              c.name
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {editingCategoryId === c.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveCategory(c.id)}
                                  disabled={processingId === c.id}
                                  className="text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 px-3 py-1.5 rounded-lg text-xs transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCategoryId(null)}
                                  disabled={processingId === c.id}
                                  className="text-gray-600 bg-gray-50 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEditCategory(c)}
                                  disabled={processingId === c.id}
                                  className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 p-2 rounded-lg transition-colors inline-flex items-center"
                                  title="Edit Category"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(c.id, c.name)}
                                  disabled={processingId === c.id}
                                  className="text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 p-2 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center shadow-sm"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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

          {/* Users Tab */}
          {tab === 'users' && (
             <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                   <thead className="bg-gray-50 dark:bg-vangard-dark text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                     <tr>
                       <th className="px-6 py-4 font-normal">User Details</th>
                       <th className="px-6 py-4 font-normal">Joined</th>
                       <th className="px-6 py-4 font-normal">Role</th>
                       <th className="px-6 py-4 font-normal text-center">Status</th>
                       <th className="px-6 py-4 font-normal text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {filteredUsers.length === 0 ? (
                       <tr><td colSpan={5} className="text-center py-10 text-gray-500 text-sm">No users found matching "{searchQuery}".</td></tr>
                     ) : (
                       filteredUsers.map(user => (
                         <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${user.status !== 'active' ? 'opacity-70' : ''}`}>
                           <td className="px-6 py-4 text-xs">
                             <div className="text-gray-900 dark:text-white text-sm mb-0.5">{user.email || 'Email not available'}</div>
                             <div className="text-gray-400 text-[10px] truncate max-w-[200px]">{user.id}</div>
                           </td>
                           <td className="px-6 py-4 text-xs text-gray-500">
                             {new Date(user.created_at).toLocaleDateString()}
                           </td>
                           <td className="px-6 py-4 text-[10px]">{user.role}</td>
                           <td className="px-6 py-4 text-center">
                             {user.status === 'banned' ? (
                               <span className="bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500 px-2 py-1 rounded text-[10px]">Banned</span>
                             ) : user.status === 'suspended' ? (
                               <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500 px-2 py-1 rounded text-[10px] block">
                                 Suspended<br/><span className="text-[8px]">Until {new Date(user.suspended_until).toLocaleDateString()}</span>
                               </span>
                             ) : (
                               <span className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500 px-2 py-1 rounded text-[10px]">Active</span>
                             )}
                           </td>
                           <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                             {user.role !== 'admin' && (
                               user.status === 'active' ? (
                                 <>
                                   <button onClick={() => handleUserAction(user.id, 'suspend')} disabled={processingId === user.id} className="text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs inline-flex items-center gap-1"><Clock className="w-3 h-3"/> Suspend (7d)</button>
                                   <button onClick={() => handleUserAction(user.id, 'ban')} disabled={processingId === user.id} className="text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs inline-flex items-center gap-1"><Ban className="w-3 h-3"/> Ban</button>
                                 </>
                               ) : (
                                 <button onClick={() => handleUserAction(user.id, 'restore')} disabled={processingId === user.id} className="text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs">Restore</button>
                               )
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

      {adminMessageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white dark:bg-vangard-card w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 relative">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Request Evidence</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Edit the message that will be sent to the user's dashboard.</p>
            
            <textarea 
                value={adminMessageText} 
                onChange={(e) => setAdminMessageText(e.target.value)} 
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium h-48 resize-none mb-4" 
            />
            
            <div className="flex gap-3">
                <button onClick={() => setAdminMessageModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl transition-colors">Cancel</button>
                <button onClick={sendAdminMessage} disabled={processingId === selectedDispute?.id} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-md">
                {processingId === selectedDispute?.id ? 'Sending...' : 'Send Message'}
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
}