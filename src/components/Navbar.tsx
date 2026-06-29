import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, LogOut, User as UserIcon, Menu } from 'lucide-react';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-xl bg-[#0b0e14]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <Box className="w-6 h-6 text-[#111319]" />
            </div>
            <span className="text-2xl font-display font-bold text-white ml-2 tracking-tighter uppercase italic">Floor Lift</span>
          </div>

          <div className="hidden md:flex items-center gap-12 font-display text-sm font-bold uppercase tracking-widest text-gray-400">
            <a href="#" className="hover:text-brand-primary transition-colors">Vision</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Features</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Pricing</a>
            <a href="#" className="hover:text-brand-primary transition-colors text-white">Enterprise</a>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-6">
                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                  <UserIcon className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs font-bold text-gray-300">{user.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button 
                  onClick={onOpenAuth}
                  className="hidden sm:block text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenAuth}
                  className="btn-primary"
                >
                  Get Started
                </button>
              </div>
            )}
            <button className="md:hidden p-2 text-gray-400">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
