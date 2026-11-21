import React, { useState } from 'react';
import { SpeedThresholds } from '../types/touring';
import { DEFAULT_THRESHOLDS, SECTOR_COLORS } from '../utils/geo';
import { X, Check, RotateCcw, Smartphone, Gauge, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  thresholds: SpeedThresholds;
  onSaveThresholds: (thresholds: SpeedThresholds) => void;
  keepAwake: boolean;
  onToggleKeepAwake: (enabled: boolean) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  thresholds,
  onSaveThresholds,
  keepAwake,
  onToggleKeepAwake,
  onClose
}) => {
  const [slowMax, setSlowMax] = useState(thresholds.slowMax);
  const [fastMin, setFastMin] = useState(thresholds.fastMin);

  const handleSave = () => {
    if (slowMax >= fastMin) {
      alert('Batas kecepatan lambat harus lebih kecil dari batas kecepatan cepat!');
      return;
    }
    onSaveThresholds({ slowMax, fastMin });
    onClose();
  };

  const handleReset = () => {
    setSlowMax(DEFAULT_THRESHOLDS.slowMax);
    setFastMin(DEFAULT_THRESHOLDS.fastMin);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">Pengaturan Sektor Kecepatan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Deskripsi */}
          <p className="text-xs text-slate-400 leading-relaxed">
            Sesuaikan batas kecepatan untuk pewarnaan otomatis polyline rute di peta sesuai tipe motor dan gaya berkendara touring Anda.
          </p>

          {/* Color Preview */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-orange-950/20 border border-orange-500/30 rounded-xl p-2.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 mx-auto block mb-1"></span>
              <b className="text-orange-400 block">LAMBAT (Oren)</b>
              <span className="text-[11px] text-slate-400">0 - {slowMax} km/h</span>
            </div>
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 mx-auto block mb-1"></span>
              <b className="text-emerald-400 block">NORMAL (Hijau)</b>
              <span className="text-[11px] text-slate-400">{slowMax} - {fastMin} km/h</span>
            </div>
            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 mx-auto block mb-1"></span>
              <b className="text-red-400 block">CEPAT (Merah)</b>
              <span className="text-[11px] text-slate-400">&gt; {fastMin} km/h</span>
            </div>
          </div>

          {/* Slider Lambat Max (Oren) */}
          <div className="space-y-2 bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-orange-400">Batas Maksimal Sektor Lambat (Oren)</span>
              <span className="font-mono font-bold text-sm bg-orange-500/20 text-orange-300 px-2.5 py-0.5 rounded-lg border border-orange-500/30">
                {slowMax} km/h
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={slowMax}
              onChange={(e) => setSlowMax(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Di bawah kecepatan ini (macet, tanjakan terjal, tikungan pelan) garis rute akan berwarna Oranye.
            </p>
          </div>

          {/* Slider Cepat Min (Merah) */}
          <div className="space-y-2 bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-red-400">Batas Minimal Sektor Cepat (Merah)</span>
              <span className="font-mono font-bold text-sm bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-lg border border-red-500/30">
                {fastMin} km/h
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="120"
              step="5"
              value={fastMin}
              onChange={(e) => setFastMin(Number(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Di atas kecepatan ini (jalan lurus, sprint kencang) garis rute akan berubah menjadi Merah.
            </p>
          </div>

          {/* Keep Awake Screen Toggle */}
          <div className="flex items-center justify-between bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Layar Tetap Menyala (Keep Awake)</span>
                <span className="text-[11px] text-slate-500">Mencegah layar HP mati saat dipasang di phone holder motor</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={keepAwake}
              onChange={(e) => onToggleKeepAwake(e.target.checked)}
              className="w-5 h-5 accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-lg transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
