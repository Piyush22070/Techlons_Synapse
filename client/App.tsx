
import React, { useState, useEffect } from 'react';
import { User, UserRole, Report } from './types';
import LandingPage from './components/LandingPage';
import LabPortal from './components/LabPortal';
import PatientPortal from './components/PatientPortal';
import DoctorPortal from './components/DoctorPortal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('biosentinel_user');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleLogin = (email: string, role: UserRole) => {
    // Create user dynamically based on login
    const userId = `${role.charAt(0)}-${Date.now().toString().slice(-6)}`;
    const user: User = {
      id: userId,
      name: email.split('@')[0],
      email: email,
      role: role
    };
    
    setCurrentUser(user);
    setUsers(prev => {
      const exists = prev.find(u => u.email === email && u.role === role);
      return exists ? prev : [...prev, user];
    });
    localStorage.setItem('biosentinel_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('biosentinel_user');
  };

  const saveReport = (report: Report) => {
    setReports(prev => {
      const exists = prev.findIndex(r => r.id === report.id);
      if (exists > -1) {
        const newReports = [...prev];
        newReports[exists] = report;
        return newReports;
      }
      return [report, ...prev];
    });
  };

  if (!currentUser) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {currentUser.role === 'LAB' && (
        <LabPortal user={currentUser} reports={reports} onSaveReport={saveReport} onLogout={handleLogout} />
      )}
      {currentUser.role === 'PATIENT' && (
        <PatientPortal user={currentUser} reports={reports.filter(r => r.patientId === currentUser.id)} onSaveReport={saveReport} onLogout={handleLogout} />
      )}
      {currentUser.role === 'DOCTOR' && (
        <DoctorPortal user={currentUser} reports={reports} onSaveReport={saveReport} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
