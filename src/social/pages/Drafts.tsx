import { useCallback, useState, useMemo } from 'react';
import { deletePost, getPostsByStatus, updatePost } from '../lib/store';
import PostCard from '../components/PostCard';
import PlatformBadge from '../components/PlatformBadge';
import { PLATFORM_META } from '../lib/types';
import type { Platform } from '../lib/types';

export default function Drafts() {
    const [, setRefresh] = useState(0);
    const forceRefresh = useCallback(() => setRefresh(n => n + 1), []);
    const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
    
    const drafts = getPostsByStatus('draft');
    
    const filteredDrafts = useMemo(() => {
        if (platformFilter === 'all') return drafts;
        return drafts.filter(p => p.platform === platformFilter);
    }, [drafts, platformFilter]);

    const handleApprove = (id: string, scheduledAt?: string) => {
        updatePost(id, {
            status: scheduledAt ? 'scheduled' : 'approved',
            scheduledAt,
        });
        forceRefresh();
    };

    const handleEdit = (id: string, content: string) => {
        updatePost(id, { content });
        forceRefresh();
    };

    const handleDiscard = (id: string) => {
        deletePost(id);
        forceRefresh();
    };

    return (
        <div>
            <div className="page-header">
                <h2>Drafts</h2>
                <p>CleanPuff content awaiting your review — {filteredDrafts.length} pending</p>
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

            {filteredDrafts.length > 0 ? (
                <div className="posts-list">
                    {filteredDrafts.map(p => (
                        <PostCard
                            key={p.id}
                            post={p}
                            onApprove={handleApprove}
                            onEdit={handleEdit}
                            onDiscard={handleDiscard}
                            showActions={true}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">✨</div>
                    <h3>Queue is empty</h3>
                    <p>All caught up! Head to Generate to create more CleanPuff content.</p>
                </div>
            )}
        </div>
    );
}
