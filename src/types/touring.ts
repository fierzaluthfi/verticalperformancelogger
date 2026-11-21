export type SpeedSectorType = 'slow' | 'normal' | 'fast';

export interface GPSPoint {
  lat: number;
  lng: number;
  altitude: number | null; // meters
  speed: number;           // km/h
  heading: number | null;  // degrees
  accuracy: number;        // meters
  timestamp: number;       // epoch ms
}

export interface RouteSegment {
  start: GPSPoint;
  end: GPSPoint;
  speed: number;           // avg speed on this segment (km/h)
  distance: number;        // meters
  sector: SpeedSectorType; // 'slow' | 'normal' | 'fast'
  color: string;           // '#F97316' (oren) | '#22C55E' (hijau) | '#EF4444' (merah)
}

export interface SpeedThresholds {
  slowMax: number;   // e.g. < 30 km/h = Oren (Lambat / Macet / Tanjakan Terjal)
  fastMin: number;   // e.g. > 70 km/h = Merah (Cepat / Geber Gas)
  // Di antara 30 dan 70 km/h = Hijau (Normal)
}

export interface TouringStats {
  currentSpeed: number;    // km/h
  avgSpeed: number;        // km/h
  maxSpeed: number;        // km/h
  totalDistance: number;   // kilometers
  totalTimeSeconds: number;// seconds
  movingTimeSeconds: number;
  elevation: number;       // meters
  altitudeGain: number;    // meters
  sectorSlowDistance: number; // km
  sectorNormalDistance: number; // km
  sectorFastDistance: number; // km
}

export interface TouringSession {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  points: GPSPoint[];
  segments: RouteSegment[];
  stats: TouringStats;
  thresholds: SpeedThresholds;
  notes?: string;
}

export type TrackingStatus = 'idle' | 'recording' | 'paused' | 'finished';
