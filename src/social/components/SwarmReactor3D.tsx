import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';

interface SwarmReactorProps {
    onSelectNode?: (id: string) => void;
    selectedNodeId?: string;
}

interface DataNode {
    id: string;
    label: string;
    sublabel: string;
    metric: string;
    change: string;
    icon: string;
    color: string;
    position: [number, number, number];
    volume: string;
    sentiment: string;
}

const SWARM_DATA_NODES: DataNode[] = [
    {
        id: 'node-cleanpuff',
        label: '@cleanpuffio',
        sublabel: 'Official X & TikTok Brand',
        metric: '184.2K',
        change: '+340% 7d',
        icon: '🦨',
        color: '#00e5a0',
        position: [-2.8, 0.4, 0],
        volume: '1,420 posts/day',
        sentiment: '94% Positive'
    },
    {
        id: 'node-queef',
        label: 'queef.io',
        sublabel: 'Primary Landing & Mint Portal',
        metric: '42.8K',
        change: '+88% 24h',
        icon: '🌐',
        color: '#00d4ff',
        position: [-0.9, -0.6, 0.3],
        volume: '18.4K visits/day',
        sentiment: '99% Uptime'
    },
    {
        id: 'node-telegram',
        label: 'Telegram HQ',
        sublabel: 'Community Alpha Channel',
        metric: '12.4K',
        change: '+14% 24h',
        icon: '✈️',
        color: '#8b5cf6',
        position: [1.0, 0.6, 0.2],
        volume: '8,400 msg/day',
        sentiment: '91% Active'
    },
    {
        id: 'node-swarm-qm',
        label: 'Pulse Sentinel AI',
        sublabel: 'GOAP Subagent Scraper',
        metric: '3 Pending',
        change: 'Auto-Dispatch',
        icon: '🤖',
        color: '#ff2d78',
        position: [2.9, -0.3, 0],
        volume: '50 streams/min',
        sentiment: '0.04s Latency'
    }
];

function InteractiveNetworkEdge({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
    const lineRef = useRef<any>(null);

    useFrame((state) => {
        if (lineRef.current) {
            const material = lineRef.current.material as THREE.LineBasicMaterial;
            material.opacity = 0.3 + Math.sin(state.clock.getElapsedTime() * 3) * 0.15;
        }
    });

    const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];

    return (
        <line ref={lineRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
                />
            </bufferGeometry>
            <lineBasicMaterial color={color} opacity={0.4} transparent linewidth={1.5} />
        </line>
    );
}

function DataNodePoint({ node, isSelected, onClick }: { node: DataNode; isSelected: boolean; onClick: () => void }) {
    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <group position={node.position}>
                {/* Glowing Node Dot */}
                <mesh onClick={onClick}>
                    <sphereGeometry args={[0.22, 24, 24]} />
                    <meshBasicMaterial color={node.color} />
                </mesh>

                {/* Outer Pulsing Ring */}
                <mesh>
                    <ringGeometry args={[0.32, 0.36, 32]} />
                    <meshBasicMaterial color={node.color} opacity={isSelected ? 0.9 : 0.4} transparent />
                </mesh>

                {/* OBSERVABLE D3 STYLE HIGH-DENSITY DATA CARD */}
                <Html center distanceFactor={9} style={{ pointerEvents: 'none' }}>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                        }}
                        style={{
                            background: 'rgba(10, 15, 24, 0.92)',
                            backdropFilter: 'blur(12px)',
                            border: `1.5px solid ${isSelected ? node.color : 'rgba(255,255,255,0.12)'}`,
                            borderRadius: '10px',
                            padding: '8px 12px',
                            minWidth: '160px',
                            boxShadow: `0 8px 24px ${node.color}30`,
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{node.icon}</span> {node.label}
                            </span>
                            <span style={{ fontSize: '9px', background: `${node.color}25`, color: node.color, padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                {node.change}
                            </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: 6 }}>
                            {node.sublabel}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <span style={{ fontSize: '14px', fontWeight: 900, color: node.color, fontFamily: 'monospace' }}>
                                {node.metric}
                            </span>
                            <span style={{ fontSize: '9px', color: '#cbd5e1', fontWeight: 600 }}>
                                {node.volume}
                            </span>
                        </div>
                    </div>
                </Html>
            </group>
        </Float>
    );
}

