import { PLATFORM_META } from '../lib/types';
import type { Platform } from '../lib/types';

interface PlatformBadgeProps {
    platform: Platform;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export default function PlatformBadge({
    platform,
    size = 'md',
    showLabel = true,
}: PlatformBadgeProps) {
    const meta = PLATFORM_META[platform];
    if (!meta) return null;

    return (
        <span className={`platform-badge ${platform} size-${size}`}>
            <span className="platform-icon">{meta.icon}</span>
            {showLabel && <span className="platform-label">{meta.label}</span>}
        </span>
    );
}
