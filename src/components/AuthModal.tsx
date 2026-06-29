import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginAsGuest } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0b0e14]/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg glass-card rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full -z-10" />

            <button onClick={onClose} className="absolute top-8 right-8 p-2 text-gray-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-bold mb-4 tracking-widest uppercase">
                Neural Interface
              </div>
              <h2 className="text-4xl font-display font-bold text-white mb-3 tracking-tighter">
                {isLogin ? 'Access System' : 'Create Proxy'}
              </h2>
              <p className="text-gray-500 font-body">
                {isLogin ? 'Initialize your architectural terminal' : 'Begin your neural tapestry journey'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 text-sm bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 font-bold uppercase tracking-tight">
                  Error: {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    placeholder="Identification (Email)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-[#0b0e14]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-brand-primary/50 text-white outline-none transition-all placeholder:text-gray-700 font-medium"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    placeholder="Access Key (Password)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-[#0b0e14]/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-brand-primary/50 text-white outline-none transition-all placeholder:text-gray-700 font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 btn-primary text-xl flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <span>{isLogin ? 'Initialize' : 'Register'}</span>
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="block w-full text-gray-500 hover:text-brand-primary font-bold uppercase text-[10px] tracking-[0.2em] transition-colors"
              >
                {isLogin ? 'No Credentials? Construct New Proxy' : 'Existing Proxy? Initialize System'}
              </button>

              <div className="h-px bg-white/5 w-1/3 mx-auto" />

              <button
                type="button"
                onClick={() => {
                  loginAsGuest();
                  onClose();
                }}
                className="text-brand-primary/60 hover:text-brand-primary font-bold uppercase text-[10px] tracking-[0.2em] transition-colors"
              >
                System Bypass (Demo Mode)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
