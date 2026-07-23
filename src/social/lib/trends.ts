// Trend sources: HackerNews and Reddit (free, no API key needed)

export interface TrendItem {
    id: string;
    title: string;
    url: string;
    source: 'hackernews' | 'reddit' | 'lobsters';
    sourceLabel: string;
    score: number;
    comments: number;
    postedAt: string;
}

// Fetch top HackerNews stories
export async function fetchHackerNewsTrends(limit = 30): Promise<TrendItem[]> {
    try {
        const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const ids: number[] = await res.json();

        const stories = await Promise.all(
            ids.slice(0, limit).map(async (id) => {
                const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                return storyRes.json();
            })
        );

        return stories
            .filter((s: any) => s && s.title && s.type === 'story')
            .map((s: any) => ({
                id: `hn-${s.id}`,
                title: s.title,
                url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
                source: 'hackernews' as const,
                sourceLabel: 'Hacker News',
                score: s.score || 0,
                comments: s.descendants || 0,
                postedAt: new Date(s.time * 1000).toISOString(),
            }));
    } catch (e) {
        console.error('Failed to fetch HN trends:', e);
        return [];
    }
}

// Fetch trending Reddit posts from relevant subreddits
export async function fetchRedditTrends(limit = 25): Promise<TrendItem[]> {
    const subreddits = [
        'selfhosted', 'devops', 'artificial', 'MachineLearning',
        'opensource', 'programming', 'technology', 'SaaS',
    ];

    try {
        const res = await fetch(
            `https://www.reddit.com/r/${subreddits.join('+')}/hot.json?limit=${limit}`,
            { headers: { 'User-Agent': 'JettyThunder-Social/1.0' } }
        );
        const data = await res.json();

        return (data.data?.children || [])
            .filter((c: any) => c.data && !c.data.stickied)
            .map((c: any) => ({
                id: `reddit-${c.data.id}`,
                title: c.data.title,
                url: `https://reddit.com${c.data.permalink}`,
                source: 'reddit' as const,
                sourceLabel: `r/${c.data.subreddit}`,
                score: c.data.score || 0,
                comments: c.data.num_comments || 0,
                postedAt: new Date(c.data.created_utc * 1000).toISOString(),
            }));
    } catch (e) {
        console.error('Failed to fetch Reddit trends:', e);
        return [];
    }
}

// Fetch from Lobsters (tech-focused HN alternative)
export async function fetchLobstersTrends(limit = 25): Promise<TrendItem[]> {
    try {
        const res = await fetch('https://lobste.rs/hottest.json');
        const stories: any[] = await res.json();

        return stories.slice(0, limit).map((s: any) => ({
            id: `lobsters-${s.short_id}`,
            title: s.title,
            url: s.url || s.comments_url,
            source: 'lobsters' as const,
            sourceLabel: 'Lobsters',
            score: s.score || 0,
            comments: s.comment_count || 0,
            postedAt: s.created_at,
        }));
    } catch (e) {
        console.error('Failed to fetch Lobsters trends:', e);
        return [];
    }
}

// Fetch all trends
export async function fetchAllTrends(): Promise<TrendItem[]> {
    const [hn, reddit, lobsters] = await Promise.all([
        fetchHackerNewsTrends(),
        fetchRedditTrends(),
        fetchLobstersTrends(),
    ]);

    return [...hn, ...reddit, ...lobsters];
}
