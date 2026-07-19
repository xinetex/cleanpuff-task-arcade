---
name: tidal-storage-manager
description: Manage Seagate Lyve S3 storage tiers, Seashore tidal ebb/flow policies, low-tide cold archiving for CapCut & Final Cut Pro working files, high-tide hydration, and file pinning in Task Arcade and JettyThunder.
---

# Tidal Storage Manager Skill

Use this skill when an AI agent needs to manage video storage tiers, execute low-tide auto-archiving, pin master export assets, or hydrate cold video files for CapCut and Final Cut Pro production workflows.

## Shoreline Storage Model

1. **Dry Land (Local SSD / NLE Working Dir):** Local CapCut & Final Cut Pro editing directory on editor's Mac.
2. **Surf Edge (CDN Proxy):** Ultra-fast Cloudflare / JettyThunder H.265 streaming proxy (18 Mbps, 0ms latency).
3. **Open Water (Hot S3):** Seagate Lyve Cloud S3 active storage (`storageTier = 'active'`).
4. **Deep Ocean (Cold Archive):** Seagate Lyve Cloud Glacier archive (`storageTier = 'archive'`).

## Core Operations

### 1. Low-Tide Auto-Archiving (`cron.tideEbb`)
- Scans files idle for longer than the `tideDaysThreshold` (default 14 days).
- Excludes files tagged with `isPinned: true` (`🔒 Pinned to Shore`).
- Moves raw NLE working clips from Dry Land / Open Water to Deep Ocean cold storage.
- Reclaims local SSD space and updates `localBytesSaved`.

### 2. High-Tide Hydration (`hydrateAsset`)
- Predictively warms up archived files from Deep Ocean into Surf Edge CDN.
- Triggered automatically 2 hours before scheduled review sessions or task assignments.

### 3. File Pinning (`togglePin`)
- Pinned files (`pinnedAt: timestamp`, `pinnedBy: userId`) stay hot permanently and are protected against low-tide eviction.
