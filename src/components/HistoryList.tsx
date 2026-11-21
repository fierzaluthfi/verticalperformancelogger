import React from 'react';
import { TouringSession } from '../types/touring';
import { formatDistance, formatTime } from '../utils/geo';
import { exportToGPX, downloadFile } from '../utils/gpx';
import { Calendar, Clock, Gauge, Navigation, Download, Trash2, ChevronRight, Eye } from 'lucide-react';

interface HistoryListProps {
  sessions: TouringSession[];
  onSelectSession: (session: TouringSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onLoadDemo: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  sessions,
  onSelectSession,
  onDeleteSession,
  onLoadDemo,
}) => {
  const handleExport = (e: React.MouseEvent, session: TouringSession) => {
    e.stopPropagation();
    const gpxData = exportToGPX(session);
    const fileName = `${session.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date(session.startTime).toISOString().slice(0, 10)}.gpx`;
    downloadFile(gpxData, fileName);
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('Hapus sesi touring ini dari riwayat?')) {
      onDeleteSession(sessionId);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Header & Quick Action */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-bold text-slate-100">Riwayat Touring</h2>
          <p className="text-xs text-slate-400">Rute course & log performa motor tersimpan</p>
        </div>
        <button
          onClick={onLoadDemo}
          className="text-xs font-semibold px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl transition-all"
        >
          + Muat Demo Rute
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center">
          <Navigation className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-300">Belum Ada Riwayat Perjalanan</p>
          <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
            Mulai touring dengan menekan tombol Start atau coba rute demo pegunungan untuk melihat rute di peta.
          </p>
          <button
            onClick={onLoadDemo}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all"
          >
            Coba Contoh Rute Puncak
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sessions.map((session) => {
            const dateStr = new Date(session.startTime).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800/90 hover:border-cyan-500/40 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg group relative overflow-hidden"
              >
                {/* Sector Color Indicator Stripe */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-emerald-500 to-red-500 opacity-80" />

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                      {session.title}
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => handleExport(e, session)}
                      title="Export ke GPX (Strava / Garmin)"
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      title="Hapus sesi"
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Session Stats Grid */}
                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">JARAK</span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {formatDistance(session.stats.totalDistance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">WAKTU</span>
                    <span className="text-xs font-bold font-mono text-cyan-400">
                      {formatTime(session.stats.totalTimeSeconds)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">AVG SPEED</span>
                    <span className="text-xs font-bold font-mono text-slate-200">
                      {session.stats.avgSpeed.toFixed(0)} <span className="text-[9px] text-slate-500">km/h</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">TOP SPEED</span>
                    <span className="text-xs font-bold font-mono text-red-400">
                      {session.stats.maxSpeed.toFixed(0)} <span className="text-[9px] text-slate-500">km/h</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
