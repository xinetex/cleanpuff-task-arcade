import { useState } from 'react';

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
    volume: string;
    sentiment: string;
    activeStream: string;
    x: number;
    y: number;
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
        volume: '1,420 posts/day',
        sentiment: '94% Positive',
        activeStream: 'Live Audio Trend "#PuffHero"',
        x: 90,
        y: 80
    },
    {
        id: 'node-queef',
        label: 'queef.io',
        sublabel: 'Primary Landing & Mint Portal',
        metric: '42.8K',
        change: '+88% 24h',
        icon: '🌐',
        color: '#00d4ff',
        volume: '18.4K visits/day',
        sentiment: '99% Uptime',
        activeStream: 'S3 CDN Hydration Active',
        x: 320,
        y: 180
    },
    {
        id: 'node-telegram',
        label: 'Telegram HQ',
        sublabel: 'Community Alpha Channel',
        metric: '12.4K',
        change: '+14% 24h',
        icon: '✈️',
        color: '#8b5cf6',
        volume: '8,400 msg/day',
        sentiment: '91% Active',
        activeStream: 'Mini App Whitelist Qualified',
        x: 550,
        y: 70
    },
    {
        id: 'node-swarm-qm',
        label: 'Pulse Sentinel AI',
        sublabel: 'GOAP Subagent Scraper',
        metric: '3 Pending',
        change: 'Auto-Dispatch',
        icon: '🤖',
        color: '#ff2d78',
        volume: '50 streams/min',
        sentiment: '0.04s Latency',
        activeStream: 'Crawl4AI Signal Processor',
        x: 780,
        y: 170
    }
];

// 24-HOUR HEATMAP DATA MATRIX (7 DAYS x 24 HOURS)
const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEATMAP_HOURS = Array.from({ length: 24 }, (_, i) => i);
const generateHeatmapMatrix = () => {
    return HEATMAP_DAYS.map((day, dIdx) => ({
        day,
        hours: HEATMAP_HOURS.map((h) => {
            // Simulate peak hours around 14:00 - 20:00
            const isPeak = h >= 14 && h <= 21;
            const value = isPeak ? 70 + Math.floor(Math.sin(dIdx + h) * 25) + (h === 17 ? 28 : 0) : 10 + Math.floor(Math.random() * 35);
            return { hour: h, val: Math.min(100, Math.max(5, value)) };
        })
    }));
};

const HEATMAP_DATA = generateHeatmapMatrix();

