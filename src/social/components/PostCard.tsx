import { useState } from 'react';
import type { SocialPost } from '../lib/types';
import PlatformBadge from './PlatformBadge';

interface PostCardProps {
    post: SocialPost;
    onApprove?: (id: string, scheduledAt?: string) => void;
    onEdit?: (id: string, content: string) => void;
    onDiscard?: (id: string) => void;
    showActions?: boolean;
}

export default function PostCard({ post, onApprove, onEdit, onDiscard, showActions = true }: PostCardProps) {
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [scheduling, setScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');

    const charCount = post.content.length;
    const isOver = charCount > 280;

    const handleSaveEdit = () => {
        onEdit?.(post.id, editContent);
        setEditing(false);
    };

    const handleApprove = () => {
        if (scheduling && scheduleDate) {
            onApprove?.(post.id, new Date(scheduleDate).toISOString());
        } else {
            onApprove?.(post.id);
        }
        setScheduling(false);
    };

    const formatDate = (date: string) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        }).format(new Date(date));
    };

    return (
        <div className="post-card">
            <div className="post-card-header">
                <div className="post-card-meta">
                    <span className={`status-badge ${post.status}`}>{post.status}</span>
                    {post.platform && <PlatformBadge platform={post.platform} size="sm" />}
                    {post.sourceTopic && <span className="post-source">from: {post.sourceTopic}</span>}
                </div>
                {post.xPostId && (
                    <a href={`https://x.com/CleanPuff/status/${post.xPostId}`}
                        target="_blank" rel="noopener noreferrer"
                        className="btn btn-ghost" style={{ fontSize: '11px' }}>
                        View on X ↗
                    </a>
                )}
            </div>

            <div className="post-card-body">
                {editing ? (
                    <div className="inline-editor">
                        <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={4}
                        />
                        <div className={`char-count ${editContent.length > 280 ? 'over' : ''}`}>
                            {editContent.length}/280
                        </div>
                        <div className="inline-editor-actions">
                            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveEdit}>Save</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="post-content">{post.content}</div>
                        <div className={`char-count ${isOver ? 'over' : ''}`}>
                            {charCount}/280
                        </div>
                    </>
                )}

                {post.thread && post.thread.length > 0 && (
                    <>
                        <div className="post-thread-indicator">🧵 Thread ({post.thread.length + 1} posts)</div>
                        <div className="thread-preview">
                            {post.thread.map((t, i) => (
                                <div key={i} className="thread-item">{t}</div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {post.metrics && (
                <div className="metrics-row" style={{ marginBottom: 12 }}>
                    <div className="metric-item">❤️ <span className="metric-value">{post.metrics.likes.toLocaleString()}</span></div>
                    <div className="metric-item">🔄 <span className="metric-value">{post.metrics.reposts.toLocaleString()}</span></div>
                    <div className="metric-item">💬 <span className="metric-value">{post.metrics.replies.toLocaleString()}</span></div>
                    <div className="metric-item">👁️ <span className="metric-value">{post.metrics.impressions.toLocaleString()}</span></div>
                    {post.metrics.views !== undefined && (
                        <div className="metric-item">▶ <span className="metric-value">{post.metrics.views.toLocaleString()}</span></div>
                    )}
                </div>
            )}

            <div className="post-card-footer">
                {showActions && post.status === 'draft' && (
                    <>
                        {scheduling ? (
                            <div className="schedule-picker">
                                <input
                                    type="datetime-local"
                                    value={scheduleDate}
                                    onChange={e => setScheduleDate(e.target.value)}
                                />
                                <button className="btn btn-primary" onClick={handleApprove} disabled={!scheduleDate}>
                                    Schedule
                                </button>
                                <button className="btn btn-ghost" onClick={() => setScheduling(false)}>Cancel</button>
                            </div>
                        ) : (
                            <>
                                <button className="btn btn-success" onClick={() => onApprove?.(post.id)}>✓ Approve</button>
                                <button className="btn btn-ghost" onClick={() => setScheduling(true)}>🕐 Schedule</button>
                                <button className="btn btn-ghost" onClick={() => setEditing(true)}>✏️ Edit</button>
                                <button className="btn btn-danger" onClick={() => onDiscard?.(post.id)}>✕</button>
                            </>
                        )}
                    </>
                )}
                {showActions && post.status === 'scheduled' && (
                    <button className="btn btn-danger" onClick={() => onDiscard?.(post.id)}>Cancel Schedule</button>
                )}
                <span className="timestamp">
                    {post.scheduledAt && post.status === 'scheduled'
                        ? `Scheduled: ${formatDate(post.scheduledAt)}`
                        : post.postedAt
                            ? `Posted: ${formatDate(post.postedAt)}`
                            : `Created: ${formatDate(post.createdAt)}`}
                </span>
            </div>
        </div>
    );
}
