---
name: nle-media-pipeline
description: Automate video asset handoffs between CapCut, Final Cut Pro, JettyThunder S3 CDN (jettythunder.app), Google Drive resources, and Task Arcade sprint tasks.
---

# NLE Media Pipeline Skill

Use this skill when an AI agent handles video imports, NLE editing state transitions, master export clearances, and task resource attachments.

## NLE Production States

- **`editing` (CapCut / Final Cut Pro):** File is actively downloaded to local SSD for timeline editing.
- **`master_exported`:** Final master video is rendered and pinned to Surf Edge CDN for team review.
- **`auto_archived`:** Raw working clips are evicted from local SSD to free hard drive space.

## Agent Workflows

1. **Task Creation Handoff:**
   - Link JettyThunder S3 presigned URL or Google Drive link to task `attachedResources`.
2. **Review & Clearance Handoff:**
   - Stream 4K master proxy inline in Task Arcade.
   - When manager approves building, trigger `master_exported` state and invoke `tidal-storage-manager` low-tide sweep for raw clips.
