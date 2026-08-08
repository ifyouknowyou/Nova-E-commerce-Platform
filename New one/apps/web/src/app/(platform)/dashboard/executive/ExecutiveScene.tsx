'use client';

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { apiFetch } from '@/lib/api/client';

interface Kpis {
  revenue: number;
  pipelineValue: number;
  outstanding: number;
  openDeals: number;
  openTasks: number;
}
interface GraphNode { id: string; type: string; label: string; meta?: Record<string, unknown>; }
interface GraphEdge { source: string; target: string; }

/** Scale a value into a 0.15–1.4 box height (KPI bars). */
function barHeight(v: number, max: number): number {
  return 0.15 + (1.3 * v) / Math.max(max, 1);
}

function KpiBars({ kpis }: { kpis: Kpis }) {
  const items = [
    { label: 'Revenue', v: kpis.revenue, color: '#4a90ff' },
    { label: 'Pipeline', v: kpis.pipelineValue, color: '#7c5cff' },
    { label: 'Outstanding', v: kpis.outstanding, color: '#f59e0b' },
  ];
  const max = Math.max(...items.map((i) => i.v), 1);
  return (
    <group position={[-6, 0, 0]}>
      {items.map((it, i) => {
        const h = barHeight(it.v, max);
        return (
          <group key={it.label} position={[i * 3.4, 0, 0]}>
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[1.7, h, 1.7]} />
              <meshStandardMaterial color={it.color} />
            </mesh>
            <Text position={[0, -1.1, 0]} fontSize={0.32} color="#a9b7c6" anchorX="center" anchorY="middle">
              {it.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function GraphGlobe({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const pts = nodes.map((_, i) => {
    const n = Math.max(nodes.length, 1);
    const ga = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = ga * i;
    return { x: Math.cos(theta) * r * 6, y: y * 6, z: Math.sin(theta) * r * 6 };
  });
  const posById = new Map<string, { x: number; y: number; z: number }>();
  nodes.forEach((n, i) => {
    const p = pts[i];
    if (p) posById.set(n.id, p);
  });

  return (
    <group position={[7.5, 0.5, 0]}>
      <mesh>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#2c3a48" emissive="#0b1420" emissiveIntensity={0.3} />
      </mesh>
      {pts.map((p, i) => (
        <mesh key={nodes[i]?.id ?? i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#e8a03a" />
        </mesh>
      ))}
      {edges.map((e, i) => {
        const a = posById.get(e.source);
        const b = posById.get(e.target);
        if (!a || !b) return null;
        const v1 = new THREE.Vector3(a.x, a.y, a.z);
        const v2 = new THREE.Vector3(b.x, b.y, b.z);
        return (
          <mesh key={i}>
            <tubeGeometry args={[new THREE.CatmullRomCurve3([v1, v2]), 4, 0.02, 4, false]} />
            <meshBasicMaterial color="#4a90ff" />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * OWNER/EXECUTIVE 3D command center — KPI bars + a Business Graph globe built
 * from the real tenant graph & KPIs. Loaded only via next/dynamic(ssr:false)
 * so Three.js never lands in the shared main bundle.
 */
export default function ExecutiveScene() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    apiFetch<Kpis>('/dashboard/kpis').then(setKpis).catch(() => undefined);
    apiFetch<{ nodes: GraphNode[]; edges: GraphEdge[] }>('/ai/graph').then(setGraph).catch(() => undefined);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
  }, []);

  return (
    <div
      style={{
        height: 560,
        width: '100%',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--nexus-surface)',
        border: '1px solid var(--nexus-border)',
      }}
    >
      <Canvas camera={{ position: [11, 6, 13], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[8, 10, 6]} intensity={1.1} />
        <KpiBars kpis={kpis ?? { revenue: 0, pipelineValue: 0, outstanding: 0, openDeals: 0, openTasks: 0 }} />
        <GraphGlobe nodes={graph.nodes} edges={graph.edges} />
        {!reduced && <OrbitControls autoRotate autoRotateSpeed={0.6} enablePan={false} />}
        {reduced && <OrbitControls enablePan={false} />}
      </Canvas>
      <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'var(--nexus-muted)', fontSize: 12 }}>
        Executive command center — KPIs + real business graph from your org. Drag to orbit.
      </div>
    </div>
  );
}