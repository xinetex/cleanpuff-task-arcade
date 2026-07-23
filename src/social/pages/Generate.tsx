import { useCallback, useState } from 'react';
import { createPost } from '../lib/store';
import PostCard from '../components/PostCard';
import type { SocialPost, Platform, ContentType } from '../lib/types';
import { PLATFORM_META } from '../lib/types';
import { Sparkles, Send, CheckCircle2, Copy, Trash2, Calendar, Wand2, Hash, Layers } from 'lucide-react';

const PLATFORM_LIMITS: Record<Platform, number> = {
    x: 280,
    tiktok: 150,
    youtube: 5000,
    instagram: 2200,
    discord: 2000,
    telegram: 4096,
};

const PLATFORM_HANDLES: Record<Platform, { handle: string; name: string; icon: string; color: string }> = {
    x: { handle: "@CleanPuff_Sol", name: "CleanPuff | Animated Series", icon: "𝕏", color: "#1DA1F2" },
    tiktok: { handle: "@cleanpuff.io", name: "CleanPuff Official", icon: "🎵", color: "#ff0050" },
    youtube: { handle: "@cleanpuffio", name: "Princess Puff (CleanPuff)", icon: "📺", color: "#FF0000" },
    instagram: { handle: "@cleanpuff.art", name: "CleanPuff Studio", icon: "📸", color: "#E1306C" },
    discord: { handle: "#cleanpuff-announcements", name: "CleanPuff Realm DAO", icon: "💬", color: "#5865F2" },
    telegram: { handle: "t.me/cleanpuff_official", name: "CleanPuff Announcements", icon: "✈️", color: "#2AABEE" },
};

const CONTENT_TEMPLATES = [
    {
        label: '🎬 Comedy Clip Caption',
        topic: 'Funny moment from the latest episode',
        style: 'video' as const,
        platform: 'tiktok' as const,
    },
    {
        label: '📺 Episode Announcement',
        topic: 'New CleanPuff episode drop',
        style: 'text' as const,
        platform: 'youtube' as const,
    },
    {
        label: '🏆 NFT Drop Announcement',
        topic: 'Exclusive community NFT airdrop',
        style: 'thread' as const,
        platform: 'x' as const,
    },
    {
        label: '🎨 Behind the Scenes',
        topic: 'Animation process and storyboarding',
        style: 'text' as const,
        platform: 'instagram' as const,
    },
    {
        label: '💬 Community Engagement',
        topic: 'Poll or question for the fans',
        style: 'text' as const,
        platform: 'x' as const,
    },
];

// Client-side content generation (fallback template engine)
function generateContent(topic: string, style: ContentType, count: number, platform: Platform): Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>[] {
    const templates: Record<string, () => Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>> = {
        'Funny moment from the latest episode': () => ({
            content: "When you hit the bong a little too hard and start seeing in 4D 🥴💨\n\n#CleanPuff #Comedy #Animation #420",
            status: 'draft',
            sourceTopic: topic,
            platform,
            contentType: 'video',
        }),
        'New CleanPuff episode drop': () => ({
            content: "🚨 NEW EPISODE LIVE 🚨\n\nThe squad accidentally summons a couch demon. You won't believe what happens next. \n\nWatch now on YouTube! 📺✨",
            status: 'draft',
            sourceTopic: topic,
            platform,
            contentType: 'text',
        }),
        'Exclusive community NFT airdrop': () => ({
            content: "Puffers, it's time. 🏆\n\nThe Genesis Collection is dropping this Friday.\n\nHere's everything you need to know about the mint, the perks, and the future of CleanPuff on Solana. 👇",
            thread: [
                "1/ 🎨 5,000 unique hand-drawn traits. Each NFT grants access to exclusive holder-only episodes and discord channels.",
                "2/ 💸 Mint price: 0.5 SOL.\n\nWe wanted to keep it accessible for the true community while funding the next season of animation.",
                "3/ 🗓️ WL Mint: Friday 4PM EST\nPublic: Friday 6PM EST\n\nTurn notifications ON so you don't miss out! 🔔"
            ],
            status: 'draft',
            sourceTopic: topic,
            platform,
            contentType: 'thread',
        }),
        'Animation process and storyboarding': () => ({
            content: "Ever wonder how we make the magic happen? ✨🎨\n\nHere's a sneak peek at the storyboard vs final animation for Episode 4. Our animators have been cooking! 🔥",
            status: 'draft',
            sourceTopic: topic,
            platform,
            contentType: 'text',
        }),
        'Poll or question for the fans': () => ({
            content: "Be honest... who would survive the longest in a zombie apocalypse?\n\nA) Bong Lord\nB) Spliff Rick\nC) The sentient lighter\n\nDrop your votes 👇🧟‍♂️",
            status: 'draft',
            sourceTopic: topic,
            platform,
            contentType: 'text',
        }),
    };

    const results: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const generator = templates[topic];

    for (let i = 0; i < count; i++) {
        if (generator) {
            results.push(generator());
        } else {
            results.push({
                content: `🚀 [CleanPuff Announcement: ${topic}]\n\nThe Realm is heating up! Dive into the latest lore & animated shorts in Puffdom.\n\n#CleanPuff #Solana #Animation`,
                status: 'draft',
                sourceTopic: topic,
                platform,
                contentType: style,
            });
        }
    }

    return results;
}

