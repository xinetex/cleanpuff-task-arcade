import { useState } from 'react';
import SwarmReactor3D from '../components/SwarmReactor3D';

export interface ActionDecisionCard {
    id: string;
    agentId: string;
    agentName: string;
    agentIcon: string;
    badgeColor: 'mint' | 'sky' | 'purple' | 'pink';
    title: string;
    insight: string;
    confidence: number;
    time: string;
    status: 'pending' | 'approved' | 'dismissed';
    primaryActionLabel: string;
    secondaryActionLabel?: string;
}

export default function Swarm() {
    const [timeState, setTimeState] = useState<'past' | 'now' | 'future'>('now');
    const [selectedNodeId, setSelectedNodeId] = useState<string>('agent-1');
    const [syncing, setSyncing] = useState(false);

    const [decisions, setDecisions] = useState<ActionDecisionCard[]>([
        {
            id: 'dec-1',
            agentId: 'agent-1',
            agentName: 'Pulse Sentinel',
            agentIcon: '📡',
            badgeColor: 'mint',
            title: 'Viral TikTok Audio Trend Detected',
            insight: 'Audio "#PuffHero" is gaining +340% velocity on TikTok. Matches Comedy & Lore pillars.',
            confidence: 96,
            time: '2 mins ago',
            status: 'pending',
            primaryActionLabel: '✨ Auto-Generate Episode Skit',
            secondaryActionLabel: 'Dismiss'
        },
        {
            id: 'dec-2',
            agentId: 'agent-2',
            agentName: 'Chronos Publisher',
            agentIcon: '📅',
            badgeColor: 'sky',
            title: 'Google Sheet Row #14 Ready for Sync',
            insight: 'Topic "Discovering Puff Heroes -1 Hero" ready for Wednesday Character Reveal beat.',
            confidence: 99,
            time: '5 mins ago',
            status: 'pending',
            primaryActionLabel: '📅 Queue for Wednesday Beat',
            secondaryActionLabel: 'Edit Topic'
        },
        {
            id: 'dec-3',
            agentId: 'agent-3',
            agentName: 'Ledger Watcher',
            agentIcon: '👛',
            badgeColor: 'purple',
            title: '42 New Solana Wallets Qualified',
            insight: 'Verified active 60-day users completed Telegram Mini App task with zero Sybil risk.',
            confidence: 98,
            time: '12 mins ago',
            status: 'pending',
            primaryActionLabel: '👛 Approve Whitelist Cohort',
            secondaryActionLabel: 'Inspect Sybil Scores'
        }
    ]);

    const [logs, setLogs] = useState<string[]>([
        '[17:34:10] 🔮 4D Mesh Engine: Real-time temporal stream active across 4 subagent nodes.',
        '[17:32:45] 📅 Chronos Publisher: Google Sheet ID 1RN9xB7... synced with 99.8% precision.',
        '[17:30:15] 📡 Pulse Sentinel: Social signal velocity mapped (+340% viral audio match).',
        '[17:28:00] 👛 Ledger Watcher: Wallet cohort risk scored — 0 Sybil patterns detected.',
    ]);

    const handleAction = (id: string, actionType: 'approve' | 'dismiss') => {
        setDecisions(prev => prev.map(d => {
            if (d.id === id) {
                return { ...d, status: actionType === 'approve' ? 'approved' : 'dismissed' };
            }
            return d;
        }));

        const item = decisions.find(d => d.id === id);
        if (item) {
            const time = new Date().toLocaleTimeString();
            const actionText = actionType === 'approve' ? `✅ Approved: "${item.title}"` : `❌ Dismissed: "${item.title}"`;
            setLogs(prev => [`[${time}] ${actionText} — Executed by Human Lead.`, ...prev]);
        }
    };

    const triggerFullSync = () => {
        setSyncing(true);
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [
            `[${time}] ⚡ 4D Kinetic Pulse Triggered by Human Lead...`,
            `[${time}] 📡 Pulse Sentinel: Scanning 50 trend streams...`,
            `[${time}] 📅 Chronos Publisher: Re-evaluating Google Sheet 1RN9xB7...`,
            ...prev
        ]);

        setTimeout(() => {
            setSyncing(false);
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] ✨ 4D Swarm Mesh Synchronized. All subagents operational.`, ...prev]);
        }, 1200);
    };

    return (
        <div className="swarm-page" style={{ position: 'relative' }}>
            {/* Header with 4D Design Title */}
            <div className="page-header flex-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2>🌌 4D Kinetic Subagent Swarm</h2>
                        <span style={{ background: 'linear-gradient(135deg, #00e5a0, #00d4ff)', color: '#08090d', fontWeight: 800, fontSize: 11, padding: '3px 8px', borderRadius: 8 }}>
                            4DV.AI CONCEPT
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        Dynamic Volumetric AI Mesh — Human Decision Engine for CleanPuff Data & Actions
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button className={`btn ${syncing ? 'btn-ghost' : 'btn-primary'}`} onClick={triggerFullSync} disabled={syncing}>
                        {syncing ? '⚡ Resonating 4D Mesh...' : '⚡ Pulse Swarm Mesh'}
                    </button>
                </div>
            </div>

            {/* 3D PROCEDURAL LIVING INFOGRAPHIC CANVAS */}
            <div style={{ marginBottom: 24 }}>
                <SwarmReactor3D onSelectNode={setSelectedNodeId} selectedNodeId={selectedNodeId} />
            </div>

            {/* 4D Temporal Axis Slider (4DV Design Concept) */}
            <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>⏳ 4D Temporal Stream:</span>
                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: 4, borderRadius: 10, border: '1px solid var(--border-light)' }}>
                        <button
                            className={`btn ${timeState === 'past' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ padding: '4px 12px', fontSize: 12 }}
                            onClick={() => setTimeState('past')}
                        >
                            T-60m (Past Signals)
                        </button>
                        <button
                            className={`btn ${timeState === 'now' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ padding: '4px 12px', fontSize: 12 }}
                            onClick={() => setTimeState('now')}
                        >
                            ● NOW (Live Mesh)
                        </button>
                        <button
                            className={`btn ${timeState === 'future' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ padding: '4px 12px', fontSize: 12 }}
                            onClick={() => setTimeState('future')}
                        >
                            🔮 T+24h (AI Forecast)
                        </button>
                    </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--primary-mint)', fontWeight: 600 }}>
                    {timeState === 'past' && '📜 Viewing past 60 minutes of raw social signals and wallet entries.'}
                    {timeState === 'now' && '⚡ Live Subagent Mesh active (4 nodes resonating).'}
                    {timeState === 'future' && '🔮 AI Predicts: +14% engagement velocity on Wednesday character beat.'}
                </div>
            </div>

            {/* 4D Dynamic Subagent Nodes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 28 }}>
                {/* Node 1 */}
                <div className="glass-panel glow-border" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 26 }}>📡</span>
                        <span style={{ fontSize: 11, background: 'rgba(0, 229, 160, 0.15)', color: 'var(--primary-mint)', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>
                            ACTIVE • 96% VELOCITY
                        </span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 800 }}>Pulse Sentinel</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Social Trend Radar</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', background: 'rgba(0,229,160,0.06)', padding: 10, borderRadius: 8, borderLeft: '3px solid #00e5a0' }}>
                        TikTok Audio "#PuffHero" spiking (+340% velocity).
                    </div>
                </div>

                {/* Node 2 */}
                <div className="glass-panel glow-border" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 26 }}>📅</span>
                        <span style={{ fontSize: 11, background: 'rgba(0, 212, 255, 0.15)', color: 'var(--primary-cyan)', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>
                            SYNCED • 99% PRECISION
                        </span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 800 }}>Chronos Publisher</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Marketing Sheet & Calendar</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', background: 'rgba(0,212,255,0.06)', padding: 10, borderRadius: 8, borderLeft: '3px solid #00d4ff' }}>
                        Google Sheet tab #1733347574 ready for Wednesday.
                    </div>
                </div>

                {/* Node 3 */}
                <div className="glass-panel glow-border" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 26 }}>👛</span>
                        <span style={{ fontSize: 11, background: 'rgba(139, 92, 246, 0.15)', color: 'var(--secondary-purple)', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>
                            QUALIFIED • 1,998 USERS
                        </span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 800 }}>Ledger Watcher</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Solana & Sybil Qualification</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', background: 'rgba(139, 92, 246, 0.06)', padding: 10, borderRadius: 8, borderLeft: '3px solid #8b5cf6' }}>
                        42 new wallets verified zero Sybil risk.
                    </div>
                </div>

                {/* Node 4 */}
                <div className="glass-panel glow-border" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 26 }}>🤖</span>
                        <span style={{ fontSize: 11, background: 'rgba(255, 45, 120, 0.15)', color: 'var(--alert-pink)', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>
                            STANDBY • 3 DECISIONS
                        </span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 800 }}>Quartermaster Prime</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Human Decision Engine</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', background: 'rgba(255, 45, 120, 0.06)', padding: 10, borderRadius: 8, borderLeft: '3px solid #ff2d78' }}>
                        Awaiting Human Lead click on decision cards below.
                    </div>
                </div>
            </div>

            {/* 🎯 HUMAN DECISION MATRIX ("Decide & Direct" UI Concept) */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800 }}>🎯 Human Decision Cards</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Subagents synthesize complex raw data into simple decision cards. Click to decide and execute instantly.
                        </p>
                    </div>
                    <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 10, color: 'var(--text-primary)' }}>
                        {decisions.filter(d => d.status === 'pending').length} Action Items Pending
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {decisions.map((card) => (
                        <div
                            key={card.id}
                            className="glass-panel"
                            style={{
                                padding: 20,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 16,
                                borderLeft: `5px solid ${card.status === 'approved' ? 'var(--primary-mint)' : card.status === 'dismissed' ? 'var(--text-muted)' : 'var(--primary-cyan)'}`,
                                opacity: card.status === 'dismissed' ? 0.5 : 1
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 260 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <span style={{ fontSize: 20 }}>{card.agentIcon}</span>
                                    <strong style={{ fontSize: 16 }}>{card.title}</strong>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 6 }}>
                                        {card.agentName} • {card.confidence}% Confidence
                                    </span>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    {card.insight}
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {card.status === 'pending' && (
                                    <>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleAction(card.id, 'approve')}
                                        >
                                            {card.primaryActionLabel}
                                        </button>
                                        {card.secondaryActionLabel && (
                                            <button
                                                className="btn btn-ghost"
                                                onClick={() => handleAction(card.id, 'dismiss')}
                                            >
                                                {card.secondaryActionLabel}
                                            </button>
                                        )}
                                    </>
                                )}

                                {card.status === 'approved' && (
                                    <span style={{ color: 'var(--primary-mint)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        ✅ Executed by Human Lead
                                    </span>
                                )}

                                {card.status === 'dismissed' && (
                                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                        ❌ Dismissed
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live 4D Temporal Stream Log */}
            <div className="glass-panel" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700 }}>🖥️ 4D Temporal Activity Log</h4>
                    <span style={{ fontSize: 12, color: 'var(--primary-mint)' }}>Connected • 4D Spatial Stream Active</span>
                </div>

                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', padding: 16, borderRadius: 10, fontFamily: 'monospace', fontSize: 12, color: 'var(--primary-mint)', maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {logs.map((log, index) => (
                        <div key={index}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
