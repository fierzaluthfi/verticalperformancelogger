import { GPSPoint, RouteSegment, SpeedSectorType, SpeedThresholds } from '../types/touring';

// Warna spesifik yang diminta: Cepat = Merah, Normal = Hijau, Lambat = Oranye
export const SECTOR_COLORS = {
  slow: '#F97316',   // Oranye (Lambat / Macet / Tanjakan Terjal)
  normal: '#22C55E', // Hijau (Normal / Kecepatan Standar)
  fast: '#EF4444',   // Merah (Cepat / Ngebut)
};

export const DEFAULT_THRESHOLDS: SpeedThresholds = {
  slowMax: 30, // Kecepatan di bawah 30 km/h dianggap lambat (Oren)
  fastMin: 70, // Kecepatan di atas 70 km/h dianggap cepat (Merah)
};

/**
 * Menentukan sektor kecepatan dan warnanya berdasarkan batas (thresholds)
 */
export function getSpeedSector(speed: number, thresholds: SpeedThresholds): { sector: SpeedSectorType; color: string } {
  if (speed >= thresholds.fastMin) {
    return { sector: 'fast', color: SECTOR_COLORS.fast };
  } else if (speed <= thresholds.slowMax) {
    return { sector: 'slow', color: SECTOR_COLORS.slow };
  } else {
    return { sector: 'normal', color: SECTOR_COLORS.normal };
  }
}

/**
 * Rumus Haversine untuk menghitung jarak antara 2 koordinat bumi (dalam meter)
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format detik menjadi format waktu jam:menit:detik (HH:MM:SS)
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format jarak ke kilometer
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(2)} km`;
}

/**
 * Konversi kecepatan m/s ke km/h
 */
export function msToKmh(ms: number | null | undefined): number {
  if (!ms || ms < 0) return 0;
  return ms * 3.6;
}

/**
 * Hitung bearing / arah derajat rotasi ikon motor
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}
