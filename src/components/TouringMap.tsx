import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { GPSPoint, RouteSegment } from '../types/touring';
import { Layers, Locate, Maximize2, Compass } from 'lucide-react';

interface TouringMapProps {
  segments: RouteSegment[];
  currentPoint: GPSPoint | null;
  isRecording: boolean;
  className?: string;
  autoCenter?: boolean;
}

export const TouringMap: React.FC<TouringMapProps> = ({
  segments,
  currentPoint,
  isRecording,
  className = 'h-72 w-full',
  autoCenter = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineLayersRef = useRef<L.Polyline[]>([]);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);

  const [mapStyle, setMapStyle] = useState<'dark' | 'streets' | 'satellite'>('dark');
  const [followRider, setFollowRider] = useState(autoCenter);

  // Inisialisasi peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Inisialisasi posisi awal (default Bandung / Puncak Jawa Barat atau titik saat ini)
    const initialLat = currentPoint ? currentPoint.lat : -6.7028;
    const initialLng = currentPoint ? currentPoint.lng : 106.9856;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Deteksi jika user drag/pan manual, hentikan follow otomatis sementara
    map.on('dragstart', () => {
      setFollowRider(false);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer sesuai tema pilihan (Dark mode sangat pas untuk kontras polyline merah/hijau/oren)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Hapus layer tile lama
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let subdomains = 'abcd';
    let maxZoom = 19;

    if (mapStyle === 'streets') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      subdomains = 'abc';
    } else if (mapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      subdomains = 'abc';
    }

    L.tileLayer(tileUrl, {
      subdomains,
      maxZoom
    }).addTo(map);
  }, [mapStyle]);

  // Update rute polyline warna-warni (Speed sectors)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Bersihkan garis rute sebelumnya
    polylineLayersRef.current.forEach((layer) => map.removeLayer(layer));
    polylineLayersRef.current = [];

    if (segments.length === 0) return;

    const latLngBounds: [number, number][] = [];

    // Gambar setiap segmen rute dengan warna sektornya (Merah = Cepat, Hijau = Normal, Oren = Lambat)
    segments.forEach((seg) => {
      const p1: [number, number] = [seg.start.lat, seg.start.lng];
      const p2: [number, number] = [seg.end.lat, seg.end.lng];
      latLngBounds.push(p1);
      latLngBounds.push(p2);

      const polyline = L.polyline([p1, p2], {
        color: seg.color,
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Tooltip kecepatan saat segmen di-tap
      polyline.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
          <b style="color: ${seg.color}">Sektor: ${seg.sector.toUpperCase()}</b><br/>
          Kecepatan: <b>${seg.speed.toFixed(1)} km/h</b><br/>
          Jarak: ${(seg.distance).toFixed(0)} meter
        </div>
      `);

      polylineLayersRef.current.push(polyline);
    });

    // Marker Start (Titik Mulai Touring)
    if (segments.length > 0) {
      const startPoint = segments[0].start;
      if (!startMarkerRef.current) {
        const startIcon = L.divIcon({
          className: 'custom-start-marker',
          html: `<div style="background-color: #22c55e; border: 2px solid white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px rgba(0,0,0,0.6);"><span style="color: white; font-weight: bold; font-size: 10px;">S</span></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        startMarkerRef.current = L.marker([startPoint.lat, startPoint.lng], { icon: startIcon })
          .bindPopup('<b>Titik Start Touring</b>')
          .addTo(map);
      } else {
        startMarkerRef.current.setLatLng([startPoint.lat, startPoint.lng]);
      }
    }

    // Jika tidak sedang merekam secara aktif (misal melihat review rute tersimpan), fit map ke seluruh rute
    if (!isRecording && latLngBounds.length > 0) {
      map.fitBounds(L.latLngBounds(latLngBounds), { padding: [30, 30] });
    }
  }, [segments, isRecording]);

  // Update Posisi Motor Saat Ini & Follow Rider
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentPoint) return;

    const latLng: [number, number] = [currentPoint.lat, currentPoint.lng];

    // Buat Icon Motor Kustom dengan rotasi sesuai arah perjalanan (heading)
    const heading = currentPoint.heading || 0;
    const motorIconHtml = `
      <div class="pulse-marker" style="transform: rotate(${heading}deg);">
        <div style="background: #38bdf8; border: 2px solid #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px #38bdf8;">
          <svg style="width: 14px; height: 14px; color: #0f172a; transform: rotate(-45deg);" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      </div>
    `;

    const motorIcon = L.divIcon({
      className: 'rider-current-marker',
      html: motorIconHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    if (!currentMarkerRef.current) {
      currentMarkerRef.current = L.marker(latLng, { icon: motorIcon }).addTo(map);
    } else {
      currentMarkerRef.current.setLatLng(latLng);
      currentMarkerRef.current.setIcon(motorIcon);
    }

    // Follow rider jika aktif
    if (followRider) {
      map.panTo(latLng, { animate: true, duration: 0.5 });
    }
  }, [currentPoint, followRider]);

  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || segments.length === 0) return;
    const latLngs: [number, number][] = segments.map(s => [s.start.lat, s.start.lng]);
    if (currentPoint) latLngs.push([currentPoint.lat, currentPoint.lng]);
    map.fitBounds(L.latLngBounds(latLngs), { padding: [35, 35] });
  };

  const handleCenterRider = () => {
    setFollowRider(true);
    if (mapInstanceRef.current && currentPoint) {
      mapInstanceRef.current.panTo([currentPoint.lat, currentPoint.lng], { animate: true });
    }
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Layer Switcher */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-lg backdrop-blur-md flex flex-col gap-1">
          <button
            onClick={() => setMapStyle('dark')}
            title="Dark Touring Map"
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
              mapStyle === 'dark' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            NIGHT
          </button>
          <button
            onClick={() => setMapStyle('streets')}
            title="Standard Street Map"
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
              mapStyle === 'streets' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            ROAD
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            title="Satellite Imagery"
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
              mapStyle === 'satellite' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            SAT
          </button>
        </div>

        {/* Fit Bounds */}
        {segments.length > 0 && (
          <button
            onClick={handleFitBounds}
            title="Lihat seluruh rute"
            className="p-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white shadow-lg backdrop-blur-md transition-all active:scale-95"
          >
            <Maximize2 className="w-4 h-4 text-cyan-400" />
          </button>
        )}

        {/* Re-center / Follow Rider */}
        {currentPoint && (
          <button
            onClick={handleCenterRider}
            title="Pusatkan ke posisi motor"
            className={`p-2.5 rounded-xl border shadow-lg backdrop-blur-md transition-all active:scale-95 ${
              followRider 
                ? 'bg-cyan-500 border-cyan-400 text-slate-950' 
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
          >
            <Locate className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Speed Sector Legend on Map */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-lg flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1.5 font-bold text-red-400">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-[0_0_6px_#ef4444]" />
          <span>Cepat</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_#22c55e]" />
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-orange-400">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shadow-[0_0_6px_#f97316]" />
          <span>Lambat</span>
        </div>
      </div>
    </div>
  );
};
