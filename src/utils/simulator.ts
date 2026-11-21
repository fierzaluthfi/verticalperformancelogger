import { GPSPoint, RouteSegment, TouringSession, SpeedThresholds } from '../types/touring';
import { calculateDistanceMeters, getSpeedSector } from './geo';

/**
 * Generate simulasi rute touring motor yang menantang (ada tanjakan, tikungan, jalan lurus kencang)
 * Base location: Jalur Touring Puncak - Cipanas (pegunungan berliku & jalan raya)
 */
export function generateTouringCoursePoints(startLat = -6.7028, startLng = 106.9856): GPSPoint[] {
  const points: GPSPoint[] = [];
  let lat = startLat;
  let lng = startLng;
  let alt = 1100; // 1100m di atas permukaan laut
  let now = Date.now() - 3600 * 1000; // 1 jam yang lalu

  // Pola perjalanan touring:
  // Phase 1: Keluar dari start point / basecamp, jalan santai pemukiman (15-28 km/h) -> LAMBAT (OREN)
  // Phase 2: Masuk jalur aspal utama, kecepatan normal cruising (45-65 km/h) -> NORMAL (HIJAU)
  // Phase 3: Jalur lurus bypass / turunan kosong, geber gas kencang (75-98 km/h) -> CEPAT (MERAH)
  // Phase 4: Tikungan tajam beruntun / kelok sembilan di lereng bukit (20-29 km/h) -> LAMBAT (OREN)
  // Phase 5: Cruising santai meliuk di perbukitan teh (48-62 km/h) -> NORMAL (HIJAU)
  // Phase 6: Sprint kencang jalur lurus akhir (80-92 km/h) -> CEPAT (MERAH)
  // Phase 7: Finish & cooling down (22 km/h) -> LAMBAT (OREN)

  const phases = [
    { count: 12, speedRange: [18, 28], dLat: 0.0006, dLng: 0.0004, dAlt: 2 },   // Slow (Oren)
    { count: 22, speedRange: [42, 64], dLat: 0.0012, dLng: 0.0009, dAlt: 4 },   // Normal (Hijau)
    { count: 18, speedRange: [74, 96], dLat: 0.0020, dLng: 0.0015, dAlt: -3 },  // Fast (Merah)
    { count: 16, speedRange: [15, 27], dLat: 0.0005, dLng: -0.0008, dAlt: 8 },  // Slow (Oren)
    { count: 24, speedRange: [45, 68], dLat: 0.0014, dLng: 0.0011, dAlt: -5 },  // Normal (Hijau)
    { count: 15, speedRange: [78, 102], dLat: 0.0022, dLng: 0.0018, dAlt: -2 }, // Fast (Merah)
    { count: 10, speedRange: [16, 26], dLat: 0.0004, dLng: 0.0003, dAlt: 1 }    // Slow (Oren)
  ];

  phases.forEach((phase) => {
    for (let i = 0; i < phase.count; i++) {
      const speed = phase.speedRange[0] + Math.random() * (phase.speedRange[1] - phase.speedRange[0]);
      lat += phase.dLat + (Math.random() - 0.5) * 0.0002;
      lng += phase.dLng + (Math.random() - 0.5) * 0.0002;
      alt += phase.dAlt + (Math.random() - 0.5) * 2;
      now += 3000; // setiap 3 detik per titik

      points.push({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        altitude: Number(alt.toFixed(1)),
        speed: Number(speed.toFixed(1)),
        heading: Math.floor(Math.random() * 360),
        accuracy: 3 + Math.random() * 2,
        timestamp: now
      });
    }
  });

  return points;
}

/**
 * Buat sesi demo touring yang siap dinikmati langsung di peta
 */
export function createDemoTouringSession(thresholds: SpeedThresholds): TouringSession {
  const points = generateTouringCoursePoints();
  const segments: RouteSegment[] = [];

  let totalDistMeters = 0;
  let maxSpeed = 0;
  let totalSpeed = 0;
  let slowDist = 0;
  let normalDist = 0;
  let fastDist = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = calculateDistanceMeters(p1.lat, p1.lng, p2.lat, p2.lng);
    const avgSegSpeed = (p1.speed + p2.speed) / 2;
    const { sector, color } = getSpeedSector(avgSegSpeed, thresholds);

    segments.push({
      start: p1,
      end: p2,
      speed: avgSegSpeed,
      distance: dist,
      sector,
      color
    });

    totalDistMeters += dist;
    if (avgSegSpeed > maxSpeed) maxSpeed = avgSegSpeed;
    totalSpeed += avgSegSpeed;

    if (sector === 'slow') slowDist += dist / 1000;
    else if (sector === 'normal') normalDist += dist / 1000;
    else fastDist += dist / 1000;
  }

  const startTime = points[0].timestamp;
  const endTime = points[points.length - 1].timestamp;
  const totalSeconds = Math.round((endTime - startTime) / 1000);
  const avgSpeed = points.length > 0 ? totalSpeed / (points.length - 1) : 0;

  return {
    id: 'demo-touring-puncak-pass',
    title: 'Touring Jalur Puncak - Cipanas Loop',
    startTime,
    endTime,
    points,
    segments,
    thresholds,
    notes: 'Rute touring motor pegunungan dengan variasi sector kecepatan: Merah (kencang di trek lurus), Hijau (cruising), dan Oren (kelok tanjakan).',
    stats: {
      currentSpeed: 0,
      avgSpeed: Number(avgSpeed.toFixed(1)),
      maxSpeed: Number(maxSpeed.toFixed(1)),
      totalDistance: Number((totalDistMeters / 1000).toFixed(2)),
      totalTimeSeconds: totalSeconds,
      movingTimeSeconds: Math.round(totalSeconds * 0.95),
      elevation: points[points.length - 1].altitude || 1100,
      altitudeGain: 145,
      sectorSlowDistance: Number(slowDist.toFixed(2)),
      sectorNormalDistance: Number(normalDist.toFixed(2)),
      sectorFastDistance: Number(fastDist.toFixed(2))
    }
  };
}
