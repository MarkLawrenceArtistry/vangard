import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type ReportFormData = {
  scammerName: string;
  phone: string;
  gcash: string;
  facebook: string;
  category: string;
  description: string;
};

export default function ReportForm() {
  const [session, setSession] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ReportFormData>();
  const phone = watch('phone');
  const facebook = watch('facebook');

  // We still fetch session just to attach their ID if they happen to be logged in, 
  // but we DO NOT block submission if they are not logged in.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: session?.user?.id || null, // Allows anonymous submission
        reported_name: data.scammerName,
        phone_input: data.phone,
        gcash_input: data.gcash,
        facebook_input: data.facebook,
        category: data.category,
        description: data.description,
        status: 'pending'
      });
      
      if (error) throw error;
      
      alert("Report submitted successfully! Our moderators will review it shortly.");
      
      // If logged in, go to dashboard. If anonymous, go to home page.
      if (session) {
        navigate('/dashboard'); 
      } else {
        navigate('/');
      }
      
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto max-w-2xl">
      <div className="mb-6 border-l-4 border-vangard-primary pl-4 py-3 bg-white dark:bg-vangard-card shadow-sm rounded-r-2xl border-y border-r border-gray-200 dark:border-gray-800">
        <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="text-vangard-primary w-6 h-6 md:w-7 md:h-7" /> File a Scam Report
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-xs md:text-sm mt-1">
          Your report will be reviewed by moderators. False reporting will result in a permanent ban.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white dark:bg-vangard-card p-5 md:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Scammer Name / Alias *</label>
          <input 
            {...register("scammerName", { required: "Name is required" })}
            className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-sm font-medium"
            placeholder="e.g. Juan Dela Cruz"
          />
          {errors.scammerName && <span className="text-red-500 text-xs mt-1 font-bold">{errors.scammerName.message}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
            <input 
              {...register("phone")}
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-sm font-medium"
              placeholder="e.g. 09123456789"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">GCash Number</label>
            <input 
              {...register("gcash")}
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-sm font-medium"
              placeholder="Leave blank if unknown"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Facebook Profile URL</label>
          <input 
            {...register("facebook")}
            className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-sm font-medium"
            placeholder="https://facebook.com/username"
          />
          {(!phone && !facebook) && <span className="text-orange-500 text-xs mt-1 font-bold block">Please provide either a Phone number or Facebook link.</span>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Niche Category *</label>
          <select 
            {...register("category", { required: true })}
            className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-sm font-medium"
          >
            <option value="MLBB">Mobile Legends (MLBB)</option>
            <option value="Genshin">Genshin Impact</option>
            <option value="Roblox">Roblox</option>
            <option value="Tech">Tech & Gadgets</option>
            <option value="Ecommerce">General E-Commerce</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Incident Description *</label>
          <textarea 
            {...register("description", { 
              required: "Description is required",
              minLength: { value: 50, message: "Please provide more details (min 50 chars)" }
            })}
            className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-vangard-primary outline-none transition-all text-sm font-medium h-32 resize-none"
            placeholder="Explain how the scam happened..."
          />
          {errors.description && <span className="text-red-500 text-xs mt-1 font-bold">{errors.description.message}</span>}
        </div>

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting || (!phone && !facebook)}
            className="w-full bg-vangard-primary hover:bg-red-600 text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-base"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}