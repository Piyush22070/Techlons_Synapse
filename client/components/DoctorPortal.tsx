
import React, { useState } from 'react';
import { User, Report, ReportStatus, Anomaly } from '../types';
import { Header, StatBox, BrutalButton } from './CommonUI';
import { ListChecks, AlertTriangle, User as UserIcon, Activity, ExternalLink, PenTool, CheckCircle, FileSearch, ArrowRight } from 'lucide-react';
import Dashboard from './Dashboard';
import ClusteringTab from './ClusteringTab';
import HeatmapTab from './HeatmapTab';

interface DoctorPortalProps {
  user: User;
  reports: Report[];
  onSaveReport: (report: Report) => void;
  onLogout: () => void;
}

const DoctorPortal: React.FC<DoctorPortalProps> = ({ user, reports, onSaveReport, onLogout }) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'review'>('overview');
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [severity, setSeverity] = useState(5);

  const pendingReview = reports.filter(r => r.status === ReportStatus.PENDING_REVIEW);
  const completedReports = reports.filter(r => r.status === ReportStatus.COMPLETED);

  const handleReviewComplete = () => {
    if (!selectedReport) return;
    const reviewed: Report = {
      ...selectedReport,
      status: ReportStatus.COMPLETED,
      doctorNotes: notes,
      diagnosis: diagnosis,
      severity: severity,
      doctorId: user.id
    };
    onSaveReport(reviewed);
    setSelectedReport(null);
    setNotes('');
    setDiagnosis('');
    alert('Case Finalized. Patient can now view medical recommendations.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header user={user} onLogout={onLogout} accent="bg-[#8B5CF6]" />
      
      <main className="flex-1 p-6 grid grid-cols-12 gap-6">
        {!selectedReport ? (
          <>
            <div className="col-span-12 md:col-span-3 space-y-6">
              <StatBox label="Awaiting Review" value={pendingReview.length} sub="Analyzed by Lab" icon={<AlertTriangle className="text-[#8B5CF6]" />} />
              <StatBox label="Audit Completed" value={completedReports.length} sub="Historical cases" icon={<CheckCircle className="text-gray-300" />} />
            </div>

            <div className="col-span-12 md:col-span-9 border-brutal bg-white shadow-brutal">
              <div className="p-8 border-b-2 border-black bg-gray-50 flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase">Medical Audit Log</h2>
              </div>
              <div>
                {pendingReview.length === 0 && completedReports.length === 0 ? (
                  <div className="p-20 text-center text-gray-400 font-black uppercase tracking-widest">No cases detected in system</div>
                ) : (
                  <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-gray-100 border-b border-black">
                      <tr>
                        <th className="p-4">CASE_ID</th>
                        <th className="p-4">PATIENT</th>
                        <th className="p-4">STATUS</th>
                        <th className="p-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingReview.map(r => (
                        <tr key={r.id} className="border-b border-black hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedReport(r)}>
                          <td className="p-4 font-bold">{r.id}</td>
                          <td className="p-4 uppercase">{r.patientName}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-[#8B5CF6] text-white text-[8px] font-black uppercase">Pending Audit</span>
                          </td>
                          <td className="p-4 text-right">
                             <ArrowRight size={16} className="inline" />
                          </td>
                        </tr>
                      ))}
                      {completedReports.map(r => (
                        <tr key={r.id} className="border-b border-black hover:bg-gray-50 cursor-pointer opacity-60" onClick={() => setSelectedReport(r)}>
                          <td className="p-4 font-bold">{r.id}</td>
                          <td className="p-4 uppercase">{r.patientName}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-black text-white text-[8px] font-black uppercase">Completed</span>
                          </td>
                          <td className="p-4 text-right">
                             <CheckCircle size={16} className="inline" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-12 border-brutal bg-white shadow-brutal flex flex-col h-[calc(100vh-160px)]">
             <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-6">
                  <button onClick={() => setSelectedReport(null)} className="hover:text-[#8B5CF6] transition-colors">
                    <ListChecks size={20} />
                  </button>
                  <h3 className="text-sm font-black uppercase tracking-widest">Medical Audit: {selectedReport.patientName} // {selectedReport.id}</h3>
                </div>
                <div className="flex gap-4">
                  {(['overview', 'analysis', 'review'] as const).map(t => (
                    <button 
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-colors ${activeTab === t ? 'border-[#8B5CF6] text-[#8B5CF6]' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
             </div>

             <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && (
                  <div className="p-8 grid grid-cols-12 gap-8">
                     <div className="col-span-12 lg:col-span-8 space-y-8">
                        <section>
                           <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2 mb-4">Neural Anomaly Detection</h3>
                           <div className="border-brutal p-8 bg-red-50 border-red-500 relative overflow-hidden">
                              <div className="scanner-line"></div>
                              <div className="flex items-start gap-6">
                                 <AlertTriangle className="text-red-500 shrink-0" size={40} />
                                 <div>
                                    <h4 className="text-2xl font-black uppercase text-red-700 tracking-tighter">ANOMALY DETECTED</h4>
                                    <p className="text-xs font-mono text-red-600 mt-1 uppercase tracking-widest">Sequence divergence &gt; 0.4% baseline</p>
                                    <div className="mt-6 space-y-2">
                                       {selectedReport.anomalies?.map(a => (
                                          <div key={a.id} className="bg-white border-brutal p-4 border-red-200">
                                             <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black uppercase bg-red-600 text-white px-2 py-0.5">{a.severity}</span>
                                                <span className="text-[10px] font-mono font-bold">{a.confidence * 100}% CONF</span>
                                             </div>
                                             <p className="font-black uppercase text-sm mb-1">{a.type}</p>
                                             <p className="text-xs text-gray-500 font-mono">{a.description}</p>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </section>
                        <section className="grid grid-cols-2 gap-6">
                           <StatBox label="Patient Identity" value={selectedReport.patientName} sub={`ID: ${selectedReport.patientId}`} />
                           <StatBox label="Processing Date" value={selectedReport.timestamp.split(' ')[0]} sub="System verification OK" />
                        </section>
                     </div>
                     <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="border-brutal bg-black text-white p-6">
                           <h4 className="text-xs font-black uppercase mb-4 tracking-widest">Blockchain Verification</h4>
                           <div className="space-y-4 font-mono text-[10px]">
                              <div>
                                 <p className="opacity-40">SHA-256 HASH</p>
                                 <p className="break-all mt-1">E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855</p>
                              </div>
                              <div className="pt-4 border-t border-white/20">
                                 <p className="opacity-40">BLOCK HEIGHT</p>
                                 <p className="text-sm font-black">19,234,891</p>
                              </div>
                           </div>
                           <BrutalButton className="w-full mt-6 bg-white text-black py-2 text-[10px]">Verify on Ledger</BrutalButton>
                        </div>
                     </div>
                  </div>
                )}

                {activeTab === 'analysis' && selectedReport.analysisData && (
                  <div className="p-0">
                     <Dashboard result={selectedReport.analysisData} />
                     <div className="p-8 border-t-2 border-black">
                        <ClusteringTab result={selectedReport.analysisData} />
                     </div>
                     <div className="p-8 border-t-2 border-black">
                        <HeatmapTab result={selectedReport.analysisData} />
                     </div>
                  </div>
                )}

                {activeTab === 'review' && (
                  <div className="p-12 max-w-4xl mx-auto w-full">
                     <h2 className="text-3xl font-black uppercase tracking-tighter mb-10 flex items-center gap-4">
                        <PenTool size={32} /> Audit Finalization
                     </h2>
                     {selectedReport.status === ReportStatus.COMPLETED ? (
                       <div className="p-8 border-brutal bg-gray-50 text-center">
                          <CheckCircle className="mx-auto text-[#10B981] mb-4" size={48} />
                          <h3 className="text-xl font-black uppercase">Case Already Audited</h3>
                          <p className="text-sm font-mono mt-2">Findings: {selectedReport.diagnosis}</p>
                       </div>
                     ) : (
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Diagnosis Descriptor</label>
                            <input 
                              type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} 
                              className="w-full border-brutal p-4 font-mono text-sm focus:outline-none" 
                              placeholder="EX: GENOMIC BLUEPRINT VARIANCE MATCHED"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Clinical Recommendations</label>
                            <textarea 
                              rows={5} value={notes} onChange={e => setNotes(e.target.value)}
                              className="w-full border-brutal p-4 font-mono text-sm focus:outline-none resize-none" 
                              placeholder="Input professional medical guidance for patient..."
                            />
                          </div>
                          <BrutalButton onClick={handleReviewComplete} className="w-full bg-black text-white shadow-brutal hover:bg-[#8B5CF6]">Finalize Audit & Notify Patient</BrutalButton>
                        </div>
                     )}
                  </div>
                )}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorPortal;
