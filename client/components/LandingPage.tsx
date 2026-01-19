
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LandingPageProps {
  onLogin: (email: string, role: UserRole) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('LAB');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const roleConfigs = {
    LAB: { label: 'Laboratory Login', color: 'bg-[#14B8A6]', icon: '🔬' },
    PATIENT: { label: 'Patient Login', color: 'bg-[#10B981]', icon: '👤' },
    DOCTOR: { label: 'Doctor Login', color: 'bg-[#8B5CF6]', icon: '⚕️' },
  };

  const handleSumbit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email || (activeTab.toLowerCase() + '@example.com'), activeTab);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fcfcfc]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center border-brutal w-16 h-16 bg-black text-white text-3xl mb-4 shadow-brutal">
            B
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">BioSentinel</h1>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">Access Control // Terminal 1</p>
        </div>

        <div className="flex gap-2 mb-8 border-brutal p-1 bg-white shadow-brutal">
          {(['LAB', 'PATIENT', 'DOCTOR'] as UserRole[]).map(role => (
            <button
              key={role}
              onClick={() => setActiveTab(role)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === role ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <form onSubmit={handleSumbit} className="border-brutal bg-white p-8 shadow-brutal space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-3xl">{roleConfigs[activeTab].icon}</span>
            <div>
              <h2 className="text-xl font-bold uppercase">{roleConfigs[activeTab].label}</h2>
              <p className="text-[10px] font-mono text-gray-400">SECURE_CHANNEL_V1.04</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Identity Identifier</label>
            <input
              type="email"
              placeholder={`${activeTab.toLowerCase()}@example.com`}
              className="w-full border-brutal p-3 font-mono text-sm focus:outline-none focus:ring-0 placeholder:text-gray-200"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Encrypted Passphrase</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full border-brutal p-3 font-mono text-sm focus:outline-none focus:ring-0"
              value={pass}
              onChange={e => setPass(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-4 text-white font-black uppercase tracking-widest border-brutal shadow-brutal transition-transform active:translate-y-1 active:translate-x-1 ${roleConfigs[activeTab].color}`}
          >
            Authenticate -&gt;
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-mono text-gray-400 uppercase leading-loose">
          Unauthorized Access is Prohibited<br/>
          Encryption Active // Node #4421
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
