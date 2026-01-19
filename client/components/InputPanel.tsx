
import React, { useState, useRef } from 'react';
import { Icons, COLORS } from '../constants';

interface InputPanelProps {
  onStartAnalysis: (input: string | File) => void;
  isAnalyzing: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({ onStartAnalysis, isAnalyzing }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [textInput, setTextInput] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.fastq', '.fq', '.fastq.gz', '.fq.gz'];
      const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValid) {
        alert('Please select a valid FASTQ file (.fastq, .fq, .fastq.gz, .fq.gz)');
        return;
      }
      
      setFileName(file.name);
      setSelectedFile(file);
    }
  };

  const handleStart = () => {
    if (activeTab === 'upload') {
      if (!selectedFile) {
        alert('Please select a FASTQ file');
        return;
      }
      onStartAnalysis(selectedFile);
    } else {
      if (!textInput.trim()) {
        alert('Please enter FASTQ data');
        return;
      }
      onStartAnalysis(textInput);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-hidden">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Input Data</h2>

      <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'upload' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            File Upload
          </div>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'text' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Text Input
          </div>
        </button>
      </div>

      <div className="flex-1 min-h-[300px] mb-6 relative">
        {activeTab === 'upload' ? (
          <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Icons.Upload />
              <p className="mt-4 text-sm font-medium text-gray-600 group-hover:text-teal-600 transition-colors">
                {fileName ? fileName : 'Click to browse or drag and drop'}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Supports .fastq, .fq, .fastq.gz, .fq.gz
              </p>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".fastq,.fq,.fastq.gz,.fq.gz,.gz" 
              onChange={handleFileChange} 
            />
          </label>
        ) : (
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="@SEQ_ID&#10;GATTTGGGGTTCAAAGCAGTATCGATCAAATAGTAAATCCATTTGTTCAACTCACAGTTT&#10;+&#10;!''*((((***+))%%%++)(%%%%).1***-+*''))**55CCF>>>>>>CCCCCCC65"
            className="w-full h-full p-4 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        )}
      </div>

      <button
        onClick={handleStart}
        disabled={isAnalyzing}
        className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all shadow-md active:scale-[0.98] ${
          isAnalyzing ? 'bg-teal-300 cursor-not-allowed' : 'bg-[#14B8A6] hover:bg-[#0D9488]'
        }`}
      >
        {isAnalyzing ? (
          <div className="flex items-center justify-center gap-2">
            <Icons.Spinner className="w-5 h-5 text-white" />
            Analyzing...
          </div>
        ) : (
          'Start Analysis'
        )}
      </button>
    </div>
  );
};

export default InputPanel;
