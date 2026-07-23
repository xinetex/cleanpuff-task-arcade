import { useCallback, useState, useMemo } from 'react';
import { getPostsByStatus, updatePost } from '../lib/store';
import PostCard from '../components/PostCard';
import PlatformBadge from '../components/PlatformBadge';
import { PLATFORM_META } from '../lib/types';
import type { Platform } from '../lib/types';

export default function Scheduled() {
    const [, setRefresh] = useState(0);
    const forceRefresh = useCallback(() => setRefresh(n => n + 1), []);
    const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');

    const scheduled = [
        ...getPostsByStatus('approved'),
        ...getPostsByStatus('scheduled'),
    ].sort((a, b) => {
        if (a.scheduledAt && b.scheduledAt) return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        if (a.scheduledAt) return -1;
        return 1;
    });

    const filteredScheduled = useMemo(() => {
        if (platformFilter === 'all') return scheduled;
        return scheduled.filter(p => p.platform === platformFilter);
    }, [scheduled, platformFilter]);

    // Grouping by date
    const groupedScheduled = useMemo(() => {
        const groups: Record<string, typeof scheduled> = {};
        filteredScheduled.forEach(post => {
            const dateStr = post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : 'Unscheduled / Approved';
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(post);
        });
        return groups;
    }, [filteredScheduled]);

    const handleCancel = (id: string) => {
        updatePost(id, { status: 'draft', scheduledAt: undefined });
        forceRefresh();
    };

    return (
        <div>
            <div className="page-header">
                <h2>Scheduled</h2>
                <p>CleanPuff approved posts queued for publishing — {filteredScheduled.length} in queue</p>
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

            {filteredScheduled.length > 0 ? (
                <div className="posts-list" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {Object.entries(groupedScheduled).map(([dateLabel, posts]) => (
                        <div key={dateLabel}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>
                                📅 {dateLabel}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {posts.map(p => (
                                    <PostCard
                                        key={p.id}
                                        post={p}
                                        onDiscard={handleCancel}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>Nothing scheduled</h3>
                    <p>Approve drafts to add them to the CleanPuff schedule.</p>
                </div>
            )}
        </div>
    );
}
