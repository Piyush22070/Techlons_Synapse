
import React from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { AnalysisResult } from '../types';

interface ClusteringTabProps {
  result: AnalysisResult;
}

const BRUTAL_COLORS = ['#000000', '#444444', '#777777', '#AAAAAA', '#DDDDDD'];

const ClusteringTab: React.FC<ClusteringTabProps> = ({ result }) => {
  return (
    <div className="p-8 space-y-8">
      <div className="border-brutal bg-white p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter">UMAP Projection</h3>
            <p className="text-[10px] font-mono uppercase text-gray-400">Embedding: DNABERT-2 // Projection: 2D-Manifold</p>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-black uppercase border border-black px-2 py-0.5">N={result.clusters.length}</span>
          </div>
        </div>
        
        <div className="h-[500px] border-brutal bg-gray-50 relative overflow-hidden">
           <div className="absolute top-4 left-4 border border-black px-2 py-1 text-[8px] font-black bg-white z-10">UMAP-1</div>
           <div className="absolute bottom-4 right-4 border border-black px-2 py-1 text-[8px] font-black bg-white z-10">UMAP-2</div>
           
           <ResponsiveContainer width="100%" height="100%">
             <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="10 10" stroke="#ddd" />
                <XAxis type="number" dataKey="x" hide />
                <YAxis type="number" dataKey="y" hide />
                <ZAxis type="number" range={[40, 40]} />
                <Tooltip 
                  cursor={{ stroke: 'black', strokeWidth: 1, strokeDasharray: '5 5' }}
                  contentStyle={{ border: '2px solid black', borderRadius: '0', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Scatter name="Sequences" data={result.clusters}>
                  {result.clusters.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={BRUTAL_COLORS[entry.clusterId % BRUTAL_COLORS.length]} 
                      stroke="black"
                      strokeWidth={1}
                    />
                  ))}
                </Scatter>
             </ScatterChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ClusteringTab;
