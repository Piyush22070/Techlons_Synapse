
import React from 'react';
import { LucideIcon } from 'lucide-react';

export const Header: React.FC<{ user: any, onLogout: () => void, accent: string }> = ({ user, onLogout, accent }) => (
  <header className="sticky top-0 z-50 bg-white border-b-2 border-black px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 border-brutal flex items-center justify-center text-white font-black ${accent}`}>
        B
      </div>
      <div>
        <h1 className="text-lg font-black tracking-tighter uppercase">BioSentinel</h1>
        <p className="text-[10px] font-mono uppercase text-gray-400">Terminal Access: {user.role}</p>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="text-right hidden md:block">
        <p className="text-sm font-bold uppercase">{user.name}</p>
        <p className="text-[10px] font-mono text-gray-400 uppercase">{user.id} // SECURE</p>
      </div>
      <button 
        onClick={onLogout}
        className="border-brutal px-4 py-2 text-xs font-black uppercase hover:bg-black hover:text-white transition-colors"
      >
        Sign Out
      </button>
    </div>
  </header>
);

export const StatBox: React.FC<{ label: string, value: string | number, sub?: string, icon?: React.ReactNode }> = ({ label, value, sub, icon }) => (
  <div className="border-brutal bg-white p-6 shadow-brutal flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      {icon}
    </div>
    <div>
      <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
      {sub && <p className="text-[10px] font-mono uppercase text-gray-500 mt-1">{sub}</p>}
    </div>
  </div>
);

export const BrutalButton: React.FC<{ 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string, 
  disabled?: boolean 
}> = ({ children, onClick, className = "", disabled = false }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`border-brutal px-6 py-3 font-black uppercase tracking-widest transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);
