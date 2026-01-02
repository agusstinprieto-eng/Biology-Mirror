
export enum CheckInStage {
  PRE = 'PRE',
  POST = 'POST'
}

export interface FACSVector {
  AU1: number;  // Inner Brow Raiser
  AU4: number;  // Brow Lowerer
  AU6: number;  // Cheek Raiser
  AU12: number; // Lip Corner Puller
  AU15: number; // Lip Corner Depressor
  AU17: number; // Chin Raiser
  AU20: number; // Lip Stretcher
  AU24: number; // Lip Pressor
}

export interface BioMetrics {
  heartRate: number;
  hrv: number; // RMSSD
  respirationRate: number;
}

export interface GazeMetrics {
  blinkRate: number;
  pui: number; // Pupil Unrest Index
  stability: number;
  fatigueIndex: number; // 0-100, where 100 is highly fatigued
}

export interface SkinAnalysis {
  homogeneity: number;
  redness: number;
  textureRoughness: number;
  skinVitality: number; // 0-100 score
}

export interface VoiceMetrics {
  pitch: number;
  jitter: number;
  speakingRate: number;
  energy: number;
}

export interface SessionData {
  id?: string;
  userId?: string;
  userName?: string;
  facs: FACSVector;
  bio: BioMetrics;
  gaze: GazeMetrics;
  skin: SkinAnalysis;
  voice?: VoiceMetrics;
  transcript: string;
  timestamp: string;
  stage?: 'PRE' | 'POST';
  videoUrl?: string;
}

export interface AssessmentResult {
  id?: string;
  neuroScore: number;
  keyShift: string;
  detailedAnalysis: string;
  visualCues: string[];
  recommendations?: string[];
  createdAt?: string;
}

export interface SessionPair {
  id: string;
  preSession: SessionData;
  postSession: SessionData;
  analysis?: AssessmentResult;
  createdAt: string;
}

export interface TrendData {
  date: string;
  hrv: number;
  neuroScore: number;
  heartRate: number;
}

export interface UserProfile {
  id: string;
  fullName?: string;
  email?: string;
  createdAt: string;
}