export default function Generate() {
    const [mode, setMode] = useState<'compose' | 'ai'>('compose');
    const [topic, setTopic] = useState('');
    const [style, setStyle] = useState<ContentType>('text');
    const [platform, setPlatform] = useState<Platform>('x');
    const [count, setCount] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState<SocialPost[]>([]);
    const [, setRefresh] = useState(0);
    const forceRefresh = useCallback(() => setRefresh(n => n + 1), []);

    // Manual compose state
    const [composeContent, setComposeContent] = useState('');
    const [composeSource, setComposeSource] = useState('');
    const [composePlatform, setComposePlatform] = useState<Platform>('x');
    const [composeContentType, setComposeContentType] = useState<ContentType>('text');
    const [feedback, setFeedback] = useState<string | null>(null);

    const charLimit = PLATFORM_LIMITS[composePlatform] || 280;
    const charCount = composeContent.length;
    const isOverLimit = charCount > charLimit;

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setGenerating(true);

        await new Promise(r => setTimeout(r, 600));

        const drafts = generateContent(topic, style, count, platform);
        const saved = drafts.map(d => createPost(d));
        setGenerated(prev => [...saved, ...prev]);
        setGenerating(false);
        showFeedback(`⚡ Generated ${count} new draft(s)!`);
    };

    const handleCompose = () => {
        if (!composeContent.trim()) return;
        const saved = createPost({
            content: composeContent,
            status: 'draft',
            sourceTopic: composeSource || 'Manual Compose',
            platform: composePlatform,
            contentType: composeContentType,
        });
        setGenerated(prev => [saved, ...prev]);
        setComposeContent('');
        setComposeSource('');
        showFeedback('📝 Saved draft to Social HQ!');
    };

    const showFeedback = (msg: string) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(null), 3500);
    };

    const handleQuickGenerate = (template: typeof CONTENT_TEMPLATES[0]) => {
        setTopic(template.topic);
        setStyle(template.style);
        setPlatform(template.platform);
    };

    const handleDiscard = (id: string) => {
        setGenerated(prev => prev.filter(p => p.id !== id));
        forceRefresh();
    };

    // Quick AI tools for composer
    const applyAIPolish = () => {
        if (!composeContent.trim()) return;
        let text = composeContent.trim();
        if (!text.endsWith('.')) text += '.';
        text += '\n\nWatch full episodes on YouTube! 📺 #CleanPuff';
        setComposeContent(text);
        showFeedback('✨ Applied AI Polish!');
    };

    const applyViralHook = () => {
        const hooks = [
            "Wait until you see what the Puffdom squad did today... 🤯\n\n",
            "This is officially the most unhinged scene in CleanPuff history. 👇\n\n",
            "Stop scrolling. You need to hear this. 🚨\n\n",
        ];
        const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
        setComposeContent(randomHook + composeContent);
        showFeedback('📢 Added Viral Hook!');
    };

    const applyHashtags = () => {
        if (!composeContent.includes('#CleanPuff')) {
            setComposeContent(composeContent + '\n\n#CleanPuff #Puffdom #Solana #Animation');
            showFeedback('🏷️ Added CleanPuff Hashtags!');
        }
    };

    const formatThread = () => {
        if (!composeContent.trim()) return;
        const paragraphs = composeContent.split('\n\n').filter(Boolean);
        if (paragraphs.length > 1) {
            const formatted = paragraphs.map((p, idx) => `${idx + 1}/ ${p}`).join('\n\n');
            setComposeContent(formatted);
            setComposeContentType('thread');
            showFeedback('🧶 Auto-Formatted Thread!');
        } else {
            setComposeContent(`1/ ${composeContent}\n\n2/ Stay tuned for part 2! 🔥`);
            setComposeContentType('thread');
            showFeedback('🧶 Formatted as Thread!');
        }
    };

    const currentHandle = PLATFORM_HANDLES[composePlatform] || PLATFORM_HANDLES.x;

    return (
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: 20 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={22} color="var(--primary-mint)" /> Content Studio & Composer
                </h2>
                <p>Create, polish, and preview posts across the CleanPuff universe</p>
            </div>

            {feedback && (
                <div style={{
                    background: 'rgba(47, 141, 77, 0.15)',
                    border: '1px solid var(--primary-mint)',
                    color: 'var(--primary-mint)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <CheckCircle2 size={16} /> {feedback}
                </div>
            )}

            <div className="generate-layout">
                {/* LEFT COLUMN: COMPOSER PANEL */}
                <div className="generate-form-panel" style={{ padding: 24, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 16 }}>
                    {/* MODE SWITCH TABS */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--bg-primary)', padding: 4, borderRadius: 10, border: '1px solid var(--border-light)' }}>
                        <button
                            className={`btn ${mode === 'compose' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setMode('compose')}
                            style={{ flex: 1, justifyContent: 'center', borderRadius: 8, fontWeight: 800, fontSize: 13 }}
                        >
                            ✍️ Studio Composer
                        </button>
                        <button
                            className={`btn ${mode === 'ai' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setMode('ai')}
                            style={{ flex: 1, justifyContent: 'center', borderRadius: 8, fontWeight: 800, fontSize: 13 }}
                        >
                            ✨ AI Generator
                        </button>
                    </div>

                    {mode === 'compose' ? (
                        <>
                            {/* PLATFORM SELECTOR PILLS */}
                            <div style={{ marginBottom: 16 }}>
                                <label className="form-label" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Target Platform</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                                    {(['x', 'tiktok', 'youtube', 'instagram', 'discord'] as Platform[]).map((p) => {
                                        const meta = PLATFORM_HANDLES[p];
                                        const isSelected = composePlatform === p;
                                        return (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setComposePlatform(p)}
                                                style={{
                                                    background: isSelected ? meta.color : 'var(--bg-primary)',
                                                    color: isSelected ? '#ffffff' : 'var(--text-primary)',
                                                    border: `1px solid ${isSelected ? meta.color : 'var(--border-light)'}`,
                                                    borderRadius: 8,
                                                    padding: '6px 12px',
                                                    fontSize: 12,
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <span>{meta.icon}</span> {PLATFORM_META[p]?.label || p.toUpperCase()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CONTENT TYPE SELECTOR */}
                            <div style={{ marginBottom: 16 }}>
                                <label className="form-label" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Format & Style</label>
                                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                    {[
                                        { id: 'text', label: '📄 Post (Text)', icon: '📄' },
                                        { id: 'thread', label: '🧶 Thread', icon: '🧶' },
                                        { id: 'video', label: '🎥 Video / Reel', icon: '🎥' },
                                    ].map((fmt) => (
                                        <button
                                            key={fmt.id}
                                            type="button"
                                            onClick={() => setComposeContentType(fmt.id as ContentType)}
                                            style={{
                                                flex: 1,
                                                background: composeContentType === fmt.id ? 'var(--primary-mint)' : 'var(--bg-primary)',
                                                color: composeContentType === fmt.id ? 'var(--bg-primary)' : 'var(--text-primary)',
                                                border: '1px solid var(--border-light)',
                                                borderRadius: 8,
                                                padding: '6px 10px',
                                                fontSize: 11,
                                                fontWeight: 800,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {fmt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* QUICK AI TOOLBAR STRIP */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary-mint)', textTransform: 'uppercase' }}>Quick Tools:</span>
                                <button type="button" onClick={applyAIPolish} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Wand2 size={10} color="var(--primary-mint)" /> Polish
                                </button>
                                <button type="button" onClick={applyViralHook} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    📢 Viral Hook
                                </button>
                                <button type="button" onClick={applyHashtags} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Hash size={10} color="#3fa3df" /> Hashtags
                                </button>
                                <button type="button" onClick={formatThread} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Layers size={10} color="#a78bfa" /> Auto Thread
                                </button>
                                {composeContent && (
                                    <button type="button" onClick={() => setComposeContent('')} style={{ background: 'transparent', border: 'none', color: '#e9627a', fontSize: 10, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}>
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* MAIN TEXT AREA (SPACIOUS & EXPANDED) */}
                            <div className="form-group" style={{ marginBottom: 12 }}>
                                <textarea
                                    className="form-textarea"
                                    value={composeContent}
                                    onChange={e => setComposeContent(e.target.value)}
                                    placeholder="Write your post here... Make it funny, engaging, and atmospheric!"
                                    style={{
                                        width: '100%',
                                        minHeight: 280,
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                        padding: 16,
                                        borderRadius: 12,
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        border: `1.5px solid ${isOverLimit ? '#e9627a' : 'var(--border-light)'}`,
                                        outline: 'none',
                                        resize: 'vertical',
                                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)'
                                    }}
                                />
                            </div>

                            {/* DYNAMIC CHARACTER COUNTER BAR */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div style={{ flex: 1, marginRight: 16 }}>
                                    <div style={{ width: '100%', height: 5, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(100, (charCount / charLimit) * 100)}%`,
                                            height: '100%',
                                            background: isOverLimit ? '#e9627a' : (charCount / charLimit > 0.85 ? '#efad32' : 'var(--primary-mint)'),
                                            transition: 'width 0.15s ease'
                                        }} />
                                    </div>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 800, color: isOverLimit ? '#e9627a' : 'var(--text-muted)' }}>
                                    {charCount} / {charLimit} chars
                                </span>
                            </div>

                            {/* TOPIC LABEL INPUT */}
                            <div className="form-group" style={{ marginBottom: 20 }}>
                                <label className="form-label" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Topic Label / Campaign (optional)</label>
                                <input
                                    className="form-input"
                                    value={composeSource}
                                    onChange={e => setComposeSource(e.target.value)}
                                    placeholder="e.g., Episode 5 teaser, Genesis Drop..."
                                    style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '10px 14px', fontSize: 13, border: '1px solid var(--border-light)' }}
                                />
                            </div>

                            {/* ACTION BUTTON ROW */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCompose}
                                    disabled={!composeContent.trim() || isOverLimit}
                                    style={{ flex: 1, justifyContent: 'center', padding: '12px 18px', fontSize: 13, fontWeight: 800, borderRadius: 10 }}
                                >
                                    📝 Save as Draft
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* QUICK TEMPLATE TAGS */}
                            <div style={{ marginBottom: 16 }}>
                                <label className="form-label" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Quick Story Templates</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                    {CONTENT_TEMPLATES.map((t, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            className="btn btn-ghost"
                                            onClick={() => handleQuickGenerate(t)}
                                            style={{ fontSize: 11, background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: 8 }}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Topic / Prompt</label>
                                <textarea
                                    className="form-textarea"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    placeholder="e.g., A joke about forgetting to unstake your SOL during the Puffdom festival..."
                                    rows={4}
                                    style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: 14, fontSize: 13, minHeight: 120, border: '1px solid var(--border-light)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label" style={{ fontSize: 11 }}>Platform</label>
                                    <select className="form-select" value={platform} onChange={e => setPlatform(e.target.value as Platform)} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 8 }}>
                                        {Object.entries(PLATFORM_META).map(([key, meta]) => (
                                            <option key={key} value={key}>{meta.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label" style={{ fontSize: 11 }}>Style</label>
                                    <select className="form-select" value={style} onChange={e => setStyle(e.target.value as ContentType)} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 8 }}>
                                        <option value="text">Single Post (Text)</option>
                                        <option value="thread">Thread</option>
                                        <option value="video">Video/Reel</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label" style={{ fontSize: 11 }}>Count</label>
                                    <select className="form-select" value={count} onChange={e => setCount(Number(e.target.value))} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 8 }}>
                                        <option value={1}>1 draft</option>
                                        <option value={3}>3 drafts</option>
                                        <option value={5}>5 drafts</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleGenerate}
                                disabled={generating || !topic.trim()}
                                style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: 13, fontWeight: 800, borderRadius: 10 }}
                            >
                                {generating ? (
                                    <>Generating <span className="loading-dots"><span></span><span></span><span></span></span></>
                                ) : (
                                    '⚡ Generate Drafts'
                                )}
                            </button>
                        </>
                    )}
                </div>

                {/* RIGHT COLUMN: REAL-TIME LIVE SOCIAL PREVIEW & DRAFTS STREAM */}
                <div className="generate-results" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* LIVE INTERACTIVE SOCIAL PREVIEW */}
                    <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${currentHandle.color}60`, borderRadius: 16, padding: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 10, background: currentHandle.color, color: '#fff', fontWeight: 900, padding: '2px 8px', borderRadius: 4 }}>
                                    LIVE {composePlatform.toUpperCase()} PREVIEW
                                </span>
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
                                {composeContentType.toUpperCase()} FORMAT
                            </span>
                        </div>

                        {/* MOCK POST CARD CONTAINER */}
                        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 38, height: 38, borderRadius: '50%', background: currentHandle.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
                                    {currentHandle.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {currentHandle.name} <span style={{ color: currentHandle.color, fontSize: 11 }}>✓</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{currentHandle.handle}</div>
                                </div>
                            </div>

                            {/* LIVE TEXT CONTENT */}
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', minHeight: 80 }}>
                                {composeContent.trim() ? (
                                    composeContent
                                ) : (
                                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        Your live post preview will render here in real-time as you write...
                                    </span>
                                )}
                            </div>

                            {composeSource && (
                                <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px dashed var(--border-light)', fontSize: 10, color: 'var(--primary-mint)', fontWeight: 800 }}>
                                    🏷️ Campaign: {composeSource}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SAVED DRAFTS STREAM */}
                    <div style={{ marginTop: 10 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            📋 Generated & Saved Drafts ({generated.length})
                        </h3>

                        {generated.length > 0 ? (
                            <div className="posts-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {generated.map(p => (
                                    <PostCard key={p.id} post={p} showActions={true} onDiscard={handleDiscard} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state" style={{ background: 'var(--bg-secondary)', border: '1px border-dashed var(--border-light)', borderRadius: 12, padding: 30, textAlign: 'center' }}>
                                <div className="empty-icon" style={{ fontSize: 28, marginBottom: 8 }}>✍️</div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: 14, color: 'var(--text-primary)' }}>No Saved Drafts Yet</h4>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                                    Write a post above or use AI Generate to create drafts for review before publishing.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
