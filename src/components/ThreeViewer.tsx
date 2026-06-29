import React, { Suspense, useState, useCallback, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { Sofa, RotateCcw, Trash2, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Wall { start: [number, number]; end: [number, number]; height?: number; thickness?: number; }
interface Room { name: string; corners: [number, number][]; }
interface FurnitureItem { id: string; type: string; position: [number, number]; rotation: number; }

interface ThreeViewerProps {
  data: { walls: Wall[]; rooms: Room[]; furniture?: FurnitureItem[]; };
  onFurnitureChange?: (furniture: FurnitureItem[]) => void;
}

// ─── Furniture Catalog ────────────────────────────────────────────────────────

const FURNITURE_CATALOG = [
  { category: 'Seating',  items: [{ type: 'Sofa', label: 'Sofa' }, { type: 'Armchair', label: 'Chair' }] },
  { category: 'Sleeping', items: [{ type: 'Double Bed', label: 'Double Bed' }, { type: 'Single Bed', label: 'Single Bed' }] },
  { category: 'Dining',   items: [{ type: 'Dining Table', label: 'Dining Table' }, { type: 'Bar Stool', label: 'Bar Stool' }] },
  { category: 'Storage',  items: [{ type: 'Wardrobe', label: 'Wardrobe' }, { type: 'Bookshelf', label: 'Bookshelf' }] },
  { category: 'Office',   items: [{ type: 'Desk', label: 'Desk' }, { type: 'Office Chair', label: 'Ofc. Chair' }] },
];

// ─── 3D Furniture Mesh ────────────────────────────────────────────────────────

const FurnitureMesh: React.FC<{
  item: FurnitureItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = ({ item, isSelected, onSelect }) => {
  const [x, z] = item.position;
  const type = item.type.toLowerCase();
  const sel = isSelected ? '#4fd1c5' : undefined;
  const handleClick = (e: any) => { e.stopPropagation(); onSelect(item.id); };

  const SelectRing = () => isSelected ? (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.4, 32]} />
      <meshBasicMaterial color="#4fd1c5" opacity={0.2} transparent />
    </mesh>
  ) : null;

  if (type.includes('sofa')) {
    return (
      <group position={[x, 0, z]} rotation={[0, item.rotation, 0]} onClick={handleClick}>
        <SelectRing />
        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[2, 0.6, 0.9]} /><meshStandardMaterial color={sel ?? '#c05621'} roughness={0.5} /></mesh>
        <mesh position={[0, 0.7, -0.35]} castShadow><boxGeometry args={[2, 0.7, 0.2]} /><meshStandardMaterial color={sel ?? '#9c4221'} roughness={0.5} /></mesh>
        <mesh position={[-0.9, 0.55, 0]}><boxGeometry args={[0.2, 0.5, 0.9]} /><meshStandardMaterial color={sel ?? '#9c4221'} /></mesh>
        <mesh position={[0.9, 0.55, 0]}><boxGeometry args={[0.2, 0.5, 0.9]} /><meshStandardMaterial color={sel ?? '#9c4221'} /></mesh>
        <mesh position={[-0.8, 0.06, 0.35]}><boxGeometry args={[0.08, 0.12, 0.08]} /><meshStandardMaterial color="#a0522d" /></mesh>
        <mesh position={[0.8, 0.06, 0.35]}><boxGeometry args={[0.08, 0.12, 0.08]} /><meshStandardMaterial color="#a0522d" /></mesh>
      </group>
    );
  }

  if (type.includes('armchair') || type.includes('chair')) {
    return (
      <group position={[x, 0, z]} rotation={[0, item.rotation, 0]} onClick={handleClick}>
        <SelectRing />
        <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.9, 0.5, 0.8]} /><meshStandardMaterial color={sel ?? '#d69e2e'} roughness={0.5} /></mesh>
        <mesh position={[0, 0.65, -0.3]}><boxGeometry args={[0.9, 0.6, 0.15]} /><meshStandardMaterial color={sel ?? '#b7791f'} roughness={0.5} /></mesh>
      </group>
    );
  }

  if (type.includes('double bed')) {
    return (
      <group position={[x, 0, z]} rotation={[0, item.rotation, 0]} onClick={handleClick}>
        <SelectRing />
        <mesh position={[0, 0.2, 0]}><boxGeometry args={[2, 0.4, 2.2]} /><meshStandardMaterial color={sel ?? '#8b6343'} roughness={0.6} /></mesh>
        <mesh position={[0, 0.45, 0.05]}><boxGeometry args={[1.8, 0.2, 2.0]} /><meshStandardMaterial color="#e8d5b7" roughness={0.7} /></mesh>
        <mesh position={[0, 0.7, -1]}><boxGeometry args={[2, 1.0, 0.12]} /><meshStandardMaterial color={sel ?? '#5a67d8'} roughness={0.3} /></mesh>
        <mesh position={[-0.5, 0.58, 0.7]}><boxGeometry args={[0.7, 0.12, 0.5]} /><meshStandardMaterial color="#ffffff" roughness={0.8} /></mesh>
        <mesh position={[0.5, 0.58, 0.7]}><boxGeometry args={[0.7, 0.12, 0.5]} /><meshStandardMaterial color="#f0f0ff" roughness={0.8} /></mesh>
      </group>
    );
  }

  if (type.includes('single bed')) {
    return (
      <group position={[x, 0, z]} rotation={[0, item.rotation, 0]} onClick={handleClick}>
        <SelectRing />
        <mesh position={[0, 0.2, 0]}><boxGeometry args={[1.1, 0.4, 2.2]} /><meshStandardMaterial color={sel ?? '#8b6343'} roughness={0.6} /></mesh>
        <mesh position={[0, 0.45, 0.05]}><boxGeometry args={[1.0, 0.2, 2.0]} /><meshStandardMaterial color="#e8d5b7" roughness={0.7} /></mesh>
        <mesh position={[0, 0.65, -1]}><boxGeometry args={[1.1, 0.9, 0.12]} /><meshStandardMaterial color={sel ?? '#4299e1'} roughness={0.3} /></mesh>
        <mesh position={[0, 0.58, 0.7]}><boxGeometry args={[0.7, 0.12, 0.5]} /><meshStandardMaterial color="#ffffff" roughness={0.8} /></mesh>
      </group>
    );
  }

  if (type.includes('dining table')) {
    return (
      <group position={[x, 0, z]} rotation={[0, item.rotation, 0]} onClick={handleClick}>
        <SelectRing />
        <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.8, 0.07, 1.0]} /><meshStandardMaterial color={sel ?? '#c6a35d'} roughness={0.2} metalness={0.05} /></mesh>
        {([[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]] as [number,number][]).map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.22, lz]}><boxGeometry args={[0.07, 0.44, 0.07]} /><meshStandardMaterial color="#a0845c" /></mesh>
        ))}
      </group>
    );
  }

  if (type.includes('bar stool')) {
    return (
      <group position={[x, 0, z]} onClick={handleClick}>
        <SelectRing />
        <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.22, 0.22, 0.09, 16]} /><meshStandardMaterial color={sel ?? '#e53e3e'} roughness={0.4} /></mesh>
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.03, 0.03, 0.6, 8]} /><meshStandardMaterial color="#a0aec0" metalness={0.6} /></mesh>
      </group>
    );
  }

  if (type.includes('wardrobe')) {
    return (
      <group position={[x, 0, z]} rotation={[0, item.rotation, 0]} onClick={handleClick}>
        <SelectRing />
        <mesh position={[0, 1.1, 0]}><boxGeometry args={[2, 2.2, 0.6]} /><meshStandardMaterial color={sel ?? '#b7853c'} roughness={0.4} /></mesh>
        <mesh position={[-0.5, 1.1, 0.31]}><boxGeometry args={[0.95, 2.1, 0.03]} /><meshStandardMaterial color="#d4a94e" roughness={0.3} /></mesh>
        <mesh position={[0.5, 1.1, 0.31]}><boxGeometry args={[0.95, 2.1, 0.03]} /><meshStandardMaterial color="#d4a94e" roughness={0.3} /></mesh>
        <mesh position={[-0.08, 1.1, 0.34]}><boxGeometry args={[0.05, 0.3, 0.04]} /><meshStandardMaterial color="#d4d4d4" metalness={0.8} roughness={0.1} /></mesh>
        <mesh position={[0.08, 1.1, 0.34]}><boxGeometry args={[0.05, 0.3, 0.04]} /><meshStandardMaterial color="#d4d4d4" metalness={0.8} roughness={0.1} /></mesh>
      </group>
    );
  }

  if (type.includes('bookshelf')) {
    return (
      <group position={[x, 0, z]} rotation={[0, item.rotation, 0]} onClick={handleClick}>
        <SelectRing />
        <mesh position={[0, 1.0, 0]}><boxGeometry args={[1.2, 2.0, 0.35]} /><meshStandardMaterial color={sel ?? '#b7853c'} roughness={0.5} /></mesh>
        {([0.3, 0.7, 1.1, 1.5]).map((y, i) => (
          <mesh key={i} position={[0, y, 0.06]}><boxGeometry args={[1.1, 0.06, 0.3]} /><meshStandardMaterial color="#d4a574" roughness={0.4} /></mesh>
        ))}
        {([
          { bx: -0.35, by: 0.5, bw: 0.08, color: '#e53e3e' },
          { bx: -0.22, by: 0.5, bw: 0.06, color: '#3182ce' },
          { bx: -0.10, by: 0.5, bw: 0.09, color: '#38a169' },
          { bx:  0.02, by: 0.5, bw: 0.07, color: '#d69e2e' },
          { bx: -0.35, by: 0.9, bw: 0.10, color: '#805ad5' },
          { bx: -0.20, by: 0.9, bw: 0.07, color: '#e53e3e' },
        ]).map((b, i) => (
          <mesh key={`book-${i}`} position={[b.bx, b.by, 0.1]}><boxGeometry args={[b.bw, 0.28, 0.2]} /><meshStandardMaterial color={b.color} /></mesh>
        ))}
      </group>
    );
  }

  if (type.includes('desk')) {
    return (
      <group position={[x, 0, z]} rotation={[0, item.rotation, 0]} onClick={handleClick}>
        <SelectRing />
        <mesh position={[0, 0.42, 0]}><boxGeometry args={[1.6, 0.05, 0.8]} /><meshStandardMaterial color={sel ?? '#d4a574'} roughness={0.3} /></mesh>
        {([[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]] as [number,number][]).map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.21, lz]}><boxGeometry args={[0.05, 0.42, 0.05]} /><meshStandardMaterial color="#a0845c" /></mesh>
        ))}
        <mesh position={[0, 0.72, -0.3]}><boxGeometry args={[0.7, 0.45, 0.03]} /><meshStandardMaterial color="#1a202c" /></mesh>
        <mesh position={[0, 0.50, -0.29]}><boxGeometry args={[0.06, 0.2, 0.03]} /><meshStandardMaterial color="#718096" /></mesh>
      </group>
    );
  }

  if (type.includes('office chair')) {
    return (
      <group position={[x, 0, z]} onClick={handleClick}>
        <SelectRing />
        <mesh position={[0, 0.50, 0]}><cylinderGeometry args={[0.27, 0.27, 0.09, 16]} /><meshStandardMaterial color={sel ?? '#553c9a'} roughness={0.4} /></mesh>
        <mesh position={[0, 0.86, -0.15]}><boxGeometry args={[0.5, 0.5, 0.09]} /><meshStandardMaterial color={sel ?? '#553c9a'} roughness={0.4} /></mesh>
        <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.03, 0.03, 0.5, 8]} /><meshStandardMaterial color="#a0aec0" metalness={0.7} roughness={0.2} /></mesh>
        {([[ 0.22, 0], [-0.22, 0], [0,  0.22], [0, -0.22]] as [number,number][]).map(([wx, wz], i) => (
          <mesh key={i} position={[wx, 0.05, wz]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#718096" /></mesh>
        ))}
      </group>
    );
  }

  // Fallback
  return (
    <group position={[x, 0, z]} onClick={handleClick}>
      <SelectRing />
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[1, 0.8, 1]} /><meshStandardMaterial color={sel ?? '#ed8936'} roughness={0.4} /></mesh>
    </group>
  );
};

