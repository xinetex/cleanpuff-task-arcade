import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    return res.status(500).json({ error: "DATABASE_URL environment variable is missing" });
  }

  const sql = neon(dbUrl);

  try {
    if (req.method === 'GET') {
      const { table } = req.query;

      if (table === 'sprints') {
        const sprints = await sql`SELECT * FROM sprints ORDER BY created_at DESC`;
        return res.status(200).json(sprints);
      } else if (table === 'team_members') {
        const members = await sql`SELECT * FROM team_members ORDER BY id ASC`;
        return res.status(200).json(members);
      } else if (table === 'agent_actions') {
        const actions = await sql`SELECT * FROM agent_actions ORDER BY created_at DESC`;
        return res.status(200).json(actions);
      } else {
        // Default to tasks table
        const tasks = await sql`SELECT * FROM tasks ORDER BY created_at ASC`;
        return res.status(200).json(tasks);
      }
    } else if (req.method === 'POST') {
      const { action, payload } = req.body || {};

      if (action === 'assign_task') {
        const { title, assignee_email, points, sprint_id, due } = payload;
        const id = `task-${Date.now()}`;
        await sql`
          INSERT INTO tasks (id, sprint_id, title, assignee, assigner, points, status, due)
          VALUES (${id}, ${sprint_id || 'sprint-1'}, ${title}, ${assignee_email}, 'jq@cleanpuff.io', ${points || 30}, 'assigned', ${due || ''})
        `;
        return res.status(200).json({ success: true, id });
      } else if (action === 'clear_task') {
        const { task_id, is_start } = payload;
        const status = is_start ? 'in_progress' : 'cleared';
        await sql`
          UPDATE tasks SET status = ${status}, updated_at = NOW() WHERE id = ${task_id}
        `;
        return res.status(200).json({ success: true });
      } else if (action === 'place_component') {
        const { task_id, component, world_x, world_z } = payload;
        await sql`
          UPDATE tasks SET status = 'under_review', component = ${component}, world_x = ${world_x}, world_z = ${world_z}, updated_at = NOW() WHERE id = ${task_id}
        `;
        return res.status(200).json({ success: true });
      } else if (action === 'review_task') {
        const { task_id, decision } = payload;
        const status = decision === 'approve' ? 'established' : 'demolished';
        await sql`
          UPDATE tasks SET status = ${status}, reviewer = 'jq@cleanpuff.io', updated_at = NOW() WHERE id = ${task_id}
        `;
        return res.status(200).json({ success: true });
      } else if (action === 'update_team_member') {
        const { id, name, email, color, role } = payload;
        await sql`
          UPDATE team_members SET name = ${name}, email = ${email}, color = ${color}, role = ${role} WHERE id = ${id}
        `;
        return res.status(200).json({ success: true });
      } else if (action === 'add_team_member') {
        const { name, email, color, role } = payload;
        const id = `user-${Date.now()}`;
        await sql`
          INSERT INTO team_members (id, name, email, color, role)
          VALUES (${id}, ${name}, ${email}, ${color || '#3fa3df'}, ${role || 'member'})
        `;
        return res.status(200).json({ success: true, id });
      } else {
        return res.status(400).json({ error: "Unknown action" });
      }
    } else {
      return res.status(455).json({ error: "Method not allowed" });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Database query error" });
  }
}
