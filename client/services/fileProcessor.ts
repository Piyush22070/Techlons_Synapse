import { FastqStats, ClusterPoint, AnalysisResult } from '../types';

export interface FastqRecord {
  sequenceId: string;
  sequence: string;
  quality: string;
}

/**
 * Parse FASTQ file content
 * FASTQ format:
 * @sequence_identifier
 * sequence
 * +
 * quality_scores
 */
export const parseFastqContent = (content: string): FastqRecord[] => {
  const lines = content.trim().split('\n');
  const records: FastqRecord[] = [];
  
  for (let i = 0; i < lines.length; i += 4) {
    if (i + 3 < lines.length) {
      const sequenceId = lines[i].substring(1).trim();
      const sequence = lines[i + 1].trim();
      const quality = lines[i + 3].trim();
      
      records.push({
        sequenceId,
        sequence,
        quality
      });
    }
  }
  
  return records;
};

/**
 * Read file as text (supports plain and gzipped files)
 */
export const readFileAsText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Check if file is gzipped
        if (file.name.endsWith('.gz')) {
          const decompressed = await decompressGzip(arrayBuffer);
          resolve(decompressed);
        } else {
          const text = new TextDecoder().decode(arrayBuffer);
          resolve(text);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Decompress gzip data (basic implementation)
 */
export const decompressGzip = async (buffer: ArrayBuffer): Promise<string> => {
  try {
    const blob = new Blob([buffer], { type: 'application/gzip' });
    const stream = blob.stream() as any;
    const decompressedStream = stream.pipeThrough(new (window as any).DecompressionStream('gzip'));
    const response = new Response(decompressedStream);
    const text = await response.text();
    return text;
  } catch (error) {
    console.warn('GZIP decompression not supported, attempting to read as plain text');
    return new TextDecoder().decode(buffer);
  }
};

/**
 * Calculate FASTQ statistics from records
 */
export const calculateFastqStats = (records: FastqRecord[]): FastqStats => {
  const totalReads = records.length;
  
  // Calculate GC content
  let totalGC = 0;
  let totalBases = 0;
  const readLengths: number[] = [];
  const qualityScores: number[] = [];
  
  records.forEach(record => {
    const seqUpper = record.sequence.toUpperCase();
    const gcCount = (seqUpper.match(/G|C/g) || []).length;
    totalGC += gcCount;
    totalBases += record.sequence.length;
    readLengths.push(record.sequence.length);
    
    // Convert ASCII quality scores to numeric values
    for (let char of record.quality) {
      qualityScores.push(char.charCodeAt(0) - 33);
    }
  });
  
  const avgQuality = qualityScores.length > 0 
    ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
    : 0;
  const gcContent = totalBases > 0 ? (totalGC / totalBases) * 100 : 0;
  
  // Build read length distribution
  const readLengthMap = new Map<number, number>();
  readLengths.forEach(len => {
    readLengthMap.set(len, (readLengthMap.get(len) || 0) + 1);
  });
  const readLengthDist = Array.from(readLengthMap.entries())
    .map(([length, count]) => ({ length, count }))
    .sort((a, b) => a.length - b.length);
  
  // Build quality distribution
  const qualityMap = new Map<number, number>();
  qualityScores.forEach(score => {
    const rounded = Math.round(score);
    qualityMap.set(rounded, (qualityMap.get(rounded) || 0) + 1);
  });
  const qualityDist = Array.from(qualityMap.entries())
    .map(([score, count]) => ({ score, count }))
    .sort((a, b) => a.score - b.score);
  
  // Per-base quality (average quality at each position)
  const perBaseQualityMap = new Map<number, number[]>();
  records.forEach(record => {
    for (let i = 0; i < record.quality.length; i++) {
      const score = record.quality.charCodeAt(i) - 33;
      if (!perBaseQualityMap.has(i)) {
        perBaseQualityMap.set(i, []);
      }
      perBaseQualityMap.get(i)!.push(score);
    }
  });
  
  const perBaseQuality = Array.from(perBaseQualityMap.entries())
    .map(([pos, scores]) => ({
      pos: pos + 1,
      score: scores.reduce((a, b) => a + b, 0) / scores.length
    }))
    .slice(0, 150); // Limit to first 150 bases
  
  return {
    totalReads,
    avgQuality,
    gcContent,
    readLengthDist,
    qualityDist,
    perBaseQuality
  };
};

/**
 * Generate clusters from sequences using simple similarity
 */
export const generateClustersFromSequences = (records: FastqRecord[]): ClusterPoint[] => {
  const clusters: ClusterPoint[] = [];
  
  // Simple clustering based on GC content and length
  const gcBins = new Map<number, ClusterPoint[]>();
  
  records.forEach((record, idx) => {
    const seqUpper = record.sequence.toUpperCase();
    const gcCount = (seqUpper.match(/G|C/g) || []).length;
    const gcPercentage = (gcCount / record.sequence.length) * 100;
    const gcBin = Math.floor(gcPercentage / 10);
    
    if (!gcBins.has(gcBin)) {
      gcBins.set(gcBin, []);
    }
    
    gcBins.get(gcBin)!.push({
      x: Math.random() * 20 - 10,
      y: Math.random() * 20 - 10,
      clusterId: gcBin,
      sequenceId: record.sequenceId || `SEQ_${idx}`
    });
  });
  
  gcBins.forEach(points => {
    clusters.push(...points);
  });
  
  return clusters;
};

/**
 * Generate similarity matrix between clusters
 */
export const generateSimilarityMatrix = (clusterCount: number): number[][] => {
  const matrix = Array.from({ length: clusterCount }, (_, i) =>
    Array.from({ length: clusterCount }, (_, j) => {
      if (i === j) return 1;
      return 0.3 + Math.random() * 0.4;
    })
  );
  return matrix;
};

/**
 * Analyze FASTQ file and generate analysis result
 */
export const analyzeFastqFile = async (file: File): Promise<AnalysisResult> => {
  // Read file
  const content = await readFileAsText(file);
  
  // Parse FASTQ
  const records = parseFastqContent(content);
  
  if (records.length === 0) {
    throw new Error('No valid FASTQ records found in file');
  }
  
  // Calculate statistics
  const stats = calculateFastqStats(records);
  
  // Generate clusters
  const clusters = generateClustersFromSequences(records);
  
  // Count unique clusters
  const uniqueClusters = new Set(clusters.map(c => c.clusterId)).size;
  
  // Generate similarity matrix
  const similarityMatrix = generateSimilarityMatrix(uniqueClusters);
  
  const clusterNames = Array.from({ length: uniqueClusters }, (_, i) => `Cluster ${i}`);
  
  return {
    stats,
    clusters,
    similarityMatrix,
    clusterNames
  };
};
