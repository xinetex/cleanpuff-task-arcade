import { useState } from 'react';
import { getPostsByStatus, getStats, getChannels } from '../lib/store';
import PostCard from '../components/PostCard';
import SparklineChart from '../components/SparklineChart';
import PlatformBadge from '../components/PlatformBadge';
import type { Channel } from '../lib/types';

export default function Dashboard() {
    const stats = getStats();
    const channels = getChannels();
    const recentPosts = getPostsByStatus('posted').slice(0, 3);
    const pendingDrafts = getPostsByStatus('draft').slice(0, 2);

    // Quick Task Initiator State
    const [taskTitle, setTaskTitle] = useState("");
    const [assignee, setAssignee] = useState("peter@cleanpuff.io");
    const [points, setPoints] = useState<number>(30);
    const [category, setCategory] = useState("Content");
    const [dispatchedTask, setDispatchedTask] = useState<string | null>(null);

    const handleLaunchTask = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!taskTitle.trim()) return;

        const newTask = {
            id: `task-${Date.now()}`,
            sprint_id: "sprint-1",
            title: `${taskTitle.trim()} (${category})`,
            assignee,
            assigner: "jq@cleanpuff.io",
            points,
            status: "assigned",
            created_at: new Date().toISOString(),
        };

        try {
            const data = localStorage.getItem("task_arcade_mock_store_v4");
            if (data) {
                const parsed = JSON.parse(data);
                parsed.tasks = [newTask, ...(parsed.tasks || [])];
                localStorage.setItem("task_arcade_mock_store_v4", JSON.stringify(parsed));
            }
        } catch (_) {}

        setDispatchedTask(newTask.title);
        setTaskTitle("");
        setTimeout(() => setDispatchedTask(null), 4000);
    };

    const handleAutoScopeQM = () => {
        const ideas = [
            { title: "Produce 9:16 Short remix of Sir Gas Throne of Smoke", assignee: "rv@cleanpuff.io", points: 30, category: "Script" },
            { title: "Design Princess Puff 4K Advent Calendar visual banner", assignee: "artem@cleanpuff.io", points: 45, category: "Lore" },
            { title: "CMO Launch plan for YouTube 135K Subscriber milestone", assignee: "peter@cleanpuff.io", points: 30, category: "Project" },
            { title: "Review DAO legal incorporation documents", assignee: "bryan@cleanpuff.io", points: 60, category: "Project" },
        ];
        const random = ideas[Math.floor(Math.random() * ideas.length)];
        setTaskTitle(random.title);
        setAssignee(random.assignee);
        setPoints(random.points);
        setCategory(random.category);
    };

    return (
        <div>
            <div className="page-header">
                <h2>🎮 Command Center</h2>
                <p>CleanPuff social media headquarters</p>
            </div>

            {/* ⚡ COMMAND CENTER TASK INITIATOR BAR */}
            <div style={{ background: "var(--bg-glass)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 24, boxShadow: "var(--shadow-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14, color: "var(--text-primary)" }}>
                        <span style={{ fontSize: 18 }}>⚡</span> Quick Task Initiator & Dispatcher
                        <span style={{ fontSize: 10, background: "var(--primary-mint)", color: "var(--bg-primary)", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>LIVE ARCADE DISPATCH</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleAutoScopeQM}
                        style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-light)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                    >
                        🤖 Ask Quartermaster to Auto-Scope
                    </button>
                </div>

                <form onSubmit={handleLaunchTask} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <input
                        type="text"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Enter task brief or sprint objective... (e.g. 'Create TikTok Short for Advent Calendar')"
                        style={{ flex: "2 1 280px", background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}
                    />

                    {/* ASSIGNEE SELECTOR */}
                    <select
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        style={{ flex: "1 1 160px", background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                        <option value="peter@cleanpuff.io">👔 @Peter (CMO)</option>
                        <option value="artem@cleanpuff.io">🎨 @Artem (Design)</option>
                        <option value="rv@cleanpuff.io">🎬 @Richard (Animation)</option>
                        <option value="bryan@cleanpuff.io">⚖️ @Bryan (Legal)</option>
                        <option value="ihor@cleanpuff.io">⚙️ @Ihor (Infra)</option>
                        <option value="jq@cleanpuff.io">👑 @J Q (Executive)</option>
                    </select>

                    {/* POINTS TIER SELECTOR */}
                    <select
                        value={points}
                        onChange={(e) => setPoints(Number(e.target.value))}
                        style={{ width: 100, background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                        <option value={15}>15 pts</option>
                        <option value={30}>30 pts</option>
                        <option value={45}>45 pts</option>
                        <option value={60}>60 pts</option>
                    </select>

                    {/* LAUNCH BUTTON */}
                    <button
                        type="submit"
                        disabled={!taskTitle.trim()}
                        style={{
                            background: taskTitle.trim() ? "var(--primary-mint)" : "var(--bg-secondary)",
                            color: taskTitle.trim() ? "var(--bg-primary)" : "var(--text-muted)",
                            border: "none",
                            borderRadius: 8,
                            padding: "10px 18px",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: taskTitle.trim() ? "pointer" : "default",
                            boxShadow: taskTitle.trim() ? "0 2px 10px rgba(47, 141, 77, 0.3)" : "none",
                            transition: "all 0.2s ease"
                        }}
                    >
                        🚀 Launch Task to 3D Arcade
                    </button>
                </form>

                {dispatchedTask && (
                    <div style={{ marginTop: 12, background: "rgba(47, 141, 77, 0.15)", border: "1px solid var(--primary-mint)", borderRadius: 6, padding: "8px 12px", color: "var(--primary-mint)", fontSize: 12, fontWeight: 800 }}>
                        ✓ Dispatched "{dispatchedTask}" to 3D Arcade Board! (+{points} pts)
                    </div>
                )}
            </div>

            <div className="stats-grid">
                <div className="stat-card variant-mint">
                    <div className="stat-icon">📝</div>
                    <div className="stat-label">Drafts</div>
                    <div className="stat-value">{stats.totalDrafts}</div>
                </div>
                <div className="stat-card variant-gold">
                    <div className="stat-icon">⏰</div>
                    <div className="stat-label">Scheduled</div>
                    <div className="stat-value">{stats.totalScheduled}</div>
                </div>
                <div className="stat-card variant-purple">
                    <div className="stat-icon">✅</div>
                    <div className="stat-label">Posted</div>
                    <div className="stat-value">{stats.totalPosted}</div>
                </div>
                <div className="stat-card variant-sky">
                    <div className="stat-icon">👁️</div>
                    <div className="stat-label">Impressions</div>
                    <div className="stat-value">{(stats.totalImpressions || stats.totalViews || 0).toLocaleString()}</div>
                </div>
                <div className="stat-card variant-pink">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-label">Total Likes</div>
                    <div className="stat-value">{stats.totalLikes.toLocaleString()}</div>
                </div>
                <div className="stat-card variant-gold">
                    <div className="stat-icon">📊</div>
                    <div className="stat-label">This Week</div>
                    <div className="stat-value">{stats.postsThisWeek}</div>
                </div>
            </div>

            <div style={{ marginTop: 32, marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>
                    📡 Channel Performance
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {channels.map((channel: Channel) => (
                        <div key={channel.platform} style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)', padding: 16, border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <PlatformBadge platform={channel.platform} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: channel.weeklyGrowth > 0 ? 'var(--primary-mint)' : 'var(--text-muted)' }}>
                                    {channel.weeklyGrowth > 0 ? '+' : ''}{channel.weeklyGrowth}%
                                </span>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{channel.followers.toLocaleString()}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Followers</div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{channel.avgEngagement}%</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Avg Engagement</div>
                            </div>
                            <div style={{ height: 40 }}>
                                <SparklineChart data={[12, 19, 8, 25, 14, 30, 22]} color={channel.weeklyGrowth > 0 ? 'var(--primary-mint)' : 'var(--text-muted)'} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {pendingDrafts.length > 0 && (
                <>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>
                        📝 Pending Review
                    </h3>
                    <div className="posts-list" style={{ marginBottom: 28 }}>
                        {pendingDrafts.map(p => (
                            <PostCard key={p.id} post={p} showActions={false} />
                        ))}
                    </div>
                </>
            )}

            {recentPosts.length > 0 && (
                <>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>
                        ✅ Recently Posted
                    </h3>
                    <div className="posts-list">
                        {recentPosts.map(p => (
                            <PostCard key={p.id} post={p} showActions={false} />
                        ))}
                    </div>
                </>
            )}

            {recentPosts.length === 0 && pendingDrafts.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🚀</div>
                    <h3>Ready to launch</h3>
                    <p>Head to Generate to create your first batch of CleanPuff posts.</p>
                </div>
            )}
        </div>
    );
}
