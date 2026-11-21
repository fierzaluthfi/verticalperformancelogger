import React from 'react';
import { TouringSession } from '../types/touring';
import { TouringMap } from './TouringMap';
import { SectorBar } from './SectorBar';
import { formatDistance, formatTime } from '../utils/geo';
import { exportToGPX, downloadFile } from '../utils/gpx';
import { X, Download, Clock, Navigation, Gauge, Mountain, Share2 } from 'lucide-react';

interface SessionDetailModalProps {
  session: TouringSession | null;
  onClose: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ session, onClose }) => {
  if (!session) return null;

  const handleExportGPX = () => {
    const gpx = exportToGPX(session);
    const fileName = `${session.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gpx`;
    downloadFile(gpx, fileName);
  };

  const dateStr = new Date(session.startTime).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100">{session.title}</h2>
            <p className="text-xs text-slate-400">{dateStr}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Interactive Map with Speed Polylines */}
          <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
            <TouringMap
              segments={session.segments}
              currentPoint={session.points[session.points.length - 1] || null}
              isRecording={false}
              autoCenter={false}
              className="w-full h-full"
            />
          </div>

          {/* Sektor Bar Breakdown */}
          <SectorBar
            segments={session.segments}
            thresholds={session.thresholds}
            totalDistance={session.stats.totalDistance}
          />

          {/* Stats Cards 2x2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Total Jarak
              </span>
              <span className="text-lg font-bold font-mono text-emerald-300">
                {formatDistance(session.stats.totalDistance)}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Total Waktu
              </span>
              <span className="text-lg font-bold font-mono text-cyan-300">
                {formatTime(session.stats.totalTimeSeconds)}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                <Gauge className="w-3.5 h-3.5 text-yellow-400" /> Rata-Rata
              </span>
              <span className="text-lg font-bold font-mono text-slate-100">
                {session.stats.avgSpeed.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                <Gauge className="w-3.5 h-3.5 text-red-400" /> Top Speed
              </span>
              <span className="text-lg font-bold font-mono text-red-400">
                {session.stats.maxSpeed.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
              </span>
            </div>
          </div>

          {/* Catatan / Keterangan */}
          {session.notes && (
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300">
              <b className="text-slate-400 block mb-1">Catatan Touring:</b>
              {session.notes}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90">
          <button
            onClick={handleExportGPX}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg active:scale-98 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export GPX (Strava / Garmin)</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
