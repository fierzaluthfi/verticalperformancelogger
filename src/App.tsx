import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Geolocation } from '@capacitor/geolocation';
import { 
  GPSPoint, 
  RouteSegment, 
  SpeedThresholds, 
  TouringSession, 
  TouringStats, 
  TrackingStatus 
} from './types/touring';
import { 
  calculateBearing, 
  calculateDistanceMeters, 
  DEFAULT_THRESHOLDS, 
  getSpeedSector, 
  msToKmh 
} from './utils/geo';
import { loadSessions, loadThresholds, saveSessions, saveThresholds } from './utils/storage';
import { createDemoTouringSession, generateTouringCoursePoints } from './utils/simulator';

import { SpeedometerHUD } from './components/SpeedometerHUD';
import { TouringMap } from './components/TouringMap';
import { SectorBar } from './components/SectorBar';
import { HistoryList } from './components/HistoryList';
import { SessionDetailModal } from './components/SessionDetailModal';
import { SettingsModal } from './components/SettingsModal';

import { 
  Play, 
  Pause, 
  Square, 
  Navigation, 
  Compass, 
  History, 
  Settings, 
  Sparkles, 
  Radio, 
  Layers,
  MapPin,
  Flame,
  AlertTriangle
} from 'lucide-react';

const INITIAL_STATS: TouringStats = {
  currentSpeed: 0,
  avgSpeed: 0,
  maxSpeed: 0,
  totalDistance: 0,
  totalTimeSeconds: 0,
  movingTimeSeconds: 0,
  elevation: 0,
  altitudeGain: 0,
  sectorSlowDistance: 0,
  sectorNormalDistance: 0,
  sectorFastDistance: 0
};

