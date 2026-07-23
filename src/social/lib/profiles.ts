// Content pillar profiles for CleanPuff ecosystem
// Each pillar has keywords, semantic themes, and suggested angles

export interface ProductProfile {
    id: string;
    name: string;
    url: string;
    color: string;
    emoji: string;
    keywords: string[];
    themes: string[];
    angles: Record<string, string>; // keyword → suggested post angle
}

export const PRODUCT_PROFILES: ProductProfile[] = [
    {
        id: 'comedy',
        name: 'Comedy Clips',
        url: 'cleanpuff.io',
        color: '#00e5a0',
        emoji: '🎬',
        keywords: [
            'comedy', 'animation', 'cartoon', 'funny', 'meme', 'viral', 'laugh',
            'humor', 'sketch', 'parody', 'skit', 'trending audio', 'reaction',
            'tiktok', 'reels', 'shorts', 'content creator', 'entertainment',
        ],
        themes: [
            'viral comedy content', 'animated humor', 'meme culture',
            'short-form video', 'comedy animation trends',
        ],
        angles: {
            'comedy': "This is exactly what CleanPuff does — animated comedy that hits different. New clip dropping soon 💨🎬",
            'animation': "Animation + comedy = unstoppable. CleanPuff is proof. Check our latest episode 👀",
            'meme': "We turned this into an animated meme before it was cool. CleanPuff stays ahead 💨",
            'viral': "Going viral isn't luck — it's animation quality + timing. Here's how CleanPuff does it 🎯",
            'funny': "CleanPuff writers room right now: 'We can make this funnier.' And they did. 😂💨",
        },
    },
    {
        id: 'lore',
        name: 'Lore & Story',
        url: 'cleanpuff.io',
        color: '#8b5cf6',
        emoji: '📖',
        keywords: [
            'story', 'lore', 'narrative', 'character', 'universe', 'episode',
            'series', 'animated series', 'world building', 'plot', 'storyline',
            'arc', 'season', 'premiere', 'finale', 'anime', 'cartoon network',
        ],
        themes: [
            'narrative universe building', 'character development', 'episodic content',
            'animated storytelling', 'world lore and canon',
        ],
        angles: {
            'story': "Every great animated universe starts with a story worth telling. CleanPuff's lore goes deep 📖💨",
            'character': "CleanPuff characters have more depth than you'd expect from a comedy. Wait till you meet the new ones 👀",
            'episode': "New CleanPuff episode in the vault. The lore expands. The plot thickens. 🎬📖",
            'series': "Building an animated series from scratch. Here's what we learned at CleanPuff 🧵",
            'anime': "CleanPuff isn't anime, but our fans draw fan art like it is. That's the power of good lore 🔥",
        },
    },
    {
        id: 'community',
        name: 'Community & NFT',
        url: 'cleanpuff.io',
        color: '#ffc107',
        emoji: '🏆',
        keywords: [
            'nft', 'community', 'airdrop', 'token', 'solana', 'web3', 'blockchain',
            'mint', 'holder', 'reward', 'giveaway', 'dao', 'discord', 'telegram',
            'fan', 'membership', 'exclusive', 'drop', 'whitelist',
        ],
        themes: [
            'community engagement', 'NFT culture', 'web3 entertainment',
            'fan rewards and airdrops', 'creator-community connection',
        ],
        angles: {
            'nft': "CleanPuff NFTs aren't just JPEGs — they're keys to the animated universe. Holders get exclusive episodes 🏆",
            'community': "135K+ strong and growing. The CleanPuff community is built different 💨🫂",
            'airdrop': "Another CleanPuff airdrop incoming. Holders know the drill. New members — join the Discord 🎁",
            'solana': "Building on Solana because our community deserves fast, cheap, and fun. CleanPuff moves at SOL speed ⚡",
            'web3': "Web3 entertainment done right: great content first, community rewards second. That's CleanPuff 🎯",
        },
    },
    {
        id: 'bts',
        name: 'Behind the Scenes',
        url: 'cleanpuff.io',
        color: '#ff2d78',
        emoji: '🎨',
        keywords: [
            'animation process', 'behind the scenes', 'making of', 'design', 'art',
            'creative', 'studio', 'workflow', 'render', 'blender', 'after effects',
            'illustrator', 'storyboard', 'concept art', 'rigging', 'motion graphics',
        ],
        themes: [
            'creator economy', 'animation industry', 'creative process',
            'behind the scenes content', 'animation production pipeline',
        ],
        angles: {
            'animation': "From storyboard to final render: here's how a CleanPuff episode gets made 🎨→🎬",
            'design': "Our lead artist just dropped a new character design. The community is NOT ready 👀🎨",
            'creative': "Creative process at CleanPuff: chaos → caffeine → comedy gold. Every. Single. Time. ☕💨",
            'blender': "Blender + After Effects + pure chaos = CleanPuff animation pipeline. Here's a peek behind the curtain 🎨",
            'art': "Fan art Fridays hit different when your community has THIS much talent. CleanPuff fam 🔥🎨",
        },
    },
];

// Compute relevance score between a headline and product profiles
export function scoreRelevance(headline: string, profile: ProductProfile): number {
    const lower = headline.toLowerCase();
    let score = 0;

    // Exact keyword matches (weighted heavily)
    for (const kw of profile.keywords) {
        if (lower.includes(kw)) {
            score += 15;
        }
    }

    // Individual word matches from keywords
    const headlineWords = new Set(lower.split(/\W+/).filter(w => w.length > 3));
    for (const kw of profile.keywords) {
        const kwWords = kw.split(/\W+/);
        for (const word of kwWords) {
            if (word.length > 3 && headlineWords.has(word)) {
                score += 3;
            }
        }
    }

    // Theme matches
    for (const theme of profile.themes) {
        const themeWords = theme.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const matches = themeWords.filter(w => headlineWords.has(w)).length;
        if (matches >= 2) score += 10;
    }

    // Normalize to 0-100
    return Math.min(100, score);
}

// Get the best matching angle for a headline
export function getBestAngle(headline: string, profile: ProductProfile): string | null {
    const lower = headline.toLowerCase();

    for (const [keyword, angle] of Object.entries(profile.angles)) {
        if (lower.includes(keyword)) {
            return angle;
        }
    }

    // Check individual words from angle keys
    for (const [keyword, angle] of Object.entries(profile.angles)) {
        const words = keyword.split(/\W+/);
        if (words.some(w => w.length > 3 && lower.includes(w))) {
            return angle;
        }
    }

    return null;
}
