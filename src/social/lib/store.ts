import type { SocialPost, DashboardStats, Channel, CalendarEntry, ToolkitItem, PostStatus } from './types';

const STORAGE_KEY = 'cleanpuff_social_posts_v1';
const CALENDAR_KEY = 'cleanpuff_calendar_v1';

export function getAllPosts(): SocialPost[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        seedDemoData();
        return getAllPosts();
    }
    return JSON.parse(data);
}

export function getPostsByStatus(status: PostStatus): SocialPost[] {
    return getAllPosts().filter(post => post.status === status);
}

export function getPost(id: string): SocialPost | undefined {
    return getAllPosts().find(post => post.id === id);
}

export function createPost(post: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>): SocialPost {
    const posts = getAllPosts();
    const newPost: SocialPost = {
        ...post,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    posts.push(newPost);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return newPost;
}

export function updatePost(id: string, updates: Partial<SocialPost>): SocialPost | undefined {
    const posts = getAllPosts();
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    posts[index] = {
        ...posts[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return posts[index];
}

export function deletePost(id: string): void {
    const posts = getAllPosts();
    const filtered = posts.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function getStats(): DashboardStats {
    const posts = getAllPosts();
    
    return posts.reduce((stats, post) => {
        if (post.status === 'draft') stats.totalDrafts++;
        if (post.status === 'scheduled') stats.totalScheduled++;
        if (post.status === 'posted') {
            stats.totalPosted++;
            stats.totalImpressions += post.metrics?.impressions || 0;
            stats.totalLikes += post.metrics?.likes || 0;
            stats.totalViews += post.metrics?.views || 0;
            
            // Check if posted this week
            const postDate = new Date(post.postedAt || post.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (postDate >= weekAgo) {
                stats.postsThisWeek++;
            }
        }
        return stats;
    }, {
        totalDrafts: 0,
        totalScheduled: 0,
        totalPosted: 0,
        totalImpressions: 0,
        totalLikes: 0,
        totalViews: 0,
        postsThisWeek: 0,
        engagementRate: 5.4 // Mock static rate for demo
    });
}

export function getChannels(): Channel[] {
    return [
        { platform: 'youtube', handle: '@cleanpuffio', displayName: 'Princess Puff (CleanPuff)', followers: 135000, weeklyGrowth: 2.1, avgEngagement: 12.5, connected: true, avatarEmoji: '👑' },
        { platform: 'tiktok', handle: '@cleanpuff.io', displayName: 'CleanPuff', followers: 890000, weeklyGrowth: 5.4, avgEngagement: 18.2, connected: true, avatarEmoji: '💨' },
        { platform: 'x', handle: '@CleanPuff_Sol', displayName: 'CleanPuff | The Animated Series', followers: 45000, weeklyGrowth: 1.2, avgEngagement: 4.8, connected: true, avatarEmoji: '🎨' },
        { platform: 'instagram', handle: '@cleanpuff.art', displayName: 'CleanPuff Studio', followers: 32000, weeklyGrowth: 0.8, avgEngagement: 3.5, connected: true, avatarEmoji: '📸' },
        { platform: 'discord', handle: 'cleanpuff', displayName: 'The Puff Pad', followers: 12500, weeklyGrowth: 0.5, avgEngagement: 25.0, connected: true, avatarEmoji: '👾' },
        { platform: 'telegram', handle: 'cleanpuff_ann', displayName: 'CleanPuff Announcements', followers: 8500, weeklyGrowth: 0.2, avgEngagement: 15.0, connected: true, avatarEmoji: '📣' }
    ];
}

export function getCalendarEntries(): CalendarEntry[] {
    const data = localStorage.getItem(CALENDAR_KEY);
    if (!data) {
        const entries: CalendarEntry[] = [
            { id: 'c1', date: new Date().toISOString().split('T')[0], title: 'Episode 4 Teaser', platform: 'x', contentType: 'video', status: 'posted' },
            { id: 'c2', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], title: 'Behind the Scenes: Rigging', platform: 'instagram', contentType: 'reel', status: 'scheduled' },
            { id: 'c3', date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], title: 'Solana NFT Snapshot Announcement', platform: 'discord', contentType: 'text', status: 'scheduled' },
            { id: 'c4', date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], title: 'TikTok Trending Audio Skit', platform: 'tiktok', contentType: 'short', status: 'draft' },
        ];
        localStorage.setItem(CALENDAR_KEY, JSON.stringify(entries));
        return entries;
    }
    return JSON.parse(data);
}

export function addCalendarEntry(entry: Omit<CalendarEntry, 'id'>): CalendarEntry {
    const entries = getCalendarEntries();
    const newEntry = { ...entry, id: crypto.randomUUID() };
    entries.push(newEntry);
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(entries));
    return newEntry;
}

export function getToolkit(): ToolkitItem[] {
    return [
        { id: 't1', name: 'HypeFury', description: 'Advanced Twitter/X scheduling and thread creation', category: 'scheduler', status: 'active', price: '$49/mo', url: 'https://hypefury.com', emoji: '🦅', features: ['Thread unrolling', 'Auto-RT', 'Analytics'], recommended: true },
        { id: 't2', name: 'Later', description: 'Visual planner for Instagram and TikTok', category: 'scheduler', status: 'planned', price: '$25/mo', url: 'https://later.com', emoji: '📅', features: ['Grid preview', 'First comment', 'Linkin.bio'], recommended: false },
        { id: 't3', name: 'TubeBuddy', description: 'YouTube channel management and SEO', category: 'analytics', status: 'active', price: '$15/mo', url: 'https://tubebuddy.com', emoji: '📈', features: ['Keyword research', 'A/B testing', 'Bulk processing'], recommended: true },
        { id: 't4', name: 'Midjourney', description: 'AI image generation for concept art', category: 'creation', status: 'active', price: '$30/mo', url: 'https://midjourney.com', emoji: '🎨', features: ['V6 generation', 'Upscaling', 'Variations'], recommended: true },
        { id: 't5', name: 'TweetDeck', description: 'Real-time X listening and engagement', category: 'listening', status: 'free', price: 'Free', url: 'https://tweetdeck.twitter.com', emoji: '🎧', features: ['Columns', 'Multiple accounts', 'Live updates'], recommended: true }
    ];
}

export function seedDemoData() {
    const demoPosts: SocialPost[] = [
        {
            id: crypto.randomUUID(),
            content: "Just finished the final render for Episode 5! 🎬 The rendering time was insane but worth it. Wait until you see what Puff does next... Drop your theories below! 👇 #CleanPuff #SolanaNFT #Animation",
            status: 'posted',
            platform: 'x',
            contentType: 'text',
            metrics: { likes: 1250, reposts: 342, replies: 156, impressions: 45000, bookmarks: 89 },
            postedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
            id: crypto.randomUUID(),
            content: "POV: When the Solana network congests right as we try to airdrop the new character traits 😤",
            status: 'posted',
            platform: 'tiktok',
            contentType: 'short',
            metrics: { likes: 15400, reposts: 2100, replies: 890, impressions: 125000, bookmarks: 450, views: 125000 },
            postedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
        {
            id: crypto.randomUUID(),
            content: "CleanPuff Episode 4: The Great Wallet Heist | Official Comedy Short",
            status: 'scheduled',
            platform: 'youtube',
            contentType: 'video',
            scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: crypto.randomUUID(),
            content: "A sneak peek at the storyboards for our next drop. The line art is coming along nicely! ✍️✨",
            status: 'draft',
            platform: 'instagram',
            contentType: 'image',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: crypto.randomUUID(),
            content: "@everyone The snapshot for the exclusive 'Golden Puff' role will be taken in 48 hours! Make sure your wallets are connected in the verification channel. 🏆",
            status: 'scheduled',
            platform: 'discord',
            contentType: 'text',
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoPosts));
    
    // Also seed calendar
    getCalendarEntries();
}