// ─── Floor Click Detector ─────────────────────────────────────────────────────

const FloorClickDetector: React.FC<{ onFloorClick: (pos: [number, number]) => void; enabled: boolean; }> = ({ onFloorClick, enabled }) => {
  const { camera, gl } = useThree();
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycaster = useRef(new THREE.Raycaster());

  const handleClick = useCallback((e: any) => {
    if (!enabled) return;
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.current.setFromCamera(mouse, camera);
    const target = new THREE.Vector3();
    if (raycaster.current.ray.intersectPlane(plane.current, target)) {
      onFloorClick([parseFloat(target.x.toFixed(2)), parseFloat(target.z.toFixed(2))]);
    }
  }, [camera, gl, enabled, onFloorClick]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={handleClick} visible={false}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial />
    </mesh>
  );
};

// ─── Wall & Room ──────────────────────────────────────────────────────────────

const WallSegment: React.FC<{ wall: Wall }> = ({ wall }) => {
  const start = new THREE.Vector3(wall.start[0], 0, wall.start[1]);
  const end   = new THREE.Vector3(wall.end[0],   0, wall.end[1]);
  const length  = start.distanceTo(end);
  const center  = start.clone().lerp(end, 0.5);
  const angle   = Math.atan2(end.x - start.x, end.z - start.z);
  const height    = wall.height    || 2.6;
  const thickness = wall.thickness || 0.15;
  return (
    <mesh position={[center.x, height / 2, center.z]} rotation={[0, angle + Math.PI / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, height, thickness]} />
      <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.05} />
    </mesh>
  );
};

