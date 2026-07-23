import { useEffect, useState } from 'react';
import { fetchAllTrends } from '../lib/trends';
import type { TrendItem } from '../lib/trends';
import { getBestAngle, PRODUCT_PROFILES, scoreRelevance } from '../lib/profiles';
import type { ProductProfile } from '../lib/profiles';
import { createPost } from '../lib/store';

interface ScoredTrend {
    trend: TrendItem;
    matches: { profile: ProductProfile; score: number; angle: string | null }[];
    bestScore: number;
}

export default function Trends() {
    const [trends, setTrends] = useState<ScoredTrend[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [minScore, setMinScore] = useState(10);
    const [drafted, setDrafted] = useState<Set<string>>(new Set());

    const loadTrends = async () => {
        setLoading(true);
        try {
            const raw = await fetchAllTrends();

            const scored: ScoredTrend[] = raw.map(trend => {
                const matches = PRODUCT_PROFILES.map(profile => ({
                    profile,
                    score: scoreRelevance(trend.title, profile),
                    angle: getBestAngle(trend.title, profile),
                })).filter(m => m.score > 0)
                    .sort((a, b) => b.score - a.score);

                return {
                    trend,
                    matches,
                    bestScore: matches[0]?.score ?? 0,
                };
            });

            // Sort by best relevance score
            scored.sort((a, b) => b.bestScore - a.bestScore);
            setTrends(scored);
        } catch (e) {
            console.error('Failed to load trends:', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTrends();
    }, []);

    const filtered = trends.filter(t => {
        if (t.bestScore < minScore) return false;
        if (filter === 'all') return true;
        return t.matches.some(m => m.profile.id === filter);
    });

    const handleDraft = (trend: ScoredTrend, match: { profile: ProductProfile; angle: string | null }) => {
        const content = match.angle ||
            `Thoughts on: "${trend.trend.title}"\n\n[Write your take connecting this to ${match.profile.name}]\n\n${trend.trend.url}`;

        createPost({
            content,
            status: 'draft',
            sourceTopic: `Trend: ${trend.trend.sourceLabel}`,
            source: trend.trend.url,
            platform: 'x',
            contentType: 'text',
        });
        setDrafted(prev => new Set([...prev, trend.trend.id]));
    };

    const sourceIcon = (source: string) => {
        switch (source) {
            case 'hackernews': return '🟠';
            case 'reddit': return '🔴';
            case 'lobsters': return '🦞';
            default: return '📰';
        }
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'just now';
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div>
            <div className="page-header">
                <h2>📡 Trend Radar</h2>
                <p>Live trends matched to CleanPuff content pillars</p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={loadTrends} disabled={loading}>
                    {loading ? '⏳ Scanning...' : '🔄 Refresh Trends'}
                </button>

                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: 3 }}>
                    <button
                        className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setFilter('all')}
                        style={{ fontSize: 12 }}
                    >
                        All
                    </button>
                    {PRODUCT_PROFILES.map(p => (
                        <button
                            key={p.id}
                            className={`btn ${filter === p.id ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setFilter(p.id)}
                            style={{ fontSize: 12 }}
                        >
                            {p.emoji} {p.name}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Min relevance:</span>
                    <select
                        className="form-select"
                        value={minScore}
                        onChange={e => setMinScore(Number(e.target.value))}
                        style={{ width: 80, padding: '4px 8px', fontSize: 12 }}
                    >
                        <option value={0}>Any</option>
                        <option value={10}>10+</option>
                        <option value={20}>20+</option>
                        <option value={30}>30+</option>
                        <option value={50}>50+</option>
                    </select>
                </div>
            </div>

            {/* Stats bar */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card indigo">
                    <div className="stat-label">Total Scanned</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{trends.length}</div>
                </div>
                <div className="stat-card emerald">
                    <div className="stat-label">Relevant</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{trends.filter(t => t.bestScore >= 10).length}</div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-label">High Match</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{trends.filter(t => t.bestScore >= 30).length}</div>
                </div>
                <div className="stat-card rose">
                    <div className="stat-label">Drafted</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{drafted.size}</div>
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="empty-state">
                    <div className="loading-dots" style={{ justifyContent: 'center', marginBottom: 16 }}>
                        <span></span><span></span><span></span>
                    </div>
                    <h3>Scanning trends...</h3>
                    <p>Fetching from HackerNews, Reddit, and Lobsters</p>
                </div>
            ) : filtered.length > 0 ? (
                <div className="posts-list">
                    {filtered.map(item => (
                        <div key={item.trend.id} className="post-card">
                            <div className="post-card-header">
                                <div className="post-card-meta" style={{ gap: 10 }}>
                                    <span style={{ fontSize: 16 }}>{sourceIcon(item.trend.source)}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.trend.sourceLabel}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        ▲ {item.trend.score} · 💬 {item.trend.comments} · {timeAgo(item.trend.postedAt)}
                                    </span>
                                </div>
                            </div>

                            <div className="post-card-body">
                                <a
                                    href={item.trend.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}
                                >
                                    {item.trend.title} ↗
                                </a>

                                {/* Product matches */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                                    {item.matches.map(match => (
                                        <div
                                            key={match.profile.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 10,
                                                padding: '10px 12px',
                                                background: 'var(--bg-glass)',
                                                borderRadius: 'var(--radius-md)',
                                                borderLeft: `3px solid ${match.profile.color}`,
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: match.profile.color }}>
                                                        {match.profile.emoji} {match.profile.name}
                                                    </span>
                                                    <span style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        padding: '1px 8px',
                                                        borderRadius: 10,
                                                        background: match.score >= 30
                                                            ? 'var(--accent-emerald-glow)'
                                                            : match.score >= 15
                                                                ? 'var(--accent-amber-glow)'
                                                                : 'var(--bg-glass-hover)',
                                                        color: match.score >= 30
                                                            ? 'var(--accent-emerald)'
                                                            : match.score >= 15
                                                                ? 'var(--accent-amber)'
                                                                : 'var(--text-muted)',
                                                    }}>
                                                        {match.score}% match
                                                    </span>
                                                </div>
                                                {match.angle && (
                                                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                                        💡 {match.angle}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                className={`btn ${drafted.has(item.trend.id) ? 'btn-ghost' : 'btn-success'}`}
                                                onClick={() => handleDraft(item, match)}
                                                disabled={drafted.has(item.trend.id)}
                                                style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                                            >
                                                {drafted.has(item.trend.id) ? '✓ Drafted' : '📝 Draft'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📡</div>
                    <h3>No matching trends right now</h3>
                    <p>Try lowering the minimum relevance score or check back later. Trends are refreshed from live sources.</p>
                </div>
            )}
        </div>
    );
}
