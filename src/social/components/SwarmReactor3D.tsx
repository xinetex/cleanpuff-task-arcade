import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshWobbleMaterial, Sphere, Torus, Octahedron, Box, Html } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

interface SwarmReactorProps {
    onSelectNode?: (id: string) => void;
    selectedNodeId?: string;
}

function SubagentOrb({ position, color, label, metric, speed, shape, onClick, isSelected }: {
    position: [number, number, number];
    color: string;
    label: string;
    metric: string;
    speed: number;
    shape: 'sphere' | 'box' | 'torus' | 'octahedron';
    onClick: () => void;
    isSelected: boolean;
}) {
    const meshRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * speed;
            meshRef.current.rotation.x += delta * (speed * 0.5);
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.8} floatIntensity={1.2}>
            <group position={position} onClick={onClick}>
                <group ref={meshRef}>
                    {shape === 'sphere' && (
                        <Sphere args={[0.65, 32, 32]}>
                            <MeshWobbleMaterial color={color} factor={0.5} speed={2.5} roughness={0.2} metalness={0.8} emissive={color} emissiveIntensity={isSelected ? 0.6 : 0.2} />
                        </Sphere>
                    )}
                    {shape === 'box' && (
                        <Box args={[0.9, 0.9, 0.9]}>
                            <MeshWobbleMaterial color={color} factor={0.4} speed={2} roughness={0.3} metalness={0.7} emissive={color} emissiveIntensity={isSelected ? 0.6 : 0.2} />
                        </Box>
                    )}
                    {shape === 'torus' && (
                        <Torus args={[0.55, 0.18, 16, 32]}>
                            <MeshWobbleMaterial color={color} factor={0.5} speed={2.5} roughness={0.2} metalness={0.8} emissive={color} emissiveIntensity={isSelected ? 0.6 : 0.2} />
                        </Torus>
                    )}
                    {shape === 'octahedron' && (
                        <Octahedron args={[0.75]}>
                            <MeshWobbleMaterial color={color} factor={0.6} speed={3} roughness={0.1} metalness={0.9} emissive={color} emissiveIntensity={isSelected ? 0.8 : 0.3} />
                        </Octahedron>
                    )}
                </group>

                {/* ALWAYS BILLBOARDED HTML OVERLAY (NEVER MIRRORED OR BACKWARD) */}
                <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                        }}
                        style={{
                            background: 'rgba(8, 12, 20, 0.85)',
                            backdropFilter: 'blur(8px)',
                            border: `1.5px solid ${isSelected ? color : 'rgba(255,255,255,0.15)'}`,
                            borderRadius: '10px',
                            padding: '6px 12px',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            boxShadow: `0 4px 16px ${color}40`,
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                            {label}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: color, marginTop: '2px' }}>
                            {metric}
                        </div>
                    </div>
                </Html>
            </group>
        </Float>
    );
}

function DataParticleRings() {
    const ringRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (ringRef.current) {
            ringRef.current.rotation.z += delta * 0.15;
            ringRef.current.rotation.y += delta * 0.08;
        }
    });

    return (
        <group ref={ringRef}>
            <Torus args={[3.2, 0.015, 16, 100]} rotation={[Math.PI / 3.5, 0, 0]}>
                <meshBasicMaterial color="#00e5a0" opacity={0.35} transparent />
            </Torus>
            <Torus args={[3.8, 0.012, 16, 100]} rotation={[-Math.PI / 4, 0, 0]}>
                <meshBasicMaterial color="#00d4ff" opacity={0.25} transparent />
            </Torus>
            <Torus args={[4.4, 0.01, 16, 100]} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
                <meshBasicMaterial color="#8b5cf6" opacity={0.25} transparent />
            </Torus>
        </group>
    );
}

export default function SwarmReactor3D({ onSelectNode, selectedNodeId }: SwarmReactorProps) {
    return (
        <div style={{ width: '100%', height: '360px', position: 'relative', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(0, 229, 160, 0.4)', background: 'radial-gradient(circle at center, rgba(14, 20, 32, 0.95), rgba(8, 9, 13, 0.98))', boxShadow: '0 12px 36px rgba(0,0,0,0.5)' }}>
            {/* HUD HEADER */}
            <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, pointerEvents: 'none' }}>
                <span style={{ fontSize: 11, background: 'rgba(0, 229, 160, 0.15)', color: '#00e5a0', padding: '3px 10px', borderRadius: 10, fontWeight: 900, letterSpacing: '0.5px', border: '1px solid rgba(0, 229, 160, 0.4)' }}>
                    🌌 4D KINETIC AI SWARM MESH
                </span>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 6, fontWeight: 700 }}>
                    Real-time Autonomous Subagent Network — Hover or click any orb to inspect live decisions
                </div>
            </div>

            {/* LEGEND / QUICK INFO BAR IN BOTTOM RIGHT */}
            <div style={{ position: 'absolute', bottom: 12, right: 16, zIndex: 10, background: 'rgba(8, 12, 20, 0.85)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 10, color: 'var(--text-muted)', display: 'flex', gap: 12, pointerEvents: 'none' }}>
                <span>📡 Pulse Sentinel (Scraper)</span>
                <span>📅 Chronos (Scheduler)</span>
                <span>👛 Ledger (Solana Validator)</span>
                <span>🤖 Quartermaster (Exec AI)</span>
            </div>

            <Canvas camera={{ position: [0, 0, 7.5], fov: 48 }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#00e5a0" />
                <pointLight position={[-10, -10, -10]} intensity={1.0} color="#8b5cf6" />

                <DataParticleRings />

                {/* Subagent 3D Nodes with Crisp Billboarded Overlays */}
                <SubagentOrb
                    position={[-2.4, 0.3, 0]}
                    color="#00e5a0"
                    label="📡 Pulse Sentinel"
                    metric="+340% Trend Velocity"
                    speed={0.8}
                    shape="sphere"
                    isSelected={selectedNodeId === 'agent-1'}
                    onClick={() => onSelectNode?.('agent-1')}
                />
                <SubagentOrb
                    position={[-0.8, -0.6, 0.5]}
                    color="#00d4ff"
                    label="📅 Chronos Publisher"
                    metric="Sheet Sync 99.8%"
                    speed={0.6}
                    shape="box"
                    isSelected={selectedNodeId === 'agent-2'}
                    onClick={() => onSelectNode?.('agent-2')}
                />
                <SubagentOrb
                    position={[0.8, 0.6, 0.3]}
                    color="#8b5cf6"
                    label="👛 Ledger Watcher"
                    metric="1,998 Active Wallets"
                    speed={0.7}
                    shape="torus"
                    isSelected={selectedNodeId === 'agent-3'}
                    onClick={() => onSelectNode?.('agent-3')}
                />
                <SubagentOrb
                    position={[2.4, -0.3, 0]}
                    color="#ff2d78"
                    label="🤖 Quartermaster"
                    metric="3 Pending Actions"
                    speed={1.0}
                    shape="octahedron"
                    isSelected={selectedNodeId === 'agent-4'}
                    onClick={() => onSelectNode?.('agent-4')}
                />
            </Canvas>
        </div>
    );
}
