
import React, { useState, useRef, useEffect } from 'react';
import { User, Report, ReportStatus, RegistrationStatus } from '../types';
import { Header, StatBox, BrutalButton } from './CommonUI';
import { FileText, ChevronRight, Activity, Calendar, User as UserIcon, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import Dashboard from './Dashboard';
import { registerPatient, uploadFastqFile, downloadFile, triggerFileDownload } from '../services/api';
import { wsService, simulateAnalysisProgress } from '../services/websocket';

interface PatientPortalProps {
  user: User;
  reports: Report[];
  onSaveReport: (report: Report) => void;
  onLogout: () => void;
}

const PatientPortal: React.FC<PatientPortalProps> = ({ user, reports, onSaveReport, onLogout }) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'upload' | 'history'>('register');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Registration form state
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    age: '',
    gender: '',
    medicalHistory: ''
  });

  // Check if user has approved registration
  const hasApprovedRegistration = reports.some(r => 
    r.registrationStatus === RegistrationStatus.APPROVED
  );

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.age || !formData.gender) {
      alert('Please fill in all required fields');
      return;
    }

    // Call API to register patient
    const result = await registerPatient({
      name: formData.name,
      email: formData.email,
      age: parseInt(formData.age),
      gender: formData.gender,
      medicalHistory: formData.medicalHistory
    });

    if (result.success) {
      const registrationReport: Report = {
        id: result.data?.id || `REG-${Math.floor(Math.random() * 9000) + 1000}`,
        patientId: user.id,
        patientName: formData.name,
        patientEmail: formData.email,
        patientAge: parseInt(formData.age),
        patientGender: formData.gender,
        medicalHistory: formData.medicalHistory,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: ReportStatus.PENDING_REGISTRATION,
        registrationStatus: RegistrationStatus.PENDING
      };

      onSaveReport(registrationReport);
      setFormData({ name: '', email: '', age: '', gender: '', medicalHistory: '' });
      alert('Registration submitted successfully. Awaiting lab approval.');
      setActiveTab('history');
    } else {
      alert('Registration failed: ' + result.error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.fastq', '.fq', '.fastq.gz', '.fq.gz', '.fasta', '.fa', '.gz'];
      const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValid) {
        alert('Please select a valid FASTQ or FASTA file (.fastq, .fq, .fasta, .fa, .gz)');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const reportId = `RS-${Math.floor(Math.random() * 9000) + 1000}`;
      
      // Upload file to server with progress tracking
      const result = await uploadFastqFile(
        selectedFile,
        reportId,
        user.id,
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );
      
      if (result.success) {
        const newReport: Report = {
          id: result.data?.id || reportId,
          patientId: user.id,
          patientName: user.name,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: ReportStatus.PENDING_ANALYSIS,
          fileName: selectedFile.name,
          // Store file data in report for later analysis
          ...(selectedFile && { fileData: selectedFile } as any)
        };
        
        onSaveReport(newReport);
        setUploadProgress(100);
        
        // Initialize WebSocket connection for real-time updates
        if (!wsService.isConnected()) {
          try {
            await wsService.connect();
          } catch (error) {
            console.warn('WebSocket connection failed, will use polling instead');
          }
        }
        
        setIsUploading(false);
        setSelectedFile(null);
        setActiveTab('history');
        alert('Sequence data uploaded successfully. Analysis will begin shortly.');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      setIsUploading(false);
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header user={user} onLogout={onLogout} accent="bg-[#10B981]" />
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {!selectedReport ? (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter">Welcome, {user.name}</h2>
                <p className="text-gray-500 font-mono text-sm mt-2">SECURE PATIENT ACCESS // TERMINAL_03</p>
              </div>
              <div className="flex gap-2 border-brutal p-1 bg-white">
                 <button onClick={() => setActiveTab('register')} className={`px-4 py-2 text-xs font-black uppercase ${activeTab === 'register' ? 'bg-black text-white' : ''}`}>Register</button>
                 <button onClick={() => setActiveTab('upload')} disabled={!hasApprovedRegistration} className={`px-4 py-2 text-xs font-black uppercase ${activeTab === 'upload' ? 'bg-black text-white' : ''} ${!hasApprovedRegistration ? 'opacity-50 cursor-not-allowed' : ''}`}>Upload</button>
                 <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-xs font-black uppercase ${activeTab === 'history' ? 'bg-black text-white' : ''}`}>History</button>
              </div>
            </div>

            {activeTab === 'register' ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8">
                  <div className="border-brutal bg-white p-12 shadow-brutal">
                    <h3 className="text-2xl font-black uppercase mb-8">Patient Registration</h3>
                    
                    <form onSubmit={handleRegistration} className="space-y-6">
                      <div>
                        <label className="block text-sm font-black uppercase text-gray-700 mb-2">Full Name <span className="text-red-600">*</span></label>
                        <input 
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Enter your full name"
                          className="w-full px-4 py-3 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-black uppercase text-gray-700 mb-2">Email Address <span className="text-red-600">*</span></label>
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="Enter your email address"
                          className="w-full px-4 py-3 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-black uppercase text-gray-700 mb-2">Age <span className="text-red-600">*</span></label>
                        <input 
                          type="number" 
                          min="1"
                          max="150"
                          value={formData.age}
                          onChange={(e) => setFormData({...formData, age: e.target.value})}
                          placeholder="Enter your age"
                          className="w-full px-4 py-3 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-black uppercase text-gray-700 mb-2">Gender <span className="text-red-600">*</span></label>
                        <select 
                          value={formData.gender}
                          onChange={(e) => setFormData({...formData, gender: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-black uppercase text-gray-700 mb-2">Medical History</label>
                        <textarea 
                          value={formData.medicalHistory}
                          onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
                          placeholder="Any relevant medical conditions, allergies, medications, etc."
                          className="w-full px-4 py-3 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-none h-24"
                        />
                      </div>

                      <BrutalButton 
                        type="submit"
                        className="w-full bg-black text-white py-4 shadow-brutal hover:bg-[#10B981]"
                      >
                        Submit Registration →
                      </BrutalButton>
                    </form>
                  </div>
                </div>

                <div className="md:col-span-4 space-y-6">
                   <div className="border-brutal bg-[#10B981] text-white p-6">
                      <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2">
                        <AlertCircle size={16} />
                        Registration Status
                      </h4>
                      <div className="space-y-2 text-sm">
                         <p className="font-mono text-xs">Before uploading sequence data, you must complete your patient registration. The lab will review your information and either approve or decline your request.</p>
                         <div className="border-t border-white/30 mt-4 pt-4">
                           <p className="text-[10px] font-black uppercase mb-1">Step 1: Fill Registration Form</p>
                           <p className="text-[10px] font-black uppercase mb-1">Step 2: Lab Review</p>
                           <p className="text-[10px] font-black uppercase mb-1">Step 3: Upload Sequence</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : activeTab === 'upload' ? (
              !hasApprovedRegistration ? (
                <div className="border-brutal bg-yellow-50 border-yellow-300 p-8 text-center space-y-4">
                  <AlertCircle size={48} className="mx-auto text-yellow-600" />
                  <h3 className="text-xl font-black uppercase text-yellow-700">Registration Required</h3>
                  <p className="text-yellow-600 max-w-md mx-auto">Your registration request is pending lab approval. Once approved, you'll be able to upload sequence files.</p>
                  <BrutalButton onClick={() => setActiveTab('history')} className="bg-yellow-600 text-white border-none">
                    Check Status
                  </BrutalButton>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-8">
                    <div className="border-brutal bg-white p-12 shadow-brutal flex flex-col items-center text-center">
                      <h3 className="text-2xl font-black uppercase mb-6">Sequence Data Ingestion</h3>
                      <label className="w-full border-2 border-dashed border-black bg-gray-50 p-16 flex flex-col items-center group cursor-pointer hover:bg-gray-100 transition-colors mb-8">
                        <div className="w-20 h-20 bg-black text-white border-brutal flex items-center justify-center mb-6">
                          {isUploading ? <Activity className="animate-spin" /> : <Upload size={32} />}
                        </div>
                        <p className="font-black uppercase tracking-widest text-lg">
                          {selectedFile ? selectedFile.name : 'Upload FASTQ/FASTA File'}
                        </p>
                        <p className="text-xs font-mono text-gray-400 mt-2">Supports .GZ, .FASTQ, .FASTA, .FQ, .FA</p>
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          className="hidden" 
                          accept=".fastq,.fq,.fasta,.fa,.fastq.gz,.fq.gz,.gz"
                          onChange={handleFileChange}
                        />
                      </label>
                      
                      {isUploading && uploadProgress < 100 && (
                        <div className="w-full mb-8">
                          <div className="relative h-2 w-full bg-gray-200 border-brutal">
                            <div className="absolute top-0 left-0 h-full bg-[#10B981] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <p className="text-xs font-mono text-gray-500 mt-2">{uploadProgress}% Complete</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 w-full text-left mb-8">
                        <div className="border-brutal p-4 bg-gray-50">
                          <span className="text-[10px] font-black text-gray-400 uppercase">File Selected</span>
                          <p className="text-xl font-black">{selectedFile ? '✓' : '−'}</p>
                        </div>
                        <div className="border-brutal p-4 bg-gray-50">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Status</span>
                          <p className="text-xl font-black text-[#10B981]">READY</p>
                        </div>
                      </div>

                      <BrutalButton 
                        onClick={handleFileUpload} 
                        disabled={isUploading || !selectedFile}
                        className={`w-full py-4 shadow-brutal ${
                          isUploading || !selectedFile
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-[#10B981]'
                        }`}
                      >
                        {isUploading ? `UPLOADING... ${uploadProgress}%` : 'Submit Analysis →'}
                      </BrutalButton>
                    </div>
                  </div>

                  <div className="md:col-span-4 space-y-6">
                     <StatBox label="Active Pipelines" value="03" sub="Analysis in progress" />
                     <div className="border-brutal bg-black text-white p-6">
                        <h4 className="font-black uppercase text-xs mb-4">Ingestion Logs</h4>
                        <div className="space-y-3 font-mono text-[10px]">
                           <div className="flex justify-between border-b border-white/10 pb-1">
                              <span>SESSION_ID</span>
                              <span>0X8F92</span>
                           </div>
                           <div className="flex justify-between border-b border-white/10 pb-1">
                              <span>ENCRYPTION</span>
                              <span>AES-256</span>
                           </div>
                           <div className="flex justify-between">
                              <span>NODE</span>
                              <span>#44-SECURE</span>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )
            ) : (
              <section>
                <h3 className="text-xl font-black uppercase mb-6 border-b-2 border-black pb-2">Request & Analysis History</h3>
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <div className="border-brutal bg-white p-12 text-center">
                      <p className="text-gray-400 font-bold uppercase">No records found on your account.</p>
                    </div>
                  ) : (
                    reports.map(r => (
                      <div 
                        key={r.id}
                        className="border-brutal bg-white p-6 shadow-brutal flex justify-between items-center group cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setSelectedReport(r)}
                      >
                        <div className="flex gap-6 items-center">
                          <div className="w-12 h-12 border-brutal flex items-center justify-center bg-black text-white">
                            <FileText />
                          </div>
                          <div>
                            <h4 className="font-black uppercase text-lg">{r.id}</h4>
                            <p className="text-xs font-mono text-gray-500">{r.timestamp}</p>
                            {r.registrationStatus && (
                              <p className="text-xs font-mono text-gray-500">Registration: {r.registrationStatus}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className={`text-[10px] font-black uppercase px-2 py-1 border border-black ${
                              r.status === ReportStatus.COMPLETED ? 'bg-black text-white' : 
                              r.status === ReportStatus.PENDING_REVIEW ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]' :
                              r.status === ReportStatus.PENDING_REGISTRATION ? 'bg-yellow-500 text-black border-yellow-500' :
                              'bg-white text-black'
                            }`}>
                              {r.status.replace('_', ' ')}
                            </span>
                          </div>
                          <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <button onClick={() => setSelectedReport(null)} className="flex items-center gap-2 font-black uppercase text-xs hover:underline">
              &larr; Back to Records
            </button>
            
            <div className="border-brutal bg-white shadow-brutal overflow-hidden">
              <div className="bg-black text-white p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Case Report: {selectedReport.id}</h2>
                    <p className="font-mono text-xs opacity-60 mt-2">TIMESTAMP: {selectedReport.timestamp} // PATIENT_ID: {user.id}</p>
                  </div>
                  {selectedReport.status === ReportStatus.COMPLETED && (
                    <BrutalButton onClick={() => handleDownloadPDF(selectedReport.id)} className="bg-[#10B981] text-white border-none text-xs">Download PDF</BrutalButton>
                  )}
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  {selectedReport.status === ReportStatus.PENDING_ANALYSIS ? (
                    <div className="border-brutal p-12 text-center bg-gray-50 space-y-4">
                       <Activity className="mx-auto text-gray-400 animate-pulse" size={48} />
                       <h3 className="text-xl font-black uppercase">Sequencing in Progress</h3>
                       <p className="text-sm text-gray-500 max-w-md mx-auto">Your sequence data has been ingested and is currently in the Lab Analysis queue. You will be notified when the raw results are ready for medical review.</p>
                    </div>
                  ) : (
                    <>
                      <section>
                        <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2 mb-4">Genetic Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 border-brutal">
                            <p className="text-[10px] font-black uppercase text-gray-400">Analysis Type</p>
                            <p className="font-bold">Whole Exome Seq</p>
                          </div>
                          <div className="p-4 bg-gray-50 border-brutal">
                            <p className="text-[10px] font-black uppercase text-gray-400">Total Reads</p>
                            <p className="font-bold">{selectedReport.analysisData?.stats.totalReads.toLocaleString() || '---'}</p>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2 mb-4">Medical Assessment</h3>
                        {selectedReport.status === ReportStatus.COMPLETED ? (
                          <div className="p-6 border-brutal bg-[#10B981]/10 space-y-4">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 size={20} className="text-[#10B981]" />
                              <span className="font-black uppercase">Review Completed</span>
                            </div>
                            <p className="font-bold text-lg">Diagnosis: {selectedReport.diagnosis}</p>
                            <p className="text-sm italic leading-relaxed font-mono">"{selectedReport.doctorNotes}"</p>
                          </div>
                        ) : (
                          <div className="p-6 border-brutal border-dashed text-center">
                            <p className="text-gray-400 font-bold uppercase">Pending Clinical Review by Dr. Sarah Chen</p>
                            <p className="text-[10px] mt-2 font-mono">LAB_ANALYSIS: COMPLETED</p>
                          </div>
                        )}
                      </section>
                    </>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="border-brutal p-6 bg-white">
                    <h3 className="text-xs font-black uppercase mb-4 tracking-wider">Pipeline Status</h3>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 size={16} className="text-[#10B981]" />
                          <span className="text-[10px] font-bold uppercase">Ingestion</span>
                       </div>
                       <div className="flex items-center gap-3">
                          {selectedReport.status !== ReportStatus.PENDING_ANALYSIS ? <CheckCircle2 size={16} className="text-[#10B981]" /> : <Activity size={16} className="text-gray-300 animate-spin" />}
                          <span className={`text-[10px] font-bold uppercase ${selectedReport.status === ReportStatus.PENDING_ANALYSIS ? 'text-black' : 'text-gray-400'}`}>Lab Analysis</span>
                       </div>
                       <div className="flex items-center gap-3">
                          {selectedReport.status === ReportStatus.COMPLETED ? <CheckCircle2 size={16} className="text-[#10B981]" /> : <div className="w-4 h-4 border border-gray-200" />}
                          <span className={`text-[10px] font-bold uppercase ${selectedReport.status === ReportStatus.PENDING_REVIEW ? 'text-black' : 'text-gray-400'}`}>Clinical Review</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientPortal;
