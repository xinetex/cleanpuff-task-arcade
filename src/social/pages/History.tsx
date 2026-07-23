import { useState, useMemo } from 'react';
import { getPostsByStatus } from '../lib/store';
import PostCard from '../components/PostCard';
import PlatformBadge from '../components/PlatformBadge';
import { PLATFORM_META } from '../lib/types';
import type { Platform } from '../lib/types';

export default function History() {
    const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
    
    const posted = getPostsByStatus('posted');
    const failed = getPostsByStatus('failed');
    
    const all = [...posted, ...failed].sort((a, b) =>
        new Date(b.postedAt || b.updatedAt).getTime() - new Date(a.postedAt || a.updatedAt).getTime()
    );

    const filteredPosts = useMemo(() => {
        if (platformFilter === 'all') return all;
        return all.filter(p => p.platform === platformFilter);
    }, [all, platformFilter]);

    const filteredPosted = useMemo(() => {
        if (platformFilter === 'all') return posted;
        return posted.filter(p => p.platform === platformFilter);
    }, [posted, platformFilter]);

    const totalImpressions = filteredPosted.reduce((sum, p) => sum + (p.metrics?.impressions || p.metrics?.views || 0), 0);
    const totalLikes = filteredPosted.reduce((sum, p) => sum + (p.metrics?.likes || 0), 0);
    const totalReposts = filteredPosted.reduce((sum, p) => sum + (p.metrics?.reposts || 0), 0);

    return (
        <div>
            <div className="page-header">
                <h2>History</h2>
                <p>Published CleanPuff content and engagement metrics</p>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <button
                    className={`btn ${platformFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setPlatformFilter('all')}
                >
                    All
                </button>
                {Object.entries(PLATFORM_META).map(([key]) => (
                    <button
                        key={key}
                        className={`btn ${platformFilter === key ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setPlatformFilter(key as Platform)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <PlatformBadge platform={key as Platform} />
                    </button>
                ))}
            </div>

            {filteredPosted.length > 0 && (
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card emerald">
                        <div className="stat-label">Total Posts</div>
                        <div className="stat-value">{filteredPosted.length}</div>
                    </div>
                    <div className="stat-card sky">
                        <div className="stat-label">Impressions</div>
                        <div className="stat-value">{totalImpressions.toLocaleString()}</div>
                    </div>
                    <div className="stat-card rose">
                        <div className="stat-label">Likes</div>
                        <div className="stat-value">{totalLikes.toLocaleString()}</div>
                    </div>
                    <div className="stat-card amber">
                        <div className="stat-label">Shares/Reposts</div>
                        <div className="stat-value">{totalReposts.toLocaleString()}</div>
                    </div>
                </div>
            )}

            {filteredPosts.length > 0 ? (
                <div className="posts-list">
                    {filteredPosts.map(p => (
                        <PostCard key={p.id} post={p} showActions={false} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>No posts found</h3>
                    <p>Once you publish CleanPuff content, engagement metrics will appear here.</p>
                </div>
            )}
        </div>
    );
}
