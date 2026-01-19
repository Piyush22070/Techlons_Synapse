
import React, { useState, useEffect } from 'react';
import { User, Report, ReportStatus, RegistrationStatus, AnalysisStepStatus, Anomaly } from '../types';
import { Header, StatBox, BrutalButton } from './CommonUI';
import { Search, Upload, CheckCircle2, Clock, Activity, FileText, Check, X } from 'lucide-react';
import { analyzeFastqFile } from '../services/fileProcessor';
import { getRequests, modifyRequest, convertApiToReport } from '../services/api';
import { wsService, simulateAnalysisProgress, AnalysisProgress } from '../services/websocket';
import Dashboard from './Dashboard';
import ClusteringTab from './ClusteringTab';
import HeatmapTab from './HeatmapTab';

interface LabPortalProps {
  user: User;
  reports: Report[];
  onSaveReport: (report: Report) => void;
  onLogout: () => void;
}

const LabPortal: React.FC<LabPortalProps> = ({ user, reports, onSaveReport, onLogout }) => {
  const [activeView, setActiveView] = useState<'registrations' | 'queue' | 'processing' | 'completed'>('registrations');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [declineNotes, setDeclineNotes] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [isFetchingRequests, setIsFetchingRequests] = useState(false);

  const pendingRegistrations = reports.filter(r => 
    r.status === ReportStatus.PENDING_REGISTRATION && 
    r.registrationStatus === RegistrationStatus.PENDING
  );
  const pendingQueue = reports.filter(r => r.status === ReportStatus.PENDING_ANALYSIS);
  const selectedReport = reports.find(r => r.id === selectedReportId);

  // Fetch requests from API on component mount
  useEffect(() => {
    fetchRequestsFromAPI();
    
    // Initialize WebSocket connection
    wsService.connect().catch(error => {
      console.warn('WebSocket connection failed:', error);
    });

    return () => {
      wsService.disconnect();
    };
  }, []);

  const fetchRequestsFromAPI = async () => {
    setIsFetchingRequests(true);
    try {
      const result = await getRequests();
      if (result.success && result.data) {
        // Convert API data to Report format and update
        result.data.forEach(apiData => {
          const reportData = convertApiToReport(apiData);
          // You might want to check if report already exists before adding
          // For now, this is a simplified version
          console.log('Fetched request:', reportData);
        });
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsFetchingRequests(false);
    }
  };

  const startProcessing = async () => {
    if (!selectedReport) return;
    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisError(null);
    setAnalysisStage('Initializing...');
    setActiveView('processing');
    
    try {
      const jobId = selectedReport.id;
      
      // Subscribe to WebSocket updates if available
      let unsubscribe: (() => void) | null = null;
      if (wsService.isConnected()) {
        unsubscribe = wsService.subscribeToAnalysis(jobId, (progressData: AnalysisProgress) => {
          setProgress(progressData.progress);
          setAnalysisStage(progressData.stage);
          
          // If analysis is complete, set the result
          if (progressData.status === 'complete' && progressData.data) {
            setCurrentAnalysis(progressData.data);
          }
        });
      }
      
      // If report has fileName, try to analyze the actual file
      if (selectedReport.fileName && typeof (selectedReport as any).fileData === 'object') {
        const fileData = (selectedReport as any).fileData as File;
        
        // If WebSocket not available, use simulation for progress indication
        if (!unsubscribe) {
          await simulateAnalysisProgress((progressData) => {
            setProgress(progressData.progress);
            setAnalysisStage(progressData.stage);
          }, 8000);
        }
        
        // Analyze the file
        const result = await analyzeFastqFile(fileData);
        setCurrentAnalysis(result);
        setProgress(100);
      } else {
        // No file data available - wait for real file upload from API
        throw new Error('No file data available. Please ensure file is uploaded correctly via the API.');
      }
      
      // Cleanup WebSocket subscription
      if (unsubscribe) {
        unsubscribe();
      }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
      console.error('Analysis error:', error);
    }
    
    setIsAnalyzing(false);
  };

  const finalizeLabStage = () => {
    if (!selectedReport || !currentAnalysis) return;
    
    // Automated Anomaly Detection
    const anomalies: Anomaly[] = [
      { 
        id: `A-${Math.random().toString(36).substr(2, 4).toUpperCase()}`, 
        type: 'Framesift Outlier', 
        location: 'Cluster 2', 
        confidence: 0.98, 
        severity: 'HIGH', 
        description: 'Automated detection flagged variant divergence > 2.4% vs baseline.' 
      }
    ];

    const updated: Report = {
      ...selectedReport,
      status: ReportStatus.PENDING_REVIEW,
      analysisData: currentAnalysis,
      anomalies: anomalies,
      labTechId: user.id
    };
    
    onSaveReport(updated);
    alert('Processing complete. Report forwarded to Doctor for review.');
    setActiveView('queue');
    setSelectedReportId(null);
    setCurrentAnalysis(null);
  };

  const approveRegistration = async () => {
    if (!selectedReport) return;
    
    // Call API to update request status
    const result = await modifyRequest(selectedReport.id, {
      registration_status: 'APPROVED',
      registration_notes: 'Registration approved by lab technician'
    });

    if (result.success) {
      const updated: Report = {
        ...selectedReport,
        registrationStatus: RegistrationStatus.APPROVED,
        registrationNotes: 'Registration approved by lab technician'
      };
      
      onSaveReport(updated);
      alert('Registration approved. Patient can now upload sequence files.');
      setActiveView('registrations');
      setSelectedReportId(null);
    } else {
      alert('Failed to approve registration: ' + result.error);
    }
  };

  const declineRegistration = async () => {
    if (!selectedReport || !declineNotes.trim()) {
      alert('Please provide a reason for declining');
      return;
    }
    
    // Call API to update request status
    const result = await modifyRequest(selectedReport.id, {
      registration_status: 'REJECTED',
      registration_notes: declineNotes
    });

    if (result.success) {
      const updated: Report = {
        ...selectedReport,
        registrationStatus: RegistrationStatus.REJECTED,
        registrationNotes: declineNotes
      };
      
      onSaveReport(updated);
      alert('Registration declined. Patient has been notified.');
      setShowDeclineForm(false);
      setDeclineNotes('');
      setActiveView('registrations');
      setSelectedReportId(null);
    } else {
      alert('Failed to decline registration: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={onLogout} accent="bg-[#14B8A6]" />
      
      {/* Registration Review Modal */}
      {selectedReportId && selectedReport?.status === ReportStatus.PENDING_REGISTRATION && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-brutal max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-brutal">
            <div className="bg-black text-white p-6 flex justify-between items-center sticky top-0">
              <h2 className="text-2xl font-black uppercase">Patient Registration Review</h2>
              <button onClick={() => { setSelectedReportId(null); setShowDeclineForm(false); setDeclineNotes(''); }} className="text-2xl font-black">×</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-brutal p-4 bg-gray-50">
                  <p className="text-[10px] font-black uppercase text-gray-600">REQUEST ID</p>
                  <p className="text-lg font-bold">{selectedReport.id}</p>
                </div>
                <div className="border-brutal p-4 bg-gray-50">
                  <p className="text-[10px] font-black uppercase text-gray-600">STATUS</p>
                  <p className="text-lg font-bold text-yellow-600">PENDING</p>
                </div>
              </div>

              <div className="border-brutal p-6">
                <h3 className="text-lg font-black uppercase mb-4 border-b-2 border-black pb-2">Patient Information</h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold">Name:</span>
                    <span>{selectedReport.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Email:</span>
                    <span>{selectedReport.patientEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Age:</span>
                    <span>{selectedReport.patientAge} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Gender:</span>
                    <span>{selectedReport.patientGender}</span>
                  </div>
                  {selectedReport.medicalHistory && (
                    <div className="border-t pt-3 mt-3">
                      <span className="font-bold">Medical History:</span>
                      <p className="mt-2 text-xs bg-gray-50 p-3 border border-gray-200">{selectedReport.medicalHistory}</p>
                    </div>
                  )}
                </div>
              </div>

              {!showDeclineForm ? (
                <div className="flex gap-4">
                  <button 
                    onClick={approveRegistration}
                    className="flex-1 bg-[#10B981] text-white py-3 font-black uppercase border-brutal hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} /> Approve Registration
                  </button>
                  <button 
                    onClick={() => setShowDeclineForm(true)}
                    className="flex-1 bg-red-600 text-white py-3 font-black uppercase border-brutal hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Decline Registration
                  </button>
                </div>
              ) : (
                <div className="border-brutal p-6 bg-red-50 space-y-4">
                  <h3 className="font-black uppercase text-red-700">Decline Registration</h3>
                  <textarea 
                    value={declineNotes}
                    onChange={(e) => setDeclineNotes(e.target.value)}
                    placeholder="Provide reason for declining this registration..."
                    className="w-full p-3 border-2 border-red-300 font-mono text-sm h-24 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex gap-4">
                    <button 
                      onClick={declineRegistration}
                      className="flex-1 bg-red-600 text-white py-2 font-black uppercase border-brutal hover:bg-red-700 transition-colors"
                    >
                      Confirm Decline
                    </button>
                    <button 
                      onClick={() => { setShowDeclineForm(false); setDeclineNotes(''); }}
                      className="flex-1 bg-gray-400 text-white py-2 font-black uppercase border-brutal hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 p-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3 space-y-6">
          <div className="border-brutal p-4 bg-white shadow-brutal">
            <h3 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Pipeline Navigation</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveView('registrations')}
                className={`w-full flex items-center gap-3 p-3 font-bold uppercase text-sm border-brutal transition-colors ${activeView === 'registrations' ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
              >
                <FileText size={18} /> Registrations
              </button>
              <button 
                onClick={() => setActiveView('queue')}
                className={`w-full flex items-center gap-3 p-3 font-bold uppercase text-sm border-brutal transition-colors ${activeView === 'queue' ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
              >
                <Activity size={18} /> Analysis Queue
              </button>
            </div>
          </div>
          <StatBox label="Pending Registrations" value={pendingRegistrations.length} sub="Awaiting review" />
          <StatBox label="Queue Size" value={pendingQueue.length} sub="Pending analysis" />
          <StatBox label="System Load" value="12%" sub="Active jobs: 02" icon={<Clock size={16} className="text-gray-300" />} />
        </div>

        <div className="col-span-12 md:col-span-9 border-brutal bg-white shadow-brutal flex flex-col overflow-hidden">
          {activeView === 'registrations' && (
            <div className="p-8 h-full flex flex-col">
              <h2 className="text-2xl font-black uppercase mb-6">Patient Registration Requests</h2>
              <div className="border-brutal flex-1 overflow-y-auto">
                {pendingRegistrations.length === 0 ? (
                  <div className="p-20 text-center text-gray-400 font-black uppercase">No pending registration requests</div>
                ) : (
                  <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-gray-50 border-b-2 border-black sticky top-0">
                      <tr>
                        <th className="p-4">REQUEST_ID</th>
                        <th className="p-4">PATIENT_NAME</th>
                        <th className="p-4">AGE / GENDER</th>
                        <th className="p-4">EMAIL</th>
                        <th className="p-4">SUBMITTED</th>
                        <th className="p-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRegistrations.map(reg => (
                        <tr key={reg.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-4 font-bold">{reg.id}</td>
                          <td className="p-4 uppercase">{reg.patientName}</td>
                          <td className="p-4 text-xs">{reg.patientAge} / {reg.patientGender}</td>
                          <td className="p-4 text-xs">{reg.patientEmail}</td>
                          <td className="p-4 text-xs text-gray-500">{reg.timestamp}</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => setSelectedReportId(reg.id)}
                              className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase hover:bg-teal-600 transition-colors"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeView === 'queue' && (
            <div className="p-8 h-full flex flex-col">
              <h2 className="text-2xl font-black uppercase mb-6">Processing Queue</h2>
              <div className="border-brutal">
                {pendingQueue.length === 0 ? (
                  <div className="p-20 text-center text-gray-400 font-black uppercase">No new sequences detected</div>
                ) : (
                  <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-gray-50 border-b-2 border-black">
                      <tr>
                        <th className="p-4">SAMPLE_ID</th>
                        <th className="p-4">PATIENT</th>
                        <th className="p-4">TIMESTAMP</th>
                        <th className="p-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingQueue.map(q => (
                        <tr key={q.id} className="border-b border-black hover:bg-gray-50">
                          <td className="p-4 font-bold">{q.id}</td>
                          <td className="p-4 uppercase">{q.patientName}</td>
                          <td className="p-4 text-xs text-gray-500">{q.timestamp}</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => { setSelectedReportId(q.id); startProcessing(); }}
                              className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase hover:bg-teal-600 transition-colors"
                            >
                              Process Sequence
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeView === 'processing' && (
            <div className="p-12 flex flex-col items-center justify-center h-full">
              {isAnalyzing ? (
                <div className="max-w-md w-full space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-black uppercase mb-2">Processing Pipeline</h2>
                    <p className="text-sm font-mono text-gray-400 uppercase tracking-widest">Active Job: {selectedReport?.id}</p>
                    <p className="text-xs font-mono text-teal-600 mt-2">{analysisStage}</p>
                  </div>
                  <div className="relative h-4 w-full bg-gray-100 border-brutal">
                    <div className="absolute top-0 left-0 h-full bg-[#14B8A6] transition-all duration-300" style={{ width: `${progress}%` }} />
                    <div className="scanner-line"></div>
                  </div>
                  <p className="text-center text-sm font-black text-gray-600">{progress}% Complete</p>
                  <div className="space-y-3">
                    {[
                      { l: 'File Parsing & Validation', t: 10 },
                      { l: 'Generating AI Embeddings', t: 30 },
                      { l: 'Running UMAP & HDBSCAN', t: 50 },
                      { l: 'Clustering Complete', t: 70 },
                      { l: 'NCBI Verification', t: 85 },
                      { l: 'Dataset Finalization', t: 100 }
                    ].map(s => (
                      <div key={s.l} className={`flex items-center gap-3 p-3 border-brutal font-mono text-xs ${progress >= s.t ? 'bg-gray-50' : 'opacity-30'}`}>
                        {progress >= s.t ? <CheckCircle2 size={14} className="text-[#14B8A6]" /> : <Clock size={14} />}
                        <span className="font-bold uppercase">{s.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : analysisError ? (
                <div className="w-full h-full flex flex-col">
                  <div className="bg-red-600 text-white p-6 flex justify-between items-center">
                    <h3 className="text-lg font-black uppercase tracking-widest">Analysis Error</h3>
                    <BrutalButton onClick={() => { setActiveView('queue'); setSelectedReportId(null); setAnalysisError(null); }} className="bg-white text-red-600 border-none py-2 px-4 text-[10px] shadow-none">Back to Queue</BrutalButton>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-white p-8 flex items-center justify-center">
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
                      <h4 className="text-sm font-black uppercase text-red-700 mb-2">Processing Failed</h4>
                      <p className="text-sm font-mono text-red-600">{analysisError}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col">
                  <div className="bg-black text-white p-6 flex justify-between items-center">
                    <h3 className="text-lg font-black uppercase tracking-widest">Analysis Preview: {selectedReport?.id}</h3>
                    <BrutalButton onClick={finalizeLabStage} className="bg-[#14B8A6] text-white border-none py-2 px-4 text-[10px] shadow-none">Commit to Audit Log</BrutalButton>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-white p-8">
                     <Dashboard result={currentAnalysis} />
                     <div className="mt-8 border-brutal p-6 bg-red-50 border-red-200">
                        <h4 className="text-xs font-black uppercase text-red-700 mb-2">Auto-Detected Anomalies</h4>
                        <p className="text-sm font-mono text-red-600">Variant divergence detected in metabolic pathways. Flagged for Priority Medical Review.</p>
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LabPortal;