export default function SwarmReactor3D({ onSelectNode, selectedNodeId }: SwarmReactorProps) {
    const [activeNode, setActiveNode] = useState<DataNode>(SWARM_DATA_NODES[0]);

    const handleNodeClick = (node: DataNode) => {
        setActiveNode(node);
        onSelectNode?.(node.id);
    };

    return (
        <div style={{ width: '100%', height: '280px', position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0, 229, 160, 0.35)', background: 'radial-gradient(ellipse at center, rgba(12, 18, 30, 0.96), rgba(6, 8, 12, 0.99))', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}>
            {/* OBSERVABLE D3 STYLE TITLE & METRIC HEADER */}
            <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, background: 'rgba(0, 229, 160, 0.15)', color: '#00e5a0', padding: '4px 10px', borderRadius: 6, fontWeight: 900, letterSpacing: '0.04em', border: '1px solid rgba(0, 229, 160, 0.3)', fontFamily: 'monospace' }}>
                    📊 OBSERVABLE D3 DATA MESH
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Live Quantitative Node Topology — Direct Signal Flow & Volume Graph
                </span>
            </div>

            {/* QUICK EXECUTIVE METRICS TOP RIGHT */}
            <div style={{ position: 'absolute', top: 12, right: 16, zIndex: 10, display: 'flex', gap: 8 }}>
                <div style={{ background: 'rgba(8, 12, 20, 0.85)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: 10, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    TOTAL SIGNAL VOL: <strong style={{ color: '#00e5a0' }}>242.8K/day</strong>
                </div>
                <div style={{ background: 'rgba(8, 12, 20, 0.85)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: 10, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    HEALTH: <strong style={{ color: '#00d4ff' }}>99.8% OK</strong>
                </div>
            </div>

            {/* THREE.JS / D3 HYBRID CANVAS */}
            <Canvas camera={{ position: [0, 0, 7.2], fov: 46 }}>
                <ambientLight intensity={0.9} />

                {/* NETWORK FLOW EDGES (CONNECTING NODES IN GRAPH TOPOLOGY) */}
                <InteractiveNetworkEdge start={SWARM_DATA_NODES[0].position} end={SWARM_DATA_NODES[1].position} color="#00e5a0" />
                <InteractiveNetworkEdge start={SWARM_DATA_NODES[1].position} end={SWARM_DATA_NODES[2].position} color="#00d4ff" />
                <InteractiveNetworkEdge start={SWARM_DATA_NODES[2].position} end={SWARM_DATA_NODES[3].position} color="#8b5cf6" />
                <InteractiveNetworkEdge start={SWARM_DATA_NODES[0].position} end={SWARM_DATA_NODES[3].position} color="#ff2d78" />

                {/* FORCE-DIRECTED DATA NODES */}
                {SWARM_DATA_NODES.map((node) => (
                    <DataNodePoint
                        key={node.id}
                        node={node}
                        isSelected={selectedNodeId === node.id || activeNode.id === node.id}
                        onClick={() => handleNodeClick(node)}
                    />
                ))}
            </Canvas>

            {/* ACTIONABLE BOTTOM DATA DRAWER */}
            <div style={{ position: 'absolute', bottom: 10, left: 16, right: 16, zIndex: 10, background: 'rgba(10, 15, 24, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-primary)' }}>
                    <span>{activeNode.icon}</span>
                    <strong style={{ color: activeNode.color }}>{activeNode.label}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>| {activeNode.volume} • {activeNode.sentiment}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        type="button"
                        style={{ background: activeNode.color, color: '#08090d', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                        onClick={() => alert(`Selected ${activeNode.label}: ${activeNode.volume}`)}
                    >
                        ⚡ Inspect Node Telemetry
                    </button>
                </div>
            </div>
        </div>
    );
}

