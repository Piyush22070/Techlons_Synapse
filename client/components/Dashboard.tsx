
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { AnalysisResult } from '../types';
import { StatBox } from './CommonUI';

interface DashboardProps {
  /* Use the newly exported AnalysisResult type */
  result: AnalysisResult;
}

const Dashboard: React.FC<DashboardProps> = ({ result }) => {
  const { stats } = result;

  return (
    <div className="p-8 space-y-8 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatBox label="Total Reads" value={stats.totalReads.toLocaleString()} sub="Genomic units" />
        <StatBox label="Avg Quality" value={stats.avgQuality.toFixed(1)} sub="Phred Score (Q)" />
        <StatBox label="GC Content" value={`${stats.gcContent.toFixed(1)}%`} sub="Nucleotide ratio" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border-brutal p-8 bg-white">
          <h3 className="text-sm font-black uppercase mb-8 border-b-2 border-black pb-2">Quality Distribution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.qualityDist}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="score" fontSize={10} fontStyle="italic" />
                <YAxis fontSize={10} fontStyle="italic" />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }}
                  contentStyle={{ border: '2px solid black', borderRadius: '0', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border-brutal p-8 bg-white">
          <h3 className="text-sm font-black uppercase mb-8 border-b-2 border-black pb-2">Sequence Quality Heat</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.perBaseQuality}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="pos" fontSize={10} hide />
                <YAxis fontSize={10} domain={[20, 40]} />
                <Tooltip contentStyle={{ border: '2px solid black', borderRadius: '0' }} />
                <Area type="step" dataKey="score" stroke="#000" fill="#000" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
