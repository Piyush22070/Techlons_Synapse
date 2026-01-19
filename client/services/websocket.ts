export interface AnalysisProgress {
  status: string;
  progress: number;
  stage: string;
  message: string;
  data?: any;
}

export type AnalysisProgressCallback = (progress: AnalysisProgress) => void;
export type ErrorCallback = (error: Error) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private listeners: Map<string, AnalysisProgressCallback[]> = new Map();
  private errorCallbacks: ErrorCallback[] = [];

  /**
   * Connect to WebSocket server
   */
  connect(url: string = 'wss://piuss-biosenetinel-server.hf.space/ws'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.errorCallbacks.forEach(cb => cb(new Error('WebSocket connection error')));
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.handleReconnect(url);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(url).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.errorCallbacks.forEach(cb => cb(new Error('Failed to reconnect to server')));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any) {
    const { type, jobId, ...rest } = data;
    
    if (type === 'analysis_progress' && jobId) {
      const callbacks = this.listeners.get(jobId) || [];
      callbacks.forEach(callback => callback(rest as AnalysisProgress));
    }
  }

  /**
   * Subscribe to analysis progress updates
   */
  subscribeToAnalysis(jobId: string, callback: AnalysisProgressCallback): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, []);
    }
    
    const callbacks = this.listeners.get(jobId)!;
    callbacks.push(callback);

    // Send subscription message to server
    this.send({
      type: 'subscribe',
      jobId: jobId
    });

    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(jobId);
        // Send unsubscribe message
        this.send({
          type: 'unsubscribe',
          jobId: jobId
        });
      }
    };
  }

  /**
   * Subscribe to error events
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Send message to server
   */
  send(data: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  }

  /**
   * Close WebSocket connection
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.errorCallbacks = [];
  }

  /**
   * Get connection state
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

/**
 * Helper function to simulate analysis stages when WebSocket is not available
 */
export const simulateAnalysisProgress = async (
  callback: AnalysisProgressCallback,
  duration: number = 10000
): Promise<void> => {
  const stages = [
    { status: 'reading', progress: 10, stage: 'Reading Sequences', message: 'Loading FASTQ file...' },
    { status: 'embedding', progress: 30, stage: 'Generating AI Embeddings', message: 'Processing with DNABERT-2...' },
    { status: 'clustering', progress: 50, stage: 'Running UMAP & HDBSCAN', message: 'Performing dimensionality reduction...' },
    { status: 'clustering', progress: 70, stage: 'Clustering Complete', message: 'Identifying sequence clusters...' },
    { status: 'verification', progress: 85, stage: 'Starting NCBI Verification', message: 'Verifying against database...' },
    { status: 'complete', progress: 100, stage: 'Analysis Complete', message: 'All processing finished!' }
  ];

  const stageDelay = duration / stages.length;

  for (const stage of stages) {
    await new Promise(resolve => setTimeout(resolve, stageDelay));
    callback(stage);
  }
};
