import React from 'react';
import { SpeedSectorType, SpeedThresholds, TouringStats } from '../types/touring';
import { formatDistance, formatTime, getSpeedSector } from '../utils/geo';
import { Gauge, Clock, Navigation, Mountain, Zap } from 'lucide-react';

interface SpeedometerHUDProps {
  currentSpeed: number;
  stats: TouringStats;
  thresholds: SpeedThresholds;
  isRecording: boolean;
  gpsAccuracy?: number | null;
}

export const SpeedometerHUD: React.FC<SpeedometerHUDProps> = ({
  currentSpeed,
  stats,
  thresholds,
  isRecording,
  gpsAccuracy
}) => {
  const { sector, color } = getSpeedSector(currentSpeed, thresholds);

  // Hitung persentase gauge speed (maksimal 140 km/h untuk visualisasi gauge motor)
  const maxDisplaySpeed = 140;
  const clampedSpeed = Math.min(Math.max(currentSpeed, 0), maxDisplaySpeed);
  const strokeDashoffset = 440 - (440 * clampedSpeed) / maxDisplaySpeed;

  const sectorLabels: Record<SpeedSectorType, { label: string; badgeClass: string }> = {
    fast: { label: 'SEKTOR CEPAT', badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' },
    normal: { label: 'SEKTOR NORMAL', badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
    slow: { label: 'SEKTOR LAMBAT', badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  };

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 py-2">
      {/* Sector Badge Indicator */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-3 py-0.5 rounded-full text-xs font-bold tracking-wider border ${sectorLabels[sector].badgeClass}`}>
          ● {sectorLabels[sector].label} ({currentSpeed >= thresholds.fastMin ? `≥${thresholds.fastMin}` : currentSpeed <= thresholds.slowMax ? `≤${thresholds.slowMax}` : `${thresholds.slowMax}-${thresholds.fastMin}`} km/h)
        </span>
        {gpsAccuracy && (
          <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
            GPS ±{Math.round(gpsAccuracy)}m
          </span>
        )}
      </div>

      {/* Main Circular Gauge HUD */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Glow Background */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-300"
          style={{ backgroundColor: color }}
        />

        {/* Circular SVG Meter */}
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
          {/* Track background */}
          <circle
            cx="90"
            cy="90"
            r="70"
            stroke="#1E293B"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray="440"
            strokeLinecap="round"
          />
          {/* Active speed progress */}
          <circle
            cx="90"
            cy="90"
            r="70"
            stroke={color}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray="440"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Digital Speed Number */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span 
            className="text-7xl font-extrabold tracking-tighter font-speedo transition-colors duration-300 drop-shadow-md"
            style={{ color: color }}
          >
            {Math.round(currentSpeed)}
          </span>
          <span className="text-sm font-semibold tracking-widest text-slate-400 -mt-1">
            KM / H
          </span>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>MAX: <b className="text-white">{stats.maxSpeed.toFixed(0)}</b></span>
            <span className="text-slate-600">|</span>
            <span>AVG: <b className="text-white">{stats.avgSpeed.toFixed(0)}</b></span>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid (Total Time, Distance, Elevation) */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-md mt-4">
        {/* Total Time */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col items-center shadow-lg">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>WAKTU</span>
          </div>
          <span className="text-lg font-bold font-mono text-cyan-300">
            {formatTime(stats.totalTimeSeconds)}
          </span>
        </div>

        {/* Total Distance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col items-center shadow-lg">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>JARAK</span>
          </div>
          <span className="text-lg font-bold font-mono text-emerald-300">
            {formatDistance(stats.totalDistance)}
          </span>
        </div>

        {/* Elevation / Top Speed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col items-center shadow-lg">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Mountain className="w-3.5 h-3.5 text-purple-400" />
            <span>ELEVASI</span>
          </div>
          <span className="text-lg font-bold font-mono text-purple-300">
            {stats.elevation > 0 ? `${Math.round(stats.elevation)}m` : '--'}
          </span>
        </div>
      </div>
    </div>
  );
};
