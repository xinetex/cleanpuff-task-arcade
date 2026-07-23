import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, OrthographicCamera, Text, useGLTF } from "@react-three/drei";
import {
  AtSign,
  Building2,
  Castle,
  Check,
  CheckCircle2,
  ChevronLeft,
  Circle,
  ClipboardList,
  Clock,
  Crown,
  Droplets,
  Film,
  Gem,
  Hammer,
  Hash,
  Layers,
  Play,
  Plus,
  Send,
  Ship,
  Sparkles,
  Store,
  Trees,
  Trophy,
  Users,
  Wind,
  X,
  ZoomIn,
  ZoomOut,
  Menu,
  Sun,
  Moon,
  Server, Database, HardDrive, Archive, Lock, Activity, Video, Image, Music, FileText, Pin, Zap, Cloud, Key,
  RefreshCw,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useAuth, useFunctionRun, useRecords } from "./lemma-hooks";
import VisualProductDoc from "./VisualProductDoc";
import "./social/social.css";
import Dashboard from "./social/pages/Dashboard";
import Drafts from "./social/pages/Drafts";
import Scheduled from "./social/pages/Scheduled";
import History from "./social/pages/History";
import Generate from "./social/pages/Generate";
import Trends from "./social/pages/Trends";
import Toolkit from "./social/pages/Toolkit";
import Calendar from "./social/pages/Calendar";
import Playbook from "./social/pages/Playbook";
import Swarm from "./social/pages/Swarm";
import { getPostsByStatus, seedDemoData } from "./social/lib/store";
import {
  client,
  gravatarUrl,
  isDemoMode,
  type TaskRow,
  type SprintRow,
  type TeamMemberRow,
  type CatalogueItemRow,
  type TaskStatus as TaskStatusType,
  type MemberRole,
} from "./lemma";
import { CinematicDirector, type CineControls, type CineScript } from "./cinematic";
import { QuartermasterPage } from "./QuartermasterPage";
import { DEMOS } from "./demos";

// ---------------------------------------------------------------------------
// MODEL
// ---------------------------------------------------------------------------

type Tier = 15 | 30 | 45 | 60;
type ComponentKind =
  | "sapling" | "mushrooms" | "crystals" | "lantern"
  | "tree" | "stall" | "fountain" | "cart"
  | "cottage" | "watermill" | "taco_stand" | "watchtower"
  | "ship" | "castle_gate" | "windmill" | "manor" | "grand_fountain";
type PlacementState = "under_review" | "established" | "demolished";
type AppTab = "world" | "tasks" | "review" | "growth" | "vault" | "social" | "all" | "catalog" | "kits" | "stats" | "roadmap" | "demos" | "quartermaster";
type TaskSource = "slack" | "email" | "telegram";
type TaskStatus = "assigned" | "in_progress" | "cleared" | "under_review" | "established" | "demolished";

type Member = { name: string; email: string; color: string; points: number };
type CatalogueItem = { kind: ComponentKind; label: string; tier: Tier };
type Placement = {
  id: string;
  task: string;
  builder: string;
  builderEmail: string;
  item: CatalogueItem;
  x: number;
  z: number;
  state: PlacementState;
  submitted: string;
};
type Role = "manager" | "member" | "viewer" | "CMO" | "Social Media Manager";
type MockTask = {
  id: string;
  title: string;
  assignee: string;
  assigner: string;
  tier: Tier;
  source: TaskSource;
  sprintId: string;
  status: TaskStatus;
  due: string;
  component?: string | null;
  worldX?: number | null;
  worldZ?: number | null;
};

const TIER_COLOR: Record<Tier, string> = { 15: "#7fc26b", 30: "#3fa3df", 45: "#f0a92e", 60: "#8e6fd6" };
const TIER_LABEL: Record<Tier, string> = { 15: "Quick win", 30: "Half-day", 45: "Deliverable", 60: "Milestone" };

const SOURCE_CFG: Record<TaskSource, { label: string; bg: string; icon: React.ReactNode }> = {
  slack:    { label: "Slack",    bg: "#4a154b", icon: <Hash size={10} /> },
  email:    { label: "Email",    bg: "#3fa3df", icon: <AtSign size={10} /> },
  telegram: { label: "Telegram", bg: "#2aabee", icon: <Send size={10} /> },
};

const CATALOGUE: CatalogueItem[] = [
  { kind: "sapling",     label: "Puff Spout",             tier: 15 },
  { kind: "mushrooms",   label: "Smog Scrubber",           tier: 15 },
  { kind: "crystals",    label: "Gasling Trap",            tier: 15 },
  { kind: "lantern",     label: "Purifying Beacon",        tier: 15 },
  { kind: "tree",        label: "Great Puff Oak",          tier: 30 },
  { kind: "stall",       label: "Mempool Refinery",        tier: 30 },
  { kind: "fountain",    label: "Steward Beacon",          tier: 30 },
  { kind: "cart",        label: "Shard Cart",              tier: 30 },
  { kind: "cottage",     label: "Princess Sanctuary",      tier: 45 },
  { kind: "watermill",   label: "Sir Gas Tombstone",       tier: 45 },
  { kind: "taco_stand",  label: "Puff Outpost",            tier: 45 },
  { kind: "watchtower",  label: "Validator Spire",         tier: 45 },
  { kind: "ship",        label: "Airabella Airship",       tier: 60 },
  { kind: "castle_gate", label: "Great Gate",              tier: 60 },
  { kind: "windmill",    label: "Smog Tower",              tier: 60 },
  { kind: "manor",       label: "Founding House",          tier: 60 },
  { kind: "grand_fountain", label: "Great Purifier Citadel", tier: 60 },
];

const COMPONENT_BY_KIND: Record<string, CatalogueItem> = Object.fromEntries(CATALOGUE.map((c) => [c.kind, c]));
const itemForKind = (kind: string): CatalogueItem => COMPONENT_BY_KIND[kind] ?? CATALOGUE.find((c) => c.kind === "tree")!;

const ROSTER_FALLBACK: { name: string; email: string; color: string; role: Role }[] = [
  { name: "J Q", email: "jq@cleanpuff.io",  color: "#2f8d4d", role: "manager" },
  { name: "Ihor",  email: "ihor@cleanpuff.io",  color: "#42be65", role: "member"  },
  { name: "Artem Kosenko", email: "artem@cleanpuff.io", color: "#4f90df", role: "member"  },
  { name: "RV",  email: "rv@cleanpuff.io",  color: "#a878e4", role: "member"  },
  { name: "Bryan Shapiro", email: "bryan@cleanpuff.io", color: "#efad32", role: "member"  },
  { name: "Peter F.F. Bel",  email: "peter@cleanpuff.io",  color: "#e9627a", role: "CMO" },
];

const FALLBACK_COLORS = ["#5bb0a6", "#d98a5b", "#c75b7a", "#7c9a3e", "#3f9ec0"];
const JETTY_WORKSPACE_URL =
  import.meta.env.VITE_JETTYTHUNDER_WORKSPACE_URL ||
  "https://jettythunder.app/dashboard/studio";
const JETTY_PROJECT_URL =
  import.meta.env.VITE_JETTYTHUNDER_PROJECT_URL ||
  JETTY_WORKSPACE_URL;

function colorForBuilder(email: string, teamMembers?: TeamMemberRow[]): string {
  const known = teamMembers?.find((m) => m.email === email);
  if (known?.color) return known.color;
  const fb = ROSTER_FALLBACK.find((m) => m.email === email);
  if (fb) return fb.color;
  let h = 0;
  for (let i = 0; i < email.length; i += 1) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return FALLBACK_COLORS[h % FALLBACK_COLORS.length];
}

function nameForEmail(email: string, teamMembers?: TeamMemberRow[]): string {
  const known = teamMembers?.find((m) => m.email === email);
  if (known?.name) return known.name;
  const fb = ROSTER_FALLBACK.find((m) => m.email === email);
  if (fb) return fb.name;
  return email.split("@")[0];
}

const initialOf = (name: string): string => (name.trim()[0] ?? "?").toUpperCase();

function submittedLabel(iso?: string): string {
  if (!iso) return "just now";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "recently";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

function taskToPlacement(t: MockTask, teamMembers?: TeamMemberRow[]): Placement {
  return {
    id: t.id,
    task: t.title,
    builder: nameForEmail(t.assignee, teamMembers),
    builderEmail: t.assignee,
    item: itemForKind(t.component ?? "tree"),
    x: t.worldX ?? 0,
    z: t.worldZ ?? 0,
    state: t.status as PlacementState,
    submitted: submittedLabel(undefined),
  };
}

function rowToTask(r: TaskRow): MockTask {
  return {
    id: r.id,
    title: r.title,
    assignee: r.assignee,
    assigner: r.assigner,
    tier: r.points as Tier,
    source: (r.source ?? "slack") as TaskSource,
    sprintId: r.sprint_id,
    status: r.status as TaskStatus,
    due: r.due ?? "",
    component: r.component,
    worldX: r.world_x,
    worldZ: r.world_z,
  };
}

// Deterministic placements for the GSAP cinematic (no pod writes; replays identically).
function cineSeed(): Placement[] {
  return [
    { id: "c-est-1", task: "Ship the onboarding flow", builder: "Asha",  builderEmail: "asha@example.com",  item: itemForKind("cottage"),     x: -1, z: 0,  state: "established",  submitted: "2h ago" },
    { id: "c-est-2", task: "Polish the review queue",  builder: "Kabir", builderEmail: "kabir@example.com", item: itemForKind("crystals"),    x: 1,  z: 1,  state: "established",  submitted: "1h ago" },
    { id: "c-est-3", task: "Design the recap screen",  builder: "Neha",  builderEmail: "neha@example.com",  item: itemForKind("fountain"),    x: 0,  z: 2,  state: "established",  submitted: "3h ago" },
    { id: "c-rej",   task: "Out-of-scope experiment",  builder: "Rohan", builderEmail: "rohan@example.com", item: itemForKind("castle_gate"), x: 2,  z: -1, state: "under_review", submitted: "just now" },
  ];
}
const CINE_HERO: Placement = {
  id: "c-hero", task: "Prototype the next screen", builder: "Manager", builderEmail: "manager@example.com",
  item: itemForKind("watermill"), x: 0, z: -1, state: "under_review", submitted: "just now",
};

// ---------------------------------------------------------------------------
// 3D primitives + kit loader
// ---------------------------------------------------------------------------

const TILE_GAP = 1.72;
const NO_RAYCAST: THREE.Object3D["raycast"] = () => {};
function tilePosition(x: number, z: number, y = 0.32): [number, number, number] {
  return [x * TILE_GAP, y, z * TILE_GAP];
}

const ASSET_BASE = import.meta.env.BASE_URL;

// Sound bank for cinematic SFX cues, keyed by the `sfx` name used in demos.ts.
const SFX_URLS: Record<string, string> = {
  click: `${ASSET_BASE}sounds/click.mp3`,
  shimmer: `${ASSET_BASE}sounds/shimmer.mp3`,
  // Bright chime on approve — reuses the existing sparkle until a dedicated file lands.
  chime: `${ASSET_BASE}sounds/shimmer.mp3`,
  // The cues below point at files not yet in public/sounds/ — they no-op silently
  // (Audio load fails, play() rejects) until you drop the mp3s in.
  whoosh: `${ASSET_BASE}sounds/whoosh.mp3`,
  crumble: `${ASSET_BASE}sounds/crumble.mp3`,
  swell: `${ASSET_BASE}sounds/swell.mp3`,
};
const kit = {
  fantasy: `${ASSET_BASE}kits/fantasy-town`,
  urban:   `${ASSET_BASE}kits/urban-city`,
  pirate:  `${ASSET_BASE}kits/pirate`,
  cars:    `${ASSET_BASE}kits/cars`,
};

type KitPlacement = {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

function KitModel({ url, position, rotation = [0, 0, 0], scale = 1 }: KitPlacement) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene]);
  return <primitive object={clone} position={position} rotation={rotation} scale={scale} />;
}

const ambientScenery: KitPlacement[] = [
  { url: `${kit.fantasy}/road.glb`,                  position: tilePosition(-3, -2, 0.32), rotation: [0, Math.PI / 2, 0], scale: 0.86 },
  { url: `${kit.fantasy}/road.glb`,                  position: tilePosition(-2, -2, 0.32), rotation: [0, Math.PI / 2, 0], scale: 0.86 },
  { url: `${kit.fantasy}/road-bend.glb`,              position: tilePosition(-1, -2, 0.32), rotation: [0, Math.PI, 0],     scale: 0.86 },
  { url: `${kit.urban}/path-long.glb`,                position: tilePosition(0, -2, 0.34),  rotation: [0, Math.PI / 2, 0], scale: 0.9  },
  { url: `${kit.fantasy}/tree-high.glb`,              position: tilePosition(-5, 1, 0.32),  rotation: [0, 0.1, 0],         scale: 0.78 },
  { url: `${kit.fantasy}/tree-high-round.glb`,        position: tilePosition(-5, 2, 0.32),  rotation: [0, -0.4, 0],        scale: 0.72 },
  { url: `${kit.fantasy}/tree.glb`,                   position: tilePosition(-4, 3, 0.32),  rotation: [0, 0.22, 0],        scale: 0.78 },
  { url: `${kit.urban}/tree-small.glb`,               position: tilePosition(1, 4, 0.32),   rotation: [0, 0.28, 0],        scale: 0.85 },
  { url: `${kit.pirate}/palm-detailed-straight.glb`,  position: tilePosition(5, 2, 0.12),   rotation: [0, -0.2, 0],        scale: 0.82 },
  { url: `${kit.urban}/planter.glb`,                  position: tilePosition(-2, 3, 0.34),  rotation: [0, 0.4, 0],         scale: 0.78 },
  { url: `${kit.fantasy}/hedge-large.glb`,            position: tilePosition(-2, 4, 0.34),  rotation: [0, Math.PI / 2, 0], scale: 0.8  },
  { url: `${kit.fantasy}/banner-red.glb`,             position: tilePosition(1, -3, 0.34),  rotation: [0, -0.3, 0],        scale: 0.74 },
  { url: `${kit.cars}/delivery.glb`,                  position: tilePosition(-3, 1, 0.34),  rotation: [0, -0.22, 0],       scale: 0.64 },
  { url: `${kit.cars}/taxi.glb`,                      position: tilePosition(-2, -3, 0.34), rotation: [0, 0.2, 0],         scale: 0.62 },
  { url: `${kit.cars}/van.glb`,                       position: tilePosition(-4, -2, 0.34), rotation: [0, Math.PI / 2.25, 0], scale: 0.6 },
];

const PRELOAD_URLS = Array.from(
  new Set([
    ...ambientScenery.map((p) => p.url),
    `${kit.pirate}/castle-gate.glb`,
    `${kit.fantasy}/fountain-round.glb`,
    `${kit.fantasy}/windmill.glb`,
    `${kit.fantasy}/watermill.glb`,
    `${kit.fantasy}/stall-red.glb`,
    `${kit.fantasy}/cart-high.glb`,
    `${kit.fantasy}/lantern.glb`,
    `${kit.urban}/building-type-s.glb`,
    `${kit.pirate}/ship-pirate-small.glb`,
    `${kit.pirate}/tower-watch.glb`,
    `${kit.pirate}/tower-complete-large.glb`,
  ]),
);

function AmbientScenery() {
  return (
    <group>
      {ambientScenery.map((placement, index) => (
        <KitModel key={`${placement.url}-${index}`} {...placement} />
      ))}
    </group>
  );
}

function TerrainBlock({ x, z, color, height = 0.34 }: { x: number; z: number; color: string; height?: number }) {
  return (
    <group position={tilePosition(x, z, height / 2 - 0.1)}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, height, 1.5]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
      <mesh position={[0, height / 2 + 0.006, 0]} receiveShadow>
        <boxGeometry args={[1.47, 0.025, 1.47]} />
        <meshStandardMaterial color={new THREE.Color(color).offsetHSL(0, 0.06, 0.08)} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Trunk({ position = [0, 0.34, 0] as [number, number, number], scale = 1 }: { position?: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <cylinderGeometry args={[0.1, 0.15, 0.68, 10]} />
      <meshStandardMaterial color="#8f5b32" roughness={0.78} />
    </mesh>
  );
}

function CanopyTree({ color = "#48b85d" }: { color?: string }) {
  return (
    <group>
      <Trunk />
      <mesh position={[0, 0.98, 0]} castShadow>
        <sphereGeometry args={[0.46, 18, 14]} />
        <meshStandardMaterial color={color} roughness={0.76} />
      </mesh>
      <mesh position={[-0.28, 0.82, 0.12]} castShadow>
        <sphereGeometry args={[0.3, 14, 10]} />
        <meshStandardMaterial color={new THREE.Color(color).offsetHSL(0.03, 0.05, 0.03)} roughness={0.76} />
      </mesh>
      <mesh position={[0.28, 0.84, -0.08]} castShadow>
        <sphereGeometry args={[0.3, 14, 10]} />
        <meshStandardMaterial color={new THREE.Color(color).offsetHSL(-0.04, 0.04, 0.02)} roughness={0.76} />
      </mesh>
    </group>
  );
}

function Cottage() {
  return (
    <group>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.95, 0.76, 0.86]} />
        <meshStandardMaterial color="#f5d69a" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.88, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.78, 0.62, 4]} />
        <meshStandardMaterial color="#d85b45" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.2, -0.44]} castShadow>
        <boxGeometry args={[0.26, 0.4, 0.04]} />
        <meshStandardMaterial color="#7f5b3d" roughness={0.86} />
      </mesh>
      <mesh position={[-0.31, 0.45, -0.45]} castShadow>
        <boxGeometry args={[0.2, 0.18, 0.035]} />
        <meshStandardMaterial color="#7bc3d6" roughness={0.4} />
      </mesh>
      <mesh position={[0.31, 0.45, -0.45]} castShadow>
        <boxGeometry args={[0.2, 0.18, 0.035]} />
        <meshStandardMaterial color="#7bc3d6" roughness={0.4} />
      </mesh>
    </group>
  );
}

function TacoStand() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.0, 0.5, 0.72]} />
        <meshStandardMaterial color="#ffe1a4" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.62, -0.03]} castShadow>
        <boxGeometry args={[1.16, 0.16, 0.82]} />
        <meshStandardMaterial color="#ef5650" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <boxGeometry args={[1.24, 0.1, 0.9]} />
        <meshStandardMaterial color="#ef5650" roughness={0.78} />
      </mesh>
    </group>
  );
}

function Fountain() {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.58, 0.3, 18]} />
        <meshStandardMaterial color="#cfcec1" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.33, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.38, 0.12, 18]} />
        <meshStandardMaterial color="#69c7dc" roughness={0.44} transparent opacity={0.86} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.58, 12]} />
        <meshStandardMaterial color="#b8b8ad" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.94, 0]} castShadow>
        <sphereGeometry args={[0.16, 14, 10]} />
        <meshStandardMaterial color="#6ed8ed" transparent opacity={0.88} />
      </mesh>
    </group>
  );
}

function CrystalRocks() {
  return (
    <group>
      {(
        [
          [-0.22, 0.28, 0.08, 0.26, "#59d6dc"],
          [0.1, 0.38, -0.08, 0.32, "#7c6ee6"],
          [0.32, 0.22, 0.18, 0.22, "#72e3a3"],
        ] as [number, number, number, number, string][]
      ).map(([x, y, z, scale, color], index) => (
        <mesh key={index} position={[x, y, z]} scale={scale} castShadow>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={color} roughness={0.42} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
}

function MushroomPatch() {
  return (
    <group>
      {(
        [
          [-0.26, 0.18, 0.1, 0.24],
          [0.0, 0.23, -0.1, 0.28],
          [0.27, 0.16, 0.16, 0.2],
        ] as [number, number, number, number][]
      ).map(([x, y, z, scale], index) => (
        <group key={index} position={[x, 0, z]} scale={scale}>
          <mesh position={[0, y, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.12, 0.58, 8]} />
            <meshStandardMaterial color="#f4d7a8" roughness={0.88} />
          </mesh>
          <mesh position={[0, y + 0.32, 0]} castShadow>
            <sphereGeometry args={[0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={index === 1 ? "#e85764" : "#f2a33d"} roughness={0.82} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function TileSelector({ occupied, onSelect }: {
  occupied: Set<string>;
  onSelect: (x: number, z: number) => void;
}) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const validTiles = DEFAULT_TILES.filter(([x, z]) => !occupied.has(`${x},${z}`));
  useFrame((state) => {
    const opacity = 0.22 + Math.sin(state.clock.elapsedTime * 2.8) * 0.1;
    meshRefs.current.forEach((m) => {
      if (m?.material instanceof THREE.MeshStandardMaterial) {
        m.material.opacity = opacity;
      }
    });
  });
  return (
    <group>
      {validTiles.map(([x, z], i) => (
        <mesh
          key={`ts-${x}:${z}`}
          ref={(el) => { meshRefs.current[i] = el; }}
          position={tilePosition(x, z, 0.47)}
          onClick={(e) => { e.stopPropagation(); onSelect(x, z); }}
          onPointerOver={() => { document.body.style.cursor = "cell"; }}
          onPointerOut={() => { document.body.style.cursor = "auto"; }}
        >
          <boxGeometry args={[1.42, 0.06, 1.42]} />
          <meshStandardMaterial
            color="#7dd8ff"
            emissive="#4fbfff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.28}
          />
        </mesh>
      ))}
    </group>
  );
}

function Rubble() {
  const rocks: [number, number, number, number][] = [
    [-0.22, 0.1, 0.02, 0.22],
    [0.2, 0.12, 0.12, 0.26],
    [0.04, 0.08, -0.22, 0.18],
    [-0.06, 0.14, 0.2, 0.2],
  ];
  return (
    <group>
      {rocks.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[i, i * 0.7, i * 0.3]} castShadow receiveShadow>
          <dodecahedronGeometry args={[s, 0]} />
          <meshStandardMaterial color={i % 2 ? "#a6937b" : "#c3b393"} roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}

function ReviewMarker({ top = 1.9 }: { top?: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const pin = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.1;
      ring.current.scale.set(s, s, 1);
      (ring.current.material as THREE.MeshStandardMaterial).opacity = 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.2));
    }
    if (pin.current) {
      pin.current.position.y = top + Math.sin(t * 2.4) * 0.08;
      pin.current.rotation.y = t * 0.9;
    }
  });
  return (
    <group>
      <mesh ref={ring} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}>
        <torusGeometry args={[0.66, 0.06, 12, 48]} />
        <meshStandardMaterial color="#ffce4a" emissive="#efad32" emissiveIntensity={1.1} transparent />
      </mesh>
      <group ref={pin} position={[0, top, 0]}>
        <mesh position={[0, 0.12, 0]} castShadow raycast={NO_RAYCAST}>
          <sphereGeometry args={[0.2, 16, 14]} />
          <meshStandardMaterial color="#ffd76a" emissive="#efad32" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, -0.08, 0]} rotation={[Math.PI, 0, 0]} castShadow raycast={NO_RAYCAST}>
          <coneGeometry args={[0.14, 0.24, 16]} />
          <meshStandardMaterial color="#ffd76a" emissive="#efad32" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.13, 0.205]} raycast={NO_RAYCAST}>
          <circleGeometry args={[0.09, 16]} />
          <meshStandardMaterial color="#7f5a17" />
        </mesh>
      </group>
    </group>
  );
}

function SelectRing({ color = "#3fa3df" }: { color?: string }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ring.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.06;
    ring.current.scale.set(s, s, 1);
  });
  return (
    <mesh ref={ring} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}>
      <torusGeometry args={[0.78, 0.05, 12, 48]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} transparent opacity={0.9} />
    </mesh>
  );
}

