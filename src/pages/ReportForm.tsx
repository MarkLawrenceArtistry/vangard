import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AlertTriangle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type ReportFormData = {
  scammerName: string;
  phoneGcash: string; // <-- Combined Field
  facebook: string;
  category: string;
  description: string;
};

const FALLBACK_CATEGORIES = ['Other'];

export default function ReportForm() {
  const [session, setSession] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [reportsLeft, setReportsLeft] = useState<number>(30);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  
  const savedDraft = JSON.parse(localStorage.getItem('reportDraft') || '{}');
  
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<ReportFormData>({
    defaultValues: savedDraft
  });
  
  const phoneGcash = watch('phoneGcash');
  const facebook = watch('facebook');

  // Check if at least one contact info is validly provided (not N/A or empty)
  const hasContactInfo = 
    (phoneGcash && phoneGcash.trim().toUpperCase() !== 'N/A') || 
    (facebook && facebook.trim().toUpperCase() !== 'N/A');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      }
    });
    
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('name').order('name');
      if (!error && data && data.length > 0) setCategories(data.map(c => c.name));
      else setCategories(FALLBACK_CATEGORIES);
    };
    fetchCategories();

    const subscription = watch((value) => localStorage.setItem('reportDraft', JSON.stringify(value)));

    const today = new Date().toDateString();
    const rawLimit = localStorage.getItem('dailyReports');
    let limitData = rawLimit ? JSON.parse(rawLimit) : { date: today, count: 0 };
    if (limitData.date !== today) {
      limitData = { date: today, count: 0 };
      localStorage.setItem('dailyReports', JSON.stringify(limitData));
    }
    setReportsLeft(30 - limitData.count);

    return () => subscription.unsubscribe();
  }, [watch]);

  const incrementDailyLimit = () => {
    const today = new Date().toDateString();
    const rawLimit = localStorage.getItem('dailyReports');
    let limitData = rawLimit ? JSON.parse(rawLimit) : { date: today, count: 0 };
    limitData.count += 1;
    localStorage.setItem('dailyReports', JSON.stringify(limitData));
  };

  const onSubmit = async (data: ReportFormData) => {
    if (reportsLeft <= 0) return alert("You have reached your daily limit of 30 reports.");
    setIsSubmitting(true);
    
    // Normalize N/A inputs to null for the database
    const cleanPhoneGcash = (!data.phoneGcash || data.phoneGcash.toUpperCase() === 'N/A') ? null : data.phoneGcash;
    const cleanFacebook = (!data.facebook || data.facebook.toUpperCase() === 'N/A') ? null : data.facebook;

    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: session?.user?.id || null,
        reported_name: data.scammerName,
        phone_input: cleanPhoneGcash,  // Maps to both
        gcash_input: cleanPhoneGcash,  // Maps to both
        facebook_input: cleanFacebook,
        category: data.category,
        description: data.description,
        status: 'pending'
      });
      
      if (error) throw error;
      
      incrementDailyLimit();
      localStorage.removeItem('reportDraft');
      reset(); 
      alert("Report submitted successfully! Our moderators will review it shortly.");
      navigate(session ? '/dashboard' : '/');
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto max-w-xl">
      <div className="mb-6 border-l-4 border-vangard-primary pl-4 py-2.5 bg-white dark:bg-vangard-card shadow-sm rounded-r-xl border-y border-r border-gray-200 dark:border-gray-800">
        <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="text-vangard-primary w-5 h-5" /> File a Scam Report
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-[11px] md:text-xs mt-1 flex justify-between items-center pr-2">
          <span>False reporting will result in a permanent ban.</span>
          <span className={`font-bold ${reportsLeft <= 5 ? 'text-red-500' : 'text-blue-500'}`}>{reportsLeft}/30 Reports left</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white dark:bg-vangard-card p-5 md:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative">
        
        {reportsLeft <= 0 && (
          <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10 rounded-2xl flex flex-col items-center justify-center text-center p-6">
            <Info className="w-10 h-10 text-red-500 mb-3" />
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Daily Limit Reached</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">You have reached the maximum limit of 30 reports per day.</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Scammer Name / Alias *</label>
          <input 
            {...register("scammerName", { required: "Name is required" })}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-xs font-medium"
            placeholder="e.g. Juan Dela Cruz"
          />
          {errors.scammerName && <span className="text-red-500 text-[11px] mt-1 font-bold">{errors.scammerName.message}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Phone/GCash Number</label>
            <input 
              {...register("phoneGcash", {
                maxLength: { value: 11, message: "Max 11 digits allowed" },
                pattern: {
                  value: /(^09\d{9}$|^N\/A$|^n\/a$|^$)/i,
                  message: "Must be 11 digits starting with 09, or N/A"
                }
              })}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-xs font-medium"
              placeholder="e.g. 09123456789 (Type N/A if none)"
            />
            {errors.phoneGcash && <span className="text-red-500 text-[11px] mt-1 font-bold block">{errors.phoneGcash.message}</span>}
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Facebook Profile URL</label>
            <input 
              {...register("facebook")}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-xs font-medium"
              placeholder="URL (Type N/A if none)"
            />
          </div>
        </div>

        {!hasContactInfo && <span className="text-orange-500 text-[11px] font-bold block">Please provide at least one valid Contact Number or Facebook Link.</span>}

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Niche Category *</label>
          <select 
            {...register("category", { required: true })}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-xs font-medium"
          >
            <option value="">Select a category...</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Incident Description *</label>
          <textarea 
            {...register("description", { 
              required: "Description is required",
              minLength: { value: 50, message: "Please provide more details (min 50 chars)" }
            })}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-xs font-medium h-28 resize-none"
            placeholder="Explain how the scam happened. You can paste relevant Facebook post links here as supporting evidence..."
          />
          {errors.description && <span className="text-red-500 text-[11px] mt-1 font-bold">{errors.description.message}</span>}
        </div>

        <div className="pt-2">
          {!session ? (
            <button type="button" onClick={() => navigate('/login?redirect=/report')} className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-black py-3 rounded-xl transition-all shadow-sm text-sm">
              Log in to Submit Report
            </button>
          ) : profile?.status === 'suspended' ? (
            <div className="w-full bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500 font-black py-3 rounded-xl text-center shadow-sm text-sm border border-red-200 dark:border-red-900/30">
              Account Suspended - Cannot Submit Reports
            </div>
          ) : (
            <button type="submit" disabled={isSubmitting || !hasContactInfo || reportsLeft <= 0} className="w-full bg-vangard-primary hover:bg-red-600 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm">
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}