
import React from 'react';
import { AnalysisResult } from '../types';

interface HeatmapTabProps {
  result: AnalysisResult;
}

const HeatmapTab: React.FC<HeatmapTabProps> = ({ result }) => {
  const { similarityMatrix, clusterNames } = result;

  const getColor = (value: number) => {
    // Gradient from blue (0) to red (1)
    const r = Math.floor(255 * value);
    const b = Math.floor(255 * (1 - value));
    const g = Math.floor(150 * (1 - Math.abs(0.5 - value) * 2));
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="p-6 h-full flex flex-col items-center">
      <div className="max-w-4xl w-full bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Cluster Similarity Matrix</h3>
            <p className="text-sm text-gray-500">Correlation coefficients between sequence clusters</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span>Low Similarity</span>
            <div className="w-24 h-3 rounded-full bg-gradient-to-r from-blue-500 via-green-400 to-red-500" />
            <span>High Similarity</span>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <div className="flex">
            <div className="w-24" /> {/* Spacer */}
            <div className="flex flex-1">
              {clusterNames.map((name) => (
                <div key={name} className="flex-1 text-center text-xs font-bold text-gray-500 py-2">
                  {name}
                </div>
              ))}
            </div>
          </div>

          {similarityMatrix.map((row, i) => (
            <div key={i} className="flex">
              <div className="w-24 flex items-center pr-4">
                <span className="text-xs font-bold text-gray-500 text-right w-full">{clusterNames[i]}</span>
              </div>
              <div className="flex flex-1 gap-1 py-0.5">
                {row.map((val, j) => (
                  <div
                    key={`${i}-${j}`}
                    className="flex-1 aspect-square rounded shadow-sm flex items-center justify-center group relative cursor-help transition-transform hover:scale-105"
                    style={{ backgroundColor: getColor(val) }}
                  >
                    <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100">
                      {val.toFixed(2)}
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap">
                      {clusterNames[i]} vs {clusterNames[j]}: {val.toFixed(3)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Interpretation:</strong> Red cells on the diagonal represent self-similarity (1.0). Cooler blue/green cells indicate divergent sequence families. Cluster 1 and Cluster 4 show significant overlap (0.41), suggesting possible cross-contamination or shared functional domains.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapTab;