export function App() {
  // Navigation tab: 'hud' | 'map' | 'history'
  const [activeTab, setActiveTab] = useState<'hud' | 'map' | 'history'>('hud');

  // Tracking states
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [currentPoint, setCurrentPoint] = useState<GPSPoint | null>(null);
  const [points, setPoints] = useState<GPSPoint[]>([]);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [stats, setStats] = useState<TouringStats>(INITIAL_STATS);

  // Storage states
  const [sessions, setSessions] = useState<TouringSession[]>(() => loadSessions());
  const [thresholds, setThresholds] = useState<SpeedThresholds>(() => loadThresholds());
  const [selectedSession, setSelectedSession] = useState<TouringSession | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Device states
  const [keepAwake, setKeepAwake] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Refs
  const watchIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const simulationTimerRef = useRef<any>(null);
  const sessionStartTimeRef = useRef<number>(0);

  // Simpan threshold saat berubah
  const handleSaveThresholds = (newThresh: SpeedThresholds) => {
    setThresholds(newThresh);
    saveThresholds(newThresh);
  };

  // Request GPS Permissions via Capacitor Native
  const requestGPSPermission = async () => {
    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          setGpsError('Izin lokasi ditolak. Silakan izinkan akses lokasi di Pengaturan HP Anda.');
          return false;
        }
      }
      setGpsError(null);
      return true;
    } catch (e) {
      console.warn('Geolocation check permission error', e);
      return true;
    }
  };

  // Dapatkan lokasi awal saat pertama kali aplikasi dibuka agar peta langsung muncul
  useEffect(() => {
    const fetchInitialLocation = async () => {
      try {
        const hasPerm = await requestGPSPermission();
        if (hasPerm) {
          const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
          if (pos && pos.coords) {
            setCurrentPoint({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              altitude: pos.coords.altitude,
              speed: 0,
              heading: pos.coords.heading,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp
            });
            setGpsError(null);
          }
        }
      } catch (err) {
        console.warn('Initial location fetch fallback:', err);
      }
    };

    fetchInitialLocation();
  }, []);

  // Screen WakeLock Management
  useEffect(() => {
    const requestWakeLock = async () => {
      if (keepAwake && status === 'recording' && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.warn('Wake Lock error:', err);
        }
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [keepAwake, status]);

  // Elapsed Timer effect
  useEffect(() => {
    if (status === 'recording') {
      timerIntervalRef.current = setInterval(() => {
        setStats((prev) => ({
          ...prev,
          totalTimeSeconds: prev.totalTimeSeconds + 1,
          movingTimeSeconds: prev.currentSpeed > 3 ? prev.movingTimeSeconds + 1 : prev.movingTimeSeconds
        }));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [status]);

  // Handle incoming GPS Point
  const handleNewGPSPoint = (newPt: GPSPoint) => {
    setCurrentPoint(newPt);

    setPoints((prevPoints) => {
      const updatedPoints = [...prevPoints, newPt];
      
      // Jika ada titik sebelumnya, buat segmen rute baru
      if (prevPoints.length > 0) {
        const lastPt = prevPoints[prevPoints.length - 1];
        const dist = calculateDistanceMeters(lastPt.lat, lastPt.lng, newPt.lat, newPt.lng);

        // Filter noise GPS: jarak minimal 1.5 meter agar tidak jitter saat motor berhenti di lampu merah
        if (dist > 1.5) {
          const segSpeed = newPt.speed > 0 ? newPt.speed : (lastPt.speed + newPt.speed) / 2;
          const { sector, color } = getSpeedSector(segSpeed, thresholds);

          const newSeg: RouteSegment = {
            start: lastPt,
            end: newPt,
            speed: segSpeed,
            distance: dist,
            sector,
            color
          };

          setSegments((prevSegs) => [...prevSegs, newSeg]);

          // Update stats akumulatif
          setStats((prevStats) => {
            const newTotalDist = prevStats.totalDistance + (dist / 1000);
            const newMaxSpeed = Math.max(prevStats.maxSpeed, newPt.speed);
            const movingTime = prevStats.movingTimeSeconds || 1;
            const newAvgSpeed = newTotalDist > 0 ? (newTotalDist / (movingTime / 3600)) : 0;

            let slowD = prevStats.sectorSlowDistance;
            let normD = prevStats.sectorNormalDistance;
            let fastD = prevStats.sectorFastDistance;

            if (sector === 'slow') slowD += dist / 1000;
            else if (sector === 'normal') normD += dist / 1000;
            else fastD += dist / 1000;

            return {
              ...prevStats,
              currentSpeed: newPt.speed,
              maxSpeed: Number(newMaxSpeed.toFixed(1)),
              avgSpeed: Number(Math.min(newAvgSpeed, 199).toFixed(1)),
              totalDistance: Number(newTotalDist.toFixed(2)),
              elevation: newPt.altitude || prevStats.elevation,
              sectorSlowDistance: Number(slowD.toFixed(2)),
              sectorNormalDistance: Number(normD.toFixed(2)),
              sectorFastDistance: Number(fastD.toFixed(2))
            };
          });
        }
      } else {
        // Titik pertama
        setStats((prev) => ({
          ...prev,
          currentSpeed: newPt.speed,
          elevation: newPt.altitude || 0
        }));
      }

      return updatedPoints;
    });
  };

  // Start Real GPS Recording
  const startRecording = async () => {
    if (isSimulating) stopSimulation();

    setGpsError(null);
    const hasPerm = await requestGPSPermission();
    if (!hasPerm) return;

    setStatus('recording');
    sessionStartTimeRef.current = Date.now();

    try {
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        },
        (position, error) => {
          if (error) {
            console.warn('Geolocation watch error:', error);
            setGpsError('Sinyal GPS lemah atau belum terhubung. Pastikan GPS HP Anda aktif.');
            return;
          }
          if (position && position.coords) {
            setGpsError(null);
            const speedKmh = msToKmh(position.coords.speed);
            const newPt: GPSPoint = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              altitude: position.coords.altitude,
              speed: Number(speedKmh.toFixed(1)),
              heading: position.coords.heading,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            handleNewGPSPoint(newPt);
          }
        }
      );
      watchIdRef.current = watchId as any;
    } catch (err) {
      console.warn('Fallback geolocation error:', err);
      // Fallback ke browser navigator.geolocation jika Capacitor tidak tersedia
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const speedKmh = msToKmh(pos.coords.speed);
            handleNewGPSPoint({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              altitude: pos.coords.altitude,
              speed: Number(speedKmh.toFixed(1)),
              heading: pos.coords.heading,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp
            });
          },
          () => setGpsError('Sinyal GPS lemah atau izin lokasi belum diberikan.'),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    }
  };

  // Pause Recording
  const pauseRecording = async () => {
    setStatus('paused');
    if (watchIdRef.current !== null) {
      try {
        await Geolocation.clearWatch({ id: watchIdRef.current as any });
      } catch (e) {
        if ('geolocation' in navigator) {
          navigator.geolocation.clearWatch(watchIdRef.current as any);
        }
      }
      watchIdRef.current = null;
    }
    setStats((prev) => ({ ...prev, currentSpeed: 0 }));
  };

  // Resume Recording
  const resumeRecording = () => {
    startRecording();
  };

  // Finish & Save Session
  const finishRecording = async () => {
    if (watchIdRef.current !== null) {
      try {
        await Geolocation.clearWatch({ id: watchIdRef.current as any });
      } catch (e) {
        if ('geolocation' in navigator) {
          navigator.geolocation.clearWatch(watchIdRef.current as any);
        }
      }
      watchIdRef.current = null;
    }
    stopSimulation();

    if (points.length < 2) {
      if (window.confirm('Belum cukup data GPS rute untuk disimpan. Ingin membatalkan sesi ini?')) {
        resetSession();
      }
      return;
    }

    const defaultTitle = `Touring Ride #${sessions.length + 1} (${stats.totalDistance.toFixed(1)} km)`;
    const title = window.prompt('Beri nama sesi touring Anda:', defaultTitle) || defaultTitle;

    const newSession: TouringSession = {
      id: `tour-${Date.now()}`,
      title,
      startTime: sessionStartTimeRef.current || Date.now() - (stats.totalTimeSeconds * 1000),
      endTime: Date.now(),
      points,
      segments,
      stats: { ...stats, currentSpeed: 0 },
      thresholds
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    saveSessions(updated);

    // Confetti effect
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setSelectedSession(newSession);
    resetSession();
  };

  const resetSession = () => {
    setStatus('idle');
    setPoints([]);
    setSegments([]);
    setStats(INITIAL_STATS);
    setCurrentPoint(null);
    setIsSimulating(false);
  };

  // Live Touring Simulation (Demo Mode)
  const startSimulation = () => {
    resetSession();
    setIsSimulating(true);
    setStatus('recording');
    sessionStartTimeRef.current = Date.now();

    const simPoints = generateTouringCoursePoints();
    let index = 0;

    // Masukkan titik awal langsung
    handleNewGPSPoint(simPoints[0]);
    index++;

    // Interval stream titik tiap 1.2 detik untuk simulasi touring dinamis
    simulationTimerRef.current = setInterval(() => {
      if (index >= simPoints.length) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
        setStatus('paused');
        return;
      }
      handleNewGPSPoint(simPoints[index]);
      index++;
    }, 1200);
  };

  const stopSimulation = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setIsSimulating(false);
  };

  // Muat Demo Sesi Lengkap langsung ke riwayat
  const handleLoadDemoSession = () => {
    const demo = createDemoTouringSession(thresholds);
    const updated = [demo, ...sessions.filter(s => s.id !== demo.id)];
    setSessions(updated);
    saveSessions(updated);
    setSelectedSession(demo);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    saveSessions(updated);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-[1100] bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Flame className="w-4 h-4 text-slate-950 fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wide font-speedo text-white flex items-center gap-1.5">
              MOTOTRACK <span className="text-[10px] text-cyan-400 font-normal border border-cyan-500/30 px-1.5 rounded">STRAVA MOTOR</span>
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className={`w-2 h-2 rounded-full ${status === 'recording' ? 'bg-red-500 animate-ping' : status === 'paused' ? 'bg-yellow-500' : 'bg-slate-500'}`} />
              <span className="capitalize">{status === 'recording' ? (isSimulating ? 'Simulasi Touring Live' : 'Merekam Rute GPS') : status === 'paused' ? 'Paused' : 'Siap Touring'}</span>
            </div>
          </div>
        </div>

        {/* Header Right Action Buttons */}
        <div className="flex items-center gap-1.5">
          {status === 'idle' && (
            <button
              onClick={startSimulation}
              title="Simulasi Perjalanan Touring Motor"
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Simulasi</span> Demo
            </button>
          )}

          <button
            onClick={() => setShowSettings(true)}
            title="Pengaturan Sektor Kecepatan"
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* GPS Warning Banner if any */}
      {gpsError && (
        <div className="mx-4 mt-3 bg-red-950/50 border border-red-500/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-red-200 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-red-300">Peringatan GPS:</span>
              <span className="text-[11px] text-slate-300">{gpsError}</span>
            </div>
          </div>
          <button
            onClick={() => requestGPSPermission()}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white font-bold text-[11px] rounded-xl shrink-0 transition-all shadow"
          >
            Beri Izin
          </button>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col p-3 max-w-lg mx-auto w-full gap-3">
        {activeTab === 'hud' && (
          <div className="flex flex-col items-center gap-3">
            {/* Speedometer Gauges */}
            <SpeedometerHUD
              currentSpeed={stats.currentSpeed}
              stats={stats}
              thresholds={thresholds}
              isRecording={status === 'recording'}
              gpsAccuracy={currentPoint?.accuracy}
            />

            {/* Sektor Breakdown Bar */}
            <SectorBar
              segments={segments}
              thresholds={thresholds}
              totalDistance={stats.totalDistance}
            />

            {/* Mini Map View in HUD */}
            <div className="w-full h-52 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative">
              <TouringMap
                segments={segments}
                currentPoint={currentPoint}
                isRecording={status === 'recording'}
                className="w-full h-full"
                autoCenter={true}
              />
              <button
                onClick={() => setActiveTab('map')}
                className="absolute top-2 left-2 z-[1000] px-2.5 py-1 bg-slate-900/90 hover:bg-slate-850 text-cyan-300 border border-slate-700/80 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1 backdrop-blur-sm"
              >
                <Layers className="w-3 h-3" />
                Perbesar Peta
              </button>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="flex flex-col flex-1 gap-3 h-[75vh]">
            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
              <TouringMap
                segments={segments}
                currentPoint={currentPoint}
                isRecording={status === 'recording'}
                className="w-full h-full"
                autoCenter={true}
              />
            </div>

            {/* Compact HUD Overlay under map */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-xl flex items-center justify-between">
              <div className="flex items-baseline gap-1 font-speedo">
                <span className="text-3xl font-extrabold text-cyan-300">{Math.round(stats.currentSpeed)}</span>
                <span className="text-xs text-slate-400">km/h</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">JARAK</span>
                  <span className="text-emerald-400 font-bold">{stats.totalDistance.toFixed(1)} km</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">MAX</span>
                  <span className="text-red-400 font-bold">{stats.maxSpeed.toFixed(0)} km/h</span>
                </div>
              </div>
            </div>

            <SectorBar
              segments={segments}
              thresholds={thresholds}
              totalDistance={stats.totalDistance}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryList
            sessions={sessions}
            onSelectSession={setSelectedSession}
            onDeleteSession={handleDeleteSession}
            onLoadDemo={handleLoadDemoSession}
          />
        )}
      </main>

      {/* Floating Ride Control Dock (Start / Pause / Finish) */}
      {activeTab !== 'history' && (
        <div className="fixed bottom-20 left-0 right-0 max-w-sm mx-auto px-4 z-[1200] flex items-center justify-center gap-3">
          {status === 'idle' && (
            <button
              onClick={startRecording}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold font-speedo text-base rounded-2xl shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-400/40"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>MULAI TOURING</span>
            </button>
          )}

          {status === 'recording' && (
            <>
              <button
                onClick={pauseRecording}
                className="flex-1 py-4 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-speedo text-sm rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Pause className="w-5 h-5 fill-current" />
                <span>PAUSE</span>
              </button>
              <button
                onClick={finishRecording}
                className="flex-1 py-4 px-5 bg-red-600 hover:bg-red-500 text-white font-bold font-speedo text-sm rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>SELESAI</span>
              </button>
            </>
          )}

          {status === 'paused' && (
            <>
              <button
                onClick={resumeRecording}
                className="flex-1 py-4 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-speedo text-sm rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>LANJUTKAN</span>
              </button>
              <button
                onClick={finishRecording}
                className="flex-1 py-4 px-5 bg-red-600 hover:bg-red-500 text-white font-bold font-speedo text-sm rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>SIMPAN SESI</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[1250] bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('hud')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'hud' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] tracking-wider font-mono">HUD RIDE</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'map' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-5 h-5" />
          <span className="text-[10px] tracking-wider font-mono">PETA RUTE</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'history' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] tracking-wider font-mono">RIWAYAT ({sessions.length})</span>
        </button>
      </nav>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          thresholds={thresholds}
          onSaveThresholds={handleSaveThresholds}
          keepAwake={keepAwake}
          onToggleKeepAwake={setKeepAwake}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
