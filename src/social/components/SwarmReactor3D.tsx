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
        activeStream: 'Live Audio Trend "#PuffHero"'
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
        activeStream: 'S3 CDN Hydration Active'
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
        activeStream: 'Mini App Whitelist Qualified'
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
        activeStream: 'Crawl4AI Signal Processor'
    }
];

export default function SwarmReactor3D({ onSelectNode, selectedNodeId }: SwarmReactorProps) {
    const [activeNode, setActiveNode] = useState<DataNode>(SWARM_DATA_NODES[0]);

    const handleNodeClick = (node: DataNode) => {
        setActiveNode(node);
        onSelectNode?.(node.id);
    };

    return (
        <div style={{ width: '100%', position: 'relative', borderRadius: '16px', border: '1px solid rgba(0, 229, 160, 0.35)', background: 'radial-gradient(ellipse at center, rgba(12, 18, 30, 0.98), rgba(6, 8, 12, 0.99))', padding: '20px', boxShadow: '0 12px 32px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
            {/* D3 METRIC HEADER BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, background: 'rgba(0, 229, 160, 0.15)', color: '#00e5a0', padding: '4px 10px', borderRadius: 6, fontWeight: 900, letterSpacing: '0.04em', border: '1px solid rgba(0, 229, 160, 0.3)', fontFamily: 'monospace' }}>
                        📊 OBSERVABLE D3 DATA MESH
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                        Live Quantitative Node Topology — Direct Signal Flow & Volume Graph
                    </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ background: 'rgba(8, 12, 20, 0.85)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: 10, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        TOTAL SIGNAL VOL: <strong style={{ color: '#00e5a0' }}>242.8K/day</strong>
                    </div>
                    <div style={{ background: 'rgba(8, 12, 20, 0.85)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: 10, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        HEALTH: <strong style={{ color: '#00d4ff' }}>99.8% OK</strong>
                    </div>
                </div>
            </div>

            {/* SPACIOUS 4-COLUMN NON-OVERLAPPING DATA MATRIX CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 18, position: 'relative', zIndex: 2 }}>
                {SWARM_DATA_NODES.map((node) => {
                    const isSelected = selectedNodeId === node.id || activeNode.id === node.id;
                    return (
                        <div
                            key={node.id}
                            onClick={() => handleNodeClick(node)}
                            style={{
                                background: isSelected ? 'rgba(14, 22, 36, 0.95)' : 'rgba(10, 15, 24, 0.75)',
                                backdropFilter: 'blur(12px)',
                                border: `1.5px solid ${isSelected ? node.color : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '12px',
                                padding: '16px',
                                cursor: 'pointer',
                                boxShadow: isSelected ? `0 8px 24px ${node.color}30` : 'none',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                transform: isSelected ? 'translateY(-2px)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 18 }}>{node.icon}</span> {node.label}
                                </span>
                                <span style={{ fontSize: 10, background: `${node.color}25`, color: node.color, padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                                    {node.change}
                                </span>
                            </div>

                            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
                                {node.sublabel}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <div>
                                    <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>METRIC REACH</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: node.color, fontFamily: 'monospace', marginTop: 2 }}>
                                        {node.metric}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>VOLUME</div>
                                    <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 700, marginTop: 2 }}>
                                        {node.volume}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

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
                        onClick={() => alert(`Active Stream: ${activeNode.label} -> ${activeNode.activeStream}`)}
                    >
                        ⚡ Inspect Node Telemetry
                    </button>
                </div>
            </div>
        </div>
    );
}


