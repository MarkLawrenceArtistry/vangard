import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UploadCloud, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthModal from '../components/AuthModal';
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ReportFormData>();

  // Watch fields for cross-validation (Needs either phone or FB)
  const phone = watch('phone');
  const facebook = watch('facebook');

  const onSubmit = async (data: ReportFormData) => {
    // 1. Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // User is not logged in! Show the modal and stop submission.
      setShowAuthModal(true);
      return;
    }

    // 2. If logged in, proceed with submission
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: session.user.id,
        reported_name: data.scammerName,
        phone_input: data.phone,
        gcash_input: data.gcash,
        facebook_input: data.facebook,
        category: data.category,
        description: data.description,
        status: 'pending' // Enforces the Mod review queue
      });

      if (error) throw error;
      
      alert("Report submitted successfully! It is now pending review.");
      navigate('/dashboard'); // Redirect to their tracking dashboard
    } catch (err: any) {
      alert("Error submitting report: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto mb-10">
      <div className="mb-6 border-l-4 border-vangard-primary pl-4 py-2 bg-vangard-primary/10 rounded-r-lg">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="text-vangard-primary" /> File a Scam Report
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Your report will be reviewed by moderators. False reporting will result in a permanent ban.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-vangard-card p-6 rounded-2xl border border-gray-800 shadow-xl">
        
        {/* Scammer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Scammer Name / Alias *</label>
          <input 
            {...register("scammerName", { required: "Name is required" })}
            className="w-full p-3 bg-vangard-dark border border-gray-700 rounded-xl focus:ring-2 focus:ring-vangard-accent outline-none"
            placeholder="e.g. Juan Dela Cruz"
          />
          {errors.scammerName && <span className="text-red-400 text-xs mt-1">{errors.scammerName.message}</span>}
        </div>

        {/* Contact Info Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
            <input 
              {...register("phone")}
              className="w-full p-3 bg-vangard-dark border border-gray-700 rounded-xl focus:ring-2 focus:ring-vangard-accent outline-none"
              placeholder="e.g. 09123456789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">GCash Number</label>
            <input 
              {...register("gcash")}
              className="w-full p-3 bg-vangard-dark border border-gray-700 rounded-xl focus:ring-2 focus:ring-vangard-accent outline-none"
              placeholder="Leave blank if unknown"
            />
          </div>
        </div>

        {/* Facebook Link */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Facebook Profile URL</label>
          <input 
            {...register("facebook")}
            className="w-full p-3 bg-vangard-dark border border-gray-700 rounded-xl focus:ring-2 focus:ring-vangard-accent outline-none"
            placeholder="https://facebook.com/username"
          />
          {(!phone && !facebook) && <span className="text-orange-400 text-xs mt-1">Please provide either a Phone number or Facebook link.</span>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Niche Category *</label>
          <select 
            {...register("category", { required: true })}
            className="w-full p-3 bg-vangard-dark border border-gray-700 rounded-xl focus:ring-2 focus:ring-vangard-accent outline-none"
          >
            <option value="MLBB">Mobile Legends (MLBB)</option>
            <option value="Genshin">Genshin Impact</option>
            <option value="Roblox">Roblox</option>
            <option value="Tech">Tech & Gadgets</option>
            <option value="Ecommerce">General E-Commerce</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Incident Description *</label>
          <textarea 
            {...register("description", { 
              required: "Description is required",
              minLength: { value: 50, message: "Please provide more details (minimum 50 characters)" }
            })}
            className="w-full p-3 bg-vangard-dark border border-gray-700 rounded-xl focus:ring-2 focus:ring-vangard-accent outline-none h-32 resize-none"
            placeholder="Explain how the scam happened. Include details about the transaction..."
          />
          {errors.description && <span className="text-red-400 text-xs mt-1">{errors.description.message}</span>}
        </div>

        {/* File Upload UI Mock (Actual upload logic to be built later) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Evidence Attachments (Max 5)</label>
          <div className="w-full p-6 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-vangard-accent hover:text-gray-300 transition-colors cursor-pointer bg-vangard-dark">
            <UploadCloud className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Tap to upload screenshots</span>
            <span className="text-xs mt-1">(Cloudinary integration coming in next step)</span>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || (!phone && !facebook)}
          className="w-full bg-vangard-primary hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>

      {/* The Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={() => {
          setShowAuthModal(false);
          // If login is successful, automatically trigger the form submit again
          handleSubmit(onSubmit)(); 
        }} 
      />
    </div>
  );
}