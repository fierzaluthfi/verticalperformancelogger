import { TouringSession, SpeedThresholds } from '../types/touring';
import { DEFAULT_THRESHOLDS } from './geo';

const SESSIONS_STORAGE_KEY = 'mototrack_sessions_v1';
const THRESHOLDS_STORAGE_KEY = 'mototrack_thresholds_v1';

export function saveSessions(sessions: TouringSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions to localStorage', e);
  }
}

export function loadSessions(): TouringSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sessions from localStorage', e);
    return [];
  }
}

export function saveThresholds(thresholds: SpeedThresholds): void {
  try {
    localStorage.setItem(THRESHOLDS_STORAGE_KEY, JSON.stringify(thresholds));
  } catch (e) {
    console.error('Failed to save thresholds', e);
  }
}

export function loadThresholds(): SpeedThresholds {
  try {
    const raw = localStorage.getItem(THRESHOLDS_STORAGE_KEY);
    if (!raw) return DEFAULT_THRESHOLDS;
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_THRESHOLDS;
  }
}
