import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ShieldCheck, Archive, Trash2, Edit2, Plus, Mail, Ban, 
  Clock, CheckCircle, XCircle, Search, Eye, X, 
  ChevronUp, ChevronDown, ChevronsUpDown, ArrowLeft, ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModDashboardProps {
  tab: 'pending' | 'scammers' | 'disputes' | 'categories' | 'users';
}

export default function ModDashboard({ tab }: ModDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [isMod, setIsMod] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Data states
  const [reports, setReports] = useState<any[]>([]);
  const [scammers, setScammers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Form & Edit states
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Modal states
  const [adminMessageModalOpen, setAdminMessageModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [adminMessageText, setAdminMessageText] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Search states
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    checkAccessAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reset search, pagination, and sorting when switching tabs
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
    setSortConfig(null);

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
    setCurrentPage(1); // Reset page on new search
  };

  // ---------------------------------
  // Sorting & Pagination Logic
  // ---------------------------------
  const sortData = (data: any[]) => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
       let aValue = sortConfig.key.split('.').reduce((o, i) => (o ? o[i] : null), a);
       let bValue = sortConfig.key.split('.').reduce((o, i) => (o ? o[i] : null), b);

       if (typeof aValue === 'string') aValue = aValue.toLowerCase();
       if (typeof bValue === 'string') bValue = bValue.toLowerCase();

       if (aValue === null || aValue === undefined) return 1;
       if (bValue === null || bValue === undefined) return -1;

       if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
       if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
       return 0;
    });
  };

  const getPaginated = (filtered: any[]) => {
    const sorted = sortData(filtered);
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  };

  const SortableHeader = ({ label, sortKey, align = 'left' }: { label: string, sortKey: string, align?: 'left'|'center'|'right' }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th 
        className={`px-6 py-4 font-normal cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors text-${align} select-none`}
        onClick={() => {
          let direction: 'asc' | 'desc' = 'asc';
          if (isActive && sortConfig.direction === 'asc') direction = 'desc';
          setSortConfig({ key: sortKey, direction });
        }}
      >
        <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          {label}
          {isActive ? (
            sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-vangard-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-vangard-primary" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
          )}
        </div>
      </th>
    );
  };

  const PaginationUI = ({ totalItems }: { totalItems: number }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-vangard-dark">
         <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 transition-colors flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5"/> Prev</button>
         <span className="text-xs font-bold text-gray-500">Page {currentPage} of {totalPages}</span>
         <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 transition-colors flex items-center gap-1">Next <ArrowRight className="w-3.5 h-3.5"/></button>
      </div>
    );
  };
  // ---------------------------------

  const handleRejectReport = async (reportId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    setProcessingId(reportId);
    try {
      await supabase.from('reports').update({ status: 'rejected', moderator_notes: reason }).eq('id', reportId);
      setReports(reports.filter(r => r.id !== reportId));
    } catch (err: any) {
      alert("Error rejecting report: " + err.message);
    } finally {
      setProcessingId(null);
    }
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
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleArchive = async (scammerId: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? "UNARCHIVE" : "ARCHIVE (HIDE)";
    if (!confirm(`Are you sure you want to ${action} the record for ${name}?`)) return;
    setProcessingId(scammerId);
    try {
      await supabase.from('scammers').update({ is_archived: !currentStatus }).eq('id', scammerId);
      setScammers(scammers.map(s => s.id === scammerId ? { ...s, is_archived: !currentStatus } : s));
    } catch (err: any) {
      alert("Error updating record: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateDispute = async (disputeId: string, newStatus: string) => {
    if (!confirm(`Mark this dispute as ${newStatus.toUpperCase()}?`)) return;
    setProcessingId(disputeId);
    try {
      const { error } = await supabase.from('disputes').update({ status: newStatus }).eq('id', disputeId).select();
      if (error) throw error;
      setDisputes(disputes.map(d => d.id === disputeId ? { ...d, status: newStatus } : d));
    } catch (err: any) {
      alert("Error updating dispute: " + err.message);
    } finally {
      setProcessingId(null);
    }
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
        const { error } = await supabase.from('disputes').update({ status: 'awaiting_evidence', admin_message: adminMessageText }).eq('id', selectedDispute.id);
        if (error) throw error;
        setDisputes(disputes.map(d => d.id === selectedDispute.id ? { ...d, status: 'awaiting_evidence', admin_message: adminMessageText } : d));
        setAdminMessageModalOpen(false);
    } catch (err: any) {
        alert("Error: " + err.message);
    } finally {
        setProcessingId(null);
    }
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
    } finally {
      setProcessingId(null);
    }
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
    } finally {
      setProcessingId(null);
    }
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'suspend' | 'restore') => {
    const actionText = action === 'ban' ? 'Archive/Ban' : action === 'suspend' ? 'Suspend for 7 Days' : 'Restore';
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) return;
    setProcessingId(userId);
    try {
      let updates: any = {};
      if (action === 'ban') updates = { status: 'banned', suspended_until: null };
      else if (action === 'suspend') {
        const suspendDate = new Date();
        suspendDate.setDate(suspendDate.getDate() + 7);
        updates = { status: 'suspended', suspended_until: suspendDate.toISOString() };
      } else if (action === 'restore') updates = { status: 'active', suspended_until: null };

      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
    } catch (err: any) {
      alert("Error updating user: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isMod) return null;

  const tabTitles = {
    pending: "Pending Reports Queue",
    scammers: "Verified Public Database",
    disputes: "Active Disputes",
    categories: "Manage Categories",
    users: "User Management"
  };

  // ---------------------------------
  // Filter logic for each tab
  // ---------------------------------
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
    u.display_name?.toLowerCase().includes(searchQuery) || 
    u.role?.toLowerCase().includes(searchQuery)
  );

  // Get current page slices
  const processedReports = getPaginated(filteredReports);
  const processedScammers = getPaginated(filteredScammers);
  const processedDisputes = getPaginated(filteredDisputes);
  const processedCategories = getPaginated(filteredCategories);
  const processedUsers = getPaginated(filteredUsers);

  return (
    <div className="w-full mx-auto max-w-6xl animate-in fade-in duration-500">
      
      {/* Header */}
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

      {/* Global Search Bar (Hidden during loading) */}
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
            <button type="submit" className="absolute inset-y-1.5 right-1.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-xs transition-colors shadow-sm">
              Search
            </button>
          </form>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="p-20 flex flex-col items-center justify-center text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-vangard-primary rounded-full animate-spin mb-4"></div>
          <span className="text-sm">Loading secure data...</span>
        </div>
      )}

      {/* Main Content Area */}
      {!loading && (
        <>
          {/* PENDING REPORTS TAB */}
          {tab === 'pending' && (
             <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                   <thead className="bg-gray-50 dark:bg-vangard-dark text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                     <tr>
                       <SortableHeader label="Date / Target" sortKey="created_at" />
                       <th className="px-6 py-4 font-normal">Contact Details</th>
                       <th className="px-6 py-4 font-normal min-w-75">Incident Description</th>
                       <th className="px-6 py-4 font-normal text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {processedReports.length === 0 ? (
                       <tr><td colSpan={4} className="text-center py-10 text-gray-500 text-sm">No pending reports found matching "{searchQuery}".</td></tr>
                     ) : (
                       processedReports.map(report => (
                         <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                           <td className="px-6 py-4">
                             <div className="text-[10px] text-gray-400 mb-1">{new Date(report.created_at).toLocaleDateString()}</div>
                             <div className="text-gray-900 dark:text-white text-sm font-bold mb-1.5">{report.reported_name}</div>
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
                             <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-vangard-dark p-3 rounded-xl border border-gray-100 dark:border-gray-800 line-clamp-2">
                               {report.description}
                             </div>
                           </td>
                           <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap align-top pt-6">
                             <button onClick={() => setSelectedReport(report)} className="text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors text-xs inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/> View</button>
                             <button onClick={() => handleApproveReport(report)} disabled={processingId === report.id} className="text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs inline-flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5"/> Verify</button>
                             <button onClick={() => handleRejectReport(report.id)} disabled={processingId === report.id} className="text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs inline-flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5"/> Reject</button>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
               <PaginationUI totalItems={filteredReports.length} />
             </div>
          )}

          {/* VERIFIED SCAMMERS TAB */}
          {tab === 'scammers' && (
             <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                   <thead className="bg-gray-50 dark:bg-vangard-dark text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                     <tr>
                       <SortableHeader label="Name" sortKey="primary_name" />
                       <th className="px-6 py-4 font-normal">Contact Info</th>
                       <SortableHeader label="Flags" sortKey="verified_report_count" align="center" />
                       <SortableHeader label="Status" sortKey="is_archived" align="center" />
                       <th className="px-6 py-4 font-normal text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {processedScammers.length === 0 ? (
                       <tr><td colSpan={5} className="text-center py-10 text-gray-500 text-sm">No verified scammers found matching "{searchQuery}".</td></tr>
                     ) : (
                       processedScammers.map(scammer => (
                         <tr key={scammer.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${scammer.is_archived ? 'opacity-50' : ''}`}>
                           <td className="px-6 py-4 text-gray-900 dark:text-white font-bold whitespace-nowrap text-sm">{scammer.primary_name}</td>
                           <td className="px-6 py-4">
                             <div className="text-xs space-y-1">
                               {scammer.phone_numbers.length > 0 && <div><span className="text-gray-400">Phone:</span> <span className="text-gray-900 dark:text-gray-200">{scammer.phone_numbers[0]}</span></div>}
                               {scammer.gcash_numbers.length > 0 && <div><span className="text-gray-400">GCash:</span> <span className="text-gray-900 dark:text-gray-200">{scammer.gcash_numbers[0]}</span></div>}
                             </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 px-2 py-1 rounded text-xs border border-red-100 dark:border-red-900/30 font-bold">
                                {scammer.verified_report_count}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                             {scammer.is_archived
                               ? <span className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 px-2 py-1 rounded text-[10px] font-bold">Archived</span>
                               : <span className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 px-2 py-1 rounded text-[10px] font-bold">Active</span>
                             }
                           </td>
                           <td className="px-6 py-4 text-right">
                             <button
                               onClick={() => handleToggleArchive(scammer.id, scammer.is_archived, scammer.primary_name)}
                               disabled={processingId === scammer.id}
                               className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-vangard-dark border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs disabled:opacity-50 font-medium"
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
               <PaginationUI totalItems={filteredScammers.length} />
             </div>
          )}

          {/* DISPUTES TAB */}
          {tab === 'disputes' && (
             <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                   <thead className="bg-gray-50 dark:bg-vangard-dark text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                     <tr>
                       <SortableHeader label="Date" sortKey="created_at" />
                       <SortableHeader label="Target Record" sortKey="scammers.primary_name" />
                       <th className="px-6 py-4 font-normal">Contact Email</th>
                       <th className="px-6 py-4 font-normal min-w-50">Reasoning</th>
                       <SortableHeader label="Status" sortKey="status" align="center" />
                       <th className="px-6 py-4 font-normal text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {processedDisputes.length === 0 ? (
                       <tr><td colSpan={6} className="text-center py-10 text-gray-500 text-sm">No active disputes found matching "{searchQuery}".</td></tr>
                     ) : (
                       processedDisputes.map(dispute => (
                         <tr key={dispute.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                           <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-500">{new Date(dispute.created_at).toLocaleDateString()}</td>
                           <td className="px-6 py-4 text-gray-900 dark:text-white font-bold whitespace-nowrap text-sm">{dispute.scammers?.primary_name || 'Deleted Record'}</td>
                           <td className="px-6 py-4 text-blue-600 dark:text-blue-400 text-xs font-medium">{dispute.contact_email}</td>
                           <td className="px-6 py-4 text-xs"><div className="line-clamp-2">{dispute.reason}</div></td>
                           <td className="px-6 py-4 text-center text-[10px] font-bold">
                              <span className={`px-2 py-1 rounded ${
                                dispute.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500' :
                                dispute.status === 'awaiting_evidence' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500' :
                                dispute.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                              }`}>{dispute.status.replace('_', ' ').toUpperCase()}</span>
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
               <PaginationUI totalItems={filteredDisputes.length} />
             </div>
          )}

          {/* CATEGORIES TAB */}
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
                <button type="submit" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2 shadow-sm transition-transform hover:scale-105">
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </form>

              <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-vangard-dark text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <SortableHeader label="Category Name" sortKey="name" />
                      <th className="px-6 py-4 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {processedCategories.length === 0 ? (
                       <tr><td colSpan={2} className="text-center py-10 text-gray-500 text-sm">No categories exist matching "{searchQuery}".</td></tr>
                    ) : (
                      processedCategories.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                            {editingCategoryId === c.id ? (
                              <input
                                autoFocus
                                type="text"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none font-normal"
                              />
                            ) : (
                              c.name
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {editingCategoryId === c.id ? (
                              <>
                                <button onClick={() => handleSaveCategory(c.id)} disabled={processingId === c.id} className="text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 px-3 py-1.5 rounded-lg text-xs transition-colors font-bold">Save</button>
                                <button onClick={() => setEditingCategoryId(null)} disabled={processingId === c.id} className="text-gray-600 bg-gray-50 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs transition-colors font-bold">Cancel</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleStartEditCategory(c)} disabled={processingId === c.id} className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 p-2 rounded-lg transition-colors inline-flex items-center" title="Edit Category"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteCategory(c.id, c.name)} disabled={processingId === c.id} className="text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 p-2 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center shadow-sm" title="Delete Category"><Trash2 className="w-4 h-4" /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                 </table>
                 <PaginationUI totalItems={filteredCategories.length} />
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {tab === 'users' && (
             <div className="bg-white dark:bg-vangard-card rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                   <thead className="bg-gray-50 dark:bg-vangard-dark text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                     <tr>
                       <SortableHeader label="User Details" sortKey="display_name" />
                       <SortableHeader label="Joined" sortKey="created_at" />
                       <SortableHeader label="Role" sortKey="role" />
                       <SortableHeader label="Status" sortKey="status" align="center" />
                       <th className="px-6 py-4 font-normal text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {processedUsers.length === 0 ? (
                       <tr><td colSpan={5} className="text-center py-10 text-gray-500 text-sm">No users found matching "{searchQuery}".</td></tr>
                     ) : (
                       processedUsers.map(user => (
                         <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${user.status !== 'active' ? 'opacity-70' : ''}`}>
                           <td className="px-6 py-4 text-xs">
                             <div className="text-gray-900 dark:text-white font-bold text-sm mb-0.5">{user.display_name || 'No Display Name'}</div>
                             <div className="text-gray-500 mb-0.5">{user.email || 'Email not available'}</div>
                             <div className="text-gray-400 text-[10px] truncate max-w-50">{user.id}</div>
                           </td>
                           <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                             {new Date(user.created_at).toLocaleDateString()}
                           </td>
                           <td className="px-6 py-4 text-[10px] font-bold uppercase">{user.role}</td>
                           <td className="px-6 py-4 text-center">
                             {user.status === 'banned' ? (
                               <span className="bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500 px-2 py-1 rounded text-[10px] font-bold">Banned</span>
                             ) : user.status === 'suspended' ? (
                               <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500 px-2 py-1 rounded text-[10px] block font-bold">
                                 Suspended<br/><span className="text-[8px] font-normal">Until {new Date(user.suspended_until).toLocaleDateString()}</span>
                               </span>
                             ) : (
                               <span className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500 px-2 py-1 rounded text-[10px] font-bold">Active</span>
                             )}
                           </td>
                           <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                             {user.role !== 'admin' && (
                               user.status === 'active' ? (
                                 <>
                                   <button onClick={() => handleUserAction(user.id, 'suspend')} disabled={processingId === user.id} className="text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs inline-flex items-center gap-1 font-medium"><Clock className="w-3 h-3"/> Suspend (7d)</button>
                                   <button onClick={() => handleUserAction(user.id, 'ban')} disabled={processingId === user.id} className="text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs inline-flex items-center gap-1 font-medium"><Ban className="w-3 h-3"/> Ban</button>
                                 </>
                               ) : (
                                 <button onClick={() => handleUserAction(user.id, 'restore')} disabled={processingId === user.id} className="text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs font-medium">Restore</button>
                               )
                             )}
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
               <PaginationUI totalItems={filteredUsers.length} />
             </div>
          )}
        </>
      )}

      {/* Admin Message Modal */}
      {adminMessageModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
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

      {/* View Full Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-vangard-card w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 relative max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-vangard-dark">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-vangard-primary"/> Full Incident Report
              </h3>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-full bg-gray-200/50 dark:bg-gray-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Target Name</span>
                  <span className="text-gray-900 dark:text-white font-medium">{selectedReport.reported_name}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Category</span>
                  <span className="text-gray-900 dark:text-white font-medium">{selectedReport.category}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Phone/GCash Info</span>
                  <span className="text-gray-900 dark:text-white font-medium">{selectedReport.phone_input || selectedReport.gcash_input || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Facebook Link</span>
                  {selectedReport.facebook_input && selectedReport.facebook_input !== 'N/A' ? (
                    <a href={selectedReport.facebook_input} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline break-all font-medium">{selectedReport.facebook_input}</a>
                  ) : <span className="text-gray-900 dark:text-white font-medium">N/A</span>}
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Detailed Incident Description</span>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-sm text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.description}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-vangard-dark">
              <button onClick={() => { handleRejectReport(selectedReport.id); setSelectedReport(null); }} className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 px-5 py-2.5 rounded-xl font-bold transition-colors text-sm">
                Reject Report
              </button>
              <button onClick={() => { handleApproveReport(selectedReport); setSelectedReport(null); }} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors text-sm shadow-md">
                Verify & Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}