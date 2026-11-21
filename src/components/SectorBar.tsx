import React from 'react';
import { RouteSegment, SpeedThresholds } from '../types/touring';
import { SECTOR_COLORS } from '../utils/geo';

interface SectorBarProps {
  segments: RouteSegment[];
  thresholds: SpeedThresholds;
  totalDistance: number;
}

export const SectorBar: React.FC<SectorBarProps> = ({ segments, thresholds, totalDistance }) => {
  if (totalDistance <= 0 || segments.length === 0) {
    return (
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center text-xs text-slate-500">
        Belum ada data sektor perjalanan touring
      </div>
    );
  }

  // Hitung total jarak per sektor
  let slowDist = 0;
  let normalDist = 0;
  let fastDist = 0;

  segments.forEach((seg) => {
    const km = seg.distance / 1000;
    if (seg.sector === 'slow') slowDist += km;
    else if (seg.sector === 'normal') normalDist += km;
    else if (seg.sector === 'fast') fastDist += km;
  });

  const total = slowDist + normalDist + fastDist || 0.001;
  const slowPct = Math.round((slowDist / total) * 100);
  const normalPct = Math.round((normalDist / total) * 100);
  const fastPct = Math.round((fastDist / total) * 100);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 shadow-md">
      <div className="flex justify-between items-center text-xs font-semibold mb-2">
        <span className="text-slate-300">DISTRIBUSI SEKTOR KECEPATAN</span>
        <span className="text-[11px] text-slate-400 font-mono">Total {total.toFixed(1)} km</span>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
        {slowPct > 0 && (
          <div
            style={{ width: `${slowPct}%`, backgroundColor: SECTOR_COLORS.slow }}
            className="h-full transition-all duration-300 relative group"
            title={`Sektor Lambat (≤ ${thresholds.slowMax} km/h): ${slowDist.toFixed(1)} km (${slowPct}%)`}
          />
        )}
        {normalPct > 0 && (
          <div
            style={{ width: `${normalPct}%`, backgroundColor: SECTOR_COLORS.normal }}
            className="h-full transition-all duration-300 relative group"
            title={`Sektor Normal (${thresholds.slowMax}-${thresholds.fastMin} km/h): ${normalDist.toFixed(1)} km (${normalPct}%)`}
          />
        )}
        {fastPct > 0 && (
          <div
            style={{ width: `${fastPct}%`, backgroundColor: SECTOR_COLORS.fast }}
            className="h-full transition-all duration-300 relative group"
            title={`Sektor Cepat (≥ ${thresholds.fastMin} km/h): ${fastDist.toFixed(1)} km (${fastPct}%)`}
          />
        )}
      </div>

      {/* Legend & Stats */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        {/* Lambat (Oren) */}
        <div className="flex flex-col items-center bg-orange-950/20 border border-orange-500/20 rounded-lg py-1.5 px-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
            <span>LAMBAT</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-200 mt-0.5">{slowPct}%</span>
          <span className="text-[10px] text-slate-400 font-mono">({slowDist.toFixed(1)} km)</span>
          <span className="text-[9px] text-slate-500">≤ {thresholds.slowMax} km/h</span>
        </div>

        {/* Normal (Hijau) */}
        <div className="flex flex-col items-center bg-emerald-950/20 border border-emerald-500/20 rounded-lg py-1.5 px-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>NORMAL</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-200 mt-0.5">{normalPct}%</span>
          <span className="text-[10px] text-slate-400 font-mono">({normalDist.toFixed(1)} km)</span>
          <span className="text-[9px] text-slate-500">{thresholds.slowMax}-{thresholds.fastMin} km/h</span>
        </div>

        {/* Cepat (Merah) */}
        <div className="flex flex-col items-center bg-red-950/20 border border-red-500/20 rounded-lg py-1.5 px-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            <span>CEPAT</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-200 mt-0.5">{fastPct}%</span>
          <span className="text-[10px] text-slate-400 font-mono">({fastDist.toFixed(1)} km)</span>
          <span className="text-[9px] text-slate-500">≥ {thresholds.fastMin} km/h</span>
        </div>
      </div>
    </div>
  );
};
