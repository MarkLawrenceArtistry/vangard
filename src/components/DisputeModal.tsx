import { useState } from 'react';
import { X, Loader2, MessageSquareWarning } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scammerId: string;
  scammerName: string;
  userId?: string;
  defaultEmail: string;
}

export default function DisputeModal({ isOpen, onClose, scammerId, scammerName, userId, defaultEmail }: DisputeModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cooldown check: Prevent users from spamming disputes (24-hour limit)
    const lastDisputeTime = localStorage.getItem('lastDisputeTime');
    if (lastDisputeTime) {
      const diff = Date.now() - parseInt(lastDisputeTime, 10);
      if (diff < 24 * 60 * 60 * 1000) {
        alert("You can only submit one dispute every 24 hours. Please wait before submitting again.");
        return;
      }
    }

    setLoading(true);

    try {
      // Ensure we have the user ID, falling back to fetching it if the modal opened before the auth listener finished
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session?.user?.id;
      }

      if (!currentUserId) {
        throw new Error("You must be logged in to submit a dispute.");
      }

      const { error } = await supabase.from('disputes').insert({
        scammer_id: scammerId,
        user_id: currentUserId,
        contact_email: email,
        reason: reason
      });

      if (error) throw error;
      
      localStorage.setItem('lastDisputeTime', Date.now().toString());
      alert("Dispute submitted successfully! You can track it in 'My Disputes'.");
      onClose();
    } catch (err: any) {
      alert("Error submitting dispute: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-vangard-card w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 p-2 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-50 dark:bg-yellow-500/10 p-4 rounded-full border border-yellow-100 dark:border-yellow-900/30">
              <MessageSquareWarning className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-center mb-1 text-gray-900 dark:text-white">File a Dispute</h2>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Disputing record for: <strong className="text-gray-900 dark:text-white">{scammerName}</strong></p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Contact Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Reason for Dispute</label>
              <textarea required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this record is inaccurate or resolved..." className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all text-sm font-medium h-32 resize-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-black py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Dispute'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}