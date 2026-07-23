// X API v2 — Tweet posting via OAuth 1.0a
// Uses the twitter-api-v2 package for proper OAuth signature handling

import { TwitterApi } from 'twitter-api-v2';

let client: TwitterApi | null = null;

function getEnv(key: string): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return (import.meta.env as Record<string, string>)[`VITE_${key}`] || (import.meta.env as Record<string, string>)[key];
    }
    return undefined;
}

function getClient(): TwitterApi {
    if (client) return client;

    const apiKey = getEnv('X_API_KEY');
    const apiSecret = getEnv('X_API_SECRET');
    const accessToken = getEnv('X_ACCESS_TOKEN');
    const accessTokenSecret = getEnv('X_ACCESS_TOKEN_SECRET');

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
        throw new Error(
            'Missing X API credentials. Set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET in .env'
        );
    }

    client = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken,
        accessSecret: accessTokenSecret,
    });

    return client;
}

export interface PostTweetResult {
    success: boolean;
    tweetId?: string;
    error?: string;
}

export async function postTweet(text: string): Promise<PostTweetResult> {
    try {
        const twitterClient = getClient();
        const rwClient = twitterClient.readWrite;
        const result = await rwClient.v2.tweet(text);
        return {
            success: true,
            tweetId: result.data.id,
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Failed to post tweet:', message);
        return {
            success: false,
            error: message,
        };
    }
}

export async function postThread(tweets: string[]): Promise<PostTweetResult> {
    if (tweets.length === 0) return { success: false, error: 'Empty thread' };

    try {
        const twitterClient = getClient();
        const rwClient = twitterClient.readWrite;

        let lastTweetId: string | undefined;

        for (let i = 0; i < tweets.length; i++) {
            if (i === 0) {
                const res = await rwClient.v2.tweet(tweets[i]);
                lastTweetId = res.data.id;
            } else {
                const res = await rwClient.v2.tweet(tweets[i], {
                    reply: { in_reply_to_tweet_id: lastTweetId! },
                });
                lastTweetId = res.data.id;
            }
        }

        return {
            success: true,
            tweetId: lastTweetId,
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Failed to post thread:', message);
        return {
            success: false,
            error: message,
        };
    }
}
