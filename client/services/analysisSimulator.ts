
import { AnalysisResult, ClusterPoint, FastqStats } from '../types';

export const generateMockAnalysis = (): AnalysisResult => {
  // Mock Stats
  const totalReads = 25000 + Math.floor(Math.random() * 5000);
  const avgQuality = 34.2 + Math.random() * 2;
  const gcContent = 42 + Math.random() * 10;

  const readLengthDist = Array.from({ length: 15 }, (_, i) => ({
    length: 100 + i * 10,
    count: Math.floor(Math.random() * 500) + 100
  }));

  const qualityDist = Array.from({ length: 41 }, (_, i) => ({
    score: i,
    count: i < 20 ? Math.floor(Math.random() * 50) : Math.floor(Math.pow(i - 20, 2) * 5)
  }));

  const perBaseQuality = Array.from({ length: 150 }, (_, i) => ({
    pos: i + 1,
    score: 30 + Math.sin(i / 10) * 5 + Math.random() * 2
  }));

  const stats: FastqStats = {
    totalReads,
    avgQuality,
    gcContent,
    readLengthDist,
    qualityDist,
    perBaseQuality
  };

  // Mock Clusters (UMAP points)
  const clusters: ClusterPoint[] = [];
  const numClusters = 5;
  for (let c = 0; c < numClusters; c++) {
    const centerX = Math.random() * 20 - 10;
    const centerY = Math.random() * 20 - 10;
    const pointsInCluster = 50 + Math.floor(Math.random() * 100);
    for (let p = 0; p < pointsInCluster; p++) {
      clusters.push({
        x: centerX + (Math.random() - 0.5) * 4,
        y: centerY + (Math.random() - 0.5) * 4,
        clusterId: c,
        sequenceId: `SEQ_${c}_${p}`
      });
    }
  }

  // Mock Similarity Matrix
  const similarityMatrix = Array.from({ length: numClusters }, (_, i) =>
    Array.from({ length: numClusters }, (_, j) => (i === j ? 1 : Math.random() * 0.4))
  );

  return {
    stats,
    clusters,
    similarityMatrix,
    clusterNames: ['Cluster 0', 'Cluster 1', 'Cluster 2', 'Cluster 3', 'Cluster 4']
  };
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
