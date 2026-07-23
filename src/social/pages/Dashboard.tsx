import { useState } from 'react';
import { getPostsByStatus, getStats, getChannels } from '../lib/store';
import PostCard from '../components/PostCard';
import SparklineChart from '../components/SparklineChart';
import PlatformBadge from '../components/PlatformBadge';
import type { Channel } from '../lib/types';

interface ScrapedItem {
    id: string;
    sourceUrl: string;
    platform: 'cleanpuff.io' | 'queef.io' | 'x.com' | 'reddit' | 'telegram' | 'youtube' | 'farcaster';
    engine: string;
    author: string;
    title: string;
    summary: string;
    timestamp: string;
    tags: string[];
}

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

    // Live Web Scraper & Intelligence Ingestion State
    const [scrapeUrl, setScrapeUrl] = useState("");
    const [scrapingEngine, setScrapingEngine] = useState<string>("crawl4ai");
    const [isScraping, setIsScraping] = useState(false);
    const [platformFilter, setPlatformFilter] = useState<string>("all");

    const [scrapedItems, setScrapedItems] = useState<ScrapedItem[]>([
        {
            id: 'scrape-cp-1',
            sourceUrl: 'https://cleanpuff.io/episodes/ep4-render',
            platform: 'cleanpuff.io',
            engine: 'Crawl4AI Web Crawler',
            author: '@cleanpuffio',
            title: 'CleanPuff.io: Episode 4 4K Master Render Vault & Animatic Draft',
            summary: 'Official cleanpuff.io update: Episode 4 final audio mix and 4K Lightbox asset pack ready for S3 Seagate Lyve distribution.',
            timestamp: '2m ago',
            tags: ['cleanpuff.io', 'Episode4', '4K Render', 'LyveS3']
        },
        {
            id: 'scrape-cp-2',
            sourceUrl: 'https://queef.io/lore/sea-shore-mirror',
            platform: 'queef.io',
            engine: 'Scrapling Adaptive DOM',
            author: '@QueefRealm',
            title: 'Queef.io: Seashore High-Tide Cold Archiving Policy & Lore Mirror',
            summary: 'Queef.io domain active: Seashore low-tide automated archiving policy successfully pinned 14 character sheets in Task Arcade.',
            timestamp: '7m ago',
            tags: ['queef.io', 'Seashore', 'TidalArchiving', 'Lore']
        },
        {
            id: 'scrape-cp-3',
            sourceUrl: 'https://x.com/CleanPuff_Sol/status/1892910398',
            platform: 'x.com',
            author: '@CleanPuff_Sol',
            engine: 'Firecrawl LLM Markdown',
            title: 'X.com Viral Thread: "Behind the scenes of CleanPuff Episode 4 storyboards vs final animation"',
            summary: 'X post trending with 1,904 likes & 291 reposts. Community praising character sheets and sound design.',
            timestamp: '14m ago',
            tags: ['x.com', '@CleanPuff_Sol', 'ViralThread', 'Animation']
        },
        {
            id: 'scrape-cp-4',
            sourceUrl: 'https://reddit.com/r/cleanpuff/comments/ep5_teaser_theory',
            platform: 'reddit',
            author: 'u/SpliffRick99',
            engine: 'Jina Reader API',
            title: 'Reddit r/cleanpuff: "Couch Demon Theory for Episode 5!"',
            summary: 'Community breakdown analyzing character reference sheet #12 (Flatulus) and predicting major plot twists in Episode 5.',
            timestamp: '28m ago',
            tags: ['reddit', 'r/cleanpuff', 'LoreTheory', 'Episode5']
        },
        {
            id: 'scrape-cp-5',
            sourceUrl: 'https://t.me/cleanpuff_official/8492',
            platform: 'telegram',
            author: '@Puffer_Admin',
            engine: 'Crawl4AI Scraper',
            title: 'Telegram Official: Weekly Executive Standup & DAO Roadmap Reveal',
            summary: 'Live Telegram broadcast announcement: @JQ and @Peter going live to present cleanpuff.io Q3 animated shorts timeline.',
            timestamp: '42m ago',
            tags: ['telegram', 'AMA', 'DAO', 'Standup']
        },
        {
            id: 'scrape-cp-6',
            sourceUrl: 'https://youtube.com/@cleanpuffio',
            platform: 'youtube',
            author: '@cleanpuffio',
            engine: 'Firecrawl API',
            title: 'YouTube @cleanpuffio: "Princess Puff 4K Lightbox Breakdown" (85K views)',
            summary: 'Short clip uploaded to @cleanpuffio channel hits 85,000 views in 24 hours. Engagement rate 12.4%.',
            timestamp: '1h ago',
            tags: ['@cleanpuffio', 'YouTube', 'PrincessPuff', 'Shorts']
        },
        {
            id: 'scrape-cp-7',
            sourceUrl: 'https://farcaster.xyz/channel/cleanpuff',
            platform: 'farcaster',
            author: '/cleanpuff',
            engine: 'Scrapling DOM',
            title: 'Farcaster /cleanpuff: On-Chain Episode 5 Character Vote Frame',
            summary: 'Farcaster Frame active: 4,120 holders voted on which character sprite skin appears in 3D Task Arcade.',
            timestamp: '2h ago',
            tags: ['farcaster', 'Frame', 'OnChainVote', 'Arcade']
        }
    ]);

    const handleRunScraper = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!scrapeUrl.trim()) return;
        setIsScraping(true);

        await new Promise(r => setTimeout(r, 800));

        const urlLower = scrapeUrl.toLowerCase();
        let inferredPlatform: ScrapedItem['platform'] = 'x.com';
        if (urlLower.includes('cleanpuff.io')) inferredPlatform = 'cleanpuff.io';
        else if (urlLower.includes('queef.io')) inferredPlatform = 'queef.io';
        else if (urlLower.includes('reddit')) inferredPlatform = 'reddit';
        else if (urlLower.includes('t.me') || urlLower.includes('telegram')) inferredPlatform = 'telegram';
        else if (urlLower.includes('youtube')) inferredPlatform = 'youtube';
        else if (urlLower.includes('farcaster')) inferredPlatform = 'farcaster';

        const newScraped: ScrapedItem = {
            id: `scrape-${Date.now()}`,
            sourceUrl: scrapeUrl.trim(),
            platform: inferredPlatform,
            engine: scrapingEngine === 'crawl4ai' ? 'Crawl4AI' : (scrapingEngine === 'firecrawl' ? 'Firecrawl' : 'Jina Reader'),
            author: `@${scrapeUrl.trim().replace(/^https?:\/\//, '').split('/')[0]}`,
            title: `CleanPuff Scraped Intel: ${scrapeUrl.trim().replace(/^https?:\/\//, '').split('/')[0]}`,
            summary: `Live ingestion from ${scrapeUrl.trim()}. Content parsed and structured into CleanPuff Social HQ & Quartermaster memory.`,
            timestamp: 'Just now',
            tags: [inferredPlatform, 'CleanPuffIntel', 'LiveIngest']
        };

        setScrapedItems(prev => [newScraped, ...prev]);
        setScrapeUrl("");
        setIsScraping(false);
    };

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

            {/* 📡 CLEANPUFF ECOSYSTEM SCRAPED INTELLIGENCE STREAM */}
            <div style={{ background: "var(--bg-glass)", border: "1px solid #3fa3df80", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 24, boxShadow: "var(--shadow-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14, color: "var(--text-primary)" }}>
                            <span style={{ fontSize: 18 }}>📡</span> CleanPuff Ecosystem Scraped Intelligence Stream
                            <span style={{ fontSize: 10, background: "#3fa3df", color: "#000", padding: "2px 6px", borderRadius: 4, fontWeight: 900 }}>
                                REAL-TIME BRAND RADAR
                            </span>
                        </div>
                        <p style={{ margin: "2px 0 0 0", color: "var(--text-muted)", fontSize: 11 }}>
                            Monitoring <strong>cleanpuff.io</strong>, <strong>queef.io</strong>, <strong>@cleanpuffio</strong>, <strong>X.com</strong>, <strong>Reddit</strong>, <strong>Telegram</strong>, & <strong>Farcaster</strong> via Crawl4AI, Firecrawl, & Jina Reader.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                        {['Crawl4AI', 'Firecrawl', 'Jina Reader', 'Scrapling'].map(eng => (
                            <span key={eng} style={{ fontSize: 9, background: "var(--bg-secondary)", border: "1px solid var(--border-light)", padding: "2px 6px", borderRadius: 4, color: "var(--text-muted)", fontWeight: 700 }}>
                                {eng}
                            </span>
                        ))}
                    </div>
                </div>

                {/* PLATFORM FILTER PILLS */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {[
                        { id: 'all', label: '🌐 All Posts' },
                        { id: 'cleanpuff.io', label: '👑 cleanpuff.io' },
                        { id: 'queef.io', label: '💨 queef.io' },
                        { id: 'youtube', label: '📺 @cleanpuffio' },
                        { id: 'x.com', label: '𝕏 X.com' },
                        { id: 'reddit', label: '🤖 Reddit' },
                        { id: 'telegram', label: '✈️ Telegram' },
                        { id: 'farcaster', label: '🟣 Farcaster' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setPlatformFilter(tab.id)}
                            style={{
                                background: platformFilter === tab.id ? '#3fa3df' : 'var(--bg-secondary)',
                                color: platformFilter === tab.id ? '#000000' : 'var(--text-secondary)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 6,
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* URL SCRAPE INPUT BAR */}
                <form onSubmit={handleRunScraper} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                    <input
                        type="url"
                        value={scrapeUrl}
                        onChange={(e) => setScrapeUrl(e.target.value)}
                        placeholder="Paste any CleanPuff post link (cleanpuff.io, queef.io, x.com status, Reddit thread, or Telegram msg)..."
                        style={{ flex: "2 1 300px", background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}
                    />
                    <select
                        value={scrapingEngine}
                        onChange={(e) => setScrapingEngine(e.target.value)}
                        style={{ flex: "1 1 140px", background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 10px", color: "var(--text-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                        <option value="crawl4ai">🕷️ Crawl4AI</option>
                        <option value="firecrawl">🔥 Firecrawl</option>
                        <option value="jina">📖 Jina Reader</option>
                    </select>
                    <button
                        type="submit"
                        disabled={isScraping || !scrapeUrl.trim()}
                        style={{
                            background: scrapeUrl.trim() ? "#3fa3df" : "var(--bg-secondary)",
                            color: scrapeUrl.trim() ? "#000" : "var(--text-muted)",
                            border: "none",
                            borderRadius: 8,
                            padding: "10px 18px",
                            fontSize: 12,
                            fontWeight: 900,
                            cursor: scrapeUrl.trim() ? "pointer" : "default"
                        }}
                    >
                        {isScraping ? "Scraping..." : "⚡ Scrape & Ingest Post"}
                    </button>
                </form>

                {/* RECENTLY SCRAPED INTELLIGENCE CARDS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
                    {scrapedItems
                        .filter(item => platformFilter === 'all' || item.platform === platformFilter)
                        .map((item) => (
                            <div key={item.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 10, padding: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <span style={{ fontSize: 9, background: "rgba(63, 163, 223, 0.15)", color: "#3fa3df", border: "1px solid #3fa3df40", padding: "2px 6px", borderRadius: 4, fontWeight: 900 }}>
                                            {item.platform.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--primary-mint)" }}>
                                            {item.author}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{item.timestamp}</span>
                                </div>
                                <h4 style={{ margin: "0 0 6px 0", fontSize: 13, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>
                                    {item.title}
                                </h4>
                                <p style={{ margin: "0 0 10px 0", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                                    {item.summary}
                                </p>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                        {item.tags.map(t => (
                                            <span key={t} style={{ fontSize: 8, background: "var(--bg-primary)", color: "var(--text-secondary)", padding: "1px 5px", borderRadius: 3 }}>
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTaskTitle(`Content Task: ${item.title}`);
                                            setPoints(30);
                                            setCategory("Content");
                                        }}
                                        style={{ background: "transparent", border: "1px solid var(--primary-mint)", color: "var(--primary-mint)", borderRadius: 4, padding: "3px 8px", fontSize: 9, fontWeight: 800, cursor: "pointer" }}
                                    >
                                        + Create Task
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
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
