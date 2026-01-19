
export type UserRole = 'LAB' | 'PATIENT' | 'DOCTOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  patientData?: {
    age: number;
    gender: string;
    history: string[];
    assignedDoctorId: string;
  };
}

export enum RegistrationStatus {
  PENDING = 'PENDING',           // Awaiting lab approval
  APPROVED = 'APPROVED',         // Lab approved
  REJECTED = 'REJECTED'          // Lab rejected
}

export enum ReportStatus {
  PENDING_REGISTRATION = 'PENDING_REGISTRATION', // Patient registered, awaiting lab approval
  PENDING_ANALYSIS = 'PENDING_ANALYSIS',         // After registration approved & patient uploads
  PENDING_REVIEW = 'PENDING_REVIEW',             // After Lab analyzes
  COMPLETED = 'COMPLETED'                        // After Doctor reviews
}

export interface FastqStats {
  totalReads: number;
  avgQuality: number;
  gcContent: number;
  readLengthDist: { length: number; count: number }[];
  qualityDist: { score: number; count: number }[];
  perBaseQuality: { pos: number; score: number }[];
}

export interface ClusterPoint {
  x: number;
  y: number;
  clusterId: number;
  sequenceId: string;
}

export interface AnalysisResult {
  stats: FastqStats;
  clusters: ClusterPoint[];
  similarityMatrix: number[][];
  clusterNames: string[];
}

export interface Anomaly {
  id: string;
  type: string;
  location: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface Report {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  medicalHistory?: string;
  labTechId?: string;
  doctorId?: string;
  timestamp: string;
  registrationStatus?: RegistrationStatus;
  registrationNotes?: string;
  status: ReportStatus;
  analysisData?: AnalysisResult;
  doctorNotes?: string;
  diagnosis?: string;
  anomalies?: Anomaly[];
  severity?: number;
  fileName?: string;
}

export enum AnalysisStepStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface AnalysisStep {
  id: string;
  label: string;
  status: AnalysisStepStatus;
}
