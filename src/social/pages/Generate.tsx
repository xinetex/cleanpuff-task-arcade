import { useCallback, useState } from 'react';
import { createPost } from '../lib/store';
import PostCard from '../components/PostCard';
import type { SocialPost, Platform, ContentType } from '../lib/types';
import { PLATFORM_META } from '../lib/types';

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

// Client-side content generation (no LLM needed for MVP)
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
                content: `[Draft about: ${topic}]\n\nGenerate this content by connecting to an LLM API. For now, use the topic and style (${style}) as a prompt.`,
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

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setGenerating(true);

        // Simulate generation delay
        await new Promise(r => setTimeout(r, 800));

        const drafts = generateContent(topic, style, count, platform);
        const saved = drafts.map(d => createPost(d));
        setGenerated(prev => [...saved, ...prev]);
        setGenerating(false);
    };

    const handleCompose = () => {
        if (!composeContent.trim()) return;
        const saved = createPost({
            content: composeContent,
            status: 'draft',
            sourceTopic: composeSource || 'Manual',
            platform: composePlatform,
            contentType: composeContentType,
        });
        setGenerated(prev => [saved, ...prev]);
        setComposeContent('');
        setComposeSource('');
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

    return (
        <div>
            <div className="page-header">
                <h2>✨ Create Content</h2>
                <p>Generate posts for the CleanPuff universe</p>
            </div>

            <div className="generate-layout">
                <div className="generate-form">
                    <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: 3 }}>
                        <button
                            className={`btn ${mode === 'compose' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setMode('compose')}
                            style={{ flex: 1, justifyContent: 'center', borderRadius: 'var(--radius-sm)' }}
                        >
                            ✍️ Compose
                        </button>
                        <button
                            className={`btn ${mode === 'ai' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setMode('ai')}
                            style={{ flex: 1, justifyContent: 'center', borderRadius: 'var(--radius-sm)' }}
                        >
                            ✨ AI Generate
                        </button>
                    </div>

                    {mode === 'compose' ? (
                        <>
                            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Platform</label>
                                    <select className="form-select" value={composePlatform} onChange={e => setComposePlatform(e.target.value as Platform)}>
                                        {Object.entries(PLATFORM_META).map(([key, meta]) => (
                                            <option key={key} value={key}>{meta.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Content Type</label>
                                    <select className="form-select" value={composeContentType} onChange={e => setComposeContentType(e.target.value as ContentType)}>
                                        <option value="text">Single Post (Text)</option>
                                        <option value="thread">Thread</option>
                                        <option value="video">Video/Reel</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Your Post</label>
                                <textarea
                                    className="form-textarea"
                                    value={composeContent}
                                    onChange={e => setComposeContent(e.target.value)}
                                    placeholder="Write your post here... Make it funny!"
                                    rows={6}
                                    style={{ minHeight: 160 }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Topic Label (optional)</label>
                                <input
                                    className="form-input"
                                    value={composeSource}
                                    onChange={e => setComposeSource(e.target.value)}
                                    placeholder="e.g., Episode 5 teaser, NFT whitelist..."
                                />
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleCompose}
                                disabled={!composeContent.trim()}
                                style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13 }}
                            >
                                📝 Save as Draft
                            </button>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                                {CONTENT_TEMPLATES.map((t, i) => (
                                    <button
                                        key={i}
                                        className="btn btn-ghost"
                                        onClick={() => handleQuickGenerate(t)}
                                        style={{ fontSize: 11 }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Topic / Prompt</label>
                                <textarea
                                    className="form-textarea"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    placeholder="e.g., A joke about forgetting to unstake your SOL..."
                                    rows={3}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Platform</label>
                                    <select className="form-select" value={platform} onChange={e => setPlatform(e.target.value as Platform)}>
                                        {Object.entries(PLATFORM_META).map(([key, meta]) => (
                                            <option key={key} value={key}>{meta.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Style</label>
                                    <select className="form-select" value={style} onChange={e => setStyle(e.target.value as ContentType)}>
                                        <option value="text">Single Post (Text)</option>
                                        <option value="thread">Thread</option>
                                        <option value="video">Video/Reel</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Count</label>
                                    <select className="form-select" value={count} onChange={e => setCount(Number(e.target.value))}>
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
                                style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13 }}
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

                <div className="generate-results">
                    {generated.length > 0 ? (
                        <div className="posts-list">
                            {generated.map(p => (
                                <PostCard key={p.id} post={p} showActions={true} onDiscard={handleDiscard} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">{mode === 'compose' ? '✍️' : '⚡'}</div>
                            <h3>{mode === 'compose' ? 'Write your first post' : 'Pick a topic to start'}</h3>
                            <p>{mode === 'compose'
                                ? 'Compose a post manually. It\'ll be saved as a draft for review before publishing.'
                                : 'Use the quick templates or type a custom topic. Generated drafts will appear here.'
                            }</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