// ─── Procedural Textures ──────────────────────────────────────────────────────

const TEXTURES: Record<string, THREE.CanvasTexture> = {};

const getWoodTexture = () => {
  if (TEXTURES['wood']) return TEXTURES['wood'];
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#8B5A2B'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 400; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#9C6633' : '#7A4E24';
        ctx.globalAlpha = Math.random() * 0.5;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 60 + 20, Math.random() * 4 + 1);
    }
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#5C3A18'; ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
        if (x < 512) {
            const y = Math.random() * 512;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 64, y); ctx.stroke();
        }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  TEXTURES['wood'] = tex; return tex;
};

const getTileTexture = () => {
  if (TEXTURES['tile']) return TEXTURES['tile'];
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 200; i++) {
        ctx.fillStyle = '#e2e8f0'; ctx.globalAlpha = Math.random() * 0.3;
        ctx.beginPath(); ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 20 + 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 6;
    for (let x = 0; x <= 512; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke(); }
    for (let y = 0; y <= 512; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  TEXTURES['tile'] = tex; return tex;
};

const getMarbleTexture = () => {
  if (TEXTURES['marble']) return TEXTURES['marble'];
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = '#f1f5f9'; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 50 + 20, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#cbd5e1'; ctx.globalAlpha = 0.8;
    for(let i = 0; i < 5; i++) {
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.beginPath();
        let x = Math.random() * 512; let y = Math.random() * 512;
        ctx.moveTo(x, y);
        for(let j = 0; j < 5; j++) { x += (Math.random() - 0.5) * 150; y += (Math.random() - 0.5) * 150; ctx.lineTo(x, y); }
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  TEXTURES['marble'] = tex; return tex;
};

const RoomFloor: React.FC<{ room: Room }> = ({ room }) => {
  const textureConfig = React.useMemo(() => {
    const name = room.name.toLowerCase();
    let type = 'wood';
    let repeat = 1;
    let color = '#ffffff';
    let roughness = 0.5;
    let metalness = 0.0;
    
    if (name.includes('bath') || name.includes('kitchen')) {
      type = 'tile'; repeat = 3; roughness = 0.2; color = '#e2e8f0';
    } else if (name.includes('hall') || name.includes('entry') || name.includes('balcony')) {
      type = 'marble'; repeat = 2; roughness = 0.1; color = '#f8fafc';
    } else {
      type = 'wood'; repeat = 4; roughness = 0.6; color = '#f1f5f9';
    }
    
    let tex;
    if (type === 'wood') tex = getWoodTexture();
    else if (type === 'tile') tex = getTileTexture();
    else tex = getMarbleTexture();
    
    const clonedTex = tex.clone();
    clonedTex.needsUpdate = true;
    clonedTex.repeat.set(repeat, repeat);
    
    return { map: clonedTex, color, roughness, metalness };
  }, [room.name]);

  if (!room.corners || room.corners.length < 3) return null;
  const shape = new THREE.Shape();
  room.corners.forEach((c, i) => i === 0 ? shape.moveTo(c[0], c[1]) : shape.lineTo(c[0], c[1]));
  shape.closePath();

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial 
        map={textureConfig.map}
        color={textureConfig.color}
        roughness={textureConfig.roughness}
        metalness={textureConfig.metalness}
      />
    </mesh>
  );
};

const GlobalFloor: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
    <planeGeometry args={[200, 200]} />
    <meshStandardMaterial color="#0b0e14" roughness={0.8} />
  </mesh>
);