export default function SwarmReactor3D({ onSelectNode, selectedNodeId }: SwarmReactorProps) {
    const [activeNode, setActiveNode] = useState<DataNode>(SWARM_DATA_NODES[0]);
    const [vizMode, setVizMode] = useState<'topology' | 'heatmap' | 'streamgraph'>('topology');

    const handleNodeClick = (node: DataNode) => {
        setActiveNode(node);
        onSelectNode?.(node.id);
    };

    return (
        <div style={{ width: '100%', position: 'relative', borderRadius: '16px', border: '1px solid rgba(0, 229, 160, 0.35)', background: 'radial-gradient(ellipse at center, rgba(12, 18, 30, 0.98), rgba(6, 8, 12, 0.99))', padding: '20px', boxShadow: '0 12px 32px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
            {/* D3 METRIC HEADER BAR & MODE SELECTOR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, background: 'rgba(0, 229, 160, 0.15)', color: '#00e5a0', padding: '4px 10px', borderRadius: 6, fontWeight: 900, letterSpacing: '0.04em', border: '1px solid rgba(0, 229, 160, 0.3)', fontFamily: 'monospace' }}>
                        📊 OBSERVABLE D3 DATA ENGINE
                    </span>

                    {/* VIZ MODE TOGGLE TABS */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: 3, borderRadius: 8, border: '1px solid var(--border-light)' }}>
                        <button
                            type="button"
                            onClick={() => setVizMode('topology')}
                            style={{
                                background: vizMode === 'topology' ? '#00e5a0' : 'transparent',
                                color: vizMode === 'topology' ? '#08090d' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: 6,
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            🕸️ Signal Flow Network
                        </button>
                        <button
                            type="button"
                            onClick={() => setVizMode('heatmap')}
                            style={{
                                background: vizMode === 'heatmap' ? '#00d4ff' : 'transparent',
                                color: vizMode === 'heatmap' ? '#08090d' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: 6,
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            🔥 24h Signal Heatmap
                        </button>
                        <button
                            type="button"
                            onClick={() => setVizMode('streamgraph')}
                            style={{
                                background: vizMode === 'streamgraph' ? '#8b5cf6' : 'transparent',
                                color: vizMode === 'streamgraph' ? '#fff' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: 6,
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            📈 Streamgraph Volume
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ background: 'rgba(8, 12, 20, 0.85)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: 10, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        TOTAL VOL: <strong style={{ color: '#00e5a0' }}>242.8K/day</strong>
                    </div>
                    <div style={{ background: 'rgba(8, 12, 20, 0.85)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: 10, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        HEALTH: <strong style={{ color: '#00d4ff' }}>99.8% OK</strong>
                    </div>
                </div>
            </div>

            {/* MODE 1: D3 SIGNAL FLOW TOPOLOGY GRAPH WITH BEZIER CABLES & PULSING PARTICLES */}
            {vizMode === 'topology' && (
                <div style={{ position: 'relative', height: 260, borderRadius: 12, background: 'rgba(8, 12, 20, 0.6)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', padding: 12, marginBottom: 16 }}>
                    {/* SVG Bezier Flow Cables */}
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        <defs>
                            <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#00e5a0" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.6" />
                            </linearGradient>
                            <linearGradient id="flowGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
                            </linearGradient>
                            <linearGradient id="flowGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#ff2d78" stopOpacity="0.6" />
                            </linearGradient>
                        </defs>

                        {/* Cables */}
                        <path d="M 180 110 C 240 110, 260 190, 320 190" stroke="url(#flowGrad1)" strokeWidth="3" fill="none" strokeDasharray="6 4" />
                        <path d="M 430 190 C 480 190, 500 100, 560 100" stroke="url(#flowGrad2)" strokeWidth="3" fill="none" strokeDasharray="6 4" />
                        <path d="M 680 100 C 720 100, 740 180, 800 180" stroke="url(#flowGrad3)" strokeWidth="3" fill="none" strokeDasharray="6 4" />

                        {/* Direct Feedback Loop Cable */}
                        <path d="M 800 180 C 600 240, 300 240, 180 110" stroke="#00e5a0" strokeWidth="1.5" strokeOpacity="0.3" fill="none" strokeDasharray="4 6" />
                    </svg>

                    {/* Node Cards overlay on topology */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, height: '100%', position: 'relative', zIndex: 2 }}>
                        {SWARM_DATA_NODES.map((node) => {
                            const isSelected = selectedNodeId === node.id || activeNode.id === node.id;
                            return (
                                <div
                                    key={node.id}
                                    onClick={() => handleNodeClick(node)}
                                    style={{
                                        background: isSelected ? 'rgba(14, 22, 36, 0.95)' : 'rgba(10, 15, 24, 0.85)',
                                        backdropFilter: 'blur(12px)',
                                        border: `1.5px solid ${isSelected ? node.color : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '12px',
                                        padding: '14px',
                                        cursor: 'pointer',
                                        boxShadow: isSelected ? `0 8px 24px ${node.color}40` : 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 16 }}>{node.icon}</span> {node.label}
                                            </span>
                                            <span style={{ fontSize: 9, background: `${node.color}25`, color: node.color, padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                                                {node.change}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{node.sublabel}</div>
                                    </div>

                                    {/* Sparkline Visual */}
                                    <div style={{ margin: '8px 0', height: 28, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                                        {[40, 65, 30, 85, 95, 60, 100, 75, 90, 110].map((h, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    flex: 1,
                                                    height: `${(h / 110) * 100}%`,
                                                    background: node.color,
                                                    opacity: idx >= 7 ? 0.95 : 0.35,
                                                    borderRadius: 2
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div>
                                            <div style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>REACH</div>
                                            <div style={{ fontSize: 15, fontWeight: 900, color: node.color, fontFamily: 'monospace' }}>{node.metric}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>VOLUME</div>
                                            <div style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 700 }}>{node.volume}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODE 2: 24-HOUR SOCIAL SIGNAL HEATMAP MATRIX GRID */}
            {vizMode === 'heatmap' && (
                <div style={{ height: 260, borderRadius: 12, background: 'rgba(8, 12, 20, 0.8)', border: '1px solid rgba(255,255,255,0.08)', padding: 16, marginBottom: 16, overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 800 }}>🔥 7-Day x 24-Hour Signal Density Heatmap Matrix</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                            <span>Low</span>
                            <div style={{ width: 12, height: 12, background: '#003820', borderRadius: 2 }} />
                            <div style={{ width: 12, height: 12, background: '#008a54', borderRadius: 2 }} />
                            <div style={{ width: 12, height: 12, background: '#00e5a0', borderRadius: 2 }} />
                            <div style={{ width: 12, height: 12, background: '#00ffff', borderRadius: 2 }} />
                            <span>Peak (Wed 5PM EST)</span>
                        </div>
                    </div>

                    {/* Heatmap Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {HEATMAP_DATA.map((row) => (
                            <div key={row.day} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 32, fontSize: 10, color: '#94a3b8', fontWeight: 700, fontFamily: 'monospace' }}>{row.day}</span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 3, flex: 1 }}>
                                    {row.hours.map((cell) => {
                                        const bg = cell.val > 80 ? '#00ffff' : cell.val > 60 ? '#00e5a0' : cell.val > 35 ? '#008a54' : '#003820';
                                        return (
                                            <div
                                                key={cell.hour}
                                                title={`${row.day} ${cell.hour}:00 EST — Volume: ${cell.val} signals/min`}
                                                style={{
                                                    height: 22,
                                                    background: bg,
                                                    borderRadius: 3,
                                                    opacity: cell.val / 100,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s'
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Hours Legend */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingLeft: 40 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 3, flex: 1, fontSize: 8, color: '#64748b', fontFamily: 'monospace', textAlign: 'center' }}>
                            {HEATMAP_HOURS.map((h) => (
                                <span key={h}>{h % 4 === 0 ? `${h}h` : ''}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODE 3: STREAMGRAPH AREA CURVE DATA DISTRIBUTION */}
            {vizMode === 'streamgraph' && (
                <div style={{ height: 260, borderRadius: 12, background: 'rgba(8, 12, 20, 0.8)', border: '1px solid rgba(255,255,255,0.08)', padding: 16, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 800 }}>📈 Multi-Channel Signal Volume Streamgraph</span>
                        <div style={{ display: 'flex', gap: 12, fontSize: 10, fontWeight: 700 }}>
                            <span style={{ color: '#00e5a0' }}>● X / TikTok (42%)</span>
                            <span style={{ color: '#00d4ff' }}>● queef.io (28%)</span>
                            <span style={{ color: '#8b5cf6' }}>● Telegram (18%)</span>
                            <span style={{ color: '#ff2d78' }}>● Farcaster (12%)</span>
                        </div>
                    </div>

                    <svg style={{ width: '100%', height: 190, overflow: 'visible' }}>
                        <defs>
                            <linearGradient id="sgGrad1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00e5a0" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="#00e5a0" stopOpacity="0.05" />
                            </linearGradient>
                            <linearGradient id="sgGrad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.05" />
                            </linearGradient>
                            <linearGradient id="sgGrad3" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                            </linearGradient>
                        </defs>

                        {/* Stream Area Curves */}
                        <path d="M 0 160 Q 200 60, 400 120 T 800 40 L 800 190 L 0 190 Z" fill="url(#sgGrad1)" />
                        <path d="M 0 140 Q 200 90, 400 140 T 800 90 L 800 190 L 0 190 Z" fill="url(#sgGrad2)" />
                        <path d="M 0 170 Q 200 130, 400 160 T 800 130 L 800 190 L 0 190 Z" fill="url(#sgGrad3)" />

                        {/* Top Line Contour */}
                        <path d="M 0 160 Q 200 60, 400 120 T 800 40" stroke="#00e5a0" strokeWidth="2.5" fill="none" />
                        <path d="M 0 140 Q 200 90, 400 140 T 800 90" stroke="#00d4ff" strokeWidth="2" fill="none" />
                        <path d="M 0 170 Q 200 130, 400 160 T 800 130" stroke="#8b5cf6" strokeWidth="2" fill="none" />
                    </svg>
                </div>
            )}

            {/* ACTIONABLE BOTTOM TELEMETRY DRAWER */}
            <div style={{ background: 'rgba(10, 15, 24, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-primary)' }}>
                    <span>{activeNode.icon}</span>
                    <strong style={{ color: activeNode.color }}>{activeNode.label} Active Stream:</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>"{activeNode.activeStream}" • {activeNode.sentiment}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        type="button"
                        style={{ background: activeNode.color, color: '#08090d', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        onClick={() => alert(`Active Telemetry Stream: ${activeNode.label} -> ${activeNode.activeStream}`)}
                    >
                        ⚡ Inspect Node Telemetry
                    </button>
                </div>
            </div>
        </div>
    );
}



