export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'posted' | 'failed';
export type Platform = 'youtube' | 'tiktok' | 'x' | 'instagram' | 'discord' | 'telegram';
export type ContentType = 'video' | 'image' | 'text' | 'thread' | 'reel' | 'short';

export interface SocialPost {
    id: string;
    content: string;
    thread?: string[];
    status: PostStatus;
    platform: Platform;
    contentType: ContentType;
    source?: string;
    sourceTopic?: string;
    scheduledAt?: string;
    postedAt?: string;
    xPostId?: string;
    metrics?: PostMetrics;
    createdAt: string;
    updatedAt: string;
}

export interface PostMetrics {
    likes: number;
    reposts: number;
    replies: number;
    impressions: number;
    bookmarks: number;
    views?: number;
}

export interface GenerateRequest {
    topic: string;
    style: 'thread' | 'single' | 'announcement' | 'clip-caption' | 'episode-promo';
    platform: Platform;
    count: number;
}

export interface DashboardStats {
    totalDrafts: number;
    totalScheduled: number;
    totalPosted: number;
    totalImpressions: number;
    totalLikes: number;
    totalViews: number;
    postsThisWeek: number;
    engagementRate: number;
}

export interface Channel {
    platform: Platform;
    handle: string;
    displayName: string;
    followers: number;
    weeklyGrowth: number;
    avgEngagement: number;
    connected: boolean;
    avatarEmoji: string;
}

export interface CalendarEntry {
    id: string;
    date: string; // ISO date string YYYY-MM-DD
    title: string;
    platform: Platform;
    contentType: ContentType;
    status: PostStatus;
    postId?: string; // links to SocialPost
}

export interface ToolkitItem {
    id: string;
    name: string;
    description: string;
    category: 'scheduler' | 'analytics' | 'creation' | 'listening' | 'community';
    status: 'active' | 'planned' | 'free';
    price: string;
    url: string;
    emoji: string;
    features: string[];
    recommended: boolean;
}

export const PLATFORM_META: Record<Platform, { label: string; color: string; icon: string; gradient?: string }> = {
    youtube: { label: 'YouTube', color: '#ff0000', icon: '▶', gradient: 'linear-gradient(135deg, #ff0000, #cc0000)' },
    tiktok: { label: 'TikTok', color: '#00f2ea', icon: '♪', gradient: 'linear-gradient(135deg, #00f2ea, #ff0050)' },
    x: { label: 'X', color: '#f5f5f5', icon: '𝕏', gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
    instagram: { label: 'Instagram', color: '#e6683c', icon: '📷', gradient: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' },
    discord: { label: 'Discord', color: '#5865F2', icon: '💬', gradient: 'linear-gradient(135deg, #5865F2, #7289da)' },
    telegram: { label: 'Telegram', color: '#229ED9', icon: '✈', gradient: 'linear-gradient(135deg, #229ED9, #1a8ec7)' },
};
