import React, { useState } from 'react';
import { Building2, Layers } from 'lucide-react';

interface Wall {
  start: [number, number];
  end: [number, number];
  height?: number;
}

interface ElevationViewerProps {
  walls: Wall[];
  rooms: { name: string; corners: [number, number][] }[];
}

const WALL_COLOR = '#e2e8f0';
const WINDOW_COLOR = '#93c5fd';
const FLOOR_LINE_COLOR = '#4fd1c5';
const GROUND_COLOR = '#1e293b';

export const ElevationViewer: React.FC<ElevationViewerProps> = ({ walls, rooms }) => {
  const [numFloors, setNumFloors] = useState(1);
  const [showWindows, setShowWindows] = useState(true);

  // Determine extent of the floor plan
  const allX = walls.flatMap(w => [w.start[0], w.end[0]]);
  const allY = walls.flatMap(w => [w.start[1], w.end[1]]);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const planWidth = maxX - minX || 15;
  const planDepth = maxY - minY || 12;

  // SVG dimensions
  const SVG_W = 900;
  const SVG_H = 500;
  const PADDING = 60;
  const FLOOR_HEIGHT_PX = (SVG_H - PADDING * 2 - 40) / numFloors;
  const FLOOR_HEIGHT_M = 3.0; // meters per floor

  // Scale factor: x direction maps plan width to SVG width
  const scaleX = (SVG_W - PADDING * 2) / planWidth;

  // Determine which "walls" are exterior (approximate: longest span walls)
  // For the front elevation, we gather all unique X extents of walls
  const outerLeft = PADDING;
  const outerRight = SVG_W - PADDING;
  const groundY = SVG_H - PADDING - 20;

  // Generate window positions on the facade
  const windowPositions: { x: number; y: number; w: number; h: number }[] = [];
  if (showWindows) {
    rooms.forEach((room) => {
      const name = room.name.toLowerCase();
      if (!name.includes('bath') && !name.includes('hall') && room.corners.length >= 2) {
        const xs = room.corners.map(c => c[0]);
        const ys = room.corners.map(c => c[1]);
        const rMinX = Math.min(...xs);
        const rMaxX = Math.max(...xs);
        const rMinY = Math.min(...ys);
        const rMaxY = Math.max(...ys);
        const roomCenterX = (rMinX + rMaxX) / 2;
        const roomWidthM = rMaxX - rMinX;
        // Place window on the "front" face (minimum Y side)
        if (rMinY <= minY + 0.3) {
          for (let floor = 0; floor < numFloors; floor++) {
            const winW = Math.min(roomWidthM * scaleX * 0.5, 100);
            const winX = outerLeft + (roomCenterX - minX) * scaleX - winW / 2;
            const winH = FLOOR_HEIGHT_PX * 0.35;
            const winY = groundY - (floor + 1) * FLOOR_HEIGHT_PX + FLOOR_HEIGHT_PX * 0.3;
            if (winX > outerLeft && winX + winW < outerRight) {
              windowPositions.push({ x: winX, y: winY, w: winW, h: winH });
            }
          }
        }
      }
    });
  }

  const buildingHeight = FLOOR_HEIGHT_PX * numFloors;

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0e14] rounded-[2.5rem] overflow-hidden border border-white/5">
      {/* Controls */}
      <div className="flex items-center gap-6 px-8 py-5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-brand-primary" />
          <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Floors</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNumFloors(f => Math.max(1, f - 1))}
              className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold flex items-center justify-center transition"
            >−</button>
            <span className="text-white font-display font-bold text-lg w-6 text-center">{numFloors}</span>
            <button
              onClick={() => setNumFloors(f => Math.min(10, f + 1))}
              className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold flex items-center justify-center transition"
            >+</button>
          </div>
        </div>

        <div className="w-px h-6 bg-white/10" />

        <button
          onClick={() => setShowWindows(s => !s)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${showWindows ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/5 text-gray-400'}`}
        >
          <Layers className="w-3 h-3" />
          Windows
        </button>

        <div className="ml-auto flex items-center gap-2 text-gray-500 text-xs">
          <span className="text-brand-primary font-bold">{numFloors}</span> Floor{numFloors > 1 ? 's' : ''} · {(planWidth).toFixed(1)}m wide · {(FLOOR_HEIGHT_M * numFloors).toFixed(1)}m tall
        </div>
      </div>

      {/* SVG Elevation */}
      <div className="flex-1 flex items-center justify-center p-4">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-full max-h-[420px]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Sky gradient */}
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b0e14" />
              <stop offset="100%" stopColor="#1a1f2e" />
            </linearGradient>
            <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <rect width={SVG_W} height={SVG_H} fill="url(#sky)" />

          {/* Ground shadow */}
          <rect x={outerLeft - 10} y={groundY + 2} width={outerRight - outerLeft + 20} height={12} fill="#000" opacity={0.3} rx={4} />

          {/* Building facade */}
          <rect
            x={outerLeft}
            y={groundY - buildingHeight}
            width={outerRight - outerLeft}
            height={buildingHeight}
            fill="url(#wallGrad)"
            stroke={WALL_COLOR}
            strokeWidth={2}
            rx={2}
          />

          {/* Floor lines */}
          {Array.from({ length: numFloors - 1 }, (_, i) => i + 1).map(floor => {
            const lineY = groundY - floor * FLOOR_HEIGHT_PX;
            return (
              <g key={`floor-line-${floor}`}>
                <line x1={outerLeft} y1={lineY} x2={outerRight} y2={lineY} stroke={FLOOR_LINE_COLOR} strokeWidth={1.5} strokeDasharray="8 4" opacity={0.6} />
                <text x={outerLeft - 8} y={lineY + 4} textAnchor="end" fill={FLOOR_LINE_COLOR} fontSize={10} fontWeight="bold">
                  F{floor}
                </text>
              </g>
            );
          })}

          {/* Floor labels */}
          {Array.from({ length: numFloors }, (_, i) => i).map(floor => (
            <text
              key={`label-${floor}`}
              x={outerLeft + 10}
              y={groundY - floor * FLOOR_HEIGHT_PX - FLOOR_HEIGHT_PX / 2 + 5}
              fill="rgba(255,255,255,0.3)"
              fontSize={11}
              fontWeight="bold"
            >
              Floor {floor + 1}
            </text>
          ))}

          {/* Windows */}
          {windowPositions.map((win, i) => (
            <g key={`win-${i}`}>
              <rect x={win.x} y={win.y} width={win.w} height={win.h} fill={WINDOW_COLOR} opacity={0.7} rx={2} />
              {/* Window frame */}
              <line x1={win.x + win.w / 2} y1={win.y} x2={win.x + win.w / 2} y2={win.y + win.h} stroke="white" strokeWidth={0.8} opacity={0.5} />
              <line x1={win.x} y1={win.y + win.h / 2} x2={win.x + win.w} y2={win.y + win.h / 2} stroke="white" strokeWidth={0.8} opacity={0.5} />
              {/* Window reflection */}
              <rect x={win.x + 3} y={win.y + 3} width={win.w * 0.3} height={win.h * 0.35} fill="white" opacity={0.15} rx={1} />
            </g>
          ))}

          {/* Roof line detail */}
          <line x1={outerLeft - 12} y1={groundY - buildingHeight} x2={outerRight + 12} y2={groundY - buildingHeight} stroke={WALL_COLOR} strokeWidth={4} />

          {/* Ground line */}
          <rect x={0} y={groundY + 2} width={SVG_W} height={SVG_H - groundY} fill={GROUND_COLOR} />
          <line x1={0} y1={groundY + 2} x2={SVG_W} y2={groundY + 2} stroke={FLOOR_LINE_COLOR} strokeWidth={2} />

          {/* Dimension arrows */}
          {/* Width */}
          <line x1={outerLeft} y1={SVG_H - 18} x2={outerRight} y2={SVG_H - 18} stroke="#475569" strokeWidth={1} />
          <text x={SVG_W / 2} y={SVG_H - 6} textAnchor="middle" fill="#64748b" fontSize={10}>
            ← {planWidth.toFixed(1)} m →
          </text>
          {/* Height */}
          <line x1={24} y1={groundY - buildingHeight} x2={24} y2={groundY} stroke="#475569" strokeWidth={1} />
          <text x={18} y={groundY - buildingHeight / 2} textAnchor="middle" fill="#64748b" fontSize={10} transform={`rotate(-90, 18, ${groundY - buildingHeight / 2})`}>
            {(FLOOR_HEIGHT_M * numFloors).toFixed(1)} m
          </text>
        </svg>
      </div>

      {/* Bottom label */}
      <div className="px-8 py-4 border-t border-white/5 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Front Elevation · Neural Architectural Render</span>
      </div>
    </div>
  );
};
