
import React from 'react';
import { AnalysisStep, AnalysisStepStatus } from '../types';
import { Icons } from '../constants';

interface AnalysisLogsProps {
  steps: AnalysisStep[];
  progress: number;
}

const AnalysisLogs: React.FC<AnalysisLogsProps> = ({ steps, progress }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Analysis Logs</h2>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Overall Progress</span>
          <span className="text-xs font-bold text-teal-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className="bg-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center p-4 rounded-xl border transition-all ${
              step.status === AnalysisStepStatus.LOADING
                ? 'bg-teal-50 border-teal-100 shadow-sm'
                : step.status === AnalysisStepStatus.COMPLETED
                ? 'bg-white border-gray-100 opacity-80'
                : 'bg-gray-50 border-transparent text-gray-400'
            }`}
          >
            <div className="mr-4">
              {step.status === AnalysisStepStatus.LOADING ? (
                <Icons.Spinner className="text-teal-500" />
              ) : step.status === AnalysisStepStatus.COMPLETED ? (
                <div className="bg-green-100 rounded-full p-1">
                  <Icons.Check className="w-4 h-4 text-green-600" />
                </div>
              ) : (
                <Icons.Clock className="text-gray-300" />
              )}
            </div>
            <span className={`text-sm font-medium ${
              step.status === AnalysisStepStatus.LOADING ? 'text-teal-700' : 
              step.status === AnalysisStepStatus.COMPLETED ? 'text-gray-700' : 'text-gray-400'
            }`}>
              {step.label}
            </span>
            {step.status === AnalysisStepStatus.LOADING && (
              <span className="ml-auto flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-gray-50">
        <div className="text-[10px] text-gray-400 font-mono flex justify-between">
          <span>PIPELINE_ID: FASTQ_0912X</span>
          <span>MODE: AI_EMBEDDING_V2</span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisLogs;
