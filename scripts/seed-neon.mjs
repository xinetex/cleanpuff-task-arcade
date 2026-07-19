import { neon } from '@neondatabase/serverless';
import fs from 'fs';

// Read DATABASE_URL or POSTGRES_URL from env or .env.production / .env.local
let dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  try {
    const prodEnv = fs.readFileSync('.env.production', 'utf8');
    const match = prodEnv.match(/DATABASE_URL="([^"]+)"/) || prodEnv.match(/POSTGRES_URL="([^"]+)"/);
    if (match && match[1]) {
      dbUrl = match[1];
    }
  } catch (_) {}
}

if (!dbUrl) {
  console.error("❌ Could not find DATABASE_URL or POSTGRES_URL in environment or .env.production");
  process.exit(1);
}

console.log("🔌 Connecting to Neon DB...");
const sql = neon(dbUrl);

async function run() {
  try {
    console.log("🛠️ Creating tables...");

    await sql`
      CREATE TABLE IF NOT EXISTS team_members (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        color VARCHAR(20) NOT NULL,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sprints (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        goal INT NOT NULL,
        status VARCHAR(20) NOT NULL,
        starts_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(50) PRIMARY KEY,
        sprint_id VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        assignee VARCHAR(100) NOT NULL,
        assigner VARCHAR(100) NOT NULL,
        points INT NOT NULL,
        status VARCHAR(30) NOT NULL,
        component VARCHAR(50),
        world_x INT,
        world_z INT,
        reviewer VARCHAR(100),
        due VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS agent_actions (
        id VARCHAR(50) PRIMARY KEY,
        kind VARCHAR(30) NOT NULL,
        payload TEXT,
        result TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    console.log("🌱 Checking seed data...");
    const existing = await sql`SELECT COUNT(*) FROM tasks`;
    if (parseInt(existing[0].count, 10) === 0) {
      console.log("Inserting initial team members...");
      await sql`
        INSERT INTO team_members (id, name, email, color, role) VALUES
        ('1', 'J Q', 'jq@cleanpuff.io', '#2f8d4d', 'manager'),
        ('2', 'Ihor', 'ihor@cleanpuff.io', '#42be65', 'member'),
        ('3', 'Artem Kosenko', 'artem@cleanpuff.io', '#4f90df', 'member'),
        ('4', 'RV', 'rv@cleanpuff.io', '#a878e4', 'member'),
        ('5', 'Bryan Shapiro', 'bryan@cleanpuff.io', '#efad32', 'member'),
        ('6', 'Peter F.F. Bel', 'peter@cleanpuff.io', '#e9627a', 'member')
        ON CONFLICT (email) DO NOTHING;
      `;

      console.log("Inserting launch sprint...");
      await sql`
        INSERT INTO sprints (id, name, goal, status) VALUES
        ('sprint-1', 'Launch Sprint', 500, 'active')
        ON CONFLICT (id) DO NOTHING;
      `;

      console.log("Inserting 28 WhatsApp project tasks...");
      await sql`
        INSERT INTO tasks (id, sprint_id, title, assignee, assigner, points, status, component, world_x, world_z, reviewer) VALUES
        ('task-1', 'sprint-1', 'Corporate Delaware C-Corp setup', 'bryan@cleanpuff.io', 'jq@cleanpuff.io', 60, 'established', 'manor', 0, 0, 'jq@cleanpuff.io'),
        ('task-2', 'sprint-1', 'Incorporate QQDAO LLC and license deal', 'bryan@cleanpuff.io', 'jq@cleanpuff.io', 60, 'established', 'manor', 0, 1, 'jq@cleanpuff.io'),
        ('task-3', 'sprint-1', 'Review Sevenfold agency contract proposal', 'bryan@cleanpuff.io', 'jq@cleanpuff.io', 30, 'established', 'tree', -1, 0, 'jq@cleanpuff.io'),
        ('task-4', 'sprint-1', 'Update characters folder on Drive', 'artem@cleanpuff.io', 'jq@cleanpuff.io', 30, 'established', 'tree', -1, -1, 'jq@cleanpuff.io'),
        ('task-5', 'sprint-1', 'Token site & Non-token site design', 'artem@cleanpuff.io', 'jq@cleanpuff.io', 45, 'established', 'cottage', -1, -2, 'jq@cleanpuff.io'),
        ('task-6', 'sprint-1', 'Rebuild character alignment chart banner', 'artem@cleanpuff.io', 'jq@cleanpuff.io', 15, 'established', 'sapling', 1, 0, 'jq@cleanpuff.io'),
        ('task-7', 'sprint-1', 'Create character duality art series', 'artem@cleanpuff.io', 'jq@cleanpuff.io', 30, 'established', 'stall', 1, 1, 'jq@cleanpuff.io'),
        ('task-8', 'sprint-1', 'Fill out NFT table for Crypto.com review', 'artem@cleanpuff.io', 'jq@cleanpuff.io', 30, 'established', 'cart', -2, 1, 'jq@cleanpuff.io'),
        ('task-9', 'sprint-1', 'Design end credits cards', 'artem@cleanpuff.io', 'jq@cleanpuff.io', 15, 'established', 'sapling', 2, -2, 'jq@cleanpuff.io'),
        ('task-10', 'sprint-1', 'Remove MEME language from new site', 'artem@cleanpuff.io', 'jq@cleanpuff.io', 30, 'established', 'tree', 2, -1, 'jq@cleanpuff.io'),
        ('task-11', 'sprint-1', 'Port website hosting to Hostinger from AWS', 'artem@cleanpuff.io', 'jq@cleanpuff.io', 30, 'under_review', 'stall', 2, 2, NULL),
        ('task-12', 'sprint-1', 'Review Bible v2/v3 document from writer', 'artem@cleanpuff.io', 'jq@cleanpuff.io', 15, 'cleared', NULL, NULL, NULL, NULL),
        ('task-13', 'sprint-1', 'Add character profiles page to website', 'artem@cleanpuff.io', 'jq@cleanpuff.io', 30, 'assigned', NULL, NULL, NULL, NULL),
        ('task-14', 'sprint-1', 'Setup Claude Code & Clawbot integration', 'ihor@cleanpuff.io', 'jq@cleanpuff.io', 30, 'established', 'tree', -1, 1, 'jq@cleanpuff.io'),
        ('task-15', 'sprint-1', 'Evaluate tech stack tools', 'ihor@cleanpuff.io', 'jq@cleanpuff.io', 15, 'established', 'crystals', -2, -2, 'jq@cleanpuff.io'),
        ('task-16', 'sprint-1', 'Analyze Xsolla collaboration & Coinbound SOW', 'ihor@cleanpuff.io', 'jq@cleanpuff.io', 30, 'established', 'fountain', -1, 2, 'jq@cleanpuff.io'),
        ('task-17', 'sprint-1', 'Setup unique token ticker & contract verification', 'ihor@cleanpuff.io', 'jq@cleanpuff.io', 15, 'established', 'lantern', -2, -1, 'jq@cleanpuff.io'),
        ('task-18', 'sprint-1', 'Rework Crypto.com utility & Drop sheet document', 'ihor@cleanpuff.io', 'jq@cleanpuff.io', 45, 'assigned', NULL, NULL, NULL, NULL),
        ('task-19', 'sprint-1', 'Migrate Telegram bot off AWS to Hostinger', 'ihor@cleanpuff.io', 'jq@cleanpuff.io', 30, 'assigned', NULL, NULL, NULL, NULL),
        ('task-20', 'sprint-1', 'Sir Gas ruins 4th of July animation short', 'rv@cleanpuff.io', 'jq@cleanpuff.io', 30, 'established', 'fountain', 0, -2, 'jq@cleanpuff.io'),
        ('task-21', 'sprint-1', 'Create first 16:9 animation video', 'rv@cleanpuff.io', 'jq@cleanpuff.io', 60, 'established', 'windmill', -1, -2, 'jq@cleanpuff.io'),
        ('task-22', 'sprint-1', 'Add end credits/cards to YouTube shorts', 'rv@cleanpuff.io', 'jq@cleanpuff.io', 30, 'established', 'fountain', -2, 0, 'jq@cleanpuff.io'),
        ('task-23', 'sprint-1', 'Create Princess Puff GRWM video concept', 'rv@cleanpuff.io', 'jq@cleanpuff.io', 30, 'cleared', NULL, NULL, NULL, NULL),
        ('task-24', 'sprint-1', 'Animate character reveals in funny noir style', 'rv@cleanpuff.io', 'jq@cleanpuff.io', 45, 'assigned', NULL, NULL, NULL, NULL),
        ('task-25', 'sprint-1', 'Integrate mini-games with in-game economy', 'rv@cleanpuff.io', 'jq@cleanpuff.io', 45, 'assigned', NULL, NULL, NULL, NULL),
        ('task-26', 'sprint-1', 'Audit and organize WhatsApp group structure', 'peter@cleanpuff.io', 'jq@cleanpuff.io', 15, 'established', 'sapling', -3, 0, 'jq@cleanpuff.io'),
        ('task-27', 'sprint-1', 'Design Princess degen influencer advent calendar', 'peter@cleanpuff.io', 'jq@cleanpuff.io', 30, 'established', 'stall', 2, 0, 'jq@cleanpuff.io'),
        ('task-28', 'sprint-1', 'Develop Marcom Launch Plan', 'peter@cleanpuff.io', 'jq@cleanpuff.io', 30, 'under_review', 'cart', -2, 2, NULL);
      `;
    }

    console.log("✅ Neon DB is initialized and ready!");
  } catch (err) {
    console.error("❌ Initialization error:", err);
  }
}

run();
