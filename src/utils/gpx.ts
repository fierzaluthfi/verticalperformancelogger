import { TouringSession } from '../types/touring';

/**
 * Export rekaman touring motor ke file standar GPX (Strava & Garmin compatible)
 */
export function exportToGPX(session: TouringSession): string {
  const dateStr = new Date(session.startTime).toISOString();
  
  const trkpts = session.points.map(pt => {
    const timeISO = new Date(pt.timestamp).toISOString();
    const eleTag = pt.altitude !== null ? `<ele>${pt.altitude.toFixed(1)}</ele>` : '';
    const speedMs = (pt.speed / 3.6).toFixed(2);
    
    return `      <trkpt lat="${pt.lat}" lon="${pt.lng}">
        ${eleTag}
        <time>${timeISO}</time>
        <extensions>
          <speed>${speedMs}</speed>
        </extensions>
      </trkpt>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MotoTrack Touring Logger" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <metadata>
    <name>${escapeXml(session.title)}</name>
    <time>${dateStr}</time>
    <desc>Motorcycle touring log recorded with MotoTrack. Total Distance: ${session.stats.totalDistance.toFixed(2)} km, Max Speed: ${session.stats.maxSpeed.toFixed(1)} km/h.</desc>
  </metadata>
  <trk>
    <name>${escapeXml(session.title)}</name>
    <type>motorcycling</type>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Trigger file download di browser / mobile
 */
export function downloadFile(content: string, fileName: string, mimeType: string = 'application/gpx+xml') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