// ─── Main Viewer ──────────────────────────────────────────────────────────────

export const ThreeViewer: React.FC<ThreeViewerProps> = ({ data, onFurnitureChange }) => {
  const [placedFurniture, setPlacedFurniture] = useState<FurnitureItem[]>(data.furniture || []);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const isPlacing = !!selectedType;
  const controlsEnabled = !isPlacing;

  const placeFurniture = useCallback((pos: [number, number]) => {
    if (!selectedType) return;
    const newItem: FurnitureItem = { id: `f-${Date.now()}`, type: selectedType, position: pos, rotation: 0 };
    const updated = [...placedFurniture, newItem];
    setPlacedFurniture(updated);
    onFurnitureChange?.(updated);
    setSelectedType(null);
  }, [selectedType, placedFurniture, onFurnitureChange]);

  const rotateSelected = () => {
    if (!selectedId) return;
    const updated = placedFurniture.map(f =>
      f.id === selectedId ? { ...f, rotation: f.rotation + Math.PI / 2 } : f
    );
    setPlacedFurniture(updated);
    onFurnitureChange?.(updated);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const updated = placedFurniture.filter(f => f.id !== selectedId);
    setPlacedFurniture(updated);
    onFurnitureChange?.(updated);
    setSelectedId(null);
  };

  return (
    <div className="w-full h-full min-h-[600px] bg-[#0b0e14] rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-white/5 flex">

      {/* ── Furniture Palette Sidebar ── */}
      <div className={`absolute left-0 top-0 h-full z-20 transition-all duration-300 ${showPalette ? 'w-56' : 'w-0'} overflow-hidden`}>
        <div className="w-56 h-full bg-[#0e1218]/95 backdrop-blur border-r border-white/10 flex flex-col overflow-y-auto py-6">
          <div className="px-4 mb-4">
            <span className="text-[9px] text-brand-primary font-bold uppercase tracking-widest block mb-1">Furniture Palette</span>
            <p className="text-[10px] text-gray-500 leading-relaxed">Click an item, then click the floor to place</p>
          </div>
          {FURNITURE_CATALOG.map(cat => (
            <div key={cat.category} className="px-4 mb-4">
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest block mb-2">{cat.category}</span>
              <div className="flex flex-col gap-1">
                {cat.items.map(item => (
                  <button
                    key={item.type}
                    onClick={() => setSelectedType(selectedType === item.type ? null : item.type)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedType === item.type
                        ? 'bg-brand-primary text-[#0b0e14] font-bold'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3D Canvas ── */}
      <div className="flex-1 relative" style={{ marginLeft: showPalette ? '14rem' : '0', transition: 'margin 0.3s' }}>
        <Canvas shadows gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[18, 18, 18]} fov={35} />
            <OrbitControls
              makeDefault
              enabled={controlsEnabled}
              minPolarAngle={0}
              maxPolarAngle={Math.PI / 2.2}
              enableDamping
              dampingFactor={0.05}
            />
            <color attach="background" args={['#0b0e14']} />
            <ambientLight intensity={0.4} />
            <pointLight position={[15, 15, 15]} intensity={1.5} castShadow />
            <spotLight position={[-15, 25, 15]} angle={0.2} penumbra={1} intensity={2.5} castShadow />
            <directionalLight position={[0, 20, 0]} intensity={0.5} />

            <group>
              {data.walls.map((wall, i) => <WallSegment key={`wall-${i}`} wall={wall} />)}
              {data.rooms.map((room, i) => <RoomFloor key={`room-${i}`} room={room} />)}
              {placedFurniture.map(item => (
                <FurnitureMesh
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  onSelect={id => setSelectedId(selectedId === id ? null : id)}
                />
              ))}
              <GlobalFloor />
            </group>

            <FloorClickDetector onFloorClick={placeFurniture} enabled={isPlacing} />

            <Grid
              infiniteGrid
              fadeDistance={60}
              cellColor="#4fd1c5"
              sectionColor="#4fd1c5"
              sectionThickness={1}
              cellSize={1}
              sectionSize={5}
            />
            <ContactShadows position={[0, -0.01, 0]} opacity={0.8} scale={40} blur={2.5} far={10} />
            <Environment preset="night" />
          </Suspense>
        </Canvas>

        {/* Placing Banner */}
        {isPlacing && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-brand-primary text-[#0b0e14] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl flex items-center gap-2 z-10">
            <div className="w-2 h-2 rounded-full bg-[#0b0e14] animate-pulse" />
            Click floor to place · <span className="underline">{selectedType}</span>
            <button onClick={() => setSelectedType(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
          </div>
        )}

        {/* Selected Item Actions */}
        {selectedId && !isPlacing && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            <button onClick={rotateSelected} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition">
              <RotateCcw className="w-3.5 h-3.5" /> Rotate 90°
            </button>
            <button onClick={deleteSelected} className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button onClick={() => setSelectedId(null)} className="bg-white/5 hover:bg-white/10 text-gray-400 px-3 py-2 rounded-xl transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bottom HUD */}
        <div className="absolute bottom-6 left-6 p-5 rounded-3xl border border-white/10 bg-[#0e1218]/80 backdrop-blur text-white pointer-events-none max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-primary">Neural Architecture</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            {placedFurniture.length} item{placedFurniture.length !== 1 ? 's' : ''} placed · Drag to orbit · Scroll to zoom
          </p>
        </div>

        {/* Palette Toggle */}
        <button
          onClick={() => setShowPalette(p => !p)}
          className={`absolute bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider border transition z-10 ${
            showPalette
              ? 'bg-brand-primary text-[#0b0e14] border-brand-primary'
              : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
          }`}
        >
          <Sofa className="w-4 h-4" />
          {showPalette ? 'Close Palette' : 'Add Furniture'}
        </button>
      </div>
    </div>
  );
};