function Burst() {
  const grp = useRef<THREE.Group>(null);
  const life = useRef(0);
  const seeds = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return { x: Math.cos(a), z: Math.sin(a), y: 0.7 + (i % 3) * 0.25, s: 0.4 + (i % 4) * 0.12 };
      }),
    [],
  );
  useFrame((_, dt) => {
    life.current += dt * 1.5;
    const t = Math.min(1, life.current);
    if (grp.current) {
      grp.current.children.forEach((c, i) => {
        const p = seeds[i];
        c.position.set(p.x * t * 1.0, p.y * t + 0.5, p.z * t * 1.0);
        const mesh = c as THREE.Mesh;
        mesh.scale.setScalar(Math.max(0.0001, p.s * (1 - t) * 0.32));
        (mesh.material as THREE.MeshStandardMaterial).opacity = 1 - t;
      });
    }
  });
  return (
    <group ref={grp}>
      {seeds.map((_, i) => (
        <mesh key={i} raycast={NO_RAYCAST}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={i % 2 ? "#ffd76a" : "#7be0a0"}
            emissive={i % 2 ? "#efad32" : "#42be65"}
            emissiveIntensity={0.7}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

function KindModel({ kind }: { kind: ComponentKind }) {
  switch (kind) {
    case "tree":        return <CanopyTree color="#48b85d" />;
    case "sapling":     return <group scale={0.66}><CanopyTree color="#69cf7e" /></group>;
    case "fountain":    return <Fountain />;
    case "cottage":     return <Cottage />;
    case "taco_stand":  return <TacoStand />;
    case "crystals":    return <CrystalRocks />;
    case "mushrooms":   return <MushroomPatch />;
    case "castle_gate": return <KitModel url={`${kit.pirate}/castle-gate.glb`}       position={[0, 0.3, 0]} rotation={[0, -0.3, 0]} scale={0.5} />;
    case "ship":        return <KitModel url={`${kit.pirate}/ship-pirate-small.glb`}  position={[0.3, 0.08, 0.3]} rotation={[0, -0.6, 0]} scale={0.28} />;;
    case "watchtower":  return <KitModel url={`${kit.pirate}/tower-watch.glb`}        position={[0, 0.3, 0]} scale={0.6} />;
    case "windmill":    return <KitModel url={`${kit.pirate}/tower-complete-large.glb`} position={[0, 0.3, 0]} rotation={[0, 0.5, 0]} scale={0.44} />;
    case "watermill":   return <KitModel url={`${kit.fantasy}/watermill.glb`}         position={[0, 0.3, 0]} scale={0.65} />;
    case "stall":       return <KitModel url={`${kit.fantasy}/stall-red.glb`}         position={[0, 0.3, 0]} rotation={[0, 0.3, 0]} scale={0.76} />;
    case "cart":        return <KitModel url={`${kit.fantasy}/cart-high.glb`}         position={[0, 0.3, 0]} rotation={[0, 0.4, 0]} scale={0.64} />;
    case "lantern":     return <KitModel url={`${kit.fantasy}/lantern.glb`}           position={[0, 0.3, 0]} scale={0.70} />;
    case "manor":       return <KitModel url={`${kit.urban}/building-type-s.glb`}     position={[0, 0.3, 0]} rotation={[0, -0.18, 0]} scale={0.74} />;
    case "grand_fountain": return <KitModel url={`${kit.fantasy}/fountain-round.glb`} position={[0, 0.3, 0]} rotation={[0, 0.4, 0]} scale={0.95} />;
    default:            return <CanopyTree />;
  }
}

function easeOutBack(x: number) {
  const c1 = 1.70158,
    c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function PlacedObject({
  placement,
  selected,
  onHover,
}: {
  placement: Placement;
  selected: boolean;
  onHover: (id: string | null, sx?: number, sy?: number) => void;
}) {
  const obj = useRef<THREE.Group>(null);
  const grow = useRef(0);
  const pop = useRef(0);
  const demo = useRef(placement.state === "demolished" ? 1 : 0);
  const prev = useRef<PlacementState>(placement.state);
  const [burstKey, setBurstKey] = useState(0);

  const baseScale = placement.item.kind === "cottage" ? 1.05 : 1;
  const tall =
    placement.item.kind === "castle_gate" ||
    placement.item.kind === "watchtower" ||
    placement.item.kind === "windmill";

  useEffect(() => {
    if (prev.current !== placement.state) {
      if (placement.state === "established" && prev.current === "under_review") {
        pop.current = 1;
        setBurstKey((k) => k + 1);
      }
      if (placement.state === "demolished") demo.current = 0.0001;
      prev.current = placement.state;
    }
  }, [placement.state]);

  useFrame((_, dt) => {
    grow.current = Math.min(1, grow.current + dt * 2.2);
    if (pop.current > 0) pop.current = Math.max(0, pop.current - dt * 2);
    if (demo.current > 0 && demo.current < 1) demo.current = Math.min(1, demo.current + dt * 2.4);
    if (!obj.current) return;
    const gEase = Math.max(0, easeOutBack(grow.current));
    const popAmt = pop.current > 0 ? Math.sin(pop.current * Math.PI) * 0.2 : 0;
    if (placement.state === "demolished") {
      obj.current.scale.setScalar(baseScale * gEase * (1 - demo.current));
      obj.current.rotation.z = demo.current * 0.5;
      obj.current.position.y = -demo.current * 0.15;
    } else {
      obj.current.scale.setScalar(baseScale * gEase * (1 + popAmt));
      obj.current.rotation.z = 0;
      obj.current.position.y = 0;
    }
  });

  const pending = placement.state === "under_review";
  const demolished = placement.state === "demolished";

  return (
    <group
      position={tilePosition(placement.x, placement.z)}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (demolished) return;
        onHover(placement.id, e.nativeEvent.clientX, e.nativeEvent.clientY);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
        document.body.style.cursor = "auto";
      }}
    >
      <group ref={obj}>
        <Suspense fallback={null}>{demolished ? <Rubble /> : <KindModel kind={placement.item.kind} />}</Suspense>
      </group>
      {pending && <ReviewMarker top={tall ? 2.7 : 1.9} />}
      {selected && !demolished && <SelectRing color={pending ? "#efad32" : "#3fa3df"} />}
      {burstKey > 0 && placement.state === "established" && <Burst key={burstKey} />}
    </group>
  );
}

function Water() {
  return (
    <mesh position={[5.2, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[4.4, 7.2]} />
      <meshStandardMaterial color="#55c0d7" roughness={0.5} metalness={0.05} transparent opacity={0.84} />
    </mesh>
  );
}

const DEFAULT_TILES = Array.from({ length: 99 }, (_, index) => {
  const x = (index % 11) - 5;
  const z = Math.floor(index / 11) - 4;
  return [x, z] as const;
}).filter(([x, z]) => Math.abs(x + z) < 8 && !(x >= 5 && z <= 2));

function CameraRig({ target }: { target: THREE.Vector3 | null }) {
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update?: () => void } | null;
  const home = useMemo(() => new THREE.Vector3(0, 0.05, 0), []);
  useFrame(() => {
    if (!controls) return;
    controls.target.lerp(target ?? home, 0.07);
    controls.update?.();
  });
  return null;
}

function World({
  zoom,
  placements,
  onHover,
  selectedId,
  selectedPos,
  isSpinning,
}: {
  zoom: number;
  placements: Placement[];
  onHover: (id: string | null, sx?: number, sy?: number) => void;
  selectedId: string | null;
  selectedPos: THREE.Vector3 | null;
  isSpinning?: boolean;
}) {
  const terrainTiles = useMemo(() => {
    const tileSet = new Set<string>(DEFAULT_TILES.map(([x, z]) => `${x},${z}`));
    placements.forEach((p) => {
      if (p.x != null && p.z != null) {
        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            tileSet.add(`${p.x + dx},${p.z + dz}`);
          }
        }
      }
    });
    return Array.from(tileSet).map((key) => {
      const [x, z] = key.split(",").map(Number);
      return [x, z] as const;
    });
  }, [placements]);

  return (
    <>
      <color attach="background" args={["#bdeaf5"]} />
      <fog attach="fog" args={["#cdeffa", 22, 55]} />
      <OrthographicCamera makeDefault position={[8.8, 10.4, 8.8]} zoom={zoom} />
      <OrbitControls
        makeDefault
        enablePan={true}
        autoRotate={isSpinning && !selectedPos}
        autoRotateSpeed={0.03}
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={0.5}
        maxPolarAngle={0.95}
        minZoom={12}
        maxZoom={120}
        target={[0, 0.05, 0]}
      />
      <CameraRig target={selectedPos} />
      <ambientLight intensity={1.18} />
      <directionalLight
        position={[5, 8.5, 5]}
        intensity={2.05}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <hemisphereLight args={["#eafcff", "#74ad63", 1.05]} />
      <Water />
      {terrainTiles.map(([x, z]) => {
        const here = placements.find((p) => p.x === x && p.z === z);
        const color =
          here?.state === "under_review" ? "#9bd97f" : here?.state === "demolished" ? "#7fae5f" : "#86cf66";
        const height = here && here.state !== "demolished" ? 0.42 : 0.34;
        return <TerrainBlock key={`${x}:${z}`} x={x} z={z} color={color} height={height} />;
      })}
      <Suspense fallback={null}>
        <AmbientScenery />
      </Suspense>
      {placements.map((placement) => (
        <PlacedObject
          key={placement.id}
          placement={placement}
          selected={selectedId === placement.id}
          onHover={onHover}
        />
      ))}

      <Text
        position={[0, 0.2, 6.4]}
        rotation={[-0.75, 0, 0]}
        fontSize={0.3}
        color="#2f5a36"
        anchorX="center"
        anchorY="middle"
      >
        Task Arcade
      </Text>
      <ContactShadows position={[0, -0.04, 0]} opacity={0.42} scale={13} blur={2.8} far={4} />
    </>
  );
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function KindIcon({ kind }: { kind: ComponentKind }) {
  if (kind === "ship") return <Ship size={18} />;
  if (kind === "windmill" || kind === "watermill") return <Wind size={18} />;
  if (kind === "fountain" || kind === "grand_fountain") return <Droplets size={18} />;
  if (kind === "manor") return <Building2 size={18} />;
  if (kind === "cottage" || kind === "castle_gate" || kind === "watchtower") return <Castle size={18} />;
  if (kind === "stall" || kind === "taco_stand" || kind === "cart") return <Store size={18} />;
  if (kind === "crystals") return <Gem size={18} />;
  return <Trees size={18} />;
}

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className="tier-badge" style={{ background: TIER_COLOR[tier] }}>
      {tier}
    </span>
  );
}

