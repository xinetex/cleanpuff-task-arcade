import { useState } from 'react';

export default function Playbook() {
    const [activeSection, setActiveSection] = useState<'overview' | 'audience' | 'funnels' | 'characters'>('overview');

    const AUDIENCE_STATS = [
        { label: 'Total Bot Users', value: '541,000+', note: 'Historical top-of-funnel', icon: '🤖', color: 'sky' },
        { label: 'Completed Tasks', value: '9,864', note: 'Engaged task completers', icon: '🎯', color: 'mint' },
        { label: 'Linked Wallets', value: '4,138', note: 'Solana wallet connected', icon: '👛', color: 'purple' },
        { label: '60-Day Active', value: '1,998', note: 'Usable active audience', icon: '⚡', color: 'pink' },
    ];

    const FUNNEL_SCENARIOS = [
        { id: 'f1', name: 'Telegram Channel Launch', type: 'Reset & Activation', status: 'Active', surface: 'Telegram Channel + TMA Bot', description: 'Reset point for active audience; converts passive awareness into a repeatable return habit.' },
        { id: 'f2', name: 'Support Channel with Stars', type: 'Payment Test 1', status: 'Ready', surface: 'Telegram Native', description: 'Lightest payment-readiness test converting low-friction attention into paid support.' },
        { id: 'f3', name: 'CleanPuff Branded Gifts', type: 'Payment Test 2', status: 'Upcoming', surface: 'Telegram Gifts', description: 'Tests symbolic value and emotional legibility of the CleanPuff brand universe.' },
        { id: 'f4', name: 'Character Discovery Series', type: 'Content Engine', status: 'Active', surface: 'X/Twitter + Telegram + Site', description: 'Weekly character reveals (Wednesdays) driving continuous narrative familiarity.' },
        { id: 'f5', name: 'Slogan Contest & Polls', type: 'Co-creation', status: 'Active', surface: 'X/Twitter + Telegram', description: 'Tests if audience is ready to shape brand language and participate in creative tone.' },
        { id: 'f6', name: 'Join Waitlist & Blog Launch', type: 'Owned Conversion', status: 'Ready', surface: 'CleanPuff.io Web', description: 'Direct conversion test converting social attention into owned email contacts.' },
        { id: 'f7', name: 'Big Announcement Peak', type: 'Reactivation Hook', status: 'Scheduled', surface: 'Multi-channel Broadcast', description: 'Main reactivation hook bringing old audience back for major milestone push.' },
    ];

    const CHARACTERS = [
        { name: 'Sir Gaz', title: 'The Smoked Master', status: 'Revealed', day: 'Wednesday Beat', quote: 'Even absolute evil can be compelling... just try not to sniff him too much.', tag: 'Villain / Antihero' },
        { name: 'Puff Heroes -1', title: 'Genesis Defender', status: 'In Production', day: 'Next Reveal', quote: 'Puffers assemble. The Genesis collection calls.', tag: 'Hero Unit' },
        { name: 'Bong Lord', title: 'The 4D Visionary', status: 'Active', day: 'Episode 4 Lore', quote: 'When you hit the bong a little too hard and start seeing in 4D.', tag: 'Main Cast' },
    ];

    return (
        <div className="playbook-page">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <h2>🚀 Month 1 Launch Playbook</h2>
                <p>CleanPuff.io 40-Day Strategic Operating System & Audience Qualification</p>
            </div>

            {/* Navigation Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <button className={`btn ${activeSection === 'overview' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSection('overview')}>
                    📋 Strategy & Goals
                </button>
                <button className={`btn ${activeSection === 'audience' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSection('audience')}>
                    📊 Audience Reality (541K)
                </button>
                <button className={`btn ${activeSection === 'funnels' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSection('funnels')}>
                    ⚙️ Funnel Scenarios (7)
                </button>
                <button className={`btn ${activeSection === 'characters' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSection('characters')}>
                    🎨 Character Discovery
                </button>
            </div>

            {/* SECTION 1: OVERVIEW */}
            {activeSection === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: 'var(--primary-mint)' }}>
                            🎯 Core Strategic Positioning: Content-First
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                            This 40-day cycle is primarily a <strong>diagnosis of audience viability</strong>, not a generic growth campaign.
                            Content acts as the main organizing layer to test audience responsiveness, return-capability, and early payment-readiness across Telegram, X/Twitter, and owned web surfaces.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 20 }}>
                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>1. Signal Cleanup</strong>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Filtering lightweight bot traffic down to the 1,998 active users.</span>
                            </div>
                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>2. Character Discovery</strong>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Weekly Wednesday reveals acting as main retention & lore engine.</span>
                            </div>
                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>3. Owned Conversion</strong>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Moving Telegram/X attention into email waitlist & blog reading.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SECTION 2: AUDIENCE REALITY */}
            {activeSection === 'audience' && (
                <div>
                    <div className="stats-grid" style={{ marginBottom: 24 }}>
                        {AUDIENCE_STATS.map((s, i) => (
                            <div key={i} className={`stat-card ${s.color}`}>
                                <div className="stat-icon">{s.icon}</div>
                                <div className="stat-label">{s.label}</div>
                                <div className="stat-value">{s.value}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.note}</div>
                            </div>
                        ))}
                    </div>

                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🔍 Qualification Funnel Breakdown</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                                <span>Total Bot Accounts</span>
                                <strong>541,000 (100%)</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0, 229, 160, 0.08)', borderRadius: 10, borderLeft: '4px solid var(--primary-mint)' }}>
                                <span>Completed At Least 1 Task</span>
                                <strong style={{ color: 'var(--primary-mint)' }}>9,864 (1.8%)</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: 10, borderLeft: '4px solid var(--secondary-purple)' }}>
                                <span>Linked Solana Wallet</span>
                                <strong style={{ color: 'var(--secondary-purple)' }}>4,138 (0.76%)</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 45, 120, 0.08)', borderRadius: 10, borderLeft: '4px solid var(--alert-pink)' }}>
                                <span>Active Last 60 Days (Target Group)</span>
                                <strong style={{ color: 'var(--alert-pink)' }}>1,998 (0.37%)</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SECTION 3: FUNNEL SCENARIOS */}
            {activeSection === 'funnels' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {FUNNEL_SCENARIOS.map((f) => (
                        <div key={f.id} className="glass-panel" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ flex: 1, minWidth: 260 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <h4 style={{ fontSize: 16, fontWeight: 700 }}>{f.name}</h4>
                                    <span style={{ fontSize: 11, background: 'rgba(0,229,160,0.15)', color: 'var(--primary-mint)', padding: '2px 8px', borderRadius: 10 }}>{f.type}</span>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.description}</p>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>📍 Surface: {f.surface}</div>
                            </div>
                            <span className="btn btn-ghost" style={{ fontSize: 12 }}>Status: {f.status}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* SECTION 4: CHARACTERS */}
            {activeSection === 'characters' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {CHARACTERS.map((c, i) => (
                        <div key={i} className="glass-panel" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 8 }}>{c.tag}</span>
                                <span style={{ fontSize: 11, color: 'var(--primary-mint)' }}>{c.day}</span>
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{c.name}</h3>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{c.title}</div>
                            <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 10, borderLeft: '3px solid var(--primary-cyan)' }}>
                                "{c.quote}"
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
