import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, ShieldCheck, Zap, Globe, MousePointer2 } from 'lucide-react';

interface HeroProps {
  onOpenAuth: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenAuth }) => {
  return (
    <div className="relative pt-32 pb-24 lg:pt-48 lg:pb-56 overflow-hidden">
      {/* Neural Mesh Background */}
      <div className="absolute inset-0 -z-10 bg-[#0b0e14]">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-primary/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-secondary/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold mb-8 tracking-widest uppercase">
              <Zap className="w-3 h-3" />
              AI-Powered Neural Architecture
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1]">
              Transform 2D <br />
              Floor Plans into <br />
              <span className="text-gradient">Interactive 3D</span>
            </h1>

            <p className="text-xl text-gray-400 mb-10 max-w-lg leading-relaxed font-body">
              Let your buyers walk through properties before they visit. 
              The neural tapestry architecture of Floor Lift brings flat blueprints to life instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={onOpenAuth}
                className="btn-primary flex items-center justify-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="btn-secondary flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            <div className="mt-12 flex items-center gap-8 grayscale opacity-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-tighter">Secure Data</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-tighter">Global Access</span>
              </div>
            </div>
          </motion.div>

          {/* Right Content: 3D Preview Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 glass-card rounded-3xl p-4 shadow-2xl">
              {/* Interface Header */}
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/50" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                  <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Neural Engine v2.4</div>
              </div>

              {/* 3D Model Placeholder Box */}
              <div className="aspect-[4/3] bg-[#0b0e14] rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent" />
                
                {/* Mock 3D Model Geometry */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-48 h-48 rotate-45 border-2 border-brand-primary/20 flex items-center justify-center">
                    <div className="w-32 h-32 border border-brand-primary/40" />
                    <div className="absolute -top-4 -right-4 w-8 h-8 glass flex items-center justify-center">
                      <MousePointer2 className="w-4 h-4 text-brand-primary" />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="glass px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Processing Complete</span>
                  </div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Model ready (1.4s)</div>
                </div>
              </div>
            </div>

            {/* Decorative Background Elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-secondary/20 blur-3xl rounded-full -z-10" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-brand-primary/20 blur-3xl rounded-full -z-10" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