function Avatar({ name, color, email, size = 34 }: { name: string; color: string; email?: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  if (email && !imgError) {
    return (
      <span className="avatar avatar--gravatar" style={{ width: size, height: size }}>
        <img
          src={gravatarUrl(email, size * 2)}
          alt={name}
          width={size}
          height={size}
          onError={() => setImgError(true)}
          style={{ borderRadius: "50%", objectFit: "cover", display: "block" }}
        />
      </span>
    );
  }
  return (
    <span className="avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.41 }}>
      {initialOf(name)}
    </span>
  );
}

function SourceBadge({ source }: { source: TaskSource }) {
  const cfg = SOURCE_CFG[source];
  return (
    <span className="source-badge" style={{ background: cfg.bg }}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function TaskStatusDot({ status }: { status: TaskStatus }) {
  if (status === "in_progress")  return <span className="task-dot task-dot--progress" title="In Progress">●</span>;
  if (status === "cleared") return <span className="task-dot task-dot--cleared"><Check size={10} /></span>;
  if (status === "under_review")  return <span className="task-dot task-dot--pending" />;
  if (status === "established")  return <span className="task-dot task-dot--cleared"><Check size={10} /></span>;
  if (status === "demolished")  return <span className="task-dot task-dot--demolished" />;
  return <span className="task-dot task-dot--assigned"><Circle size={10} /></span>;
}


// Floating receipt overlay — DOM element outside the Canvas, pointer-events:none
// so it can never steal canvas hover events (avoids drei <Html> flicker bug).
function HoverReceipt({ placement, x, y }: { placement: Placement; x: number; y: number }) {
  const pending = placement.state === "under_review";
  return (
    <div
      className={`receipt receipt--floating ${pending ? "is-pending" : "is-built"}`}
      style={{ left: x + 16, top: y - 12 }}
    >
      <div className="receipt-head">
        <span className="receipt-av" style={{ background: colorForBuilder(placement.builderEmail) }}>
          {initialOf(placement.builder)}
        </span>
        <div>
          <strong>{placement.builder}</strong>
          <small>{placement.submitted}</small>
        </div>
        <span className="receipt-tier" style={{ background: TIER_COLOR[placement.item.tier] }}>
          {placement.item.tier}
        </span>
      </div>
      <p className="receipt-task">{placement.task}</p>
      <div className="receipt-foot">
        <span>{placement.item.label}</span>
        <span className={pending ? "rev-pending" : "rev-built"}>
          {pending ? "● Pending review" : "✓ Established"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Build picker modal — opens when a member clears a task. Shows the catalogue
// filtered to the cleared task's point tier; picking one places it (under review).
// ---------------------------------------------------------------------------

function BuildPickerModal({
  title,
  tier,
  catalogue,
  onPick,
  onClose,
}: {
  title: string;
  tier: Tier;
  catalogue: CatalogueItem[];
  onPick: (item: CatalogueItem) => void;
  onClose: () => void;
}) {
  const options = catalogue.filter((c) => c.tier === tier);
  return (
    <div className="build-modal-overlay" onClick={onClose}>
      <div
        className="build-modal"
        role="dialog"
        aria-label="Choose your build"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="build-modal-close" type="button" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="build-modal-eyebrow">
          <CheckCircle2 size={15} /> Task cleared · {tier} pts unlocked
        </div>
        <h2 className="build-modal-title">Pick what you'll build</h2>
        <p className="build-modal-sub">
          “{title}” earned <strong>{tier} points</strong>. Choose a {tier}-pt monument to raise in
          your team's world — your manager approves it into permanence.
        </p>
        <div className="build-modal-grid">
          {options.map((c) => (
            <button key={c.kind} className="build-option" type="button" onClick={() => onPick(c)}>
              <span
                className="build-option-icon"
                style={{ background: `${TIER_COLOR[c.tier]}20`, color: TIER_COLOR[c.tier] }}
              >
                <KindIcon kind={c.kind} />
              </span>
              <strong>{c.label}</strong>
              <TierBadge tier={c.tier} />
            </button>
          ))}
        </div>
        <p className="build-modal-foot">
          <Sparkles size={13} /> Bigger tasks unlock bigger builds.
        </p>
      </div>
    </div>
  );
}

function AssignTaskModal({ teamMembers, activeSprintId, onSubmit, onClose }: {
  teamMembers: TeamMemberRow[];
  activeSprintId: string;
  onSubmit: (title: string, assigneeEmail: string, points: Tier, due: string) => void;
  onClose: () => void;
}) {
  const members = teamMembers.filter((m) => m.role === "member" || m.role === "manager");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(members[0]?.email ?? "");
  const [points, setPoints] = useState<Tier>(30);
  const [due, setDue] = useState("");
  return (
    <div className="build-modal-overlay" onClick={onClose}>
      <div className="build-modal" role="dialog" onClick={(e) => e.stopPropagation()}>
        <button className="build-modal-close" type="button" onClick={onClose}><X size={18} /></button>
        <div className="build-modal-eyebrow"><Plus size={15} /> Manager · assign task</div>
        <h2 className="build-modal-title">New task</h2>
        <div className="assign-form">
          <label className="assign-label">
            Task
            <input
              className="assign-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </label>
          <label className="assign-label">
            Assignee
            <select className="assign-select" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {members.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
            </select>
          </label>
          <label className="assign-label">
            Points
            <div className="tier-picker">
              {([15, 30, 45, 60] as Tier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tier-btn${points === t ? " active" : ""}`}
                  style={points === t ? { background: TIER_COLOR[t], color: "#fff" } : {}}
                  onClick={() => setPoints(t)}
                >
                  {t} pts
                </button>
              ))}
            </div>
          </label>
          <label className="assign-label">
            Attach Project Resource File:
            <div style={{ display: "flex", gap: 6, margin: "4px 0 8px 0" }}>
              <button
                type="button"
                style={{ flex: 1, padding: "6px 4px", fontSize: 11, fontWeight: 700, borderRadius: 6, border: "1px solid #ccc", background: "#f8fafc", cursor: "pointer" }}
                onClick={() => alert("Local computer file selection active. Drag & drop file in task modal.")}
              >
                💻 Local Computer
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: "6px 4px", fontSize: 11, fontWeight: 700, borderRadius: 6, border: "1px solid #3fa3df", background: "#3fa3df15", color: "#0284c7", cursor: "pointer" }}
                onClick={() => alert("JettyThunder S3 Media Vault connected. Select from 4K streaming assets.")}
              >
                ⚡ JettyThunder S3
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: "6px 4px", fontSize: 11, fontWeight: 700, borderRadius: 6, border: "1px solid #ccc", background: "#f8fafc", cursor: "pointer" }}
                onClick={() => alert("Google Drive connected. Link shared doc or asset folder.")}
              >
                📁 Google Drive
              </button>
            </div>
          </label>
          <label className="assign-label">
            Due
            <input
              className="assign-input"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              placeholder="e.g. Tomorrow, Jun 30"
            />
          </label>
        </div>
        <button
          className="place-button"
          type="button"
          disabled={!title.trim()}
          onClick={() => onSubmit(title.trim(), assignee, points, due)}
        >
          <Send size={16} /> Assign task
        </button>
      </div>
    </div>
  );
}

function AdminSettingsModal({
  teamMembers,
  onSaveMember,
  onAddMember,
  onClose,
}: {
  teamMembers: TeamMemberRow[];
  onSaveMember: (id: string, name: string, email: string, role: string) => void;
  onAddMember: (name: string, email: string, role: string) => void;
  onClose: () => void;
}) {
  const [members, setMembers] = useState(teamMembers);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("member");

  const handleChange = (id: string, field: "name" | "email" | "role", value: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSaveAll = () => {
    members.forEach((m) => {
      onSaveMember(m.id, m.name, m.email, m.role);
    });
    if (newName.trim() && newEmail.trim()) {
      onAddMember(newName.trim(), newEmail.trim(), newRole);
    }
    onClose();
  };

  return (
    <div className="build-modal-overlay" onClick={onClose}>
      <div className="build-modal" role="dialog" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <button className="build-modal-close" type="button" onClick={onClose}><X size={18} /></button>
        <div className="build-modal-eyebrow"><Sparkles size={15} /> Platform Admin · Team Roster & Settings</div>
        <h2 className="build-modal-title">Admin Settings</h2>
        <div style={{ marginTop: 12, padding: 12, borderRadius: 9, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a5f", fontSize: 12, lineHeight: 1.5 }}>
          <strong>New-member onboarding:</strong> add the person to this roster, then invite the same
          email to the JettyThunder workspace to grant production-file access. Google Drive remains
          optional and keeps its own sharing permissions.{" "}
          <a href={JETTY_WORKSPACE_URL} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 700 }}>
            Manage storage access ↗
          </a>
        </div>
        
        <div style={{ maxHeight: 340, overflowY: "auto", margin: "16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {members.map((m) => (
            <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(0,0,0,0.03)", padding: 8, borderRadius: 8 }}>
              <input
                style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                value={m.name}
                onChange={(e) => handleChange(m.id, "name", e.target.value)}
                placeholder="Name"
              />
              <input
                style={{ flex: 1.4, padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                value={m.email}
                onChange={(e) => handleChange(m.id, "email", e.target.value)}
                placeholder="Email address"
              />
              <select
                style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                value={m.role}
                onChange={(e) => handleChange(m.id, "role", e.target.value)}
              >
                <option value="manager">Manager / Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          ))}

          <div style={{ marginTop: 8, borderTop: "1px dashed #ccc", paddingTop: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>+ Add New Team Member</span>
            <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
              <input
                style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New name"
              />
              <input
                style={{ flex: 1.4, padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New email"
              />
              <select
                style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="manager">Manager / Admin</option>
              </select>
            </div>
          </div>
        </div>

        <button className="place-button" type="button" onClick={handleSaveAll}>
          <Check size={16} /> Save Admin Settings
        </button>
      </div>
    </div>
  );
}

function AccountInitModal({
  teamMembers,
  onClaimAccount,
  onClose,
}: {
  teamMembers: TeamMemberRow[];
  onClaimAccount: (id: string, name: string, email: string) => void;
  onClose: () => void;
}) {
  const [selectedMember, setSelectedMember] = useState<TeamMemberRow | null>(null);
  const [email, setEmail] = useState("");

  const handleSelect = (m: TeamMemberRow) => {
    setSelectedMember(m);
    setEmail(m.email.includes("@cleanpuff.io") ? "" : m.email);
  };

  const handleSubmit = () => {
    if (!selectedMember || !email.trim()) return;
    onClaimAccount(selectedMember.id, selectedMember.name, email.trim());
    onClose();
  };

  return (
    <div className="build-modal-overlay" onClick={onClose}>
      <div className="build-modal" role="dialog" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <button className="build-modal-close" type="button" onClick={onClose}><X size={18} /></button>
        <div className="build-modal-eyebrow"><Sparkles size={15} /> Welcome to CleanPuff Task Arcade</div>
        <h2 className="build-modal-title">Initialize Your Account</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          Select your team role slot below and enter your real email address (Gmail, personal, custom domain) to set up your account and stay logged in.
        </p>

        {!selectedMember ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {teamMembers.map((m) => {
              const isClaimed = !m.email.endsWith("@cleanpuff.io");
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={isClaimed}
                  onClick={() => handleSelect(m)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 10,
                    border: isClaimed ? "1px solid #e0e0e0" : "1px solid #3fa3df70",
                    background: isClaimed ? "#f7f7f7" : "#fff",
                    cursor: isClaimed ? "not-allowed" : "pointer",
                    textAlign: "left",
                    opacity: isClaimed ? 0.75 : 1,
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: m.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isClaimed ? "#666" : "#222" }}>
                      {m.name} {isClaimed && "🔒"}
                    </div>
                    <div style={{ fontSize: 11, color: isClaimed ? "#999" : "#777" }}>
                      {isClaimed ? `Claimed (${m.email})` : m.role === "manager" ? "Manager / Admin" : "Team Member"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.04)", padding: 10, borderRadius: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: selectedMember.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
                {selectedMember.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong>Selected Slot: {selectedMember.name}</strong>
                <button type="button" onClick={() => setSelectedMember(null)} style={{ background: "none", border: "none", color: "#3fa3df", fontSize: 12, marginLeft: 8, cursor: "pointer", textDecoration: "underline" }}>
                  Change
                </button>
              </div>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600 }}>
              Your Real Email Address (Gmail, personal, etc.):
              <input
                style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. drgnflai.org@gmail.com"
                autoFocus
              />
            </label>
          </div>
        )}

        {selectedMember && (
          <button className="place-button" type="button" disabled={!email.trim()} onClick={handleSubmit}>
            <Check size={16} /> Save & Log In As {selectedMember.name}
          </button>
        )}
      </div>
    </div>
  );
}

function GrowthIntelligenceTab({ teamMembers }: { teamMembers: TeamMemberRow[] }) {
  const [activeIdea, setActiveIdea] = useState<string | null>(null);

  const viralHooks = [
    "🔥 Viral Hook (RV): 'Sir Gas ruins 4th of July BBQ' — 9:16 Short with 2.5s chaotic audio jump-scare.",
    "🎨 Visual Hook (Artem): 'CleanPuff vs. Smog Realm' 4K alignment chart banner with high-contrast amber/emerald color scheme.",
    "🤖 Bot Hook (Ihor): 'Daily Telegram Puff Cleanse' mini-game rewarding active check-ins with NFT whitelist points.",
    "📢 Marcom Hook (Peter): '12-Day Princess Degen Influencer Advent Calendar' cross-promotion campaign.",
    "⚖️ DAO Hook (Bryan): 'Delaware C-Corp + QQDAO Legal Licensing' announcement for tier-1 exchange credibility.",
  ];

  const generateIdea = () => {
    const random = viralHooks[Math.floor(Math.random() * viralHooks.length)];
    setActiveIdea(random);
  };

  return (
    <div className="tab-panel" style={{ padding: 24, overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#20362a", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={24} color="#3fa3df" /> 100x Growth Intelligence Engine
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: 13 }}>
            Real-time social media analytics, viral hooks, and personalized amplification tactics for the CleanPuff team.
          </p>
        </div>
        <button
          type="button"
          onClick={generateIdea}
          style={{ background: "#3fa3df", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <Sparkles size={16} /> Generate Viral Hook
        </button>
      </div>

      {activeIdea && (
        <div style={{ background: "linear-gradient(135deg, #3fa3df20, #a878e420)", border: "1px solid #3fa3df60", padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 600, color: "#20362a" }}>
          {activeIdea}
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 16, borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Target Monthly Reach</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>2.5M Views</div>
          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginTop: 2 }}>↑ 100x Growth Trajectory</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 16, borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>YouTube Shorts Retention</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>84.2%</div>
          <div style={{ fontSize: 11, color: "#3fa3df", fontWeight: 600, marginTop: 2 }}>Target &gt;80% 3-sec hook</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 16, borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Telegram Active Members</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>42,500</div>
          <div style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 600, marginTop: 2 }}>Gamified check-ins active</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 16, borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Crypto.com Drop Conversion</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>18.4%</div>
          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginTop: 2 }}>High-contrast art active</div>
        </div>
      </div>

      {/* Team Member Growth Blueprint Grid */}
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Team Member Amplification Blueprints</h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {/* RV */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#a878e4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>RV</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>RV (Richard) · Creative & Animation Director</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>YouTube Shorts & 16:9 Narrative Strategy</div>
            </div>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#334155", display: "flex", flexDirection: "column", gap: 6 }}>
            <li><strong>3-Second Hook Rule:</strong> Start every Short during Gasling chaos before introducing Princess Puff.</li>
            <li><strong>Duality Remix:</strong> Publish side-by-side 9:16 comparison videos with trending audio clips.</li>
            <li><strong>Target Impact:</strong> 500k – 2M organic views/mo across Shorts & TikTok.</li>
          </ul>
        </div>

        {/* Artem */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#4f90df", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>AK</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Artem Kosenko · Lead Art & Design</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Thumbnail Science & Alignment Charts</div>
            </div>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#334155", display: "flex", flexDirection: "column", gap: 6 }}>
            <li><strong>Color Psychology:</strong> Use high-contrast Amber (#f59e0b) vs Emerald (#10b981) for 9%+ CTR.</li>
            <li><strong>Social Alignment Banners:</strong> Release "Which CleanPuff Character Are You?" viral graphics.</li>
            <li><strong>Target Impact:</strong> 2.5x website traffic conversion rate on non-token landing pages.</li>
          </ul>
        </div>

        {/* Ihor */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#42be65", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>IH</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Ihor · Engineering & Automation</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Telegram Bot Gamification & Xsolla Integration</div>
            </div>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#334155", display: "flex", flexDirection: "column", gap: 6 }}>
            <li><strong>Puff Cleanse Daily Loop:</strong> 10-second Telegram tap-to-cleanse check-in mini-game.</li>
            <li><strong>Automated Milestone Broadcasts:</strong> Webhook auto-posts Task Arcade 3D progress to Telegram.</li>
            <li><strong>Target Impact:</strong> +300% Telegram community retention & daily active users.</li>
          </ul>
        </div>

        {/* Peter */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e9627a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>PB</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>Peter F.F. Bel · Chief Marketing Officer (CMO)</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Influencer Advent Calendar & Partner Funnels</div>
            </div>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#334155", display: "flex", flexDirection: "column", gap: 6 }}>
            <li><strong>Princess Degen Campaign:</strong> 12-day Web3 influencer advent calendar giveaway series.</li>
            <li><strong>Coinbound & Xsolla SOW:</strong> Partner distribution campaign for Web3 gaming launch.</li>
            <li><strong>Target Impact:</strong> 150,000+ targeted gamer impressions.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

type TideZone = "surf" | "open_water" | "deep_ocean";
type NleLifecycle = "editing" | "master_exported" | "auto_archived";

type MediaAsset = {
  id: string;
  title: string;
  category: "video" | "design" | "audio" | "gdrive";
  resolution: string; // e.g. "4K 60fps", "9:16 Short", "HD 1080p"
  size: string;
  creator: string;
  creatorEmail: string;
  cdnProvider: "jettythunder" | "gdrive";
  cdnUrl: string;
  previewColor: string;
  duration?: string;
  uploadedAt: string;
  tideZone: TideZone;
  isPinned: boolean;
  idleDays: number;
  nleState: NleLifecycle;
  nleApp?: "Final Cut Pro" | "CapCut" | "Premiere" | "DaVinci";
  localBytesSaved?: string;
};

const SAMPLE_VAULT_ASSETS: MediaAsset[] = [
  {
    id: "mv-1",
    title: "Guardians of the Puff — Teaser Trailer (4K Cut)",
    category: "video",
    resolution: "4K 60fps",
    size: "1.42 GB",
    creator: "RV",
    creatorEmail: "rv@cleanpuff.io",
    cdnProvider: "jettythunder",
    cdnUrl: "https://jettythunder.app/v/cleanpuff-teaser-4k.mp4",
    previewColor: "linear-gradient(135deg, #2b5876, #4e4376)",
    duration: "1:45",
    uploadedAt: "Today, 11:20 AM",
    tideZone: "surf",
    isPinned: true,
    idleDays: 0,
    nleState: "master_exported",
    nleApp: "Final Cut Pro",
    localBytesSaved: "18.4 GB Raw Clips Evicted",
  },
  {
    id: "mv-2",
    title: "Sir Gas Ruining BBQ — YouTube Short 9:16",
    category: "video",
    resolution: "9:16 Short",
    size: "184 MB",
    creator: "RV",
    creatorEmail: "rv@cleanpuff.io",
    cdnProvider: "jettythunder",
    cdnUrl: "https://jettythunder.app/v/sir-gas-bbq-short.mp4",
    previewColor: "linear-gradient(135deg, #11998e, #38ef7d)",
    duration: "0:38",
    uploadedAt: "Today, 09:15 AM",
    tideZone: "surf",
    isPinned: false,
    idleDays: 1,
    nleState: "editing",
    nleApp: "CapCut",
  },
  {
    id: "mv-3",
    title: "Princess Puff & Airabella High-Res Render Sheet",
    category: "design",
    resolution: "8K Ultra HD",
    size: "42.5 MB",
    creator: "Artem Kosenko",
    creatorEmail: "artem@cleanpuff.io",
    cdnProvider: "jettythunder",
    cdnUrl: "https://jettythunder.app/assets/princess-puff-airabella-8k.png",
    previewColor: "linear-gradient(135deg, #ff7e5f, #feb47b)",
    uploadedAt: "Yesterday",
    tideZone: "open_water",
    isPinned: false,
    idleDays: 4,
    nleState: "master_exported",
  },
  {
    id: "mv-4",
    title: "CleanPuff IP Bible v4 — Complete Production Draft",
    category: "gdrive",
    resolution: "Docx / PDF",
    size: "14.8 MB",
    creator: "J Q",
    creatorEmail: "jq@cleanpuff.io",
    cdnProvider: "gdrive",
    cdnUrl: "https://drive.google.com/file/d/cleanpuff-bible-v4/view",
    previewColor: "linear-gradient(135deg, #4facfe, #00f2fe)",
    uploadedAt: "Yesterday",
    tideZone: "surf",
    isPinned: true,
    idleDays: 0,
    nleState: "master_exported",
  },
  {
    id: "mv-5",
    title: "Staff of Silent Storms — Magic SFX Pack",
    category: "audio",
    resolution: "24-bit 96kHz",
    size: "68 MB",
    creator: "RV",
    creatorEmail: "rv@cleanpuff.io",
    cdnProvider: "jettythunder",
    cdnUrl: "https://jettythunder.app/audio/staff-silent-storms-sfx.wav",
    previewColor: "linear-gradient(135deg, #43e97b, #38f9d7)",
    duration: "0:24",
    uploadedAt: "Jul 18",
    tideZone: "deep_ocean",
    isPinned: false,
    idleDays: 28,
    nleState: "auto_archived",
    localBytesSaved: "4.2 GB Local SSD Freed",
  },
  {
    id: "mv-6",
    title: "Crypto.com NFT Banner — Amber vs Emerald",
    category: "design",
    resolution: "4K Banner",
    size: "18.2 MB",
    creator: "Artem Kosenko",
    creatorEmail: "artem@cleanpuff.io",
    cdnProvider: "gdrive",
    cdnUrl: "https://drive.google.com/file/d/cryptocom-banner/view",
    previewColor: "linear-gradient(135deg, #fa709a, #fee140)",
    uploadedAt: "Jul 17",
    tideZone: "open_water",
    isPinned: false,
    idleDays: 12,
    nleState: "master_exported",
  },
];

function AgenticStoragePanel() {
  const [fileRouting, setFileRouting] = useState<Record<string, "local" | "gdrive" | "jetty">>({
    ".mov (Working)": "local",
    ".mp4 (Working)": "local",
    ".mp4 (Master)": "gdrive",
    ".pages": "gdrive",
    ".doc": "gdrive",
    ".wav (Raw)": "jetty",
    "Old Projects": "jetty"
  });

  const [logs, setLogs] = useState<string[]>([
    "[10:04 AM] Swarm Agent started.",
    "[10:12 AM] Detected Master Export 'Guardians_Teaser_4K.mp4'.",
    "[10:12 AM] Routing 'Guardians_Teaser_4K.mp4' ➔ Google Drive (Surf Edge).",
    "[10:15 AM] Executing cron.tideEbb for idle CapCut files.",
    "[10:16 AM] Archiving 45.2 GB of .mov clips ➔ JettyThunder (Deep Ocean).",
    "[10:17 AM] Replaced archived clips with local Symlinks."
  ]);

  const [toggles, setToggles] = useState({ symlink: true, master: true, autoHydrate: true });

  const handleDrop = (e: React.DragEvent, targetZone: "local" | "gdrive" | "jetty") => {
    e.preventDefault();
    const fileName = e.dataTransfer.getData("text/plain");
    if (fileName) {
      setFileRouting(prev => ({ ...prev, [fileName]: targetZone }));
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Policy updated: '${fileName}' routes to ${targetZone.toUpperCase()}.`]);
    }
  };

  const ringStyles = {
    jetty: { background: "rgba(239, 68, 68, 0.15)", border: "#ef4444", size: "94%", label: "Jetty Thunder S3", zIndex: 1 },
    gdrive: { background: "rgba(249, 115, 22, 0.15)", border: "#f97316", size: "68%", label: "Google Drive", zIndex: 2 },
    local: { background: "rgba(14, 165, 233, 0.2)", border: "#0ea5e9", size: "42%", label: "Local Hard Drive", zIndex: 3 }
  };

  return (
    <div style={{ background: "var(--bg-glass)", border: "1px solid var(--border-light)", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
       {/* Header */}
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: 16, display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
            <Activity size={18} color="var(--primary-mint)" /> Agentic NLE Storage Management
          </h3>
          <span style={{ fontSize: 11, background: "var(--bg-glass-hover)", color: "var(--text-secondary)", border: "1px solid var(--border-light)", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>
            Interactive Drag & Drop Policy
          </span>
       </div>
       
       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {/* Left: Concentric Drag and Drop Visualizer */}
          <div style={{ position: "relative", width: "100%", height: 340, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border-light)", overflow: "hidden" }}>
             
             {/* Axes lines */}
             <div style={{ position: "absolute", width: "100%", height: 1, background: "var(--primary-mint)", top: "50%", zIndex: 4, opacity: 0.3 }} />
             <div style={{ position: "absolute", width: 1, height: "100%", background: "var(--primary-mint)", left: "50%", zIndex: 4, opacity: 0.3 }} />
             <span style={{ position: "absolute", left: 12, top: 12, color: "var(--text-muted)", fontSize: 10, fontWeight: 700, zIndex: 5, letterSpacing: "0.05em" }}>User Fetch Frequency</span>
             <span style={{ position: "absolute", bottom: 12, right: 12, color: "var(--text-muted)", fontSize: 10, fontWeight: 700, zIndex: 5, letterSpacing: "0.05em" }}>Storage Time</span>

             {/* Rings Container */}
             <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
                <div style={{ position: "relative", width: "100%", height: "100%", maxHeight: 300, maxWidth: 300, aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   {(["jetty", "gdrive", "local"] as const).map(zone => (
                     <div 
                       key={zone}
                       onDragOver={e => e.preventDefault()}
                       onDrop={e => handleDrop(e, zone)}
                       style={{
                         position: "absolute",
                         width: ringStyles[zone].size,
                         height: ringStyles[zone].size,
                         borderRadius: "50%",
                         background: ringStyles[zone].background,
                         border: `2px solid ${ringStyles[zone].border}`,
                         zIndex: ringStyles[zone].zIndex,
                         display: "flex",
                         flexDirection: "column",
                         alignItems: "center",
                         justifyContent: "flex-end",
                         paddingBottom: "6%",
                         boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                         transition: "0.3s ease-in-out" 
                       }}
                     >
                        <span style={{ color: "var(--text-primary)", fontSize: 11, fontWeight: 800, letterSpacing: "0.02em", marginBottom: 4 }}>{ringStyles[zone].label}</span>
                        
                        {/* Render files in this zone */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", maxWidth: "85%" }}>
                           {Object.entries(fileRouting).filter(([_, z]) => z === zone).map(([file]) => (
                              <div 
                                key={file}
                                draggable
                                onDragStart={e => e.dataTransfer.setData("text/plain", file)}
                                style={{
                                   background: "var(--bg-glass)", color: "var(--text-primary)", padding: "3px 7px", borderRadius: 8, fontSize: 10, cursor: "grab", border: "1px solid var(--border-light)", fontWeight: 600, transition: "transform 0.1s"
                                }}
                                onDragOver={e => e.preventDefault()}
                              >
                                 {file}
                              </div>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Right: Settings & Logs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
             
             {/* Smart Toggles */}
             <div style={{ background: "var(--bg-secondary)", padding: 16, borderRadius: 12, border: "1px solid var(--border-light)" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "var(--text-primary)", fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}><Database size={14} color="var(--primary-mint)" /> Smart Routing Policies</h4>
                
                {[
                  { id: "symlink", label: "CapCut Symlink Hydration", desc: "Auto-replace archived working files with local symlinks." },
                  { id: "master", label: "Auto-Push Masters to GDrive", desc: "Sync final renders to shared Google Drive folder." },
                  { id: "autoHydrate", label: "Predictive Hydration", desc: "Warm up Deep Ocean files when project is opened." }
                ].map(toggle => (
                  <div key={toggle.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)" }}>
                     <div>
                        <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}>{toggle.label}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 2 }}>{toggle.desc}</div>
                     </div>
                     <button 
                       type="button" 
                       onClick={() => setToggles(p => ({ ...p, [toggle.id]: !p[toggle.id as keyof typeof toggles] }))}
                       style={{ width: 36, height: 20, borderRadius: 10, background: toggles[toggle.id as keyof typeof toggles] ? "var(--primary-mint)" : "var(--border-light)", border: "none", position: "relative", cursor: "pointer", transition: "0.2s" }}
                     >
                       <div style={{ position: "absolute", top: 2, left: toggles[toggle.id as keyof typeof toggles] ? 18 : 2, width: 16, height: 16, background: "#fff", borderRadius: "50%", transition: "0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                     </button>
                  </div>
                ))}
             </div>

             {/* Swarm Agent Log */}
             <div style={{ flex: 1, background: "var(--bg-secondary)", borderRadius: 12, padding: 14, border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", minHeight: 140 }}>
                <div style={{ color: "var(--primary-mint)", fontSize: 11, fontWeight: 700, fontFamily: "monospace", marginBottom: 8, borderBottom: "1px dashed var(--border-light)", paddingBottom: 6 }}>
                  {">_ SWARM GOAP TERMINAL"}
                </div>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, maxHeight: 130 }}>
                   {logs.map((log, i) => (
                     <div key={i} style={{ color: "var(--text-secondary)", fontSize: 11, fontFamily: "monospace", lineHeight: 1.4 }}>
                       {log.includes("Policy updated") || log.includes("Hydrating") || log.includes("Routing") ? <span style={{ color: "var(--primary-mint)" }}>{log}</span> : log.includes("Archiving") ? <span style={{ color: "var(--alert-pink)" }}>{log}</span> : log}
                     </div>
                   ))}
                </div>
             </div>

          </div>
       </div>
    </div>
  );
}

function MediaVaultTab({ teamMembers }: { teamMembers: TeamMemberRow[] }) {
  const [assets, setAssets] = useState<MediaAsset[]>(SAMPLE_VAULT_ASSETS);
  const [category, setCategory] = useState<"all" | "video" | "design" | "audio" | "gdrive">("all");
  const [tideZoneFilter, setTideZoneFilter] = useState<"all" | TideZone>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [minQuality, setMinQuality] = useState(0); // slider 0-100
  const [tideDaysThreshold, setTideDaysThreshold] = useState(14); // slider 1-90 days
  const [proxyBitrate, setProxyBitrate] = useState(18); // slider 2-50 Mbps
  const [activeMedia, setActiveMedia] = useState<MediaAsset | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // In-app file upload form state
  const [importTitle, setImportTitle] = useState("");
  const [importCategory, setImportCategory] = useState<"video" | "design" | "audio" | "gdrive">("video");
  const [importResolution, setImportResolution] = useState("4K 60fps");
  const [importProvider, setImportProvider] = useState<"jettythunder" | "gdrive">("jettythunder");
  const [importUrl, setImportUrl] = useState("");

  const PRESENTATION_SLIDES = [
    {
      title: "🌊 Welcome to Seashore Tidal Storage",
      subtitle: "The Shoreline Storage Architecture Conceived by Claude Fable & Richard",
      content: "Storage tiers operate like a dynamic shoreline. Media flows rhythmically between local NLE editing, ultra-fast streaming CDN proxies, hot S3 storage, and cold glacier archives.",
      badge: "Slide 1 / 5 · Shoreline Model",
      accent: "linear-gradient(135deg, #1e293b, #0f172a)",
      graphic: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 20 }}>
          <div style={{ background: "#fef3c720", padding: 12, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>🏖️</div>
            <div style={{ fontWeight: 800, color: "#fcd34d", fontSize: 12 }}>Dry Land</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>Local Mac SSD</div>
          </div>
          <div style={{ background: "#10b98120", padding: 12, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>🏄</div>
            <div style={{ fontWeight: 800, color: "#34d399", fontSize: 12 }}>Surf Edge</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>4K Streaming CDN</div>
          </div>
          <div style={{ background: "#3fa3df20", padding: 12, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>💧</div>
            <div style={{ fontWeight: 800, color: "#60a5fa", fontSize: 12 }}>Open Water</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>Lyve Cloud Hot S3</div>
          </div>
          <div style={{ background: "#64748b20", padding: 12, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>🧊</div>
            <div style={{ fontWeight: 800, color: "#cbd5e1", fontSize: 12 }}>Deep Ocean</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>Lyve Glacier Cold</div>
          </div>
        </div>
      ),
    },
    {
      title: "✂️ Phase 1: CapCut & Final Cut Pro Editing",
      subtitle: "Zero-Latency Local SSD Timeline Editing",
      content: "When editors work on raw 4K video footage in CapCut or Final Cut Pro, files sit on local SSD ('Dry Land') for instant timeline scrubbing and zero lag.",
      badge: "Slide 2 / 5 · Active Editing",
      accent: "linear-gradient(135deg, #11998e, #38ef7d)",
      graphic: (
        <div style={{ background: "#ffffff15", padding: 16, borderRadius: 10, marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#38ef7d" }}>CapCut & Final Cut Pro Active Workspace</div>
          <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 4 }}>Raw 4K clips are downloaded locally for editing. 0ms latency, maximum performance.</div>
        </div>
      ),
    },
    {
      title: "👑 Phase 2: Master Export & Task Clearance",
      subtitle: "Automatic CDN Pinning on Sprint Approval",
      content: "Once editing is done and the master file is exported (e.g. Guardians_Teaser_4K.mp4), the creator clears the task in Task Arcade. The master video is automatically pinned (🔒 Pinned) to Surf Edge CDN for instant team streaming.",
      badge: "Slide 3 / 5 · Master Export",
      accent: "linear-gradient(135deg, #3fa3df, #a878e4)",
      graphic: (
        <div style={{ background: "#ffffff15", padding: 16, borderRadius: 10, marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#a878e4" }}>Surf Edge CDN Streaming Pin</div>
          <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 4 }}>Master video stays pinned and instant-streaming for J Q, Artem, and social media posting.</div>
        </div>
      ),
    },
    {
      title: "📉 Phase 3: Automated Tide Ebb (`cron.tideEbb`)",
      subtitle: "Reclaim Tens of Gigabytes on Local SSDs",
      content: "Now that the master file is safely exported and pinned, the heavy raw working footage clips (e.g. 18.4 GB) are no longer needed locally. The Tide Ebb engine automatically recedes them to Lyve Glacier Cold Storage, instantly freeing local hard drive space!",
      badge: "Slide 4 / 5 · Auto-Cold Archiving",
      accent: "linear-gradient(135deg, #0f172a, #334155)",
      graphic: (
        <div style={{ background: "#ffffff15", padding: 16, borderRadius: 10, marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#38ef7d" }}>18.4 GB Local Hard Drive Space Reclaimed</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Raw clips receded to Lyve Cold S3 Glacier</div>
        </div>
      ),
    },
    {
      title: "🔒 Pinning & High-Tide Hydration Controls",
      subtitle: "Total Control in Team Members' Hands",
      content: "Team members can click '🔒 Pin to Shore' on any critical file so it never washes out, or click '🌊 High Tide Hydrate' to predictively warm up archived footage 2 hours before a review session.",
      badge: "Slide 5 / 5 · Team Controls",
      accent: "linear-gradient(135deg, #2b5876, #4e4376)",
      graphic: (
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <div style={{ flex: 1, background: "#fef3c720", border: "1px solid #fef3c740", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 800, color: "#fcd34d", fontSize: 13 }}>🔒 Pin to Shore</div>
            <div style={{ fontSize: 11, color: "#cbd5e1" }}>Protects asset from low-tide eviction</div>
          </div>
          <div style={{ flex: 1, background: "#10b98120", border: "1px solid #10b98140", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 800, color: "#34d399", fontSize: 13 }}>🌊 High-Tide Hydrate</div>
            <div style={{ fontSize: 11, color: "#cbd5e1" }}>Warms cold files for review sessions</div>
          </div>
        </div>
      ),
    },
  ];

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchesCat = category === "all" || a.category === category;
      const matchesZone = tideZoneFilter === "all" || a.tideZone === tideZoneFilter;
      const matchesQuery = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.creator.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesZone && matchesQuery;
    });
  }, [assets, category, tideZoneFilter, searchQuery]);

  const togglePin = (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isPinned: !a.isPinned } : a)),
    );
  };

  const hydrateAsset = (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, tideZone: "surf", idleDays: 0 } : a)),
    );
  };

  const handleImportSubmit = () => {
    if (!importTitle.trim()) return;
    const newAsset: MediaAsset = {
      id: `mv-${Date.now()}`,
      title: importTitle.trim(),
      category: importCategory,
      resolution: importResolution,
      size: "125 MB",
      creator: "RV",
      creatorEmail: "rv@cleanpuff.io",
      cdnProvider: importProvider,
      cdnUrl: importUrl.trim() || `https://jettythunder.app/v/file-${Date.now()}.mp4`,
      previewColor: "linear-gradient(135deg, #3fa3df, #a878e4)",
      duration: importCategory === "video" ? "1:15" : undefined,
      uploadedAt: "Just now",
      tideZone: "surf",
      isPinned: true,
      idleDays: 0,
      nleState: "editing",
      nleApp: "CapCut",
    };
    setAssets((prev) => [newAsset, ...prev]);
    setImportTitle("");
    setImportUrl("");
    setImportModalOpen(false);
  };

  const copyCdnLink = (asset: MediaAsset) => {
    navigator.clipboard.writeText(asset.cdnUrl);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ padding: 24, overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
      {/* Vault Header & Storage Widget */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
            <Store size={18} color="var(--primary-mint)" /> Media Vault
            <span style={{ fontSize: 10, background: "var(--bg-glass-hover)", color: "var(--text-secondary)", border: "1px solid var(--border-light)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
              JettyThunder S3 Tidal Engine
            </span>
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: 12 }}>
            Manage Seagate Lyve Cloud S3 lifecycle rules and NLE cold archiving.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setPresentationOpen(true)}
            style={{ background: "var(--bg-glass-hover)", color: "var(--text-primary)", border: "1px solid var(--border-light)", borderRadius: 6, padding: "6px 12px", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
          >
            <Sparkles size={14} color="var(--primary-mint)" /> Hyperframes
          </button>
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            style={{ background: "var(--primary-mint)", color: "var(--bg-primary)", border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={14} /> Import File
          </button>
          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noreferrer"
            style={{ background: "var(--bg-glass-hover)", color: "var(--text-primary)", border: "1px solid var(--border-light)", borderRadius: 6, padding: "6px 12px", fontWeight: 600, fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
          >
            Google Drive
          </a>
        </div>
      </div>

      {/* Hyperframes Interactive Storage Presentation Modal */}
      {presentationOpen && (
        <div className="build-modal-overlay" onClick={() => setPresentationOpen(false)}>
          <div className="build-modal" role="dialog" style={{ maxWidth: 680, background: "#0f172a", color: "#fff" }} onClick={(e) => e.stopPropagation()}>
            <button className="build-modal-close" type="button" onClick={() => setPresentationOpen(false)} style={{ color: "#fff" }}><X size={18} /></button>
            <div className="build-modal-eyebrow" style={{ color: "#38ef7d" }}>
              <Sparkles size={15} /> HeyGen Hyperframes Presentation Engine
            </div>

            {/* Slide Box */}
            <div style={{ background: PRESENTATION_SLIDES[currentSlide].accent, borderRadius: 14, padding: 24, margin: "16px 0", minHeight: 280, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: 10, background: "#ffffff25", color: "#fff", padding: "3px 8px", borderRadius: 10, fontWeight: 700 }}>
                  {PRESENTATION_SLIDES[currentSlide].badge}
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: "12px 0 6px 0", color: "#fff" }}>
                  {PRESENTATION_SLIDES[currentSlide].title}
                </h3>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#38ef7d", marginBottom: 12 }}>
                  {PRESENTATION_SLIDES[currentSlide].subtitle}
                </div>
                <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
                  {PRESENTATION_SLIDES[currentSlide].content}
                </p>
              </div>

              {PRESENTATION_SLIDES[currentSlide].graphic}
            </div>

            {/* Slide Navigation Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                disabled={currentSlide === 0}
                onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                style={{ background: currentSlide === 0 ? "#334155" : "#3fa3df", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: currentSlide === 0 ? "not-allowed" : "pointer" }}
              >
                ◀ Prev Slide
              </button>

              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>
                Hyperframe {currentSlide + 1} of {PRESENTATION_SLIDES.length}
              </div>

              <button
                type="button"
                disabled={currentSlide === PRESENTATION_SLIDES.length - 1}
                onClick={() => setCurrentSlide((prev) => Math.min(PRESENTATION_SLIDES.length - 1, prev + 1))}
                style={{ background: currentSlide === PRESENTATION_SLIDES.length - 1 ? "#334155" : "#3fa3df", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: currentSlide === PRESENTATION_SLIDES.length - 1 ? "not-allowed" : "pointer" }}
              >
                Next Slide ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Agentic Storage Settings Panel */}
      <AgenticStoragePanel />

      {/* Tidal Storage Visualizer Card - Professional Hardware UI */}
      <div style={{ background: "var(--bg-glass)", border: "1px solid var(--border-light)", borderRadius: 16, padding: 20, color: "var(--text-primary)", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid var(--border-light)", paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary-mint)", boxShadow: "0 0 10px var(--primary-mint)" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                Seashore Tidal Storage
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, fontFamily: "monospace" }}>
                NODE: OPERATIONAL // V.2.1
              </div>
            </div>
          </div>
          <div style={{ background: "var(--bg-secondary)", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, color: "var(--primary-mint)", border: "1px solid var(--border-light)", fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={12} /> ENGINE LIVE
          </div>
        </div>

        {/* Top Displays */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", padding: "10px 14px", borderRadius: 8 }}>
            <span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Activity size={10} /> EVICTION THRESHOLD</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>{tideDaysThreshold}.0</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>DAYS</span>
            </div>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", padding: "10px 14px", borderRadius: 8 }}>
            <span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Zap size={10} /> STREAM PROXY</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>{proxyBitrate}.8</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>MBPS</span>
            </div>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", padding: "10px 14px", borderRadius: 8 }}>
            <span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><HardDrive size={10} /> LOCAL FREED</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>18.4</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>GB</span>
            </div>
          </div>
        </div>

        {/* Rack Mount Modules */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "LOCAL SSD", desc: "DRY LAND", active: true },
            { label: "CDN PROXY", desc: "SURF EDGE", active: true },
            { label: "S3 ACTIVE", desc: "OPEN WATER", active: true },
            { label: "GLACIER", desc: "DEEP OCEAN", active: false }
          ].map((tier, i) => (
            <div key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: tier.active ? "var(--primary-mint)" : "var(--border-light)", boxShadow: tier.active ? "0 0 6px var(--primary-mint)" : "none" }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", fontFamily: "monospace" }}>{tier.label}</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: tier.active ? "var(--text-primary)" : "var(--text-muted)", marginTop: 2 }}>{tier.desc}</div>
            </div>
          ))}
        </div>

        {/* Sleek Sliders */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, background: "var(--bg-secondary)", padding: "16px 20px", borderRadius: 8, border: "1px solid var(--border-light)" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, marginBottom: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
              <span>IDLE EBB THRESHOLD</span>
              <span style={{ color: "var(--primary-mint)" }}>{tideDaysThreshold} D</span>
            </div>
            <input
              type="range"
              min="1"
              max="90"
              value={tideDaysThreshold}
              onChange={(e) => setTideDaysThreshold(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary-mint)", height: 3, borderRadius: 2, outline: "none", cursor: "pointer" }}
            />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, marginBottom: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
              <span>HYDRATION RATE</span>
              <span style={{ color: "var(--primary-mint)" }}>{proxyBitrate} MBPS</span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              value={proxyBitrate}
              onChange={(e) => setProxyBitrate(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary-mint)", height: 3, borderRadius: 2, outline: "none", cursor: "pointer" }}
            />
          </div>
        </div>
      </div>

      {/* Fast Sliders & Category Filters Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16, background: "var(--bg-secondary)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-light)" }}>
        {/* Category Pills */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "all", label: "All Assets" },
            { id: "video", label: "Video" },
            { id: "design", label: "Design" },
            { id: "audio", label: "Audio" },
            { id: "gdrive", label: "Docs" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id as any)}
              style={{
                background: category === cat.id ? "var(--primary-mint)" : "transparent",
                color: category === cat.id ? "var(--bg-primary)" : "var(--text-secondary)",
                border: "none",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Fast Quality Slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
            Quality:
            <input
              type="range"
              min="0"
              max="100"
              value={minQuality}
              onChange={(e) => setMinQuality(Number(e.target.value))}
              style={{ accentColor: "var(--primary-mint)", cursor: "pointer", width: 80, height: 2 }}
            />
            <span style={{ color: "var(--text-muted)", width: 44 }}>{minQuality > 50 ? "4K" : "All"}</span>
          </label>

          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "4px 10px", borderRadius: 4, background: "var(--bg-glass-hover)", border: "1px solid var(--border-light)", color: "var(--text-primary)", fontSize: 11, width: 140, outline: "none" }}
          />
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            style={{
              background: "var(--bg-glass)",
              border: "1px solid var(--border-light)",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Asset Visual Poster / Preview */}
            <div
              style={{
                height: 140,
                background: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                color: "#94a3b8",
                borderBottom: "1px solid #1e293b",
                overflow: "hidden"
              }}
            >
              <div style={{ opacity: 0.2, position: "absolute", inset: 0, background: asset.previewColor, mixBlendMode: "overlay" }} />
              <div style={{ opacity: 0.9, zIndex: 1, color: "#0ea5e9" }}>
                {asset.category === "video" ? <Video size={36} /> : asset.category === "design" ? <Image size={36} /> : asset.category === "audio" ? <Music size={36} /> : <FileText size={36} />}
              </div>

              {/* Provider Tag */}
              <span
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  color: "#94a3b8",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "JetBrains Mono, monospace"
                }}
              >
                {asset.cdnProvider === "jettythunder" ? <><Server size={10} /> JETTY S3</> : <><Cloud size={10} /> GDRIVE</>}
              </span>

              {/* Seashore Tidal Zone Tag */}
              <span
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: asset.isPinned ? "#0f172a" : "#0f172a",
                  border: `1px solid ${asset.isPinned ? "#0ea5e9" : "#1e293b"}`,
                  color: asset.isPinned ? "#0ea5e9" : "#64748b",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "JetBrains Mono, monospace"
                }}
              >
                {asset.isPinned
                  ? <><Pin size={10} /> PINNED</>
                  : asset.tideZone === "surf"
                  ? <><Activity size={10} /> SURF EDGE</>
                  : asset.tideZone === "open_water"
                  ? <><Server size={10} /> OPEN WATER</>
                  : <><Archive size={10} /> DEEP OCEAN</>}
              </span>

              {/* Resolution / Duration Tag */}
              <span
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(4px)",
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {asset.resolution} {asset.duration ? `· ${asset.duration}` : ""}
              </span>
            </div>

            {/* Content Details */}
            <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 14, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>
                  {asset.title}
                </h4>
                <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 12, marginBottom: 12 }}>
                  <span>Size: {asset.size}</span>
                  <span>Creator: {asset.creator}</span>
                </div>
              </div>

              {/* Actions & Seashore Tidal Engine Controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 10, borderTop: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {asset.category === "video" && (
                    <button
                      type="button"
                      onClick={() => setActiveMedia(asset)}
                      style={{ flex: 1, background: "#3fa3df", color: "#fff", border: "none", borderRadius: 6, padding: "6px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      ▶ Stream
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => copyCdnLink(asset)}
                    style={{ flex: 1, background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 6, padding: "6px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {copiedId === asset.id ? "✓ Copied!" : "🔗 CDN Link"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => togglePin(asset.id)}
                    style={{ flex: 1, background: asset.isPinned ? "#0ea5e915" : "#f8fafc", color: asset.isPinned ? "#0ea5e9" : "#64748b", border: `1px solid ${asset.isPinned ? "#0ea5e940" : "#e2e8f0"}`, borderRadius: 4, padding: "6px 0", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    {asset.isPinned ? <><Pin size={12} /> Pinned</> : <><Pin size={12} /> Pin to Shore</>}
                  </button>
                  {asset.tideZone === "deep_ocean" && (
                    <button
                      type="button"
                      onClick={() => hydrateAsset(asset.id)}
                      style={{ flex: 1, background: "#0f172a", color: "#f8fafc", border: "1px solid #1e293b", borderRadius: 4, padding: "6px 0", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      <Activity size={12} /> Hydrate
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* In-App File Importer Modal (Stay inside Task Arcade) */}
      {importModalOpen && (
        <div className="build-modal-overlay" onClick={() => setImportModalOpen(false)}>
          <div className="build-modal" role="dialog" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <button className="build-modal-close" type="button" onClick={() => setImportModalOpen(false)}><X size={18} /></button>
            <div className="build-modal-eyebrow"><Sparkles size={15} /> Task Arcade In-App Importer</div>
            <h2 className="build-modal-title">Import Media File</h2>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              Upload video shorts, 4K cuts, or resources directly into Task Arcade using JettyThunder S3 or Google Drive.
            </p>

            <div style={{ border: "2px dashed #3fa3df", borderRadius: 12, padding: 24, textAlign: "center", background: "#3fa3df08", marginBottom: 16 }}>
              <Store size={32} color="#3fa3df" style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Drag & Drop Video or Design File Here</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Supports .MP4, .MOV, .PNG, .PSD, .WAV (up to 5 GB)</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600 }}>
                Asset Title:
                <input
                  style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14 }}
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  placeholder="e.g. Sir Gas Animation Draft 2"
                  autoFocus
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600 }}>
                  Media Category:
                  <select
                    style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                    value={importCategory}
                    onChange={(e) => setImportCategory(e.target.value as any)}
                  >
                    <option value="video">🎬 4K / Short Video</option>
                    <option value="design">🎨 Design & Art</option>
                    <option value="audio">🔊 Audio SFX</option>
                    <option value="gdrive">📁 Google Drive Doc</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600 }}>
                  Storage Provider:
                  <select
                    style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                    value={importProvider}
                    onChange={(e) => setImportProvider(e.target.value as any)}
                  >
                    <option value="jettythunder">⚡ JettyThunder S3 (`jettythunder.app`)</option>
                    <option value="gdrive">📁 Google Drive</option>
                  </select>
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600 }}>
                Direct CDN / Shared Link (Optional):
                <input
                  style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="e.g. https://jettythunder.app/v/file.mp4"
                />
              </label>
            </div>

            <button className="place-button" type="button" disabled={!importTitle.trim()} onClick={handleImportSubmit}>
              <Check size={16} /> Import & Attach to Task Arcade
            </button>
          </div>
        </div>
      )}

      {/* JettyThunder Video Player Modal */}
      {activeMedia && (
        <div className="build-modal-overlay" onClick={() => setActiveMedia(null)}>
          <div className="build-modal" role="dialog" style={{ maxWidth: 640, background: "#0f172a", color: "#fff" }} onClick={(e) => e.stopPropagation()}>
            <button className="build-modal-close" type="button" onClick={() => setActiveMedia(null)} style={{ color: "#fff" }}><X size={18} /></button>
            <div className="build-modal-eyebrow" style={{ color: "#3fa3df" }}><Sparkles size={15} /> JettyThunder S3 CDN Player</div>
            <h2 className="build-modal-title" style={{ color: "#fff" }}>{activeMedia.title}</h2>

            <div style={{ height: 260, background: activeMedia.previewColor, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "16px 0", position: "relative" }}>
              <div style={{ textAlign: "center" }}>
                <Play size={48} color="#fff" />
                <div style={{ marginTop: 8, fontWeight: 700, fontSize: 14 }}>Streaming 4K Video Draft</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{activeMedia.cdnUrl}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#94a3b8" }}>
              <span>Resolution: {activeMedia.resolution}</span>
              <span>Bitrate: 18.4 Mbps (H.264)</span>
              <span>Creator: {activeMedia.creator}</span>
            </div>

            <button
              className="place-button"
              type="button"
              style={{ marginTop: 16, background: "#3fa3df" }}
              onClick={() => copyCdnLink(activeMedia)}
            >
              <Check size={16} /> Copy JettyThunder Video URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type ResearchAttachment = {
  id: string;
  type: 'url' | 'note';
  source: string;
  title?: string;
  timestamp: string;
};

type BrainstormItem = {
  id: string;
  author: string;
  category: string;
  title: string;
  scriptDetails?: string;
  researchNotes?: ResearchAttachment[];
};

const INITIAL_BRAINSTORM_ITEMS: BrainstormItem[] = [
  { id: "b-1", author: "Peter", category: "Content", title: "News Day Format", scriptDetails: "Daily digest of viral news filtered through CleanPuff commentary." },
  { id: "b-2", author: "Peter", category: "Project", title: "Celeb Roasting (Guest of the Week)", scriptDetails: "Weekly satirical roasting of trending internet celebrities." },
  { id: "b-3", author: "Peter", category: "Community", title: "Film Posters (Puffdom Parody)", scriptDetails: "Reimagining iconic movie posters with CleanPuff characters." },
  { id: "b-4", author: "Peter", category: "Community", title: "Key Fart Phrases & Limericks", scriptDetails: "Funny rhyming limericks and catchphrases for community memes." },
  { id: "b-5", author: "Peter", category: "Community", title: "Find the Object (Houses of Puffdom)", scriptDetails: "Interactive 'Where's Waldo' style image search in Puffdom houses." },
  { id: "b-6", author: "Bryan", category: "Content", title: "Political News Parody", scriptDetails: "Satirical take on political news from the Puffdom parliament." },
  { id: "b-7", author: "Bryan", category: "Community", title: "Where's Waldo Puffdom Edition", scriptDetails: "Large scale hidden character challenge across 3D Task Arcade worlds." },
  { id: "b-8", author: "Artem", category: "Design", title: "Comic Books (Sheet Format)", scriptDetails: "Multi-panel comic strips highlighting character adventures." },
  { id: "b-9", author: "Artem", category: "Story", title: "What If? Styles & Text", scriptDetails: "Alternate universe explorations of Puffdom characters." },
  { id: "b-10", author: "Artem", category: "Lore", title: "Puffdom Holidays, Lore & Religion", scriptDetails: "Deep lore articles, festival holidays, and artifact origins." },
  { id: "b-11", author: "Artem", category: "Lore", title: "Character Fact Files & Backstage", scriptDetails: "Behind the scenes character bio cards and stats." },
  { id: "b-12", author: "Richard", category: "Script", title: "Princess Puff's Unhinged Stream Invasion", scriptDetails: "Princess Puff’s stream is invaded by an endless scroll of increasingly unhinged viewer demands. Airabella begins reading them aloud in a sultry voice. General Puff tries to impose order and ends up arguing with a comment that simply says 'tutu.' Prep answers every request with a new snack recipe. Shogun challenges the entire comment section to single combat. Rosie sits on the keyboard and generates only the letter Q for four straight minutes. The stream concludes with Puff floating gently in a golden Clean Puff bubble, whispering, 'This is still content.'" },
  { id: "b-13", author: "Richard", category: "Script", title: "Sir Gas & The Throne of Smoke", scriptDetails: "Sir Gas attempts a solemn royal address while seated on the Throne of Smoke. The seat has been secretly lubricated by Methania 'for dramatic effect.' Mid-sentence he begins to slide. He pretends it is intentional. By the third sentence he is doing a slow, wet 360-degree spin while still trying to look menacing. CropDuster flies past the window and skywrites 'SLIPPERY WHEN WET.' Sir Gas finishes the speech upside-down, crown askew, insisting the Realm has never been more stable." }
];

const TASK_CATEGORY_ACTIONS: Record<string, { label: string; icon: string; actionKey: string }[]> = {
  Script: [
    { label: "🎬 View AI Storyboard", icon: "🎬", actionKey: "script" },
    { label: "🎙️ Render AI Voiceover", icon: "🎙️", actionKey: "voiceover" },
    { label: "🎥 Push to FCP/CapCut Pipeline", icon: "🎥", actionKey: "nle" },
    { label: "🚀 Convert to Task (+30 pts)", icon: "🚀", actionKey: "task" }
  ],
  Design: [
    { label: "🎨 Request Art Review (@Artem)", icon: "🎨", actionKey: "art_review" },
    { label: "🖼️ Export 4K Banner Assets", icon: "🖼️", actionKey: "export_art" },
    { label: "📦 Sync to Seagate S3 Vault", icon: "📦", actionKey: "s3" },
    { label: "🚀 Convert to Task (+30 pts)", icon: "🚀", actionKey: "task" }
  ],
  Content: [
    { label: "👔 Request CMO Approval (@Peter)", icon: "👔", actionKey: "cmo_approval" },
    { label: "📲 Queue in Social Scheduler", icon: "📲", actionKey: "schedule" },
    { label: "📢 Generate Viral Hooks", icon: "📢", actionKey: "hooks" },
    { label: "🚀 Convert to Task (+30 pts)", icon: "🚀", actionKey: "task" }
  ],
  Project: [
    { label: "⚖️ General Counsel Review (@Bryan)", icon: "⚖️", actionKey: "legal_review" },
    { label: "🤖 Dispatch Brief to Quartermaster", icon: "🤖", actionKey: "qm" },
    { label: "📦 Pin to Seagate S3 Vault", icon: "📦", actionKey: "s3" },
    { label: "🚀 Convert to Task (+30 pts)", icon: "🚀", actionKey: "task" }
  ],
  Community: [
    { label: "🏰 Launch 3D Arcade Challenge", icon: "🏰", actionKey: "arcade" },
    { label: "🤖 Auto-Assign via Quartermaster", icon: "🤖", actionKey: "qm" },
    { label: "🚀 Convert to Task (+30 pts)", icon: "🚀", actionKey: "task" }
  ]
};

// Default fallback actions for uncategorized nodes
const DEFAULT_TASK_ACTIONS = [
  { label: "🚀 Convert to Task (+30 pts)", icon: "🚀", actionKey: "task" },
  { label: "🤖 Dispatch Brief to Quartermaster", icon: "🤖", actionKey: "qm" },
  { label: "📦 Pin to Seagate S3 Vault", icon: "📦", actionKey: "s3" },
];

// Wire routing: determines which action fires on the TARGET node based on source category
const WIRE_ROUTE_MAP: Record<string, { actionKey: string; label: string; color: string }> = {
  Script:    { actionKey: "nle",          label: "🎥 NLE Pipeline",       color: "#a78bfa" },
  Design:    { actionKey: "art_review",   label: "🎨 Art Review",         color: "#4f90df" },
  Content:   { actionKey: "schedule",     label: "📲 Schedule Post",      color: "#e9627a" },
  Project:   { actionKey: "qm",           label: "🤖 QM Dispatch",       color: "#efad32" },
  Community: { actionKey: "arcade",       label: "🏰 Arcade Challenge",  color: "#2dd4bf" },
  Story:     { actionKey: "script",       label: "🎬 Storyboard",        color: "#f472b6" },
  Lore:      { actionKey: "s3",           label: "📦 S3 Archive",        color: "#78716c" },
};
const DEFAULT_WIRE_ROUTE = { actionKey: "task", label: "🚀 Task", color: "var(--primary-mint)" };

type WireConnection = { id: string; from: string; to: string; routeAction: string; routeLabel: string; routeColor: string; active?: boolean };

// Micro Tool Panel: 6-8px icon actions inferred from card category + content structure
const TOOL_PANEL: Record<string, { icon: string; tip: string; actionKey: string }[]> = {
  Script: [
    { icon: "🎬", tip: "AI Storyboard",      actionKey: "script" },
    { icon: "🎙️", tip: "AI Voiceover",       actionKey: "voiceover" },
    { icon: "✂️", tip: "Edit Script",         actionKey: "edit" },
    { icon: "🎥", tip: "NLE Pipeline",        actionKey: "nle" },
    { icon: "📋", tip: "Copy Brief",          actionKey: "copy" },
    { icon: "📌", tip: "Pin to Board",        actionKey: "pin" },
  ],
  Design: [
    { icon: "🎨", tip: "Art Review (@Artem)", actionKey: "art_review" },
    { icon: "🖼️", tip: "Export 4K Assets",   actionKey: "export_art" },
    { icon: "📐", tip: "Resize Format",       actionKey: "resize" },
    { icon: "🎯", tip: "Thumbnail Gen",       actionKey: "thumbnail" },
    { icon: "📦", tip: "S3 Vault Sync",       actionKey: "s3" },
    { icon: "📋", tip: "Copy Brief",          actionKey: "copy" },
  ],
  Content: [
    { icon: "👔", tip: "CMO Approval",        actionKey: "cmo_approval" },
    { icon: "📲", tip: "Schedule Post",        actionKey: "schedule" },
    { icon: "📢", tip: "Viral Hooks",          actionKey: "hooks" },
    { icon: "📊", tip: "Reach Forecast",       actionKey: "forecast" },
    { icon: "🔗", tip: "Share Link",           actionKey: "share" },
    { icon: "📋", tip: "Copy Brief",           actionKey: "copy" },
  ],
  Project: [
    { icon: "⚖️", tip: "Legal Review",        actionKey: "legal_review" },
    { icon: "🤖", tip: "QM Dispatch",          actionKey: "qm" },
    { icon: "📦", tip: "S3 Archive",           actionKey: "s3" },
    { icon: "📎", tip: "Attach Docs",          actionKey: "attach" },
    { icon: "🔗", tip: "Share Link",           actionKey: "share" },
    { icon: "📋", tip: "Copy Brief",           actionKey: "copy" },
  ],
  Community: [
    { icon: "🏰", tip: "Arcade Challenge",    actionKey: "arcade" },
    { icon: "💬", tip: "Open Discussion",      actionKey: "discuss" },
    { icon: "🗳️", tip: "Create Poll",         actionKey: "poll" },
    { icon: "🤖", tip: "QM Auto-Assign",       actionKey: "qm" },
    { icon: "📋", tip: "Copy Brief",           actionKey: "copy" },
    { icon: "📌", tip: "Pin to Board",         actionKey: "pin" },
  ],
  Story: [
    { icon: "🎬", tip: "AI Storyboard",       actionKey: "script" },
    { icon: "✏️", tip: "Edit Narrative",       actionKey: "edit" },
    { icon: "🎙️", tip: "AI Voiceover",       actionKey: "voiceover" },
    { icon: "🖼️", tip: "Scene Art",          actionKey: "art_review" },
    { icon: "📋", tip: "Copy Brief",           actionKey: "copy" },
    { icon: "📌", tip: "Pin to Board",         actionKey: "pin" },
  ],
  Lore: [
    { icon: "📖", tip: "Lore Wiki Entry",     actionKey: "script" },
    { icon: "🎨", tip: "Character Art",        actionKey: "art_review" },
    { icon: "📦", tip: "S3 Archive",           actionKey: "s3" },
    { icon: "🔗", tip: "Share Link",           actionKey: "share" },
    { icon: "📋", tip: "Copy Brief",           actionKey: "copy" },
    { icon: "📌", tip: "Pin to Board",         actionKey: "pin" },
  ],
};
const DEFAULT_TOOL_PANEL = [
  { icon: "🚀", tip: "Convert to Task",       actionKey: "task" },
  { icon: "🤖", tip: "QM Dispatch",            actionKey: "qm" },
  { icon: "📦", tip: "S3 Vault",               actionKey: "s3" },
  { icon: "📋", tip: "Copy Brief",             actionKey: "copy" },
  { icon: "📌", tip: "Pin to Board",           actionKey: "pin" },
];

type CharacterSheet = {
  id: string;
  name: string;
  alias: string;
  file: string;
  category: string;
  author: string;
  keywords: string[];
};

const CHARACTER_REFERENCE_SHEETS: CharacterSheet[] = [
  { id: "sir-gas", name: "Sir Gas", alias: "Prince of Profit & Pollution", file: "/char-refs/SirGas-256-ref.png", category: "Script", author: "Richard", keywords: ["gas", "stink", "sir gas", "throne"] },
  { id: "princess-puff", name: "Princess Puff", alias: "Airabella & Royalty", file: "/char-refs/Princess-Puff-256-ref.png", category: "Script", author: "Richard", keywords: ["princess", "puff", "stream"] },
  { id: "airabella", name: "Airabella", alias: "Sultry Stream Host", file: "/char-refs/Airabella-256-ref.png", category: "Script", author: "Peter", keywords: ["airabella", "sultry", "host"] },
  { id: "shogun-shiba", name: "Shogun Shiba", alias: "Master of Single Combat", file: "/char-refs/ShogunShiba-256-ref.png", category: "Design", author: "Artem", keywords: ["shogun", "shiba", "combat"] },
  { id: "methania", name: "Methania", alias: "Volatile Gas Alchemist", file: "/char-refs/Methania-256-ref.png", category: "Design", author: "Artem", keywords: ["methania", "alchemist", "gas"] },
  { id: "prep-the-frog", name: "Prep the Frog", alias: "Culinary Snack Master", file: "/char-refs/Prep-the-frog-256-ref.png", category: "Community", author: "Peter", keywords: ["prep", "frog", "snack", "recipe"] },
  { id: "crop-duster", name: "CropDuster", alias: "Skywriting Aviator", file: "/char-refs/CropDuster-256-ref.png", category: "Content", author: "Bryan", keywords: ["cropduster", "crop", "duster", "skywrite"] },
  { id: "flatulus", name: "Flatulus", alias: "Heavyweight Gas Lord", file: "/char-refs/Flatulus-256-ref.png", category: "Content", author: "Bryan", keywords: ["flatulus", "villain", "gas lord"] },
  { id: "knight-of-question", name: "Knight of Question", alias: "Puffdom Sentinel", file: "/char-refs/Knight-of-question-256-ref.png", category: "Project", author: "Bryan", keywords: ["knight", "question", "sentinel"] },
  { id: "maximus", name: "Maximus", alias: "Royal Guard Captain", file: "/char-refs/Maximus-256-ref.png", category: "Project", author: "Peter", keywords: ["maximus", "captain", "guard"] },
  { id: "prince-of-fartness", name: "Prince of Fartness", alias: "Heir Apparent", file: "/char-refs/Prince-of-fartness-256-ref.png", category: "Lore", author: "Artem", keywords: ["prince", "fartness", "heir"] },
  { id: "queen-mom-airelyyn", name: "Queen Mom Airelyyn", alias: "Royal Matriarch", file: "/char-refs/Queen-Mom-Airelyyn-256-ref.png", category: "Lore", author: "Artem", keywords: ["queen", "airelyyn", "mom", "matriarch"] },
  { id: "romeo", name: "Romeo", alias: "Puffdom Rogue", file: "/char-refs/Romeo-256-ref.png", category: "Community", author: "Peter", keywords: ["romeo", "rogue", "rose"] },
  { id: "genpuf", name: "GenPuf", alias: "Supreme Commander", file: "/char-refs/GenPuf-r256-ref.png", category: "Project", author: "Peter", keywords: ["genpuf", "general", "commander"] },
];

function CreativeBacklogTab() {
  const [items, setItems] = useState<BrainstormItem[]>(INITIAL_BRAINSTORM_ITEMS);
  const [filterAuthor, setFilterAuthor] = useState<string>("all");
  const [activeScript, setActiveScript] = useState<BrainstormItem | null>(null);
  const [compactMode, setCompactMode] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);

  const [researchUrlInput, setResearchUrlInput] = useState("");
  const [researchTextInput, setResearchTextInput] = useState("");
  const [researchModeTab, setResearchModeTab] = useState<'link' | 'text'>('link');

  const addResearchAttachment = (itemId: string, type: 'url' | 'note', rawValue: string) => {
    if (!rawValue.trim()) return;
    const newAttach: ResearchAttachment = {
      id: `att-${Date.now()}`,
      type,
      source: rawValue.trim(),
      title: type === 'url' ? `Research Link (${rawValue.trim().replace(/^https?:\/\//, '').split('/')[0]})` : `Research Note`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedNotes = [...(item.researchNotes || []), newAttach];
        const updatedItem = { ...item, researchNotes: updatedNotes };
        if (activeScript?.id === itemId) {
          setActiveScript(updatedItem);
        }
        return updatedItem;
      }
      return item;
    }));

    setResearchUrlInput("");
    setResearchTextInput("");
    setActionFeedback(`📚 Attached Research ${type === 'url' ? 'Link' : 'Notes'} to Idea!`);
    setTimeout(() => setActionFeedback(null), 3000);
  };
  const [showCharVault, setShowCharVault] = useState(false);
  const [activeCharSheet, setActiveCharSheet] = useState<CharacterSheet | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [userRole, setUserRole] = useState<string>("Executive");
  const [questPointsAwarded, setQuestPointsAwarded] = useState(false);

  // Auto-aligned spatial node positions (Structured Pipeline Columns)
  const calculateAutoPositions = (itemList: BrainstormItem[], isCompact: boolean) => {
    const pos: Record<string, { x: number; y: number }> = {};
    const colWidth = isCompact ? 290 : 360;
    const rowHeight = isCompact ? 80 : 260;
    const cols = 3;

    itemList.forEach((item, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      pos[item.id] = {
        x: 20 + col * colWidth,
        y: 20 + row * rowHeight,
      };
    });
    return pos;
  };

  const autoAlignCanvas = () => {
    setNodePositions(calculateAutoPositions(items, compactMode));
    setActionFeedback("⚡ Auto-Aligned all workflow nodes cleanly!");
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const toggleCompactMode = () => {
    const nextCompact = !compactMode;
    setCompactMode(nextCompact);
    setNodePositions(calculateAutoPositions(items, nextCompact));
    setActionFeedback(nextCompact ? "🔍 Switched to Compact Micro-Node View!" : "📖 Switched to Full Expanded Card View!");
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(() =>
    calculateAutoPositions(INITIAL_BRAINSTORM_ITEMS, true)
  );

  const [draggingCard, setDraggingCard] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [activeActionMenuNodeId, setActiveActionMenuNodeId] = useState<string | null>(null);

  const executePresetAction = (actionKey: string, item: BrainstormItem) => {
    setActiveActionMenuNodeId(null);
    if (actionKey === 'task') {
      convertToTask(item);
      setActionFeedback(`🚀 Converted "${item.title}" to 3D Arcade Task! (+30 pts)`);
    } else if (actionKey === 'script') {
      setActiveScript(item);
    } else if (actionKey === 'voiceover') {
      setActionFeedback(`🎙️ AI Voiceover render dispatched for "${item.title}"`);
    } else if (actionKey === 'nle') {
      setActionFeedback(`🎥 Pushed "${item.title}" → FCP / CapCut NLE Pipeline`);
    } else if (actionKey === 'art_review') {
      setActionFeedback(`🎨 Art review brief sent to @Artem for "${item.title}"`);
    } else if (actionKey === 'export_art') {
      setActionFeedback(`🖼️ Exported 4K banner assets → Lyve S3 for "${item.title}"`);
    } else if (actionKey === 'cmo_approval') {
      setActionFeedback(`👔 CMO marketing clearance requested from @Peter for "${item.title}"`);
    } else if (actionKey === 'schedule') {
      setActionFeedback(`📲 Queued "${item.title}" → Social HQ Content Calendar`);
    } else if (actionKey === 'hooks') {
      setActionFeedback(`📢 Generated 3 viral hooks (9:16 short) for "${item.title}"`);
    } else if (actionKey === 'legal_review') {
      setActionFeedback(`⚖️ DAO governance brief → General Counsel @Bryan for "${item.title}"`);
    } else if (actionKey === 'qm') {
      setActionFeedback(`🤖 Dispatched task prompt → Quartermaster AI for "${item.title}"`);
    } else if (actionKey === 's3') {
      setActionFeedback(`📦 Pinned "${item.title}" metadata → Seagate Lyve S3 Vault`);
    } else if (actionKey === 'arcade') {
      convertToTask(item);
      setActionFeedback(`🏰 Launched 3D Arcade Challenge for "${item.title}"!`);
    } else if (actionKey === 'copy') {
      navigator.clipboard?.writeText(`[${item.category}] ${item.title}: ${item.scriptDetails || item.title}`);
      setActionFeedback(`📋 Brief copied to clipboard: "${item.title}"`);
    } else if (actionKey === 'pin') {
      setActionFeedback(`📌 Pinned "${item.title}" to Visual Workflow Board`);
    } else if (actionKey === 'share') {
      navigator.clipboard?.writeText(`https://jettythunder.app/workflow/${item.id}`);
      setActionFeedback(`🔗 Share link copied for "${item.title}"`);
    } else if (actionKey === 'edit') {
      setActiveScript(item);
      setActionFeedback(`✏️ Opened editor for "${item.title}"`);
    } else if (actionKey === 'resize') {
      setActionFeedback(`📐 Resize dialog queued for "${item.title}" assets`);
    } else if (actionKey === 'thumbnail') {
      setActionFeedback(`🎯 AI Thumbnail generation dispatched for "${item.title}"`);
    } else if (actionKey === 'forecast') {
      setActionFeedback(`📊 Reach forecast model running for "${item.title}"…`);
    } else if (actionKey === 'discuss') {
      setActionFeedback(`💬 Discussion thread opened for "${item.title}"`);
    } else if (actionKey === 'poll') {
      setActionFeedback(`🗳️ Community poll created for "${item.title}"`);
    } else if (actionKey === 'attach') {
      setActionFeedback(`📎 Document attachment pane opened for "${item.title}"`);
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Active Wires / Connections between Nodes (with route actions)
  const [connections, setConnections] = useState<WireConnection[]>([
    { id: 'c1', from: 'b-1', to: 'b-2', routeAction: 'schedule', routeLabel: '📲 Schedule Post', routeColor: '#e9627a' },
    { id: 'c2', from: 'b-2', to: 'b-12', routeAction: 'qm', routeLabel: '🤖 QM Dispatch', routeColor: '#efad32' },
    { id: 'c3', from: 'b-13', to: 'b-14', routeAction: 'nle', routeLabel: '🎥 NLE Pipeline', routeColor: '#a78bfa' },
  ]);

  // Live Cable Drag State
  const [cableStart, setCableStart] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle Card Drag Start
  const onCardMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const pos = nodePositions[id] || { x: 50, y: 50 };
    setDraggingCard({ id, offsetX: e.clientX - pos.x, offsetY: e.clientY - pos.y });
  };

  // Handle Canvas Mouse Move
  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    setMousePos({ x: curX, y: curY });

    if (draggingCard) {
      setNodePositions(prev => ({
        ...prev,
        [draggingCard.id]: {
          x: Math.max(10, e.clientX - draggingCard.offsetX),
          y: Math.max(10, e.clientY - draggingCard.offsetY),
        }
      }));
    }
  };

  const onCanvasMouseUp = () => {
    setDraggingCard(null);
    setCableStart(null);
  };

  // Start Cable Drag from Green Output Port
  const startCableDrag = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const nodePos = nodePositions[nodeId] || { x: 100, y: 100 };
    setCableStart({ nodeId, x: nodePos.x + 330, y: nodePos.y + 24 });
  };

  // Connect Cable to Red Input Port — auto-determines route action from source category
  const dropCable = (e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    if (!cableStart) return;

    if (cableStart.nodeId === targetNodeId) {
      setActionFeedback("⚠️ Cannot connect a node to itself.");
      setCableStart(null);
      return;
    }

    const connId = `conn-${cableStart.nodeId}-${targetNodeId}`;
    if (connections.some(c => c.from === cableStart.nodeId && c.to === targetNodeId)) {
      setActionFeedback("ℹ️ Nodes are already connected!");
      setCableStart(null);
      return;
    }

    // Determine wire route from source node's category
    const sourceItem = items.find(i => i.id === cableStart.nodeId);
    const route = sourceItem ? (WIRE_ROUTE_MAP[sourceItem.category] || DEFAULT_WIRE_ROUTE) : DEFAULT_WIRE_ROUTE;

    setConnections(prev => [...prev, {
      id: connId,
      from: cableStart.nodeId,
      to: targetNodeId,
      routeAction: route.actionKey,
      routeLabel: route.label,
      routeColor: route.color
    }]);
    const targetItem = items.find(i => i.id === targetNodeId);
    setActionFeedback(`⚡ Wired: ${sourceItem?.title || cableStart.nodeId} ➔ ${route.label} ➔ ${targetItem?.title || targetNodeId}`);
    setCableStart(null);
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const removeCable = (connId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
    setActionFeedback("✂️ Wire connection severed.");
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Run Sequential Workflow Execution — fires real route actions on target nodes
  const runWorkflow = () => {
    setIsRunningPipeline(true);
    setActionFeedback("▶ Executing Visual Workflow Pipeline...");

    // Topologically sort connections (simple: process in order)
    let delay = 0;
    connections.forEach((conn) => {
      setTimeout(() => {
        setConnections(prev => prev.map(c => c.id === conn.id ? { ...c, active: true } : c));
        const fromItem = items.find(i => i.id === conn.from);
        const toItem = items.find(i => i.id === conn.to);
        if (fromItem && toItem) {
          setActionFeedback(`⚡ ${conn.routeLabel}: ${fromItem.title} ➔ ${toItem.title}`);
          // Fire the real preset action on the target node
          executePresetAction(conn.routeAction, toItem);
        }
      }, delay);

      delay += 1500;

      setTimeout(() => {
        setConnections(prev => prev.map(c => c.id === conn.id ? { ...c, active: false } : c));
      }, delay + 400);
    });

    setTimeout(() => {
      setIsRunningPipeline(false);
      setActionFeedback(`✅ Pipeline Complete! ${connections.length} route actions executed across ${new Set(connections.map(c => c.to)).size} nodes.`);
      setTimeout(() => setActionFeedback(null), 5000);
    }, delay + 600);
  };

  const convertToTask = (item: BrainstormItem) => {
    const newTask = {
      id: `task-${Date.now()}`,
      sprint_id: "sprint-1",
      title: `${item.title} (${item.category})`,
      assignee: "peter@cleanpuff.io",
      assigner: "jq@cleanpuff.io",
      points: 30,
      status: "assigned",
      created_at: new Date().toISOString(),
    };
    try {
      const data = localStorage.getItem("task_arcade_mock_store_v4");
      if (data) {
        const parsed = JSON.parse(data);
        parsed.tasks = [newTask, ...(parsed.tasks || [])];
        localStorage.setItem("task_arcade_mock_store_v4", JSON.stringify(parsed));
      }
    } catch (_) {}
    setConvertedIds((prev) => new Set(prev).add(item.id));
  };

  const syncGoogleSheet = async () => {
    setSyncing(true);
    try {
      const res = await fetch("https://docs.google.com/spreadsheets/d/1gooudrA7fQM_89aMlvAsl9aIFGFfPfbFGscFH42pf10/export?format=csv&gid=693860134");
      if (res.ok) {
        const csvText = await res.text();
        const lines = csvText.split("\n").filter((l) => l.trim().length > 0);
        const newItems: BrainstormItem[] = [];
        let currentAuthor = "Team";
        lines.slice(1).forEach((line, idx) => {
          const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
          if (cols[0]) currentAuthor = cols[0];
          const category = cols[1] || "Concept";
          const title = cols[2];
          if (title && title.length > 2) {
            newItems.push({
              id: `sheet-${idx}`,
              author: currentAuthor,
              category,
              title,
              scriptDetails: title.length > 40 ? title : undefined,
            });
          }
        });
        if (newItems.length > 0) {
          setItems(newItems);
          setNodePositions(calculateAutoPositions(newItems, compactMode));
        }
      }
    } catch (e) {
      console.warn("Sheet sync fallback");
    } finally {
      setSyncing(false);
    }
  };

  const filteredItems = items.filter(
    (item) => filterAuthor === "all" || item.author.toLowerCase() === filterAuthor.toLowerCase()
  );

  return (
    <div style={{ width: "100%", paddingBottom: 40, userSelect: "none" }}>
      {/* VISUAL WORKFLOW CANVAS HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={18} color="var(--primary-mint)" /> Visual Workflow Engine
            <span style={{ fontSize: 10, background: "var(--primary-mint)", color: "var(--bg-primary)", padding: "2px 8px", borderRadius: 4, fontWeight: 800 }}>
              ENTERPRISE PIPELINE ACTIVE
            </span>
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: 12 }}>
            Interactive node graph canvas. Connect output ports to input ports to structure automated sprint workflows.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => { setOnboardingStep(1); setShowOnboarding(true); }}
            style={{
              background: "rgba(47, 141, 77, 0.15)",
              color: "var(--primary-mint)",
              border: "1px solid var(--primary-mint)",
              borderRadius: 6,
              padding: "8px 12px",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            ✨ Guided Quest (+75 pts)
          </button>

          <button
            type="button"
            onClick={() => setShowCharVault(true)}
            style={{
              background: "var(--bg-secondary)",
              color: "#a78bfa",
              border: "1px solid #a78bfa80",
              borderRadius: 6,
              padding: "8px 12px",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            🎨 Character Vault (14)
          </button>

          <button
            type="button"
            onClick={toggleCompactMode}
            style={{
              background: compactMode ? "var(--primary-mint)" : "var(--bg-secondary)",
              color: compactMode ? "var(--bg-primary)" : "var(--text-primary)",
              border: "1px solid var(--border-light)",
              borderRadius: 6,
              padding: "8px 12px",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            {compactMode ? "🔍 Compact Micro View" : "📖 Full Expanded View"}
          </button>

          <button
            type="button"
            onClick={autoAlignCanvas}
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-light)", borderRadius: 6, padding: "8px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            ⚡ Auto-Align
          </button>

          <button
            type="button"
            onClick={runWorkflow}
            disabled={isRunningPipeline}
            style={{
              background: isRunningPipeline ? "var(--bg-secondary)" : "var(--primary-mint)",
              color: isRunningPipeline ? "var(--text-muted)" : "var(--bg-primary)",
              border: "none",
              borderRadius: 6,
              padding: "8px 16px",
              fontWeight: 800,
              fontSize: 12,
              cursor: isRunningPipeline ? "default" : "pointer",
              boxShadow: isRunningPipeline ? "none" : "0 2px 10px rgba(47, 141, 77, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            ▶ Run Visual Pipeline
          </button>

          <button
            type="button"
            onClick={syncGoogleSheet}
            disabled={syncing}
            style={{ background: "var(--bg-glass-hover)", color: "var(--text-primary)", border: "1px solid var(--border-light)", borderRadius: 6, padding: "8px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} className={syncing ? "spin" : ""} /> {syncing ? "Sync Sheet" : "Sync Sheet"}
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div style={{ background: "rgba(47, 141, 77, 0.15)", border: "1px solid var(--primary-mint)", color: "var(--primary-mint)", borderRadius: 8, padding: "10px 14px", fontSize: 12, fontWeight: 800, marginBottom: 16 }}>
          {actionFeedback}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, background: "var(--bg-secondary)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-light)" }}>
        {["all", "Peter", "Bryan", "Artem", "Richard"].map((author) => (
          <button
            key={author}
            type="button"
            onClick={() => setFilterAuthor(author)}
            style={{
              background: filterAuthor === author ? "var(--primary-mint)" : "transparent",
              color: filterAuthor === author ? "var(--bg-primary)" : "var(--text-secondary)",
              border: "none",
              borderRadius: 4,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            {author === "all" ? "All Brainstormers" : `@${author}`}
          </button>
        ))}
      </div>

      {/* 🌐 2D VISUAL WORKFLOW CANVAS GRID */}
      <div
        ref={canvasRef}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        style={{
          position: "relative",
          width: "100%",
          minHeight: 760,
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px) 0 0 / 24px 24px, var(--bg-primary)",
          border: "1px solid var(--border-light)",
          borderRadius: 16,
          overflow: "auto",
          boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.4)"
        }}
      >
        {/* 🔗 SVG CABLE SPLINES LAYER */}
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 1200, pointerEvents: "none", zIndex: 1 }}>
          {connections.map((conn) => {
            const fromPos = nodePositions[conn.from] || { x: 100, y: 100 };
            const toPos = nodePositions[conn.to] || { x: 400, y: 100 };

            const cardWidth = compactMode ? 250 : 330;
            const x1 = fromPos.x + cardWidth;
            const y1 = fromPos.y + 24;
            const x2 = toPos.x;
            const y2 = toPos.y + 24;

            const dx = Math.max(40, Math.abs(x2 - x1) * 0.4);
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            return (
              <g key={conn.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={conn.active ? "#ffe1a4" : conn.routeColor}
                  strokeWidth={conn.active ? 4 : 2.5}
                  strokeDasharray={conn.active ? "8 4" : "none"}
                  style={{ filter: conn.active ? "drop-shadow(0 0 8px #ffe1a4)" : `drop-shadow(0 0 4px ${conn.routeColor})` }}
                />
                {/* Route Action Label Badge on Wire */}
                <rect
                  x={(x1 + x2) / 2 - 50}
                  y={(y1 + y2) / 2 - 10}
                  width={100}
                  height={20}
                  rx={6}
                  fill="var(--bg-secondary)"
                  stroke={conn.routeColor}
                  strokeWidth={1.5}
                  style={{ cursor: "pointer", pointerEvents: "all" }}
                  onClick={() => removeCable(conn.id)}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 + 4}
                  textAnchor="middle"
                  fill={conn.routeColor}
                  fontSize={9}
                  fontWeight={800}
                  style={{ pointerEvents: "none" }}
                >
                  {conn.routeLabel}
                </text>
              </g>
            );
          })}

          {/* Dynamic Dragging Cable Preview */}
          {cableStart && (
            <path
              d={`M ${cableStart.x} ${cableStart.y} C ${cableStart.x + 80} ${cableStart.y}, ${mousePos.x - 80} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
              fill="none"
              stroke="#ffe1a4"
              strokeWidth={3}
              strokeDasharray="6 4"
              style={{ filter: "drop-shadow(0 0 8px #ffe1a4)" }}
            />
          )}
        </svg>

        {/* 📦 SPATIAL NODE CARDS & COMPACT MICRO-NODES */}
        {filteredItems.map((item, idx) => {
          const isConverted = convertedIds.has(item.id);
          const authorColor = item.author === "Peter" ? "#e9627a" : item.author === "Artem" ? "#4f90df" : item.author === "Richard" ? "#a878e4" : "#efad32";
          
          const defaultPos = { x: 20 + (idx % 3) * (compactMode ? 290 : 360), y: 20 + Math.floor(idx / 3) * (compactMode ? 80 : 260) };
          const pos = nodePositions[item.id] || defaultPos;

          const incomingCount = connections.filter(c => c.to === item.id).length;
          const outgoingCount = connections.filter(c => c.from === item.id).length;

          const isHovered = hoveredNodeId === item.id;
          const isExpanded = !compactMode || isHovered;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredNodeId(item.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: isExpanded ? 330 : 250,
                background: "var(--bg-glass)",
                border: isConverted ? "2px solid var(--primary-mint)" : isHovered ? "2px solid var(--primary-mint)" : "1px solid var(--border-light)",
                borderRadius: 12,
                padding: isExpanded ? 14 : "8px 12px",
                boxShadow: isHovered ? "0 12px 36px rgba(0, 0, 0, 0.6)" : "0 4px 16px rgba(0, 0, 0, 0.25)",
                zIndex: isHovered ? 100 : 2,
                transform: isHovered && compactMode ? "scale(1.05)" : "scale(1)",
                transition: draggingCard?.id === item.id ? "none" : "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
            >
              {/* EMBEDDED RED INPUT PORT */}
              <div
                title="Click or drop cable here to connect input"
                onMouseUp={(e) => dropCable(e, item.id)}
                onClick={(e) => dropCable(e, item.id)}
                style={{
                  position: "absolute",
                  left: -8,
                  top: isExpanded ? 18 : 16,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: incomingCount > 0 ? "var(--primary-mint)" : "#f43f5e",
                  border: "2px solid var(--bg-primary)",
                  boxShadow: `0 0 8px ${incomingCount > 0 ? "var(--primary-mint)" : "#f43f5e"}`,
                  cursor: "pointer",
                  zIndex: 10
                }}
              />

              {/* EMBEDDED GREEN OUTPUT PORT */}
              <div
                title="Click and drag cable to connect output to another node"
                onMouseDown={(e) => startCableDrag(e, item.id)}
                onClick={(e) => startCableDrag(e, item.id)}
                style={{
                  position: "absolute",
                  right: -8,
                  top: isExpanded ? 18 : 16,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: outgoingCount > 0 ? "#ffe1a4" : "var(--primary-mint)",
                  border: "2px solid var(--bg-primary)",
                  boxShadow: outgoingCount > 0 ? "0 0 12px #ffe1a4" : "0 0 8px var(--primary-mint)",
                  cursor: "crosshair",
                  zIndex: 10
                }}
              />

              {/* DRAGGABLE NODE HEADER */}
              <div
                onMouseDown={(e) => onCardMouseDown(e, item.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: isExpanded ? 8 : 2,
                  borderBottom: isExpanded ? "1px stroke var(--border-light)" : "none",
                  paddingBottom: isExpanded ? 6 : 0,
                  cursor: "move"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, fontFamily: "monospace", color: "var(--primary-mint)", background: "var(--bg-secondary)", padding: "2px 6px", borderRadius: 4 }}>
                    NODE // {item.id.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: authorColor, background: "var(--bg-secondary)", padding: "2px 6px", borderRadius: 8, border: `1px solid ${authorColor}40` }}>
                  @{item.author} {item.author === "Peter" && "(CMO)"}
                </span>
              </div>

              {/* COMPACT VIEW TITLE ROW */}
              <h4 style={{ margin: 0, fontSize: isExpanded ? 13 : 11, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3, whiteSpace: isExpanded ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.title}
              </h4>

              {/* ⚙️ MICRO TOOL PANEL — tiny icon actions inferred from category */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                marginTop: 4,
                marginBottom: isExpanded ? 4 : 0,
                padding: "2px 3px",
                background: "var(--bg-secondary)",
                borderRadius: 6,
                border: "1px solid var(--border-light)",
                width: "fit-content",
              }}>
                {(TOOL_PANEL[item.category] || DEFAULT_TOOL_PANEL).map((tool) => (
                  <button
                    key={tool.actionKey}
                    type="button"
                    title={tool.tip}
                    onClick={(e) => { e.stopPropagation(); executePresetAction(tool.actionKey, item); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 18,
                      height: 18,
                      padding: 0,
                      margin: 0,
                      background: "transparent",
                      border: "1px solid transparent",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 8,
                      lineHeight: 1,
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.background = "var(--border-light)";
                      (e.target as HTMLButtonElement).style.borderColor = "var(--primary-mint)";
                      (e.target as HTMLButtonElement).style.transform = "scale(1.25)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.background = "transparent";
                      (e.target as HTMLButtonElement).style.borderColor = "transparent";
                      (e.target as HTMLButtonElement).style.transform = "scale(1)";
                    }}
                  >
                    {tool.icon}
                  </button>
                ))}
              </div>
              {/* EXPANDED CONTENT REVEAL (HOVER OR FULL VIEW) */}
              {isExpanded && (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, background: "var(--bg-secondary)", color: "var(--primary-mint)", border: "1px solid var(--border-light)", padding: "2px 6px", borderRadius: 4 }}>
                      {item.category}
                    </span>

                    {incomingCount > 0 && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(63, 163, 223, 0.15)", color: "#3fa3df", padding: "2px 6px", borderRadius: 4 }}>
                        IN: {incomingCount} Wires
                      </span>
                    )}
                    {outgoingCount > 0 && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(47, 141, 77, 0.15)", color: "var(--primary-mint)", padding: "2px 6px", borderRadius: 4 }}>
                        OUT: {outgoingCount} Wires
                      </span>
                    )}
                  </div>

                  {item.scriptDetails && (
                    <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {item.scriptDetails}
                    </p>
                  )}

                  {/* CARD CATEGORY PRESET ACTIONS FOOTER */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingTop: 6, borderTop: "1px dashed var(--border-light)" }}>
                    {(TASK_CATEGORY_ACTIONS[item.category] || DEFAULT_TASK_ACTIONS).map((act, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => executePresetAction(act.actionKey, item)}
                        style={{
                          flex: "1 1 auto",
                          background: act.actionKey === "task" ? (isConverted ? "var(--bg-secondary)" : "var(--primary-mint)") : "var(--bg-secondary)",
                          color: act.actionKey === "task" ? (isConverted ? "var(--text-muted)" : "var(--bg-primary)") : "var(--text-primary)",
                          border: "1px solid var(--border-light)",
                          borderRadius: 6,
                          padding: "5px 8px",
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: isConverted && act.actionKey === "task" ? "default" : "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {act.actionKey === "task" && isConverted ? "✓ Added Task" : act.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Script Storyboard Modal */}
      {activeScript && (
        <div className="build-modal-overlay" onClick={() => setActiveScript(null)}>
          <div className="build-modal" role="dialog" style={{ maxWidth: 780, background: "var(--bg-glass)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} onClick={(e) => e.stopPropagation()}>
            <button className="build-modal-close" type="button" onClick={() => setActiveScript(null)} style={{ color: "var(--text-primary)" }}><X size={18} /></button>
            <div className="build-modal-eyebrow" style={{ color: "var(--primary-mint)" }}><Sparkles size={15} /> AI Script & Storyboard Engine</div>
            <h2 className="build-modal-title" style={{ color: "var(--text-primary)", marginTop: 4 }}>{activeScript.title}</h2>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 12 }}>Author: @{activeScript.author} • Category: {activeScript.category}</div>

            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 8, padding: 16, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 16 }}>
              "{activeScript.scriptDetails}"
            </div>

            {/* 📚 RESEARCH & X.COM ATTACHMENTS DRAWER */}
            <div style={{ marginBottom: 16, padding: 14, background: "var(--bg-secondary)", border: "1px solid #3fa3df60", borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#3fa3df", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📚</span> Research & X.com Intel Notes ({activeScript.researchNotes?.length || 0})
                </div>
                <div style={{ display: "flex", gap: 4, background: "var(--bg-primary)", padding: 2, borderRadius: 6, border: "1px solid var(--border-light)" }}>
                  <button
                    type="button"
                    onClick={() => setResearchModeTab('link')}
                    style={{
                      background: researchModeTab === 'link' ? '#3fa3df' : 'transparent',
                      color: researchModeTab === 'link' ? '#000' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    🔗 Add Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setResearchModeTab('text')}
                    style={{
                      background: researchModeTab === 'text' ? '#3fa3df' : 'transparent',
                      color: researchModeTab === 'text' ? '#000' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    📝 Paste Notes
                  </button>
                </div>
              </div>

              {/* INPUT FORM BASED ON TAB */}
              {researchModeTab === 'link' ? (
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    type="url"
                    value={researchUrlInput}
                    onChange={(e) => setResearchUrlInput(e.target.value)}
                    placeholder="Paste x.com thread link, web article, or tweet URL..."
                    style={{ flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border-light)", borderRadius: 6, padding: "8px 12px", color: "var(--text-primary)", fontSize: 12 }}
                  />
                  <button
                    type="button"
                    disabled={!researchUrlInput.trim()}
                    onClick={() => addResearchAttachment(activeScript.id, 'url', researchUrlInput)}
                    style={{
                      background: researchUrlInput.trim() ? "#3fa3df" : "var(--bg-primary)",
                      color: researchUrlInput.trim() ? "#000" : "var(--text-muted)",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 14px",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: researchUrlInput.trim() ? "pointer" : "default"
                    }}
                  >
                    ⚡ Fetch & Link
                  </button>
                </div>
              ) : (
                <div style={{ marginBottom: 10 }}>
                  <textarea
                    value={researchTextInput}
                    onChange={(e) => setResearchTextInput(e.target.value)}
                    placeholder="Paste multi-line research notes, tweet transcriptions, or bullet points here..."
                    style={{ width: "100%", minHeight: 80, background: "var(--bg-primary)", border: "1px solid var(--border-light)", borderRadius: 6, padding: 10, color: "var(--text-primary)", fontSize: 12, lineHeight: 1.5, marginBottom: 6 }}
                  />
                  <button
                    type="button"
                    disabled={!researchTextInput.trim()}
                    onClick={() => addResearchAttachment(activeScript.id, 'note', researchTextInput)}
                    style={{
                      background: researchTextInput.trim() ? "#3fa3df" : "var(--bg-primary)",
                      color: researchTextInput.trim() ? "#000" : "var(--text-muted)",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 14px",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: researchTextInput.trim() ? "pointer" : "default"
                    }}
                  >
                    📌 Attach Notes to Idea
                  </button>
                </div>
              )}

              {/* ATTACHED ITEMS LIST */}
              {activeScript.researchNotes && activeScript.researchNotes.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {activeScript.researchNotes.map((att) => (
                    <div key={att.id} style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", borderRadius: 6, padding: 8, fontSize: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontWeight: 800, color: att.type === 'url' ? '#3fa3df' : 'var(--primary-mint)' }}>
                          {att.type === 'url' ? '🔗 URL Link' : '📝 Text Note'}
                        </span>
                        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{att.timestamp}</span>
                      </div>
                      {att.type === 'url' ? (
                        <a href={att.source} target="_blank" rel="noopener noreferrer" style={{ color: "#3fa3df", wordBreak: "break-all", fontWeight: 600 }}>
                          {att.source} ↗
                        </a>
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>{att.source}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Matched Character References */}
            {(() => {
              const text = `${activeScript.title} ${activeScript.scriptDetails || ""}`.toLowerCase();
              const matched = CHARACTER_REFERENCE_SHEETS.filter(c => c.keywords.some(k => text.includes(k)));
              if (matched.length === 0) return null;
              return (
                <div style={{ marginBottom: 16, padding: 12, background: "rgba(167, 139, 250, 0.1)", border: "1px solid #a78bfa50", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    🎨 Matched 256-Color Character References ({matched.length})
                  </div>
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                    {matched.map(char => (
                      <div
                        key={char.id}
                        onClick={() => setActiveCharSheet(char)}
                        style={{ cursor: "pointer", background: "var(--bg-secondary)", borderRadius: 6, padding: 6, border: "1px solid var(--border-light)", minWidth: 120, textAlign: "center" }}
                      >
                        <img src={char.file} alt={char.name} style={{ width: 110, height: 130, objectFit: "cover", borderRadius: 4, marginBottom: 4 }} />
                        <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-primary)" }}>{char.name}</div>
                        <div style={{ fontSize: 8, color: "var(--text-muted)" }}>{char.alias}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <button
              className="place-button"
              type="button"
              style={{ background: "var(--primary-mint)", color: "var(--bg-primary)" }}
              onClick={() => {
                convertToTask(activeScript);
                setActiveScript(null);
              }}
            >
              <Plus size={16} /> Assign Storyboard Task to @{activeScript.author} (30 pts)
            </button>
          </div>
        </div>
      )}

      {/* 256-Color Character Vault Modal */}
      {showCharVault && (
        <div className="build-modal-overlay" onClick={() => setShowCharVault(false)}>
          <div className="build-modal" role="dialog" style={{ maxWidth: 1000, width: "95vw", maxHeight: "90vh", overflowY: "auto", background: "var(--bg-glass)", border: "1px solid #a78bfa", color: "var(--text-primary)" }} onClick={(e) => e.stopPropagation()}>
            <button className="build-modal-close" type="button" onClick={() => setShowCharVault(false)} style={{ color: "var(--text-primary)" }}><X size={18} /></button>
            <div className="build-modal-eyebrow" style={{ color: "#a78bfa" }}><Sparkles size={15} /> Seagate Lyve S3 Asset Vault • Character Reference Sheets</div>
            <h2 className="build-modal-title" style={{ color: "var(--text-primary)", marginTop: 4 }}>Guardians of the Puff 2 — 256-Color Character Reference Vault</h2>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
              Production-ready high-res model sheets (`1024x1536` to `1722x2055`). Features 5-angle turnarounds, head studies, props, and lighting specs.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {CHARACTER_REFERENCE_SHEETS.map(char => (
                <div
                  key={char.id}
                  onClick={() => setActiveCharSheet(char)}
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 10,
                    padding: 10,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#a78bfa";
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-light)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <img
                    src={char.file}
                    alt={char.name}
                    style={{ width: "100%", height: 220, objectFit: "cover", objectPosition: "top", borderRadius: 8, marginBottom: 8 }}
                  />
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", textAlign: "center" }}>{char.name}</div>
                  <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginTop: 2, textAlign: "center" }}>{char.alias}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}>Ref Sheet • 256-Color PNG</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Character Lightbox Inspector Modal */}
      {activeCharSheet && (
        <div className="build-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setActiveCharSheet(null)}>
          <div className="build-modal" role="dialog" style={{ maxWidth: 1100, width: "95vw", maxHeight: "95vh", overflowY: "auto", background: "#0a0a0f", border: "1px solid #a78bfa", color: "#ffffff", padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <button className="build-modal-close" type="button" onClick={() => setActiveCharSheet(null)} style={{ color: "#ffffff" }}><X size={20} /></button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 10, background: "#a78bfa", color: "#000", fontWeight: 900, padding: "3px 8px", borderRadius: 4 }}>HIGH-RES MODEL SHEET</span>
                <h2 style={{ margin: "4px 0 0 0", fontSize: 20, fontWeight: 900, color: "#fff" }}>{activeCharSheet.name} — {activeCharSheet.alias}</h2>
              </div>
              <a
                href={activeCharSheet.file}
                target="_blank"
                rel="noreferrer"
                download={`${activeCharSheet.id}-ref.png`}
                style={{ background: "#a78bfa", color: "#000", padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 800, textDecoration: "none" }}
              >
                📥 Download Full 4K Ref Sheet
              </a>
            </div>

            <div style={{ display: "flex", justifyContent: "center", background: "#000", border: "1px solid #222", borderRadius: 8, padding: 10, overflow: "auto" }}>
              <img src={activeCharSheet.file} alt={activeCharSheet.name} style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: 4 }} />
            </div>
          </div>
        </div>
      )}

      {/* 🚀 GAMIFIED 4-STEP ONBOARDING QUEST MODAL */}
      {showOnboarding && (
        <div className="build-modal-overlay" style={{ zIndex: 10000 }} onClick={() => setShowOnboarding(false)}>
          <div className="build-modal" role="dialog" style={{ maxWidth: 720, width: "92vw", background: "var(--bg-glass)", border: "1px solid var(--primary-mint)", color: "var(--text-primary)", padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <button className="build-modal-close" type="button" onClick={() => setShowOnboarding(false)} style={{ color: "var(--text-primary)" }}><X size={18} /></button>

            {/* STEP PROGRESS INDICATOR */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color="var(--primary-mint)" />
                <span style={{ fontSize: 11, fontWeight: 900, color: "var(--primary-mint)", letterSpacing: "0.05em" }}>
                  CLEANPUFF REALM ONBOARDING QUEST • STEP {onboardingStep} OF 4
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4].map(s => (
                  <div
                    key={s}
                    style={{
                      width: 24,
                      height: 6,
                      borderRadius: 3,
                      background: s <= onboardingStep ? "var(--primary-mint)" : "var(--border-light)",
                      transition: "all 0.2s"
                    }}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: ROLE SELECTION */}
            {onboardingStep === 1 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 6px 0" }}>Welcome to CleanPuff Enterprise! 👋</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px 0" }}>
                  Select your primary team role to tailor your command center layout & automated AI workflows:
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
                  {[
                    { id: "Executive", title: "👔 Executive / CMO", handle: "@Peter", desc: "Marketing clearance, social calendar & viral forecasts" },
                    { id: "Design", title: "🎨 Creative / Worldbuilding", handle: "@Artem", desc: "256-color model sheets, art review & 4K banners" },
                    { id: "Animation", title: "🎥 NLE Video / Animation", handle: "@Richard", desc: "Script storyboards, AI voiceover & video pipelines" },
                    { id: "Legal", title: "⚖️ Legal / Governance", handle: "@Bryan", desc: "DAO briefs, IP clearance & regulatory signoffs" },
                    { id: "Ops", title: "🤖 Operations / Ops Leader", handle: "@JQ", desc: "Quartermaster AI dispatches & sprint point tracking" },
                  ].map(r => (
                    <div
                      key={r.id}
                      onClick={() => setUserRole(r.id)}
                      style={{
                        background: userRole === r.id ? "rgba(47, 141, 77, 0.15)" : "var(--bg-secondary)",
                        border: `2px solid ${userRole === r.id ? "var(--primary-mint)" : "var(--border-light)"}`,
                        borderRadius: 10,
                        padding: 14,
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{r.title}</div>
                      <div style={{ fontSize: 10, color: "var(--primary-mint)", fontWeight: 700, margin: "2px 0 6px 0" }}>{r.handle}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>{r.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(2)}
                    style={{ background: "var(--primary-mint)", color: "var(--bg-primary)", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 800, cursor: "pointer" }}
                  >
                    Continue to Quest 1 ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: VISUAL WORKFLOW QUEST */}
            {onboardingStep === 2 && (
              <div>
                <span style={{ fontSize: 10, background: "var(--primary-mint)", color: "#000", fontWeight: 900, padding: "2px 6px", borderRadius: 4 }}>QUEST 1</span>
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: "6px 0 6px 0" }}>Master the Visual Workflow Engine ⚡</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px 0" }}>
                  Connect output ports to input ports to build automated data splines across sprint nodes.
                </p>

                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>Core Capabilities You Just Unlocked:</div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    <li><strong>Color-Coded Bezier Cables</strong>: Wires auto-detect route actions (e.g. 🎥 NLE Pipeline, 🎨 Art Review).</li>
                    <li><strong>Micro Tool Panels</strong>: 6 instant icon actions on every node card (Compact & Full view).</li>
                    <li><strong>▶ Run Visual Pipeline</strong>: Sequentially executes connected nodes with live pulse animations.</li>
                  </ul>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button type="button" onClick={() => setOnboardingStep(1)} style={{ background: "transparent", color: "var(--text-muted)", border: "none", fontWeight: 700, cursor: "pointer" }}>← Back</button>
                  <button type="button" onClick={() => setOnboardingStep(3)} style={{ background: "var(--primary-mint)", color: "var(--bg-primary)", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 800, cursor: "pointer" }}>Continue to Quest 2 ➔</button>
                </div>
              </div>
            )}

            {/* STEP 3: CHARACTER VAULT QUEST */}
            {onboardingStep === 3 && (
              <div>
                <span style={{ fontSize: 10, background: "#a78bfa", color: "#000", fontWeight: 900, padding: "2px 6px", borderRadius: 4 }}>QUEST 2</span>
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: "6px 0 6px 0" }}>256-Color Character Vault 🎨</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px 0" }}>
                  Access 14 high-resolution model sheets (`1024x1536` to `1722x2055`) for Guardians of the Puff 2.
                </p>

                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10, marginBottom: 20 }}>
                  {CHARACTER_REFERENCE_SHEETS.slice(0, 5).map(c => (
                    <div key={c.id} style={{ minWidth: 110, background: "var(--bg-secondary)", borderRadius: 8, padding: 6, border: "1px solid var(--border-light)", textAlign: "center" }}>
                      <img src={c.file} alt={c.name} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 4, marginBottom: 4 }} />
                      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-primary)" }}>{c.name}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button type="button" onClick={() => setOnboardingStep(2)} style={{ background: "transparent", color: "var(--text-muted)", border: "none", fontWeight: 700, cursor: "pointer" }}>← Back</button>
                  <button
                    type="button"
                    onClick={() => {
                      setOnboardingStep(4);
                      setQuestPointsAwarded(true);
                      try { localStorage.setItem("has_visited_arcade_v1", "true"); } catch (_) {}
                    }}
                    style={{ background: "var(--primary-mint)", color: "var(--bg-primary)", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 800, cursor: "pointer" }}
                  >
                    Complete Quest & Claim 75 Pts 🎉
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS & REWARD */}
            {onboardingStep === 4 && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 42, marginBottom: 8 }}>🏆</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 6px 0", color: "var(--primary-mint)" }}>Onboarding Quest Completed!</h2>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
                  You earned <strong>+75 Sprint Points</strong> and unlocked your <strong>CleanPuff Realm Explorer</strong> badge as <strong>{userRole}</strong>!
                </p>

                <div style={{ background: "rgba(47, 141, 77, 0.15)", border: "1px solid var(--primary-mint)", borderRadius: 10, padding: 16, marginBottom: 24, textTransform: "none" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--primary-mint)" }}>🤖 Quartermaster AI is Active:</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    Text <strong>`#task`</strong> or <strong>`@quartermaster`</strong> to your Meta WhatsApp Webhook anytime to manage dispatches from your phone!
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOnboarding(false)}
                  style={{ background: "var(--primary-mint)", color: "var(--bg-primary)", border: "none", borderRadius: 8, padding: "12px 30px", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
                >
                  Enter Visual Workflow Engine 🚀
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

type MainTab = 'dashboard' | 'swarm' | 'playbook' | 'calendar' | 'trends' | 'generate' | 'drafts' | 'scheduled' | 'history' | 'toolkit' | 'vault' | 'brainstorm' | 'arcade' | 'quartermaster';

function App() {
  const [mainTab, setMainTab] = useState<MainTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setRefreshTick] = useState(0);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('cleanpuff_theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cleanpuff_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    seedDemoData();
  }, []);

  const [qmRoute, setQmRoute] = useState(() =>
    typeof window !== "undefined" && window.location.hash.replace(/^#\/?/, "") === "quartermaster",
  );
  useEffect(() => {
    const onHash = () => {
      setQmRoute(window.location.hash.replace(/^#\/?/, "") === "quartermaster");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const [activeTab, setActiveTab] = useState<AppTab>("world");
  const [worldZoom, setWorldZoom] = useState(60);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string; tone: "good" | "bad" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [taskView, setTaskView] = useState<"my" | "team">("my");
  // Optimistic overrides: show approve/reject result immediately before API confirms
  const [localStates, setLocalStates] = useState<Record<string, PlacementState>>({});
  const [cinematic, setCinematic] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("cinematic"),
  );
  const [scripted, setScripted] = useState<Placement[]>(() => cineSeed());
  // The cinematic walkthrough currently playing (chosen from the Demos tab).
  const [activeScript, setActiveScript] = useState<CineScript | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const [placingShimmer, setPlacingShimmer] = useState(false);
  const [optimisticPlacements, setOptimisticPlacements] = useState<Placement[]>([]);
  // Build picker: set when a task is cleared; carries the task title + its point tier.
  const [buildModal, setBuildModal] = useState<{ title: string; tier: Tier } | null>(null);
  // Tasks the member has marked done this session (drives the cleared check + hides "Mark done").
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());

  // Audio — Web Audio API for zero-latency, overlappable SFX. HTML5 <audio>.play()
  // has decode/dispatch lag and can't retrigger instantly; decoding each clip into
  // an AudioBuffer once and firing a fresh BufferSource per trigger removes the lag.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferCacheRef = useRef<Record<string, AudioBuffer>>({});
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  }, []);
  // Decode every known clip up front so the very first play has no decode latency.
  useEffect(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    Object.entries(SFX_URLS).forEach(([name, url]) => {
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((buf) => { bufferCacheRef.current[name] = buf; })
        .catch(() => {});
    });
  }, [getAudioCtx]);
  const playBuffer = useCallback(
    (name: string, volume: number) => {
      const ctx = audioCtxRef.current;
      const buf = bufferCacheRef.current[name];
      if (!ctx || !buf) return;
      // Browsers start the context suspended until a user gesture; resume on demand.
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      src.connect(gain).connect(ctx.destination);
      src.start(0);
    },
    [],
  );
  const playClick = useCallback(() => playBuffer("click", 0.5), [playBuffer]);
  const playShimmer = useCallback(() => playBuffer("shimmer", 0.85), [playBuffer]);
  // Cinematic SFX cues: beats reference a clip by name (add to SFX_URLS + a `sfx`
  // beat in demos.ts to wire a new cue). Unknown names no-op.
  const playSfx = useCallback((name: string) => playBuffer(name, 0.82), [playBuffer]);

  // ── Auth: current user ──
  const { user: authUser } = useAuth(client);
  const currentUserEmail = authUser?.email || (typeof window !== "undefined" && localStorage.getItem("task_arcade_mock_user")) || "rv@cleanpuff.io";
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  // ── Team members from pod ──
  const { records: teamMemberRecords, refresh: refreshTeamMembers } = useRecords<TeamMemberRow>({
    client,
    tableName: "team_members",
    limit: 100,
  });
  const teamMembers = useMemo(() => teamMemberRecords, [teamMemberRecords]);

  // Derive current user's role + display name from team_members
  const myMemberRow = useMemo(
    () => teamMembers.find((m) => m.email === currentUserEmail),
    [teamMembers, currentUserEmail],
  );
  const currentUser = useMemo(() => {
    const role: Role = myMemberRow?.role ?? "viewer";
    const name: string = myMemberRow?.name ?? authUser?.name ?? (currentUserEmail ? currentUserEmail.split("@")[0] : "Guest");
    return { email: currentUserEmail, name, role };
  }, [myMemberRow, authUser, currentUserEmail]);
  const isManager = currentUser.role === "manager";
  const isViewer = currentUser.role === "viewer";

  // ── Sprints from pod ──
  const { records: sprintRecords } = useRecords<SprintRow>({
    client,
    tableName: "sprints",
    sort: [{ field: "starts_at", direction: "desc" }],
    limit: 50,
  });
  const sprints = useMemo(() => sprintRecords, [sprintRecords]);
  const activeSprint = useMemo(() => sprints.find((s) => s.status === "active") ?? sprints[0] ?? null, [sprints]);
  const currentSprint = activeSprint;

  // ── Catalogue from pod (with hardcoded fallback) ──
  const { records: catalogueRecords } = useRecords<CatalogueItemRow>({
    client,
    tableName: "catalogue_items",
    limit: 100,
  });
  const catalogue = useMemo(() => {
    if (catalogueRecords.length > 0) {
      return catalogueRecords.map((r) => ({ kind: r.kind as ComponentKind, label: r.label, tier: r.tier as Tier }));
    }
    return CATALOGUE;
  }, [catalogueRecords]);
  const catalogueByTier = useMemo(() => {
    const tiers: Tier[] = [15, 30, 45, 60];
    return tiers.map((tier) => ({ tier, items: catalogue.filter((c) => c.tier === tier) }));
  }, [catalogue]);

  // ── Live task data from the pod ──
  const { records: taskRecords, refresh: refreshTasks, isLoading, error } = useRecords<TaskRow>({
    client,
    tableName: "tasks",
    sort: [{ field: "created_at", direction: "asc" }],
    limit: 500,
  });
  const allTasks = useMemo(() => taskRecords.map(rowToTask), [taskRecords]);

  // Tasks for the currently selected sprint
  const sprintTasks = useMemo(
    () => (currentSprint ? allTasks.filter((t) => !t.sprintId || t.sprintId === currentSprint.id) : allTasks),
    [allTasks, currentSprint],
  );

  // Derive world placements from tasks (status is under_review/established/demolished + has coords)
  const placementsRaw = useMemo(
    () =>
      sprintTasks
        .filter((t) => t.component && t.worldX != null && t.worldZ != null)
        .map((t) => taskToPlacement(t, teamMembers)),
    [sprintTasks, teamMembers],
  );

  // Merge optimistic overrides so clicks feel instant
  const placements = useMemo(
    () =>
      placementsRaw.map((p) => ({
        ...p,
        state: (localStates[p.id] ?? p.state) as PlacementState,
      })),
    [placementsRaw, localStates],
  );
  // In cinematic mode the world reads from the deterministic scripted set instead of the pod.
  const view = useMemo(() => {
    if (cinematic) return scripted;
    const realIds = new Set(placements.map((p) => p.id));
    return [...placements, ...optimisticPlacements.filter((p) => !realIds.has(p.id))];
  }, [cinematic, scripted, placements, optimisticPlacements]);
  const sprintGoal = cinematic ? 180 : (currentSprint?.goal ?? 1490);
  const cine: CineControls = useMemo(
    () => ({
      reset: () => { setScripted(cineSeed()); setSelectedId(null); setActiveTab("world"); },
      world: () => setActiveTab("world"),
      review: () => setActiveTab("review"),
      spotlightFeature: () => setSelectedId("c-est-1"),
      spotlightHero: () => setSelectedId("c-hero"),
      spotlightReject: () => setSelectedId("c-rej"),
      unspotlight: () => setSelectedId(null),
      placeHero: () => setScripted((s) => (s.some((p) => p.id === "c-hero") ? s : [...s, CINE_HERO])),
      approveHero: () => setScripted((s) => s.map((p) => (p.id === "c-hero" ? { ...p, state: "established" } : p))),
      demolishReject: () => setScripted((s) => s.map((p) => (p.id === "c-rej" ? { ...p, state: "demolished" } : p))),
    }),
    [],
  );

  const reviewFn = useFunctionRun({ client, functionName: "review_task" });
  const placeFn = useFunctionRun({ client, functionName: "place_component" });
  const assignTaskFn = useFunctionRun({ client, functionName: "assign_task" });
  const clearTaskFn = useFunctionRun({ client, functionName: "clear_task" });
  const updateMemberFn = useFunctionRun({ client, functionName: "update_team_member" });
  const addMemberFn = useFunctionRun({ client, functionName: "add_team_member" });

  // Derived task lists (filtered by current sprint + current user's email)
  const myTasks = useMemo(
    () => sprintTasks.filter((t) => t.assignee === currentUser.email),
    [sprintTasks, currentUser.email],
  );
  const teamTasks = useMemo(
    () => sprintTasks.filter((t) => t.assignee !== currentUser.email),
    [sprintTasks, currentUser.email],
  );
  // World card hero: the current user's first assigned task
  const myHeroTask = useMemo(
    () => myTasks.find((t) => !clearedIds.has(t.id) && (t.status === "assigned" || t.status === "in_progress")) ?? null,
    [myTasks, clearedIds],
  );

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [accountInitOpen, setAccountInitOpen] = useState(false);

  const placed = view.filter((p) => p.state !== "demolished").length;
  const pending = view.filter((p) => p.state === "under_review");
  const pendingCount = pending.length;
  const established = view.filter((p) => p.state === "established");
  const demolished = view.filter((p) => p.state === "demolished");
  const myPendingBuild = view.find((p) => p.builderEmail === currentUser.email && p.state === "under_review") ?? null;

  const members: Member[] = useMemo(() => {
    const pts: Record<string, number> = {};
    view.filter((p) => p.state === "established").forEach((p) => {
      pts[p.builderEmail] = (pts[p.builderEmail] ?? 0) + p.item.tier;
    });
    const assignees = new Set<string>([
      ...sprintTasks.map((t) => t.assignee),
      ...view.map((p) => p.builderEmail),
    ]);
    const allMembers = teamMembers.length > 0 ? teamMembers : ROSTER_FALLBACK.map((r) => ({ id: r.email, name: r.name, email: r.email, role: r.role as MemberRole, color: r.color, created_at: "" }));
    return allMembers
      .filter((m) => assignees.has(m.email))
      .map((m) => ({
        name: m.name,
        email: m.email,
        color: m.color ?? colorForBuilder(m.email, teamMembers),
        points: pts[m.email] ?? 0,
      }));
  }, [view, teamMembers, sprintTasks]);
  const ranked = [...members].sort((a, b) => b.points - a.points);
  const done = members.reduce((sum, m) => sum + m.points, 0);
  const pct = Math.min(100, Math.round((done / sprintGoal) * 100));

  const selectedPos = useMemo(() => {
    if (!selectedId) return null;
    const p = view.find((x) => x.id === selectedId);
    if (!p) return null;
    const [x, y, z] = tilePosition(p.x, p.z, 0.7);
    return new THREE.Vector3(x, y, z);
  }, [selectedId, view]);

  const hoveredPlacement = hovered ? (view.find((p) => p.id === hovered.id) ?? null) : null;

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast((t) => (t && t.id === toast.id ? null : t)), 3400);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (error) setToast({ id: Date.now(), text: "Couldn't load the world from the pod", tone: "bad" });
  }, [error]);

  const flash = useCallback((text: string, tone: "good" | "bad") => {
    setToast({ id: Date.now(), text, tone });
  }, []);

  const handleClaimAccount = useCallback(async (id: string, name: string, email: string) => {
    try {
      const existing = teamMembers.find((m) => m.id === id);
      await updateMemberFn.start({ id, name, email, role: existing?.role || "member" });
      await refreshTeamMembers();
      localStorage.setItem("task_arcade_mock_user", email);
      flash(`Account set for ${name} (${email})`, "good");
      setTimeout(() => window.location.reload(), 500);
    } catch {
      flash("Couldn't initialize account", "bad");
    }
  }, [updateMemberFn, refreshTeamMembers, teamMembers, flash]);

  const handleHover = useCallback((id: string | null, sx?: number, sy?: number) => {
    if (id === null || sx === undefined || sy === undefined) {
      setHovered(null);
    } else {
      setHovered({ id, x: sx, y: sy });
    }
  }, []);

  const decide = useCallback(
    async (placementId: string, decision: "approve" | "reject") => {
      const p = placementsRaw.find((x) => x.id === placementId);
      if (!p || busy) return;
      setSelectedId(null);
      const nextState: PlacementState = decision === "approve" ? "established" : "demolished";
      setLocalStates((prev) => ({ ...prev, [placementId]: nextState }));
      setBusy(true);
      try {
        await reviewFn.start({ task_id: placementId, decision });
        await refreshTasks();
        setLocalStates((prev) => {
          const n = { ...prev };
          delete n[placementId];
          return n;
        });
        flash(
          decision === "approve"
            ? `Approved — ${p.builder}'s ${p.item.label.toLowerCase()} is now part of the world`
            : `Demolished — ${p.builder}'s ${p.item.label.toLowerCase()} sent to rubble`,
          decision === "approve" ? "good" : "bad",
        );
      } catch {
        setLocalStates((prev) => {
          const n = { ...prev };
          delete n[placementId];
          return n;
        });
        flash("Couldn't save the review — try again", "bad");
      } finally {
        setBusy(false);
      }
    },
    [placementsRaw, busy, reviewFn, refreshTasks, flash],
  );

  // Place a chosen catalogue component into the world (under review), with the
  // magical shimmer + sound. Driven by the build picker (Journey B: clear → pick → place).
  const placeChosen = useCallback(
    async (item: CatalogueItem, taskTitle: string) => {
      if (busy) return;
      setBuildModal(null);
      setActiveTab("world");

      const clearedTask = myTasks.find((t) => t.title === taskTitle && clearedIds.has(t.id));
      if (!clearedTask) {
        flash("Couldn't find the cleared task — try again", "bad");
        return;
      }

      const occupied = new Set(placements.map((p) => `${p.x},${p.z}`));
      let spot = { x: 0, z: -1 };
      let found = false;
      if (!occupied.has("0,-1")) {
        spot = { x: 0, z: -1 };
        found = true;
      } else {
        let radius = 1;
        outer_search: while (radius < 20) {
          for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
              if (Math.abs(dx) === radius || Math.abs(dz) === radius) {
                const tx = dx;
                const tz = -1 + dz;
                if (!occupied.has(`${tx},${tz}`)) {
                  spot = { x: tx, z: tz };
                  found = true;
                  break outer_search;
                }
              }
            }
          }
          radius++;
        }
      }

      const optId = `opt-${item.kind}`;
      const optPlacement: Placement = {
        id: optId,
        task: taskTitle,
        builder: currentUser.name,
        builderEmail: currentUser.email,
        item,
        x: spot.x,
        z: spot.z,
        state: "under_review",
        submitted: new Date().toISOString(),
      };
      setOptimisticPlacements((prev) => [...prev.filter((p) => p.id !== optId), optPlacement]);
      playShimmer();
      setPlacingShimmer(true);
      setTimeout(() => setPlacingShimmer(false), 1600);

      setBusy(true);
      try {
        await placeFn.start({
          task_id: clearedTask.id,
          component: item.kind,
          world_x: spot.x,
          world_z: spot.z,
        });
        await refreshTasks();
        flash(`Placed a ${item.label.toLowerCase()} — pending review`, "good");
      } catch {
        flash("Couldn't place the build — try again", "bad");
      } finally {
        setOptimisticPlacements((prev) => prev.filter((p) => p.id !== optId));
        setBusy(false);
      }
    },
    [busy, placements, placeFn, refreshTasks, flash, playShimmer, myTasks, clearedIds, currentUser],
  );

  // Open the build picker for a task (from the World card's CTA).
  const openBuildPicker = useCallback((task: { title: string; tier: Tier }) => {
    setBuildModal({ title: task.title, tier: task.tier });
  }, []);

  // Mark a task done: optimistic local clear + call clear_task on the pod.
  const markTaskDone = useCallback(async (task: MockTask) => {
    setClearedIds((s) => new Set(s).add(task.id));
    setBuildModal({ title: task.title, tier: task.tier });
    try {
      await clearTaskFn.start({ task_id: task.id });
      await refreshTasks();
    } catch {
      // clearedIds already set; UI remains cleared even if network fails
    }
  }, [clearTaskFn, refreshTasks]);

  // Start working on a task: transition from assigned → in_progress
  const startTask = useCallback(async (task: MockTask) => {
    try {
      await clearTaskFn.start({ task_id: task.id, action: "start" });
      await refreshTasks();
      flash(`Started working on "${task.title}"`, "good");
    } catch {
      flash("Couldn't start task — try again", "bad");
    }
  }, [clearTaskFn, refreshTasks, flash]);

  // Manager assigns a new task via the modal.
  const handleAssignTask = useCallback(async (
    title: string, assigneeEmail: string, points: Tier, due: string,
  ) => {
    setAssignModalOpen(false);
    if (!activeSprint) {
      flash("No active sprint — can't assign task", "bad");
      return;
    }
    try {
      await assignTaskFn.start({
        title,
        assignee_email: assigneeEmail,
        points,
        source: "slack",
        sprint_id: activeSprint.id,
        due,
      });
      await refreshTasks();
      const memberName = nameForEmail(assigneeEmail, teamMembers);
      flash(`Assigned to ${memberName}`, "good");
    } catch {
      flash("Couldn't assign task — try again", "bad");
    }
  }, [assignTaskFn, refreshTasks, flash, activeSprint, teamMembers]);

  const handleSaveTeamMember = useCallback(async (id: string, name: string, email: string, role: string) => {
    try {
      await updateMemberFn.start({ id, name, email, role });
      await refreshTeamMembers();
      flash(`Updated ${name}'s settings`, "good");
    } catch {
      flash("Couldn't update user settings", "bad");
    }
  }, [updateMemberFn, refreshTeamMembers, flash]);

  const handleAddTeamMember = useCallback(async (name: string, email: string, role: string) => {
    try {
      await addMemberFn.start({ name, email, role });
      await refreshTeamMembers();
      flash(`Added ${name} to team`, "good");
    } catch {
      flash("Couldn't add user", "bad");
    }
  }, [addMemberFn, refreshTeamMembers, flash]);

  const NAV_TABS: AppTab[] = ["world", "tasks", "review", "growth", "vault"];
  const tabLabel: Record<AppTab, string> = {
    world: "World", tasks: "Tasks", review: "Review", growth: "100x Growth", vault: "📦 Media Vault", social: "⚡ Social HQ", all: "All",
    catalog: "Catalog", kits: "Kits", stats: "Stats",
    roadmap: "Roadmap", demos: "Demos", quartermaster: "QM",
  };

  const SIDEBAR_NAV: { id: MainTab; icon: string; label: string; countFn?: () => number }[] = [
    { id: 'dashboard', icon: '🎮', label: 'Command Center' },
    { id: 'swarm', icon: '🤖', label: 'AI Subagent Swarm' },
    { id: 'playbook', icon: '🚀', label: 'Month 1 Playbook' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'trends', icon: '📡', label: 'Trend Radar' },
    { id: 'generate', icon: '✨', label: 'Create' },
    { id: 'drafts', icon: '📝', label: 'Drafts', countFn: () => getPostsByStatus('draft').length },
    { id: 'scheduled', icon: '⏰', label: 'Scheduled', countFn: () => [...getPostsByStatus('approved'), ...getPostsByStatus('scheduled')].length },
    { id: 'history', icon: '✅', label: 'History' },
    { id: 'toolkit', icon: '🧰', label: 'SMM Toolkit' },
    { id: 'vault', icon: '📦', label: 'Media Vault' },
    { id: 'brainstorm', icon: '💡', label: 'Idea Backlog' },
    { id: 'arcade', icon: '🏰', label: '3D Task Arcade' },
    { id: 'quartermaster', icon: '🤖', label: 'Quartermaster AI' },
  ];

  if (qmRoute) return <QuartermasterPage />;

  return (
    <div className="app-layout" style={{ display: 'flex', width: '100vw', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* ── MOBILE HEADER (Visible < 768px) ────────────────── */}
      <header className="mobile-header">
        <div className="mobile-header-brand" onClick={() => setMainTab('dashboard')}>
          <span className="mobile-logo-icon">💨</span>
          <span className="mobile-logo-text">CleanPuff Social HQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="mobile-menu-btn" type="button" onClick={toggleTheme} aria-label="Toggle light/dark theme">
            {theme === 'dark' ? <Sun size={19} color="#ffc107" /> : <Moon size={19} color="#8b5cf6" />}
          </button>
          <button
            className="mobile-menu-btn"
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ── MOBILE DRAWER OVERLAY ─────────────────────────── */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="sidebar-logo">
                <div className="sidebar-logo-icon">💨</div>
                <div>
                  <h1>CleanPuff</h1>
                  <span>Navigation Menu</span>
                </div>
              </div>
              <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <nav className="mobile-drawer-nav">
              {SIDEBAR_NAV.map((item) => {
                const count = item.countFn?.();
                const active = mainTab === item.id;
                return (
                  <div
                    key={item.id}
                    className={`nav-item ${active ? 'active' : ''}`}
                    onClick={() => {
                      setMainTab(item.id);
                      setMobileMenuOpen(false);
                      setRefreshTick((n) => n + 1);
                    }}
                  >
                    <span className="icon">{item.icon}</span>
                    <span>{item.label}</span>
                    {count !== undefined && count > 0 && (
                      <span className="nav-badge">{count}</span>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ────────────────────────────────── */}
      <aside className="sidebar desktop-sidebar" style={{ width: '260px', flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">💨</div>
            <div>
              <h1>CleanPuff</h1>
              <span>Social HQ</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {SIDEBAR_NAV.map((item) => {
            const count = item.countFn?.();
            const active = mainTab === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => {
                  setMainTab(item.id);
                  setRefreshTick((n) => n + 1);
                }}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
                {count !== undefined && count > 0 && (
                  <span className="nav-badge">{count}</span>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', position: 'relative' }}>
          <div
            className="sidebar-account"
            onClick={() => setShowUserSwitcher(!showUserSwitcher)}
            title="Click to switch active team member identity"
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 6px', borderRadius: 8, transition: 'background 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-glass)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              className="sidebar-avatar"
              style={{
                background: colorForBuilder(currentUserEmail, teamMembers),
                color: '#ffffff',
                fontWeight: 900,
                fontSize: 11,
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 8px ${colorForBuilder(currentUserEmail, teamMembers)}60`
              }}
            >
              {(currentUser.name || "CP").slice(0, 2).toUpperCase()}
            </div>
            <div className="sidebar-account-info">
              <div className="sidebar-account-name" style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentUser.name || "CleanPuff"}
              </div>
              <div className="sidebar-account-handle" style={{ fontSize: 10, color: 'var(--primary-mint)', fontWeight: 700 }}>
                @{currentUserEmail ? currentUserEmail.split("@")[0] : "cleanpuff"} • {currentUser.role?.toUpperCase() || "MEMBER"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-primary)',
              borderRadius: '10px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {theme === 'dark' ? <Sun size={15} color="#ffc107" /> : <Moon size={15} color="#8b5cf6" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* TEAM MEMBER SWITCHER POPOVER */}
          {showUserSwitcher && (
            <div
              style={{
                position: 'absolute',
                bottom: 60,
                left: 16,
                width: 260,
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-light)',
                borderRadius: 12,
                padding: 12,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(16px)',
                zIndex: 9999
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary-mint)', marginBottom: 8, letterSpacing: '0.05em' }}>
                SWITCH ACTIVE TEAM MEMBER IDENTITY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ROSTER_FALLBACK.map((m) => {
                  const isActive = currentUserEmail === m.email;
                  return (
                    <div
                      key={m.email}
                      onClick={() => {
                        try { localStorage.setItem("task_arcade_mock_user", m.email); } catch (_) {}
                        setShowUserSwitcher(false);
                        window.location.reload();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: isActive ? 'rgba(47, 141, 77, 0.2)' : 'var(--bg-secondary)',
                        border: `1px solid ${isActive ? 'var(--primary-mint)' : 'transparent'}`,
                        cursor: 'pointer',
                        transition: 'all 0.12s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.color, color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>{m.name}</div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>@{m.email.split('@')[0]}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: m.color, background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: 4 }}>
                        {m.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT VIEWPORT ────────────────────────── */}
      <main className="main-content" style={{ flex: 1, overflowY: 'auto', height: '100vh', position: 'relative', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {mainTab === 'dashboard' && <div style={{ padding: '24px 32px' }}><Dashboard /></div>}
        {mainTab === 'swarm' && <div style={{ padding: '24px 32px' }}><Swarm /></div>}
        {mainTab === 'playbook' && <div style={{ padding: '24px 32px' }}><Playbook /></div>}
        {mainTab === 'calendar' && <div style={{ padding: '24px 32px' }}><Calendar /></div>}
        {mainTab === 'trends' && <div style={{ padding: '24px 32px' }}><Trends /></div>}
        {mainTab === 'generate' && <div style={{ padding: '24px 32px' }}><Generate /></div>}
        {mainTab === 'drafts' && <div style={{ padding: '24px 32px' }}><Drafts /></div>}
        {mainTab === 'scheduled' && <div style={{ padding: '24px 32px' }}><Scheduled /></div>}
        {mainTab === 'history' && <div style={{ padding: '24px 32px' }}><History /></div>}
        {mainTab === 'toolkit' && <div style={{ padding: '24px 32px' }}><Toolkit /></div>}
        {mainTab === 'vault' && <div style={{ padding: '24px 32px' }}><MediaVaultTab teamMembers={teamMembers} /></div>}
        {mainTab === 'brainstorm' && <div style={{ padding: '24px 32px' }}><CreativeBacklogTab /></div>}
        {mainTab === 'quartermaster' && <QuartermasterPage />}

        {/* ── 3D TASK ARCADE GAME ────────────────────────── */}
        {mainTab === 'arcade' && (
          <div className={cinematic ? "app-shell cinematic-on" : "app-shell"} onClick={playClick} style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <CinematicDirector
        active={cinematic}
        script={activeScript}
        stageRef={stageRef}
        controls={cine}
        playSfx={playSfx}
        onExit={() => {
          setCinematic(false);
          setSelectedId(null);
          setActiveTab("demos");
        }}
      />

      {activeTab === "roadmap" && <VisualProductDoc />}

      {/* ── DEMOS ─────────────────────────────────────── */}
      {activeTab === "demos" && (
        <section className="demo-library" aria-label="Cinematic walkthroughs">
          <div className="demo-lib-head">
            <div>
              <h2>Cinematic walkthroughs</h2>
              <p>Scripted tours of the real UI — captions, camera, and sound. Pick one to play.</p>
            </div>
            <span className="demo-lib-count">{DEMOS.length} demo{DEMOS.length === 1 ? "" : "s"}</span>
          </div>
          <div className="demo-grid">
            {DEMOS.map((demo) => (
              <button
                key={demo.id}
                type="button"
                className="demo-card"
                onClick={() => {
                  setActiveScript(demo);
                  setSelectedId(null);
                  setActiveTab("world");
                  setCinematic(true);
                }}
              >
                <div className="demo-card-icon">
                  <Film size={22} />
                </div>
                <div className="demo-card-body">
                  <div className="demo-card-top">
                    {demo.tag && <span className="demo-card-tag">{demo.tag}</span>}
                    <span className="demo-card-dur">
                      <Clock size={13} /> {Math.round(demo.duration)}s
                    </span>
                  </div>
                  <strong>{demo.title}</strong>
                  <p>{demo.blurb}</p>
                </div>
                <span className="demo-card-play">
                  <Play size={16} /> Play
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section
        className={`world-stage${placingShimmer ? " world-stage--shimmer" : ""}`}
        aria-label="3D task arcade world"
        ref={stageRef}
      >
        <Canvas dpr={[1, 1.8]} shadows gl={{ antialias: true }}>
          <World
            zoom={worldZoom}
            placements={view}
            onHover={handleHover}
            selectedId={selectedId}
            selectedPos={selectedPos}
            isSpinning={isSpinning}
          />
        </Canvas>
      </section>

      {/* Floating hover receipt (DOM overlay — pointer-events:none, never steals canvas events) */}
      {hoveredPlacement && hovered && (
        <HoverReceipt placement={hoveredPlacement} x={hovered.x} y={hovered.y} />
      )}

      {toast && (
        <div className={`toast toast--${toast.tone}`} role="status">
          {toast.tone === "good" ? <Sparkles size={17} /> : <X size={17} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Build picker — opens when a task is cleared (Journey B: clear → pick → place) */}
      {buildModal && (
        <BuildPickerModal
          title={buildModal.title}
          tier={buildModal.tier}
          catalogue={catalogue}
          onPick={(item) => placeChosen(item, buildModal.title)}
          onClose={() => setBuildModal(null)}
        />
      )}
      {assignModalOpen && (
        <AssignTaskModal
          teamMembers={teamMembers}
          activeSprintId={activeSprint?.id ?? ""}
          onSubmit={handleAssignTask}
          onClose={() => setAssignModalOpen(false)}
        />
      )}
      {adminModalOpen && (
        <AdminSettingsModal
          teamMembers={teamMembers}
          onSaveMember={handleSaveTeamMember}
          onAddMember={handleAddTeamMember}
          onClose={() => setAdminModalOpen(false)}
        />
      )}
      {isDemoMode && accountInitOpen && (
        <AccountInitModal
          teamMembers={teamMembers}
          onClaimAccount={handleClaimAccount}
          onClose={() => setAccountInitOpen(false)}
        />
      )}

      <header className="app-header">
        <button className="brand-pill" type="button" onClick={() => setActiveTab("world")}>
          <Castle size={22} />
          Task Arcade
        </button>
        <nav className="app-tabs" aria-label="Desk sections">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "tab active" : "tab"}
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              {tabLabel[tab]}
              {tab === "review" && pendingCount > 0 && <i className="tab-badge">{pendingCount}</i>}
            </button>
          ))}
          <a href="#/quartermaster" className="tab tab--qm-link" type="button">
            <Sparkles size={12} /> QM
          </a>
        </nav>
        <div className="header-right">
          {isDemoMode && <button
            className="cine-launch"
            type="button"
            style={{
              background: "#3fa3df",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 600,
              marginRight: "8px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
            onClick={() => setAccountInitOpen(true)}
          >
            <Sparkles size={13} /> Demo: switch member
          </button>}
          {(isManager || currentUser.email === "rv@cleanpuff.io") && (
            <button
              className="cine-launch"
              type="button"
              style={{
                background: "#ffffff25",
                color: "#20362a",
                border: "1px solid #20362a30",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                marginRight: "8px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              onClick={() => setAdminModalOpen(true)}
            >
              <Sparkles size={13} /> Admin Settings
            </button>
          )}

          <div className="user-pill">
            <Avatar name={currentUser.name} color={colorForBuilder(currentUser.email, teamMembers)} email={currentUser.email} size={24} />
            <span className="user-pill-name">{currentUser.name}</span>
            <span className={`role-chip role-chip--${currentUser.role}`}>
              {currentUser.role === "manager" ? "Manager" : currentUser.role === "viewer" ? "Viewer" : "Member"}
            </span>
          </div>
          <button
            className="cine-launch"
            type="button"
            title="Browse cinematic walkthroughs"
            onClick={() => setActiveTab("demos")}
          >
            <Film size={16} /> Demos
          </button>
          <div className="world-count">
            <Layers size={16} />
            <span>{isLoading && view.length === 0 ? "Loading…" : `${placed} placed`}</span>
          </div>
        </div>
      </header>

      {/* ── WORLD ─────────────────────────────────────── */}
      {activeTab === "world" && (
        <>
          <aside className="sprint-panel" aria-label="Team sprint">
            <div className="sprint-head">
              <span className="sprint-eyebrow">Current sprint</span>
              <h1>{currentSprint?.name ?? "Loading…"}</h1>
            </div>
            <div className="sprint-goal">
              <strong>{done.toLocaleString()}</strong>
              <span> / {sprintGoal.toLocaleString()} pts goal</span>
            </div>
            <div className="sprint-bar">
              <i style={{ width: `${pct}%` }} />
            </div>
            <div className="sprint-bar-foot">
              <span>{pct}% to goal</span>
              <span>{pendingCount} pending review</span>
            </div>
            <div className="roster-head">
              <Users size={15} /> Team progress
            </div>
            <ul className="roster">
              {ranked.map((m, i) => {
                const memberRole = teamMembers.find((r) => r.email === m.email)?.role ?? "member";
                return (
                  <li key={m.email} className="roster-row">
                    <Avatar name={m.name} color={m.color} email={m.email} />
                    <span className="roster-name">{m.name}</span>
                    {memberRole === "manager" && (
                      <span className="role-chip role-chip--manager role-chip--xs">Mgr</span>
                    )}
                    {i === 0 && m.points > 0 && <Crown size={15} className="roster-crown" />}
                    <span className="roster-points">{m.points} pts</span>
                  </li>
                );
              })}
            </ul>
            <button className="leaderboard-link" type="button" onClick={() => setActiveTab("stats")}>
              <Trophy size={15} /> View full leaderboard
            </button>
          </aside>

          <aside className="task-card" aria-label="Your task">
            {myPendingBuild ? (
              <>
                <div className="task-card__eyebrow"><ClipboardList size={16} /> Your build · pending review</div>
                <h2>{myPendingBuild.task}</h2>
                <div className="task-pick">
                  <span className="task-pick__icon" style={{ background: `${TIER_COLOR[myPendingBuild.item.tier]}22`, color: TIER_COLOR[myPendingBuild.item.tier] }}>
                    <KindIcon kind={myPendingBuild.item.kind} />
                  </span>
                  <div>
                    <strong>{myPendingBuild.item.label}</strong>
                    <em>Build component · {TIER_LABEL[myPendingBuild.item.tier]}</em>
                  </div>
                  <TierBadge tier={myPendingBuild.item.tier} />
                </div>
                <div className="task-meta"><span><Clock size={15} /> Awaiting manager approval</span></div>
              </>
            ) : myHeroTask ? (
              <>
                <div className="task-card__eyebrow"><ClipboardList size={16} /> Your task · ready to build</div>
                <h2>{myHeroTask.title}</h2>
                <div className="task-pick">
                  <span className="task-pick__icon" style={{ background: `${TIER_COLOR[myHeroTask.tier]}22`, color: TIER_COLOR[myHeroTask.tier] }}>
                    <Trophy size={18} />
                  </span>
                  <div>
                    <strong>{myHeroTask.tier}-pt milestone</strong>
                    <em>Clear it to unlock {catalogue.filter(c => c.tier === myHeroTask.tier).length} builds</em>
                  </div>
                  <TierBadge tier={myHeroTask.tier} />
                </div>
                <div className="task-meta"><span><Clock size={15} /> {myHeroTask.tier} pts ready to spend</span></div>
                {!isViewer && (
                  <button className="place-button" type="button" onClick={() => openBuildPicker(myHeroTask)} disabled={busy}>
                    <Hammer size={18} /> Choose your build
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="task-card__eyebrow"><ClipboardList size={16} /> No tasks assigned</div>
                <h2>Nothing to build yet</h2>
                <div className="task-meta"><span><Clock size={15} /> Ask your manager to assign a task</span></div>
              </>
            )}
          </aside>

          <div className="zoom-controls" aria-label="Camera controls">
            <button type="button" aria-label="Zoom out" onClick={() => setWorldZoom((z) => Math.max(38, z - 10))}>
              <ZoomOut size={22} />
            </button>
            <button
              type="button"
              title={isSpinning ? "Pause 3D rotation" : "Enable slow 3D crawl"}
              onClick={() => setIsSpinning((s) => !s)}
              style={{
                background: isSpinning ? "#3fa3df" : "transparent",
                color: isSpinning ? "#fff" : "#20362a",
                border: "none",
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isSpinning ? "⏸ Crawl" : "▶ Spin"}
            </button>
            <button type="button" aria-label="Zoom in" onClick={() => setWorldZoom((z) => Math.min(110, z + 10))}>
              <ZoomIn size={22} />
            </button>
          </div>
          <div className="hint">Hover a build to see its receipt · drag to orbit</div>
        </>
      )}

      {/* ── TASKS (Todoist-style) ────────────────────── */}
      {activeTab === "tasks" && (
        <aside className="tab-panel tasks-panel" aria-label="Task list">
          <div className="tasks-header">
            <div className="panel-header" style={{ paddingBottom: 0 }}>
              <span>Tasks</span>
              <span className={`role-chip role-chip--${currentUser.role}`}>
                {currentUser.role === "manager" ? "Manager view" : currentUser.role === "viewer" ? "Viewer" : "Member view"}
              </span>
            </div>
            <div className="tasks-toggle">
              <button className={taskView === "my" ? "active" : ""} onClick={() => setTaskView("my")}>
                My tasks
              </button>
              <button className={taskView === "team" ? "active" : ""} onClick={() => setTaskView("team")}>
                Team
              </button>
            </div>
          </div>

          {/* Manager-only: assign new task CTA */}
          {isManager && taskView === "team" && (
            <button className="assign-task-btn" type="button" onClick={() => setAssignModalOpen(true)}>
              <Plus size={14} /> Assign task to teammate
            </button>
          )}

          <ul className="task-list">
            {(taskView === "my" ? myTasks : teamTasks).map((t) => {
              const cleared = clearedIds.has(t.id);
              const effStatus: TaskStatus = cleared ? "cleared" : t.status;
              const canClear = !isViewer && taskView === "my" && (t.status === "assigned" || t.status === "in_progress");
              const canStart = !isViewer && taskView === "my" && t.status === "assigned";
              const assigneeName = nameForEmail(t.assignee, teamMembers);
              return (
                <li key={t.id} className="task-row">
                  <TaskStatusDot status={effStatus} />
                  <div className="task-row-body">
                    <div className="task-row-top">
                      <span className={`task-row-title ${effStatus === "cleared" ? "is-cleared" : ""}`}>{t.title}</span>
                      <TierBadge tier={t.tier} />
                    </div>
                    <div className="task-row-meta">
                      {taskView === "team" && (
                        <span className="task-assignee">
                          <Avatar name={assigneeName} color={colorForBuilder(t.assignee, teamMembers)} email={t.assignee} size={18} />
                          {assigneeName}
                        </span>
                      )}
                      <span className="task-due">{t.due}</span>
                    </div>
                  </div>
                  {canStart && !cleared && t.status === "assigned" && (
                    <button className="task-start-btn" type="button" onClick={() => startTask(t)} style={{ background: "#3fa3df", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", marginRight: 4 }}>
                      ▶ Start
                    </button>
                  )}
                  {canClear &&
                    (cleared ? (
                      <span className="task-done-chip">
                        <Check size={13} /> Cleared
                      </span>
                    ) : (
                      <button className="task-done-btn" type="button" onClick={() => markTaskDone(t)}>
                        <Check size={14} /> Mark done
                      </button>
                    ))}
                </li>
              );
            })}
          </ul>

          {/* View all — opens the full task list (wired later) */}
          <button
            className="view-all-link"
            type="button"
            onClick={() => flash("Full task list — coming soon", "good")}
          >
            View all tasks →
          </button>

          {(taskView === "my" ? myTasks : teamTasks).length === 0 && (
            <div className="review-empty">
              <CheckCircle2 size={28} />
              <strong>All done</strong>
              <span>No tasks in this view.</span>
            </div>
          )}
        </aside>
      )}

      {/* ── REVIEW (manager view) ────────────────────── */}
      {activeTab === "review" && (
        <aside className="tab-panel review-panel" aria-label="Review queue">
          <div className="panel-header">
            <span>Pending review</span>
            <strong>Counts toward streak</strong>
          </div>
          {pendingCount === 0 ? (
            <div className="review-empty">
              <CheckCircle2 size={30} />
              <strong>All caught up</strong>
              <span>Every build has been reviewed.</span>
            </div>
          ) : (
            <ul className="review-list">
              {pending.map((p) => (
                <li
                  key={p.id}
                  className={selectedId === p.id ? "review-row is-selected" : "review-row"}
                  onMouseEnter={() => setSelectedId(p.id)}
                  onMouseLeave={() => setSelectedId((s) => (s === p.id ? null : s))}
                >
                  <Avatar name={p.builder} color={colorForBuilder(p.builderEmail, teamMembers)} email={p.builderEmail} />
                  <div className="review-meta">
                    <strong>{p.builder}</strong>
                    <small>
                      {p.task} · {p.item.label}
                    </small>
                  </div>
                  <TierBadge tier={p.item.tier} />
                  <div className="review-actions">
                    {isManager ? (
                      <>
                        <button
                          className="rev-approve"
                          type="button"
                          disabled={busy}
                          onClick={() => decide(p.id, "approve")}
                          aria-label="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="rev-reject"
                          type="button"
                          disabled={busy}
                          onClick={() => decide(p.id, "reject")}
                          aria-label="Reject"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <span className="review-viewer-note">Manager reviews</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="phase-note">
            <Sparkles size={14} /> Hover to spotlight · approve grows it, reject demolishes it.
          </p>
          <button className="view-all-link" type="button" onClick={() => setActiveTab("all")}>
            View all activity →
          </button>
        </aside>
      )}

      {/* ── 100x GROWTH INTELLIGENCE ──────────────────── */}
      {activeTab === "growth" && <GrowthIntelligenceTab teamMembers={teamMembers} />}

      {/* ── MEDIA VAULT (JettyThunder S3 + Google Drive) ──── */}
      {activeTab === "vault" && <MediaVaultTab teamMembers={teamMembers} />}

      {/* ── ALL ACTIVITY ─────────────────────────────── */}
      {activeTab === "all" && (
        <aside className="tab-panel all-panel" aria-label="All activity">
          <div className="all-panel-header">
            <button className="back-btn" type="button" onClick={() => setActiveTab("review")}>
              <ChevronLeft size={16} /> Review
            </button>
            <div className="panel-header" style={{ flex: 1, paddingBottom: 0 }}>
              <span>All activity</span>
              <strong>{view.length} total</strong>
            </div>
          </div>

          {pending.length > 0 && (
            <section className="all-group">
              <div className="all-group-head">
                <span className="all-dot all-dot--pending" />
                Pending review <em>{pending.length}</em>
              </div>
              <ul className="task-list">
                {pending.map((p) => (
                  <li key={p.id} className="task-row task-row--review">
                    <span className="task-dot task-dot--pending" />
                    <div className="task-row-body">
                      <div className="task-row-top">
                        <span className="task-row-title">{p.task}</span>
                        <TierBadge tier={p.item.tier} />
                      </div>
                      <div className="task-row-meta">
                        <span className="task-assignee">
                          <Avatar name={p.builder} color={colorForBuilder(p.builderEmail, teamMembers)} email={p.builderEmail} size={18} />
                          {p.builder} · {p.item.label}
                        </span>
                        <span className="task-due">{p.submitted}</span>
                      </div>
                    </div>
                    <div className="review-actions">
                      {isManager ? (
                        <>
                          <button
                            className="rev-approve"
                            type="button"
                            disabled={busy}
                            onClick={() => decide(p.id, "approve")}
                            aria-label="Approve"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            className="rev-reject"
                            type="button"
                            disabled={busy}
                            onClick={() => decide(p.id, "reject")}
                            aria-label="Reject"
                          >
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <span className="review-viewer-note">Manager reviews</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {established.length > 0 && (
            <section className="all-group">
              <div className="all-group-head">
                <span className="all-dot all-dot--established" />
                Established <em>{established.length}</em>
              </div>
              <ul className="task-list">
                {established.map((p) => (
                  <li key={p.id} className="task-row">
                    <span className="task-dot task-dot--cleared">
                      <Check size={10} />
                    </span>
                    <div className="task-row-body">
                      <div className="task-row-top">
                        <span className="task-row-title is-cleared">{p.task}</span>
                        <TierBadge tier={p.item.tier} />
                      </div>
                      <div className="task-row-meta">
                        <span className="task-assignee">
                          <Avatar name={p.builder} color={colorForBuilder(p.builderEmail, teamMembers)} email={p.builderEmail} size={18} />
                          {p.builder} · {p.item.label}
                        </span>
                        <span className="task-due">{p.submitted}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {demolished.length > 0 && (
            <section className="all-group">
              <div className="all-group-head">
                <span className="all-dot all-dot--demolished" />
                Demolished <em>{demolished.length}</em>
              </div>
              <ul className="task-list">
                {demolished.map((p) => (
                  <li key={p.id} className="task-row task-row--demolished">
                    <span className="task-dot task-dot--demolished" />
                    <div className="task-row-body">
                      <div className="task-row-top">
                        <span className="task-row-title">{p.task}</span>
                        <TierBadge tier={p.item.tier} />
                      </div>
                      <div className="task-row-meta">
                        <span className="task-assignee">
                          <Avatar name={p.builder} color={colorForBuilder(p.builderEmail, teamMembers)} email={p.builderEmail} size={18} />
                          {p.builder} · {p.item.label}
                        </span>
                        <span className="task-due">{p.submitted}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {view.length === 0 && (
            <div className="review-empty" style={{ marginTop: 24 }}>
              <CheckCircle2 size={28} />
              <strong>Nothing yet</strong>
              <span>Place your first build to see activity here.</span>
            </div>
          )}
        </aside>
      )}

      {/* ── CATALOG ───────────────────────────────────── */}
      {activeTab === "catalog" && (
        <aside className="tab-panel" aria-label="Build catalogue">
          <div className="panel-header">
            <span>Build catalogue</span>
            <strong>By point tier</strong>
          </div>
          <div className="catalog-tiers">
            {catalogueByTier.map(({ tier, items }) => (
              <section className="catalog-tier" key={tier}>
                <header>
                  <TierBadge tier={tier} />
                  <strong>{tier} pts</strong>
                  <span>{TIER_LABEL[tier]}</span>
                </header>
                <div className="catalog-items">
                  {items.map((c) => (
                    <div className="catalog-chip" key={c.kind}>
                      <KindIcon kind={c.kind} />
                      {c.label}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </aside>
      )}

      {/* ── STATS ─────────────────────────────────────── */}
      {activeTab === "stats" && (
        <aside className="tab-panel" aria-label="Team stats">
          <div className="panel-header">
            <span>Team stats</span>
            <strong>{done.toLocaleString()} pts</strong>
          </div>
          <div className="stat-grid">
            <div>
              <strong>{placed}</strong>
              <span>placed</span>
            </div>
            <div>
              <strong>{pendingCount}</strong>
              <span>pending</span>
            </div>
            <div>
              <strong>{members.length}</strong>
              <span>builders</span>
            </div>
          </div>
          <div className="roster-head">
            <Trophy size={15} /> Leaderboard
          </div>
          <ul className="roster">
            {ranked.map((m, i) => (
              <li key={m.email} className="roster-row">
                <span className="roster-rank">{i + 1}</span>
                <Avatar name={m.name} color={m.color} email={m.email} />
                <span className="roster-name">{m.name}</span>
                <span className="roster-points">{m.points} pts</span>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* ── KITS ──────────────────────────────────────── */}
      {activeTab === "kits" && (
        <aside className="tab-panel" aria-label="World kits">
          <div className="panel-header">
            <span>World kits</span>
            <strong>Art themes</strong>
          </div>
          <div className="kit-list">
            {[
              { name: "Fantasy town", note: "Cottages, mills, stalls", swatch: "#8fcf72" },
              { name: "Urban city", note: "Manors, towers, planters", swatch: "#9bb7d8" },
              { name: "Pirate bay", note: "Ships, gates, watchtowers", swatch: "#e0b070" },
              { name: "Motor pool", note: "Carts, vans, delivery", swatch: "#d68b9a" },
            ].map((k) => (
              <section className="kit-row" key={k.name}>
                <div>
                  <strong>{k.name}</strong>
                  <span>{k.note}</span>
                </div>
                <span className="kit-swatch" style={{ background: k.swatch }} />
              </section>
            ))}
          </div>
        </aside>
      )}
    </div>
  )}
</main>
      {/* ── MOBILE BOTTOM NAVIGATION BAR ───────────────────── */}
      <div className="mobile-bottom-bar">
        <button
          className={`bottom-bar-item ${mainTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setMainTab('dashboard'); setMobileMenuOpen(false); }}
        >
          <span className="bottom-icon">🎮</span>
          <span className="bottom-label">HQ</span>
        </button>
        <button
          className={`bottom-bar-item ${mainTab === 'calendar' ? 'active' : ''}`}
          onClick={() => { setMainTab('calendar'); setMobileMenuOpen(false); }}
        >
          <span className="bottom-icon">📅</span>
          <span className="bottom-label">Calendar</span>
        </button>
        <button
          className={`bottom-bar-item ${mainTab === 'generate' ? 'active' : ''}`}
          onClick={() => { setMainTab('generate'); setMobileMenuOpen(false); }}
        >
          <span className="bottom-icon">✨</span>
          <span className="bottom-label">Create</span>
        </button>
        <button
          className={`bottom-bar-item ${mainTab === 'arcade' ? 'active' : ''}`}
          onClick={() => { setMainTab('arcade'); setMobileMenuOpen(false); }}
        >
          <span className="bottom-icon">🏰</span>
          <span className="bottom-label">Arcade</span>
        </button>
        <button
          className="bottom-bar-item"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span className="bottom-icon">🍔</span>
          <span className="bottom-label">Menu</span>
        </button>
      </div>
    </div>
  );
}

PRELOAD_URLS.forEach((url) => useGLTF.preload(url));

export default App;
