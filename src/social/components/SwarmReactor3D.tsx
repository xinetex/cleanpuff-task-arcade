import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Text, MeshWobbleMaterial, Sphere, Torus, Octahedron, Box } from '@react-three/drei';
import { useRef, useState } from 'react';
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

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * speed;
            meshRef.current.rotation.x += delta * (speed * 0.5);
        }
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
            <group position={position} onClick={onClick}>
                <group ref={meshRef}>
                    {shape === 'sphere' && (
                        <Sphere args={[0.7, 32, 32]}>
                            <MeshWobbleMaterial color={color} factor={0.6} speed={3} roughness={0.2} metalness={0.8} emissive={color} emissiveIntensity={isSelected ? 0.6 : 0.2} />
                        </Sphere>
                    )}
                    {shape === 'box' && (
                        <Box args={[1, 1, 1]}>
                            <MeshWobbleMaterial color={color} factor={0.4} speed={2} roughness={0.3} metalness={0.7} emissive={color} emissiveIntensity={isSelected ? 0.6 : 0.2} />
                        </Box>
                    )}
                    {shape === 'torus' && (
                        <Torus args={[0.6, 0.2, 16, 32]}>
                            <MeshWobbleMaterial color={color} factor={0.5} speed={2.5} roughness={0.2} metalness={0.8} emissive={color} emissiveIntensity={isSelected ? 0.6 : 0.2} />
                        </Torus>
                    )}
                    {shape === 'octahedron' && (
                        <Octahedron args={[0.8]}>
                            <MeshWobbleMaterial color={color} factor={0.7} speed={3.5} roughness={0.1} metalness={0.9} emissive={color} emissiveIntensity={isSelected ? 0.8 : 0.3} />
                        </Octahedron>
                    )}
                </group>

                {/* 3D Floating Labels */}
                <Text
                    position={[0, 1.2, 0]}
                    fontSize={0.28}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    fontWeight="bold"
                >
                    {label}
                </Text>
                <Text
                    position={[0, -1.1, 0]}
                    fontSize={0.22}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                >
                    {metric}
                </Text>
            </group>
        </Float>
    );
}

function DataParticleRings() {
    const ringRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (ringRef.current) {
            ringRef.current.rotation.z += delta * 0.2;
            ringRef.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <group ref={ringRef}>
            <Torus args={[3.2, 0.02, 16, 100]} rotation={[Math.PI / 3, 0, 0]}>
                <meshBasicMaterial color="#00e5a0" opacity={0.4} transparent />
            </Torus>
            <Torus args={[3.8, 0.015, 16, 100]} rotation={[-Math.PI / 4, 0, 0]}>
                <meshBasicMaterial color="#00d4ff" opacity={0.3} transparent />
            </Torus>
            <Torus args={[4.4, 0.01, 16, 100]} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
                <meshBasicMaterial color="#8b5cf6" opacity={0.3} transparent />
            </Torus>
        </group>
    );
}

export default function SwarmReactor3D({ onSelectNode, selectedNodeId }: SwarmReactorProps) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    return (
        <div style={{ width: '100%', height: '340px', position: 'relative', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(0, 229, 160, 0.3)', background: 'radial-gradient(circle at center, rgba(14, 20, 32, 0.95), rgba(8, 9, 13, 0.98))' }}>
            <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, pointerEvents: 'none' }}>
                <span style={{ fontSize: 11, background: 'rgba(0, 229, 160, 0.15)', color: '#00e5a0', padding: '3px 10px', borderRadius: 10, fontWeight: 800, letterSpacing: '0.5px' }}>
                    🌌 3D PROCEDURAL LIVING INFOGRAPHIC
                </span>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Realtime Volumetric Subagent Swarm Reactor — Tap any 3D node to inspect
                </div>
            </div>

            <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <pointLight position={[10, 10, 10]} intensity={1.2} color="#00e5a0" />
                <pointLight position={[-10, -10, -10]} intensity={0.8} color="#8b5cf6" />

                <DataParticleRings />

                {/* Subagent 3D Nodes */}
                <SubagentOrb
                    position={[-2.4, 0.2, 0]}
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
                    position={[2.4, -0.2, 0]}
                    color="#ff2d78"
                    label="🤖 Quartermaster"
                    metric="3 Pending Actions"
                    speed={1.0}
                    shape="octahedron"
                    isSelected={selectedNodeId === 'agent-4'}
                    onClick={() => onSelectNode?.('agent-4')}
                />

                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 3} />
            </Canvas>
        </div>
    );
}
