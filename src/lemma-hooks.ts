import { useState, useEffect } from "react";
import {
  useAuth as realUseAuth,
  useRecords as realUseRecords,
  useFunctionRun as realUseFunctionRun,
  useConversationMessages as realUseConversationMessages,
} from "lemma-sdk/react";
import { isDemoMode } from "./lemma";

// Global Pub-Sub to trigger re-renders across multiple hooks of the same table
type Listener = () => void;
const listeners = new Set<Listener>();
function emitChange() {
  listeners.forEach((l) => l());
}

let store: {
  team_members: any[];
  sprints: any[];
  catalogue_items: any[];
  tasks: any[];
  agent_actions: any[];
} = loadStore();

function loadStore() {
  const data = typeof window !== "undefined" ? localStorage.getItem("task_arcade_mock_store_v4") : null;
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.tasks && parsed.tasks.length >= 20) {
        return parsed;
      }
    } catch (_) {}
  }
  
  const defaultStore = {
    team_members: [
      { id: "1", name: "J Q", email: "jq@cleanpuff.io", color: "#2f8d4d", role: "manager", created_at: "2026-07-15T00:00:00Z" },
      { id: "2", name: "Ihor", email: "ihor@cleanpuff.io", color: "#42be65", role: "member", created_at: "2026-07-15T00:00:00Z" },
      { id: "3", name: "Artem Kosenko", email: "artem@cleanpuff.io", color: "#4f90df", role: "member", created_at: "2026-07-15T00:00:00Z" },
      { id: "4", name: "RV", email: "rv@cleanpuff.io", color: "#a878e4", role: "manager", created_at: "2026-07-15T00:00:00Z" },
      { id: "5", name: "Bryan Shapiro", email: "bryan@cleanpuff.io", color: "#efad32", role: "member", created_at: "2026-07-15T00:00:00Z" },
      { id: "6", name: "Peter F.F. Bel", email: "peter@cleanpuff.io", color: "#e9627a", role: "member", created_at: "2026-07-15T00:00:00Z" },
    ],
    sprints: [
      { id: "sprint-1", name: "Launch Sprint", goal: 500, status: "active", starts_at: "2026-07-15T00:00:00Z", created_at: "2026-07-15T00:00:00Z" }
    ],
    catalogue_items: [
      { id: "1", kind: "sapling", label: "Puff Spout", tier: 15 },
      { id: "2", kind: "mushrooms", label: "Smog Scrubber", tier: 15 },
      { id: "3", kind: "crystals", label: "Gasling Trap", tier: 15 },
      { id: "4", kind: "lantern", label: "Purifying Beacon", tier: 15 },
      { id: "5", kind: "tree", label: "Great Puff Oak", tier: 30 },
      { id: "6", kind: "stall", label: "Mempool Refinery", tier: 30 },
      { id: "7", kind: "fountain", label: "Steward Beacon", tier: 30 },
      { id: "8", kind: "cart", label: "Shard Cart", tier: 30 },
      { id: "9", kind: "cottage", label: "Princess Sanctuary", tier: 45 },
      { id: "10", kind: "watermill", label: "Sir Gas Tombstone", tier: 45 },
      { id: "11", kind: "taco_stand", label: "Puff Outpost", tier: 45 },
      { id: "12", kind: "watchtower", label: "Validator Spire", tier: 45 },
      { id: "13", kind: "ship", label: "Airabella Airship", tier: 60 },
      { id: "14", kind: "castle_gate", label: "Great Gate", tier: 60 },
      { id: "15", kind: "windmill", label: "Smog Tower", tier: 60 },
      { id: "16", kind: "manor", label: "Founding House", tier: 60 },
      { id: "17", kind: "grand_fountain", label: "Great Purifier Citadel", tier: 60 },
    ],
    tasks: [
      // Bryan
      { id: "task-1", sprint_id: "sprint-1", title: "Corporate Delaware C-Corp setup", assignee: "bryan@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 60, status: "established", component: "manor", world_x: 0, world_z: 0, reviewer: "jq@cleanpuff.io", created_at: "2026-07-15T10:00:00Z", updated_at: "2026-07-16T14:00:00Z" },
      { id: "task-2", sprint_id: "sprint-1", title: "Incorporate QQDAO LLC and license deal", assignee: "bryan@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 60, status: "established", component: "manor", world_x: 0, world_z: 1, reviewer: "jq@cleanpuff.io", created_at: "2026-07-15T11:00:00Z", updated_at: "2026-07-16T16:00:00Z" },
      { id: "task-3", sprint_id: "sprint-1", title: "Review Sevenfold agency contract proposal", assignee: "bryan@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "established", component: "tree", world_x: -1, world_z: 0, reviewer: "jq@cleanpuff.io", created_at: "2026-07-16T09:00:00Z", updated_at: "2026-07-17T17:00:00Z" },
      
      // Artem
      { id: "task-4", sprint_id: "sprint-1", title: "Update characters folder on Drive", assignee: "artem@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "established", component: "tree", world_x: -1, world_z: -1, reviewer: "jq@cleanpuff.io", created_at: "2026-07-15T12:00:00Z", updated_at: "2026-07-16T12:00:00Z" },
      { id: "task-5", sprint_id: "sprint-1", title: "Token site & Non-token site design", assignee: "artem@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 45, status: "established", component: "cottage", world_x: -1, world_z: -2, reviewer: "jq@cleanpuff.io", created_at: "2026-07-16T14:00:00Z", updated_at: "2026-07-17T16:00:00Z" },
      { id: "task-6", sprint_id: "sprint-1", title: "Rebuild character alignment chart banner", assignee: "artem@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 15, status: "established", component: "sapling", world_x: 1, world_z: 0, reviewer: "jq@cleanpuff.io", created_at: "2026-07-17T08:00:00Z", updated_at: "2026-07-18T09:00:00Z" },
      { id: "task-7", sprint_id: "sprint-1", title: "Create character duality art series", assignee: "artem@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "established", component: "stall", world_x: 1, world_z: 1, reviewer: "jq@cleanpuff.io", created_at: "2026-07-18T08:00:00Z", updated_at: "2026-07-18T10:00:00Z" },
      { id: "task-8", sprint_id: "sprint-1", title: "Fill out NFT table for Crypto.com review", assignee: "artem@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "established", component: "cart", world_x: -2, world_z: 1, reviewer: "jq@cleanpuff.io", created_at: "2026-07-18T11:00:00Z", updated_at: "2026-07-18T12:00:00Z" },
      { id: "task-9", sprint_id: "sprint-1", title: "Design end credits cards", assignee: "artem@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 15, status: "established", component: "sapling", world_x: 2, world_z: -2, reviewer: "jq@cleanpuff.io", created_at: "2026-07-19T08:00:00Z", updated_at: "2026-07-19T09:00:00Z" },
      { id: "task-10", sprint_id: "sprint-1", title: "Remove MEME language from new site", assignee: "artem@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "established", component: "tree", world_x: 2, world_z: -1, reviewer: "jq@cleanpuff.io", created_at: "2026-07-19T09:30:00Z", updated_at: "2026-07-19T10:00:00Z" },
      { id: "task-11", sprint_id: "sprint-1", title: "Port website hosting to Hostinger from AWS", assignee: "artem@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "under_review", component: "stall", world_x: 2, world_z: 2, created_at: "2026-07-19T10:00:00Z" },
      { id: "task-12", sprint_id: "sprint-1", title: "Review Bible v2/v3 document from writer", assignee: "artem@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 15, status: "cleared", created_at: "2026-07-19T11:15:00Z" },
      { id: "task-13", sprint_id: "sprint-1", title: "Add character profiles page to website", assignee: "artem@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "assigned", created_at: "2026-07-19T11:20:00Z" },

      // Ihor
      { id: "task-14", sprint_id: "sprint-1", title: "Setup Claude Code & Clawbot integration", assignee: "ihor@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "established", component: "tree", world_x: -1, world_z: 1, reviewer: "jq@cleanpuff.io", created_at: "2026-07-15T12:00:00Z", updated_at: "2026-07-16T12:00:00Z" },
      { id: "task-15", sprint_id: "sprint-1", title: "Evaluate tech stack tools", assignee: "ihor@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 15, status: "established", component: "crystals", world_x: -2, world_z: -2, reviewer: "jq@cleanpuff.io", created_at: "2026-07-16T14:00:00Z", updated_at: "2026-07-17T16:00:00Z" },
      { id: "task-16", sprint_id: "sprint-1", title: "Analyze Xsolla collaboration & Coinbound SOW", assignee: "ihor@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "established", component: "fountain", world_x: -1, world_z: 2, reviewer: "jq@cleanpuff.io", created_at: "2026-07-18T08:00:00Z", updated_at: "2026-07-18T09:00:00Z" },
      { id: "task-17", sprint_id: "sprint-1", title: "Setup unique token ticker & contract verification", assignee: "ihor@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 15, status: "established", component: "lantern", world_x: -2, world_z: -1, reviewer: "jq@cleanpuff.io", created_at: "2026-07-18T10:00:00Z", updated_at: "2026-07-18T11:00:00Z" },
      { id: "task-18", sprint_id: "sprint-1", title: "Rework Crypto.com utility & Drop sheet document", assignee: "ihor@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 45, status: "assigned", created_at: "2026-07-19T11:00:00Z" },
      { id: "task-19", sprint_id: "sprint-1", title: "Migrate Telegram bot off AWS to Hostinger", assignee: "ihor@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "assigned", created_at: "2026-07-19T11:20:00Z" },

      // RV (Richard)
      { id: "task-20", sprint_id: "sprint-1", title: "Sir Gas ruins 4th of July animation short", assignee: "rv@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "established", component: "fountain", world_x: 0, world_z: -2, reviewer: "jq@cleanpuff.io", created_at: "2026-07-18T14:00:00Z", updated_at: "2026-07-18T16:00:00Z" },
      { id: "task-21", sprint_id: "sprint-1", title: "Create first 16:9 animation video", assignee: "rv@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 60, status: "established", component: "windmill", world_x: -1, world_z: -2, reviewer: "jq@cleanpuff.io", created_at: "2026-07-18T10:00:00Z", updated_at: "2026-07-18T12:00:00Z" },
      { id: "task-22", sprint_id: "sprint-1", title: "Add end credits/cards to YouTube shorts", assignee: "rv@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "established", component: "fountain", world_x: -2, world_z: 0, reviewer: "jq@cleanpuff.io", created_at: "2026-07-17T09:00:00Z", updated_at: "2026-07-17T17:00:00Z" },
      { id: "task-23", sprint_id: "sprint-1", title: "Create Princess Puff GRWM video concept", assignee: "rv@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "cleared", created_at: "2026-07-19T10:00:00Z" },
      { id: "task-24", sprint_id: "sprint-1", title: "Animate character reveals in funny noir style", assignee: "rv@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 45, status: "assigned", created_at: "2026-07-19T11:00:00Z" },
      { id: "task-25", sprint_id: "sprint-1", title: "Integrate mini-games with in-game economy", assignee: "rv@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 45, status: "assigned", created_at: "2026-07-19T11:10:00Z" },

      // Peter
      { id: "task-26", sprint_id: "sprint-1", title: "Audit and organize WhatsApp group structure", assignee: "peter@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 15, status: "established", component: "sapling", world_x: -3, world_z: 0, reviewer: "jq@cleanpuff.io", created_at: "2026-07-18T08:00:00Z", updated_at: "2026-07-18T09:00:00Z" },
      { id: "task-27", sprint_id: "sprint-1", title: "Design Princess degen influencer advent calendar", assignee: "peter@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "established", component: "stall", world_x: 2, world_z: 0, reviewer: "jq@cleanpuff.io", created_at: "2026-07-18T10:00:00Z", updated_at: "2026-07-18T11:00:00Z" },
      { id: "task-28", sprint_id: "sprint-1", title: "Develop Marcom Launch Plan", assignee: "peter@cleanpuff.io", assigner: "jq@cleanpuff.io", points: 30, status: "under_review", component: "cart", world_x: -2, world_z: 2, created_at: "2026-07-19T10:00:00Z" },
    ],
    agent_actions: [
      { id: "act-1", kind: "standup", payload: "A fresh morning standup!", result: "Good morning team! We are at 480 / 500 points for the Launch Sprint. Bryan completed C-Corp legal setups. Artem wrapped up character dualities art. Peter's Marcom plan and Artem's hostinger port-over are under review. Today, RV is wrapping up animation shorts.", created_at: "2026-07-19T09:00:00Z" },
      { id: "act-2", kind: "nudge", payload: "Stall check", result: "Nudged Ihor on 'Rework Crypto.com utility & Drop sheet document' — it is in 'assigned' status. Clawbot shows minor SIM card warnings.", created_at: "2026-07-18T10:00:00Z" }
    ]
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("task_arcade_mock_store_v4", JSON.stringify(defaultStore));
  }
  return defaultStore;
}

function saveStore() {
  if (typeof window !== "undefined") {
    localStorage.setItem("task_arcade_mock_store_v4", JSON.stringify(store));
  }
  emitChange();
}

// ── Hook: useAuth ──
function useMockAuth(client?: any): any {
  const email = (typeof window !== "undefined" && localStorage.getItem("task_arcade_mock_user")) || "rv@cleanpuff.io";
  const name = email === "jq@cleanpuff.io" ? "J Q" :
               email === "ihor@cleanpuff.io" ? "Ihor" :
               email === "artem@cleanpuff.io" ? "Artem Kosenko" :
               email === "rv@cleanpuff.io" ? "RV" :
               email === "bryan@cleanpuff.io" ? "Bryan Shapiro" :
               email === "peter@cleanpuff.io" ? "Peter F.F. Bel" : "Guest";

  return {
    status: "authenticated",
    user: {
      email,
      name,
    },
    isLoading: false,
    isAuthenticated: true,
    redirectToAuth: () => {},
  };
}

// ── Hook: useRecords ──
function useMockRecords<T>({ tableName }: { tableName: string }): any {
  const [records, setRecords] = useState<T[]>(() => (store as any)[tableName] || []);

  useEffect(() => {
    const handleUpdate = () => {
      setRecords((store as any)[tableName] || []);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, [tableName]);

  return {
    records,
    total: records.length,
    nextPageToken: null,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    refresh: async () => records,
    loadMore: async () => records,
  };
}

// ── Hook: useFunctionRun ──
function useMockFunctionRun({ functionName }: { functionName: string }): any {
  const [isLoading, setIsLoading] = useState(false);

  const start = async (args: any) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    let resultRecord = { id: `run-${Date.now()}` };

    if (functionName === "review_task") {
      const { task_id, decision } = args;
      const status = decision === "approve" ? "established" : "demolished";
      store.tasks = store.tasks.map((t) =>
        t.id === task_id ? { ...t, status, reviewer: "jq@cleanpuff.io", updated_at: new Date().toISOString() } : t
      );
      saveStore();
    } else if (functionName === "place_component") {
      const { task_id, component, world_x, world_z } = args;
      store.tasks = store.tasks.map((t) =>
        t.id === task_id
          ? { ...t, status: "under_review", component, world_x, world_z, updated_at: new Date().toISOString() }
          : t
      );
      saveStore();
    } else if (functionName === "clear_task") {
      const { task_id, action } = args;
      const newStatus = action === "start" ? "in_progress" : "cleared";
      store.tasks = store.tasks.map((t) =>
        t.id === task_id ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
      );
      saveStore();
    } else if (functionName === "assign_task") {
      const { title, assignee_email, points, sprint_id, due } = args;
      const newTask = {
        id: `task-${Date.now()}`,
        title,
        assignee: assignee_email,
        assigner: "jq@cleanpuff.io",
        points,
        source: "slack",
        sprint_id,
        status: "assigned",
        due: due ?? "",
        created_at: new Date().toISOString(),
      };
      store.tasks.push(newTask);
      saveStore();
    } else if (functionName === "update_team_member") {
      const { id, name, email, color, role } = args;
      store.team_members = store.team_members.map((m) =>
        m.id === id ? { ...m, name, email, color: color || m.color, role: role || m.role } : m
      );
      saveStore();
    } else if (functionName === "add_team_member") {
      const { name, email, color, role } = args;
      const newMember = {
        id: `user-${Date.now()}`,
        name,
        email,
        color: color || "#3fa3df",
        role: role || "member",
        created_at: new Date().toISOString(),
      };
      store.team_members.push(newMember);
      saveStore();
    }
    
    setIsLoading(false);
    return resultRecord;
  };

  return {
    output: null,
    finalOutput: null,
    isFinished: true,
    start,
    listRuns: async () => [],
    isLoading,
  };
}

// ── Hook: useConversationMessages ──
function useMockConversationMessages({ agentName }: { agentName: string }): any {
  const [messages, setMessages] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    // Reset conversation log for the new team theme
    const saved = localStorage.getItem("task_arcade_mock_chat_puffs_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [
      {
        id: "msg-1",
        role: "assistant",
        kind: "text",
        text: "Greetings! I am the Quartermaster. Ask me anything about the sprint, team tasks, or ask me to nudge Artem, Ihor, RV, or Peter!",
        created_at: new Date().toISOString(),
      },
    ];
  });
  const [isRunning, setIsRunning] = useState(false);

  const saveMessages = (msgs: any[]) => {
    setMessages(msgs);
    if (typeof window !== "undefined") {
      localStorage.setItem("task_arcade_mock_chat_puffs_v2", JSON.stringify(msgs));
    }
  };

  const sendMessage = async (text: string) => {
    const userMsg = {
      id: `msg-${Date.now()}`,
      role: "user",
      kind: "text",
      text,
      created_at: new Date().toISOString(),
    };
    const newMsgs = [...messages, userMsg];
    saveMessages(newMsgs);

    setIsRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    let reply = "";
    const query = text.toLowerCase();
    
    if (query.includes("hello") || query.includes("hi") || query.includes("hey") || query.includes("who are you")) {
      reply = "👋 Greetings! I am the CleanPuff Quartermaster. I manage sprint tasks, track building progress, and help your team build the 3D Task Arcade realm.\n\n" +
        "Try asking me to:\n" +
        "- **\"status\"** — View the overall task & building breakdown\n" +
        "- **\"assign [task] to [name]\"** — Assign a task to RV, Artem, Ihor, Bryan, or Peter\n" +
        "- **\"standup\"** — Run a morning standup recap\n" +
        "- **\"nudge\"** — Send a reminder to an active team member";
    } else if (query.includes("pending") || query.includes("approve") || query.includes("review")) {
      const underReview = store.tasks.filter((t) => t.status === "under_review");
      if (underReview.length > 0) {
        reply = `📋 ${underReview.length} task(s) pending review:\n` +
          underReview.map((t) => `- "${t.title}" by ${t.assignee.split("@")[0]}`).join("\n") +
          `\n\nGo to the Review tab to approve or demolish them!`;
      } else {
        reply = "✅ No tasks are currently pending review. The world looks clean and established!";
      }
    } else if (query.includes("status") || query.includes("overview") || query.includes("board") || query.includes("tasks")) {
      const assigned = store.tasks.filter((t) => t.status === "assigned");
      const inProgress = store.tasks.filter((t) => t.status === "in_progress");
      const underReview = store.tasks.filter((t) => t.status === "under_review");
      const established = store.tasks.filter((t) => t.status === "established");
      const cleared = store.tasks.filter((t) => t.status === "cleared");
      reply = `📊 Board Overview:\n` +
        `- 📥 Assigned: ${assigned.length}\n` +
        `- 🔨 In Progress: ${inProgress.length}\n` +
        `- ✅ Cleared (ready to place): ${cleared.length}\n` +
        `- 🏗️ Under Review: ${underReview.length}\n` +
        `- 🏰 Established: ${established.length}\n` +
        `- Total: ${store.tasks.length} tasks`;
      if (inProgress.length > 0) {
        reply += `\n\nCurrently being worked on:\n` +
          inProgress.map((t) => `- "${t.title}" by ${t.assignee.split("@")[0]}`).join("\n");
      }
    } else if (query.includes("nudge") || query.includes("remind")) {
      const nudgeable = store.tasks.filter((t) => t.status === "assigned" || t.status === "in_progress");
      if (nudgeable.length > 0) {
        const randomTask = nudgeable[Math.floor(Math.random() * nudgeable.length)];
        reply = `📢 Nudged ${randomTask.assignee.split("@")[0]} on their task "${randomTask.title}"! I will post a reminder in the logs.`;
        
        const newAction = {
          id: `act-${Date.now()}`,
          kind: "nudge",
          payload: `Nudged on "${randomTask.title}"`,
          result: `Reminded ${randomTask.assignee.split("@")[0]} about task "${randomTask.title}".`,
          created_at: new Date().toISOString(),
        };
        store.agent_actions.unshift(newAction);
        saveStore();
      } else {
        reply = "Everyone is caught up! No one to nudge.";
      }
    } else if (query.includes("standup") || query.includes("today")) {
      const inProg = store.tasks.filter(t => t.status === "in_progress");
      const todo = store.tasks.filter(t => t.status === "assigned");
      reply = `☀️ Standup recap:\n` +
        `- Sprint: ${store.sprints[0]?.name ?? "None"}\n` +
        `- In progress: ${inProg.length} task(s)\n` +
        `- Todo (assigned): ${todo.length} task(s)`;
      if (inProg.length > 0) {
        reply += `\n\nIn progress right now:\n` + inProg.map(t => `- ${t.assignee.split("@")[0]}: "${t.title}"`).join("\n");
      }
      
      const newAction = {
        id: `act-${Date.now()}`,
        kind: "standup",
        payload: "Manual Standup Triggered",
        result: reply,
        created_at: new Date().toISOString(),
      };
      store.agent_actions.unshift(newAction);
      saveStore();
    } else if (query.includes("assign") || query.includes("create task") || query.includes("add task")) {
      const memberNames: Record<string, string> = {
        "jq": "jq@cleanpuff.io", "joe": "jq@cleanpuff.io", "j q": "jq@cleanpuff.io",
        "ihor": "ihor@cleanpuff.io",
        "artem": "artem@cleanpuff.io",
        "rv": "rv@cleanpuff.io", "richard": "rv@cleanpuff.io",
        "bryan": "bryan@cleanpuff.io",
        "peter": "peter@cleanpuff.io",
      };
      let foundMember = "";
      let foundName = "";
      for (const [name, email] of Object.entries(memberNames)) {
        if (query.includes(name)) {
          foundMember = email;
          foundName = name;
          break;
        }
      }
      if (foundMember) {
        let taskTitle = text.replace(/assign|create task|add task/gi, "").replace(new RegExp(`\\bto\\b`, "i"), "").replace(new RegExp(foundName, "gi"), "").trim();
        if (taskTitle.length < 3) {
          taskTitle = "New task from Quartermaster";
        }
        const newTask = {
          id: `task-${Date.now()}`,
          sprint_id: "sprint-1",
          title: taskTitle,
          assignee: foundMember,
          assigner: "jq@cleanpuff.io",
          points: 30,
          status: "assigned",
          created_at: new Date().toISOString(),
        };
        store.tasks.push(newTask);
        saveStore();
        reply = `✅ Task assigned! Created "${taskTitle}" for ${foundName} (30 pts).`;
      } else {
        reply = `To assign a task, specify a team member name! E.g. "assign [task] to RV" or "assign [task] to Artem".\n\nTeam: Artem, Ihor, RV, Bryan, Peter, JQ`;
      }
    } else if (query.includes("rv") || query.includes("artem") || query.includes("ihor") || query.includes("bryan") || query.includes("peter")) {
      const match = ["rv", "artem", "ihor", "bryan", "peter"].find(m => query.includes(m));
      const memberEmail = `${match}@cleanpuff.io`;
      const memberTasks = store.tasks.filter(t => t.assignee === memberEmail);
      reply = `👤 **${match?.toUpperCase()}'s Active Board:**\n` +
        `- Total Tasks: ${memberTasks.length}\n` +
        `- Established Builds: ${memberTasks.filter(t => t.status === "established").length}\n` +
        `- Active/Assigned: ${memberTasks.filter(t => t.status === "assigned" || t.status === "in_progress").length}`;
    } else if (query.includes("help")) {
      reply = `🤖 I'm the Quartermaster! Here's what I can do:\n\n` +
        `- **"status"** or **"overview"** — See the full board breakdown\n` +
        `- **"assign [task] to [name]"** — Assign a task to a team member\n` +
        `- **"standup"** — Run a standup recap\n` +
        `- **"nudge"** — Remind someone about their task\n` +
        `- **"pending"** — See tasks waiting for review\n` +
        `- **"help"** — Show this message`;
    } else {
      reply = `I've logged your message: "${text}".\n\n` +
        `I am your active CleanPuff Quartermaster! Ask me to:\n` +
        `- **"assign [task] to [name]"** (e.g. *assign video animation to RV*)\n` +
        `- **"status"** or **"overview"** (to see the board)\n` +
        `- **"standup"** (to summarize active work)`;
    }

    const assistantMsg = {
      id: `msg-${Date.now() + 1}`,
      role: "assistant",
      kind: "text",
      text: reply,
      created_at: new Date().toISOString(),
    };
    saveMessages([...newMsgs, assistantMsg]);
    setIsRunning(false);
    return { id: "convo-res" };
  };

  const createConversation = async () => ({ id: "demo-convo" });

  return {
    conversationId: "demo-convo",
    conversation: null,
    messages,
    status: "idle",
    isRunning,
    isStreaming: false,
    isLoading: false,
    isLoadingOlder: false,
    hasOlderMessages: false,
    nextPageToken: null,
    streamingText: "",
    latestAssistantMessage: messages[messages.length - 1] || null,
    output: null,
    outputText: "",
    finalOutput: null,
    finalOutputText: "",
    error: null,
    refresh: async () => messages,
    loadOlder: async () => [],
    sendMessage,
    resume: async () => {},
    resumeIfRunning: async () => false,
    stop: async () => {},
    cancel: () => {},
    clearMessages: () => {},
    createConversation,
  };
}

// ── Bind based on Mode with matching type signatures ──
export const useAuth = (isDemoMode ? useMockAuth : realUseAuth) as typeof realUseAuth;
export const useRecords = (isDemoMode ? useMockRecords : realUseRecords) as typeof realUseRecords;
export const useFunctionRun = (isDemoMode ? useMockFunctionRun : realUseFunctionRun) as typeof realUseFunctionRun;
export const useConversationMessages = (isDemoMode ? useMockConversationMessages : realUseConversationMessages) as typeof realUseConversationMessages;
