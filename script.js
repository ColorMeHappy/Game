"use strict";

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");

const ui = {
  stability: document.getElementById("stability"),
  coins: document.getElementById("coins"),
  medals: document.getElementById("medals"),
  wave: document.getElementById("wave"),
  score: document.getElementById("score"),
  towerbar: document.getElementById("towerbar"),
  startWave: document.getElementById("startWave"),
  refineryButton: document.getElementById("refineryButton"),
  deleteButton: document.getElementById("deleteButton"),
  speedToggle: document.getElementById("speedToggle"),
  baseButton: document.getElementById("baseButton"),
  mainMenu: document.getElementById("mainMenu"),
  modeList: document.getElementById("modeList"),
  difficultyList: document.getElementById("difficultyList"),
  selectedMapKicker: document.getElementById("selectedMapKicker"),
  selectedMapName: document.getElementById("selectedMapName"),
  selectedMapReward: document.getElementById("selectedMapReward"),
  playButton: document.getElementById("playButton"),
  arsenalButton: document.getElementById("arsenalButton"),
  arsenalScreen: document.getElementById("arsenalScreen"),
  arsenalGrid: document.getElementById("arsenalGrid"),
  backToMenuButton: document.getElementById("backToMenuButton"),
  perkModal: document.getElementById("perkModal"),
  perkTitle: document.getElementById("perkTitle"),
  perkChoices: document.getElementById("perkChoices"),
  towerInspector: document.getElementById("towerInspector"),
  runResult: document.getElementById("runResult"),
  resultKicker: document.getElementById("resultKicker"),
  resultTitle: document.getElementById("resultTitle"),
  resultText: document.getElementById("resultText"),
  resultMenuButton: document.getElementById("resultMenuButton"),
  resultReplayButton: document.getElementById("resultReplayButton"),
  campaignScreen: document.getElementById("campaignScreen"),
  campaignTitle: document.getElementById("campaignTitle"),
  campaignMap: document.getElementById("campaignMap"),
  campaignKicker: document.getElementById("campaignKicker"),
  campaignMapName: document.getElementById("campaignMapName"),
  campaignMapText: document.getElementById("campaignMapText"),
  campaignStartButton: document.getElementById("campaignStartButton"),
  campaignArsenalButton: document.getElementById("campaignArsenalButton"),
  campaignBackButton: document.getElementById("campaignBackButton"),
  storyModal: document.getElementById("storyModal"),
  storyText: document.getElementById("storyText"),
  storyStartButton: document.getElementById("storyStartButton"),
  storySkipButton: document.getElementById("storySkipButton")
};

const WORLD = { width: 1280, height: 720 };
const hudIconCache = new Map();
const hudRenderCache = { upcoming: "", boss: "" };
const STORAGE_KEY = "biocore-defense-profile-v1";
const palette = {
  ground: "#0d1924",
  groundGrid: "rgba(105,170,215,0.075)",
  road: "#1e2d3b",
  roadSide: "#101925",
  roadMark: "rgba(255,185,72,0.88)",
  coral: "#f39752",
  buildingShadow: "rgba(2,8,14,0.56)",
  towerStroke: "#f6e1bd",
  range: "rgba(90,167,216,0.12)",
  invalid: "#d95f63"
};
const path = [
  { x: -80, y: 410 },
  { x: 140, y: 410 },
  { x: 230, y: 310 },
  { x: 365, y: 310 },
  { x: 470, y: 470 },
  { x: 650, y: 470 },
  { x: 760, y: 275 },
  { x: 910, y: 275 },
  { x: 1025, y: 500 },
  { x: 1148, y: 500 }
];

const TWIN_BREACH_MERGE_POINT = { x: 936, y: 410 };
const twinBreachPathDefinitions = [
  [
    { x: -80, y: 232 },
    { x: 146, y: 232 },
    { x: 288, y: 166 },
    { x: 488, y: 166 },
    { x: 638, y: 256 },
    { x: 790, y: 256 },
    { x: 872, y: 332 },
    { x: TWIN_BREACH_MERGE_POINT.x, y: TWIN_BREACH_MERGE_POINT.y },
    { x: 1148, y: 500 }
  ],
  [
    { x: -80, y: 590 },
    { x: 162, y: 590 },
    { x: 304, y: 648 },
    { x: 506, y: 648 },
    { x: 656, y: 556 },
    { x: 810, y: 556 },
    { x: 872, y: 488 },
    { x: TWIN_BREACH_MERGE_POINT.x, y: TWIN_BREACH_MERGE_POINT.y },
    { x: 1148, y: 500 }
  ]
];

const twinBreachBuildingDefinitions = [
  { id: "twin-command-a", x: 78, y: 72, width: 136, height: 92, levels: 2, rangeBonus: 1.12, variant: "relay", corner: "se", sideColor: "#3d4b50", topColor: "#5c7080" },
  { id: "twin-observer-a", x: 310, y: 306, width: 126, height: 94, levels: 3, rangeBonus: 1.18, variant: "tower", corner: "nw", sideColor: "#504552", topColor: "#725f70" },
  { id: "twin-bastion-a", x: 510, y: 42, width: 132, height: 94, levels: 2, rangeBonus: 1.14, variant: "bastion", corner: "sw", sideColor: "#3c4d5d", topColor: "#566b7d" },
  { id: "twin-junction", x: 580, y: 376, width: 142, height: 96, levels: 2, rangeBonus: 1.16, variant: "hab", corner: "ne", sideColor: "#4c5058", topColor: "#69727b" },
  { id: "twin-observer-b", x: 804, y: 112, width: 124, height: 98, levels: 3, rangeBonus: 1.2, variant: "relay", corner: "sw", sideColor: "#514a44", topColor: "#736755" },
  { id: "twin-bastion-b", x: 826, y: 590, width: 132, height: 82, levels: 2, rangeBonus: 1.11, variant: "green", corner: "ne", sideColor: "#424e47", topColor: "#607060" },
  { id: "twin-ruin-a", x: 248, y: 448, width: 112, height: 74, levels: 1, rangeBonus: 1, variant: "ruin", corner: "sw", ruined: true, sideColor: "#464653", topColor: "#665b64" },
  { id: "twin-ruin-b", x: 1010, y: 226, width: 124, height: 78, levels: 1, rangeBonus: 1, variant: "ruin", corner: "se", ruined: true, sideColor: "#45414d", topColor: "#625764" }
];

function rawPathDefinitions() {
  return currentMap()?.id === "twinBreach" ? twinBreachPathDefinitions : [path];
}

function extendRouteEntryBeyondViewport(route) {
  if (!Array.isArray(route) || route.length < 2) {
    return route;
  }

  const bounds = currentBattleSceneBounds(0);
  const first = route[0];
  const second = route[1];
  const reverseX = first.x - second.x;
  const reverseY = first.y - second.y;
  const reverseLength = Math.hypot(reverseX, reverseY) || 1;
  const directionX = reverseX / reverseLength;
  const directionY = reverseY / reverseLength;
  const margin = 88;
  const outsideAlready = first.x < bounds.left - margin || first.x > bounds.right + margin || first.y < bounds.top - margin || first.y > bounds.bottom + margin;

  if (outsideAlready) {
    return route.map(point => ({ ...point }));
  }

  const candidates = [];
  if (directionX < -0.001) candidates.push((bounds.left - margin - first.x) / directionX);
  if (directionX > 0.001) candidates.push((bounds.right + margin - first.x) / directionX);
  if (directionY < -0.001) candidates.push((bounds.top - margin - first.y) / directionY);
  if (directionY > 0.001) candidates.push((bounds.bottom + margin - first.y) / directionY);
  const travel = Math.min(...candidates.filter(value => Number.isFinite(value) && value > 0));
  const extension = Number.isFinite(travel) ? travel : 180;
  const entry = {
    x: first.x + directionX * extension,
    y: first.y + directionY * extension
  };

  return [entry, ...route.map(point => ({ ...point }))];
}

function activePathDefinitions() {
  return rawPathDefinitions().map(route => extendRouteEntryBeyondViewport(route));
}

function activeBuildingDefinitions() {
  return currentMap()?.id === "twinBreach" ? twinBreachBuildingDefinitions : buildingDefinitions;
}

function pathGeometry(routeIndex = 0) {
  const routes = activePathDefinitions();
  const points = routes[Math.max(0, Math.min(routeIndex, routes.length - 1))] || routes[0];
  const routeSegments = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    return { from: point, to: next, length: distance(point, next) };
  });
  return {
    points,
    segments: routeSegments,
    length: routeSegments.reduce((sum, segment) => sum + segment.length, 0)
  };
}

function currentPathLength(routeIndex = 0) {
  return pathGeometry(routeIndex).length;
}

function closestRouteLocation(point) {
  let best = { routeIndex: 0, progress: 0, distance: Infinity };
  activePathDefinitions().forEach((route, routeIndex) => {
    for (let step = 0; step <= 160; step += 1) {
      const progress = step / 160;
      const sample = samplePath(progress, routeIndex);
      const candidateDistance = distance(point, sample);
      if (candidateDistance < best.distance) {
        best = { routeIndex, progress, distance: candidateDistance };
      }
    }
  });
  return best;
}

const buildingDefinitions = [
  { id: "hab-01", x: 74, y: 212, width: 128, height: 92, levels: 2, rangeBonus: 1.1, variant: "hab", corner: "ne", sideColor: "#3d4b50", topColor: "#566873" },
  { id: "relay-02", x: 286, y: 134, width: 102, height: 114, levels: 3, rangeBonus: 1.16, variant: "relay", corner: "sw", sideColor: "#504552", topColor: "#725f70" },
  { id: "bastion-04", x: 542, y: 214, width: 132, height: 94, levels: 2, rangeBonus: 1.12, variant: "bastion", corner: "se", sideColor: "#3c4d5d", topColor: "#566b7d" },
  { id: "towerblock-05", x: 754, y: 92, width: 122, height: 112, levels: 3, rangeBonus: 1.18, variant: "tower", corner: "nw", sideColor: "#514a44", topColor: "#736755" },
  { id: "green-09", x: 1048, y: 584, width: 148, height: 92, levels: 2, rangeBonus: 1.11, variant: "green", corner: "ne", sideColor: "#424e47", topColor: "#607060" },
  { id: "ruin-01", x: 152, y: 542, width: 124, height: 82, levels: 1, rangeBonus: 1, variant: "ruin", corner: "sw", ruined: true, sideColor: "#464653", topColor: "#665b64" },
  { id: "ruin-02", x: 600, y: 582, width: 142, height: 78, levels: 1, rangeBonus: 1, variant: "ruin", corner: "se", ruined: true, sideColor: "#45414d", topColor: "#625764" }
];

const battleThemeDefinitions = {
  harbor: { ground0: "#202632", ground1: "#252a35", ground2: "#302b36", grid: "rgba(242,188,100,0.034)", road: "#3f4656", roadSide: "#2b303c", roadMark: "rgba(242,188,100,0.62)", warm: "rgba(243,151,82,0.065)", cool: "rgba(137,185,242,0.045)" },
  factory: { ground0: "#202b29", ground1: "#26302d", ground2: "#33302d", grid: "rgba(155,215,182,0.034)", road: "#465044", roadSide: "#29342f", roadMark: "rgba(155,215,182,0.58)", warm: "rgba(242,188,100,0.06)", cool: "rgba(96,210,174,0.06)" },
  urban: { ground0: "#222733", ground1: "#282d3a", ground2: "#342d3a", grid: "rgba(246,225,189,0.028)", road: "#4e5363", roadSide: "#2d3240", roadMark: "rgba(242,188,100,0.56)", warm: "rgba(243,151,82,0.05)", cool: "rgba(137,185,242,0.052)" },
  frozen: { ground0: "#1f2b34", ground1: "#253441", ground2: "#2e3744", grid: "rgba(173,199,207,0.04)", road: "#465869", roadSide: "#283642", roadMark: "rgba(191,233,242,0.62)", warm: "rgba(242,188,100,0.035)", cool: "rgba(191,233,242,0.11)" },
  convoy: { ground0: "#29272d", ground1: "#322d33", ground2: "#3a3036", grid: "rgba(243,151,82,0.034)", road: "#514957", roadSide: "#312c36", roadMark: "rgba(243,151,82,0.64)", warm: "rgba(243,151,82,0.09)", cool: "rgba(161,115,148,0.05)" },
  energy: { ground0: "#24263a", ground1: "#2c2d45", ground2: "#302b44", grid: "rgba(197,185,255,0.038)", road: "#46446a", roadSide: "#2b2a45", roadMark: "rgba(197,185,255,0.65)", warm: "rgba(242,188,100,0.045)", cool: "rgba(144,130,216,0.11)" },
  corrupted: { ground0: "#281f29", ground1: "#302632", ground2: "#3c2935", grid: "rgba(217,95,99,0.038)", road: "#51404f", roadSide: "#352a35", roadMark: "rgba(217,95,99,0.62)", warm: "rgba(217,95,99,0.12)", cool: "rgba(96,210,174,0.035)" },
  orbital: { ground0: "#1f2530", ground1: "#252b37", ground2: "#2b2937", grid: "rgba(242,188,100,0.028)", road: "#4a5060", roadSide: "#262c37", roadMark: "rgba(246,225,189,0.6)", warm: "rgba(242,188,100,0.055)", cool: "rgba(137,185,242,0.075)" },
  final: { ground0: "#211f29", ground1: "#292532", ground2: "#382834", grid: "rgba(217,95,99,0.04)", road: "#4c4258", roadSide: "#2c2734", roadMark: "rgba(243,151,82,0.66)", warm: "rgba(217,95,99,0.13)", cool: "rgba(242,188,100,0.04)" }
};

const mapDefinitions = [
  {
    id: "harbor",
    name: "Outer Hive Breach",
    wavesToWin: 8,
    difficulty: 1,
    medalReward: 5,
    type: "Infected Sector",
    biome: "Outer Colony Ruins",
    battleTheme: "harbor",
    risk: "Low",
    reward: "5 Technology Cores, first safe biomass route",
    terrain: "Harbor ruins at the lower edge of the last free region.",
    threats: "Crawler swarms, armored brutes, first alpha brute boss.",
    planetX: 12,
    planetY: 82,
    links: ["twinBreach", "refinerySite", "midtown"]
  },
  {
    id: "twinBreach",
    name: "Twin Breach",
    wavesToWin: 9,
    difficulty: 1.12,
    medalReward: 7,
    type: "Split Approach",
    biome: "Breach Junction",
    battleTheme: "urban",
    risk: "Low",
    reward: "7 Technology Cores, dual-lane junction command route",
    terrain: "Two infected breach lanes converge into one final approach near the reactor core.",
    threats: "Alternating upper and lower attacks, then synchronized assaults through both lanes.",
    mechanicTitle: "Twin Front",
    mechanicText: "Two lanes feed the reactor. Divide your defenses, then destroy both groups at the merge point.",
    introText: "The upper and lower breach lanes are active. Early waves alternate between them. Later waves attack both lanes at the same time. The illuminated junction is your strongest kill zone.",
    battleCamera: { zoom: 0.78, offsetX: 0, offsetY: -54 },
    planetX: 19,
    planetY: 58,
    links: ["harbor", "refinerySite", "midtown"]
  },
  {
    id: "refinerySite",
    name: "Biomass Cradle",
    wavesToWin: 8,
    difficulty: 1.08,
    medalReward: 6,
    type: "Biomass Site",
    biome: "Biomass Processing Cradle",
    battleTheme: "factory",
    risk: "Low",
    reward: "6 Technology Cores, refinery upgrade route",
    terrain: "Collapsed waste-processing district with clean build pads.",
    threats: "Crawler Swarm, Armored Brute and first Spitter contacts.",
    planetX: 24,
    planetY: 70,
    links: ["harbor", "twinBreach", "factoryPermit", "frozenUnderpass"]
  },
  {
    id: "midtown",
    name: "Neural Ruins Switchback",
    wavesToWin: 10,
    difficulty: 1.18,
    medalReward: 8,
    type: "Research Wreckage",
    biome: "Neural Ruins",
    battleTheme: "urban",
    risk: "Medium",
    reward: "8 Technology Cores, sniper research lead",
    terrain: "Broken midtown switchbacks with long firing angles.",
    threats: "Leaper swarms, screamers and armored brutes.",
    planetX: 30,
    planetY: 58,
    links: ["harbor", "twinBreach", "convoyBoss", "sniperRuins"]
  },
  {
    id: "frozenUnderpass",
    name: "Cryo Tomb Passage",
    wavesToWin: 9,
    difficulty: 1.22,
    medalReward: 8,
    type: "Containment Route",
    biome: "Cryo Tombs",
    battleTheme: "frozen",
    risk: "Medium",
    reward: "8 Technology Cores, frost branch pressure test",
    terrain: "Cold transit tunnels where enemy engines lose traction.",
    threats: "Fast leapers, long packs and shielded brutes.",
    planetX: 36,
    planetY: 76,
    links: ["refinerySite", "bioNest", "factoryPermit"]
  },
  {
    id: "factoryPermit",
    name: "Fabrication Vault",
    wavesToWin: 10,
    difficulty: 1.28,
    medalReward: 10,
    type: "Biomass Site",
    biome: "Deep Infrastructure",
    battleTheme: "factory",
    risk: "Medium",
    reward: "10 Technology Cores, Factory Permit priority",
    terrain: "Old license bunker with intact refinery schematics.",
    threats: "Medium armored mutants and timed leaper bursts.",
    planetX: 44,
    planetY: 62,
    links: ["refinerySite", "frozenUnderpass", "teslaSubstation", "brokenDistrict"]
  },
  {
    id: "convoyBoss",
    name: "Alpha Brute Core",
    wavesToWin: 11,
    difficulty: 1.34,
    medalReward: 12,
    type: "Boss Core",
    biome: "Bone-Steel Causeway",
    battleTheme: "convoy",
    risk: "High",
    reward: "12 Technology Cores, boss salvage route",
    terrain: "A straight military causeway into occupied territory.",
    threats: "Bio-Titan boss escorted by dense Crawler Swarm.",
    planetX: 48,
    planetY: 44,
    links: ["midtown", "sniperRuins", "nightline"]
  },
  {
    id: "sniperRuins",
    name: "Railgun Observatory",
    wavesToWin: 10,
    difficulty: 1.42,
    medalReward: 12,
    type: "Research Wreckage",
    biome: "Railgun Observatory",
    battleTheme: "urban",
    risk: "High",
    reward: "12 Technology Cores, Sniper Rail priority",
    terrain: "A ruined observatory with long open approach lanes.",
    threats: "Screamers, brutes and early boss pressure.",
    planetX: 60,
    planetY: 56,
    links: ["midtown", "convoyBoss", "orbitalRoad"]
  },
  {
    id: "teslaSubstation",
    name: "Arc Spine Nest",
    wavesToWin: 11,
    difficulty: 1.5,
    medalReward: 14,
    type: "Research Wreckage",
    biome: "Arc Spine",
    battleTheme: "energy",
    risk: "High",
    reward: "14 Technology Cores, Tesla Relay priority",
    terrain: "An unstable energy junction with tight pack movement.",
    threats: "Dense leaper groups, screamers and chain-friendly swarms.",
    planetX: 62,
    planetY: 34,
    links: ["factoryPermit", "nightline", "orbitalRoad"]
  },
  {
    id: "brokenDistrict",
    name: "Broken Containment Zone",
    wavesToWin: 12,
    difficulty: 1.58,
    medalReward: 15,
    type: "Mutation Zone",
    biome: "Broken District",
    battleTheme: "corrupted",
    risk: "Very High",
    reward: "15 Technology Cores, rare commander draft seed",
    terrain: "Unstable streets with fewer clean build areas.",
    threats: "Mixed Armored Brutes, Burrowers and short-lane pressure.",
    planetX: 54,
    planetY: 80,
    links: ["factoryPermit", "bioNest"]
  },
  {
    id: "nightline",
    name: "Night Swarm Corridor",
    wavesToWin: 12,
    difficulty: 1.66,
    medalReward: 16,
    type: "Infected Sector",
    biome: "Night Swarm Channel",
    battleTheme: "orbital",
    risk: "Very High",
    reward: "16 Technology Cores, high-speed endless arena seed",
    terrain: "High-speed nightline corridor near enemy signal territory.",
    threats: "Dense crawler waves, screamers and heavy alpha pressure.",
    planetX: 72,
    planetY: 26,
    links: ["convoyBoss", "teslaSubstation", "orbitalRoad"]
  },
  {
    id: "bioNest",
    name: "Mother Nest Core",
    wavesToWin: 13,
    difficulty: 1.76,
    medalReward: 18,
    type: "Boss Nest",
    biome: "Biomass Growth",
    battleTheme: "corrupted",
    risk: "Extreme",
    reward: "18 Technology Cores, biomass economy keystone route",
    terrain: "Enemy-grown biomass towers choke the lower approach.",
    threats: "Bio-Titan nest, Splitter Beasts and Armored Brutes.",
    planetX: 72,
    planetY: 70,
    links: ["frozenUnderpass", "brokenDistrict", "finalGate"]
  },
  {
    id: "orbitalRoad",
    name: "Orbital Infestation Road",
    wavesToWin: 14,
    difficulty: 1.9,
    medalReward: 20,
    type: "Final Approach",
    biome: "Orbital Infestation Road",
    battleTheme: "orbital",
    risk: "Extreme",
    reward: "20 Technology Cores, final region access route",
    terrain: "A rising road toward the occupied orbital lift.",
    threats: "Elite brutes, leapers and long boss windows.",
    planetX: 82,
    planetY: 46,
    links: ["sniperRuins", "teslaSubstation", "nightline", "finalGate"]
  },
  {
    id: "finalGate",
    name: "Final Reactor Gate",
    wavesToWin: 15,
    difficulty: 2.05,
    medalReward: 25,
    type: "Reactor Gate",
    biome: "Black Reactor Horizon",
    battleTheme: "final",
    risk: "Apocalyptic",
    reward: "25 Technology Cores, campaign finale path",
    terrain: "The last gate before the enemy planetary command spine.",
    threats: "Bio-Titan chain, elite armor and overwhelming Crawler support.",
    planetX: 92,
    planetY: 58,
    links: ["bioNest", "orbitalRoad"]
  }
];

const difficultyDefinitions = [
  {
    id: "survivor",
    name: "Survivor",
    multiplier: 1,
    unlockAt: 0,
    reward: "Frost Tower enters Endless drafts.",
    endlessUnlock: "frost"
  },
  {
    id: "veteran",
    name: "Veteran",
    multiplier: 1.22,
    unlockAt: 1,
    reward: "Sniper Rail enters Endless drafts.",
    endlessUnlock: "sniper"
  },
  {
    id: "apocalypse",
    name: "Apocalypse",
    multiplier: 1.5,
    unlockAt: 2,
    reward: "Tesla Relay enters Endless drafts.",
    endlessUnlock: "tesla"
  }
];

const modeDefinitions = [
  {
    id: "campaign",
    name: "Campaign",
    text: "Planet campaign. No wave drafts: towers, evolutions and permanent combat systems must be unlocked in the Research Lab."
  },
  {
    id: "endless",
    name: "Endless Rating",
    text: "Survival formats with ranked fair rules or free Research-enabled runs."
  }
];

const endlessVariantDefinitions = [
  {
    id: "ranked",
    name: "Ranked",
    text: "Draft-only progression. Research Lab bonuses are disabled, all tower blueprints can appear in the draft, and every evolution is available.",
    scoreKey: "bestEndlessRankedScore"
  },
  {
    id: "casual",
    name: "No Rating",
    text: "Research-enabled survival. Permanent tower blueprints, evolutions and stat upgrades from the Research Lab are active.",
    scoreKey: "bestEndlessCasualScore"
  }
];

const towerDefinitions = {
  plasma: {
    id: "plasma",
    name: "Plasma Cannon",
    slot: "1",
    role: "Core DPS",
    cost: 52,
    color: "#5aa7d8",
    topColor: "#9fd7ff",
    bodyColor: "#3f5366",
    barrelColor: "#b8e4ff",
    projectileColor: "#75cfff",
    range: 142,
    fireRate: 0.52,
    damage: 13,
    effect: "direct",
    style: "plasma",
    barrels: [
      { side: -4, forward: 7, length: 39, width: 7 },
      { side: 4, forward: 7, length: 39, width: 7 }
    ],
    description: "Two barrels alternate shots. Flexible general DPS, but plasma can miss fast flying monsters."
  },
  frost: {
    id: "frost",
    name: "Frost Tower",
    slot: "2",
    role: "Control",
    cost: 78,
    color: "#63d9ff",
    topColor: "#bfefff",
    bodyColor: "#283f52",
    barrelColor: "#d6e8ee",
    projectileColor: "#bfe9f2",
    range: 118,
    fireRate: 1.15,
    damage: 1.8,
    slow: 0.55,
    slowDuration: 0.72,
    effect: "auraSlow",
    style: "control",
    barrels: [
      { side: 0, forward: 0, length: 0, width: 0 }
    ],
    description: "Aura control tower. Strong against ground packs, but barely slows flying monsters."
  },
  sniper: {
    id: "sniper",
    name: "Sniper Rail",
    slot: "3",
    role: "Boss Killer",
    cost: 132,
    color: "#a17394",
    topColor: "#d6a9c0",
    bodyColor: "#5c4860",
    barrelColor: "#e9cadd",
    projectileColor: "#e9cadd",
    range: 245,
    fireRate: 1.85,
    damage: 86,
    effect: "direct",
    style: "sniper",
    barrels: [
      { side: 0, forward: 18, length: 62, width: 10 }
    ],
    description: "Prioritizes large enemies and deals critical damage to heavy and boss targets."
  },
  tesla: {
    id: "tesla",
    name: "Electro Tower",
    slot: "4",
    role: "Energy Chain",
    cost: 124,
    color: "#4d91c9",
    topColor: "#8de9ff",
    bodyColor: "#31475c",
    barrelColor: "#bceeff",
    projectileColor: "#6fe7ff",
    range: 176,
    fireRate: 1.18,
    damage: 22,
    chains: 4,
    effect: "chain",
    style: "electro",
    barrels: [
      { side: 0, forward: 7, length: 31, width: 8 }
    ],
    description: "Charges a suspended energy core and chains electricity through clustered enemies. Can fire for 3 seconds before a 2 second overheat cooldown."
  },
  cannon: {
    id: "cannon",
    name: "Cannon Tower",
    slot: "5",
    role: "Area Damage",
    cost: 148,
    color: "#b57931",
    topColor: "#f4bd55",
    bodyColor: "#4e4337",
    barrelColor: "#d5d8dc",
    projectileColor: "#ffb33f",
    range: 226,
    fireRate: 1.62,
    damage: 58,
    splashRadius: 54,
    effect: "splash",
    style: "cannon",
    barrels: [
      { side: 0, forward: 13, length: 54, width: 15 }
    ],
    description: "Heavy ground artillery. Cannot attack flying monsters. Shells damage an area and fracture ground enemies."
  },
  refinery: {
    id: "refinery",
    name: "Bio Refinery",
    slot: "6",
    role: "Engineering",
    kind: "infrastructure",
    cost: 0,
    color: "#6aa889",
    topColor: "#9bd7b6",
    bodyColor: "#425b52",
    barrelColor: "#c8ead7",
    projectileColor: "#86ddc0",
    range: 0,
    fireRate: 0,
    damage: 0,
    effect: "refinery",
    style: "refinery",
    canPlaceOnRooftop: false,
    barrels: [],
    description: "Free engineering structure. Converts biomass into materials."
  }
};

const towerEvolutionDefinitions = {
  plasma: [
    { id: "repeater", name: "Repeater Matrix", text: "Higher attack speed and better swarm clearing, but lower damage per shot." },
    { id: "fusion", name: "Fusion Culverin", text: "Heavier plasma shots with small splash damage and stronger burst pressure." }
  ],
  frost: [
    { id: "cryoField", name: "Cryo Field", text: "Larger control radius and stronger slow for locking entire lanes." },
    { id: "shatterCore", name: "Shatter Core", text: "Turns the frost tower into a deadlier control tower that punishes slowed enemies." }
  ],
  sniper: [
    { id: "penetrator", name: "Penetrator Rail", text: "Rail shots pierce every enemy in their path. Damage is reduced by 30% after each penetration." },
    { id: "executioner", name: "Execution Protocol", text: "Deals much higher damage to bosses and wounded elite enemies." }
  ],
  tesla: [
    { id: "arcNode", name: "Arc Node", text: "Adds another chain target and improves charge speed against dense swarms." },
    { id: "stormSpire", name: "Storm Spire", text: "Strengthens the energy core for heavier electric bursts and longer range." }
  ],
  cannon: [
    { id: "clusterShells", name: "Cluster Shells", text: "Larger blast radius, fragment hits, and a wide concussion debuff for grouped enemies." },
    { id: "siegeChamber", name: "Siege Chamber", text: "Much heavier shells with slower reload, stronger direct impact, and a brutal armor-break concussion." }
  ]
};

const arsenalDefinitions = [
  { id: "plasmaCore", name: "Plasma Core", branch: "Core", type: "Start", unlocked: true, cost: 0, x: 50, y: 50, parents: [], text: "Starting AI reactor protocol. Unlocks the central Plasma Cannon." },

  { id: "plasmaDamageI", name: "Hotter Plasma", branch: "Plasma", type: "Plasma Stat", cost: 3, x: 62, y: 46, parents: ["plasmaCore"], text: "Plasma Cannon damage +4." },
  { id: "plasmaDamageII", name: "Dense Bolts", branch: "Plasma", type: "Plasma Stat", cost: 6, x: 74, y: 43, parents: ["plasmaDamageI"], text: "Plasma Cannon damage +5 more." },
  { id: "plasmaPiercer", name: "Fusion Culverin Blueprint", branch: "Plasma", type: "Evolution Unlock", cost: 9, x: 86, y: 40, parents: ["plasmaDamageII"], unlockAt: 1, text: "Unlocks Fusion Culverin evolution. Every fourth Plasma shot also deals +18 heat damage." },

  { id: "plasmaAlternator", name: "Alternating Barrels", branch: "Speed", type: "Plasma Stat", cost: 4, x: 62, y: 57, parents: ["plasmaCore"], text: "Plasma Cannon attack interval -10%." },
  { id: "rapidCapacitors", name: "Rapid Capacitors", branch: "Speed", type: "Plasma Stat", cost: 6, x: 74, y: 60, parents: ["plasmaAlternator"], text: "Plasma Cannon attack interval -10% more." },
  { id: "plasmaOverdrive", name: "Repeater Matrix Blueprint", branch: "Speed", type: "Evolution Unlock", cost: 10, x: 86, y: 63, parents: ["rapidCapacitors"], unlockAt: 2, text: "Unlocks Repeater Matrix evolution. Plasma attack interval -12% and cost scaling is reduced." },

  { id: "cryoLattice", name: "Frost Tower Blueprint", branch: "Frost", type: "Tower Unlock", cost: 5, x: 38, y: 40, parents: ["plasmaCore"], text: "Unlocks Frost Tower for Campaign loadouts and allows it to appear in Endless drafts. Also grants +14% Frost range." },
  { id: "frostRadius", name: "Wider Vapor", branch: "Frost", type: "Frost Stat", cost: 5, x: 28, y: 33, parents: ["cryoLattice"], text: "Frost Tower range +10%." },
  { id: "frostDuration", name: "Long Chill", branch: "Frost", type: "Frost Stat", cost: 6, x: 18, y: 29, parents: ["frostRadius"], text: "Frost slow duration +25%." },
  { id: "darkAsphalt", name: "Dark Asphalt", branch: "Frost", type: "Frost Synergy", cost: 7, x: 28, y: 47, parents: ["cryoLattice"], text: "Slowed enemies take additional decay damage." },
  { id: "absoluteZero", name: "Cryo Field Blueprint", branch: "Frost", type: "Evolution Unlock", cost: 11, x: 14, y: 43, parents: ["darkAsphalt"], unlockAt: 2, text: "Unlocks Cryo Field evolution. Frost pulses also slow more aggressively and last longer." },

  { id: "sniperRailUnlock", name: "Sniper Rail Blueprint", branch: "Sniper", type: "Tower Unlock", cost: 7, x: 38, y: 64, parents: ["plasmaCore"], unlockAt: 1, text: "Unlocks Sniper Rail for Campaign loadouts and allows it to appear in Endless drafts. Also grants +8% Sniper range." },
  { id: "sniperCaliber", name: "Heavy Caliber", branch: "Sniper", type: "Sniper Stat", cost: 6, x: 28, y: 70, parents: ["sniperRailUnlock"], text: "Sniper Rail damage +18." },
  { id: "sniperReload", name: "Smooth Reload", branch: "Sniper", type: "Sniper Stat", cost: 7, x: 18, y: 76, parents: ["sniperCaliber"], text: "Sniper Rail charge and reload time -14%." },
  { id: "sniperStabilizer", name: "Penetrator Rail Blueprint", branch: "Sniper", type: "Evolution Unlock", cost: 9, x: 10, y: 82, parents: ["sniperReload"], unlockAt: 2, text: "Unlocks Penetrator Rail evolution. The first shot from each Sniper also deals 75% more damage." },

  { id: "rangeOptics", name: "Range Optics", branch: "Utility", type: "Global Stat", cost: 5, x: 50, y: 34, parents: ["plasmaCore"], text: "All towers gain +8% range." },
  { id: "adaptiveDraft", name: "Endless Protocol Memory", branch: "Utility", type: "Endless Upgrade", cost: 8, x: 48, y: 20, parents: ["rangeOptics"], unlockAt: 1, text: "Endless Combat Protocol drafts offer four cards instead of three. Campaign has no draft rounds." },

  { id: "cityFunding", name: "City Funding", branch: "Utility", type: "Economy Stat", cost: 4, x: 50, y: 66, parents: ["plasmaCore"], text: "Tower printing costs are reduced by 7%." },
  { id: "refineryFlow", name: "Refinery Flow", branch: "Utility", type: "Factory Stat", cost: 5, x: 40, y: 78, parents: ["cityFunding"], text: "Biomass Refinery processes biomass 25% faster." },
  { id: "refineryPermit", name: "Factory Permit", branch: "Utility", type: "Factory Slot", cost: 6, x: 38, y: 89, parents: ["refineryFlow"], unlockAt: 1, text: "Allows one additional Biomass Refinery." },
  { id: "refineryCatalyst", name: "Bio Catalyst", branch: "Utility", type: "Factory Stat", cost: 7, x: 27, y: 86, parents: ["refineryFlow"], unlockAt: 1, text: "Biomass conversion produces 15% more materials." },
  { id: "bossSalvage", name: "Boss Salvage", branch: "Utility", type: "Core Economy", cost: 8, x: 51, y: 88, parents: ["refineryFlow"], unlockAt: 2, text: "Boss kills extract extra Technology Cores." },

  { id: "teslaRelay", name: "Electro Tower Blueprint", branch: "Tesla", type: "Tower Unlock", cost: 7, x: 62, y: 28, parents: ["rangeOptics"], unlockAt: 1, text: "Unlocks Electro Tower for Campaign loadouts and allows it to appear in Endless drafts. Also grants +6% Tesla range." },
  { id: "teslaCore", name: "Charged Core", branch: "Tesla", type: "Tesla Stat", cost: 7, x: 74, y: 24, parents: ["teslaRelay"], text: "Tesla base damage +6." },
  { id: "teslaChain", name: "Arc Node Blueprint", branch: "Tesla", type: "Evolution Unlock", cost: 8, x: 86, y: 18, parents: ["teslaCore"], text: "Unlocks Arc Node evolution. Tesla also chains to one additional target." },
  { id: "stormNetwork", name: "Storm Spire Blueprint", branch: "Tesla", type: "Evolution Unlock", cost: 12, x: 95, y: 12, parents: ["teslaChain"], unlockAt: 3, text: "Unlocks Storm Spire evolution. Tesla also deals 15% more discharge damage while chaining through at least three enemies." },
  { id: "teslaCooling", name: "Ceramic Heat Sinks", branch: "Tesla", type: "Tesla Cooling", cost: 9, x: 86, y: 31, parents: ["teslaCore"], unlockAt: 2, text: "Tesla overheat cooldown is reduced from 2.0 to 1.6 seconds." },

  { id: "cannonFoundry", name: "Cannon Tower Blueprint", branch: "Cannon", type: "Tower Unlock", cost: 6, x: 64, y: 76, parents: ["cityFunding"], unlockAt: 1, text: "Unlocks Cannon Tower for Campaign loadouts and allows it to appear in Endless drafts. Also grants +8 Cannon damage." },
  { id: "cannonBlast", name: "Cluster Shell Blueprint", branch: "Cannon", type: "Evolution Unlock", cost: 7, x: 76, y: 77, parents: ["cannonFoundry"], text: "Unlocks Cluster Shells evolution. Cannon explosion radius also increases by 12%." },
  { id: "cannonFracture", name: "Fracture Payload", branch: "Cannon", type: "Cannon Support", cost: 9, x: 87, y: 82, parents: ["cannonBlast"], unlockAt: 2, text: "Cannon breach lasts 25% longer and makes enemies 4% more vulnerable." },
  { id: "cannonSiege", name: "Siege Chamber Blueprint", branch: "Cannon", type: "Evolution Unlock", cost: 12, x: 96, y: 88, parents: ["cannonFracture"], unlockAt: 3, text: "Unlocks Siege Chamber evolution. Direct Cannon impacts also deal 22% more damage." },

  { id: "plasmaFocus", name: "Focused Lens", branch: "Plasma", type: "Plasma Range", cost: 6, x: 74, y: 34, parents: ["plasmaDamageI"], text: "Plasma Cannon range +8%." },
  { id: "plasmaEconomy", name: "Compact Emitters", branch: "Speed", type: "Plasma Economy", cost: 7, x: 74, y: 70, parents: ["plasmaAlternator"], text: "Plasma Cannon construction cost -6%." },
  { id: "plasmaMastery", name: "Harmonic Core", branch: "Plasma", type: "Plasma Keystone", cost: 13, x: 95, y: 52, parents: ["plasmaPiercer", "plasmaOverdrive"], unlockAt: 3, text: "Plasma Cannon gains an additional +4% damage scaling per level." },

  { id: "frostDamageLab", name: "Cryo Compression", branch: "Frost", type: "Frost Damage", cost: 7, x: 18, y: 20, parents: ["frostRadius"], text: "Frost Tower damage +15%." },
  { id: "frostEfficiency", name: "Efficient Coolant", branch: "Frost", type: "Frost Economy", cost: 7, x: 7, y: 32, parents: ["frostDuration"], text: "Frost Tower construction cost -8%." },
  { id: "frostBrittle", name: "Shatter Core Blueprint", branch: "Frost", type: "Evolution Unlock", cost: 10, x: 7, y: 53, parents: ["darkAsphalt"], unlockAt: 2, text: "Unlocks Shatter Core evolution. Slowed enemies also take 6% more damage from every tower." },

  { id: "sniperOptics", name: "Long Optics", branch: "Sniper", type: "Sniper Range", cost: 7, x: 28, y: 60, parents: ["sniperRailUnlock"], text: "Sniper Rail range +10%." },
  { id: "sniperBossHunter", name: "Execution Protocol Blueprint", branch: "Sniper", type: "Evolution Unlock", cost: 10, x: 8, y: 66, parents: ["sniperCaliber"], unlockAt: 2, text: "Unlocks Execution Protocol evolution. Sniper Rail also deals 18% more damage to bosses." },
  { id: "sniperChargeCoils", name: "Charge Coils", branch: "Sniper", type: "Sniper Reload", cost: 9, x: 8, y: 92, parents: ["sniperReload"], unlockAt: 2, text: "Sniper Rail charge and reload time -8% more." },

  { id: "teslaChargeSpeed", name: "Fast Induction", branch: "Tesla", type: "Tesla Charge", cost: 8, x: 74, y: 12, parents: ["teslaRelay"], text: "Tesla initial charge time -12%." },
  { id: "teslaDensity", name: "Dense Arc Logic", branch: "Tesla", type: "Tesla Synergy", cost: 10, x: 95, y: 25, parents: ["teslaChain"], unlockAt: 2, text: "Tesla discharge damage +10% while chaining through at least three enemies." },
  { id: "teslaInsulation", name: "Thermal Insulation", branch: "Tesla", type: "Tesla Cooling", cost: 11, x: 95, y: 37, parents: ["teslaCooling"], unlockAt: 3, text: "Tesla overheat cooldown is reduced from 1.6 to 1.4 seconds." },

  { id: "cannonReload", name: "Hydraulic Loader", branch: "Cannon", type: "Cannon Reload", cost: 8, x: 74, y: 90, parents: ["cannonFoundry"], text: "Cannon reload time -10%." },
  { id: "cannonRange", name: "Ballistic Computer", branch: "Cannon", type: "Cannon Range", cost: 8, x: 87, y: 70, parents: ["cannonBlast"], text: "Cannon range +8%." },
  { id: "cannonShock", name: "Shock Lining", branch: "Cannon", type: "Cannon Control", cost: 10, x: 94, y: 76, parents: ["cannonFracture"], unlockAt: 2, text: "Cannon concussion slows affected enemies 6% more strongly." },

  { id: "startingCapital", name: "Reserve Materials", branch: "Utility", type: "Starting Economy", cost: 8, x: 38, y: 10, parents: ["adaptiveDraft"], unlockAt: 2, text: "Start every run with +25 materials." },
  { id: "upgradeFoundry", name: "Modular Foundry", branch: "Utility", type: "Upgrade Economy", cost: 8, x: 61, y: 82, parents: ["cityFunding"], text: "Tower level upgrades cost 8% less." },
  { id: "salvageProtocol", name: "Salvage Protocol", branch: "Utility", type: "Combat Economy", cost: 9, x: 64, y: 95, parents: ["bossSalvage"], unlockAt: 2, text: "Enemy biomass rewards +10%." },
  { id: "coreEfficiency", name: "Core Efficiency", branch: "Utility", type: "Global Damage", cost: 10, x: 60, y: 12, parents: ["rangeOptics"], unlockAt: 2, text: "All combat towers gain +3 base damage." },

  { id: "reactorPulseUnlock", name: "Reactor Pulse", branch: "Future", type: "Future Ability Unlock", cost: 10, x: 72, y: 5, parents: ["coreEfficiency"], unlockAt: 4, future: true, text: "Future active ability blueprint. Must be researched before it can be equipped in a Campaign loadout." },
  { id: "emergencyBarrierUnlock", name: "Emergency Barrier", branch: "Future", type: "Future Ability Unlock", cost: 11, x: 58, y: 4, parents: ["startingCapital"], unlockAt: 4, future: true, text: "Future defensive ability blueprint. Must be researched before it can be equipped in a Campaign loadout." },
  { id: "dronePadUnlock", name: "Drone Pad", branch: "Future", type: "Future Tower Unlock", cost: 9, x: 86, y: 96, parents: ["cannonSiege"], unlockAt: 4, future: true, text: "Future tower blueprint. Must be researched before Drone Pad can be deployed." }
];

const enemyDefinitions = {
  rush: { name: "Crawler Swarm", shape: "crawler", radius: 10, hp: 42, speed: 112, reward: 8, color: "#d95f63", accent: "#f39752", damage: 4, description: "Many weak fast floating organisms." },
  van: { name: "Armored Brute", shape: "brute", radius: 15, hp: 110, speed: 58, reward: 15, color: "#7a5c68", accent: "#f2bc64", damage: 8, armor: 0.12, description: "Slow tank with a hard bio-metal shell." },
  courier: { name: "Spitter", shape: "spitter", radius: 10, hp: 48, speed: 86, reward: 10, color: "#8f9ad6", accent: "#bfe9f2", damage: 5, weakensTowers: true, description: "Ranged organism that disrupts nearby tower systems." },
  breaker: { name: "Splitter Beast", shape: "splitter", radius: 13, hp: 78, speed: 78, reward: 12, color: "#6aa889", accent: "#9bd7b6", damage: 6, splitsInto: "rush", splitCount: 3, description: "Breaks into smaller Crawler Swarm fragments." },
  shield: { name: "Shield Carrier", shape: "shield", radius: 14, hp: 88, speed: 66, reward: 14, color: "#5aa7d8", accent: "#9fd7ff", damage: 7, shieldAura: 72, description: "Protects nearby monsters with a defensive bio-field." },
  burrower: { name: "Burrower", shape: "burrower", radius: 11, hp: 64, speed: 92, reward: 12, color: "#a17394", accent: "#e9cadd", damage: 6, burrower: true, description: "Sometimes accelerates and ignores slow effects." },
  convoy: { name: "Bio-Titan", shape: "titan", radius: 22, hp: 420, speed: 38, reward: 60, color: "#aa819c", accent: "#d95f63", damage: 20, boss: true, phases: true, description: "Boss organism with phase pressure." }
};

function loadProfile() {
  const fallback = {
    medals: 0,
    completedMaps: 0,
    completedDifficulties: 0,
    completedDifficultyMaps: { survivor: 0 },
    currentCampaignNodeId: "harbor",
    bestEndlessRankedScore: 0,
    bestEndlessCasualScore: 0,
    purchased: {
      plasmaCore: true,
      plasmaAlternator: false,
      rapidCapacitors: false,
      plasmaDamageI: false,
      plasmaDamageII: false,
      plasmaPiercer: false,
      plasmaOverdrive: false,
      sniperRailUnlock: false,
      sniperCaliber: false,
      sniperReload: false,
      cryoLattice: false,
      frostRadius: false,
      frostDuration: false,
      absoluteZero: false,
      rangeOptics: false,
      dronePadUnlock: false,
      cityFunding: false,
      refineryFlow: false,
      refineryPermit: false,
      refineryCatalyst: false,
      sniperStabilizer: false,
      bossSalvage: false,
      darkAsphalt: false,
      teslaRelay: false,
      teslaCore: false,
      teslaChain: false,
      stormNetwork: false,
      adaptiveDraft: false,
      teslaCooling: false,
      cannonFoundry: false,
      cannonBlast: false,
      cannonFracture: false,
      cannonSiege: false
    }
  };

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored ? { ...fallback, ...stored, purchased: { ...fallback.purchased, ...stored.purchased } } : fallback;
  } catch {
    return fallback;
  }
}

function saveProfile() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function hasUpgrade(id) {
  if (isRankedEndless() && state.screen !== "arsenal") {
    return id === "plasmaCore";
  }

  return id === "plasmaCore" || Boolean(profile.purchased[id]);
}

const profile = loadProfile();
profile.currentCampaignNodeId = profile.currentCampaignNodeId || "harbor";

const perkPool = [
  { name: "Plasma Timing", category: "tower", tower: "plasma", text: "Plasma Cannons fire 14% faster.", apply: state => state.modifiers.plasmaRate *= 0.86 },
  { name: "Plasma Compression", category: "tower", tower: "plasma", text: "Plasma Cannons gain +7 damage.", apply: state => state.modifiers.plasmaDamage += 7 },
  { name: "Deep Freeze", category: "tower", tower: "frost", text: "Frost effects last 25% longer.", apply: state => state.modifiers.slowDuration *= 1.25 },
  { name: "Cryogenic Pressure", category: "tower", tower: "frost", text: "Frost damage increased by 18%.", apply: state => state.modifiers.frostDamage *= 1.18 },
  { name: "Rail Tuning", category: "tower", tower: "sniper", text: "Sniper Rail gains +20 damage.", apply: state => state.modifiers.sniperDamage += 20 },
  { name: "Rail Cycling", category: "tower", tower: "sniper", text: "Sniper charge and reload time reduced by 12%.", apply: state => state.modifiers.sniperRate *= 0.88 },
  { name: "Arc Capacitors", category: "tower", tower: "tesla", text: "Tesla discharge gains +4 chain damage.", apply: state => state.modifiers.chainDamage += 4 },
  { name: "Thermal Venting", category: "tower", tower: "tesla", text: "Tesla overheat cooldown reduced by 18% for this run.", apply: state => state.modifiers.teslaOverheatCooldown *= 0.82 },
  { name: "Siege Calibration", category: "tower", tower: "cannon", text: "Cannon gains +10 damage and +10% explosion radius.", apply: state => { state.modifiers.cannonDamage += 10; state.modifiers.cannonRadius *= 1.1; } },
  { name: "Fracture Payload", category: "tower", tower: "cannon", text: "Cannon breach lasts 30% longer and increases vulnerability by 4%.", apply: state => { state.modifiers.cannonBreachDuration *= 1.3; state.modifiers.cannonBreachBonus += 0.04; } },

  { name: "Compact Zoning", category: "support", text: "Tower placement costs reduced by 10%.", apply: state => state.modifiers.cost *= 0.9 },
  { name: "Better Lenses", category: "support", text: "All tower range increased by 8%.", apply: state => state.modifiers.range *= 1.08 },
  { name: "Coordinated Fire", category: "support", text: "All combat towers gain +5 damage.", apply: state => state.modifiers.coreDamage += 5 },
  { name: "Kill-Chain Protocol", category: "support", text: "Damage towers gain +7 damage from wave 6 onward.", apply: state => state.modifiers.lateDamage += 7 },

  { name: "Emergency Fabrication", category: "economy", text: "Print 75 materials immediately.", apply: state => state.coins += 75 },
  { name: "Reactor Stabilization", category: "economy", text: "Restore 18 Reactor Integrity.", apply: state => state.stability = Math.min(100, state.stability + 18) },
  { name: "Bio-Harvest", category: "economy", text: "Enemies grant 18% more biomass.", apply: state => state.modifiers.rewards *= 1.18 },
  { name: "Refinery Catalysts", category: "economy", refineryOnly: true, text: "Refineries process 18% faster and yield 8% more materials.", apply: state => { state.modifiers.refineryRate *= 1.18; state.modifiers.refineryYield *= 1.08; } },

  { name: "Rare: Full Spectrum Core", category: "rare", rare: true, oncePerRun: true, text: "All combat towers gain +7 damage and +5% range.", apply: state => { state.modifiers.coreDamage += 7; state.modifiers.range *= 1.05; } },
  { name: "Rare: Factory Drop", category: "rare", endlessOnly: true, rare: true, oncePerRun: true, text: "Gain +1 refinery slot for this run.", apply: state => state.refineryCapacityBonus += 1 }
];

const waves = [
  [{ type: "rush", count: 16, gap: 0.45 }],
  [{ type: "rush", count: 18, gap: 0.38 }, { type: "van", count: 3, gap: 1.1 }],
  [{ type: "courier", count: 10, gap: 0.55 }, { type: "rush", count: 18, gap: 0.28 }],
  [{ type: "breaker", count: 6, gap: 0.8 }, { type: "burrower", count: 8, gap: 0.48 }],
  [{ type: "van", count: 8, gap: 0.62 }, { type: "shield", count: 4, gap: 1.05 }, { type: "convoy", count: 1, gap: 0.8 }],
  [{ type: "breaker", count: 12, gap: 0.5 }, { type: "rush", count: 26, gap: 0.24 }],
  [{ type: "shield", count: 7, gap: 0.72 }, { type: "courier", count: 16, gap: 0.38 }, { type: "burrower", count: 14, gap: 0.32 }],
  [{ type: "van", count: 16, gap: 0.42 }, { type: "breaker", count: 14, gap: 0.42 }, { type: "rush", count: 36, gap: 0.2 }]
];

const state = {
  stability: 100,
  coins: 140,
  biomass: 0,
  medals: 0,
  score: 0,
  screen: "menu",
  runMode: "campaign",
  endlessVariantId: "ranked",
  selectedDifficultyId: "survivor",
  selectedMapId: "harbor",
  currentCampaignNodeId: profile.currentCampaignNodeId,
  campaignBriefingOpen: false,
  arsenalReturnScreen: "menu",
  wave: 0,
  selectedTowerId: "plasma",
  deleteMode: false,
  deleteHoverTower: null,
  inspectorTimer: 0,
  paused: false,
  baseOverlayOpen: false,
  refineryCapacityBonus: 0,
  runPerks: {},
  speed: 1,
  runningWave: false,
  placementGhost: { x: 0, y: 0, visible: false },
  towers: [],
  enemies: [],
  projectiles: [],
  spawnQueue: [],
  spawnTimer: 0,
  autoStartTimer: 0,
  purchaseCounts: {},
  runUnlockedTowers: { plasma: true, frost: false, sniper: false, tesla: false, cannon: false },
  selectedPlacedTower: null,
  selectedMapStructure: null,
  runEnded: false,
  baseHitPulse: 0,
  pendingTechCore: null,
  pendingDraftAfterCore: null,
  arsenalCamera: {
    x: 0,
    y: 0,
    zoom: 0.82,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    originX: 0,
    originY: 0,
    fitted: false
  },
  campaignCamera: {
    x: 0,
    y: 0,
    zoom: 1,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    originX: 0,
    originY: 0,
    fitted: false
  },
  modifiers: {
    range: 1,
    cost: 1,
    rewards: 1,
    plasmaRate: 1,
    plasmaDamage: 0,
    slowDuration: 1,
    frostDamage: 1,
    chainDamage: 0,
    teslaOverheatCooldown: 1,
    sniperDamage: 0,
    sniperRate: 1,
    cannonDamage: 0,
    cannonRadius: 1,
    cannonBreachDuration: 1,
    cannonBreachBonus: 0,
    lateDamage: 0,
    coreDamage: 0,
    coreFireRate: 1,
    refineryRate: 1,
    refineryYield: 1
  }
};

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

const segments = path.slice(0, -1).map((point, index) => {
  const next = path[index + 1];
  return { from: point, to: next, length: distance(point, next) };
});

const pathLength = segments.reduce((sum, segment) => sum + segment.length, 0);

function samplePath(progress, routeIndex = 0) {
  const geometry = pathGeometry(routeIndex);
  let remaining = clamp(progress, 0, 1) * geometry.length;
  for (const segment of geometry.segments) {
    if (remaining <= segment.length) {
      const t = segment.length <= 0 ? 0 : remaining / segment.length;
      return {
        x: lerp(segment.from.x, segment.to.x, t),
        y: lerp(segment.from.y, segment.to.y, t)
      };
    }
    remaining -= segment.length;
  }
  return geometry.points[geometry.points.length - 1];
}

function distanceToPath(point) {
  let best = Infinity;
  activePathDefinitions().forEach((route, routeIndex) => {
    const geometry = pathGeometry(routeIndex);
    geometry.segments.forEach(segment => {
      const vx = segment.to.x - segment.from.x;
      const vy = segment.to.y - segment.from.y;
      const wx = point.x - segment.from.x;
      const wy = point.y - segment.from.y;
      const denominator = vx * vx + vy * vy || 1;
      const c = Math.max(0, Math.min(1, (wx * vx + wy * vy) / denominator));
      const projection = { x: segment.from.x + vx * c, y: segment.from.y + vy * c };
      best = Math.min(best, distance(point, projection));
    });
  });
  return best;
}

function buildTowerBar() {
  ui.towerbar.innerHTML = "";
  Object.values(towerDefinitions).filter(definition => definition.kind !== "infrastructure" && isTowerAvailable(definition)).forEach(definition => {
    const button = document.createElement("button");
    button.className = `tower-card ${definition.id === state.selectedTowerId ? "active" : ""}`;
    button.innerHTML = `<b>${definition.slot}. ${definition.name} - ${towerCost(definition)}</b><span>${definition.description}</span>`;
    button.addEventListener("click", () => {
      selectBuildOption(definition.id);
    });
    ui.towerbar.appendChild(button);
  });
  syncBuildControls();
}

function selectBuildOption(id) {
  if (id === "refinery" && placedRefineryCount() >= maxRefineryCount()) {
    state.selectedTowerId = null;
    state.placementGhost.visible = false;
    syncBuildControls();
    return;
  }
  state.selectedTowerId = id;
  state.selectedMapStructure = null;
  state.deleteMode = false;
  state.deleteHoverTower = null;
  state.selectedPlacedTower = null;
  state.inspectorTimer = 0;
  ui.towerInspector.classList.add("hidden");
  buildTowerBar();
  syncBuildControls();
}

function toggleDeleteMode() {
  state.deleteMode = !state.deleteMode;
  state.deleteHoverTower = null;
  state.selectedTowerId = null;
  state.selectedPlacedTower = null;
  state.selectedMapStructure = null;
  state.inspectorTimer = 0;
  state.placementGhost.visible = false;
  ui.towerInspector.classList.add("hidden");
  buildTowerBar();
  syncBuildControls();
}

function syncBuildControls() {
  const refineryCount = placedRefineryCount();
  const refineryCapacity = maxRefineryCount();
  const refineryFull = refineryCount >= refineryCapacity;

  if (ui.refineryButton) {
    const countNode = ui.refineryButton.querySelector("small");
    if (countNode) {
      countNode.textContent = `${refineryCount}/${refineryCapacity}`;
    }
    ui.refineryButton.title = refineryFull
      ? `Refinery limit reached (${refineryCount}/${refineryCapacity})`
      : `Build Bio Refinery (${refineryCount}/${refineryCapacity})`;
    ui.refineryButton.disabled = refineryFull;
    ui.refineryButton.classList.toggle("capacity-full", refineryFull);

    if (refineryFull && state.selectedTowerId === "refinery") {
      state.selectedTowerId = null;
      state.placementGhost.visible = false;
    }
    ui.refineryButton.classList.toggle("active", !refineryFull && state.selectedTowerId === "refinery");
  }

  if (ui.deleteButton) {
    ui.deleteButton.classList.toggle("active", state.deleteMode);
    ui.deleteButton.setAttribute("aria-pressed", state.deleteMode ? "true" : "false");
  }
}

function placedRefineryCount() {
  return state.towers.filter(tower => tower.id === "refinery").length;
}

function maxRefineryCount() {
  const arsenalCapacity = hasUpgrade("refineryPermit") ? 1 : 0;
  return 1 + arsenalCapacity + state.refineryCapacityBonus;
}

function isTowerAvailable(definition) {
  if (definition.kind === "infrastructure") {
    return !isRankedEndless();
  }

  return Boolean(state.runUnlockedTowers[definition.id]);
}

function hasResearchBlueprint(id) {
  return id === "plasmaCore" || Boolean(profile.purchased[id]);
}

function campaignTowerBlueprints() {
  return {
    plasma: true,
    frost: hasResearchBlueprint("cryoLattice"),
    sniper: hasResearchBlueprint("sniperRailUnlock"),
    tesla: hasResearchBlueprint("teslaRelay"),
    cannon: hasResearchBlueprint("cannonFoundry")
  };
}

function initialRunTowerBlueprints() {
  if (state.runMode === "campaign") {
    return campaignTowerBlueprints();
  }
  if (state.runMode === "endless" && state.endlessVariantId === "casual") {
    return campaignTowerBlueprints();
  }
  return { plasma: true, frost: false, sniper: false, tesla: false, cannon: false };
}

const evolutionResearchBlueprints = {
  plasma: { repeater: "plasmaOverdrive", fusion: "plasmaPiercer" },
  frost: { cryoField: "absoluteZero", shatterCore: "frostBrittle" },
  sniper: { penetrator: "sniperStabilizer", executioner: "sniperBossHunter" },
  tesla: { arcNode: "teslaChain", stormSpire: "stormNetwork" },
  cannon: { clusterShells: "cannonBlast", siegeChamber: "cannonSiege" }
};

function isEvolutionUnlockedByResearch(towerId, evolutionId) {
  if (isRankedEndless()) {
    return true;
  }
  const researchId = evolutionResearchBlueprints[towerId]?.[evolutionId];
  return researchId ? hasResearchBlueprint(researchId) : true;
}

function isTowerUnlockedByArsenal(definition) {
  if (definition.kind === "infrastructure" || definition.id === "plasma") {
    return true;
  }
  if (definition.id === "frost") {
    return hasResearchBlueprint("cryoLattice");
  }
  if (definition.id === "sniper") {
    return hasResearchBlueprint("sniperRailUnlock");
  }
  if (definition.id === "tesla") {
    return hasResearchBlueprint("teslaRelay");
  }
  if (definition.id === "cannon") {
    return hasResearchBlueprint("cannonFoundry");
  }
  return false;
}

function isTowerEligibleForDraft(definition) {
  if (!definition || definition.kind === "infrastructure" || definition.id === "plasma") {
    return false;
  }
  return isRankedEndless() || isTowerUnlockedByArsenal(definition);
}

function isRankedEndless() {
  return state.runMode === "endless" && state.endlessVariantId === "ranked";
}

function isEndlessTowerUnlocked(towerId) {
  const definition = towerDefinitions[towerId];
  if (!definition) {
    return false;
  }
  return isRankedEndless() ? definition.kind !== "infrastructure" : isTowerUnlockedByArsenal(definition);
}

function towerCost(definition) {
  if (definition.kind === "infrastructure") {
    return 0;
  }

  const bought = state.purchaseCounts[definition.id] || 0;
  const permanentDiscount = hasUpgrade("cityFunding") ? 0.93 : 1;
  const plasmaDiscount = definition.id === "plasma" && hasUpgrade("plasmaEconomy") ? 0.94 : 1;
  const frostDiscount = definition.id === "frost" && hasUpgrade("frostEfficiency") ? 0.92 : 1;
  const scaling = definition.id === "plasma" && hasUpgrade("plasmaOverdrive") ? 1.035 : 1.05;
  return Math.round(definition.cost * state.modifiers.cost * permanentDiscount * plasmaDiscount * frostDiscount * Math.pow(scaling, bought));
}

function towerRange(definition, tower = null) {
  if (definition.kind === "infrastructure") {
    return 0;
  }

  const frostUnlockBonus = definition.id === "frost" && hasUpgrade("cryoLattice") ? 1.14 : 1;
  const frostRangeBonus = definition.id === "frost" && hasUpgrade("frostRadius") ? 1.1 : 1;
  const rangeBonus = hasUpgrade("rangeOptics") ? 1.08 : 1;
  const teslaRangeBonus = definition.id === "tesla" && hasUpgrade("teslaRelay") ? 1.06 : 1;
  const plasmaRangeBonus = definition.id === "plasma" && hasUpgrade("plasmaFocus") ? 1.08 : 1;
  const sniperFoundationBonus = definition.id === "sniper" && hasUpgrade("sniperRailUnlock") ? 1.08 : 1;
  const sniperOpticsBonus = definition.id === "sniper" && hasUpgrade("sniperOptics") ? 1.1 : 1;
  const cannonRangeBonus = definition.id === "cannon" && hasUpgrade("cannonRange") ? 1.08 : 1;
  const heightBonus = tower?.heightRangeBonus || 1;
  let range = definition.range * state.modifiers.range * frostUnlockBonus * frostRangeBonus * rangeBonus * teslaRangeBonus * plasmaRangeBonus * sniperFoundationBonus * sniperOpticsBonus * cannonRangeBonus * heightBonus * (1 + 0.035 * ((tower?.level || 1) - 1));
  if (tower?.evolution === "cryoField") {
    range *= 1.22;
  } else if (tower?.evolution === "stormSpire") {
    range *= 1.12;
  } else if (tower?.evolution === "executioner") {
    range *= 1.06;
  } else if (tower?.evolution === "clusterShells") {
    range *= 1.05;
  }
  return range;
}

function damageForTower(definition, tower) {
  if (definition.kind === "infrastructure") {
    return 0;
  }

  const levelStep = 0.08 + (definition.id === "plasma" && hasUpgrade("plasmaMastery") ? 0.01 : 0);
  const levelBonus = tower ? 1 + levelStep * (tower.level - 1) : 1;
  const lateDamage = state.wave >= 6 ? state.modifiers.lateDamage : 0;
  const sniperBonus = definition.id === "sniper"
    ? state.modifiers.sniperDamage + (hasUpgrade("sniperCaliber") ? 18 : 0) + (hasUpgrade("sniperStabilizer") ? 18 : 0)
    : 0;
  const plasmaBonus = definition.id === "plasma"
    ? (hasUpgrade("plasmaDamageI") ? 4 : 0) + (hasUpgrade("plasmaDamageII") ? 5 : 0) + state.modifiers.plasmaDamage
    : 0;
  const teslaBonus = definition.id === "tesla"
    ? (hasUpgrade("teslaCore") ? 6 : 0)
    : 0;
  const cannonBonus = definition.id === "cannon"
    ? (hasUpgrade("cannonFoundry") ? 8 : 0) + state.modifiers.cannonDamage
    : 0;
  let damage = definition.damage + sniperBonus + plasmaBonus + teslaBonus + cannonBonus + lateDamage + state.modifiers.coreDamage + (hasUpgrade("coreEfficiency") ? 3 : 0);
  if (definition.id === "frost") {
    damage *= state.modifiers.frostDamage * (hasUpgrade("frostDamageLab") ? 1.15 : 1);
  }
  if (tower?.evolution === "repeater") {
    damage *= 0.8;
  } else if (tower?.evolution === "fusion") {
    damage += 24;
  } else if (tower?.evolution === "cryoField") {
    damage *= 0.55;
  } else if (tower?.evolution === "shatterCore") {
    damage *= 1.85;
  } else if (tower?.evolution === "executioner") {
    damage += 12;
  } else if (tower?.evolution === "arcNode") {
    damage += 6;
  } else if (tower?.evolution === "stormSpire") {
    damage += 14;
  } else if (tower?.evolution === "clusterShells") {
    damage *= 0.88;
  } else if (tower?.evolution === "siegeChamber") {
    damage *= 1.6;
  }
  return damage * levelBonus;
}

function fireIntervalForTower(definition, tower) {
  if (definition.kind === "infrastructure") {
    return Number.POSITIVE_INFINITY;
  }

  const levelBonus = tower ? Math.pow(0.97, tower.level - 1) : 1;
  const plasmaBonus = definition.id === "plasma" && hasUpgrade("plasmaAlternator") ? 0.9 : 1;
  const capacitorBonus = definition.id === "plasma" && hasUpgrade("rapidCapacitors") ? 0.9 : 1;
  const overdriveBonus = definition.id === "plasma" && hasUpgrade("plasmaOverdrive") ? 0.88 : 1;
  const sniperReloadBonus = definition.id === "sniper" && hasUpgrade("sniperReload") ? 0.86 : 1;
  const sniperCoilBonus = definition.id === "sniper" && hasUpgrade("sniperChargeCoils") ? 0.92 : 1;
  const cannonReloadBonus = definition.id === "cannon" && hasUpgrade("cannonReload") ? 0.9 : 1;
  const sniperRunBonus = definition.id === "sniper" ? state.modifiers.sniperRate : 1;
  const runBonus = definition.id === "plasma" ? state.modifiers.plasmaRate : 1;
  let interval = definition.fireRate * state.modifiers.coreFireRate * runBonus * plasmaBonus * capacitorBonus * overdriveBonus * sniperReloadBonus * sniperCoilBonus * cannonReloadBonus * sniperRunBonus * levelBonus;
  if (tower?.evolution === "repeater") {
    interval *= 0.72;
  } else if (tower?.evolution === "fusion") {
    interval *= 1.14;
  } else if (tower?.evolution === "penetrator") {
    interval *= 0.94;
  } else if (tower?.evolution === "executioner") {
    interval *= 1.08;
  } else if (tower?.evolution === "arcNode") {
    interval *= 0.9;
  } else if (tower?.evolution === "stormSpire") {
    interval *= 1.05;
  } else if (tower?.evolution === "clusterShells") {
    interval *= 0.92;
  } else if (tower?.evolution === "siegeChamber") {
    interval *= 1.32;
  }
  return interval;
}

function currentMap() {
  return mapDefinitions.find(map => map.id === state.selectedMapId) || mapDefinitions[0];
}

function currentBattleCamera() {
  const map = currentMap();
  const configured = map?.battleCamera || {};
  return {
    zoom: clamp(Number(configured.zoom) || 0.88, 0.68, 1),
    offsetX: Number(configured.offsetX) || 0,
    offsetY: Number.isFinite(Number(configured.offsetY)) ? Number(configured.offsetY) : -10
  };
}

function applyBattleCameraTransform() {
  const camera = currentBattleCamera();
  const centerX = WORLD.width * 0.5;
  const centerY = WORLD.height * 0.5;
  context.translate(centerX + camera.offsetX, centerY + camera.offsetY);
  context.scale(camera.zoom, camera.zoom);
  context.translate(-centerX, -centerY);
}

function battleScreenPointToWorld(point) {
  const camera = currentBattleCamera();
  const centerX = WORLD.width * 0.5;
  const centerY = WORLD.height * 0.5;
  return {
    x: centerX + (point.x - centerX - camera.offsetX) / camera.zoom,
    y: centerY + (point.y - centerY - camera.offsetY) / camera.zoom
  };
}

function currentBattleSceneBounds(padding = 0) {
  const topLeft = battleScreenPointToWorld({ x: 0, y: 0 });
  const bottomRight = battleScreenPointToWorld({ x: WORLD.width, y: WORLD.height });
  return {
    left: Math.min(topLeft.x, bottomRight.x) - padding,
    right: Math.max(topLeft.x, bottomRight.x) + padding,
    top: Math.min(topLeft.y, bottomRight.y) - padding,
    bottom: Math.max(topLeft.y, bottomRight.y) + padding
  };
}

function activeBasePoint() {
  const routes = activePathDefinitions();
  const primaryRoute = routes[0] || path;
  return primaryRoute[primaryRoute.length - 1];
}

function drawBattleViewportBackdrop() {
  const gradient = context.createLinearGradient(0, 0, WORLD.width, WORLD.height);
  gradient.addColorStop(0, "#071019");
  gradient.addColorStop(0.5, "#0b151f");
  gradient.addColorStop(1, "#070e16");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WORLD.width, WORLD.height);
}

function currentDifficulty() {
  return difficultyDefinitions.find(difficulty => difficulty.id === state.selectedDifficultyId) || difficultyDefinitions[0];
}

function completedMapsForCurrentDifficulty() {
  return profile.completedDifficultyMaps?.[state.selectedDifficultyId] || 0;
}

function startWave() {
  if (state.screen !== "game" || state.runningWave || state.stability <= 0 || state.runEnded || state.paused || isDraftOpen()) {
    return;
  }

  const source = waves[state.wave % waves.length];
  state.spawnQueue = [];
  let cursor = 0;
  source.forEach(group => {
    for (let index = 0; index < group.count; index += 1) {
      state.spawnQueue.push({ time: cursor, type: group.type });
      cursor += group.gap;
    }
    cursor += 1.1;
  });
  state.spawnQueue.sort((a, b) => a.time - b.time);
  state.spawnTimer = 0;
  state.autoStartTimer = 0;
  state.runningWave = true;
  ui.startWave.disabled = true;
}

function spawnEnemy(type, routeIndex = 0) {
  const definition = enemyDefinitions[type];
  const campaignDifficulty = state.runMode === "campaign" ? currentDifficulty().multiplier : 1;
  const endlessWave = Math.max(0, state.wave);
  const healthGrowth = state.runMode === "endless" ? 1 + endlessWave * 0.065 : 1 + state.wave * 0.12;
  const speedGrowth = state.runMode === "endless" ? Math.min(1.32, 1 + endlessWave * 0.006) : 1;
  const damageGrowth = state.runMode === "endless" ? 1 + endlessWave * 0.018 : 1;
  const armorGrowth = state.runMode === "endless" ? Math.min(0.12, endlessWave * 0.002) : 0;
  const waveScale = healthGrowth * currentMap().difficulty * campaignDifficulty;
  state.enemies.push({
    ...definition,
    type,
    hp: Math.round(definition.hp * waveScale),
    maxHp: Math.round(definition.hp * waveScale),
    speed: definition.speed * speedGrowth,
    damage: Math.max(1, Math.round(definition.damage * damageGrowth)),
    armor: definition.armor ? Math.min(0.48, definition.armor + armorGrowth) : definition.armor,
    progress: 0,
    slowTimer: 0,
    slowMultiplier: 1,
    phaseTimer: 0,
    splitDepth: 0,
    routeIndex,
    pos: samplePath(0, routeIndex)
  });
}

function clearActionState() {
  state.selectedTowerId = null;
  state.deleteMode = false;
  state.deleteHoverTower = null;
  state.placementGhost.visible = false;
  buildTowerBar();
  syncBuildControls();
}

function clearInspector() {
  state.selectedPlacedTower = null;
  state.selectedMapStructure = null;
  state.inspectorTimer = 0;
  ui.towerInspector.classList.add("hidden");
  ui.towerInspector.innerHTML = "";
}

function placeTower(world, options = {}) {
  if (state.screen !== "game" || state.runEnded || state.baseOverlayOpen || isDraftOpen()) {
    return;
  }

  const existingTower = findTowerAt(world);
  if (state.deleteMode) {
    if (existingTower) {
      deleteTower(existingTower);
      if (!options.keepAction) {
        clearActionState();
      }
    } else {
      clearInspector();
    }
    return;
  }

  if (existingTower) {
    state.selectedPlacedTower = existingTower;
    state.selectedMapStructure = null;
    state.selectedTowerId = null;
    state.placementGhost.visible = false;
    buildTowerInspector();
    buildTowerBar();
    return;
  }

  clearInspector();

  if (!state.selectedTowerId) {
    return;
  }

  const selectedBuildId = state.selectedTowerId;
  const definition = towerDefinitions[state.selectedTowerId];
  const cost = towerCost(definition);
  if (definition.id === "refinery" && placedRefineryCount() >= maxRefineryCount()) {
    return;
  }

  if (state.coins < cost || !isValidPlacement(world, definition)) {
    return;
  }

  const building = definition.canPlaceOnRooftop === false ? null : buildingAt(world);
  state.coins -= cost;
  state.purchaseCounts[definition.id] = (state.purchaseCounts[definition.id] || 0) + 1;
  state.towers.push({
    id: definition.id,
    x: world.x,
    y: world.y,
    level: 1,
    xp: 0,
    cooldown: 0,
    pulse: 0,
    angle: -Math.PI / 2,
    spin: 0,
    barrelIndex: 0,
    shotsFired: 0,
    chargeTimer: 0,
    chargeDuration: 0.72,
    chargeProgress: 0,
    chargeTarget: null,
    holdCharge: false,
    postShotDelay: 0,
    pendingChargeDuration: 0.72,
    chargeDecayTimer: 0,
    chargeDecayDuration: 0,
    arcActive: false,
    arcTargets: [],
    arcRetargetTimer: 0,
    arcFireTimer: 0,
    arcVisualTimer: 0,
    overheatTimer: 0,
    overheatDuration: 0,
    buildingId: building?.id || null,
    heightRangeBonus: building?.rangeBonus || 1,
    costPaid: cost,
    evolution: null,
    recoils: definition.barrels.map(() => 0),
    muzzleFlash: null
  });
  state.selectedPlacedTower = null;
  ui.towerInspector.classList.add("hidden");
  state.selectedTowerId = selectedBuildId;
  state.placementGhost.visible = true;
  buildTowerBar();
}

function findTowerAt(point) {
  return state.towers.find(tower => distance(point, tower) <= 34) || null;
}

function buildTowerInspector() {
  const tower = state.selectedPlacedTower;
  if (!tower) {
    ui.towerInspector.classList.add("hidden");
    return;
  }

  const definition = towerDefinitions[tower.id];
  const building = activeBuildingDefinitions().find(item => item.id === tower.buildingId);
  const heightText = building
    ? tower.heightRangeBonus > 1
      ? `<span>Roof height bonus: +${Math.round((tower.heightRangeBonus - 1) * 100)}% range.</span>`
      : `<span>Ruined roof: no height bonus.</span>`
    : "";
  const evolution = getTowerEvolutionDefinition(tower);
  const levelText = definition.kind === "infrastructure"
    ? "Engineering structure"
    : `Level ${tower.level}${evolution ? ` - ${evolution.name}` : tower.level >= 3 ? " - Evolution ready" : ""}`;

  ui.towerInspector.innerHTML = `
    <b>${definition.name}</b>
    <span>${definition.role}</span>
    <p>${definition.kind === "infrastructure"
      ? `Conversion ${Math.round(refineryConversionRatePerSecond())} biomass/sec - Refund ${Math.round((tower.costPaid || definition.cost) * 0.65)} materials`
      : `Damage ${Math.round(damageForTower(definition, tower))} · Range ${Math.round(towerRange(definition, tower))}`}</p>
    <span>${levelText}</span>
    ${heightText}
    <span>${definition.kind === "infrastructure"
      ? "Converts biomass into materials while it remains standing."
      : evolution
        ? evolution.text
        : "Captured Technology Cores are studied in the Research Lab between runs."}</span>
  `;

  const actions = document.createElement("div");
  actions.className = "tower-actions";

  if (definition.kind !== "infrastructure") {
    const upgradeButton = document.createElement("button");
    const upgradeCost = towerUpgradeCost(definition, tower);
    if (tower.level < 3) {
      upgradeButton.className = "tower-primary";
      upgradeButton.textContent = `Upgrade - ${upgradeCost}`;
      upgradeButton.disabled = state.coins < upgradeCost;
      upgradeButton.addEventListener("click", () => upgradeTower(tower));
      actions.appendChild(upgradeButton);
    } else if (!tower.evolution && towerEvolutionDefinitions[tower.id]) {
      upgradeButton.className = "tower-primary";
      upgradeButton.textContent = "Choose Evolution";
      upgradeButton.addEventListener("click", () => showTowerEvolutionDraft(tower));
      actions.appendChild(upgradeButton);
    }
  }

  const sellButton = document.createElement("button");
  sellButton.className = "tower-secondary";
  sellButton.textContent = `Recycle - ${Math.round((tower.costPaid || definition.cost) * 0.65)}`;
  sellButton.addEventListener("click", () => deleteTower(tower));
  actions.appendChild(sellButton);

  ui.towerInspector.appendChild(actions);
  state.inspectorTimer = 999;
  ui.towerInspector.classList.remove("hidden");
}

function getTowerEvolutionDefinition(tower) {
  if (!tower?.evolution || !towerEvolutionDefinitions[tower.id]) {
    return null;
  }
  return towerEvolutionDefinitions[tower.id].find(item => item.id === tower.evolution) || null;
}

function towerUpgradeCost(definition, tower) {
  if (definition.kind === "infrastructure" || tower.level >= 3) {
    return Infinity;
  }
  const multiplier = tower.level === 1 ? 0.65 : 0.9;
  return Math.round(definition.cost * multiplier * (hasUpgrade("upgradeFoundry") ? 0.92 : 1));
}

function upgradeTower(tower) {
  const definition = towerDefinitions[tower.id];
  const cost = towerUpgradeCost(definition, tower);
  if (!Number.isFinite(cost) || state.coins < cost) {
    return;
  }
  state.coins -= cost;
  tower.level += 1;
  tower.costPaid = (tower.costPaid || definition.cost) + cost;
  if (definition.id === "sniper") {
    tower.pendingChargeDuration = Math.max(0.18, fireIntervalForTower(definition, tower) - 0.1);
    tower.chargeDuration = tower.pendingChargeDuration;
  }
  buildTowerInspector();
  buildTowerBar();
  syncUI();
}

function applyTowerEvolution(tower, evolutionId) {
  if (!tower || !state.towers.includes(tower) || tower.level < 10) {
    return;
  }
  const options = towerEvolutionDefinitions[tower.id] || [];
  if (!options.some(option => option.id === evolutionId) || !isEvolutionUnlockedByResearch(tower.id, evolutionId)) {
    return;
  }
  tower.evolution = evolutionId;
  if (tower.id === "sniper") {
    tower.pendingChargeDuration = Math.max(0.18, fireIntervalForTower(towerDefinitions[tower.id], tower) - 0.1);
    tower.chargeDuration = tower.pendingChargeDuration;
  }
  state.selectedPlacedTower = tower;
  buildTowerInspector();
  syncUI();
}

function showTowerEvolutionDraft(tower) {
  if (!tower || !state.towers.includes(tower)) {
    return;
  }
  state.selectedPlacedTower = tower;
  buildTowerInspector();
}

function deleteTower(tower) {
  const index = state.towers.indexOf(tower);
  if (index < 0) {
    return;
  }

  const definition = towerDefinitions[tower.id];
  state.coins += Math.round((tower.costPaid || definition.cost) * 0.65);
  state.towers.splice(index, 1);
  state.selectedPlacedTower = null;
  ui.towerInspector.classList.add("hidden");
  buildTowerBar();
  syncUI();
}

function isValidPlacement(point, definition = towerDefinitions[state.selectedTowerId]) {
  if (distanceToPath(point) < 48) {
    return false;
  }
  if (definition?.id === "refinery" && placedRefineryCount() >= maxRefineryCount()) {
    return false;
  }
  if (definition?.canPlaceOnRooftop === false && buildingAt(point)) {
    return false;
  }
  return state.towers.every(tower => distance(point, tower) > 56);
}

function buildingAt(point) {
  return activeBuildingDefinitions().find(building =>
    building.buildable !== false &&
    point.x >= building.x &&
    point.x <= building.x + building.width &&
    point.y >= building.y &&
    point.y <= building.y + building.height
  ) || null;
}

function isDraftOpen() {
  return !ui.perkModal.classList.contains("hidden");
}

function update(delta) {
  const dt = delta * state.speed;
  if (state.runEnded) {
    syncUI();
    return;
  }
  if (state.paused) {
    syncUI();
    return;
  }

  if (state.inspectorTimer > 0) {
    state.inspectorTimer -= delta;
    if (state.inspectorTimer <= 0) {
      state.selectedPlacedTower = null;
      ui.towerInspector.classList.add("hidden");
    }
  }
  state.baseHitPulse = Math.max(0, (state.baseHitPulse || 0) - dt * 1.25);

  if (isDraftOpen()) {
    syncUI();
    return;
  }

  if (state.autoStartTimer > 0 && state.screen === "game" && state.stability > 0) {
    state.autoStartTimer -= dt;
    if (state.autoStartTimer <= 0 && !state.runningWave) {
      startWave();
    }
  }

  if (state.runningWave) {
    state.spawnTimer += dt;
    while (state.spawnQueue.length && state.spawnQueue[0].time <= state.spawnTimer) {
      const nextSpawn = state.spawnQueue.shift();
      spawnEnemy(nextSpawn.type, nextSpawn.routeIndex || 0);
    }
  }

  updateEnemies(dt);
  updateRefinery(dt);
  updateTowers(dt);
  updateProjectiles(dt);

  if (state.runningWave && state.spawnQueue.length === 0 && state.enemies.length === 0) {
    completeWave();
  }

  syncUI();
}

function completeWave() {
  state.runningWave = false;
  state.wave += 1;
  state.biomass += (10 + state.wave * 2) / 10;
  state.medals += state.wave % 5 === 0 ? 3 : 1;
  ui.startWave.disabled = false;

  if (state.runMode === "campaign" && state.wave >= currentMap().wavesToWin) {
    completeRun(true);
    return;
  }
  if (state.selectedPlacedTower) {
    buildTowerInspector();
  }

  let nextDraft = null;
  if (state.runMode === "endless") {
    if (state.wave % 10 === 0) {
      nextDraft = { type: "perks", title: "Commander Perk" };
    } else if (isRankedEndless() && state.wave % 5 === 0) {
      nextDraft = { type: "towerUnlock" };
    } else {
      nextDraft = { type: "perks", title: "Wave Upgrade" };
    }
  }

  if (state.pendingTechCore) {
    state.pendingDraftAfterCore = nextDraft;
    showTechCoreDraft(state.pendingTechCore);
    state.pendingTechCore = null;
    return;
  }

  if (nextDraft) {
    if (nextDraft.type === "towerUnlock") {
      showTowerUnlockChoices();
    } else {
      showPerks(nextDraft.title);
    }
  } else {
    state.autoStartTimer = 0;
    startWave();
  }
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    enemy.phaseTimer += dt;

    if (enemy.slowTimer > 0) {
      enemy.slowTimer -= dt;
    } else {
      enemy.slowMultiplier = 1;
    }

    if ((enemy.breachTimer || 0) > 0) {
      enemy.breachTimer -= dt;
      if (enemy.breachTimer <= 0) {
        enemy.breachTimer = 0;
        enemy.breachFactor = 1;
        enemy.breachSlow = 1;
      }
    }

    let movementMultiplier = enemy.slowMultiplier;
    if ((enemy.breachTimer || 0) > 0) {
      movementMultiplier *= enemy.breachSlow || 1;
    }
    if (enemy.burrower && Math.sin(enemy.phaseTimer * 3.4 + enemy.progress * 24) > 0.72) {
      movementMultiplier = Math.max(1.45, movementMultiplier * 2.2);
      enemy.slowMultiplier = 1;
    }
    if (enemy.boss && enemy.hp < enemy.maxHp * 0.5) {
      movementMultiplier *= 1.18;
    }

    enemy.progress += (enemy.speed * movementMultiplier * dt) / Math.max(1, currentPathLength(enemy.routeIndex || 0));
    enemy.pos = samplePath(enemy.progress, enemy.routeIndex || 0);
  }

  for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
    const enemy = state.enemies[index];
    if (enemy.hp <= 0) {
      const killingTower = enemy.lastHitTower;
      if (killingTower && state.towers.includes(killingTower)) {
        gainTowerExperience(killingTower, towerExperienceReward(enemy));
      }
      const biomass = Math.max(0.1, enemy.reward * state.modifiers.rewards / 10);
      state.biomass += biomass;
      if (enemy.boss) {
        const coreReward = hasUpgrade("bossSalvage") ? 4 : 2;
        state.medals += coreReward;
        state.pendingTechCore = state.runMode === "endless" ? generateBossTechCore(enemy) : null;
        if (typeof pushBattleLog === "function") {
          pushBattleLog("Boss defeated", `+${coreReward}`, "core");
          pushBattleLog("Received Tech Core", "+1", "core");
        }
      }
      if (enemy.splitsInto && enemy.splitDepth < 1) {
        spawnSplitFragments(enemy);
      }
      state.score += biomass * 10;
      state.enemies.splice(index, 1);
      if (state.selectedPlacedTower) {
        buildTowerInspector();
      }
    } else if (enemy.progress >= 1) {
      state.stability = Math.max(0, state.stability - enemy.damage);
      state.baseHitPulse = 1.25;
      state.enemies.splice(index, 1);
      if (state.stability <= 0) {
        completeRun(false);
      }
    }
  }
}

function spawnSplitFragments(enemy) {
  const definition = enemyDefinitions[enemy.splitsInto];
  const count = enemy.splitCount || 2;
  for (let i = 0; i < count; i += 1) {
    const offset = (i - (count - 1) / 2) * 0.004;
    state.enemies.push({
      ...definition,
      type: enemy.splitsInto,
      hp: Math.round(definition.hp * 0.55),
      maxHp: Math.round(definition.hp * 0.55),
      progress: clamp(enemy.progress + offset, 0, 0.98),
      slowTimer: 0,
      slowMultiplier: 1,
      phaseTimer: i * 0.4,
      splitDepth: enemy.splitDepth + 1,
      routeIndex: enemy.routeIndex || 0,
      pos: samplePath(enemy.progress, enemy.routeIndex || 0)
    });
  }
}

function enemyDamageMultiplier(enemy, sourceTower = null) {
  let multiplier = 1;
  if (enemy.armor) {
    multiplier *= 1 - enemy.armor;
  }
  const protectedByShield = state.enemies.some(other => other !== enemy && other.shieldAura && distance(other.pos, enemy.pos) <= other.shieldAura);
  if (protectedByShield) {
    multiplier *= 0.72;
  }
  if ((enemy.breachTimer || 0) > 0) {
    multiplier *= enemy.breachFactor || 1.18;
  }
  if (enemy.slowTimer > 0 && hasUpgrade("frostBrittle")) {
    multiplier *= 1.06;
  }
  if (enemy.boss && sourceTower?.id === "sniper" && hasUpgrade("sniperBossHunter")) {
    multiplier *= 1.18;
  }
  if (enemy.boss && enemy.hp < enemy.maxHp * 0.5 && sourceTower && sourceTower.id !== "sniper") {
    multiplier *= 0.9;
  }
  return multiplier;
}

function updateRefinery(dt) {
  const refineryCount = state.towers.filter(tower => tower.id === "refinery").length;
  if (state.screen !== "game" || state.biomass <= 0 || refineryCount === 0) {
    return;
  }

  const biomassPerSecond = refineryConversionRatePerSecond() * refineryCount;
  const biomassConverted = Math.min(state.biomass, biomassPerSecond * dt);
  state.biomass -= biomassConverted;
  state.coins += biomassConverted * refineryMaterialYield();
}

function refineryConversionRatePerSecond() {
  const flowUpgrade = hasUpgrade("refineryFlow") ? 1.25 : 1;
  return 0.7 * state.modifiers.refineryRate * flowUpgrade;
}

function refineryMaterialYield() {
  const yieldUpgrade = hasUpgrade("refineryCatalyst") ? 1.15 : 1;
  return state.modifiers.refineryYield * yieldUpgrade;
}

function returnToBase() {
  if (state.screen !== "game" || state.runEnded) {
    return;
  }

  openBaseOverlay();
}

function openBaseOverlay() {
  state.paused = true;
  state.baseOverlayOpen = true;
  state.autoStartTimer = 0;
  clearActionState();
  clearInspector();
  ui.resultKicker.textContent = "Field Base";
  ui.resultTitle.textContent = "Base Secured";
  ui.resultText.textContent = "The crew has pulled back to the mobile base. Resume the defense or return to the planet map and keep earned salvage.";
  ui.resultMenuButton.textContent = state.runMode === "campaign" ? "Planet Map" : "Menu";
  ui.resultReplayButton.textContent = "Resume";
  ui.runResult.classList.remove("hidden");
}

function resumeRun() {
  state.paused = false;
  state.baseOverlayOpen = false;
  ui.runResult.classList.add("hidden");
  ui.startWave.disabled = state.runningWave;
}

function completeRun(result) {
  if (state.runEnded) {
    return;
  }

  const victory = result === true || result === "victory";
  const retreat = result === "retreat";
  state.runEnded = true;
  state.paused = false;
  state.baseOverlayOpen = false;
  state.runningWave = false;
  state.autoStartTimer = 0;
  state.baseHitPulse = 0;
  ui.startWave.disabled = true;

  const map = currentMap();
  const endless = state.runMode === "endless";
  const earned = endless ? 0 : victory ? state.medals + map.medalReward : retreat ? Math.ceil(state.medals * 0.75) : Math.floor(state.medals * 0.5);
  if (!endless) {
    profile.medals += earned;
  } else {
    const variant = endlessVariantDefinitions.find(item => item.id === state.endlessVariantId) || endlessVariantDefinitions[0];
    profile[variant.scoreKey] = Math.max(profile[variant.scoreKey] || 0, state.score);
    profile[`${variant.scoreKey}_${map.id}`] = Math.max(profile[`${variant.scoreKey}_${map.id}`] || 0, state.score);
  }
  if (victory && !endless) {
    const mapIndex = mapDefinitions.findIndex(item => item.id === map.id);
    const difficultyIndex = difficultyDefinitions.findIndex(item => item.id === state.selectedDifficultyId);
    profile.completedDifficultyMaps = profile.completedDifficultyMaps || {};
    profile.completedDifficultyMaps[state.selectedDifficultyId] = Math.max(completedMapsForCurrentDifficulty(), mapIndex + 1);
    profile.completedMaps = Math.max(profile.completedMaps, mapIndex + 1);
    if (profile.completedDifficultyMaps[state.selectedDifficultyId] >= mapDefinitions.length) {
      profile.completedDifficulties = Math.max(profile.completedDifficulties, difficultyIndex + 1);
    }
    if (map.id === "midtown") {
      profile.purchased.sniperStabilizer = profile.purchased.sniperStabilizer || false;
    }
    state.currentCampaignNodeId = map.id;
    profile.currentCampaignNodeId = map.id;
  }
  saveProfile();

  ui.resultKicker.textContent = endless ? "Endless Rating" : victory ? "Sector Purged" : retreat ? "Returned To Reactor" : "Reactor Overrun";
  ui.resultTitle.textContent = endless ? `Wave ${state.wave}` : victory ? "Victory" : retreat ? "Base Secured" : "Defeat";
  ui.resultMenuButton.textContent = endless ? "Menu" : "Planet Map";
  ui.resultReplayButton.textContent = endless ? "Retry" : "Defend Again";
  ui.resultText.textContent = endless
    ? `${isRankedEndless() ? "Ranked" : "No Rating"} run finished at wave ${state.wave}. Score: ${state.score}.`
    : victory
    ? `${map.name} stabilized on ${currentDifficulty().name}. Earned ${earned} Technology Cores. ${currentDifficulty().reward}`
    : retreat
      ? `The AI core withdrew safely with ${earned} Technology Cores. The district remains unfinished.`
      : `The reactor fell, but ${earned} Technology Cores were recovered for the Research Lab.`;
  ui.runResult.classList.remove("hidden");
}

function updateTowers(dt) {
  for (const tower of state.towers) {
    const definition = towerDefinitions[tower.id];
    if (definition.kind === "infrastructure") {
      tower.pulse = (tower.pulse + dt) % 1;
      continue;
    }

    tower.cooldown -= dt;
    tower.pulse = Math.max(0, tower.pulse - dt * 2);
    tower.chargeDecayTimer = Math.max(0, (tower.chargeDecayTimer || 0) - dt);
    tower.weakTimer = Math.max(0, (tower.weakTimer || 0) - dt);
    tower.spin += dt * 1.4;

    const disruptedBySpitter = state.enemies.some(enemy => enemy.weakensTowers && distance(tower, enemy.pos) <= 130);
    if (disruptedBySpitter) {
      tower.cooldown += dt * 0.7;
      tower.weakTimer = 0.2;
    }
    for (let index = 0; index < tower.recoils.length; index += 1) {
      tower.recoils[index] = Math.max(0, tower.recoils[index] - dt * 5.5);
    }
    if (tower.muzzleFlash) {
      tower.muzzleFlash.life -= dt;
      if (tower.muzzleFlash.life <= 0) {
        tower.muzzleFlash = null;
      }
    }
    if (definition.effect === "auraSlow") {
      updateAuraTower(tower, definition, dt);
      continue;
    }

    const range = towerRange(definition, tower);

    const target = state.enemies
      .filter(enemy => distance(tower, enemy.pos) <= range && canTowerTargetEnemy(definition, enemy))
      .sort((a, b) => compareTowerTargets(definition, a, b))[0];

    if (definition.id === "sniper") {
      const disruptionFactor = disruptedBySpitter ? 0.55 : 1;
      const holdCharge = Boolean(tower.holdCharge);
      const hasChargeCycle = (tower.chargeTimer || 0) > 0 || holdCharge || (tower.postShotDelay || 0) > 0;

      if (target) {
        tower.angle = Math.atan2(target.pos.y - tower.y, target.pos.x - tower.x);
        tower.chargeTarget = target;
      } else {
        tower.chargeTarget = null;
      }

      if ((tower.postShotDelay || 0) > 0) {
        tower.postShotDelay = Math.max(0, tower.postShotDelay - dt);
        if (tower.postShotDelay <= 0) {
          tower.chargeDuration = Math.max(0.18, tower.pendingChargeDuration || 0.72);
          tower.chargeTimer = tower.chargeDuration;
          tower.chargeProgress = 0;
          tower.holdCharge = false;
        }
        continue;
      }

      if ((tower.chargeTimer || 0) > 0) {
        tower.chargeTimer = Math.max(0, tower.chargeTimer - dt * disruptionFactor);
        tower.chargeProgress = clamp(1 - tower.chargeTimer / tower.chargeDuration, 0, 1);
        if (tower.chargeTimer <= 0) {
          tower.holdCharge = true;
          tower.chargeProgress = 1;
        }
      }

      if (tower.holdCharge) {
        if (target) {
          fireTower(tower, definition, target);
          const fireInterval = fireIntervalForTower(definition, tower);
          tower.pulse = 1;
          tower.chargeProgress = 0;
          tower.chargeTarget = null;
          tower.holdCharge = false;
          tower.chargeTimer = 0;
          tower.postShotDelay = 0.1;
          tower.pendingChargeDuration = Math.max(0.18, fireInterval - tower.postShotDelay);
          tower.cooldown = 0;
        }
        continue;
      }

      if (hasChargeCycle) {
        continue;
      }

      if (!target) {
        tower.chargeProgress = 0;
        continue;
      }

      tower.chargeDuration = Math.max(0.18, fireIntervalForTower(definition, tower) - 0.1);
      tower.chargeTimer = tower.chargeDuration;
      tower.chargeProgress = 0;
      tower.holdCharge = false;
      tower.postShotDelay = 0;
      tower.pendingChargeDuration = tower.chargeDuration;
      tower.chargeTarget = target;
      continue;
    }


    if (definition.effect === "chain") {
      const disruptionFactor = disruptedBySpitter ? 0.6 : 1;
      const fireInterval = fireIntervalForTower(definition, tower);
      const maxArcDuration = 3;
      const permanentCooling = hasUpgrade("teslaInsulation") ? 0.7 : hasUpgrade("teslaCooling") ? 0.8 : 1;
      const overheatDuration = 2 * permanentCooling * state.modifiers.teslaOverheatCooldown;
      tower.overheatTimer = Math.max(0, (tower.overheatTimer || 0) - dt);

      if (target) {
        tower.angle = Math.atan2(target.pos.y - tower.y, target.pos.x - tower.x);
        tower.chargeTarget = { x: target.pos.x, y: target.pos.y };
      } else {
        tower.chargeTarget = null;
      }

      if (tower.arcActive) {
        tower.arcFireTimer = (tower.arcFireTimer || 0) + dt;
        const arcTargets = buildElectroArcTargets(tower, definition, range).filter(enemy => enemy.hp > 0);
        if (!arcTargets.length) {
          tower.arcActive = false;
          tower.arcTargets = [];
          tower.arcFireTimer = 0;
          tower.arcVisualTimer = 0;
          tower.chargeTimer = 0;
          tower.chargeDecayDuration = Math.max(0.32, fireInterval * 0.24);
          tower.chargeDecayTimer = tower.chargeDecayDuration;
          tower.cooldown = Math.max(tower.cooldown, Math.max(0.38, fireInterval * 0.34));
          continue;
        }

        if (tower.arcFireTimer >= maxArcDuration) {
          tower.arcActive = false;
          tower.arcTargets = [];
          tower.arcFireTimer = 0;
          tower.arcVisualTimer = 0;
          tower.chargeTimer = 0;
          tower.chargeProgress = 0;
          tower.chargeDecayDuration = overheatDuration;
          tower.chargeDecayTimer = overheatDuration;
          tower.cooldown = Math.max(tower.cooldown, overheatDuration);
          tower.overheatTimer = overheatDuration;
          tower.overheatDuration = overheatDuration;
          continue;
        }

        tower.arcTargets = arcTargets;
        tower.chargeProgress = 1;
        tower.pulse = 1;

        const baseDamage = damageForTower(definition, tower) + state.modifiers.chainDamage;
        let dpsScale = tower.evolution === "stormSpire" ? 3.35 : tower.evolution === "arcNode" ? 2.95 : 2.75;
        if (hasUpgrade("stormNetwork") && arcTargets.length >= 3) {
          dpsScale *= 1.15;
        }
        if (hasUpgrade("teslaDensity") && arcTargets.length >= 3) {
          dpsScale *= 1.1;
        }
        arcTargets.forEach((enemy, index) => {
          const chainFalloff = index === 0 ? 1 : Math.max(0.62, 1 - index * 0.12);
          markTowerHit(enemy, tower);
          enemy.hp -= baseDamage * dpsScale * chainFalloff * dt * enemyDamageMultiplier(enemy, tower);
          enemy.arcMarkTimer = Math.max(enemy.arcMarkTimer || 0, 1.4);
        });

        const arcColor = definition.projectileColor || definition.color;
        tower.arcVisualTimer = (tower.arcVisualTimer || 0) - dt;
        if ((tower.arcVisualTimer || 0) <= 0) {
          tower.arcVisualTimer = 0.055;
          const emitter = getElectroEmitterPosition(tower);
          emitElectroArc(emitter, { x: arcTargets[0].pos.x, y: arcTargets[0].pos.y }, arcColor);
          for (let index = 1; index < arcTargets.length; index += 1) {
            emitElectroArc(
              { x: arcTargets[index - 1].pos.x, y: arcTargets[index - 1].pos.y },
              { x: arcTargets[index].pos.x, y: arcTargets[index].pos.y },
              arcColor
            );
          }
        }
        continue;
      }

      if ((tower.chargeTimer || 0) > 0) {
        tower.chargeTimer = Math.max(0, tower.chargeTimer - dt * disruptionFactor);
        tower.chargeProgress = clamp(1 - tower.chargeTimer / tower.chargeDuration, 0, 1);
        if (tower.chargeTimer <= 0) {
          if (target && tower.overheatTimer <= 0) {
            tower.arcActive = true;
            tower.arcTargets = [];
            tower.arcFireTimer = 0;
            tower.arcVisualTimer = 0;
            tower.cooldown = 0;
            tower.pulse = 1;
            tower.shotsFired += 1;
            tower.muzzleFlash = {
              ...getElectroEmitterPosition(tower),
              life: 0.14,
              maxLife: 0.14,
              color: definition.projectileColor || definition.color
            };
          } else {
            tower.chargeProgress = 0;
          }
        }
        continue;
      }

      if ((tower.chargeDecayTimer || 0) > 0) {
        tower.chargeProgress = clamp(tower.chargeDecayTimer / Math.max(0.001, tower.chargeDecayDuration || tower.chargeDecayTimer), 0, 1);
        continue;
      }

      if (tower.cooldown > 0 || tower.overheatTimer > 0) {
        tower.chargeProgress = 0;
        continue;
      }

      if (!target) {
        tower.chargeProgress = 0;
        continue;
      }

      tower.chargeDuration = Math.max(0.24, fireInterval * (tower.evolution === "arcNode" ? 0.48 : 0.56) * (hasUpgrade("teslaChargeSpeed") ? 0.88 : 1));
      tower.chargeTimer = tower.chargeDuration;
      tower.chargeProgress = 0;
      tower.chargeDecayTimer = 0;
      tower.chargeDecayDuration = 0;
      tower.arcActive = false;
      tower.arcTargets = [];
      continue;
    }

    if (tower.cooldown > 0) {
      continue;
    }

    if (!target) {
      tower.chargeProgress = 0;
      continue;
    }

    tower.angle = Math.atan2(target.pos.y - tower.y, target.pos.x - tower.x);

    fireTower(tower, definition, target);
    tower.cooldown = fireIntervalForTower(definition, tower);
    tower.pulse = 1;
  }
}

function updateAuraTower(tower, definition, dt) {
  if (tower.cooldown <= 0) {
    tower.pulse = 1;
    tower.recoils = tower.recoils.map(() => 0.55);
    tower.cooldown = definition.fireRate;
  }

  const range = towerRange(definition, tower);
  for (const enemy of state.enemies) {
    if (distance(tower, enemy.pos) > range) {
      continue;
    }

    markTowerHit(enemy, tower);
    enemy.hp -= damageForTower(definition, tower) * dt * enemyDamageMultiplier(enemy, tower);
    if (hasUpgrade("darkAsphalt")) {
      enemy.hp -= 3.5 * dt;
    }
    if (tower.evolution === "shatterCore" && enemy.slowTimer > 0) {
      enemy.hp -= 4.5 * dt;
    }
    let slowPower = hasUpgrade("absoluteZero") ? definition.slow * 0.82 : definition.slow;
    let durationBonus = (hasUpgrade("absoluteZero") ? 1.4 : 1) * (hasUpgrade("frostDuration") ? 1.25 : 1);
    if (tower.evolution === "cryoField") {
      slowPower *= 0.78;
      durationBonus *= 1.25;
    }
    if (enemy.flying) {
      slowPower = Math.max(0.95, slowPower);
      durationBonus *= 0.45;
    }
    enemy.slowMultiplier = Math.min(enemy.slowMultiplier, slowPower);
    enemy.slowTimer = Math.max(enemy.slowTimer, definition.slowDuration * state.modifiers.slowDuration * durationBonus);
  }
}

function fireTower(tower, definition, target) {
  const barrelIndex = tower.barrelIndex % definition.barrels.length;
  const muzzle = getMuzzlePosition(tower, definition, barrelIndex, 1);
  const shotMissed = definition.id === "plasma" && target.flying && Math.random() < (currentMap().id === "orbitalHighway" && (state.orbitalHighwayAntenna?.activeTimer || 0) > 0 ? 0.05 : 0.32);
  tower.barrelIndex += 1;
  tower.recoils[barrelIndex] = 1;
  tower.muzzleFlash = { ...muzzle, life: 0.12, maxLife: 0.12, color: definition.projectileColor || definition.color };

  if (definition.effect === "chain") {
    let chainCount = definition.chains + (hasUpgrade("teslaChain") ? 1 : 0);
    if (tower.evolution === "arcNode") {
      chainCount += 1;
    }
    const candidates = state.enemies
      .filter(enemy => distance(target.pos, enemy.pos) < 122)
      .sort((a, b) => distance(target.pos, a.pos) - distance(target.pos, b.pos))
      .slice(0, chainCount);
    const baseDamage = damageForTower(definition, tower) + state.modifiers.chainDamage;
    candidates.forEach((enemy, index) => {
      markTowerHit(enemy, tower);
      enemy.hp -= Math.max(4, baseDamage - index * 3) * enemyDamageMultiplier(enemy, tower);
      enemy.arcMarkTimer = Math.max(enemy.arcMarkTimer || 0, 1.4);
    });
  } else if (definition.effect === "splash") {
    const baseDamage = damageForTower(definition, tower);
    const permanentRadius = hasUpgrade("cannonBlast") ? 1.12 : 1;
    const radius = (definition.splashRadius || 48) * (tower.evolution === "clusterShells" ? 1.42 : 1) * permanentRadius * state.modifiers.cannonRadius;
    const permanentBreachDuration = hasUpgrade("cannonFracture") ? 1.25 : 1;
    const concussionDuration = (tower.evolution === "siegeChamber" ? 1.65 : tower.evolution === "clusterShells" ? 1.15 : 1.3) * permanentBreachDuration * state.modifiers.cannonBreachDuration;
    const permanentBreachBonus = hasUpgrade("cannonFracture") ? 0.04 : 0;
    const concussionDamageBoost = (tower.evolution === "siegeChamber" ? 1.3 : tower.evolution === "clusterShells" ? 1.14 : 1.18) + permanentBreachBonus + state.modifiers.cannonBreachBonus;
    const concussionSlow = (tower.evolution === "siegeChamber" ? 0.8 : tower.evolution === "clusterShells" ? 0.9 : 0.86) * (hasUpgrade("cannonShock") ? 0.94 : 1);

    state.enemies.forEach(enemy => {
      if (enemy.flying) {
        return;
      }
      const d = distance(target.pos, enemy.pos);
      if (d <= radius) {
        const falloff = enemy === target ? 1 : Math.max(0.42, 1 - d / (radius * 1.35));
        const siegeDoctrine = hasUpgrade("cannonSiege") ? 1.22 : 1;
        const impactBonus = enemy === target ? (tower.evolution === "siegeChamber" ? 1.38 : 1.18) * siegeDoctrine : 1;
        markTowerHit(enemy, tower);
        enemy.hp -= baseDamage * falloff * impactBonus * enemyDamageMultiplier(enemy, tower);
        enemy.breachTimer = Math.max(enemy.breachTimer || 0, concussionDuration);
        enemy.breachFactor = Math.max(enemy.breachFactor || 1, concussionDamageBoost);
        enemy.breachSlow = Math.min(enemy.breachSlow || 1, concussionSlow);
      }
    });
    if (tower.evolution === "clusterShells") {
      state.enemies.forEach(enemy => {
        if (!enemy.flying && enemy !== target && distance(target.pos, enemy.pos) <= radius + 34) {
          markTowerHit(enemy, tower);
          enemy.hp -= baseDamage * 0.18 * enemyDamageMultiplier(enemy, tower);
          enemy.breachTimer = Math.max(enemy.breachTimer || 0, 0.95);
          enemy.breachFactor = Math.max(enemy.breachFactor || 1, 1.1);
          enemy.breachSlow = Math.min(enemy.breachSlow || 1, 0.92);
        }
      });
    }
  } else if (!shotMissed) {
    const openingShot = definition.id === "sniper" && hasUpgrade("sniperStabilizer") && tower.shotsFired === 0 ? 1.75 : 1;
    const piercerBonus = definition.id === "plasma" && hasUpgrade("plasmaPiercer") && tower.shotsFired % 4 === 3 ? 18 : 0;
    let rawDamage = (damageForTower(definition, tower) + piercerBonus) * openingShot;
    if (definition.id === "sniper" && isLargeEnemy(target)) {
      rawDamage *= 1.7;
      target.sniperCritFlash = 0.24;
    }
    if (tower.evolution === "executioner" && (target.boss || target.hp < target.maxHp * 0.45)) {
      rawDamage *= 1.65;
    }

    if (tower.evolution === "penetrator") {
      const dx = target.pos.x - muzzle.x;
      const dy = target.pos.y - muzzle.y;
      const length = Math.hypot(dx, dy) || 1;
      const dirX = dx / length;
      const dirY = dy / length;
      const maxDistance = towerRange(definition, tower) + 80;
      const lineTargets = state.enemies
        .map(enemy => {
          const vx = enemy.pos.x - muzzle.x;
          const vy = enemy.pos.y - muzzle.y;
          const along = vx * dirX + vy * dirY;
          const perpendicular = Math.abs(vx * dirY - vy * dirX);
          return { enemy, along, perpendicular };
        })
        .filter(item => item.along >= 0 && item.along <= maxDistance && item.perpendicular <= (item.enemy.radius || 10) + 9)
        .sort((a, b) => a.along - b.along);

      lineTargets.forEach((item, penetrationIndex) => {
        const penetrationMultiplier = Math.pow(0.7, penetrationIndex);
        markTowerHit(item.enemy, tower);
        item.enemy.hp -= rawDamage * penetrationMultiplier * enemyDamageMultiplier(item.enemy, tower);
      });

      tower.lastPenetratorHits = lineTargets.map(item => ({ x: item.enemy.pos.x, y: item.enemy.pos.y }));
      tower.lastPenetratorEnd = {
        x: muzzle.x + dirX * maxDistance,
        y: muzzle.y + dirY * maxDistance
      };
    } else {
      const damage = rawDamage * enemyDamageMultiplier(target, tower);
      markTowerHit(target, tower);
      target.hp -= damage;

      if (tower.evolution === "fusion") {
        state.enemies.forEach(enemy => {
          if (enemy !== target && distance(enemy.pos, target.pos) <= 42) {
            markTowerHit(enemy, tower);
            enemy.hp -= damage * 0.45 * enemyDamageMultiplier(enemy, tower);
          }
        });
      }
    }
  }
  tower.shotsFired += 1;

  let projectileTo = shotMissed
    ? { x: target.pos.x + 24 + Math.random() * 18, y: target.pos.y - 20 - Math.random() * 16 }
    : { x: target.pos.x, y: target.pos.y };
  let projectileEffect = shotMissed ? "miss" : definition.effect;
  let projectileHits = shotMissed ? [] : [{ x: target.pos.x, y: target.pos.y }];
  if (tower.evolution === "penetrator") {
    projectileTo = tower.lastPenetratorEnd || projectileTo;
    projectileHits = tower.lastPenetratorHits || projectileHits;
    projectileEffect = "pierce";
  }

  state.projectiles.push({
    from: muzzle,
    to: projectileTo,
    hit: { x: target.pos.x, y: target.pos.y },
    hits: projectileHits,
    life: definition.effect === "splash" ? 0.3 : (projectileEffect === "pierce" ? 0.26 : 0.22),
    maxLife: definition.effect === "splash" ? 0.3 : (projectileEffect === "pierce" ? 0.26 : 0.22),
    color: definition.projectileColor || definition.color,
    effect: projectileEffect,
    missed: shotMissed,
    impactRadius: definition.effect === "splash"
      ? (definition.splashRadius || 48) * (tower.evolution === "clusterShells" ? 1.42 : 1) * (hasUpgrade("cannonBlast") ? 1.12 : 1) * state.modifiers.cannonRadius
      : 0
  });
}


function getElectroEmitterPosition(tower) {
  return { x: tower.x, y: tower.y - 34 };
}

function buildElectroArcTargets(tower, definition, range) {
  let chainCount = definition.chains + (hasUpgrade("teslaChain") ? 1 : 0);
  if (tower.evolution === "arcNode") {
    chainCount += 1;
  }

  const pool = state.enemies
    .filter(enemy => distance(tower, enemy.pos) <= range)
    .sort((a, b) => b.progress - a.progress);

  if (!pool.length) {
    return [];
  }

  const targets = [pool.shift()];
  while (pool.length > 0 && targets.length < chainCount) {
    const previous = targets[targets.length - 1];
    const nextIndex = pool
      .map((enemy, index) => ({ enemy, index, dist: distance(previous.pos, enemy.pos) }))
      .filter(item => item.dist <= 146)
      .sort((a, b) => a.dist - b.dist)[0]?.index;

    if (nextIndex == null) {
      targets.push(pool.shift());
      continue;
    }
    targets.push(pool.splice(nextIndex, 1)[0]);
  }

  return targets;
}

function emitElectroArc(from, to, color) {
  state.projectiles.push({
    from,
    to,
    life: 0.075,
    maxLife: 0.075,
    color,
    effect: "arc",
    jitter: 9 + Math.random() * 6,
    seed: Math.random() * 1000
  });
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    projectile.life -= dt;
  }
  state.projectiles = state.projectiles.filter(projectile => projectile.life > 0);
}

function localToWorld(origin, angle, forward, side) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: origin.x + cos * forward - sin * side,
    y: origin.y + sin * forward + cos * side
  };
}

function getMuzzlePosition(tower, definition, barrelIndex, recoilAmount) {
  const barrel = definition.barrels[barrelIndex];
  const recoilDistance = 12 * recoilAmount;
  return localToWorld(tower, tower.angle, barrel.forward + barrel.length - recoilDistance, barrel.side);
}

function queueNextWave(delay = 0.12) {
  if (state.screen !== "game" || state.runEnded || state.stability <= 0) {
    return;
  }
  state.autoStartTimer = Math.max(0.05, delay);
  if (ui.startWave) {
    ui.startWave.disabled = true;
  }
}

function showPerks(title = "Choose Combat Protocol") {
  ui.perkModal.dataset.draftType = "wave-perk";
  ui.towerInspector.classList.add("hidden");
  ui.perkTitle.textContent = title;

  const towerIsRelevant = perk => !perk.tower || isTowerAvailable(towerDefinitions[perk.tower]);
  const availablePerks = perkPool.filter(perk =>
    (!perk.endlessOnly || state.runMode === "endless") &&
    (!perk.refineryOnly || !isRankedEndless()) &&
    towerIsRelevant(perk) &&
    (!perk.oncePerRun || !state.runPerks[perk.name])
  );

  const shuffled = items => [...items].sort(() => Math.random() - 0.5);
  const lockedTowers = Object.values(towerDefinitions).filter(definition =>
    definition.kind !== "infrastructure" &&
    definition.id !== "plasma" &&
    isTowerEligibleForDraft(definition) &&
    !state.runUnlockedTowers[definition.id]
  );
  const choices = [];

  if (lockedTowers.length > 0) {
    const definition = shuffled(lockedTowers)[0];
    choices.push({
      name: definition.name,
      category: "unlock",
      towerUnlockId: definition.id,
      text: `${definition.role}: ${definition.description}`
    });
  }

  shuffled(["tower", "support", "economy"]).forEach(category => {
    const candidate = shuffled(availablePerks.filter(perk => perk.category === category && !choices.includes(perk)))[0];
    if (candidate) {
      choices.push(candidate);
    }
  });

  const rareChoices = availablePerks.filter(perk => perk.rare);
  const rareChance = state.runMode === "endless" ? 0.28 : 0.18;
  if (rareChoices.length > 0 && Math.random() < rareChance) {
    const rare = shuffled(rareChoices)[0];
    const replaceIndex = choices.findIndex((choice, index) => index > 0 && choice.category === "economy");
    if (replaceIndex >= 0) {
      choices[replaceIndex] = rare;
    } else if (choices.length >= 3) {
      choices[choices.length - 1] = rare;
    } else {
      choices.push(rare);
    }
  }

  const choiceLimit = hasUpgrade("adaptiveDraft") ? 4 : 3;
  ui.perkChoices.classList.toggle("four-choice", choiceLimit === 4);
  const remaining = shuffled(availablePerks.filter(perk => !choices.includes(perk) && !perk.rare));
  while (choices.length < choiceLimit && remaining.length > 0) {
    choices.push(remaining.shift());
  }

  ui.perkChoices.innerHTML = "";
  choices.slice(0, choiceLimit).forEach(perk => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `perk perk-${perk.category}${perk.rare ? " rare" : ""}`;
    const label = perk.category === "unlock"
      ? "NEW TOWER"
      : perk.rare
        ? "RARE PROTOCOL"
        : perk.category === "tower"
          ? "TOWER PROTOCOL"
          : perk.category === "support"
            ? "TACTICAL PROTOCOL"
            : "ECONOMY PROTOCOL";
    button.innerHTML = `<small>${label}</small><b>${perk.name}</b><span>${perk.text}</span>`;
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (perk.towerUnlockId) {
        state.runUnlockedTowers[perk.towerUnlockId] = true;
        pushBattleLog(`${towerDefinitions[perk.towerUnlockId].name} blueprint acquired`, "NEW", "core");
      } else {
        state.runPerks[perk.name] = true;
        perk.apply(state);
      }
      ui.perkModal.classList.add("hidden");
      ui.perkModal.dataset.draftType = "";
      queueNextWave();
      buildTowerBar();
      if (state.selectedPlacedTower) {
        buildTowerInspector();
      }
      syncUI();
    });
    ui.perkChoices.appendChild(button);
  });
  ui.perkModal.classList.remove("hidden");
}

function showTowerUnlockChoices() {
  ui.perkModal.dataset.draftType = "tower-unlock";
  ui.towerInspector.classList.add("hidden");
  const lockedTowers = Object.values(towerDefinitions).filter(definition => definition.kind !== "infrastructure" && definition.id !== "plasma" && isTowerEligibleForDraft(definition) && !state.runUnlockedTowers[definition.id]);
  if (lockedTowers.length === 0) {
    showPerks("Wave Upgrade");
    return;
  }

  ui.perkTitle.textContent = "Choose New Tower";
  ui.perkChoices.classList.remove("four-choice");
  ui.perkChoices.innerHTML = "";
  lockedTowers.slice(0, 3).forEach(definition => {
    const button = document.createElement("button");
    button.className = "perk";
    button.innerHTML = `<b>${definition.name}</b><span>${definition.role}: ${definition.description}</span>`;
    button.addEventListener("click", () => {
      state.runUnlockedTowers[definition.id] = true;
      ui.perkModal.classList.add("hidden");
      ui.perkModal.dataset.draftType = "";
      queueNextWave();
      buildTowerBar();
      if (state.selectedPlacedTower) {
        buildTowerInspector();
      }
      syncUI();
    });
    ui.perkChoices.appendChild(button);
  });
  ui.perkModal.classList.remove("hidden");
}


function generateBossTechCore(enemy) {
  const catalog = [
    {
      id: "assault-core",
      name: "Assault Tech Core",
      description: "Recovered from the boss weapon lattice. Install it for higher combat throughput or route it back to the Research Lab.",
      choices: [
        { name: "Install - Attack Matrix", text: "All combat towers gain +8 damage for this run.", apply: () => { state.modifiers.coreDamage += 8; } },
        { name: "Install - Overclock Kernel", text: "All combat towers reload 10% faster for this run.", apply: () => { state.modifiers.coreFireRate *= 0.9; } },
        { name: "Send To Research Lab", text: "Bank the core. Gain +4 Technology Cores and +3.5 Biomass.", apply: () => { state.medals += 4; state.biomass += 3.5; } }
      ]
    },
    {
      id: "cryo-core",
      name: "Cryo Tech Core",
      description: "A stable containment core extracted from the boss tissues. It can reinforce control protocols or be archived for permanent research.",
      choices: [
        { name: "Install - Deep Freeze", text: "Frost effects last 30% longer this run.", apply: () => { state.modifiers.slowDuration *= 1.3; } },
        { name: "Install - Reactor Stabilizer", text: "Restore 18 Reactor Integrity and gain +4 damage for this run.", apply: () => { state.stability = Math.min(100, state.stability + 18); state.modifiers.coreDamage += 4; } },
        { name: "Send To Research Lab", text: "Bank the core. Gain +4 Technology Cores and +2 Biomass.", apply: () => { state.medals += 4; state.biomass += 2; } }
      ]
    },
    {
      id: "siege-core",
      name: "Siege Tech Core",
      description: "A dense impact processor recovered from the boss armor lattice. It can reinforce artillery, improve Tesla cooling, or be archived for permanent research.",
      choices: [
        { name: "Install - Shock Artillery", text: "Cannon gains +12 damage and +12% explosion radius for this run.", apply: () => { state.modifiers.cannonDamage += 12; state.modifiers.cannonRadius *= 1.12; } },
        { name: "Install - Superconductive Loop", text: "Tesla gains +4 chain damage and its overheat cooldown is reduced by 20% for this run.", apply: () => { state.modifiers.chainDamage += 4; state.modifiers.teslaOverheatCooldown *= 0.8; } },
        { name: "Send To Research Lab", text: "Bank the core. Gain +5 Technology Cores and +2.5 Biomass.", apply: () => { state.medals += 5; state.biomass += 2.5; } }
      ]
    },
    {
      id: "neural-core",
      name: "Neural Tech Core",
      description: "The AI fragments inside this core can be bound into the reactor or decoded by the Research Lab.",
      choices: [
        { name: "Install - Target Solver", text: "Sniper and Tesla systems gain +12 bonus damage for this run.", apply: () => { state.modifiers.sniperDamage += 12; state.modifiers.chainDamage += 2; } },
        { name: "Install - Fabrication Burst", text: "Refinery processing speed increases by 18% for this run.", apply: () => { state.modifiers.refineryRate *= 1.18; state.biomass += 1.8; } },
        { name: "Send To Research Lab", text: "Bank the core. Gain +5 Technology Cores.", apply: () => { state.medals += 5; } }
      ]
    }
  ];
  return catalog[Math.floor(Math.random() * catalog.length)];
}

function resolvePostTechCoreDraft() {
  const nextDraft = state.pendingDraftAfterCore;
  state.pendingDraftAfterCore = null;
  if (nextDraft) {
    if (nextDraft.type === "towerUnlock") {
      showTowerUnlockChoices();
    } else {
      showPerks(nextDraft.title);
    }
  } else {
    queueNextWave();
  }
}

function showTechCoreDraft(core) {
  ui.perkModal.dataset.draftType = "tech-core";
  ui.towerInspector.classList.add("hidden");
  ui.perkTitle.textContent = "Technology Core Recovered";
  ui.perkChoices.classList.remove("four-choice");
  ui.perkChoices.innerHTML = "";

  const intro = document.createElement("div");
  intro.className = "perk draft-banner";
  intro.innerHTML = `<b>${core.name}</b><span>${core.description}</span>`;
  ui.perkChoices.appendChild(intro);

  let selectedChoice = null;
  const optionButtons = [];

  core.choices.forEach(choice => {
    const button = document.createElement("button");
    button.className = "perk";
    button.innerHTML = `<b>${choice.name}</b><span>${choice.text}</span>`;
    button.addEventListener("click", () => {
      selectedChoice = choice;
      optionButtons.forEach(item => item.classList.remove("selected"));
      button.classList.add("selected");
      confirmButton.disabled = false;
      confirmNote.textContent = `Selected: ${choice.name}`;
    });
    optionButtons.push(button);
    ui.perkChoices.appendChild(button);
  });

  const confirmRow = document.createElement("div");
  confirmRow.className = "confirm-row";
  const confirmNote = document.createElement("span");
  confirmNote.className = "confirm-note";
  confirmNote.textContent = "Select one option, then confirm.";
  const confirmButton = document.createElement("button");
  confirmButton.className = "draft-confirm";
  confirmButton.textContent = "Confirm Core Choice";
  confirmButton.disabled = true;
  confirmButton.addEventListener("click", () => {
    if (!selectedChoice) {
      return;
    }
    selectedChoice.apply();
    ui.perkModal.classList.add("hidden");
    ui.perkModal.dataset.draftType = "";
    buildTowerBar();
    syncUI();
    resolvePostTechCoreDraft();
  });
  confirmRow.append(confirmNote, confirmButton);
  ui.perkChoices.appendChild(confirmRow);

  ui.perkModal.classList.remove("hidden");
}

function draw() {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(canvas.width / WORLD.width, 0, 0, canvas.height / WORLD.height, 0, 0);
  drawBattleViewportBackdrop();

  const hit = state.screen === "game" && !state.runEnded
    ? clamp(state.baseHitPulse || 0, 0, 1)
    : 0;

  context.save();
  applyBattleCameraTransform();
  if (hit > 0.02) {
    const now = performance.now() * 0.05;
    context.translate(Math.sin(now) * 5 * hit, Math.cos(now * 1.31) * 3.5 * hit);
  }
  drawMap();
  drawPath();
  drawReactorBase();
  drawTowers();
  drawEnemies();
  drawProjectiles();
  drawPlacementGhost();
  context.restore();

  drawGameOver();
  drawBaseHitOverlay(hit);
}

function drawMap() {
  const theme = battleThemeDefinitions[currentMap().battleTheme] || battleThemeDefinitions.harbor;
  const bounds = currentBattleSceneBounds(160);
  const fieldGradient = context.createLinearGradient(bounds.left, bounds.top, bounds.right, bounds.bottom);
  fieldGradient.addColorStop(0, "#0a121b");
  fieldGradient.addColorStop(0.45, "#101923");
  fieldGradient.addColorStop(1, "#0c131b");
  context.fillStyle = fieldGradient;
  context.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);

  const isTwinBreach = currentMap().id === "twinBreach";
  const plates = isTwinBreach
    ? [
        { x: bounds.left + 24, y: bounds.top + 18, w: 360, h: 170 },
        { x: bounds.left + 404, y: bounds.top + 12, w: 340, h: 160 },
        { x: bounds.left + 760, y: bounds.top + 18, w: 354, h: 168 },
        { x: bounds.right - 384, y: bounds.top + 36, w: 360, h: 172 },
        { x: bounds.left + 12, y: 132, w: 330, h: 142 },
        { x: 196, y: 118, w: 338, h: 132 },
        { x: 516, y: 212, w: 312, h: 134 },
        { x: 844, y: 266, w: 418, h: 146 },
        { x: bounds.left + 18, y: 484, w: 456, h: 176 },
        { x: 264, y: 554, w: 366, h: 156 },
        { x: 604, y: 516, w: 352, h: 178 },
        { x: bounds.right - 390, y: 532, w: 366, h: 176 }
      ]
    : [
        { x: bounds.left + 24, y: bounds.top + 20, w: 340, h: 166 },
        { x: 28, y: 26, w: 320, h: 152 },
        { x: 386, y: 24, w: 314, h: 148 },
        { x: 738, y: 28, w: 468, h: 152 },
        { x: bounds.right - 360, y: bounds.top + 34, w: 336, h: 162 },
        { x: bounds.left + 18, y: bounds.bottom - 188, w: 352, h: 164 },
        { x: 44, y: 604, w: 336, h: 118 },
        { x: 418, y: 602, w: 324, h: 122 },
        { x: 780, y: 592, w: 422, h: 130 },
        { x: bounds.right - 382, y: bounds.bottom - 174, w: 358, h: 150 }
      ];
  plates.forEach((plate, index) => drawBattlefieldPlate(plate, index % 2 === 0));

  context.fillStyle = hexToRgba(theme.cool, 0.55);
  context.beginPath();
  context.ellipse(isTwinBreach ? 1042 : 998, isTwinBreach ? 126 : 144, 150, 72, -0.2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = hexToRgba(theme.warm, 0.45);
  context.beginPath();
  context.ellipse(isTwinBreach ? 190 : 214, isTwinBreach ? 626 : 642, 150, 80, 0.15, 0, Math.PI * 2);
  context.fill();

  drawExpandedSceneEdgeDetails(bounds, theme, isTwinBreach);

  activeBuildingDefinitions().forEach(building => {
    drawRaisedBlock(building);
    if (building.ruined) {
      drawRuinedBuildingDetails(building);
    } else {
      drawIntactBuildingDetails(building);
    }
  });
}

function drawBattlefieldPlate(plate, alternate = false) {
  const { x, y, w, h } = plate;
  context.fillStyle = "rgba(8,12,18,0.22)";
  context.beginPath();
  context.roundRect(x + 6, y + 8, w, h, 16);
  context.fill();

  const plateGradient = context.createLinearGradient(x, y, x + w, y + h);
  plateGradient.addColorStop(0, alternate ? "#36424d" : "#303c47");
  plateGradient.addColorStop(0.48, "#202a33");
  plateGradient.addColorStop(1, "#141c24");
  context.fillStyle = plateGradient;
  context.beginPath();
  context.moveTo(x + 18, y);
  context.lineTo(x + w - 18, y);
  context.lineTo(x + w, y + 18);
  context.lineTo(x + w, y + h - 18);
  context.lineTo(x + w - 18, y + h);
  context.lineTo(x + 18, y + h);
  context.lineTo(x, y + h - 18);
  context.lineTo(x, y + 18);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(108,160,205,0.14)";
  context.lineWidth = 1.4;
  context.stroke();

  context.fillStyle = "rgba(20,27,36,0.88)";
  context.beginPath();
  context.roundRect(x + 18, y + 16, w - 36, h - 32, 12);
  context.fill();

  context.fillStyle = alternate ? "rgba(38,46,56,0.92)" : "rgba(34,43,52,0.92)";
  context.beginPath();
  context.roundRect(x + 30, y + 24, w - 60, 18, 7);
  context.roundRect(x + w * 0.5 - 18, y + h * 0.5 - 10, 36, 20, 7);
  context.fill();

  context.fillStyle = "rgba(99,217,255,0.14)";
  context.beginPath();
  context.roundRect(x + w * 0.5 - 12, y + h * 0.5 - 2, 24, 4, 1.5);
  context.fill();
}


function drawExpandedSceneEdgeDetails(bounds, theme, isTwinBreach) {
  context.save();

  const edgeGlow = context.createLinearGradient(bounds.left, bounds.top, bounds.right, bounds.bottom);
  edgeGlow.addColorStop(0, "rgba(76,150,205,0.045)");
  edgeGlow.addColorStop(0.5, "rgba(0,0,0,0)");
  edgeGlow.addColorStop(1, "rgba(242,188,100,0.035)");
  context.fillStyle = edgeGlow;
  context.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);

  context.strokeStyle = "rgba(103,171,216,0.08)";
  context.lineWidth = 1;
  context.setLineDash([12, 18]);
  for (let x = Math.floor(bounds.left / 96) * 96; x <= bounds.right; x += 96) {
    context.beginPath();
    context.moveTo(x, bounds.top);
    context.lineTo(x, bounds.bottom);
    context.stroke();
  }
  for (let y = Math.floor(bounds.top / 96) * 96; y <= bounds.bottom; y += 96) {
    context.beginPath();
    context.moveTo(bounds.left, y);
    context.lineTo(bounds.right, y);
    context.stroke();
  }
  context.setLineDash([]);

  const pipeYTop = bounds.top + 46;
  const pipeYBottom = bounds.bottom - 46;
  [pipeYTop, pipeYBottom].forEach((pipeY, index) => {
    context.strokeStyle = index === 0 ? "rgba(85,148,190,0.16)" : "rgba(242,188,100,0.11)";
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(bounds.left + 28, pipeY);
    context.lineTo(bounds.right - 28, pipeY);
    context.stroke();
    context.strokeStyle = "rgba(8,15,22,0.72)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(bounds.left + 28, pipeY);
    context.lineTo(bounds.right - 28, pipeY);
    context.stroke();
  });

  const debris = [
    [0.05, 0.18, 18], [0.16, 0.08, 12], [0.31, 0.92, 15], [0.47, 0.06, 10],
    [0.62, 0.94, 13], [0.78, 0.1, 16], [0.91, 0.22, 12], [0.94, 0.84, 17]
  ];
  debris.forEach(([nx, ny, size], index) => {
    const x = bounds.left + (bounds.right - bounds.left) * nx;
    const y = bounds.top + (bounds.bottom - bounds.top) * ny;
    context.save();
    context.translate(x, y);
    context.rotate((index % 3 - 1) * 0.24);
    context.fillStyle = "rgba(22,31,40,0.9)";
    context.beginPath();
    context.roundRect(-size, -size * 0.42, size * 2, size * 0.84, 4);
    context.fill();
    context.strokeStyle = "rgba(104,164,202,0.18)";
    context.stroke();
    context.fillStyle = index % 2 === 0 ? "rgba(87,205,255,0.24)" : "rgba(242,188,100,0.22)";
    context.beginPath();
    context.roundRect(-size * 0.58, -2, size * 1.16, 4, 2);
    context.fill();
    context.restore();
  });

  const entryRoutes = activePathDefinitions();
  entryRoutes.forEach((route, routeIndex) => {
    const entry = route[1] || route[0];
    const gateX = Math.max(bounds.left + 54, Math.min(entry.x + 36, bounds.left + 118));
    const gateY = entry.y;
    const accent = routeIndex % 2 === 0 ? "rgba(84,205,255,0.72)" : "rgba(242,188,100,0.72)";
    [-1, 1].forEach(side => {
      context.fillStyle = "rgba(15,22,30,0.96)";
      context.beginPath();
      context.roundRect(gateX - 13, gateY + side * 48 - 18, 26, 36, 6);
      context.fill();
      context.strokeStyle = "rgba(105,167,207,0.22)";
      context.lineWidth = 1.2;
      context.stroke();
      context.fillStyle = accent;
      context.beginPath();
      context.roundRect(gateX - 6, gateY + side * 48 - 8, 12, 16, 3);
      context.fill();
    });
  });

  if (isTwinBreach) {
    const merge = TWIN_BREACH_MERGE_POINT;
    context.strokeStyle = "rgba(255,205,115,0.18)";
    context.lineWidth = 2;
    context.setLineDash([8, 9]);
    context.beginPath();
    context.arc(merge.x, merge.y, 72, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);

    const base = activeBasePoint();
    context.fillStyle = "rgba(8,14,21,0.76)";
    context.beginPath();
    context.ellipse(base.x, base.y + 8, 118, 54, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(93,177,225,0.16)";
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(base.x, base.y + 8, 104, 44, 0, 0, Math.PI * 2);
    context.stroke();
  }

  context.restore();
}

function traceRoute(route) {
  context.beginPath();
  route.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
}

function drawRouteWaypoints(route) {
  return;
}

function trimRouteEnd(route, trimDistance) {
  if (!route?.length || route.length < 2 || trimDistance <= 0) return route;
  const result = route.map(point => ({ ...point }));
  let remaining = trimDistance;
  while (result.length > 1 && remaining > 0) {
    const last = result[result.length - 1];
    const previous = result[result.length - 2];
    const segmentLength = distance(last, previous);
    if (segmentLength <= remaining) {
      result.pop();
      remaining -= segmentLength;
      continue;
    }
    const ratio = remaining / segmentLength;
    result[result.length - 1] = {
      x: last.x + (previous.x - last.x) * ratio,
      y: last.y + (previous.y - last.y) * ratio
    };
    remaining = 0;
  }
  return result;
}

function trimRouteStart(route, trimDistance) {
  return trimRouteEnd([...route].reverse(), trimDistance).reverse();
}

function strokeRouteVisual(route) {
  traceRoute(route);
  context.strokeStyle = "rgba(6,12,19,0.94)";
  context.lineWidth = 74;
  context.stroke();
  context.strokeStyle = "rgba(24,34,46,0.96)";
  context.lineWidth = 60;
  context.stroke();
  context.strokeStyle = "#283544";
  context.lineWidth = 46;
  context.stroke();
  context.strokeStyle = "rgba(99,217,255,0.1)";
  context.lineWidth = 2;
  context.stroke();
  context.setLineDash([18, 20]);
  context.strokeStyle = "rgba(242,188,100,0.66)";
  context.lineWidth = 4;
  context.stroke();
  context.setLineDash([]);
  drawRouteWaypoints(route);
}

function strokeTwinBreachNetwork(upper, lower, shared) {
  const routes = [upper, lower, shared];
  const layers = [
    { width: 74, color: "rgba(6,12,19,0.94)" },
    { width: 60, color: "rgba(24,34,46,0.96)" },
    { width: 46, color: "#283544" }
  ];

  layers.forEach(layer => {
    context.strokeStyle = layer.color;
    context.lineWidth = layer.width;
    routes.forEach(route => {
      traceRoute(route);
      context.stroke();
    });
    context.fillStyle = layer.color;
    context.beginPath();
    context.arc(TWIN_BREACH_MERGE_POINT.x, TWIN_BREACH_MERGE_POINT.y, layer.width * 0.5, 0, Math.PI * 2);
    context.fill();
  });

  context.strokeStyle = "rgba(99,217,255,0.1)";
  context.lineWidth = 2;
  routes.forEach(route => {
    traceRoute(route);
    context.stroke();
  });

  const dashedUpper = trimRouteEnd(upper, 28);
  const dashedLower = trimRouteEnd(lower, 28);
  const dashedShared = trimRouteStart(shared, 18);
  context.setLineDash([18, 20]);
  context.strokeStyle = "rgba(242,188,100,0.66)";
  context.lineWidth = 4;
  [dashedUpper, dashedLower, dashedShared].forEach(route => {
    traceRoute(route);
    context.stroke();
  });
  context.setLineDash([]);

  drawRouteWaypoints(upper);
  drawRouteWaypoints(lower);

  const junctionGradient = context.createRadialGradient(
    TWIN_BREACH_MERGE_POINT.x,
    TWIN_BREACH_MERGE_POINT.y,
    4,
    TWIN_BREACH_MERGE_POINT.x,
    TWIN_BREACH_MERGE_POINT.y,
    42
  );
  junctionGradient.addColorStop(0, "rgba(56,68,82,0.98)");
  junctionGradient.addColorStop(0.72, "rgba(40,53,68,0.92)");
  junctionGradient.addColorStop(1, "rgba(40,53,68,0)");
  context.fillStyle = junctionGradient;
  context.beginPath();
  context.arc(TWIN_BREACH_MERGE_POINT.x, TWIN_BREACH_MERGE_POINT.y, 42, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(255,208,122,0.4)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(TWIN_BREACH_MERGE_POINT.x, TWIN_BREACH_MERGE_POINT.y, 25, 0, Math.PI * 2);
  context.stroke();
}

function drawPath() {
  context.lineCap = "round";
  context.lineJoin = "round";

  if (currentMap().id === "twinBreach") {
    const routes = activePathDefinitions();
    const upperFull = routes[0];
    const lowerFull = routes[1];
    const upper = upperFull.slice(0, -1);
    const lower = lowerFull.slice(0, -1);
    const shared = [TWIN_BREACH_MERGE_POINT, activeBasePoint()];

    strokeTwinBreachNetwork(upper, lower, shared);

    const glow = context.createRadialGradient(TWIN_BREACH_MERGE_POINT.x, TWIN_BREACH_MERGE_POINT.y, 8, TWIN_BREACH_MERGE_POINT.x, TWIN_BREACH_MERGE_POINT.y, 92);
    glow.addColorStop(0, "rgba(255,204,112,0.2)");
    glow.addColorStop(0.55, "rgba(120,210,255,0.07)");
    glow.addColorStop(1, "rgba(120,210,255,0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(TWIN_BREACH_MERGE_POINT.x, TWIN_BREACH_MERGE_POINT.y, 92, 0, Math.PI * 2);
    context.fill();

    [
      { x: 28, y: 232, label: "A" },
      { x: 28, y: 590, label: "B" }
    ].forEach(marker => {
      context.save();
      context.translate(marker.x, marker.y);
      const width = 34;
      context.fillStyle = "rgba(8,16,25,0.88)";
      context.beginPath();
      context.roundRect(-width / 2, -13, width, 26, 8);
      context.fill();
      context.strokeStyle = "rgba(116,211,255,0.42)";
      context.lineWidth = 1.4;
      context.stroke();
      context.fillStyle = "rgba(161,232,255,0.98)";
      context.font = "700 14px Inter, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(marker.label, 0, 1);
      context.restore();
    });
    return;
  }

  activePathDefinitions().forEach(route => strokeRouteVisual(route));
}

function drawReactorBase() {
  const end = activeBasePoint();
  const hit = clamp(state.baseHitPulse || 0, 0, 1);
  const integrity = clamp(state.stability / 100, 0, 1);
  const now = performance.now();
  const pulse = 0.56 + 0.44 * Math.sin(now * 0.0045);
  const alarm = hit > 0.02 || integrity < 0.35;
  const alarmPulse = alarm ? 0.55 + 0.45 * Math.sin(now * 0.015) : 0;

  context.save();
  context.translate(end.x, end.y + (currentMap().id === "twinBreach" ? -18 : -10));

  context.fillStyle = "rgba(7,10,16,0.48)";
  context.beginPath();
  context.ellipse(0, 32, 78, 24, 0, 0, Math.PI * 2);
  context.fill();

  const floorGradient = context.createLinearGradient(-64, -48, 64, 56);
  floorGradient.addColorStop(0, "#edf3f7");
  floorGradient.addColorStop(0.24, "#b6c0ca");
  floorGradient.addColorStop(0.62, "#66717d");
  floorGradient.addColorStop(1, "#27303a");
  drawPlasmaSquareBase(0, 10, 52, 36, floorGradient, "rgba(102,222,255,0.22)");

  const octGradient = context.createLinearGradient(-30, -30, 30, 30);
  octGradient.addColorStop(0, "#eef3f7");
  octGradient.addColorStop(0.26, "#c6cfd8");
  octGradient.addColorStop(0.62, "#6f7b87");
  octGradient.addColorStop(1, "#303844");
  context.fillStyle = octGradient;
  context.beginPath();
  context.moveTo(-18, -30);
  context.lineTo(18, -30);
  context.lineTo(30, -18);
  context.lineTo(30, 18);
  context.lineTo(18, 30);
  context.lineTo(-18, 30);
  context.lineTo(-30, 18);
  context.lineTo(-30, -18);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(236,242,246,0.16)";
  context.lineWidth = 1.1;
  context.stroke();

  context.strokeStyle = "rgba(28,33,40,0.34)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(-18, -20);
  context.lineTo(-18, 20);
  context.moveTo(18, -20);
  context.lineTo(18, 20);
  context.moveTo(0, -30);
  context.lineTo(0, 30);
  context.moveTo(-20, -12);
  context.lineTo(20, -12);
  context.moveTo(-20, 0);
  context.lineTo(20, 0);
  context.moveTo(-20, 12);
  context.lineTo(20, 12);
  context.stroke();

  const sidePodGradient = context.createLinearGradient(-6, -8, 6, 8);
  sidePodGradient.addColorStop(0, "#eef3f7");
  sidePodGradient.addColorStop(0.3, "#bcc6cf");
  sidePodGradient.addColorStop(0.7, "#6c7887");
  sidePodGradient.addColorStop(1, "#2d3641");
  [[-30, -8], [30, -8], [-30, 8], [30, 8]].forEach(([x, y]) => {
    context.fillStyle = sidePodGradient;
    context.beginPath();
    context.roundRect(x - 4.5, y - 8.5, 9, 17, 3);
    context.fill();
    context.strokeStyle = "rgba(236,242,246,0.1)";
    context.stroke();
    context.fillStyle = alarm ? `rgba(255,122,96,${0.3 + alarmPulse * 0.3})` : `rgba(98,225,255,${0.26 + pulse * 0.18})`;
    context.beginPath();
    context.roundRect(x - 1.2, y - 2.2, 2.4, 6.8, 1);
    context.fill();
  });

  const miniTowerGradient = context.createLinearGradient(-8, -10, 8, 10);
  miniTowerGradient.addColorStop(0, "#eef3f7");
  miniTowerGradient.addColorStop(0.35, "#b8c2cc");
  miniTowerGradient.addColorStop(0.72, "#6b7784");
  miniTowerGradient.addColorStop(1, "#303944");
  [[-34, -22], [34, -22], [-34, 22], [34, 22]].forEach(([x, y]) => {
    context.fillStyle = miniTowerGradient;
    context.beginPath();
    context.moveTo(x - 4.5, y + 7);
    context.lineTo(x - 4.5, y - 1);
    context.lineTo(x - 2, y - 8);
    context.lineTo(x + 2, y - 8);
    context.lineTo(x + 4.5, y - 1);
    context.lineTo(x + 4.5, y + 7);
    context.lineTo(x + 2, y + 10);
    context.lineTo(x - 2, y + 10);
    context.closePath();
    context.fill();
    context.strokeStyle = "rgba(236,242,246,0.12)";
    context.stroke();
    context.fillStyle = alarm ? `rgba(255,122,96,${0.26 + alarmPulse * 0.28})` : `rgba(98,225,255,${0.22 + pulse * 0.16})`;
    context.beginPath();
    context.roundRect(x - 0.9, y - 1.2, 1.8, 5.8, 0.8);
    context.fill();
  });

  context.fillStyle = "rgba(10,14,20,0.52)";
  context.beginPath();
  context.ellipse(0, 4, 24, 12.5, 0, 0, Math.PI * 2);
  context.fill();
  const ringGradient = context.createRadialGradient(0, 0, 2, 0, 3, 28);
  ringGradient.addColorStop(0, "#8d99a5");
  ringGradient.addColorStop(0.48, "#46525e");
  ringGradient.addColorStop(1, "#1b232d");
  context.fillStyle = ringGradient;
  context.beginPath();
  context.ellipse(0, 2, 22, 11, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(194,224,235,0.18)";
  context.lineWidth = 1.3;
  context.stroke();

  context.fillStyle = "rgba(16,23,31,0.95)";
  context.beginPath();
  context.roundRect(-7.5, 18, 15, 4.6, 1.5);
  context.fill();
  context.fillStyle = `rgba(99,217,255,${0.18 + pulse * 0.15})`;
  context.beginPath();
  context.roundRect(-5.4, 19.3, 10.8, 2, 1);
  context.fill();

  context.fillStyle = alarm ? `rgba(255,116,90,${0.3 + alarmPulse * 0.42})` : `rgba(76,219,255,${0.3 + pulse * 0.22})`;
  context.shadowColor = alarm ? `rgba(255,84,60,${0.9 * alarmPulse})` : "rgba(69,220,255,0.92)";
  context.shadowBlur = 15;
  for (let i = 0; i < 3; i += 1) {
    context.beginPath();
    context.ellipse(0, -15 + i * 7, 8.3 - i * 0.6, 2.3, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.shadowBlur = 0;

  const coreGradient = context.createRadialGradient(0, -34, 1, 0, -34, 18);
  coreGradient.addColorStop(0, "rgba(248,254,255,0.99)");
  coreGradient.addColorStop(0.24, alarm ? "rgba(255,140,115,0.94)" : "rgba(130,239,255,0.98)");
  coreGradient.addColorStop(0.68, alarm ? "rgba(255,78,58,0.6)" : "rgba(42,146,235,0.64)");
  coreGradient.addColorStop(1, "rgba(10,20,34,0.02)");
  context.fillStyle = coreGradient;
  context.shadowColor = alarm ? `rgba(255,82,58,${0.9 * alarmPulse})` : "rgba(63,218,255,0.88)";
  context.shadowBlur = 24;
  context.beginPath();
  context.arc(0, -34, 10 + pulse, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  context.strokeStyle = alarm ? "rgba(255,124,96,0.76)" : "rgba(106,229,255,0.78)";
  context.lineWidth = 1.8;
  [[-10, -18], [10, -18], [-14, -8], [14, -8], [-18, 2], [18, 2]].forEach(([x, y], idx) => {
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x * 0.42, y - 5.2);
    context.lineTo(idx % 2 === 0 ? -2 : 2, -25);
    context.lineTo(0, -34);
    context.stroke();
  });

  context.strokeStyle = alarm ? `rgba(255,118,92,${0.28 + alarmPulse * 0.34})` : `rgba(117,235,255,${0.24 + pulse * 0.22})`;
  context.lineWidth = 1.7;
  for (let ring = 0; ring < 3; ring += 1) {
    const phase = now * 0.0019 + ring * 2.05;
    context.beginPath();
    context.arc(0, -8, 11 + ring * 4, phase, phase + 1.02);
    context.stroke();
  }

  const accentColor = alarm ? `rgba(255,126,98,${0.28 + alarmPulse * 0.26})` : `rgba(99,217,255,${0.24 + pulse * 0.18})`;
  context.fillStyle = accentColor;
  [[-10, -3], [10, -3], [-10, 9], [10, 9], [-4.2, -22], [4.2, -22], [-4.2, 20], [4.2, 20]].forEach(([x, y]) => {
    context.beginPath();
    context.roundRect(x - 1.2, y - 0.8, 2.4, 1.6, 0.6);
    context.fill();
  });

  if (hit > 0.02) {
    context.globalAlpha = Math.min(1, hit * 1.16);
    context.fillStyle = "rgba(255,78,60,0.14)";
    context.beginPath();
    context.arc(0, -2, 60 + hit * 22, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255,92,72,0.95)";
    context.lineWidth = 3.5;
    context.beginPath();
    context.arc(0, -2, 30 + hit * 10, 0, Math.PI * 2);
    context.stroke();
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255,185,171,0.8)";
    context.beginPath();
    context.arc(0, -2, 44 + hit * 16, 0, Math.PI * 2);
    context.stroke();
  }

  context.restore();
}

function drawTowers() {
  const towersToDraw = [...state.towers].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.id.localeCompare(b.id);
  });

  towersToDraw.forEach(tower => {
    const definition = towerDefinitions[tower.id];
    const deleteHovered = state.deleteMode && state.deleteHoverTower === tower;

    if (definition.kind !== "infrastructure") {
      context.globalAlpha = 0.045;
      context.beginPath();
      context.arc(tower.x, tower.y, towerRange(definition, tower), 0, Math.PI * 2);
      context.fillStyle = definition.color;
      context.fill();
      context.globalAlpha = 1;
    }

    if (state.selectedPlacedTower === tower) {
      context.beginPath();
      context.arc(tower.x, tower.y, 38, 0, Math.PI * 2);
      context.strokeStyle = palette.roadMark;
      context.lineWidth = 4;
      context.stroke();
    }

    if (state.deleteMode) {
      const deleteRadius = definition.kind === "infrastructure" ? 42 : 38;
      context.save();
      context.shadowColor = deleteHovered ? "rgba(255, 65, 75, 0.92)" : "rgba(255, 70, 80, 0.48)";
      context.shadowBlur = deleteHovered ? 22 : 12;
      context.fillStyle = deleteHovered ? "rgba(217, 55, 65, 0.22)" : "rgba(217, 55, 65, 0.10)";
      context.beginPath();
      context.arc(tower.x, tower.y, deleteRadius, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = deleteHovered ? "rgba(255, 92, 92, 0.96)" : "rgba(255, 92, 92, 0.34)";
      context.lineWidth = deleteHovered ? 4 : 2;
      context.stroke();
      context.restore();
    }

    drawTowerModel(tower, definition);

    if (state.deleteMode) {
      context.save();
      context.globalAlpha = deleteHovered ? 0.28 : 0.10;
      context.fillStyle = "#ff3f4f";
      context.beginPath();
      context.arc(tower.x, tower.y, definition.kind === "infrastructure" ? 35 : 31, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    if (deleteHovered) {
      context.save();
      context.globalAlpha = 0.28;
      context.fillStyle = "#ff3f4f";
      context.beginPath();
      context.arc(tower.x, tower.y, definition.kind === "infrastructure" ? 35 : 31, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
      context.strokeStyle = "rgba(255, 225, 225, 0.9)";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(tower.x - 10, tower.y - 10);
      context.lineTo(tower.x + 10, tower.y + 10);
      context.moveTo(tower.x + 10, tower.y - 10);
      context.lineTo(tower.x - 10, tower.y + 10);
      context.stroke();
      context.restore();
    }
  });
}

function drawTowerModel(tower, definition) {
  if (definition.style === "refinery") {
    drawRefineryModel(tower, definition);
    return;
  }

  if (definition.id === "frost") {
    drawFrostTowerModel(tower, definition);
    return;
  }

  context.save();
  context.translate(tower.x, tower.y);
  context.rotate(definition.effect === "auraSlow" || definition.style === "electro" ? 0 : tower.angle);

  if (definition.style === "plasma") {
    drawPlasmaCannonModel(tower, definition);
    context.restore();
    drawMuzzleFlash(tower, definition);
    return;
  }

  if (definition.style === "sniper") {
    drawSniperTowerModel(tower, definition);
    context.restore();
    drawMuzzleFlash(tower, definition);
    return;
  }

  if (definition.style === "electro") {
    drawElectroTowerModel(tower, definition);
    context.restore();
    drawMuzzleFlash(tower, definition);
    return;
  }

  if (definition.style === "cannon") {
    drawCannonTowerModel(tower, definition);
    context.restore();
    drawMuzzleFlash(tower, definition);
    return;
  }

  const baseGradient = context.createLinearGradient(-28, -30, 26, 26);
  baseGradient.addColorStop(0, definition.topColor);
  baseGradient.addColorStop(0.5, definition.color);
  baseGradient.addColorStop(1, definition.bodyColor);

  context.fillStyle = "rgba(12,15,22,0.34)";
  context.beginPath();
  context.ellipse(-4, 14, 32, 18, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(32,36,45,0.9)";
  context.beginPath();
  context.arc(0, 4, 31, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(242,188,100,0.16)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, 4, 30, 0, Math.PI * 2);
  context.stroke();

  if (definition.style === "sniper") {
    context.fillStyle = definition.bodyColor;
    context.beginPath();
    context.roundRect(-24, -18, 48, 42, 8);
    context.fill();

    context.fillStyle = baseGradient;
    context.beginPath();
    context.roundRect(-30, -25, 60, 36, 8);
    context.fill();

    context.fillStyle = "rgba(38,42,54,0.9)";
    context.beginPath();
    context.roundRect(-12, -18, 20, 10, 5);
    context.fill();
  } else if (definition.style === "control") {
    context.fillStyle = definition.bodyColor;
    context.beginPath();
    context.arc(0, 0, 29, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = baseGradient;
    context.beginPath();
    context.arc(0, -6, 27, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(225,238,241,0.38)";
    context.beginPath();
    context.arc(0, -6, 15 + tower.pulse * 4, 0, Math.PI * 2);
    context.fill();
  } else if (definition.style === "tesla") {
    context.fillStyle = definition.bodyColor;
    context.beginPath();
    context.roundRect(-22, -18, 44, 42, 8);
    context.fill();

    context.fillStyle = baseGradient;
    context.beginPath();
    context.roundRect(-25, -24, 50, 38, 8);
    context.fill();

    context.fillStyle = "rgba(232,225,255,0.5)";
    context.beginPath();
    context.arc(0, -8, 13 + tower.pulse * 3, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "rgba(242,188,100,0.45)";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, -8, 20, 0.35, Math.PI * 1.75);
    context.stroke();
  } else {
    context.fillStyle = definition.bodyColor;
    context.beginPath();
    context.moveTo(-30, -4);
    context.lineTo(-8, -25);
    context.lineTo(28, -13);
    context.lineTo(22, 18);
    context.lineTo(-18, 22);
    context.closePath();
    context.fill();

    context.fillStyle = baseGradient;
    context.beginPath();
    context.moveTo(-25, -9);
    context.lineTo(-5, -27);
    context.lineTo(26, -11);
    context.lineTo(16, 13);
    context.lineTo(-18, 15);
    context.closePath();
    context.fill();
  }

  context.fillStyle = "rgba(12,15,22,0.22)";
  context.beginPath();
  context.arc(0, -4, 15, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(246,225,189,0.2)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, -4, 17, Math.PI * 0.08, Math.PI * 1.78);
  context.stroke();

  if (definition.id === "plasma") {
    context.fillStyle = "rgba(117,207,255,0.5)";
    context.beginPath();
    context.arc(-7, -7, 6, 0, Math.PI * 2);
    context.arc(9, -3, 6, 0, Math.PI * 2);
    context.fill();
  }

  context.strokeStyle = "rgba(246,225,189,0.28)";
  context.lineWidth = 2;
  context.stroke();

  definition.barrels.forEach((barrel, index) => {
    if (barrel.length <= 0 || barrel.width <= 0) {
      return;
    }

    const recoil = tower.recoils[index] || 0;
    const recoilDistance = recoil * 12;
    const barrelX = barrel.forward - recoilDistance;
    const barrelY = barrel.side - barrel.width / 2;
    const barrelGradient = context.createLinearGradient(barrelX, barrelY, barrelX + barrel.length, barrelY + barrel.width);
    barrelGradient.addColorStop(0, definition.barrelColor);
    barrelGradient.addColorStop(0.55, "#677181");
    barrelGradient.addColorStop(1, "#242936");

    context.fillStyle = "rgba(12,15,22,0.28)";
    context.beginPath();
    context.roundRect(barrelX - 2, barrelY + 3, barrel.length + 5, barrel.width + 3, 4);
    context.fill();

    context.fillStyle = barrelGradient;
    context.beginPath();
    context.roundRect(barrelX, barrelY, barrel.length, barrel.width, 4);
    context.fill();

    context.fillStyle = "rgba(255,255,255,0.14)";
    context.fillRect(barrelX + 5, barrelY + 2, Math.max(4, barrel.length - 12), 1.5);
  });

  context.fillStyle = "rgba(255,255,255,0.12)";
  context.beginPath();
  context.roundRect(-18, -18, definition.style === "sniper" ? 29 : 20, 7, 4);
  context.fill();

  if (definition.style === "sniper") {
    context.strokeStyle = "rgba(246,225,189,0.55)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(37, 0, 7, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(8, 11);
    context.lineTo(-10, 24);
    context.moveTo(8, -14);
    context.lineTo(-12, -25);
    context.stroke();
  } else if (definition.style === "control") {
    context.strokeStyle = "rgba(246,225,189,0.42)";
    context.lineWidth = 2;
    for (let spoke = 0; spoke < 8; spoke += 1) {
      const angle = (Math.PI * 2 * spoke) / 8;
      context.beginPath();
      context.moveTo(Math.cos(angle) * 9, -6 + Math.sin(angle) * 9);
      context.lineTo(Math.cos(angle) * 22, -6 + Math.sin(angle) * 18);
      context.stroke();
    }
  } else if (definition.style === "tesla") {
    context.strokeStyle = "rgba(232,225,255,0.55)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(7, -16);
    context.lineTo(19, -7);
    context.lineTo(10, -5);
    context.lineTo(23, 7);
    context.stroke();
  } else if (definition.id !== "plasma") {
    context.fillStyle = "rgba(242,188,100,0.32)";
    context.beginPath();
    context.arc(-8, -7, 6, 0, Math.PI * 2);
    context.arc(10, -2, 6, 0, Math.PI * 2);
    context.fill();
  }

  if ((tower.weakTimer || 0) > 0) {
    context.strokeStyle = "rgba(217,95,99,0.7)";
    context.lineWidth = 3;
    context.setLineDash([5, 4]);
    context.beginPath();
    context.arc(0, 0, 34, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  }

  context.restore();

  drawMuzzleFlash(tower, definition);

  if (definition.effect === "auraSlow") {
    context.globalAlpha = 0.08 + tower.pulse * 0.06;
    context.beginPath();
    context.arc(tower.x, tower.y, towerRange(definition, tower) * (0.46 + tower.pulse * 0.18), 0, Math.PI * 2);
    context.strokeStyle = definition.topColor;
    context.lineWidth = 14;
    context.stroke();
    for (let puff = 0; puff < 8; puff += 1) {
      const angle = (Math.PI * 2 * puff) / 8;
      const radius = 34 + tower.pulse * 28;
      context.beginPath();
      context.arc(tower.x + Math.cos(angle) * radius, tower.y + Math.sin(angle) * radius, 7 + tower.pulse * 7, 0, Math.PI * 2);
      context.fillStyle = definition.topColor;
      context.fill();
    }
    context.globalAlpha = 1;
  }
}

function drawMuzzleFlash(tower, definition) {
  if (!tower.muzzleFlash) {
    return;
  }

  context.beginPath();
  context.arc(tower.muzzleFlash.x, tower.muzzleFlash.y, 7 + tower.muzzleFlash.life * 45, 0, Math.PI * 2);
  const flashAlpha = Math.max(0, tower.muzzleFlash.life / tower.muzzleFlash.maxLife);
  context.fillStyle = hexToRgba(tower.muzzleFlash.color || definition.projectileColor || definition.color, flashAlpha);
  context.fill();
}

function drawFrostTowerModel(tower, definition) {
  const pulse = Math.min(1, Math.max(0, tower.pulse || 0));
  drawFrostAura(tower, definition, pulse);

  context.save();
  context.translate(tower.x, tower.y);

  context.fillStyle = "rgba(12,15,22,0.44)";
  context.beginPath();
  context.ellipse(0, 18, 29, 17, 0, 0, Math.PI * 2);
  context.fill();

  const baseGradient = context.createLinearGradient(-23, -11, 24, 30);
  baseGradient.addColorStop(0, "#edf3f8");
  baseGradient.addColorStop(0.24, "#a7b3bf");
  baseGradient.addColorStop(0.64, "#46515f");
  baseGradient.addColorStop(1, "#1f2731");
  drawPlasmaSquareBase(0, 11, 21, 19, baseGradient, "rgba(112,197,225,0.22)");

  context.fillStyle = "rgba(19,25,33,0.92)";
  context.beginPath();
  context.roundRect(-15, 18, 30, 8, 3);
  context.fill();
  context.fillStyle = "rgba(99,217,255,0.72)";
  context.shadowColor = "rgba(99,217,255,0.58)";
  context.shadowBlur = 5;
  context.beginPath();
  context.roundRect(-8, 20.5, 16, 2.5, 1.2);
  context.fill();
  context.shadowBlur = 0;

  const ringGradient = context.createRadialGradient(-4, -2, 2, 0, 1, 22);
  ringGradient.addColorStop(0, "#84909d");
  ringGradient.addColorStop(0.48, "#3d4755");
  ringGradient.addColorStop(1, "#1b222c");
  context.fillStyle = "rgba(10,14,20,0.5)";
  context.beginPath();
  context.ellipse(0, 6, 20, 12, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = ringGradient;
  context.beginPath();
  context.ellipse(0, 2, 18.5, 11, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(194,224,235,0.18)";
  context.lineWidth = 1.5;
  context.stroke();

  const emitterGradient = context.createLinearGradient(-8, -18, 8, 10);
  emitterGradient.addColorStop(0, "#ffffff");
  emitterGradient.addColorStop(0.28, "#d4dde6");
  emitterGradient.addColorStop(0.65, "#778493");
  emitterGradient.addColorStop(1, "#29323e");

  const emitterPositions = [
    { x: -15, y: -5 },
    { x: 15, y: -5 },
    { x: -15, y: 8 },
    { x: 15, y: 8 }
  ];

  emitterPositions.forEach(({ x, y }) => {
    context.fillStyle = "rgba(8,12,18,0.28)";
    context.beginPath();
    context.roundRect(x - 5.2, y - 10.5, 10.4, 22, 4);
    context.fill();

    context.fillStyle = emitterGradient;
    context.beginPath();
    context.roundRect(x - 4.3, y - 11.5, 8.6, 21, 3.5);
    context.fill();
    context.strokeStyle = "rgba(242,247,250,0.2)";
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = "rgba(255,255,255,0.92)";
    context.beginPath();
    context.roundRect(x - 3.2, y - 9.8, 6.4, 6.2, 2);
    context.fill();

    context.fillStyle = "rgba(104,224,255,0.82)";
    context.shadowColor = "rgba(104,224,255,0.8)";
    context.shadowBlur = 6 + pulse * 3;
    context.beginPath();
    context.roundRect(x - 1.6, y - 1.8, 3.2, 8, 1.4);
    context.fill();
    context.shadowBlur = 0;
  });

  const bodyGradient = context.createLinearGradient(-14, -22, 14, 8);
  bodyGradient.addColorStop(0, "#f5f8fb");
  bodyGradient.addColorStop(0.25, "#c8d2dc");
  bodyGradient.addColorStop(0.62, "#647181");
  bodyGradient.addColorStop(1, "#25303c");
  context.fillStyle = bodyGradient;
  context.beginPath();
  context.roundRect(-11, -19, 22, 20, 6);
  context.fill();
  context.strokeStyle = "rgba(235,242,246,0.18)";
  context.stroke();

  context.fillStyle = "rgba(255,255,255,0.9)";
  context.beginPath();
  context.roundRect(-7.5, -16, 15, 5.5, 2);
  context.fill();

  context.fillStyle = "rgba(17,23,31,0.96)";
  context.beginPath();
  context.arc(0, -6, 12, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(172,229,240,0.34)";
  context.lineWidth = 2;
  context.stroke();

  const coreGradient = context.createRadialGradient(-2, -8, 1, 0, -6, 10 + pulse * 2);
  coreGradient.addColorStop(0, "#ffffff");
  coreGradient.addColorStop(0.28, "#e1faff");
  coreGradient.addColorStop(0.72, "rgba(99,217,255,0.78)");
  coreGradient.addColorStop(1, "rgba(99,217,255,0.08)");
  context.fillStyle = coreGradient;
  context.shadowColor = "rgba(99,217,255,0.86)";
  context.shadowBlur = 8 + pulse * 5;
  context.beginPath();
  context.arc(0, -6, 7.2 + pulse * 1.3, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  drawSnowflake(0, -6, 5.4, "rgba(250,254,255,0.98)");

  context.fillStyle = "rgba(255,255,255,0.85)";
  context.beginPath();
  context.roundRect(-15, 6, 6, 4, 1.4);
  context.roundRect(9, 6, 6, 4, 1.4);
  context.fill();

  context.fillStyle = "rgba(242,188,100,0.62)";
  context.fillRect(-13, 12, 6, 2.5);
  context.fillRect(7, 12, 6, 2.5);

  if ((tower.weakTimer || 0) > 0) {
    context.strokeStyle = "rgba(217,95,99,0.7)";
    context.lineWidth = 3;
    context.setLineDash([5, 4]);
    context.beginPath();
    context.arc(0, 0, 34, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  }

  context.restore();
}

function drawFrostAura(tower, definition, pulse) {
  const range = towerRange(definition, tower);
  const waveProgress = 1 - Math.min(1, Math.max(0, pulse));
  const pulseRadius = 26 + waveProgress * (range * 0.7);
  const ringAlpha = 0.04 + (1 - waveProgress) * 0.03;

  context.save();
  context.globalAlpha = 1;

  const vaporGradient = context.createRadialGradient(tower.x, tower.y, 12, tower.x, tower.y, range * 0.82);
  vaporGradient.addColorStop(0, `rgba(124,226,255,${0.05 + pulse * 0.03})`);
  vaporGradient.addColorStop(0.48, `rgba(124,226,255,${0.018 + pulse * 0.012})`);
  vaporGradient.addColorStop(1, "rgba(124,226,255,0)");
  context.fillStyle = vaporGradient;
  context.beginPath();
  context.arc(tower.x, tower.y, range * 0.82, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = `rgba(124,226,255,${ringAlpha})`;
  context.lineWidth = 4.5 + (1 - waveProgress) * 3.5;
  context.beginPath();
  context.arc(tower.x, tower.y, pulseRadius, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = `rgba(210,248,255,${0.08 + (1 - waveProgress) * 0.08})`;
  context.lineWidth = 1.6;
  context.beginPath();
  context.arc(tower.x, tower.y, pulseRadius + 6, 0, Math.PI * 2);
  context.stroke();

  for (let puff = 0; puff < 12; puff += 1) {
    const angle = (Math.PI * 2 * puff) / 12 + waveProgress * 0.14;
    const radius = 22 + waveProgress * 54 + (puff % 3) * 5;
    context.fillStyle = `rgba(191,239,255,${0.02 + (1 - waveProgress) * 0.04})`;
    context.beginPath();
    context.arc(tower.x + Math.cos(angle) * radius, tower.y + Math.sin(angle) * radius, 5 + (1 - waveProgress) * 6, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

function drawFrostFin(x, y, rotation, definition) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  const finGradient = context.createLinearGradient(-8, -23, 8, 23);
  finGradient.addColorStop(0, "#edf1f5");
  finGradient.addColorStop(0.38, "#9aa6b4");
  finGradient.addColorStop(1, "#46505f");
  context.fillStyle = finGradient;
  context.beginPath();
  context.moveTo(-9, 20);
  context.lineTo(-5, -19);
  context.lineTo(4, -27);
  context.lineTo(10, 17);
  context.lineTo(4, 24);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(15,28,42,0.58)";
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = "rgba(99,217,255,0.7)";
  context.shadowColor = "rgba(99,217,255,0.8)";
  context.shadowBlur = 8;
  context.beginPath();
  context.roundRect(-3, -8, 6, 14, 3);
  context.fill();
  context.shadowBlur = 0;
  context.restore();
}

function drawFrostPanel(x, y, rotation, width, height, glowStyle) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  const panelGradient = context.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
  panelGradient.addColorStop(0, "#d8dee7");
  panelGradient.addColorStop(0.35, "#7b8796");
  panelGradient.addColorStop(1, "#252f3d");
  context.fillStyle = panelGradient;
  context.beginPath();
  context.roundRect(-width / 2, -height / 2, width, height, 5);
  context.fill();
  context.strokeStyle = "rgba(5,12,19,0.6)";
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = glowStyle;
  context.shadowColor = glowStyle;
  context.shadowBlur = 8;
  context.beginPath();
  context.roundRect(-width * 0.28, -height * 0.08, width * 0.56, height * 0.16, 3);
  context.fill();
  context.shadowBlur = 0;
  context.restore();
}

function drawFrostSquareBase(centerX, centerY, radiusX, radiusY, fillStyle, strokeStyle) {
  context.fillStyle = fillStyle;
  context.strokeStyle = strokeStyle;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX - radiusX * 0.76, centerY - radiusY);
  context.lineTo(centerX + radiusX * 0.76, centerY - radiusY);
  context.lineTo(centerX + radiusX, centerY - radiusY * 0.68);
  context.lineTo(centerX + radiusX, centerY + radiusY * 0.58);
  context.lineTo(centerX + radiusX * 0.62, centerY + radiusY);
  context.lineTo(centerX - radiusX * 0.62, centerY + radiusY);
  context.lineTo(centerX - radiusX, centerY + radiusY * 0.58);
  context.lineTo(centerX - radiusX, centerY - radiusY * 0.68);
  context.closePath();
  context.fill();
  context.stroke();

  context.strokeStyle = "rgba(232,248,255,0.15)";
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(centerX - radiusX * 0.58, centerY + radiusY * 0.66);
  context.lineTo(centerX + radiusX * 0.58, centerY + radiusY * 0.66);
  context.stroke();

  context.fillStyle = "rgba(124,226,255,0.16)";
  context.beginPath();
  context.roundRect(centerX - 18, centerY + radiusY * 0.48, 36, 4, 2);
  context.fill();
}

function drawFrostBeveledOctagon(centerX, centerY, radiusX, radiusY, fillStyle, strokeStyle) {
  context.fillStyle = fillStyle;
  context.strokeStyle = strokeStyle;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX - radiusX * 0.58, centerY - radiusY);
  context.lineTo(centerX + radiusX * 0.58, centerY - radiusY);
  context.lineTo(centerX + radiusX, centerY - radiusY * 0.45);
  context.lineTo(centerX + radiusX, centerY + radiusY * 0.45);
  context.lineTo(centerX + radiusX * 0.58, centerY + radiusY);
  context.lineTo(centerX - radiusX * 0.58, centerY + radiusY);
  context.lineTo(centerX - radiusX, centerY + radiusY * 0.45);
  context.lineTo(centerX - radiusX, centerY - radiusY * 0.45);
  context.closePath();
  context.fill();
  context.stroke();

  context.strokeStyle = "rgba(232,248,255,0.14)";
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(centerX - radiusX * 0.48, centerY + radiusY * 0.62);
  context.lineTo(centerX + radiusX * 0.48, centerY + radiusY * 0.62);
  context.stroke();
}

function drawSnowflake(x, y, radius, strokeStyle) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = strokeStyle;
  context.lineWidth = Math.max(1.4, radius * 0.16);
  context.lineCap = "round";
  for (let branch = 0; branch < 6; branch += 1) {
    const angle = (Math.PI * 2 * branch) / 6;
    const inner = radius * 0.24;
    const outer = radius;
    context.beginPath();
    context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    context.stroke();
    const sideA = angle + 0.72;
    const sideB = angle - 0.72;
    const jointX = Math.cos(angle) * radius * 0.62;
    const jointY = Math.sin(angle) * radius * 0.62;
    context.beginPath();
    context.moveTo(jointX, jointY);
    context.lineTo(jointX + Math.cos(sideA) * radius * 0.23, jointY + Math.sin(sideA) * radius * 0.23);
    context.moveTo(jointX, jointY);
    context.lineTo(jointX + Math.cos(sideB) * radius * 0.23, jointY + Math.sin(sideB) * radius * 0.23);
    context.stroke();
  }
  context.restore();
}


function drawElectroTowerModel(tower, definition) {
  const now = performance.now();
  const charge = tower.arcActive ? 1 : clamp(tower.chargeProgress || 0, 0, 1);
  const overheated = (tower.overheatTimer || 0) > 0;
  const cooling = overheated ? clamp((tower.overheatTimer || 0) / Math.max(0.001, tower.overheatDuration || 2), 0, 1) : (!tower.arcActive && (tower.chargeDecayTimer || 0) <= 0 && tower.cooldown > 0 ? clamp(tower.cooldown / Math.max(0.001, fireIntervalForTower(definition, tower) * 0.34), 0, 1) : 0);
  const pulse = 0.52 + 0.48 * Math.sin(now * 0.008 + tower.pulse * 5.5);

  context.fillStyle = "rgba(12,15,22,0.44)";
  context.beginPath();
  context.ellipse(0, 18, 29, 17, 0, 0, Math.PI * 2);
  context.fill();

  const baseGradient = context.createLinearGradient(-23, -11, 24, 30);
  baseGradient.addColorStop(0, "#dce6ef");
  baseGradient.addColorStop(0.24, "#91a0b0");
  baseGradient.addColorStop(0.64, "#455362");
  baseGradient.addColorStop(1, "#1f2731");
  drawPlasmaSquareBase(0, 11, 21, 19, baseGradient, "rgba(112,197,225,0.22)");

  context.fillStyle = "rgba(19,25,33,0.94)";
  context.beginPath();
  context.roundRect(-15, 18, 30, 8, 3);
  context.fill();
  context.fillStyle = overheated ? `rgba(255,146,82,${0.3 + cooling * 0.36})` : (charge > 0.01 ? `rgba(99,217,255,${0.28 + charge * 0.44})` : `rgba(99,217,255,${0.12 + cooling * 0.14})`);
  context.shadowColor = overheated ? "rgba(255,132,66,0.78)" : "rgba(99,217,255,0.62)";
  context.shadowBlur = 5 + charge * 2 + cooling * 2;
  context.beginPath();
  context.roundRect(-8, 20.5, 16, 2.5, 1.2);
  context.fill();
  context.shadowBlur = 0;

  const ringGradient = context.createRadialGradient(-4, -2, 2, 0, 1, 22);
  ringGradient.addColorStop(0, "#8492a2");
  ringGradient.addColorStop(0.48, "#3d4856");
  ringGradient.addColorStop(1, "#1b222c");
  context.fillStyle = "rgba(10,14,20,0.5)";
  context.beginPath();
  context.ellipse(0, 6, 20, 12, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = ringGradient;
  context.beginPath();
  context.ellipse(0, 2, 18.5, 11, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(194,224,235,0.18)";
  context.lineWidth = 1.5;
  context.stroke();

  const columnGradient = context.createLinearGradient(-12, -28, 12, 10);
  columnGradient.addColorStop(0, "#f3f7fb");
  columnGradient.addColorStop(0.24, "#c5d0db");
  columnGradient.addColorStop(0.62, "#637182");
  columnGradient.addColorStop(1, "#26313d");
  context.fillStyle = columnGradient;
  context.beginPath();
  context.roundRect(-10, -20, 20, 25, 6);
  context.fill();
  context.strokeStyle = "rgba(236,242,246,0.17)";
  context.stroke();

  const centralLineHeight = Math.max(2.5, 16 * charge);
  context.fillStyle = overheated ? `rgba(255,166,90,${0.2 + cooling * 0.45})` : `rgba(82,227,255,${0.18 + charge * 0.6})`;
  context.shadowColor = overheated ? "rgba(255,140,76,0.95)" : "rgba(82,227,255,0.9)";
  context.shadowBlur = 8 + charge * 8 + cooling * 3;
  context.beginPath();
  context.roundRect(-3.2, -1 - centralLineHeight, 6.4, centralLineHeight, 2.2);
  context.fill();
  context.shadowBlur = 0;

  const pylonGradient = context.createLinearGradient(-8, -16, 8, 10);
  pylonGradient.addColorStop(0, "#f2f6fa");
  pylonGradient.addColorStop(0.24, "#c1ccd6");
  pylonGradient.addColorStop(0.62, "#687687");
  pylonGradient.addColorStop(1, "#293340");

  [
    { x: -13, y: -18 },
    { x: 13, y: -18 },
    { x: -13, y: -5 },
    { x: 13, y: -5 }
  ].forEach(({ x, y }, idx) => {
    context.fillStyle = "rgba(8,12,18,0.28)";
    context.beginPath();
    context.roundRect(x - 5, y - 9, 10, 18, 3.5);
    context.fill();

    context.fillStyle = pylonGradient;
    context.beginPath();
    context.roundRect(x - 4.2, y - 8.5, 8.4, 17, 3.2);
    context.fill();
    context.strokeStyle = "rgba(233,241,246,0.17)";
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = "rgba(255,255,255,0.88)";
    context.beginPath();
    context.roundRect(x - 3.1, y - 7.2, 6.2, 5.8, 1.8);
    context.fill();

    const meterHeight = Math.max(1.5, 9.2 * charge);
    context.fillStyle = `rgba(99,224,255,${0.22 + charge * 0.54})`;
    context.beginPath();
    context.roundRect(x - 1.4, y + 5.6 - meterHeight, 2.8, meterHeight, 1.1);
    context.fill();
  });

  context.strokeStyle = `rgba(112,234,255,${0.12 + charge * 0.38})`;
  context.lineWidth = 1.8;
  [[-7, -24], [7, -24], [-7, -12], [7, -12]].forEach(([x, y]) => {
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x * 0.55, y - 4);
    context.lineTo(0, -30);
    context.lineTo(0, -37);
    context.stroke();
  });

  const orbGlow = context.createRadialGradient(-2, -38, 2, 0, -37, 14 + charge * 5 + cooling * 2);
  orbGlow.addColorStop(0, "rgba(255,255,255,0.99)");
  orbGlow.addColorStop(0.26, overheated ? "rgba(255,203,120,0.98)" : "rgba(138,241,255,0.98)");
  orbGlow.addColorStop(0.72, overheated ? "rgba(255,115,44,0.82)" : "rgba(46,137,226,0.76)");
  orbGlow.addColorStop(1, overheated ? "rgba(70,18,8,0.12)" : "rgba(15,31,53,0.08)");
  context.fillStyle = orbGlow;
  context.shadowColor = overheated ? "rgba(255,120,54,0.98)" : (tower.arcActive ? "rgba(69,214,255,0.98)" : "rgba(69,214,255,0.84)");
  context.shadowBlur = 12 + charge * 18 + cooling * 6;
  context.beginPath();
  context.arc(0, -37, 4.8 + charge * 6.2 + pulse * 0.55, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  if (charge > 0.04) {
    context.strokeStyle = `rgba(181,247,255,${0.24 + charge * 0.42})`;
    context.lineWidth = 1.3;
    for (let arc = 0; arc < 3; arc += 1) {
      const angle = now * 0.0017 + arc * 2.08;
      context.beginPath();
      context.arc(0, -37, 11.5 + arc * 3.2 + charge * 1.8, angle, angle + 0.95);
      context.stroke();
    }
  }

  if (cooling > 0.04) {
    context.strokeStyle = overheated ? `rgba(255,146,82,${0.32 + cooling * 0.34})` : `rgba(255,192,98,${0.18 + cooling * 0.28})`;
    context.lineWidth = overheated ? 2 : 1.2;
    context.beginPath();
    context.arc(0, -37, 16 + cooling * 4, Math.PI * 0.25, Math.PI * 1.75);
    context.stroke();
  }

  if (overheated) {
    context.strokeStyle = `rgba(255,106,62,${0.36 + pulse * 0.28})`;
    context.lineWidth = 1.7;
    context.setLineDash([5, 4]);
    context.beginPath();
    context.arc(0, -37, 20 + cooling * 5, now * 0.004, now * 0.004 + Math.PI * 1.6);
    context.stroke();
    context.setLineDash([]);
    for (let vent = 0; vent < 3; vent += 1) {
      const drift = Math.sin(now * 0.003 + vent) * 2.2;
      context.strokeStyle = `rgba(255,188,130,${0.16 + cooling * 0.16})`;
      context.lineWidth = 1.1;
      context.beginPath();
      context.moveTo(-6 + vent * 6, -47 + vent * 2);
      context.quadraticCurveTo(-4 + vent * 6 + drift, -56 - vent * 3, -2 + vent * 6, -64 - vent * 4);
      context.stroke();
    }
  }

  if (tower.arcActive) {
    context.strokeStyle = `rgba(215,252,255,${0.44 + pulse * 0.18})`;
    context.lineWidth = 1.6;
    const sparkTime = now * 0.02;
    for (let spark = 0; spark < 4; spark += 1) {
      const angle = sparkTime + spark * Math.PI * 0.5;
      const x1 = Math.cos(angle) * 8;
      const y1 = -37 + Math.sin(angle) * 8;
      const x2 = Math.cos(angle + 0.45) * 14;
      const y2 = -37 + Math.sin(angle + 0.45) * 14;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.lineTo(x2 - Math.sin(angle) * 4, y2 + Math.cos(angle) * 4);
      context.stroke();
    }
  }
}

function drawCannonTowerModel(tower, definition) {
  const recoil = tower.recoils[0] || 0;

  context.fillStyle = "rgba(12,15,22,0.44)";
  context.beginPath();
  context.ellipse(0, 18, 31, 18, 0, 0, Math.PI * 2);
  context.fill();

  const baseGradient = context.createLinearGradient(-23, -11, 24, 30);
  baseGradient.addColorStop(0, "#c1c8d0");
  baseGradient.addColorStop(0.24, "#788391");
  baseGradient.addColorStop(0.66, "#38404a");
  baseGradient.addColorStop(1, "#20262f");
  drawPlasmaSquareBase(0, 11, 22, 20, baseGradient, "rgba(255,183,70,0.22)");

  context.fillStyle = "rgba(19,25,33,0.94)";
  context.beginPath();
  context.roundRect(-15, 18, 30, 8, 3);
  context.fill();
  context.fillStyle = "rgba(255,176,59,0.74)";
  context.shadowColor = "rgba(255,162,40,0.7)";
  context.shadowBlur = 5;
  context.beginPath();
  context.roundRect(-8, 20.5, 16, 2.5, 1.2);
  context.fill();
  context.shadowBlur = 0;

  const ringGradient = context.createRadialGradient(-4, -2, 2, 0, 1, 22);
  ringGradient.addColorStop(0, "#808a95");
  ringGradient.addColorStop(0.48, "#414850");
  ringGradient.addColorStop(1, "#1d2228");
  context.fillStyle = "rgba(10,14,20,0.5)";
  context.beginPath();
  context.ellipse(0, 6, 21, 12, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = ringGradient;
  context.beginPath();
  context.ellipse(0, 2, 19, 11, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(232,236,238,0.15)";
  context.lineWidth = 1.5;
  context.stroke();

  const pylonGradient = context.createLinearGradient(-8, -16, 8, 12);
  pylonGradient.addColorStop(0, "#d9dee4");
  pylonGradient.addColorStop(0.28, "#9098a1");
  pylonGradient.addColorStop(0.72, "#49505a");
  pylonGradient.addColorStop(1, "#282d33");
  [
    { x: -11, y: -13 },
    { x: 11, y: -13 },
    { x: -11, y: 0 },
    { x: 11, y: 0 }
  ].forEach(({ x, y }) => {
    context.fillStyle = pylonGradient;
    context.beginPath();
    context.roundRect(x - 3.7, y - 7.5, 7.4, 15, 3);
    context.fill();
    context.strokeStyle = "rgba(238,240,242,0.14)";
    context.stroke();
    context.fillStyle = "rgba(255,177,59,0.62)";
    context.beginPath();
    context.roundRect(x - 1.3, y - 0.4, 2.6, 4.7, 1);
    context.fill();
  });

  const bodyGradient = context.createLinearGradient(-16, -26, 16, 14);
  bodyGradient.addColorStop(0, "#e1e6eb");
  bodyGradient.addColorStop(0.24, "#9aa2ab");
  bodyGradient.addColorStop(0.62, "#525a64");
  bodyGradient.addColorStop(1, "#2a3036");
  context.fillStyle = bodyGradient;
  context.beginPath();
  context.moveTo(-12, -18);
  context.lineTo(12, -18);
  context.lineTo(18, -8);
  context.lineTo(18, 5);
  context.lineTo(12, 14);
  context.lineTo(-12, 14);
  context.lineTo(-18, 5);
  context.lineTo(-18, -8);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(238,240,242,0.15)";
  context.stroke();

  context.strokeStyle = "rgba(20,24,29,0.35)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, -16);
  context.lineTo(0, 12);
  context.moveTo(-10, -4);
  context.lineTo(10, -4);
  context.moveTo(-10, 4);
  context.lineTo(10, 4);
  context.stroke();

  context.fillStyle = "rgba(20,24,29,0.94)";
  context.beginPath();
  context.roundRect(-9, -21.5, 18, 7.5, 3);
  context.fill();
  context.fillStyle = "rgba(255,176,55,0.62)";
  context.beginPath();
  context.roundRect(-4.5, -18.7, 9, 2.5, 1);
  context.roundRect(-4.5, 9.2, 9, 2.5, 1);
  context.fill();

  const barrelBaseX = -11 - recoil * 8;
  const barrelGradient = context.createLinearGradient(barrelBaseX, -12, barrelBaseX + 56, 12);
  barrelGradient.addColorStop(0, "#d3d8de");
  barrelGradient.addColorStop(0.22, "#949ba4");
  barrelGradient.addColorStop(0.62, "#4a5058");
  barrelGradient.addColorStop(1, "#24292e");
  context.fillStyle = barrelGradient;
  context.beginPath();
  context.roundRect(barrelBaseX, -11.5, 54, 23, 8.5);
  context.fill();
  context.strokeStyle = "rgba(238,240,242,0.16)";
  context.stroke();

  context.fillStyle = "rgba(28,33,39,0.96)";
  context.beginPath();
  context.roundRect(barrelBaseX + 7, -13.5, 12, 27, 4);
  context.fill();
  context.beginPath();
  context.roundRect(barrelBaseX + 26.5, -10, 8.5, 20, 3.4);
  context.fill();

  context.fillStyle = "rgba(255,177,59,0.82)";
  context.beginPath();
  context.roundRect(barrelBaseX + 10.3, -6.2, 5.8, 12.4, 2);
  context.roundRect(barrelBaseX + 28.6, -4.6, 3.9, 9.2, 1.6);
  context.fill();

  context.strokeStyle = "rgba(255,194,109,0.34)";
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(barrelBaseX + 16.5, -7.2);
  context.lineTo(barrelBaseX + 40.5, -7.2);
  context.moveTo(barrelBaseX + 16.5, 7.2);
  context.lineTo(barrelBaseX + 40.5, 7.2);
  context.stroke();

  context.fillStyle = "rgba(16,19,23,0.98)";
  context.beginPath();
  context.arc(barrelBaseX + 53, 0, 10.4, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(255,184,72,0.68)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(barrelBaseX + 53, 0, 7.1, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "rgba(255,182,70,0.24)";
  context.beginPath();
  context.arc(barrelBaseX + 53, 0, 5, 0, Math.PI * 2);
  context.fill();
}

function drawSniperTowerModel(tower, definition) {
  // Dark pastel minimalist sci-fi sniper tower based on the supplied concept.
  // The base remains compact while the single long rail barrel gives it a clear boss-killer silhouette.
  context.fillStyle = "rgba(12,15,22,0.44)";
  context.beginPath();
  context.ellipse(0, 18, 29, 17, 0, 0, Math.PI * 2);
  context.fill();

  const baseGradient = context.createLinearGradient(-23, -11, 24, 30);
  baseGradient.addColorStop(0, "#b2bac5");
  baseGradient.addColorStop(0.26, "#687382");
  baseGradient.addColorStop(0.66, "#343d4a");
  baseGradient.addColorStop(1, "#1f2731");
  drawPlasmaSquareBase(0, 11, 21, 19, baseGradient, "rgba(112,197,225,0.2)");

  // Lower armored front panels and shared cyan light language.
  context.fillStyle = "rgba(19,25,33,0.92)";
  context.beginPath();
  context.roundRect(-15, 18, 30, 8, 3);
  context.fill();
  context.fillStyle = "rgba(99,217,255,0.68)";
  context.shadowColor = "rgba(99,217,255,0.58)";
  context.shadowBlur = 5;
  context.beginPath();
  context.roundRect(-8, 20.5, 16, 2.5, 1.2);
  context.fill();
  context.shadowBlur = 0;

  // Circular rotation platform centered exactly on the square base.
  const ringGradient = context.createRadialGradient(-4, -2, 2, 0, 1, 22);
  ringGradient.addColorStop(0, "#737f8e");
  ringGradient.addColorStop(0.48, "#3d4755");
  ringGradient.addColorStop(1, "#1b222c");
  context.fillStyle = "rgba(10,14,20,0.5)";
  context.beginPath();
  context.ellipse(0, 6, 22, 13, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = ringGradient;
  context.beginPath();
  context.ellipse(0, 2, 20, 12, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(194,224,235,0.18)";
  context.lineWidth = 1.5;
  context.stroke();

  context.fillStyle = "rgba(17,22,30,0.95)";
  context.beginPath();
  context.roundRect(-10, -10, 20, 16, 4);
  context.fill();

  // Two support arms hold the heavy rail assembly.
  const armGradient = context.createLinearGradient(-13, -16, 15, 11);
  armGradient.addColorStop(0, "#9ba6b3");
  armGradient.addColorStop(0.42, "#566271");
  armGradient.addColorStop(1, "#28313d");
  [-1, 1].forEach(side => {
    context.save();
    context.translate(-2, side * 9);
    context.fillStyle = "rgba(10,14,20,0.38)";
    context.beginPath();
    context.roundRect(-10, -5, 24, 10, 3);
    context.fill();
    context.fillStyle = armGradient;
    context.beginPath();
    context.moveTo(-9, -4);
    context.lineTo(8, -4);
    context.lineTo(14, 0);
    context.lineTo(8, 4);
    context.lineTo(-9, 4);
    context.closePath();
    context.fill();
    context.strokeStyle = "rgba(209,226,235,0.14)";
    context.lineWidth = 1;
    context.stroke();
    context.restore();
  });

  // Centered hard-surface gun body.
  const bodyGradient = context.createLinearGradient(-18, -15, 28, 14);
  bodyGradient.addColorStop(0, "#c2c9d2");
  bodyGradient.addColorStop(0.27, "#818b98");
  bodyGradient.addColorStop(0.62, "#46515f");
  bodyGradient.addColorStop(1, "#252d38");
  context.fillStyle = "rgba(8,12,18,0.42)";
  context.beginPath();
  context.roundRect(-19, -14, 49, 28, 7);
  context.fill();
  context.fillStyle = bodyGradient;
  context.beginPath();
  context.moveTo(-17, -12);
  context.lineTo(19, -12);
  context.lineTo(29, -6);
  context.lineTo(29, 7);
  context.lineTo(18, 12);
  context.lineTo(-17, 11);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(220,232,239,0.16)";
  context.lineWidth = 1.4;
  context.stroke();

  // Dark top armor and small amber construction marking.
  context.fillStyle = "rgba(28,34,43,0.95)";
  context.beginPath();
  context.roundRect(-10, -13, 22, 7, 2.5);
  context.fill();
  context.fillStyle = "rgba(242,188,100,0.62)";
  context.beginPath();
  context.moveTo(11, -6);
  context.lineTo(16, -3);
  context.lineTo(11, 0);
  context.closePath();
  context.fill();

  // Cyan targeting cell in the center of the weapon block.
  context.fillStyle = "rgba(15,25,34,0.94)";
  context.beginPath();
  context.roundRect(2, -6, 15, 12, 3);
  context.fill();
  context.fillStyle = "rgba(99,217,255,0.86)";
  context.shadowColor = "rgba(99,217,255,0.72)";
  context.shadowBlur = 6;
  context.beginPath();
  context.roundRect(5, -3.5, 9, 7, 2);
  context.fill();
  context.shadowBlur = 0;

  // One long rail barrel. Its start and muzzle match gameplay targeting coordinates.
  const barrel = definition.barrels[0];
  const recoil = tower.recoils[0] || 0;
  const recoilDistance = recoil * 12;
  const barrelX = barrel.forward - recoilDistance;
  const barrelY = -barrel.width / 2;

  context.fillStyle = "rgba(8,12,18,0.42)";
  context.beginPath();
  context.roundRect(barrelX - 5, barrelY - 2, barrel.length + 9, barrel.width + 4, 4);
  context.fill();

  const barrelGradient = context.createLinearGradient(barrelX, barrelY, barrelX + barrel.length, barrelY + barrel.width);
  barrelGradient.addColorStop(0, "#586574");
  barrelGradient.addColorStop(0.38, "#303a47");
  barrelGradient.addColorStop(1, "#151c25");
  context.fillStyle = barrelGradient;
  context.beginPath();
  context.roundRect(barrelX - 2, barrelY, barrel.length + 2, barrel.width, 3);
  context.fill();

  // Center rail channel. The dim line is always readable, while the bright blue charge
  // travels from the weapon block toward the muzzle immediately before each shot.
  const railStartX = barrelX + 7;
  const railLength = Math.max(10, barrel.length - 16);
  const railY = -1.6;
  context.fillStyle = "rgba(8,18,26,0.82)";
  context.beginPath();
  context.roundRect(railStartX, railY, railLength, 3.2, 1.6);
  context.fill();
  context.fillStyle = "rgba(99,217,255,0.2)";
  context.beginPath();
  context.roundRect(railStartX + 1, railY + 0.65, railLength - 2, 1.9, 0.95);
  context.fill();

  const chargeProgress = clamp(tower.chargeProgress || 0, 0, 1);
  if (chargeProgress > 0) {
    const chargedLength = Math.max(2, (railLength - 2) * chargeProgress);
    const chargePulse = 0.82 + Math.sin(performance.now() * 0.022) * 0.18;
    context.save();
    context.shadowColor = "rgba(99,217,255,0.95)";
    context.shadowBlur = 5 + chargeProgress * 8;
    context.fillStyle = `rgba(99,217,255,${0.62 + chargeProgress * 0.34})`;
    context.beginPath();
    context.roundRect(railStartX + 1, railY + 0.55, chargedLength, 2.1 * chargePulse, 1.05);
    context.fill();

    // A small moving energy front makes the charging direction obvious.
    const frontX = railStartX + chargedLength;
    context.fillStyle = "rgba(215,248,255,0.95)";
    context.beginPath();
    context.arc(frontX, 0, 1.4 + chargeProgress * 1.2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  // Segmented rail casing and heavy muzzle brake.
  context.strokeStyle = "rgba(205,220,229,0.14)";
  context.lineWidth = 1;
  [15, 30, 45].forEach(offset => {
    context.beginPath();
    context.moveTo(barrelX + offset, barrelY + 1);
    context.lineTo(barrelX + offset - 2, barrelY + barrel.width - 1);
    context.stroke();
  });
  const muzzleX = barrelX + barrel.length;
  // Compact conventional muzzle brake with a dark opening instead of the old blue circle.
  const muzzleGradient = context.createLinearGradient(muzzleX - 5, -6, muzzleX + 7, 6);
  muzzleGradient.addColorStop(0, "#697685");
  muzzleGradient.addColorStop(0.42, "#333d49");
  muzzleGradient.addColorStop(1, "#161d26");
  context.fillStyle = muzzleGradient;
  context.beginPath();
  context.moveTo(muzzleX - 5, -6);
  context.lineTo(muzzleX + 5, -5);
  context.lineTo(muzzleX + 7, -3);
  context.lineTo(muzzleX + 7, 3);
  context.lineTo(muzzleX + 5, 5);
  context.lineTo(muzzleX - 5, 6);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(205,220,229,0.2)";
  context.lineWidth = 1;
  context.stroke();
  context.fillStyle = "rgba(4,8,12,0.96)";
  context.beginPath();
  context.roundRect(muzzleX + 2, -2.2, 5.5, 4.4, 1.3);
  context.fill();
  context.strokeStyle = "rgba(133,149,163,0.28)";
  context.stroke();

  if ((tower.weakTimer || 0) > 0) {
    context.strokeStyle = "rgba(217,95,99,0.7)";
    context.lineWidth = 3;
    context.setLineDash([5, 4]);
    context.beginPath();
    context.arc(0, 0, 35, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  }
}

function drawPlasmaCannonModel(tower, definition) {
  context.fillStyle = "rgba(12,15,22,0.42)";
  context.beginPath();
  context.ellipse(0, 10, 25, 16, 0, 0, Math.PI * 2);
  context.fill();

  // The foundation, rotating mount and twin-barrel block now share the same exact center: (0, 0).
  const baseGradient = context.createLinearGradient(-20, -18, 20, 18);
  baseGradient.addColorStop(0, "#d8dde5");
  baseGradient.addColorStop(0.22, "#7b8390");
  baseGradient.addColorStop(0.68, "#363d4a");
  baseGradient.addColorStop(1, "#202530");
  drawPlasmaSquareBase(0, 0, 18, 18, baseGradient, "rgba(246,225,189,0.2)");

  context.fillStyle = "rgba(18,22,30,0.82)";
  context.beginPath();
  context.roundRect(-11, -6, 22, 14, 4);
  context.fill();

  const middleGradient = context.createLinearGradient(-12, -16, 12, 6);
  middleGradient.addColorStop(0, "#c9d0d9");
  middleGradient.addColorStop(0.38, "#6d7685");
  middleGradient.addColorStop(1, "#2b313e");
  context.fillStyle = middleGradient;
  context.beginPath();
  context.roundRect(-10, -13, 20, 11, 3);
  context.fill();
  context.strokeStyle = "rgba(117,207,255,0.2)";
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = "rgba(117,207,255,0.82)";
  context.beginPath();
  context.moveTo(-4, -9);
  context.lineTo(4, -9);
  context.lineTo(0, -4);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(242,188,100,0.7)";
  context.fillRect(-13, 22, 6, 2.5);
  context.fillRect(7, 22, 6, 2.5);

  // The entire weapon block is centered on the square foundation.
  const gunMountX = 0;
  const saddleGradient = context.createLinearGradient(-18, -16, 18, 14);
  saddleGradient.addColorStop(0, "#d4d9e0");
  saddleGradient.addColorStop(0.42, "#6f7886");
  saddleGradient.addColorStop(1, "#252b37");
  context.fillStyle = "rgba(12,15,22,0.34)";
  context.beginPath();
  context.roundRect(-18, -13, 36, 26, 5);
  context.fill();
  context.fillStyle = saddleGradient;
  context.beginPath();
  context.roundRect(-16, -11, 32, 22, 5);
  context.fill();
  context.strokeStyle = "rgba(117,207,255,0.18)";
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(-13, 0);
  context.lineTo(13, 0);
  context.stroke();

  // Explicitly symmetric barrel lanes prevent the two cannons from appearing crooked.
  definition.barrels.forEach((barrel, index) => {
    const recoil = tower.recoils[index] || 0;
    const recoilDistance = recoil * 12;
    const barrelCenterY = index === 0 ? -5 : 5;
    const barrelX = barrel.forward - recoilDistance;
    const barrelY = barrelCenterY - barrel.width / 2;
    const housingX = -14 - recoilDistance * 0.25;
    const housingY = barrelCenterY - 7;

    const housingGradient = context.createLinearGradient(housingX, housingY, housingX + 30, housingY + 14);
    housingGradient.addColorStop(0, "#d9dfe6");
    housingGradient.addColorStop(0.48, "#7d8592");
    housingGradient.addColorStop(1, "#3a404d");
    context.fillStyle = "rgba(12,15,22,0.34)";
    context.beginPath();
    context.roundRect(housingX - 2, housingY + 2, 32, 16, 4);
    context.fill();
    context.fillStyle = housingGradient;
    context.beginPath();
    context.roundRect(housingX, housingY, 30, 14, 4);
    context.fill();

    const barrelGradient = context.createLinearGradient(barrelX, barrelY, barrelX + barrel.length, barrelY);
    barrelGradient.addColorStop(0, "#444b58");
    barrelGradient.addColorStop(0.45, "#252b36");
    barrelGradient.addColorStop(1, "#151923");
    context.fillStyle = barrelGradient;
    context.beginPath();
    context.roundRect(barrelX, barrelY, barrel.length, barrel.width, 3);
    context.fill();

    // Energy strips run through the exact vertical middle of each barrel.
    const energyStripY = barrelCenterY;
    context.fillStyle = "rgba(117,207,255,0.22)";
    context.beginPath();
    context.roundRect(barrelX + 6, energyStripY - 1.8, barrel.length - 14, 3.6, 2);
    context.fill();
    context.fillStyle = "rgba(117,207,255,0.92)";
    context.beginPath();
    context.roundRect(barrelX + 8, energyStripY - 0.65, barrel.length - 18, 1.3, 1);
    context.fill();

    context.strokeStyle = "rgba(216,221,229,0.18)";
    context.lineWidth = 1;
    [10, 20, 30].forEach(offset => {
      context.beginPath();
      context.moveTo(barrelX + offset, barrelY + 1);
      context.lineTo(barrelX + offset - 2, barrelY + barrel.width - 1);
      context.stroke();
    });

    const muzzleX = barrelX + barrel.length;
    context.fillStyle = "rgba(18,22,30,0.96)";
    context.beginPath();
    context.roundRect(muzzleX - 2, barrelCenterY - 4, 6, 8, 2);
    context.fill();
  });

  // Center cap visually locks the twin assembly to the middle of the platform.
  context.fillStyle = "rgba(29,35,45,0.96)";
  context.beginPath();
  context.roundRect(-12, -5, 24, 10, 3);
  context.fill();
  context.fillStyle = "rgba(117,207,255,0.3)";
  context.beginPath();
  context.roundRect(-8, -1.3, 16, 2.6, 1.3);
  context.fill();
}

function drawPlasmaSquareBase(centerX, centerY, radiusX, radiusY, fillStyle, strokeStyle) {
  context.fillStyle = fillStyle;
  context.strokeStyle = strokeStyle;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX - radiusX * 0.7, centerY - radiusY);
  context.lineTo(centerX + radiusX * 0.7, centerY - radiusY);
  context.lineTo(centerX + radiusX, centerY - radiusY * 0.7);
  context.lineTo(centerX + radiusX, centerY + radiusY * 0.62);
  context.lineTo(centerX + radiusX * 0.62, centerY + radiusY);
  context.lineTo(centerX - radiusX * 0.62, centerY + radiusY);
  context.lineTo(centerX - radiusX, centerY + radiusY * 0.62);
  context.lineTo(centerX - radiusX, centerY - radiusY * 0.7);
  context.closePath();
  context.fill();
  context.stroke();

  context.strokeStyle = "rgba(246,225,189,0.13)";
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(centerX - radiusX * 0.62, centerY + radiusY * 0.68);
  context.lineTo(centerX + radiusX * 0.62, centerY + radiusY * 0.68);
  context.stroke();
}

function drawPlasmaMiddleBlock(centerX, centerY, radiusX, radiusY, fillStyle, strokeStyle) {
  context.fillStyle = fillStyle;
  context.strokeStyle = strokeStyle;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX - radiusX * 0.58, centerY - radiusY);
  context.lineTo(centerX + radiusX * 0.58, centerY - radiusY);
  context.lineTo(centerX + radiusX, centerY - radiusY * 0.35);
  context.lineTo(centerX + radiusX * 0.82, centerY + radiusY * 0.72);
  context.lineTo(centerX + radiusX * 0.32, centerY + radiusY);
  context.lineTo(centerX - radiusX * 0.32, centerY + radiusY);
  context.lineTo(centerX - radiusX * 0.82, centerY + radiusY * 0.72);
  context.lineTo(centerX - radiusX, centerY - radiusY * 0.35);
  context.closePath();
  context.fill();
  context.stroke();
}

function drawPlasmaOctagon(centerX, centerY, radiusX, radiusY, fillStyle, strokeStyle) {
  context.fillStyle = fillStyle;
  context.strokeStyle = strokeStyle;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX - radiusX * 0.52, centerY - radiusY);
  context.lineTo(centerX + radiusX * 0.52, centerY - radiusY);
  context.lineTo(centerX + radiusX, centerY - radiusY * 0.48);
  context.lineTo(centerX + radiusX, centerY + radiusY * 0.48);
  context.lineTo(centerX + radiusX * 0.52, centerY + radiusY);
  context.lineTo(centerX - radiusX * 0.52, centerY + radiusY);
  context.lineTo(centerX - radiusX, centerY + radiusY * 0.48);
  context.lineTo(centerX - radiusX, centerY - radiusY * 0.48);
  context.closePath();
  context.fill();
  context.stroke();
}

function drawPlasmaBeveledBase(centerX, centerY, radiusX, radiusY, fillStyle, strokeStyle) {
  context.fillStyle = fillStyle;
  context.strokeStyle = strokeStyle;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX - radiusX * 0.5, centerY - radiusY);
  context.lineTo(centerX + radiusX * 0.5, centerY - radiusY);
  context.lineTo(centerX + radiusX * 0.9, centerY - radiusY * 0.62);
  context.lineTo(centerX + radiusX, centerY - radiusY * 0.08);
  context.lineTo(centerX + radiusX * 0.78, centerY + radiusY * 0.66);
  context.lineTo(centerX + radiusX * 0.34, centerY + radiusY);
  context.lineTo(centerX - radiusX * 0.38, centerY + radiusY);
  context.lineTo(centerX - radiusX * 0.82, centerY + radiusY * 0.62);
  context.lineTo(centerX - radiusX, centerY - radiusY * 0.06);
  context.lineTo(centerX - radiusX * 0.9, centerY - radiusY * 0.64);
  context.closePath();
  context.fill();
  context.stroke();

  context.strokeStyle = "rgba(246,225,189,0.12)";
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(centerX - radiusX * 0.7, centerY + radiusY * 0.55);
  context.lineTo(centerX - radiusX * 0.26, centerY + radiusY * 0.76);
  context.lineTo(centerX + radiusX * 0.3, centerY + radiusY * 0.76);
  context.lineTo(centerX + radiusX * 0.72, centerY + radiusY * 0.5);
  context.stroke();
}

function drawRefineryModel(tower, definition) {
  context.save();
  context.translate(tower.x, tower.y);

  const time = performance.now() * 0.001;
  const active = state.screen === "game" && state.biomass > 0;
  const pulse = active ? 0.55 + Math.sin(time * 2.7) * 0.45 : 0.14;

  context.fillStyle = "rgba(12,15,22,0.4)";
  context.beginPath();
  context.ellipse(0, 20, 42, 18, 0, 0, Math.PI * 2);
  context.fill();

  const baseGradient = context.createLinearGradient(-36, -20, 36, 28);
  baseGradient.addColorStop(0, "#dee5ec");
  baseGradient.addColorStop(0.26, "#95a0ad");
  baseGradient.addColorStop(0.62, "#4a5561");
  baseGradient.addColorStop(1, "#232b35");
  drawPlasmaSquareBase(0, 11, 36, 23, baseGradient, "rgba(106,223,255,0.18)");

  context.fillStyle = "rgba(18,24,32,0.96)";
  context.beginPath();
  context.roundRect(-20, 19.2, 40, 6.7, 2.7);
  context.fill();
  context.fillStyle = `rgba(99,217,255,${0.14 + pulse * 0.16})`;
  context.beginPath();
  context.roundRect(-10.5, 21.2, 21, 2.1, 1);
  context.fill();

  const ringGradient = context.createRadialGradient(-4, -2, 2, 0, 2, 23);
  ringGradient.addColorStop(0, "#808b97");
  ringGradient.addColorStop(0.48, "#434e5a");
  ringGradient.addColorStop(1, "#1b232d");
  context.fillStyle = "rgba(10,14,20,0.5)";
  context.beginPath();
  context.ellipse(0, 6.8, 22.8, 12.2, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = ringGradient;
  context.beginPath();
  context.ellipse(0, 2.3, 20.8, 11.2, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(194,224,235,0.16)";
  context.lineWidth = 1.35;
  context.stroke();

  const armGradient = context.createLinearGradient(-20, -7, 20, 7);
  armGradient.addColorStop(0, "#cad3dd");
  armGradient.addColorStop(0.35, "#7d8997");
  armGradient.addColorStop(1, "#313a45");
  [-1, 1].forEach(side => {
    context.save();
    context.translate(-1, side * 9.5);
    context.fillStyle = armGradient;
    context.beginPath();
    context.moveTo(-13, -3.4);
    context.lineTo(8, -3.4);
    context.lineTo(12.5, 0);
    context.lineTo(8, 3.4);
    context.lineTo(-13, 3.4);
    context.closePath();
    context.fill();
    context.strokeStyle = "rgba(236,242,246,0.1)";
    context.stroke();
    context.restore();
  });

  const tankGradient = context.createLinearGradient(-38, -16, -8, 18);
  tankGradient.addColorStop(0, "#ecf1f5");
  tankGradient.addColorStop(0.28, "#acb7c2");
  tankGradient.addColorStop(0.68, "#596572");
  tankGradient.addColorStop(1, "#2b3440");
  context.fillStyle = tankGradient;
  context.beginPath();
  context.ellipse(-24, 0, 11.8, 14.5, 0.12, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(235,242,246,0.15)";
  context.stroke();

  context.fillStyle = "rgba(23,29,37,0.88)";
  context.beginPath();
  context.roundRect(-26.2, -5.5, 4.2, 11, 1.8);
  context.fill();
  context.beginPath();
  context.roundRect(-20.4, -5.5, 4.2, 11, 1.8);
  context.fill();
  context.fillStyle = `rgba(126,239,158,${0.18 + pulse * 0.2})`;
  context.beginPath();
  context.roundRect(-25.1, -2.5, 1.8, 5, 0.8);
  context.roundRect(-19.3, -2.5, 1.8, 5, 0.8);
  context.fill();

  const biomassGradient = context.createRadialGradient(-24.5, -2, 1, -24, 0, 10.5);
  biomassGradient.addColorStop(0, `rgba(241,255,244,${0.48 + pulse * 0.08})`);
  biomassGradient.addColorStop(0.35, `rgba(126,239,158,${0.32 + pulse * 0.12})`);
  biomassGradient.addColorStop(1, "rgba(28,80,40,0.08)");
  context.fillStyle = biomassGradient;
  context.beginPath();
  context.ellipse(-24, 0, 7.2, 9, 0.12, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = `rgba(223,255,232,${0.16 + pulse * 0.07})`;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(-28, -1.2);
  context.bezierCurveTo(-25, -6, -20, 2.2, -17.2, -1.4);
  context.stroke();

  const bodyGradient = context.createLinearGradient(-18, -18, 18, 18);
  bodyGradient.addColorStop(0, "#edf2f7");
  bodyGradient.addColorStop(0.26, "#b8c2cb");
  bodyGradient.addColorStop(0.62, "#64707d");
  bodyGradient.addColorStop(1, "#2b3440");
  context.fillStyle = bodyGradient;
  context.beginPath();
  context.moveTo(-15, -14);
  context.lineTo(9, -14);
  context.lineTo(20, -8);
  context.lineTo(23, 1);
  context.lineTo(22, 10);
  context.lineTo(13, 15);
  context.lineTo(-15, 13);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(236,242,246,0.16)";
  context.stroke();

  context.strokeStyle = "rgba(26,31,38,0.35)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(-6, -12);
  context.lineTo(-6, 12);
  context.moveTo(4, -13);
  context.lineTo(4, 13);
  context.stroke();
  context.beginPath();
  context.moveTo(-12, -4);
  context.lineTo(18, -4);
  context.moveTo(-12, 4);
  context.lineTo(18, 4);
  context.stroke();

  context.fillStyle = "rgba(24,31,39,0.96)";
  context.beginPath();
  context.roundRect(-8.2, -14.6, 19.4, 6.4, 2.1);
  context.fill();
  context.fillStyle = "rgba(242,188,100,0.56)";
  context.beginPath();
  context.moveTo(10.3, -8.2);
  context.lineTo(15.2, -5.5);
  context.lineTo(10.3, -2.8);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(16,23,31,0.94)";
  context.beginPath();
  context.roundRect(-3.5, -1.8, 8, 3.8, 1.2);
  context.fill();
  context.shadowColor = "rgba(99,217,255,0.6)";
  context.shadowBlur = 5;
  context.fillStyle = `rgba(99,217,255,${0.26 + pulse * 0.18})`;
  context.beginPath();
  context.roundRect(-2.5, -1.1, 6, 2.3, 0.9);
  context.fill();
  context.shadowBlur = 0;

  const housingGradient = context.createLinearGradient(10, -14, 36, 14);
  housingGradient.addColorStop(0, "#edf2f6");
  housingGradient.addColorStop(0.26, "#b7c1ca");
  housingGradient.addColorStop(0.62, "#64707d");
  housingGradient.addColorStop(1, "#2b3440");
  context.fillStyle = housingGradient;
  context.beginPath();
  context.moveTo(11, -11);
  context.lineTo(25, -11);
  context.lineTo(33, -4);
  context.lineTo(33, 8.5);
  context.lineTo(22, 15);
  context.lineTo(11, 13);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(236,242,246,0.16)";
  context.stroke();

  context.fillStyle = "rgba(21,27,35,0.96)";
  context.beginPath();
  context.roundRect(14.4, -13.8, 5.3, 17.4, 2.1);
  context.roundRect(23.8, -11.9, 5.2, 15.2, 2.1);
  context.fill();
  context.fillStyle = `rgba(99,217,255,${0.14 + pulse * 0.1})`;
  context.beginPath();
  context.roundRect(18.1, -5.2, 6.8, 2.1, 1);
  context.roundRect(18.1, 3.4, 6.8, 2.1, 1);
  context.fill();

  context.fillStyle = "rgba(18,24,32,0.96)";
  context.beginPath();
  context.roundRect(12.5, 7.8, 16, 4.4, 1.8);
  context.fill();
  context.fillStyle = "rgba(242,188,100,0.42)";
  for (let fin = 0; fin < 3; fin += 1) {
    context.beginPath();
    context.moveTo(15.2 + fin * 4.2, 8.2);
    context.lineTo(17.2 + fin * 4.2, 11.2);
    context.lineTo(13.2 + fin * 4.2, 11.2);
    context.closePath();
    context.fill();
  }

  context.fillStyle = "rgba(15,24,32,0.96)";
  context.beginPath();
  context.roundRect(1.8, -5.5, 13.2, 10.1, 2.5);
  context.fill();
  context.shadowColor = "rgba(118,255,132,0.68)";
  context.shadowBlur = active ? 8 : 3;
  context.fillStyle = `rgba(118,255,132,${0.34 + pulse * 0.18})`;
  context.beginPath();
  context.roundRect(4.8, -1.6, 7.5, 3.8, 1.3);
  context.fill();
  context.shadowBlur = 0;

  if (active) {
    [17.3, 26.5].forEach((sx, idx) => {
      for (let puff = 0; puff < 2; puff += 1) {
        const phase = (time * 0.72 + idx * 0.17 + puff * 0.31) % 1;
        context.save();
        context.globalAlpha = 0.11 * (1 - phase);
        context.fillStyle = "rgba(220,240,238,0.92)";
        context.beginPath();
        context.ellipse(sx + Math.sin(time * 1.35 + puff + idx) * 1.8 + phase * 2, -14 + idx * 1.8 - phase * 11.4, 2.8 + phase * 2.4, 4 + phase * 3, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
    });
  }

  context.restore();
}

function drawEnemies() {
  state.enemies.forEach(enemy => {
    const pulse = 0.5 + Math.sin(performance.now() / 170 + enemy.progress * 20) * 0.5;
    const accent = enemy.accent || "#f39752";

    context.save();
    context.translate(enemy.pos.x, enemy.pos.y);

    context.fillStyle = "rgba(12,15,22,0.48)";
    context.beginPath();
    context.ellipse(-3, enemy.radius * 0.9, enemy.radius * 1.35, enemy.radius * 0.55, 0, 0, Math.PI * 2);
    context.fill();

    const shielded = state.enemies.some(other => other !== enemy && other.shieldAura && distance(other.pos, enemy.pos) <= other.shieldAura);
    if (shielded) {
      context.strokeStyle = "rgba(159,215,255,0.36)";
      context.lineWidth = 2;
      context.beginPath();
      context.arc(0, 0, enemy.radius * 1.55, 0, Math.PI * 2);
      context.stroke();
    }

    if (enemy.weakensTowers) {
      const affected = state.towers.filter(tower => towerDefinitions[tower.id]?.kind !== "infrastructure" && distance(tower, enemy.pos) <= 130);
      affected.slice(0, 3).forEach(tower => {
        context.save();
        context.globalAlpha = 0.24 + pulse * 0.18;
        context.strokeStyle = hexToRgba(enemy.accent || "#bfe9f2", 0.65);
        context.lineWidth = 1.6;
        context.setLineDash([4, 5]);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(tower.x - enemy.pos.x, tower.y - enemy.pos.y);
        context.stroke();
        context.setLineDash([]);
        context.restore();
      });
    }

    if (enemy.burrower && Math.sin(enemy.phaseTimer * 3.4 + enemy.progress * 24) > 0.72) {
      context.strokeStyle = hexToRgba(accent, 0.45 + pulse * 0.25);
      context.lineWidth = 3;
      context.beginPath();
      context.ellipse(0, enemy.radius * 0.4, enemy.radius * 2.0, enemy.radius * 0.55, 0, 0, Math.PI * 2);
      context.stroke();
    }

    const gradient = context.createRadialGradient(-enemy.radius * 0.25, -enemy.radius * 0.35, 2, 0, 0, enemy.radius * 1.45);
    gradient.addColorStop(0, "rgba(246,225,189,0.72)");
    gradient.addColorStop(0.38, enemy.color);
    gradient.addColorStop(1, "#1a1218");

    context.fillStyle = gradient;
    context.strokeStyle = "rgba(246,225,189,0.25)";
    context.lineWidth = 2;

    if (enemy.flying) {
      const bob = Math.sin(performance.now() * 0.007 + enemy.progress * 28) * 3;
      context.translate(0, -10 + bob);
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(0, -enemy.radius * 1.05);
      context.lineTo(enemy.radius * 1.35, -enemy.radius * 0.15);
      context.lineTo(enemy.radius * 0.72, enemy.radius * 0.45);
      context.lineTo(enemy.radius * 0.2, enemy.radius * 0.18);
      context.lineTo(0, enemy.radius * 0.78);
      context.lineTo(-enemy.radius * 0.2, enemy.radius * 0.18);
      context.lineTo(-enemy.radius * 0.72, enemy.radius * 0.45);
      context.lineTo(-enemy.radius * 1.35, -enemy.radius * 0.15);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = hexToRgba(accent, 0.42 + pulse * 0.25);
      context.beginPath();
      context.ellipse(-enemy.radius * 0.78, -enemy.radius * 0.08, enemy.radius * 0.58, enemy.radius * 0.22, -0.28, 0, Math.PI * 2);
      context.ellipse(enemy.radius * 0.78, -enemy.radius * 0.08, enemy.radius * 0.58, enemy.radius * 0.22, 0.28, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = hexToRgba(accent, 0.78);
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-enemy.radius * 0.22, enemy.radius * 0.2);
      context.lineTo(0, enemy.radius * 1.15);
      context.lineTo(enemy.radius * 0.22, enemy.radius * 0.2);
      context.stroke();
    } else if (enemy.shape === "crawler") {
      context.beginPath();
      context.ellipse(0, 0, enemy.radius * 1.34, enemy.radius * 0.78, 0.12, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      // No legs or dangling appendages: the crawler reads as a fast floating bio-pod.
      context.fillStyle = hexToRgba(accent, 0.34 + pulse * 0.22);
      context.beginPath();
      context.ellipse(-enemy.radius * 0.62, 0, enemy.radius * 0.34, enemy.radius * 0.2, -0.18, 0, Math.PI * 2);
      context.ellipse(enemy.radius * 0.62, 0, enemy.radius * 0.34, enemy.radius * 0.2, 0.18, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = hexToRgba(accent, 0.55);
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-enemy.radius * 0.82, 0);
      context.lineTo(enemy.radius * 0.82, 0);
      context.moveTo(-enemy.radius * 0.42, -enemy.radius * 0.42);
      context.lineTo(enemy.radius * 0.42, enemy.radius * 0.42);
      context.stroke();
    } else if (enemy.shape === "brute") {
      context.beginPath();
      context.roundRect(-enemy.radius * 0.95, -enemy.radius * 0.78, enemy.radius * 1.9, enemy.radius * 1.62, 6);
      context.fill();
      context.stroke();
      context.fillStyle = "rgba(12,15,22,0.38)";
      context.fillRect(-enemy.radius * 0.78, -enemy.radius * 0.22, enemy.radius * 1.56, enemy.radius * 0.25);
      drawArmorPlates(enemy.radius, accent);
    } else if (enemy.shape === "spitter") {
      context.beginPath();
      context.moveTo(0, -enemy.radius * 1.12);
      context.lineTo(enemy.radius * 1.08, -enemy.radius * 0.05);
      context.lineTo(enemy.radius * 0.42, enemy.radius * 0.96);
      context.lineTo(-enemy.radius * 0.42, enemy.radius * 0.96);
      context.lineTo(-enemy.radius * 1.08, -enemy.radius * 0.05);
      context.closePath();
      context.fill();
      context.stroke();
      context.strokeStyle = hexToRgba(accent, 0.55 + pulse * 0.2);
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, -enemy.radius * 0.15);
      context.lineTo(enemy.radius * 1.35, -enemy.radius * 0.8);
      context.moveTo(0, -enemy.radius * 0.15);
      context.lineTo(-enemy.radius * 1.35, -enemy.radius * 0.8);
      context.stroke();
    } else if (enemy.shape === "splitter") {
      context.beginPath();
      context.arc(0, 0, enemy.radius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.strokeStyle = hexToRgba(accent, 0.58);
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-enemy.radius * 0.7, -enemy.radius * 0.2);
      context.lineTo(enemy.radius * 0.8, enemy.radius * 0.28);
      context.moveTo(-enemy.radius * 0.1, -enemy.radius * 0.8);
      context.lineTo(enemy.radius * 0.2, enemy.radius * 0.78);
      context.stroke();
    } else if (enemy.shape === "shield") {
      context.beginPath();
      context.roundRect(-enemy.radius * 0.82, -enemy.radius * 0.96, enemy.radius * 1.64, enemy.radius * 1.92, 10);
      context.fill();
      context.stroke();
      const auraRadius = enemy.shieldAura || enemy.radius * 4.8;
      const aura = context.createRadialGradient(0, 0, enemy.radius, 0, 0, auraRadius);
      aura.addColorStop(0, hexToRgba(accent, 0.12));
      aura.addColorStop(0.62, hexToRgba(accent, 0.045));
      aura.addColorStop(1, hexToRgba(accent, 0));
      context.fillStyle = aura;
      context.beginPath();
      context.arc(0, 0, auraRadius, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = hexToRgba(accent, 0.4 + pulse * 0.28);
      context.lineWidth = 3;
      context.beginPath();
      context.arc(0, 0, enemy.radius * (1.7 + pulse * 0.15), 0, Math.PI * 2);
      context.stroke();
    } else if (enemy.shape === "burrower") {
      context.beginPath();
      context.ellipse(0, 0, enemy.radius * 1.18, enemy.radius * 0.72, -0.28, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = hexToRgba(accent, 0.3 + pulse * 0.2);
      context.beginPath();
      context.ellipse(0, enemy.radius * 0.35, enemy.radius * 1.55, enemy.radius * 0.3, 0, 0, Math.PI * 2);
      context.fill();
    } else {
      context.beginPath();
      context.roundRect(-enemy.radius * 1.05, -enemy.radius * 0.92, enemy.radius * 2.1, enemy.radius * 1.9, 8);
      context.fill();
      context.stroke();
      context.strokeStyle = hexToRgba(accent, 0.72);
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(-enemy.radius * 0.75, -enemy.radius * 1.15);
      context.lineTo(-enemy.radius * 1.35, -enemy.radius * 1.65);
      context.moveTo(enemy.radius * 0.75, -enemy.radius * 1.15);
      context.lineTo(enemy.radius * 1.35, -enemy.radius * 1.65);
      context.stroke();
      if (enemy.hp < enemy.maxHp * 0.5) {
        context.strokeStyle = "rgba(217,95,99,0.62)";
        context.lineWidth = 4;
        context.beginPath();
        context.arc(0, 0, enemy.radius * (1.35 + pulse * 0.15), 0, Math.PI * 2);
        context.stroke();
      }
    }

    context.fillStyle = hexToRgba(accent, 0.86);
    context.beginPath();
    context.arc(-enemy.radius * 0.28, -enemy.radius * 0.22, Math.max(2.2, enemy.radius * 0.18), 0, Math.PI * 2);
    context.arc(enemy.radius * 0.28, -enemy.radius * 0.22, Math.max(2.2, enemy.radius * 0.18), 0, Math.PI * 2);
    context.fill();

    if ((enemy.sniperCritFlash || 0) > 0) {
      context.strokeStyle = `rgba(255,238,178,${Math.min(1, enemy.sniperCritFlash * 4)})`;
      context.lineWidth = 3;
      context.beginPath();
      context.arc(0, 0, enemy.radius * 1.65, 0, Math.PI * 2);
      context.stroke();
    }

    if ((enemy.arcOverloadFlash || 0) > 0) {
      context.strokeStyle = `rgba(132,231,255,${Math.min(1, enemy.arcOverloadFlash * 5)})`;
      context.lineWidth = 2.5;
      context.beginPath();
      context.arc(0, 0, enemy.radius * 1.5, 0, Math.PI * 2);
      context.stroke();
    }

    if ((enemy.breachTimer || 0) > 0) {
      context.strokeStyle = "rgba(255,184,72,0.8)";
      context.lineWidth = 2.4;
      context.setLineDash([5, 4]);
      context.beginPath();
      context.arc(0, 0, enemy.radius * 1.45, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = "rgba(255,184,72,0.16)";
      context.beginPath();
      context.arc(0, 0, enemy.radius * 1.1, 0, Math.PI * 2);
      context.fill();
    }

    if (enemy.boss) {
      context.fillStyle = hexToRgba(accent, 0.18 + pulse * 0.12);
      context.beginPath();
      context.arc(0, 0, enemy.radius * (1.45 + pulse * 0.12), 0, Math.PI * 2);
      context.fill();
    }

    context.restore();

    const width = enemy.radius * 2.4;
    context.fillStyle = "rgba(12,15,22,0.36)";
    context.fillRect(enemy.pos.x - width / 2, enemy.pos.y - enemy.radius - 12, width, 4);
    context.fillStyle = "rgba(120,215,177,0.78)";
    context.fillRect(enemy.pos.x - width / 2, enemy.pos.y - enemy.radius - 12, width * Math.max(0, enemy.hp / enemy.maxHp), 4);
  });
}

function drawNoLegTendrils(radius, accent, pulse, count, alpha) {
  context.strokeStyle = hexToRgba(accent, alpha);
  context.lineWidth = 2;
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : i / (count - 1);
    const startX = lerp(-radius * 0.72, radius * 0.72, t);
    const endX = startX + Math.sin(pulse * Math.PI * 2 + i) * radius * 0.35;
    context.beginPath();
    context.moveTo(startX, radius * 0.45);
    context.quadraticCurveTo(startX * 0.7, radius * 0.9, endX, radius * 1.15);
    context.stroke();
  }
}

function drawArmorPlates(radius, accent) {
  context.strokeStyle = hexToRgba(accent, 0.5);
  context.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    context.beginPath();
    context.moveTo(i * radius * 0.42, -radius * 0.72);
    context.lineTo(i * radius * 0.24, radius * 0.72);
    context.stroke();
  }
}

function drawProjectiles() {
  state.projectiles.forEach(projectile => {
    const alpha = Math.max(0, projectile.life / projectile.maxLife);

    if (projectile.effect === "miss") {
      const t = 1 - projectile.life / projectile.maxLife;
      const head = { x: lerp(projectile.from.x, projectile.to.x, t), y: lerp(projectile.from.y, projectile.to.y, t) };
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = projectile.color;
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(projectile.from.x, projectile.from.y);
      context.lineTo(head.x, head.y);
      context.stroke();
      if (t > 0.72) {
        context.globalAlpha = alpha * 0.9;
        context.fillStyle = "rgba(255,238,202,0.95)";
        context.font = "700 12px system-ui";
        context.textAlign = "center";
        context.fillText("MISS", projectile.to.x, projectile.to.y - 9);
      }
      context.restore();
      return;
    }

    if (projectile.effect === "arc") {
      const dx = projectile.to.x - projectile.from.x;
      const dy = projectile.to.y - projectile.from.y;
      const length = Math.hypot(dx, dy) || 1;
      const normalX = -dy / length;
      const normalY = dx / length;
      const jitter = projectile.jitter || 10;

      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = projectile.color;
      context.lineWidth = 2.8;
      context.shadowColor = projectile.color;
      context.shadowBlur = 10;
      context.beginPath();
      context.moveTo(projectile.from.x, projectile.from.y);
      for (let step = 1; step < 5; step += 1) {
        const fraction = step / 5;
        const baseX = lerp(projectile.from.x, projectile.to.x, fraction);
        const baseY = lerp(projectile.from.y, projectile.to.y, fraction);
        const offset = ((step % 2 === 0) ? -1 : 1) * jitter * (1 - fraction * 0.14);
        context.lineTo(baseX + normalX * offset, baseY + normalY * offset);
      }
      context.lineTo(projectile.to.x, projectile.to.y);
      context.stroke();
      context.shadowBlur = 0;
      context.strokeStyle = "rgba(255,255,255,0.85)";
      context.lineWidth = 1.1;
      context.stroke();
      context.restore();
      return;
    }

    if (projectile.effect === "pierce") {
      const t = 1 - projectile.life / projectile.maxLife;
      const head = {
        x: lerp(projectile.from.x, projectile.to.x, t),
        y: lerp(projectile.from.y, projectile.to.y, t)
      };
      const tail = {
        x: lerp(projectile.from.x, projectile.to.x, Math.max(0, t - 0.22)),
        y: lerp(projectile.from.y, projectile.to.y, Math.max(0, t - 0.22))
      };
      context.globalAlpha = alpha;
      context.strokeStyle = projectile.color;
      context.lineWidth = 7;
      context.shadowColor = projectile.color;
      context.shadowBlur = 10;
      context.beginPath();
      context.moveTo(tail.x, tail.y);
      context.lineTo(head.x, head.y);
      context.stroke();
      context.shadowBlur = 0;
      context.strokeStyle = "rgba(255,255,255,0.82)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(tail.x, tail.y);
      context.lineTo(head.x, head.y);
      context.stroke();
      if (t > 0.22) {
        const hitPoints = projectile.hits?.length ? projectile.hits : projectile.hit ? [projectile.hit] : [];
        hitPoints.forEach((hitPoint, index) => {
          context.globalAlpha = alpha * Math.max(0.35, 0.78 - index * 0.08);
          context.strokeStyle = projectile.color;
          context.lineWidth = Math.max(1.2, 2.8 - index * 0.18);
          context.beginPath();
          context.arc(hitPoint.x, hitPoint.y, 8 + 5 * Math.sin(t * Math.PI), 0, Math.PI * 2);
          context.stroke();
        });
      }
      context.globalAlpha = 1;
      return;
    }

    const t = 1 - projectile.life / projectile.maxLife;
    const head = {
      x: lerp(projectile.from.x, projectile.to.x, t),
      y: lerp(projectile.from.y, projectile.to.y, t)
    };
    const tail = {
      x: lerp(projectile.from.x, projectile.to.x, Math.max(0, t - (projectile.effect === "splash" ? 0.1 : 0.16))),
      y: lerp(projectile.from.y, projectile.to.y, Math.max(0, t - (projectile.effect === "splash" ? 0.1 : 0.16)))
    };
    context.globalAlpha = alpha;
    context.beginPath();
    context.moveTo(tail.x, tail.y);
    context.lineTo(head.x, head.y);
    context.strokeStyle = projectile.color;
    context.lineWidth = projectile.effect === "splash" ? 8 : 6;
    context.stroke();
    context.beginPath();
    context.arc(head.x, head.y, projectile.effect === "splash" ? 5.5 : 3.5, 0, Math.PI * 2);
    context.fillStyle = projectile.color;
    context.fill();

    if (projectile.effect === "splash" && t > 0.72) {
      const impact = clamp((t - 0.72) / 0.28, 0, 1);
      context.globalAlpha = (1 - impact) * 0.86;
      context.strokeStyle = projectile.color;
      context.lineWidth = 7 - impact * 4;
      context.beginPath();
      context.arc(projectile.to.x, projectile.to.y, 10 + projectile.impactRadius * impact, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = (1 - impact) * 0.28;
      context.fillStyle = projectile.color;
      context.beginPath();
      context.arc(projectile.to.x, projectile.to.y, 8 + projectile.impactRadius * 0.88 * impact, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = (1 - impact) * 0.9;
      context.strokeStyle = "rgba(255,255,255,0.7)";
      context.lineWidth = 2.2;
      context.beginPath();
      context.arc(projectile.to.x, projectile.to.y, 6 + projectile.impactRadius * 0.54 * impact, 0, Math.PI * 2);
      context.stroke();
      for (let spark = 0; spark < 6; spark += 1) {
        const angle = spark * (Math.PI * 2 / 6) + impact * 0.8;
        const inner = 10 + projectile.impactRadius * 0.16;
        const outer = inner + 10 + projectile.impactRadius * 0.18 * (1 - impact);
        context.strokeStyle = projectile.color;
        context.lineWidth = 2 - impact * 0.8;
        context.beginPath();
        context.moveTo(projectile.to.x + Math.cos(angle) * inner, projectile.to.y + Math.sin(angle) * inner);
        context.lineTo(projectile.to.x + Math.cos(angle) * outer, projectile.to.y + Math.sin(angle) * outer);
        context.stroke();
      }
    }
    context.globalAlpha = 1;
  });
}

function drawPlacementGhost() {
  if (!state.placementGhost.visible || !state.selectedTowerId) {
    return;
  }
  const definition = towerDefinitions[state.selectedTowerId];
  const valid = isValidPlacement(state.placementGhost, definition) && state.coins >= towerCost(definition);
  const building = definition.canPlaceOnRooftop === false ? null : buildingAt(state.placementGhost);
  const ghostTower = {
    id: definition.id,
    x: state.placementGhost.x,
    y: state.placementGhost.y,
    level: 1,
    xp: 0,
    cooldown: 0,
    pulse: 0.35,
    angle: -Math.PI / 2,
    spin: 0,
    barrelIndex: 0,
    shotsFired: 0,
    chargeTimer: 0,
    chargeDuration: 0.72,
    chargeProgress: 0,
    chargeTarget: null,
    holdCharge: false,
    postShotDelay: 0,
    pendingChargeDuration: 0.72,
    arcActive: false,
    arcTargets: [],
    arcRetargetTimer: 0,
    arcFireTimer: 0,
    arcVisualTimer: 0,
    overheatTimer: 0,
    overheatDuration: 0,
    heightRangeBonus: building?.rangeBonus || 1,
    recoils: definition.barrels.map(() => 0),
    muzzleFlash: null
  };

  if (definition.kind !== "infrastructure") {
    context.globalAlpha = 0.11;
    context.beginPath();
    context.arc(state.placementGhost.x, state.placementGhost.y, towerRange(definition, ghostTower), 0, Math.PI * 2);
    context.fillStyle = valid ? definition.color : palette.invalid;
    context.fill();
  }

  if (building) {
    context.globalAlpha = valid ? 0.9 : 0.35;
    context.strokeStyle = valid ? "rgba(242,188,100,0.78)" : "rgba(217,95,99,0.72)";
    context.lineWidth = 3;
    context.beginPath();
    context.roundRect(building.x + 4, building.y + 4, building.width - 8, building.height - 8, 7);
    context.stroke();
  }

  context.globalAlpha = valid ? 0.94 : 0.58;
  drawTowerModel(ghostTower, definition);
  context.globalAlpha = 1;

  if (valid && building) {
    const label = building.rangeBonus > 1
      ? `Roof +${Math.round((building.rangeBonus - 1) * 100)}% range`
      : "Ruined roof: no bonus";
    context.fillStyle = "rgba(242,188,100,0.9)";
    context.font = "700 14px Inter, system-ui, sans-serif";
    context.fillText(label, state.placementGhost.x + 26, state.placementGhost.y - 26);
  }

  if (!valid) {
    context.beginPath();
    context.arc(state.placementGhost.x, state.placementGhost.y, 35, 0, Math.PI * 2);
    context.strokeStyle = palette.invalid;
    context.lineWidth = 4;
    context.stroke();
  }
  context.globalAlpha = 1;
}

function drawGameOver() {
  if (state.stability > 0) {
    return;
  }
  context.fillStyle = "rgba(39,49,63,0.32)";
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  context.fillStyle = "#ffffff";
  context.font = "800 56px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText("Reactor Overrun", WORLD.width / 2, WORLD.height / 2 - 12);
  context.font = "700 22px Inter, sans-serif";
  context.fillText("Refresh to try a cleaner traffic plan", WORLD.width / 2, WORLD.height / 2 + 34);
}

function roundedRect(x, y, width, height, radius, color) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = color;
  context.fill();
}

function drawRaisedBlock(building) {
  const { x, y, width, height, sideColor, topColor, levels } = building;
  const lift = building.ruined ? 5 : 7 + levels * 5;
  const glowColor = building.ruined
    ? "rgba(180,130,255,0.32)"
    : "rgba(99,217,255,0.26)";
  const chamfer = 14;

  context.fillStyle = palette.buildingShadow;
  context.beginPath();
  context.roundRect(x + 8, y + 12, width, height + lift * 0.4, 10);
  context.fill();

  context.fillStyle = sideColor;
  context.beginPath();
  context.roundRect(x, y + lift, width, height, 10);
  context.fill();

  const gradient = context.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, hexToRgba(topColor, 0.98));
  gradient.addColorStop(0.48, hexToRgba(sideColor, 0.96));
  gradient.addColorStop(1, "rgba(24,30,42,0.98)");
  context.fillStyle = gradient;
  context.beginPath();
  if (building.corner === "ne") {
    context.moveTo(x + 14, y);
    context.lineTo(x + width - chamfer - 6, y);
    context.lineTo(x + width, y + chamfer);
    context.lineTo(x + width, y + height - 14);
    context.lineTo(x + width - 14, y + height);
    context.lineTo(x + 14, y + height);
    context.lineTo(x, y + height - 14);
    context.lineTo(x, y + 14);
  } else if (building.corner === "nw") {
    context.moveTo(x + chamfer, y);
    context.lineTo(x + width - 14, y);
    context.lineTo(x + width, y + 14);
    context.lineTo(x + width, y + height - 14);
    context.lineTo(x + width - 14, y + height);
    context.lineTo(x + 14, y + height);
    context.lineTo(x, y + height - 14);
    context.lineTo(x, y + chamfer);
  } else if (building.corner === "se") {
    context.moveTo(x + 14, y);
    context.lineTo(x + width - 14, y);
    context.lineTo(x + width, y + 14);
    context.lineTo(x + width, y + height - chamfer);
    context.lineTo(x + width - chamfer, y + height);
    context.lineTo(x + 14, y + height);
    context.lineTo(x, y + height - 14);
    context.lineTo(x, y + 14);
  } else if (building.corner === "sw") {
    context.moveTo(x + 14, y);
    context.lineTo(x + width - 14, y);
    context.lineTo(x + width, y + 14);
    context.lineTo(x + width, y + height - 14);
    context.lineTo(x + width - 14, y + height);
    context.lineTo(x + chamfer, y + height);
    context.lineTo(x, y + height - chamfer);
    context.lineTo(x, y + 14);
  } else {
    context.moveTo(x + 14, y);
    context.lineTo(x + width - 14, y);
    context.lineTo(x + width, y + 14);
    context.lineTo(x + width, y + height - 14);
    context.lineTo(x + width - 14, y + height);
    context.lineTo(x + 14, y + height);
    context.lineTo(x, y + height - 14);
    context.lineTo(x, y + 14);
  }
  context.closePath();
  context.fill();

  context.strokeStyle = "rgba(105,170,215,0.22)";
  context.lineWidth = 1.8;
  context.stroke();

  context.fillStyle = "rgba(20,27,36,0.82)";
  context.beginPath();
  context.roundRect(x + 12, y + 10, width - 24, height - 20, 8);
  context.fill();
  context.strokeStyle = glowColor;
  context.lineWidth = 1.2;
  context.stroke();

  context.fillStyle = "rgba(99,217,255,0.12)";
  context.beginPath();
  context.roundRect(x + 16, y + height - 14, 22, 3, 1);
  context.roundRect(x + width - 34, y + 10, 14, 3, 1);
  context.fill();
}

function drawIntactBuildingDetails(building) {
  context.fillStyle = "rgba(41,49,60,0.94)";
  context.beginPath();

  if (building.variant === "hab") {
    context.roundRect(building.x + 16, building.y + 18, building.width * 0.3, 16, 5);
    context.roundRect(building.x + building.width * 0.56, building.y + 18, building.width * 0.2, 14, 4);
    context.roundRect(building.x + building.width * 0.48, building.y + building.height - 34, building.width * 0.28, 14, 4);
  } else if (building.variant === "relay") {
    context.roundRect(building.x + building.width * 0.5 - 10, building.y + 14, 20, building.height - 28, 6);
    context.roundRect(building.x + 18, building.y + building.height * 0.45, building.width - 36, 14, 5);
  } else if (building.variant === "bastion") {
    context.roundRect(building.x + 18, building.y + 18, building.width - 36, 18, 5);
    context.roundRect(building.x + 18, building.y + building.height - 34, building.width * 0.34, 14, 4);
    context.roundRect(building.x + building.width * 0.56, building.y + building.height - 34, building.width * 0.22, 14, 4);
  } else if (building.variant === "tower") {
    context.roundRect(building.x + building.width * 0.5 - 14, building.y + 14, 28, building.height - 28, 7);
    context.roundRect(building.x + 16, building.y + building.height - 34, building.width - 32, 12, 5);
  } else if (building.variant === "green") {
    context.roundRect(building.x + 16, building.y + 16, building.width - 32, building.height - 32, 8);
    context.fill();
    context.fillStyle = "rgba(151,227,179,0.18)";
    context.fillRect(building.x + 28, building.y + 26, building.width - 56, 4);
    context.fillRect(building.x + 28, building.y + 44, building.width - 56, 4);
    context.fillRect(building.x + 28, building.y + 62, building.width - 56, 4);
    context.fillStyle = "rgba(242,188,100,0.32)";
    context.beginPath();
    context.moveTo(building.x + building.width - 22, building.y + 16);
    context.lineTo(building.x + building.width - 14, building.y + 20);
    context.lineTo(building.x + building.width - 22, building.y + 24);
    context.closePath();
    context.fill();
    return;
  } else {
    context.roundRect(building.x + 18, building.y + 18, building.width * 0.34, 18, 5);
    context.roundRect(building.x + building.width * 0.52, building.y + building.height - 34, building.width * 0.24, 16, 5);
  }
  context.fill();

  context.fillStyle = "rgba(170,220,245,0.18)";
  if (building.variant === "relay" || building.variant === "tower") {
    context.fillRect(building.x + building.width * 0.5 - 1.5, building.y + 20, 3, building.height - 40);
  } else {
    context.fillRect(building.x + 24, building.y + 24, Math.max(18, building.width * 0.22), 3);
  }
  context.fillStyle = "rgba(242,188,100,0.32)";
  context.beginPath();
  context.moveTo(building.x + building.width - 22, building.y + 16);
  context.lineTo(building.x + building.width - 14, building.y + 20);
  context.lineTo(building.x + building.width - 22, building.y + 24);
  context.closePath();
  context.fill();
}

function drawRuinedBuildingDetails(building) {
  context.strokeStyle = "rgba(246,225,189,0.12)";
  context.lineWidth = 2.4;
  context.beginPath();
  if (building.corner === "sw") {
    context.moveTo(building.x + 16, building.y + 18);
    context.lineTo(building.x + 44, building.y + 36);
    context.lineTo(building.x + 28, building.y + 60);
    context.moveTo(building.x + building.width - 30, building.y + 20);
    context.lineTo(building.x + building.width - 54, building.y + 44);
  } else {
    context.moveTo(building.x + 24, building.y + 18);
    context.lineTo(building.x + 52, building.y + 34);
    context.lineTo(building.x + 40, building.y + 58);
    context.moveTo(building.x + building.width - 24, building.y + 18);
    context.lineTo(building.x + building.width - 46, building.y + 40);
  }
  context.stroke();
  context.fillStyle = "rgba(12,15,22,0.24)";
  context.beginPath();
  context.roundRect(building.x + 18, building.y + building.height - 20, building.width - 36, 8, 3);
  context.fill();
}

function syncUI() {
  ui.stability.textContent = Math.round(state.stability);
  ui.coins.textContent = Math.round(state.coins);
  ui.medals.textContent = state.biomass.toFixed(1);
  ui.wave.textContent = String(state.wave);
  ui.score.textContent = String(state.score);
  syncBuildControls();
}

function setScreen(screen) {
  state.screen = screen;
  if (screen !== "game") {
    state.paused = false;
    state.baseOverlayOpen = false;
    state.baseHitPulse = 0;
  }
  ui.mainMenu.classList.toggle("hidden", screen !== "menu");
  ui.campaignScreen.classList.toggle("hidden", screen !== "campaign");
  ui.arsenalScreen.classList.toggle("hidden", screen !== "arsenal");
  ui.runResult.classList.add("hidden");

  const gameplayHidden = screen !== "game";
  ui.towerbar.classList.toggle("hidden", gameplayHidden);
  ui.startWave.parentElement.classList.toggle("hidden", gameplayHidden);
  ui.refineryButton.parentElement.classList.toggle("hidden", gameplayHidden);
  ui.stability.parentElement.parentElement.classList.toggle("hidden", gameplayHidden);
  ui.towerInspector.classList.add("hidden");

  if (screen === "arsenal") {
    buildArsenal();
  } else if (screen === "campaign") {
    state.campaignBriefingOpen = false;
    buildCampaignMapV2();
  } else if (screen === "menu") {
    buildModeList();
    buildDifficultyList();
    buildMapList();
  }
}

function buildCampaignMapV2() {
  const difficulty = currentDifficulty();
  ui.campaignTitle.textContent = `${difficulty.name} Campaign`;
  ui.campaignMap.innerHTML = "";
  bindCampaignCamera();

  const content = document.createElement("div");
  content.className = "campaign-content";
  ui.campaignMap.appendChild(content);

  content.appendChild(buildCampaignMapTexture());

  const routeLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  routeLayer.classList.add("campaign-routes");
  routeLayer.setAttribute("viewBox", "0 0 100 100");
  routeLayer.setAttribute("preserveAspectRatio", "none");
  const drawnLinks = new Set();
  mapDefinitions.forEach(map => {
    map.links.forEach(linkId => {
      const linked = mapDefinitions.find(item => item.id === linkId);
      if (!linked) {
        return;
      }

      const key = [map.id, linked.id].sort().join("-");
      if (drawnLinks.has(key)) {
        return;
      }
      drawnLinks.add(key);

      const route = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const midX = (map.planetX + linked.planetX) / 2;
      const midY = (map.planetY + linked.planetY) / 2 - 4;
      route.setAttribute("d", `M ${map.planetX} ${map.planetY} Q ${midX} ${midY} ${linked.planetX} ${linked.planetY}`);
      route.classList.add("campaign-route");
      routeLayer.appendChild(route);
    });
  });
  content.appendChild(routeLayer);

  mapDefinitions.forEach(map => {
    const reachable = isCampaignNodeReachable(map);
    const current = map.id === state.currentCampaignNodeId;
    const selected = state.campaignBriefingOpen && state.selectedMapId === map.id;
    const button = document.createElement("button");
    button.className = `campaign-node theme-${map.battleTheme} ${selected ? "active" : ""} ${current ? "current" : ""} ${reachable ? "reachable" : "distant"} risk-${map.risk.toLowerCase().replace(/\s+/g, "-")}`;
    button.style.setProperty("--node-x", `${map.planetX}%`);
    button.style.setProperty("--node-y", `${map.planetY}%`);
    button.innerHTML = `
      <i></i>
      <b>${map.name}</b>
      <span>${map.type} / ${map.risk} / ${campaignNodeStars(map)}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedMapId = map.id;
      state.campaignBriefingOpen = true;
      buildCampaignMapV2();
    });
    content.appendChild(button);
  });

  applyCampaignCamera();
  if (!state.campaignCamera.fitted) {
    fitCampaignCamera();
    state.campaignCamera.fitted = true;
  }

  ui.campaignStartButton.classList.toggle("hidden", !state.campaignBriefingOpen);
  ui.campaignStartButton.disabled = !isSelectedCampaignNodeReachable();
  ui.campaignStartButton.textContent = isSelectedCampaignNodeReachable() ? "Start Mission" : "Reach Adjacent Node First";
  ui.campaignKicker.parentElement.classList.toggle("hidden", !state.campaignBriefingOpen);
  if (!state.campaignBriefingOpen) {
    return;
  }

  const map = currentMap();
  ui.campaignKicker.textContent = `${difficulty.name} / ${map.type}`;
  ui.campaignMapName.textContent = map.name;
  ui.campaignMapText.innerHTML = `
    <span><b>Risk:</b> ${map.risk} / difficulty x${(map.difficulty * difficulty.multiplier).toFixed(2)}</span>
    <span><b>Biome:</b> ${map.biome}</span>
    <span><b>Route:</b> ${map.terrain}</span>
    <span><b>Threats:</b> ${map.threats}</span>
    ${map.mechanicText ? `<span class="campaign-mechanic"><b>Mechanic:</b> ${map.mechanicText}</span>` : ""}
    <span><b>Reward:</b> ${map.reward}. ${map.medalReward} Technology Cores.</span>
    <span><b>Waves:</b> ${map.wavesToWin}. Difficulty reward: ${difficulty.reward}</span>
  `;
}

function buildCampaignMapTexture() {
  const texture = document.createElement("div");
  texture.className = "campaign-map-texture";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("campaign-terrain-svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");

  // Color biome zones removed: campaign map now uses one neutral tactical surface.

  const roads = [
    { className: "main", d: "M8 84 C15 79 19 72 25 70 C32 67 38 75 45 68 C51 62 48 49 58 47 C66 45 69 34 76 35 C83 36 86 46 92 51" },
    { className: "main", d: "M12 82 C20 65 29 57 39 55 C49 53 54 40 63 35 C71 31 79 38 86 48" },
    { className: "minor", d: "M24 70 C31 69 34 74 37 78" },
    { className: "minor", d: "M30 58 C35 49 41 46 48 45" },
    { className: "minor", d: "M44 62 C50 65 54 72 55 80" },
    { className: "minor", d: "M61 56 C67 55 72 61 73 68" },
    { className: "minor", d: "M72 35 C76 43 80 47 86 49" }
  ];
  roads.forEach(road => appendSvgPath(svg, road.d, `campaign-map-road ${road.className}`));

  // Decorative square ruin clusters were removed to keep the campaign route clean and readable.
  // Colored biome zones, infection marks and knowledge marks remain disabled.

  texture.appendChild(svg);
  return texture;
}

function campaignNodeStars(map) {
  if (map.risk === "Low") {
    return "Risk I";
  }
  if (map.risk === "Medium") {
    return "Risk II";
  }
  if (map.risk === "High") {
    return "Risk III";
  }
  if (map.risk === "Very High") {
    return "Risk IV";
  }
  return "Risk V";
}

function appendSvgPath(parent, d, className) {
  const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathElement.setAttribute("d", d);
  pathElement.setAttribute("class", className);
  parent.appendChild(pathElement);
}

function appendSvgCircle(parent, site) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", site.cx);
  circle.setAttribute("cy", site.cy);
  circle.setAttribute("r", site.r);
  circle.setAttribute("class", `campaign-site ${site.className}`);
  parent.appendChild(circle);
}

function appendCampaignRuinCluster(parent, cluster) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", `campaign-ruin-cluster ${cluster.tone}`);
  const blockWidth = cluster.w / 4.8;
  const blockHeight = cluster.h / 3.6;

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      if ((row + col + Math.round(cluster.x)) % 3 === 0) {
        continue;
      }
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const jitterX = ((row * 7 + col * 3) % 5) * 0.13;
      const jitterY = ((row * 5 + col * 4) % 4) * 0.14;
      rect.setAttribute("x", (cluster.x + col * blockWidth * 1.08 + jitterX).toFixed(2));
      rect.setAttribute("y", (cluster.y + row * blockHeight * 1.08 + jitterY).toFixed(2));
      rect.setAttribute("width", (blockWidth * (0.72 + ((row + col) % 2) * 0.18)).toFixed(2));
      rect.setAttribute("height", (blockHeight * (0.68 + ((row * col + 1) % 2) * 0.22)).toFixed(2));
      rect.setAttribute("rx", "0.25");
      group.appendChild(rect);
    }
  }

  parent.appendChild(group);
}

function isCampaignNodeReachable(map) {
  const current = mapDefinitions.find(item => item.id === state.currentCampaignNodeId) || mapDefinitions[0];
  return map.id === current.id || current.links.includes(map.id);
}

function isSelectedCampaignNodeReachable() {
  const map = currentMap();
  return isCampaignNodeReachable(map);
}

function fitCampaignCamera() {
  const rect = ui.campaignMap.getBoundingClientRect();
  state.campaignCamera.zoom = Math.min(0.82, Math.max(0.58, rect.width / 1700));
  state.campaignCamera.x = Math.max(-320, rect.width * 0.06);
  state.campaignCamera.y = Math.max(-170, rect.height * 0.05);
  applyCampaignCamera();
}

function applyCampaignCamera() {
  const content = ui.campaignMap.querySelector(".campaign-content");
  if (!content) {
    return;
  }
  const camera = state.campaignCamera;
  content.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
}

function buildCampaignMap() {
  const difficulty = currentDifficulty();
  ui.campaignTitle.textContent = `${difficulty.name} Campaign`;
  ui.campaignMap.innerHTML = "";

  mapDefinitions.forEach((map, index) => {
    const unlocked = completedMapsForCurrentDifficulty() >= map.unlockAt;
    const button = document.createElement("button");
    button.className = `campaign-node ${state.selectedMapId === map.id ? "active" : ""} ${unlocked ? "" : "locked"}`;
    button.style.setProperty("--node-x", `${map.planetX}%`);
    button.style.setProperty("--node-y", `${map.planetY}%`);
    button.disabled = !unlocked;
    button.innerHTML = `<b>${map.name}</b><span>${unlocked ? `${map.wavesToWin} waves · ${map.medalReward} Technology Cores` : "Locked"}</span>`;
    button.addEventListener("click", () => {
      state.selectedMapId = map.id;
      buildCampaignMap();
    });
    ui.campaignMap.appendChild(button);

    if (!unlocked && state.selectedMapId === map.id) {
      state.selectedMapId = mapDefinitions[Math.max(0, index - 1)].id;
    }
  });

  const map = currentMap();
  ui.campaignKicker.textContent = `${difficulty.name} Infected Sector`;
  ui.campaignMapName.textContent = map.name;
  ui.campaignMapText.textContent = `${map.terrain} ${map.threats} Reward: ${map.reward}. Difficulty reward: ${difficulty.reward}`;
}

function showCampaignIntro() {
  if (!isSelectedCampaignNodeReachable()) {
    return;
  }

  const map = currentMap();
  const difficulty = currentDifficulty();
  const kicker = ui.storyModal.querySelector(".story-board > span");
  const title = ui.storyModal.querySelector(".story-board > h1");
  if (kicker) kicker.textContent = `${difficulty.name} Mission Brief`;
  if (title) title.textContent = map.mechanicTitle || map.name;
  ui.storyText.innerHTML = `
    <strong class="mission-map-name">${map.name}</strong>
    <span>${map.terrain}</span>
    <span><b>Map mechanic:</b> ${map.introText || map.mechanicText || "Standard defense route."}</span>
    <span><b>Enemy forecast:</b> ${map.threats}</span>
  `;
  ui.storyModal.classList.remove("hidden");
}

function startSelectedRun() {
  resetRun();
  setScreen("game");
  const map = currentMap();
  state.mapMechanicBanner = {
    title: map.name,
    kicker: map.mechanicTitle || map.type || "Mission Protocol",
    text: map.mechanicText || map.terrain,
    time: 4.8,
    total: 4.8
  };
}

function calculateArsenalLayout() {
  const nodeCount = arsenalDefinitions.length;
  const columns = Math.max(8, Math.ceil(Math.sqrt(nodeCount * 1.45)));
  const rows = Math.max(7, Math.ceil(nodeCount / columns));
  const width = Math.max(2580, 560 + columns * 265);
  const height = Math.max(1680, 420 + rows * 205);
  const marginX = 190;
  const marginY = 155;
  const usableWidth = width - marginX * 2;
  const usableHeight = height - marginY * 2;
  const positions = new Map();
  const anchors = new Map();

  arsenalDefinitions.forEach((item, index) => {
    const anchor = {
      x: marginX + (item.x / 100) * usableWidth,
      y: marginY + (item.y / 100) * usableHeight
    };
    anchors.set(item.id, anchor);
    positions.set(item.id, {
      x: anchor.x,
      y: anchor.y,
      order: index
    });
  });

  const minHorizontalGap = 226;
  const minVerticalGap = 142;
  const items = arsenalDefinitions.map(item => positions.get(item.id));

  for (let iteration = 0; iteration < 92; iteration += 1) {
    for (let aIndex = 0; aIndex < items.length; aIndex += 1) {
      for (let bIndex = aIndex + 1; bIndex < items.length; bIndex += 1) {
        const a = items[aIndex];
        const b = items[bIndex];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        if (Math.abs(dx) >= minHorizontalGap || Math.abs(dy) >= minVerticalGap) {
          continue;
        }

        if (Math.abs(dx) < 0.01) {
          dx = a.order < b.order ? 1 : -1;
        }
        if (Math.abs(dy) < 0.01) {
          dy = a.order < b.order ? 1 : -1;
        }

        const overlapX = minHorizontalGap - Math.abs(dx);
        const overlapY = minVerticalGap - Math.abs(dy);
        if (overlapX / minHorizontalGap < overlapY / minVerticalGap) {
          const shift = overlapX * 0.54;
          const direction = Math.sign(dx);
          a.x -= shift * direction;
          b.x += shift * direction;
        } else {
          const shift = overlapY * 0.54;
          const direction = Math.sign(dy);
          a.y -= shift * direction;
          b.y += shift * direction;
        }
      }
    }

    arsenalDefinitions.forEach(item => {
      const point = positions.get(item.id);
      const anchor = anchors.get(item.id);
      point.x += (anchor.x - point.x) * 0.028;
      point.y += (anchor.y - point.y) * 0.028;
      point.x = clamp(point.x, marginX, width - marginX);
      point.y = clamp(point.y, marginY, height - marginY);
    });
  }

  return { width, height, positions };
}

function buildArsenal() {
  ui.arsenalGrid.innerHTML = "";
  const wallet = document.createElement("div");
  wallet.className = "tech-wallet";
  wallet.innerHTML = `<b>Technology Cores: ${profile.medals}</b><span>Campaign and No Rating Endless use these permanent blueprints and upgrades. Ranked Endless ignores them. Wheel: zoom / drag: move tree</span>`;
  ui.arsenalGrid.appendChild(wallet);

  const controls = document.createElement("div");
  controls.className = "tech-camera-controls";
  controls.innerHTML = `
    <button type="button" data-camera="out" aria-label="Zoom out">-</button>
    <button type="button" data-camera="reset" aria-label="Fit tree">Fit</button>
    <button type="button" data-camera="in" aria-label="Zoom in">+</button>
    <span id="techZoomLabel">90%</span>
  `;
  ui.arsenalGrid.appendChild(controls);

  const content = document.createElement("div");
  content.className = "tech-content";
  const layout = calculateArsenalLayout();
  content.style.width = `${layout.width}px`;
  content.style.height = `${layout.height}px`;
  ui.arsenalGrid.appendChild(content);

  const lines = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  lines.classList.add("tech-lines");
  lines.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  lines.setAttribute("preserveAspectRatio", "none");
  arsenalDefinitions.forEach(item => {
    item.parents.forEach(parentId => {
      const parent = arsenalDefinitions.find(node => node.id === parentId);
      if (!parent) {
        return;
      }

      const connector = document.createElementNS("http://www.w3.org/2000/svg", "path");
      connector.setAttribute("d", buildTechConnectorPath(layout.positions.get(parent.id), layout.positions.get(item.id)));
      connector.classList.add(hasUpgrade(parent.id) && hasUpgrade(item.id) ? "owned" : isArsenalItemUnlocked(item) ? "available" : "locked");
      lines.appendChild(connector);
    });
  });
  content.appendChild(lines);

  arsenalDefinitions.forEach(item => {
    const unlocked = isArsenalItemUnlocked(item);
    const purchased = hasUpgrade(item.id);
    const position = layout.positions.get(item.id);
    const card = document.createElement("button");
    card.className = `tech-node branch-${item.branch.toLowerCase()} ${item.future ? "future" : purchased ? "owned" : unlocked ? "available" : "locked"}`;
    card.style.left = `${position.x}px`;
    card.style.top = `${position.y}px`;
    card.disabled = item.future || !unlocked || purchased || profile.medals < item.cost;
    card.innerHTML = `
      <small>${item.type}</small>
      <b>${item.name}</b>
      <p>${item.text}</p>
      <span>${item.future ? "Future" : purchased ? "Owned" : unlocked ? `${item.cost} Technology Cores` : "Locked"}</span>
    `;
    card.title = `${item.type}: ${item.text}`;
    card.addEventListener("click", () => buyArsenalItem(item));
    content.appendChild(card);
  });

  controls.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.camera;
      if (action === "reset") {
        fitArsenalCamera();
      } else {
        zoomArsenal(action === "in" ? 1.16 : 0.86, ui.arsenalGrid.clientWidth / 2, ui.arsenalGrid.clientHeight / 2);
      }
      applyArsenalCamera();
    });
  });

  if (!state.arsenalCamera.fitted) {
    fitArsenalCamera();
    state.arsenalCamera.fitted = true;
  }
  bindArsenalCamera();
  applyArsenalCamera();
}

function buildTechConnectorPath(parent, item) {
  const dx = item.x - parent.x;
  const dy = item.y - parent.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const bend = Math.max(70, Math.abs(dx) * 0.44);
    const controlOneX = parent.x + Math.sign(dx || 1) * bend;
    const controlTwoX = item.x - Math.sign(dx || 1) * bend;
    return `M ${parent.x.toFixed(1)} ${parent.y.toFixed(1)} C ${controlOneX.toFixed(1)} ${parent.y.toFixed(1)}, ${controlTwoX.toFixed(1)} ${item.y.toFixed(1)}, ${item.x.toFixed(1)} ${item.y.toFixed(1)}`;
  }

  const bend = Math.max(64, Math.abs(dy) * 0.42);
  const controlOneY = parent.y + Math.sign(dy || 1) * bend;
  const controlTwoY = item.y - Math.sign(dy || 1) * bend;
  return `M ${parent.x.toFixed(1)} ${parent.y.toFixed(1)} C ${parent.x.toFixed(1)} ${controlOneY.toFixed(1)}, ${item.x.toFixed(1)} ${controlTwoY.toFixed(1)}, ${item.x.toFixed(1)} ${item.y.toFixed(1)}`;
}

function bindArsenalCamera() {
  if (ui.arsenalGrid.dataset.cameraBound === "true") {
    return;
  }

  ui.arsenalGrid.dataset.cameraBound = "true";

  ui.arsenalGrid.addEventListener("wheel", event => {
    if (state.screen !== "arsenal") {
      return;
    }

    event.preventDefault();
    const rect = ui.arsenalGrid.getBoundingClientRect();
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    zoomArsenal(factor, event.clientX - rect.left, event.clientY - rect.top);
    applyArsenalCamera();
  }, { passive: false });

  ui.arsenalGrid.addEventListener("pointerdown", event => {
    if (event.target.closest(".tech-node, .tech-camera-controls, .tech-wallet")) {
      return;
    }

    state.arsenalCamera.dragging = true;
    state.arsenalCamera.dragStartX = event.clientX;
    state.arsenalCamera.dragStartY = event.clientY;
    state.arsenalCamera.originX = state.arsenalCamera.x;
    state.arsenalCamera.originY = state.arsenalCamera.y;
    ui.arsenalGrid.setPointerCapture(event.pointerId);
  });

  ui.arsenalGrid.addEventListener("pointermove", event => {
    if (!state.arsenalCamera.dragging) {
      return;
    }

    state.arsenalCamera.x = state.arsenalCamera.originX + event.clientX - state.arsenalCamera.dragStartX;
    state.arsenalCamera.y = state.arsenalCamera.originY + event.clientY - state.arsenalCamera.dragStartY;
    applyArsenalCamera();
  });

  ui.arsenalGrid.addEventListener("pointerup", event => {
    state.arsenalCamera.dragging = false;
    if (ui.arsenalGrid.hasPointerCapture(event.pointerId)) {
      ui.arsenalGrid.releasePointerCapture(event.pointerId);
    }
  });

  ui.arsenalGrid.addEventListener("pointercancel", () => {
    state.arsenalCamera.dragging = false;
  });

  ui.arsenalGrid.addEventListener("pointerleave", () => {
    state.arsenalCamera.dragging = false;
  });
}

function bindCampaignCamera() {
  if (ui.campaignMap.dataset.cameraBound === "true") {
    return;
  }
  ui.campaignMap.dataset.cameraBound = "true";

  ui.campaignMap.addEventListener("pointerdown", event => {
    if (event.target.closest(".campaign-node")) {
      return;
    }
    state.campaignCamera.dragging = true;
    state.campaignCamera.dragStartX = event.clientX;
    state.campaignCamera.dragStartY = event.clientY;
    state.campaignCamera.originX = state.campaignCamera.x;
    state.campaignCamera.originY = state.campaignCamera.y;
    ui.campaignMap.setPointerCapture(event.pointerId);
  });

  ui.campaignMap.addEventListener("pointermove", event => {
    if (!state.campaignCamera.dragging) {
      return;
    }
    state.campaignCamera.x = state.campaignCamera.originX + event.clientX - state.campaignCamera.dragStartX;
    state.campaignCamera.y = state.campaignCamera.originY + event.clientY - state.campaignCamera.dragStartY;
    applyCampaignCamera();
  });

  ui.campaignMap.addEventListener("pointerup", event => {
    state.campaignCamera.dragging = false;
    if (ui.campaignMap.hasPointerCapture(event.pointerId)) {
      ui.campaignMap.releasePointerCapture(event.pointerId);
    }
  });

  ui.campaignMap.addEventListener("pointercancel", () => {
    state.campaignCamera.dragging = false;
  });

  ui.campaignMap.addEventListener("wheel", event => {
    event.preventDefault();
    const camera = state.campaignCamera;
    const rect = ui.campaignMap.getBoundingClientRect();
    const before = {
      x: (event.clientX - rect.left - camera.x) / camera.zoom,
      y: (event.clientY - rect.top - camera.y) / camera.zoom
    };
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
    camera.zoom = clamp(camera.zoom * zoomFactor, 0.46, 1.45);
    camera.x = event.clientX - rect.left - before.x * camera.zoom;
    camera.y = event.clientY - rect.top - before.y * camera.zoom;
    applyCampaignCamera();
  }, { passive: false });
}

function zoomArsenal(factor, viewportX, viewportY) {
  const camera = state.arsenalCamera;
  const previousZoom = camera.zoom;
  const nextZoom = clamp(previousZoom * factor, 0.36, 1.75);
  const worldX = (viewportX - camera.x) / previousZoom;
  const worldY = (viewportY - camera.y) / previousZoom;
  camera.zoom = nextZoom;
  camera.x = viewportX - worldX * nextZoom;
  camera.y = viewportY - worldY * nextZoom;
}

function applyArsenalCamera() {
  const content = ui.arsenalGrid.querySelector(".tech-content");
  if (!content) {
    return;
  }

  const camera = state.arsenalCamera;
  const gridWidth = ui.arsenalGrid.clientWidth;
  const gridHeight = ui.arsenalGrid.clientHeight;
  const scaledWidth = content.offsetWidth * camera.zoom;
  const scaledHeight = content.offsetHeight * camera.zoom;
  const minX = Math.min(120, gridWidth - scaledWidth - 120);
  const minY = Math.min(120, gridHeight - scaledHeight - 120);
  camera.x = clamp(camera.x, minX, 120);
  camera.y = clamp(camera.y, minY, 120);
  const snappedX = Math.round(camera.x * 2) / 2;
  const snappedY = Math.round(camera.y * 2) / 2;
  const snappedZoom = Math.round(camera.zoom * 1000) / 1000;
  content.style.transform = `translate3d(${snappedX}px, ${snappedY}px, 0) scale(${snappedZoom})`;

  const label = document.getElementById("techZoomLabel");
  if (label) {
    label.textContent = `${Math.round(camera.zoom * 100)}%`;
  }
}

function fitArsenalCamera() {
  const content = ui.arsenalGrid.querySelector(".tech-content");
  if (!content) {
    return;
  }

  const camera = state.arsenalCamera;
  const horizontalPadding = 84;
  const verticalPadding = 76;
  const fitX = (ui.arsenalGrid.clientWidth - horizontalPadding) / content.offsetWidth;
  const fitY = (ui.arsenalGrid.clientHeight - verticalPadding) / content.offsetHeight;
  camera.zoom = clamp(Math.min(fitX, fitY), 0.36, 1.02);
  camera.x = Math.round((ui.arsenalGrid.clientWidth - content.offsetWidth * camera.zoom) / 2);
  camera.y = Math.round((ui.arsenalGrid.clientHeight - content.offsetHeight * camera.zoom) / 2);
}

function isArsenalItemUnlocked(item) {
  if (item.unlocked || item.id === "plasmaCore") {
    return true;
  }
  if (item.unlockAt && profile.completedMaps < item.unlockAt) {
    return false;
  }
  return item.parents.every(parentId => hasUpgrade(parentId));
}

function buyArsenalItem(item) {
  if (item.future || !isArsenalItemUnlocked(item) || hasUpgrade(item.id) || profile.medals < item.cost) {
    return;
  }

  profile.medals -= item.cost;
  profile.purchased[item.id] = true;
  saveProfile();
  buildArsenal();
  buildTowerBar();
}

function buildMapList() {
  const map = currentMap();
  const difficulty = currentDifficulty();
  const endlessVariant = endlessVariantDefinitions.find(item => item.id === state.endlessVariantId) || endlessVariantDefinitions[0];
  ui.selectedMapKicker.textContent = state.runMode === "endless" ? "Endless Arena Select" : "Campaign Command";
  ui.selectedMapName.textContent = state.runMode === "endless" ? "Choose Arena" : `${difficulty.name} Campaign`;

  if (state.runMode === "endless") {
    ui.selectedMapReward.innerHTML = `${endlessVariant.name}. ${endlessVariant.text}<div class="endless-map-list">${buildEndlessMapCards(endlessVariant)}</div>`;
    bindEndlessMapCards();
  } else {
    ui.selectedMapReward.textContent = `Difficulty reward: ${difficulty.reward}. Press Play to enter the planet campaign map.`;
  }
}

function buildEndlessMapCards(endlessVariant) {
  return mapDefinitions.map(map => {
    const unlocked = true;
    const scoreKey = `${endlessVariant.scoreKey}_${map.id}`;
    const score = profile[scoreKey] || 0;
    return `
      <button class="endless-map-card ${state.selectedMapId === map.id ? "active" : ""} ${unlocked ? "" : "locked"}" data-map-id="${map.id}" ${unlocked ? "" : "disabled"}>
        <b>${map.name}</b>
        <span>${unlocked ? `Max score: ${score}` : "Locked by campaign progress."}</span>
      </button>
    `;
  }).join("");
}

function bindEndlessMapCards() {
  ui.selectedMapReward.querySelectorAll(".endless-map-card").forEach(button => {
    button.addEventListener("click", () => {
      state.selectedMapId = button.dataset.mapId;
      buildMapList();
    });
  });
}

function syncResearchLabAccess() {
  const blocked = isRankedEndless();
  if (ui.arsenalButton) {
    ui.arsenalButton.disabled = blocked;
    ui.arsenalButton.textContent = blocked ? "Research Disabled" : "Research Lab";
    ui.arsenalButton.title = blocked
      ? "Ranked Endless uses draft-only progression. Research Lab bonuses are disabled."
      : "Open the Research Laboratory";
  }
}

function buildModeList() {
  syncResearchLabAccess();
  ui.modeList.innerHTML = "";
  modeDefinitions.forEach(mode => {
    const button = document.createElement("button");
    button.className = `mode-card ${state.runMode === mode.id ? "active" : ""}`;
    button.innerHTML = `<b>${mode.name}</b><span>${mode.text}</span>`;
    button.addEventListener("click", () => {
      state.runMode = mode.id;
      buildModeList();
      buildDifficultyList();
      buildMapList();
    });
    ui.modeList.appendChild(button);
  });
}

function buildDifficultyList() {
  syncResearchLabAccess();
  ui.difficultyList.innerHTML = "";
  ui.difficultyList.classList.toggle("endless-variants", state.runMode === "endless");

  if (state.runMode === "endless") {
    endlessVariantDefinitions.forEach(variant => {
      const button = document.createElement("button");
      button.className = `difficulty-card endless-card ${state.endlessVariantId === variant.id ? "active" : ""}`;
      button.innerHTML = `<b>${variant.name}</b><span>${variant.text}<br>Max score: ${profile[variant.scoreKey] || 0}</span>`;
      button.addEventListener("click", () => {
        state.endlessVariantId = variant.id;
        buildDifficultyList();
        buildMapList();
      });
      ui.difficultyList.appendChild(button);
    });
    return;
  }

  difficultyDefinitions.forEach((difficulty, index) => {
    const unlocked = profile.completedDifficulties >= difficulty.unlockAt;
    const button = document.createElement("button");
    button.className = `difficulty-card ${state.selectedDifficultyId === difficulty.id ? "active" : ""} ${unlocked ? "" : "locked"}`;
    button.disabled = !unlocked;
    button.innerHTML = `<b>${difficulty.name}</b><span>${unlocked ? difficulty.reward : "Complete previous difficulty to unlock."}</span>`;
    button.addEventListener("click", () => {
      state.selectedDifficultyId = difficulty.id;
      buildDifficultyList();
      buildMapList();
    });
    ui.difficultyList.appendChild(button);

    if (!unlocked && state.selectedDifficultyId === difficulty.id) {
      state.selectedDifficultyId = difficultyDefinitions[Math.max(0, index - 1)].id;
    }
  });
}

function resetRun() {
  state.stability = 100;
  state.coins = 140 + (hasUpgrade("startingCapital") ? 25 : 0);
  state.biomass = 0;
  state.medals = 0;
  state.score = 0;
  state.wave = 0;
  state.speed = 1;
  state.runningWave = false;
  state.runEnded = false;
  state.paused = false;
  state.baseOverlayOpen = false;
  state.selectedTowerId = "plasma";
  state.deleteMode = false;
  state.inspectorTimer = 0;
  state.refineryCapacityBonus = 0;
  state.runPerks = {};
  state.selectedPlacedTower = null;
  state.baseHitPulse = 0;
  state.pendingTechCore = null;
  state.pendingDraftAfterCore = null;
  state.towers = [];
  state.enemies = [];
  state.projectiles = [];
  state.spawnQueue = [];
  state.spawnTimer = 0;
  state.autoStartTimer = 0;
  state.purchaseCounts = {};
  state.runUnlockedTowers = initialRunTowerBlueprints();
  state.modifiers = {
    range: 1,
    cost: 1,
    rewards: hasUpgrade("salvageProtocol") ? 1.1 : 1,
    plasmaRate: 1,
    plasmaDamage: 0,
    slowDuration: 1,
    frostDamage: 1,
    chainDamage: 0,
    teslaOverheatCooldown: 1,
    sniperDamage: 0,
    sniperRate: 1,
    cannonDamage: 0,
    cannonRadius: 1,
    cannonBreachDuration: 1,
    cannonBreachBonus: 0,
    lateDamage: 0,
    coreDamage: 0,
    coreFireRate: 1,
    refineryRate: 1,
    refineryYield: 1
  };
  ui.speedToggle.textContent = "1x";
  ui.speedToggle.setAttribute("aria-pressed", "false");
  ui.perkModal.classList.add("hidden");
  ui.towerInspector.classList.add("hidden");
  ui.startWave.disabled = false;
  buildTowerBar();
  syncUI();
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const screenPoint = {
    x: ((event.clientX - rect.left) / rect.width) * WORLD.width,
    y: ((event.clientY - rect.top) / rect.height) * WORLD.height
  };
  return battleScreenPointToWorld(screenPoint);
}

canvas.addEventListener("pointermove", event => {
  const point = canvasPoint(event);
  Object.assign(state.placementGhost, point, { visible: Boolean(state.selectedTowerId) });
  if (state.deleteMode) {
    state.deleteHoverTower = findTowerAt(point);
    canvas.style.cursor = state.deleteHoverTower ? "pointer" : "crosshair";
  } else {
    state.deleteHoverTower = null;
    canvas.style.cursor = state.selectedTowerId ? "crosshair" : "default";
  }
});

canvas.addEventListener("pointerleave", () => {
  state.placementGhost.visible = false;
  state.deleteHoverTower = null;
  canvas.style.cursor = "default";
});

canvas.addEventListener("pointerdown", event => {
  placeTower(canvasPoint(event), { keepAction: event.ctrlKey });
});

ui.playButton.addEventListener("click", () => {
  if (state.runMode === "campaign") {
    setScreen("campaign");
    return;
  }

  startSelectedRun();
});
ui.arsenalButton.addEventListener("click", () => {
  if (isRankedEndless()) {
    return;
  }
  state.arsenalReturnScreen = "menu";
  setScreen("arsenal");
});
ui.backToMenuButton.addEventListener("click", () => setScreen(state.arsenalReturnScreen || "menu"));
ui.campaignBackButton.addEventListener("click", () => setScreen("menu"));
ui.campaignArsenalButton.addEventListener("click", () => {
  state.arsenalReturnScreen = "campaign";
  setScreen("arsenal");
});
ui.campaignStartButton.addEventListener("click", showCampaignIntro);
ui.resultMenuButton.addEventListener("click", () => {
  if (state.baseOverlayOpen) {
    completeRun("retreat");
    return;
  }
  setScreen(state.runMode === "campaign" ? "campaign" : "menu");
});
ui.resultReplayButton.addEventListener("click", () => {
  if (state.baseOverlayOpen) {
    resumeRun();
    return;
  }
  startSelectedRun();
});
ui.storyStartButton.addEventListener("click", () => {
  ui.storyModal.classList.add("hidden");
  startSelectedRun();
});
ui.storySkipButton.addEventListener("click", () => {
  ui.storyModal.classList.add("hidden");
});
ui.startWave.addEventListener("click", startWave);
ui.refineryButton.addEventListener("click", () => selectBuildOption("refinery"));
if (ui.deleteButton) ui.deleteButton.addEventListener("click", toggleDeleteMode);
ui.speedToggle.addEventListener("click", toggleSpeed);
ui.baseButton.addEventListener("click", returnToBase);

window.addEventListener("keydown", event => {
  const perkOpen = !ui.perkModal.classList.contains("hidden");
  if (event.code === "Escape") {
    event.preventDefault();
    if (state.baseOverlayOpen) {
      resumeRun();
      return;
    }
    clearActionState();
    clearInspector();
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    if (!perkOpen && state.screen === "game" && !state.runEnded && !state.baseOverlayOpen) {
      const noWaveActive = !state.runningWave && state.enemies.length === 0 && state.spawnQueue.length === 0;
      if (noWaveActive && !state.paused && !isDraftOpen()) {
        startWave();
      } else {
        togglePause();
      }
    }
    return;
  }

  if (event.code === "KeyF") {
    event.preventDefault();
    toggleSpeed();
    return;
  }

  if (event.code === "KeyX") {
    event.preventDefault();
    toggleDeleteMode();
    return;
  }

  const towerIds = Object.values(towerDefinitions).filter(definition => definition.kind !== "infrastructure" && isTowerAvailable(definition)).map(definition => definition.id);
  const numericIndex = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Numpad1", "Numpad2", "Numpad3", "Numpad4", "Numpad5", "Numpad6"].indexOf(event.code);
  const selectedIndex = numericIndex >= 0 ? numericIndex % 6 : -1;

  if (state.screen === "game" && selectedIndex >= 0 && selectedIndex < towerIds.length) {
    event.preventDefault();
    selectBuildOption(towerIds[selectedIndex]);
  }
});

function toggleSpeed() {
  state.speed = state.speed === 1 ? 2 : 1;
  ui.speedToggle.textContent = `${state.speed}x`;
  ui.speedToggle.setAttribute("aria-pressed", state.speed === 2 ? "true" : "false");
}

let lastTime = performance.now();
function frame(time) {
  const delta = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;
  update(delta);
  draw();
  requestAnimationFrame(frame);
}

buildTowerBar();
setScreen("menu");
syncUI();
requestAnimationFrame(frame);


function ensureHudRefs() {
  if (ui.gameHud) {
    return;
  }
  Object.assign(ui, {
    gameHud: document.getElementById("gameHud"),
    integrityFill: document.getElementById("integrityFill"),
    refineryStatus: document.getElementById("refineryStatus"),
    waveTotal: document.getElementById("waveTotal"),
    nextWaveTimer: document.getElementById("nextWaveTimer"),
    upcomingEnemies: document.getElementById("upcomingEnemies"),
    bossCounter: document.getElementById("bossCounter"),
    pauseButton: document.getElementById("pauseButton"),
    battleLogList: document.getElementById("battleLogList"),
    coreStorage: document.getElementById("coreStorage")
  });
}

function svgData(svg) {
  if (!hudIconCache.has(svg)) {
    hudIconCache.set(svg, `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
  }
  return hudIconCache.get(svg);
}

function towerThumbSvg(towerId) {
  const map = {
    plasma: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7eaff"/><stop offset="0.5" stop-color="#55738f"/><stop offset="1" stop-color="#1c2733"/></linearGradient></defs><rect x="18" y="52" width="60" height="22" rx="6" fill="#263242"/><rect x="24" y="58" width="48" height="10" rx="3" fill="url(#g)"/><circle cx="48" cy="49" r="15" fill="#1b2430"/><rect x="36" y="30" width="24" height="16" rx="5" fill="#3b4d61"/><rect x="30" y="18" width="12" height="22" rx="5" fill="url(#g)"/><rect x="54" y="18" width="12" height="22" rx="5" fill="url(#g)"/><circle cx="36" cy="18" r="6" fill="#6fd9ff"/><circle cx="60" cy="18" r="6" fill="#6fd9ff"/></svg>`,
    frost: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e7fbff"/><stop offset="0.5" stop-color="#64839d"/><stop offset="1" stop-color="#1f2a38"/></linearGradient></defs><rect x="18" y="50" width="60" height="24" rx="7" fill="#243240"/><circle cx="48" cy="42" r="18" fill="#32465a"/><circle cx="48" cy="42" r="12" fill="#6adfff" opacity="0.35"/><rect x="46" y="30" width="4" height="24" rx="2" fill="#bff4ff"/><rect x="36" y="40" width="24" height="4" rx="2" fill="#bff4ff"/><path d="M39 33l18 18M57 33L39 51" stroke="#bff4ff" stroke-width="3" stroke-linecap="round"/></svg>`,
    sniper: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8e6f6"/><stop offset="0.5" stop-color="#60758d"/><stop offset="1" stop-color="#202b36"/></linearGradient></defs><rect x="16" y="55" width="64" height="20" rx="6" fill="#253140"/><rect x="30" y="46" width="36" height="10" rx="4" fill="#1a2230"/><circle cx="48" cy="45" r="12" fill="#2f4051"/><rect x="38" y="24" width="20" height="18" rx="4" fill="url(#g)"/><rect x="46" y="10" width="7" height="30" rx="3" fill="#1b2530"/><rect x="48" y="6" width="3" height="8" rx="1.5" fill="#7fd7ff"/></svg>`,
    tesla: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9e6ef"/><stop offset="0.48" stop-color="#65788b"/><stop offset="1" stop-color="#27323e"/></linearGradient><radialGradient id="o"><stop offset="0" stop-color="#ffffff"/><stop offset="0.28" stop-color="#8beaff"/><stop offset="1" stop-color="#2777cc"/></radialGradient></defs><rect x="17" y="54" width="62" height="23" rx="7" fill="#25313d"/><rect x="25" y="60" width="46" height="10" rx="3" fill="url(#g)"/><rect x="37" y="35" width="22" height="24" rx="6" fill="#33465a"/><circle cx="61" cy="28" r="13" fill="url(#o)"/><path d="M41 28l8-11M54 18l5 7M46 31l-7 8M65 35l8 7" stroke="#8deaff" stroke-width="3" stroke-linecap="round"/><circle cx="61" cy="28" r="18" fill="none" stroke="#8deaff" stroke-width="2" opacity=".45"/></svg>`,
    cannon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d5d8dc"/><stop offset="0.45" stop-color="#747b82"/><stop offset="1" stop-color="#252a2f"/></linearGradient></defs><rect x="14" y="55" width="68" height="23" rx="7" fill="#252a2f"/><rect x="20" y="61" width="56" height="10" rx="3" fill="url(#g)"/><ellipse cx="44" cy="48" rx="20" ry="12" fill="#343a40"/><rect x="34" y="32" width="30" height="22" rx="6" fill="url(#g)"/><rect x="54" y="36" width="30" height="12" rx="6" fill="#40464d"/><circle cx="82" cy="42" r="7" fill="#20252a" stroke="#f4a62f" stroke-width="3"/><rect x="27" y="67" width="20" height="3" rx="1.5" fill="#ffad35"/></svg>`,
    refinery: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8e8e2"/><stop offset="0.5" stop-color="#718a80"/><stop offset="1" stop-color="#26372f"/></linearGradient></defs><rect x="15" y="57" width="66" height="20" rx="7" fill="#27372f"/><rect x="23" y="31" width="20" height="34" rx="6" fill="url(#g)"/><rect x="52" y="23" width="18" height="42" rx="6" fill="url(#g)"/><rect x="58" y="12" width="6" height="15" rx="3" fill="#3a5147"/><circle cx="33" cy="47" r="7" fill="#75d8a8" opacity=".7"/><circle cx="61" cy="42" r="6" fill="#8ee9bd" opacity=".8"/></svg>`
  };
  return map[towerId] || map.plasma;
}

function evolutionThumbSvg(towerId, evolutionId) {
  const key = `${towerId}:${evolutionId}`;
  const map = {
    "plasma:repeater": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72"><rect x="18" y="42" width="84" height="18" rx="6" fill="#243140"/><circle cx="60" cy="40" r="17" fill="#1a2430"/><rect x="30" y="17" width="14" height="30" rx="5" fill="#5e83a1"/><rect x="53" y="12" width="14" height="35" rx="5" fill="#6d92af"/><rect x="76" y="17" width="14" height="30" rx="5" fill="#5e83a1"/><circle cx="37" cy="16" r="6" fill="#73dcff"/><circle cx="60" cy="11" r="6" fill="#73dcff"/><circle cx="83" cy="16" r="6" fill="#73dcff"/></svg>`,
    "plasma:fusion": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72"><rect x="18" y="43" width="84" height="17" rx="6" fill="#243140"/><circle cx="60" cy="37" r="24" fill="#1a2430"/><circle cx="60" cy="32" r="16" fill="#75ddff"/><path d="M60 8v10M35 18l8 8M85 18l-8 8" stroke="#8ce6ff" stroke-width="4" stroke-linecap="round"/></svg>`,
    "frost:cryoField": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72"><circle cx="60" cy="36" r="29" fill="#1d3445"/><circle cx="60" cy="36" r="25" fill="none" stroke="#64dcff" stroke-width="4" opacity=".55"/><circle cx="60" cy="36" r="17" fill="#78e5ff" opacity=".22"/><path d="M60 17v38M43 26l34 20M77 26L43 46" stroke="#d9f8ff" stroke-width="4" stroke-linecap="round"/></svg>`,
    "frost:shatterCore": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72"><path d="M60 8l20 23-8 31H48L40 31 60 8z" fill="#67dfff"/><path d="M60 11l-4 21 13 6-17 19M41 31l15 1M69 38l10-7" stroke="#123448" stroke-width="3" fill="none"/></svg>`,
    "sniper:penetrator": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72"><rect x="14" y="43" width="92" height="17" rx="5" fill="#263342"/><rect x="24" y="29" width="54" height="15" rx="5" fill="#60758d"/><rect x="72" y="32" width="39" height="8" rx="4" fill="#1b2631"/><path d="M12 20h96" stroke="#7fe0ff" stroke-width="4" stroke-linecap="round"/><path d="M92 13l16 7-16 7" fill="none" stroke="#7fe0ff" stroke-width="4"/></svg>`,
    "sniper:executioner": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72"><circle cx="60" cy="35" r="26" fill="#202a36"/><circle cx="60" cy="35" r="19" fill="none" stroke="#d98aaf" stroke-width="4"/><circle cx="60" cy="35" r="6" fill="#f1c3d8"/><path d="M60 5v15M60 50v17M30 35h15M75 35h15" stroke="#f0bad2" stroke-width="4"/></svg>`,
    "tesla:arcNode": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72"><circle cx="28" cy="36" r="11" fill="#4d91c9"/><circle cx="60" cy="20" r="11" fill="#7cdff5"/><circle cx="92" cy="38" r="11" fill="#4d91c9"/><circle cx="61" cy="55" r="9" fill="#3277ad"/><path d="M36 32l16-8M69 23l15 10M86 45l-17 7M53 51L35 41" stroke="#d5f7ff" stroke-width="4"/></svg>`,
    "tesla:stormSpire": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72"><rect x="34" y="51" width="52" height="12" rx="5" fill="#293643"/><path d="M60 8l19 44H41L60 8z" fill="#477ca3"/><circle cx="60" cy="25" r="10" fill="#b8f4ff" opacity=".6"/><path d="M65 8L51 31h11l-9 26 25-33H65l8-16z" fill="#e8fbff"/></svg>`,
    "cannon:clusterShells": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72"><circle cx="40" cy="36" r="14" fill="#f2a83d"/><circle cx="67" cy="23" r="8" fill="#ffc66b"/><circle cx="82" cy="45" r="10" fill="#d9832f"/><path d="M18 58h84" stroke="#5b636c" stroke-width="8"/><path d="M37 10l5 12M74 8l-3 11M99 24l-12 6" stroke="#ffd08a" stroke-width="4"/></svg>`,
    "cannon:siegeChamber": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72"><rect x="18" y="43" width="84" height="18" rx="6" fill="#2b3035"/><rect x="28" y="24" width="48" height="24" rx="7" fill="#747b82"/><rect x="67" y="29" width="38" height="14" rx="7" fill="#3d4349"/><circle cx="103" cy="36" r="10" fill="#1e2328" stroke="#ffad35" stroke-width="4"/><rect x="34" y="31" width="22" height="5" rx="2" fill="#ffad35"/></svg>`
  };
  return map[key] || towerThumbSvg(towerId);
}

function enemyThumbSvg(type) {
  const map = {
    rush: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><radialGradient id="g" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#ffe6c8"/><stop offset="0.35" stop-color="#d95f63"/><stop offset="1" stop-color="#28161b"/></radialGradient></defs><ellipse cx="40" cy="40" rx="20" ry="12" fill="url(#g)"/><path d="M24 40h32M31 31l18 18" stroke="#f39752" stroke-width="4" stroke-linecap="round"/></svg>`,
    van: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9d7bf"/><stop offset="0.35" stop-color="#7a5c68"/><stop offset="1" stop-color="#1e171a"/></linearGradient></defs><rect x="20" y="20" width="40" height="30" rx="7" fill="url(#g)"/><rect x="24" y="31" width="32" height="6" rx="3" fill="#f2bc64" opacity="0.5"/><path d="M24 20l8-8h16l8 8" fill="#59404a"/></svg>`,
    courier: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f0dc"/><stop offset="0.35" stop-color="#8f9ad6"/><stop offset="1" stop-color="#171b28"/></linearGradient></defs><path d="M40 16L58 35 48 56H32L22 35 40 16z" fill="url(#g)"/><path d="M40 34l18-10M40 34L22 24" stroke="#bfe9f2" stroke-width="4" stroke-linecap="round"/></svg>`,
    breaker: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><radialGradient id="g" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#f8f0db"/><stop offset="0.35" stop-color="#6aa889"/><stop offset="1" stop-color="#15211d"/></radialGradient></defs><circle cx="40" cy="40" r="18" fill="url(#g)"/><path d="M28 36l24 8M38 26l4 28" stroke="#9bd7b6" stroke-width="4" stroke-linecap="round"/></svg>`,
    shield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef6ff"/><stop offset="0.35" stop-color="#5aa7d8"/><stop offset="1" stop-color="#14212c"/></linearGradient></defs><rect x="24" y="18" width="32" height="40" rx="10" fill="url(#g)"/><circle cx="40" cy="40" r="24" fill="none" stroke="#9fd7ff" stroke-width="4" opacity="0.45"/></svg>`,
    burrower: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><radialGradient id="g" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#f8e7f2"/><stop offset="0.35" stop-color="#a17394"/><stop offset="1" stop-color="#241720"/></radialGradient></defs><ellipse cx="40" cy="40" rx="19" ry="12" fill="url(#g)" transform="rotate(-15 40 40)"/><path d="M18 49c9 0 16 4 22 8" stroke="#e9cadd" stroke-width="4" stroke-linecap="round" opacity="0.8"/></svg>`,
    convoy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><radialGradient id="g" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff0e1"/><stop offset="0.35" stop-color="#aa819c"/><stop offset="1" stop-color="#241920"/></radialGradient></defs><circle cx="40" cy="40" r="22" fill="url(#g)"/><circle cx="40" cy="40" r="29" fill="none" stroke="#d95f63" stroke-width="4" opacity="0.45"/><path d="M27 40h26M40 27v26" stroke="#d95f63" stroke-width="4" stroke-linecap="round"/></svg>`
  };
  return map[type] || map.rush;
}

function upcomingGlyph(type) {
  const glyphs = {
    rush: "CR",
    van: "AB",
    courier: "SP",
    breaker: "SB",
    shield: "SC",
    burrower: "BW",
    convoy: "BT"
  };
  return glyphs[type] || "??";
}

function pushBattleLog(text, value = "", tone = "") {
  state.battleLog = state.battleLog || [];
  state.battleLog.unshift({ text, value, tone });
  state.battleLog = state.battleLog.slice(0, 3);
}

function renderBattleLog() {
  ensureHudRefs();
  if (!ui.battleLogList) {
    return;
  }
  const entries = state.battleLog || [];
  if (!entries.length) {
    ui.battleLogList.innerHTML = ``;
    return;
  }
  ui.battleLogList.innerHTML = entries.map(entry => `
    <div class="log-item ${entry.tone || ""}">
      <span>${entry.text}</span>
      <strong>${entry.value || ""}</strong>
    </div>
  `).join("");
}

function nextWaveLabel() {
  if (state.runEnded) {
    return "ENDED";
  }
  if (state.paused && !state.baseOverlayOpen && ui.perkModal.classList.contains("hidden")) {
    return "PAUSED";
  }
  if (state.runningWave) {
    return "IN PROGRESS";
  }
  if (state.autoStartTimer > 0) {
    return `${state.autoStartTimer.toFixed(1)}s`;
  }
  return "READY";
}

function displayedWaveNumber() {
  if (state.runEnded && state.runMode === "campaign") {
    return Math.max(1, Math.min(state.wave, currentMap().wavesToWin));
  }
  return Math.max(1, state.wave + 1);
}

function previewWaveGroups() {
  const offset = state.runningWave ? 1 : 0;
  return waves[(state.wave + offset) % waves.length] || [];
}

function wavesUntilBoss() {
  const start = state.runningWave ? state.wave + 1 : state.wave;
  for (let i = 0; i < waves.length * 2; i += 1) {
    const groups = waves[(start + i) % waves.length] || [];
    if (groups.some(group => enemyDefinitions[group.type]?.boss)) {
      return i + 1;
    }
  }
  return "-";
}

function renderUpcomingEnemies() {
  ensureHudRefs();
  if (!ui.upcomingEnemies) {
    return;
  }
  const groups = previewWaveGroups();
  const visibleCount = Math.max(1, groups.length);
  const availableWidth = Math.max(120, ui.upcomingEnemies.clientWidth || window.innerWidth * 0.21);
  const iconSize = clamp(Math.floor((availableWidth - Math.max(0, visibleCount - 1) * 6) / visibleCount), 18, 42);
  ui.upcomingEnemies.dataset.count = String(visibleCount);
  ui.upcomingEnemies.style.setProperty("--upcoming-count", String(visibleCount));
  ui.upcomingEnemies.style.setProperty("--enemy-icon-size", `${iconSize}px`);

  const signature = groups.map(group => `${group.type}:${group.count}`).join("|");
  if (hudRenderCache.upcoming !== signature) {
    hudRenderCache.upcoming = signature;
    ui.upcomingEnemies.innerHTML = groups.map(group => {
      const enemy = enemyDefinitions[group.type];
      return `
        <div class="upcoming-chip enemy-${group.type}" title="${enemy.name}">
          <img alt="${enemy.name}" src="${svgData(enemyThumbSvg(group.type))}">
          <span>${group.count}</span>
        </div>
      `;
    }).join("");
  }
  const bossIn = wavesUntilBoss();
  const bossText = `${bossIn} ${String(bossIn) === "1" ? "wave" : "waves"}`;
  if (ui.bossCounter && hudRenderCache.boss !== bossText) {
    hudRenderCache.boss = bossText;
    ui.bossCounter.textContent = bossText;
  }
}

function towerIconGlyph(definition) {
  const glyphs = {
    plasma: "PL",
    frost: "FR",
    sniper: "SN",
    tesla: "EL",
    cannon: "CN",
    refinery: "RF"
  };
  return glyphs[definition.id] || definition.slot;
}

function towerTargetLabel(definition) {
  if (definition.kind === "infrastructure") {
    return "AUTO";
  }
  if (definition.id === "frost") {
    return "AREA";
  }
  if (definition.id === "tesla") {
    return "CHAIN";
  }
  if (definition.id === "cannon") {
    return "SPLASH";
  }
  return "FIRST";
}

function buildTowerBar() {
  ensureHudRefs();
  ui.towerbar.innerHTML = "";
  Object.values(towerDefinitions)
    .filter(definition => definition.kind !== "infrastructure" && isTowerAvailable(definition))
    .forEach(definition => {
      const button = document.createElement("button");
      button.className = `tower-card ${definition.id === state.selectedTowerId ? "active" : ""}`;
      button.dataset.tower = definition.id;
      button.innerHTML = `
        <div class="tower-icon"><img alt="" src="${svgData(towerThumbSvg(definition.id))}"></div>
        <div class="tower-meta">
          <b>${definition.name}</b>
          <span>${towerCost(definition)}</span>
        </div>
      `;
      button.addEventListener("click", () => {
        selectBuildOption(definition.id);
        state.selectedPlacedTower = null;
        ui.towerInspector.classList.add("hidden");
      });
      ui.towerbar.appendChild(button);
    });
  syncBuildControls();
}

function buildTowerInspector() {
  ensureHudRefs();
  const tower = state.selectedPlacedTower;
  if (state.screen !== "game" || !tower) {
    ui.towerInspector.classList.remove("evolution-open");
    ui.towerInspector.classList.add("hidden");
    ui.towerInspector.innerHTML = "";
    return;
  }

  const definition = towerDefinitions[tower.id];
  const evolution = getTowerEvolutionDefinition(tower);
  const allEvolutionOptions = towerEvolutionDefinitions[tower.id] || [];
  const evolutionOptions = tower.level >= 3 && !tower.evolution
    ? allEvolutionOptions.filter(option => isEvolutionUnlockedByResearch(tower.id, option.id))
    : [];
  const hasLockedEvolutions = tower.level >= 3 && !tower.evolution && allEvolutionOptions.length > 0 && evolutionOptions.length === 0;
  const choosingEvolution = evolutionOptions.length > 0;
  const damage = definition.kind === "infrastructure"
    ? Math.round(refineryConversionRatePerSecond())
    : Math.round(damageForTower(definition, tower));
  const range = definition.kind === "infrastructure"
    ? maxRefineryCount()
    : Math.round(towerRange(definition, tower));
  const fireRate = definition.kind === "infrastructure"
    ? `${Math.round(refineryMaterialYield() * 100)}%`
    : `${fireIntervalForTower(definition, tower).toFixed(2)}s`;

  ui.towerInspector.classList.toggle("evolution-open", choosingEvolution);
  ui.towerInspector.innerHTML = `
    <div class="inspector-head compact-head">
      <div class="inspector-icon"><img alt="${definition.name}" src="${svgData(towerThumbSvg(definition.id))}"></div>
      <div>
        <div class="inspector-name">${definition.name}</div>
        <div class="inspector-subtitle">${definition.kind === "infrastructure" ? "ENGINEERING" : `LVL ${tower.level}${evolution ? ` - ${evolution.name}` : ""}`}</div>
      </div>
    </div>
    <div class="inspector-stats compact compact-grid">
      <div class="stat-item"><span>${definition.kind === "infrastructure" ? "Convert" : "Damage"}</span><strong>${damage}</strong></div>
      <div class="stat-item"><span>${definition.kind === "infrastructure" ? "Slots" : "Range"}</span><strong>${range}</strong></div>
      <div class="stat-item"><span>${definition.kind === "infrastructure" ? "Yield" : "Fire"}</span><strong>${fireRate}</strong></div>
      <div class="stat-item"><span>Target</span><strong>${towerTargetLabel(definition)}</strong></div>
    </div>
  `;

  const actionSlot = document.createElement("div");
  actionSlot.className = "inspector-fixed-action-slot";

  if (definition.kind === "infrastructure") {
    actionSlot.innerHTML = `
      <div class="active-evolution-status infrastructure-status">
        <img alt="Bio Refinery" src="${svgData(towerThumbSvg("refinery"))}">
        <div><b>Biomass Processing</b><span>Refinery is active.</span></div>
      </div>
    `;
  } else if (tower.level < 3) {
    const upgradeCost = towerUpgradeCost(definition, tower);
    const upgradeButton = document.createElement("button");
    upgradeButton.type = "button";
    upgradeButton.className = "tower-primary fixed-upgrade-button";
    upgradeButton.textContent = `Upgrade ${upgradeCost}`;
    upgradeButton.disabled = state.coins < upgradeCost;
    upgradeButton.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      upgradeTower(tower);
    });
    actionSlot.appendChild(upgradeButton);
  } else if (choosingEvolution) {
    const evolutionPanel = document.createElement("div");
    evolutionPanel.className = "inline-evolution-panel";
    evolutionPanel.innerHTML = `
      <div class="inline-evolution-heading">
        <b>Evolution Available</b>
        <span>Choose an evolution path</span>
      </div>
    `;

    const optionsGrid = document.createElement("div");
    optionsGrid.className = "inline-evolution-options";
    evolutionOptions.forEach(option => {
      const optionCard = document.createElement("div");
      optionCard.className = "inline-evolution-option";
      optionCard.innerHTML = `
        <img class="evolution-option-image" alt="${option.name}" src="${svgData(evolutionThumbSvg(tower.id, option.id))}">
        <b>${option.name}</b>
        <span>${option.text}</span>
      `;
      const chooseButton = document.createElement("button");
      chooseButton.type = "button";
      chooseButton.className = "inline-evolution-choose";
      chooseButton.textContent = "Choose Evolution";
      chooseButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        applyTowerEvolution(tower, option.id);
      });
      optionCard.appendChild(chooseButton);
      optionsGrid.appendChild(optionCard);
    });
    evolutionPanel.appendChild(optionsGrid);
    actionSlot.appendChild(evolutionPanel);
  } else if (hasLockedEvolutions) {
    actionSlot.innerHTML = `
      <div class="active-evolution-status evolution-bonus-card">
        <img alt="Research Lab" src="${svgData(towerThumbSvg(tower.id))}">
        <div class="evolution-bonus-copy">
          <b>Evolution Locked</b>
          <em>RESEARCH REQUIRED</em>
          <span>Unlock an evolution blueprint for this tower in the Research Lab.</span>
        </div>
      </div>
    `;
  } else if (evolution) {
    actionSlot.innerHTML = `
      <div class="active-evolution-status evolution-bonus-card">
        <img alt="${evolution.name}" src="${svgData(evolutionThumbSvg(tower.id, evolution.id))}">
        <div class="evolution-bonus-copy">
          <b>${evolution.name}</b>
          <em>EVOLUTION BONUS</em>
          <span>${evolution.text}</span>
        </div>
      </div>
    `;
  }

  ui.towerInspector.appendChild(actionSlot);
  state.inspectorTimer = 999;
  ui.towerInspector.classList.remove("hidden");
}

function syncUI() {
  ensureHudRefs();
  const maxIntegrity = 100;
  const integrityRatio = clamp(state.stability / maxIntegrity, 0, 1);
  ui.stability.textContent = `${Math.round(state.stability)} / ${maxIntegrity}`;
  ui.coins.textContent = Math.round(state.coins);
  ui.medals.textContent = state.biomass.toFixed(1);
  if (ui.integrityFill) {
    ui.integrityFill.style.width = `${integrityRatio * 100}%`;
  }
  if (ui.refineryStatus) {
    ui.refineryStatus.textContent = `${placedRefineryCount()} / ${maxRefineryCount()}`;
  }
  ui.wave.textContent = `${displayedWaveNumber()}`;
  if (ui.waveTotal) {
    ui.waveTotal.textContent = state.runMode === "campaign" ? `${currentMap().wavesToWin}` : "∞";
  }
  if (ui.nextWaveTimer) {
    ui.nextWaveTimer.textContent = nextWaveLabel();
  }
  if (ui.coreStorage) {
    ui.coreStorage.textContent = `${state.medals}`;
    const storagePanel = ui.coreStorage.closest(".core-card");
    const progress = storagePanel?.querySelector(".core-storage-progress");
    const stored = Math.min(3, Math.max(0, Math.floor(state.medals)));
    const progressLabel = progress?.querySelector("small");
    if (progressLabel) progressLabel.textContent = `${stored} / 3`;
    progress?.querySelectorAll("i").forEach((pip, index) => pip.classList.toggle("filled", index < stored));
  }
  if (ui.pauseButton) {
    ui.pauseButton.textContent = state.paused ? "▶" : "Ⅱ";
  }
  renderUpcomingEnemies();
  renderBattleLog();
  syncBuildControls();
}

function setScreen(screen) {
  ensureHudRefs();
  state.screen = screen;
  if (screen !== "game") {
    state.paused = false;
    state.baseOverlayOpen = false;
    state.baseHitPulse = 0;
  }
  ui.mainMenu.classList.toggle("hidden", screen !== "menu");
  ui.campaignScreen.classList.toggle("hidden", screen !== "campaign");
  ui.arsenalScreen.classList.toggle("hidden", screen !== "arsenal");
  ui.runResult.classList.add("hidden");

  const gameplayHidden = screen !== "game";
  if (ui.gameHud) {
    ui.gameHud.classList.toggle("hidden", gameplayHidden);
  }
  ui.towerInspector.classList.toggle("hidden", gameplayHidden || (!state.selectedPlacedTower && !state.selectedMapStructure));

  if (screen === "arsenal") {
    buildArsenal();
  } else if (screen === "campaign") {
    state.campaignBriefingOpen = false;
    buildCampaignMapV2();
  } else if (screen === "menu") {
    buildModeList();
    buildDifficultyList();
    buildMapList();
  } else if (screen === "game") {
    buildTowerBar();
    syncUI();
  }
}

function startWave() {
  if (state.screen !== "game" || state.runningWave || state.stability <= 0 || state.runEnded || state.paused || isDraftOpen()) {
    return;
  }

  const source = waves[state.wave % waves.length];
  const twinBreach = currentMap().id === "twinBreach";
  state.spawnQueue = [];
  let cursor = 0;
  let lane = state.wave % 2;
  source.forEach(group => {
    for (let index = 0; index < group.count; index += 1) {
      if (twinBreach && state.wave >= 3 && index % 7 === 4) {
        state.spawnQueue.push({ time: cursor, type: group.type, routeIndex: 0 });
        state.spawnQueue.push({ time: cursor, type: group.type, routeIndex: 1 });
        cursor += group.gap * 0.9;
      } else {
        state.spawnQueue.push({ time: cursor, type: group.type, routeIndex: twinBreach ? lane : 0 });
        if (twinBreach) lane = 1 - lane;
        cursor += group.gap;
      }
    }
    cursor += 1.1;
  });
  state.spawnQueue.sort((a, b) => a.time - b.time);
  state.spawnTimer = 0;
  state.autoStartTimer = 0;
  state.runningWave = true;
  ui.startWave.disabled = true;
  pushBattleLog(`Wave ${state.wave + 1} deployed`, "LIVE", "");
  syncUI();
}

function nextWaveDraft() {
  if (state.runMode === "endless") {
    if (state.wave % 10 === 0 && state.wave > 0) {
      return { type: "perks", title: "Commander Perk" };
    }
    return { type: "perks", title: "Wave Upgrade" };
  }
  return null;
}

function completeWave() {
  const completedWave = state.wave + 1;
  const biomassReward = (10 + completedWave * 2) / 10;
  state.runningWave = false;
  state.wave = completedWave;
  state.biomass += biomassReward;
  state.medals += state.wave % 5 === 0 ? 3 : 1;
  ui.startWave.disabled = false;
  pushBattleLog(`Wave ${completedWave} cleared`, `+${biomassReward}`, "");

  if (state.runMode === "campaign" && state.wave >= currentMap().wavesToWin) {
    completeRun(true);
    return;
  }
  if (state.selectedPlacedTower) {
    buildTowerInspector();
  }

  const nextDraft = nextWaveDraft();
  if (state.runMode === "campaign") {
    state.pendingTechCore = null;
    state.pendingDraftAfterCore = null;
  }
  if (state.pendingTechCore) {
    state.pendingDraftAfterCore = nextDraft;
    showTechCoreDraft(state.pendingTechCore);
    state.pendingTechCore = null;
    return;
  }

  if (nextDraft) {
    if (nextDraft.type === "towerUnlock") {
      showTowerUnlockChoices();
    } else {
      showPerks(nextDraft.title);
    }
  } else {
    queueNextWave();
  }
  syncUI();
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    enemy.phaseTimer += dt;

    if (enemy.slowTimer > 0) {
      enemy.slowTimer -= dt;
    } else {
      enemy.slowMultiplier = 1;
    }

    if ((enemy.breachTimer || 0) > 0) {
      enemy.breachTimer -= dt;
      if (enemy.breachTimer <= 0) {
        enemy.breachTimer = 0;
        enemy.breachFactor = 1;
        enemy.breachSlow = 1;
      }
    }

    let movementMultiplier = enemy.slowMultiplier;
    if ((enemy.breachTimer || 0) > 0) {
      movementMultiplier *= enemy.breachSlow || 1;
    }
    if (enemy.burrower && Math.sin(enemy.phaseTimer * 3.4 + enemy.progress * 24) > 0.72) {
      movementMultiplier = Math.max(1.45, movementMultiplier * 2.2);
      enemy.slowMultiplier = 1;
    }
    if (enemy.boss && enemy.hp < enemy.maxHp * 0.5) {
      movementMultiplier *= 1.18;
    }

    enemy.progress += (enemy.speed * movementMultiplier * dt) / Math.max(1, currentPathLength(enemy.routeIndex || 0));
    enemy.pos = samplePath(enemy.progress, enemy.routeIndex || 0);
  }

  for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
    const enemy = state.enemies[index];
    if (enemy.hp <= 0) {
      const killingTower = enemy.lastHitTower;
      if (killingTower && state.towers.includes(killingTower)) {
        gainTowerExperience(killingTower, towerExperienceReward(enemy));
      }
      const biomass = Math.max(0.1, enemy.reward * state.modifiers.rewards / 10);
      state.biomass += biomass;
      if (enemy.boss) {
        const coreReward = hasUpgrade("bossSalvage") ? 4 : 2;
        state.medals += coreReward;
        state.pendingTechCore = state.runMode === "endless" ? generateBossTechCore(enemy) : null;
        if (typeof pushBattleLog === "function") {
          pushBattleLog("Boss defeated", `+${coreReward}`, "core");
          pushBattleLog("Received Tech Core", "+1", "core");
        }
      }
      if (enemy.splitsInto && enemy.splitDepth < 1) {
        spawnSplitFragments(enemy);
      }
      state.score += biomass * 10;
      state.enemies.splice(index, 1);
      if (state.selectedPlacedTower) {
        buildTowerInspector();
      }
    } else if (enemy.progress >= 1) {
      state.stability = Math.max(0, state.stability - enemy.damage);
      state.baseHitPulse = 1.25;
      state.enemies.splice(index, 1);
      if (state.stability <= 0) {
        completeRun(false);
      }
    }
  }
}

function togglePause() {
  ensureHudRefs();
  if (state.screen !== "game" || state.runEnded || isDraftOpen() || state.baseOverlayOpen) {
    return;
  }
  state.paused = !state.paused;
  syncUI();
}

function drawBaseHitOverlay(hit) {
  if (hit <= 0.01) {
    return;
  }
  context.save();
  context.globalAlpha = hit * 0.18;
  const vignette = context.createRadialGradient(WORLD.width * 0.76, WORLD.height * 0.62, 60, WORLD.width * 0.76, WORLD.height * 0.62, 640);
  vignette.addColorStop(0, "rgba(255,92,72,0.02)");
  vignette.addColorStop(0.55, "rgba(255,70,55,0.08)");
  vignette.addColorStop(1, "rgba(175,20,28,0.58)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  context.globalAlpha = hit * 0.12;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  context.restore();
}

function drawReactorBase() {
  const end = activeBasePoint();
  const hit = clamp(state.baseHitPulse || 0, 0, 1);
  const integrity = clamp(state.stability / 100, 0, 1);
  const now = performance.now();
  const pulse = 0.56 + 0.44 * Math.sin(now * 0.0045);
  const alarm = hit > 0.02 || integrity < 0.35;
  const alarmPulse = alarm ? 0.55 + 0.45 * Math.sin(now * 0.015) : 0;

  context.save();
  context.translate(end.x, end.y + (currentMap().id === "twinBreach" ? -18 : -10));

  context.fillStyle = "rgba(7,10,16,0.48)";
  context.beginPath();
  context.ellipse(0, 32, 78, 24, 0, 0, Math.PI * 2);
  context.fill();

  const floorGradient = context.createLinearGradient(-64, -48, 64, 56);
  floorGradient.addColorStop(0, "#edf3f7");
  floorGradient.addColorStop(0.24, "#b6c0ca");
  floorGradient.addColorStop(0.62, "#66717d");
  floorGradient.addColorStop(1, "#27303a");
  drawPlasmaSquareBase(0, 10, 52, 36, floorGradient, "rgba(102,222,255,0.22)");

  const octGradient = context.createLinearGradient(-30, -30, 30, 30);
  octGradient.addColorStop(0, "#eef3f7");
  octGradient.addColorStop(0.26, "#c6cfd8");
  octGradient.addColorStop(0.62, "#6f7b87");
  octGradient.addColorStop(1, "#303844");
  context.fillStyle = octGradient;
  context.beginPath();
  context.moveTo(-18, -30);
  context.lineTo(18, -30);
  context.lineTo(30, -18);
  context.lineTo(30, 18);
  context.lineTo(18, 30);
  context.lineTo(-18, 30);
  context.lineTo(-30, 18);
  context.lineTo(-30, -18);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(236,242,246,0.16)";
  context.lineWidth = 1.1;
  context.stroke();

  context.strokeStyle = "rgba(28,33,40,0.34)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(-18, -20);
  context.lineTo(-18, 20);
  context.moveTo(18, -20);
  context.lineTo(18, 20);
  context.moveTo(0, -30);
  context.lineTo(0, 30);
  context.moveTo(-20, -12);
  context.lineTo(20, -12);
  context.moveTo(-20, 0);
  context.lineTo(20, 0);
  context.moveTo(-20, 12);
  context.lineTo(20, 12);
  context.stroke();

  const sidePodGradient = context.createLinearGradient(-6, -8, 6, 8);
  sidePodGradient.addColorStop(0, "#eef3f7");
  sidePodGradient.addColorStop(0.3, "#bcc6cf");
  sidePodGradient.addColorStop(0.7, "#6c7887");
  sidePodGradient.addColorStop(1, "#2d3641");
  [[-30, -8], [30, -8], [-30, 8], [30, 8]].forEach(([x, y]) => {
    context.fillStyle = sidePodGradient;
    context.beginPath();
    context.roundRect(x - 4.5, y - 8.5, 9, 17, 3);
    context.fill();
    context.strokeStyle = "rgba(236,242,246,0.1)";
    context.stroke();
    context.fillStyle = alarm ? `rgba(255,122,96,${0.3 + alarmPulse * 0.3})` : `rgba(98,225,255,${0.26 + pulse * 0.18})`;
    context.beginPath();
    context.roundRect(x - 1.2, y - 2.2, 2.4, 6.8, 1);
    context.fill();
  });

  const miniTowerGradient = context.createLinearGradient(-8, -10, 8, 10);
  miniTowerGradient.addColorStop(0, "#eef3f7");
  miniTowerGradient.addColorStop(0.35, "#b8c2cc");
  miniTowerGradient.addColorStop(0.72, "#6b7784");
  miniTowerGradient.addColorStop(1, "#303944");
  [[-34, -22], [34, -22], [-34, 22], [34, 22]].forEach(([x, y]) => {
    context.fillStyle = miniTowerGradient;
    context.beginPath();
    context.moveTo(x - 4.5, y + 7);
    context.lineTo(x - 4.5, y - 1);
    context.lineTo(x - 2, y - 8);
    context.lineTo(x + 2, y - 8);
    context.lineTo(x + 4.5, y - 1);
    context.lineTo(x + 4.5, y + 7);
    context.lineTo(x + 2, y + 10);
    context.lineTo(x - 2, y + 10);
    context.closePath();
    context.fill();
    context.strokeStyle = "rgba(236,242,246,0.12)";
    context.stroke();
    context.fillStyle = alarm ? `rgba(255,122,96,${0.26 + alarmPulse * 0.28})` : `rgba(98,225,255,${0.22 + pulse * 0.16})`;
    context.beginPath();
    context.roundRect(x - 0.9, y - 1.2, 1.8, 5.8, 0.8);
    context.fill();
  });

  context.fillStyle = "rgba(10,14,20,0.52)";
  context.beginPath();
  context.ellipse(0, 4, 24, 12.5, 0, 0, Math.PI * 2);
  context.fill();
  const ringGradient = context.createRadialGradient(0, 0, 2, 0, 3, 28);
  ringGradient.addColorStop(0, "#8d99a5");
  ringGradient.addColorStop(0.48, "#46525e");
  ringGradient.addColorStop(1, "#1b232d");
  context.fillStyle = ringGradient;
  context.beginPath();
  context.ellipse(0, 2, 22, 11, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(194,224,235,0.18)";
  context.lineWidth = 1.3;
  context.stroke();

  context.fillStyle = "rgba(16,23,31,0.95)";
  context.beginPath();
  context.roundRect(-7.5, 18, 15, 4.6, 1.5);
  context.fill();
  context.fillStyle = `rgba(99,217,255,${0.18 + pulse * 0.15})`;
  context.beginPath();
  context.roundRect(-5.4, 19.3, 10.8, 2, 1);
  context.fill();

  context.fillStyle = alarm ? `rgba(255,116,90,${0.3 + alarmPulse * 0.42})` : `rgba(76,219,255,${0.3 + pulse * 0.22})`;
  context.shadowColor = alarm ? `rgba(255,84,60,${0.9 * alarmPulse})` : "rgba(69,220,255,0.92)";
  context.shadowBlur = 15;
  for (let i = 0; i < 3; i += 1) {
    context.beginPath();
    context.ellipse(0, -15 + i * 7, 8.3 - i * 0.6, 2.3, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.shadowBlur = 0;

  const coreGradient = context.createRadialGradient(0, -34, 1, 0, -34, 18);
  coreGradient.addColorStop(0, "rgba(248,254,255,0.99)");
  coreGradient.addColorStop(0.24, alarm ? "rgba(255,140,115,0.94)" : "rgba(130,239,255,0.98)");
  coreGradient.addColorStop(0.68, alarm ? "rgba(255,78,58,0.6)" : "rgba(42,146,235,0.64)");
  coreGradient.addColorStop(1, "rgba(10,20,34,0.02)");
  context.fillStyle = coreGradient;
  context.shadowColor = alarm ? `rgba(255,82,58,${0.9 * alarmPulse})` : "rgba(63,218,255,0.88)";
  context.shadowBlur = 24;
  context.beginPath();
  context.arc(0, -34, 10 + pulse, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  context.strokeStyle = alarm ? "rgba(255,124,96,0.76)" : "rgba(106,229,255,0.78)";
  context.lineWidth = 1.8;
  [[-10, -18], [10, -18], [-14, -8], [14, -8], [-18, 2], [18, 2]].forEach(([x, y], idx) => {
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x * 0.42, y - 5.2);
    context.lineTo(idx % 2 === 0 ? -2 : 2, -25);
    context.lineTo(0, -34);
    context.stroke();
  });

  context.strokeStyle = alarm ? `rgba(255,118,92,${0.28 + alarmPulse * 0.34})` : `rgba(117,235,255,${0.24 + pulse * 0.22})`;
  context.lineWidth = 1.7;
  for (let ring = 0; ring < 3; ring += 1) {
    const phase = now * 0.0019 + ring * 2.05;
    context.beginPath();
    context.arc(0, -8, 11 + ring * 4, phase, phase + 1.02);
    context.stroke();
  }

  const accentColor = alarm ? `rgba(255,126,98,${0.28 + alarmPulse * 0.26})` : `rgba(99,217,255,${0.24 + pulse * 0.18})`;
  context.fillStyle = accentColor;
  [[-10, -3], [10, -3], [-10, 9], [10, 9], [-4.2, -22], [4.2, -22], [-4.2, 20], [4.2, 20]].forEach(([x, y]) => {
    context.beginPath();
    context.roundRect(x - 1.2, y - 0.8, 2.4, 1.6, 0.6);
    context.fill();
  });

  if (hit > 0.02) {
    context.globalAlpha = Math.min(1, hit * 1.16);
    context.fillStyle = "rgba(255,78,60,0.14)";
    context.beginPath();
    context.arc(0, -2, 60 + hit * 22, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255,92,72,0.95)";
    context.lineWidth = 3.5;
    context.beginPath();
    context.arc(0, -2, 30 + hit * 10, 0, Math.PI * 2);
    context.stroke();
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255,185,171,0.8)";
    context.beginPath();
    context.arc(0, -2, 44 + hit * 16, 0, Math.PI * 2);
    context.stroke();
  }

  context.restore();
}

function resetRun() {
  ensureHudRefs();
  state.stability = 100;
  state.coins = 140 + (hasUpgrade("startingCapital") ? 25 : 0);
  state.biomass = 0;
  state.medals = 0;
  state.score = 0;
  state.wave = 0;
  state.speed = 1;
  state.runningWave = false;
  state.runEnded = false;
  state.paused = false;
  state.baseOverlayOpen = false;
  state.selectedTowerId = "plasma";
  state.deleteMode = false;
  state.deleteHoverTower = null;
  state.inspectorTimer = 0;
  state.refineryCapacityBonus = 0;
  state.runPerks = {};
  state.selectedPlacedTower = null;
  state.baseHitPulse = 0;
  state.pendingTechCore = null;
  state.pendingDraftAfterCore = null;
  state.towers = [];
  state.enemies = [];
  state.projectiles = [];
  state.spawnQueue = [];
  state.spawnTimer = 0;
  state.autoStartTimer = 0;
  state.purchaseCounts = {};
  state.runUnlockedTowers = initialRunTowerBlueprints();
  state.battleLog = [];
  hudRenderCache.upcoming = "";
  hudRenderCache.boss = "";
  state.modifiers = {
    range: 1,
    cost: 1,
    rewards: hasUpgrade("salvageProtocol") ? 1.1 : 1,
    plasmaRate: 1,
    plasmaDamage: 0,
    slowDuration: 1,
    frostDamage: 1,
    chainDamage: 0,
    teslaOverheatCooldown: 1,
    sniperDamage: 0,
    sniperRate: 1,
    cannonDamage: 0,
    cannonRadius: 1,
    cannonBreachDuration: 1,
    cannonBreachBonus: 0,
    lateDamage: 0,
    coreDamage: 0,
    coreFireRate: 1,
    refineryRate: 1,
    refineryYield: 1
  };
  pushBattleLog("Reactor online", "READY", "");
  ui.speedToggle.textContent = "1x";
  ui.speedToggle.setAttribute("aria-pressed", "false");
  ui.perkModal.classList.add("hidden");
  ui.towerInspector.classList.add("hidden");
  ui.startWave.disabled = false;
  buildTowerBar();
  syncUI();
}

ensureHudRefs();
if (ui.pauseButton && !ui.pauseButton.dataset.bound) {
  ui.pauseButton.dataset.bound = "1";
  ui.pauseButton.addEventListener("click", togglePause);
}



function isLargeEnemy(enemy) {
  return Boolean(enemy && (enemy.boss || enemy.large || (enemy.radius || 0) >= 15));
}

function canTowerTargetEnemy(definition, enemy) {
  if (!definition || !enemy) {
    return false;
  }
  if (definition.id === "cannon" && enemy.flying) {
    return false;
  }
  return true;
}

function compareTowerTargets(definition, a, b) {
  if (definition?.id === "sniper") {
    const largeDifference = Number(isLargeEnemy(b)) - Number(isLargeEnemy(a));
    if (largeDifference !== 0) {
      return largeDifference;
    }
    const healthDifference = (b.maxHp || b.hp || 0) - (a.maxHp || a.hp || 0);
    if (Math.abs(healthDifference) > 0.01) {
      return healthDifference;
    }
  }
  return b.progress - a.progress;
}

/* === Pass 36: expanded active abilities, laser evolutions, gravity well and flying enemies === */
(() => {
  const abilityDefinitions = {
    orbitalLaser: {
      id: "orbitalLaser",
      name: "Orbital Laser",
      key: "Q",
      duration: 3,
      cooldown: 26,
      radius: 15.2,
      tickInterval: 0.15,
      damagePerTick: 46,
      beamWidth: 14,
      trackingSpeed: 700,
      campaignUnlockMap: "orbitalRoad"
    },
    gravityWell: {
      id: "gravityWell",
      name: "Gravity Well",
      key: "W",
      duration: 4.2,
      cooldown: 30,
      radius: 92,
      tickInterval: 0.25,
      damagePerTick: 5,
      pullStrength: 0.055,
      campaignUnlockMap: "bioNest"
    }
  };

  const laserEvolutionDefinitions = {
    base: {
      id: "base",
      name: "Standard Beam",
      damageMultiplier: 1,
      radiusMultiplier: 1,
      beamWidthMultiplier: 1,
      trackingSpeedMultiplier: 1,
      armorPierce: false,
      text: "Balanced damage, radius and cursor tracking."
    },
    solarLance: {
      id: "solarLance",
      name: "Solar Lance",
      damageMultiplier: 1.58,
      radiusMultiplier: 0.68,
      beamWidthMultiplier: 0.72,
      trackingSpeedMultiplier: 1.85,
      armorPierce: true,
      text: "Narrow, high-damage armor-piercing beam that moves faster with the cursor."
    },
    orbitalSweep: {
      id: "orbitalSweep",
      name: "Orbital Sweep",
      damageMultiplier: 0.72,
      radiusMultiplier: 1.85,
      beamWidthMultiplier: 1.55,
      trackingSpeedMultiplier: 0.42,
      armorPierce: false,
      text: "Wide crowd-control beam that follows the cursor more slowly."
    }
  };

  profile.unlockedAbilities = {
    orbitalLaser: false,
    gravityWell: false,
    ...(profile.unlockedAbilities || {})
  };
  profile.selectedAbilityModes = {
    orbitalLaser: "base",
    ...(profile.selectedAbilityModes || {})
  };
  profile.purchased = profile.purchased || {};

  function registerCampaignAbilityUnlock(mapId, abilityId, rewardLabel) {
    const map = mapDefinitions.find(item => item.id === mapId);
    if (!map) {
      return;
    }
    map.abilityUnlock = abilityId;
    if (!map.reward.includes(rewardLabel)) {
      map.reward = `${map.reward}, ${rewardLabel}`;
    }
  }

  registerCampaignAbilityUnlock("orbitalRoad", "orbitalLaser", "Orbital Laser Protocol");
  registerCampaignAbilityUnlock("bioNest", "gravityWell", "Gravity Well Protocol");

  const abilityResearchNodes = [
    { id: "orbitalLaserFocus", name: "Orbital Laser Focus", branch: "Ability", type: "Ability Upgrade", cost: 8, x: 78, y: 8, parents: ["coreEfficiency"], unlockAt: 2, requiredAbilityUnlock: "orbitalLaser", text: "Orbital Laser damage +18%." },
    { id: "orbitalLaserDuration", name: "Sustained Beam", branch: "Ability", type: "Ability Upgrade", cost: 8, x: 88, y: 8, parents: ["orbitalLaserFocus"], unlockAt: 2, requiredAbilityUnlock: "orbitalLaser", text: "Orbital Laser duration +0.8 seconds." },
    { id: "orbitalLaserCooldown", name: "Fast Reposition", branch: "Ability", type: "Ability Upgrade", cost: 7, x: 78, y: 18, parents: ["orbitalLaserFocus"], unlockAt: 2, requiredAbilityUnlock: "orbitalLaser", text: "Orbital Laser cooldown -15%." },
    { id: "orbitalLaserRadius", name: "Wide Convergence", branch: "Ability", type: "Ability Upgrade", cost: 7, x: 90, y: 18, parents: ["orbitalLaserFocus"], unlockAt: 3, requiredAbilityUnlock: "orbitalLaser", text: "Orbital Laser radius +12%." },
    { id: "orbitalLaserBurn", name: "Burn Trail", branch: "Ability", type: "Ability Upgrade", cost: 9, x: 92, y: 28, parents: ["orbitalLaserDuration"], unlockAt: 3, requiredAbilityUnlock: "orbitalLaser", text: "The beam leaves a stronger burning trail that lasts longer and deals more damage." },
    { id: "orbitalLaserSolar", name: "Solar Lance Protocol", branch: "Ability", type: "Ability Evolution", cost: 12, x: 98, y: 5, parents: ["orbitalLaserFocus"], unlockAt: 3, requiredAbilityUnlock: "orbitalLaser", text: "Unlocks Solar Lance: faster cursor tracking, narrow radius, much higher damage and armor penetration." },
    { id: "orbitalLaserSweep", name: "Orbital Sweep Protocol", branch: "Ability", type: "Ability Evolution", cost: 12, x: 98, y: 17, parents: ["orbitalLaserRadius"], unlockAt: 3, requiredAbilityUnlock: "orbitalLaser", text: "Unlocks Orbital Sweep: much wider radius, lower damage and slower cursor tracking." },
    { id: "gravityWellFocus", name: "Gravity Core Focus", branch: "Ability", type: "Ability Upgrade", cost: 8, x: 67, y: 6, parents: ["coreEfficiency"], unlockAt: 2, requiredAbilityUnlock: "gravityWell", text: "Gravity Well pull strength +20%." },
    { id: "gravityWellRadius", name: "Event Horizon", branch: "Ability", type: "Ability Upgrade", cost: 8, x: 58, y: 1, parents: ["gravityWellFocus"], unlockAt: 2, requiredAbilityUnlock: "gravityWell", text: "Gravity Well radius +15%." },
    { id: "gravityWellDuration", name: "Stable Singularity", branch: "Ability", type: "Ability Upgrade", cost: 9, x: 67, y: 1, parents: ["gravityWellFocus"], unlockAt: 3, requiredAbilityUnlock: "gravityWell", text: "Gravity Well duration +0.8 seconds." },
    { id: "gravityWellCooldown", name: "Compressed Recovery", branch: "Ability", type: "Ability Upgrade", cost: 8, x: 57, y: 12, parents: ["gravityWellFocus"], unlockAt: 3, requiredAbilityUnlock: "gravityWell", text: "Gravity Well cooldown -15%." }
  ];

  abilityResearchNodes.forEach(node => {
    if (!arsenalDefinitions.some(existing => existing.id === node.id)) {
      arsenalDefinitions.push(node);
    }
  });

  enemyDefinitions.skyWasp = {
    name: "Sky Wasp",
    shape: "flyer",
    radius: 9,
    hp: 46,
    speed: 118,
    reward: 10,
    color: "#6f84bb",
    accent: "#a9e5ff",
    damage: 5,
    flying: true,
    description: "Fast airborne organism. Plasma may miss, Cannon cannot target it."
  };
  enemyDefinitions.skyManta = {
    name: "Sky Manta",
    shape: "flyer",
    radius: 16,
    hp: 150,
    speed: 64,
    reward: 22,
    color: "#745f8d",
    accent: "#d3b6ff",
    damage: 10,
    flying: true,
    large: true,
    armor: 0.08,
    description: "Large airborne monster. Sniper prioritizes it and deals critical damage."
  };

  const flyingWaveAdds = [
    { index: 2, group: { type: "skyWasp", count: 6, gap: 0.52 } },
    { index: 4, group: { type: "skyWasp", count: 8, gap: 0.42 } },
    { index: 5, group: { type: "skyManta", count: 3, gap: 1.05 } },
    { index: 6, group: { type: "skyWasp", count: 12, gap: 0.32 } },
    { index: 7, group: { type: "skyManta", count: 5, gap: 0.82 } }
  ];
  flyingWaveAdds.forEach(({ index, group }) => {
    if (waves[index] && !waves[index].some(existing => existing.type === group.type)) {
      waves[index].push(group);
    }
  });

  const abilityDraftCards = [
    {
      name: "Legendary: Orbital Laser",
      category: "ability",
      endlessOnly: true,
      legendary: true,
      oncePerRun: true,
      text: "Unlock Orbital Laser for this run. Press Q, then click the battlefield.",
      canOffer: () => !state.runAbilities?.orbitalLaser?.unlocked,
      apply: () => unlockRunAbility("orbitalLaser")
    },
    {
      name: "Legendary: Gravity Well",
      category: "ability",
      endlessOnly: true,
      legendary: true,
      oncePerRun: true,
      text: "Unlock Gravity Well for this run. Press W, then place a singularity that pulls and slows enemies.",
      canOffer: () => !state.runAbilities?.gravityWell?.unlocked,
      apply: () => unlockRunAbility("gravityWell")
    },
    {
      name: "Legendary: Solar Lance",
      category: "ability",
      endlessOnly: true,
      legendary: true,
      oncePerRun: true,
      text: "Evolve Orbital Laser into Solar Lance: faster tracking, narrow radius, armor piercing and heavy damage.",
      canOffer: () => Boolean(state.runAbilities?.orbitalLaser?.unlocked) && !state.runAbilities.orbitalLaser.solarUnlocked,
      apply: () => unlockLaserEvolution("solarLance")
    },
    {
      name: "Legendary: Orbital Sweep",
      category: "ability",
      endlessOnly: true,
      legendary: true,
      oncePerRun: true,
      text: "Evolve Orbital Laser into Orbital Sweep: wide radius and slower cursor tracking.",
      canOffer: () => Boolean(state.runAbilities?.orbitalLaser?.unlocked) && !state.runAbilities.orbitalLaser.sweepUnlocked,
      apply: () => unlockLaserEvolution("orbitalSweep")
    },
    {
      name: "Legendary: Laser Lens Array",
      category: "ability",
      endlessOnly: true,
      legendary: true,
      text: "Orbital Laser damage +15% for this run.",
      canOffer: () => Boolean(state.runAbilities?.orbitalLaser?.unlocked),
      apply: () => { state.runAbilities.orbitalLaser.damageMultiplier *= 1.15; }
    },
    {
      name: "Legendary: Beam Refractors",
      category: "ability",
      endlessOnly: true,
      legendary: true,
      text: "Orbital Laser radius +10% for this run.",
      canOffer: () => Boolean(state.runAbilities?.orbitalLaser?.unlocked),
      apply: () => { state.runAbilities.orbitalLaser.radiusMultiplier *= 1.1; }
    },
    {
      name: "Legendary: Stabilized Uplink",
      category: "ability",
      endlessOnly: true,
      legendary: true,
      text: "Orbital Laser cooldown -12% for this run.",
      canOffer: () => Boolean(state.runAbilities?.orbitalLaser?.unlocked),
      apply: () => { state.runAbilities.orbitalLaser.cooldownMultiplier *= 0.88; }
    },
    {
      name: "Legendary: Prolonged Burn",
      category: "ability",
      endlessOnly: true,
      legendary: true,
      text: "Orbital Laser duration +0.5 seconds and its burn trail becomes stronger.",
      canOffer: () => Boolean(state.runAbilities?.orbitalLaser?.unlocked),
      apply: () => { state.runAbilities.orbitalLaser.durationBonus += 0.5; state.runAbilities.orbitalLaser.burnTrailPower *= 1.35; }
    },
    {
      name: "Legendary: Event Horizon",
      category: "ability",
      endlessOnly: true,
      legendary: true,
      text: "Gravity Well radius +15% and pull strength +15% for this run.",
      canOffer: () => Boolean(state.runAbilities?.gravityWell?.unlocked),
      apply: () => { state.runAbilities.gravityWell.radiusMultiplier *= 1.15; state.runAbilities.gravityWell.pullMultiplier *= 1.15; }
    },
    {
      name: "Legendary: Stable Singularity",
      category: "ability",
      endlessOnly: true,
      legendary: true,
      text: "Gravity Well lasts 0.6 seconds longer and cooldown is reduced by 10%.",
      canOffer: () => Boolean(state.runAbilities?.gravityWell?.unlocked),
      apply: () => { state.runAbilities.gravityWell.durationBonus += 0.6; state.runAbilities.gravityWell.cooldownMultiplier *= 0.9; }
    }
  ];

  abilityDraftCards.forEach(card => {
    if (!perkPool.some(existing => existing.name === card.name)) {
      perkPool.push(card);
    }
  });

  function campaignAbilityAvailable(id) {
    return Boolean(profile.unlockedAbilities?.[id]);
  }

  function hasAbilityResearch(id) {
    return !isRankedEndless() && hasUpgrade(id);
  }

  function isLaserEvolutionAvailable(evolutionId) {
    ensureAbilityState();
    if (evolutionId === "base") {
      return true;
    }
    const runtime = state.runAbilities.orbitalLaser;
    if (evolutionId === "solarLance") {
      return Boolean(runtime.solarUnlocked || hasAbilityResearch("orbitalLaserSolar"));
    }
    if (evolutionId === "orbitalSweep") {
      return Boolean(runtime.sweepUnlocked || hasAbilityResearch("orbitalLaserSweep"));
    }
    return false;
  }

  function ensureAbilityState() {
    state.runAbilities = state.runAbilities || {};
    state.activeEffects = state.activeEffects || [];
    state.burnZones = state.burnZones || [];
    state.reactorAbilityFx = state.reactorAbilityFx || [];
    state.abilityCursor = state.abilityCursor || { x: WORLD.width * 0.5, y: WORLD.height * 0.5 };
    state.abilityTargetingId = state.abilityTargetingId || null;

    const campaignRun = state.runMode === "campaign";
    const casualEndless = state.runMode === "endless" && !isRankedEndless();

    const laserCurrent = state.runAbilities.orbitalLaser || {};
    const laserUnlocked = Boolean(laserCurrent.unlocked) || (campaignRun && campaignAbilityAvailable("orbitalLaser"));
    const profileMode = profile.selectedAbilityModes?.orbitalLaser || "base";
    const requestedEvolution = laserCurrent.evolution || profileMode;
    state.runAbilities.orbitalLaser = {
      unlocked: laserUnlocked,
      cooldownRemaining: laserCurrent.cooldownRemaining || 0,
      damageMultiplier: laserCurrent.damageMultiplier || ((campaignRun || casualEndless) && hasAbilityResearch("orbitalLaserFocus") ? 1.18 : 1),
      radiusMultiplier: laserCurrent.radiusMultiplier || ((campaignRun || casualEndless) && hasAbilityResearch("orbitalLaserRadius") ? 1.12 : 1),
      cooldownMultiplier: laserCurrent.cooldownMultiplier || ((campaignRun || casualEndless) && hasAbilityResearch("orbitalLaserCooldown") ? 0.85 : 1),
      durationBonus: laserCurrent.durationBonus ?? ((campaignRun || casualEndless) && hasAbilityResearch("orbitalLaserDuration") ? 0.8 : 0),
      burnTrailPower: laserCurrent.burnTrailPower || ((campaignRun || casualEndless) && hasAbilityResearch("orbitalLaserBurn") ? 1.55 : 1),
      solarUnlocked: Boolean(laserCurrent.solarUnlocked) || ((campaignRun || casualEndless) && hasAbilityResearch("orbitalLaserSolar")),
      sweepUnlocked: Boolean(laserCurrent.sweepUnlocked) || ((campaignRun || casualEndless) && hasAbilityResearch("orbitalLaserSweep")),
      evolution: requestedEvolution
    };
    if (!isLaserEvolutionAvailableSafe(requestedEvolution, state.runAbilities.orbitalLaser)) {
      state.runAbilities.orbitalLaser.evolution = "base";
    }

    const gravityCurrent = state.runAbilities.gravityWell || {};
    const gravityUnlocked = Boolean(gravityCurrent.unlocked) || (campaignRun && campaignAbilityAvailable("gravityWell"));
    state.runAbilities.gravityWell = {
      unlocked: gravityUnlocked,
      cooldownRemaining: gravityCurrent.cooldownRemaining || 0,
      radiusMultiplier: gravityCurrent.radiusMultiplier || ((campaignRun || casualEndless) && hasAbilityResearch("gravityWellRadius") ? 1.15 : 1),
      cooldownMultiplier: gravityCurrent.cooldownMultiplier || ((campaignRun || casualEndless) && hasAbilityResearch("gravityWellCooldown") ? 0.85 : 1),
      durationBonus: gravityCurrent.durationBonus ?? ((campaignRun || casualEndless) && hasAbilityResearch("gravityWellDuration") ? 0.8 : 0),
      pullMultiplier: gravityCurrent.pullMultiplier || ((campaignRun || casualEndless) && hasAbilityResearch("gravityWellFocus") ? 1.2 : 1)
    };
  }

  function isLaserEvolutionAvailableSafe(id, runtime) {
    if (id === "base") return true;
    if (id === "solarLance") return Boolean(runtime.solarUnlocked);
    if (id === "orbitalSweep") return Boolean(runtime.sweepUnlocked);
    return false;
  }

  function getLaserRuntime() {
    ensureAbilityState();
    const base = abilityDefinitions.orbitalLaser;
    const runtime = state.runAbilities.orbitalLaser;
    const evolution = laserEvolutionDefinitions[runtime.evolution] || laserEvolutionDefinitions.base;
    return {
      ...base,
      unlocked: runtime.unlocked,
      cooldownRemaining: runtime.cooldownRemaining,
      evolution,
      damagePerTick: base.damagePerTick * runtime.damageMultiplier * evolution.damageMultiplier,
      radius: base.radius * runtime.radiusMultiplier * evolution.radiusMultiplier,
      cooldown: base.cooldown * runtime.cooldownMultiplier,
      duration: base.duration + runtime.durationBonus,
      beamWidth: base.beamWidth * evolution.beamWidthMultiplier,
      trackingSpeed: base.trackingSpeed * evolution.trackingSpeedMultiplier,
      burnTrailPower: runtime.burnTrailPower,
      armorPierce: evolution.armorPierce
    };
  }

  function getGravityRuntime() {
    ensureAbilityState();
    const base = abilityDefinitions.gravityWell;
    const runtime = state.runAbilities.gravityWell;
    return {
      ...base,
      unlocked: runtime.unlocked,
      cooldownRemaining: runtime.cooldownRemaining,
      radius: base.radius * runtime.radiusMultiplier,
      cooldown: base.cooldown * runtime.cooldownMultiplier,
      duration: base.duration + runtime.durationBonus,
      pullStrength: base.pullStrength * runtime.pullMultiplier
    };
  }

  function getAbilityRuntime(id) {
    return id === "orbitalLaser" ? getLaserRuntime() : getGravityRuntime();
  }

  function ensureAbilityUi() {
    ensureHudRefs();
    const utilityStack = document.querySelector(".utility-stack");
    if (!utilityStack) {
      return;
    }

    let panel = document.getElementById("abilityPanel");
    if (!panel) {
      panel = document.createElement("aside");
      panel.id = "abilityPanel";
      panel.className = "hud-panel ability-card ability-card-expanded";
      panel.innerHTML = `
        <span class="ability-panel-title">Core Abilities</span>
        <div class="ability-button-grid ability-mode-list">
          <button id="orbitalLaserButton" class="ability-hud-button laser-standard" type="button" data-laser-mode="base">
            <i class="ability-orb ability-orb-blue">✦</i><span>Standard Beam</span><b>Q</b><em>Ready</em>
          </button>
          <button id="gravityWellButton" class="ability-hud-button gravity" type="button">
            <i class="ability-orb ability-orb-purple">◉</i><span>Gravity Well</span><b>W</b><em>Ready</em>
          </button>
          <button id="solarLanceButton" class="ability-hud-button laser-solar" type="button" data-laser-mode="solarLance">
            <i class="ability-orb ability-orb-green">✹</i><span>Solar Lance</span><b>E</b><em>Mode</em>
          </button>
          <button id="orbitalSweepButton" class="ability-hud-button laser-sweep" type="button" data-laser-mode="orbitalSweep">
            <i class="ability-orb ability-orb-gold">◒</i><span>Orbital Sweep</span><b>R</b><em>Mode</em>
          </button>
        </div>
        <small id="abilityStatus" class="ability-status-line">Abilities locked</small>
      `;
      const coreCard = utilityStack.querySelector(".core-card");
      utilityStack.insertBefore(panel, coreCard || null);
    }

    ui.abilityPanel = panel;
    ui.orbitalLaserButton = document.getElementById("orbitalLaserButton");
    ui.gravityWellButton = document.getElementById("gravityWellButton");
    ui.solarLanceButton = document.getElementById("solarLanceButton");
    ui.orbitalSweepButton = document.getElementById("orbitalSweepButton");
    ui.laserModeRow = panel.querySelector(".ability-mode-list");
    ui.abilityStatus = document.getElementById("abilityStatus");

    const bindLaserModeButton = (button, mode) => {
      if (!button || button.dataset.bound) return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => {
        if (!isLaserEvolutionAvailable(mode)) return;
        setLaserEvolution(mode);
        armAbility("orbitalLaser");
      });
    };
    bindLaserModeButton(ui.orbitalLaserButton, "base");
    bindLaserModeButton(ui.solarLanceButton, "solarLance");
    bindLaserModeButton(ui.orbitalSweepButton, "orbitalSweep");

    if (ui.gravityWellButton && !ui.gravityWellButton.dataset.bound) {
      ui.gravityWellButton.dataset.bound = "1";
      ui.gravityWellButton.addEventListener("click", () => armAbility("gravityWell"));
    }
  }

  function setLaserEvolution(id) {
    ensureAbilityState();
    if (!isLaserEvolutionAvailable(id)) {
      return;
    }
    state.runAbilities.orbitalLaser.evolution = id;
    if (state.runMode !== "endless") {
      profile.selectedAbilityModes.orbitalLaser = id;
      saveProfile();
    }
    syncAbilityUI();
  }

  function unlockLaserEvolution(id) {
    ensureAbilityState();
    if (id === "solarLance") state.runAbilities.orbitalLaser.solarUnlocked = true;
    if (id === "orbitalSweep") state.runAbilities.orbitalLaser.sweepUnlocked = true;
    state.runAbilities.orbitalLaser.evolution = id;
    pushBattleLog(`${laserEvolutionDefinitions[id].name} installed`, "LEGEND", "core");
    syncAbilityUI();
  }

  function unlockRunAbility(id) {
    ensureAbilityState();
    state.runAbilities[id].unlocked = true;
    state.runAbilities[id].cooldownRemaining = 0;
    pushBattleLog(`${abilityDefinitions[id].name} ready`, "LEGEND", "core");
    syncAbilityUI();
  }

  function syncAbilityButton(button, runtime, targeting) {
    if (!button) return;
    button.classList.toggle("active", targeting);
    button.classList.toggle("ready", runtime.unlocked && runtime.cooldownRemaining <= 0);
    button.disabled = !runtime.unlocked || runtime.cooldownRemaining > 0 || state.runEnded || state.baseOverlayOpen || isDraftOpen();
  }

  function syncAbilityUI() {
    ensureAbilityUi();
    ensureAbilityState();
    if (!ui.abilityPanel) return;

    const laser = getLaserRuntime();
    const gravity = getGravityRuntime();
    const laserTargeting = state.abilityTargetingId === "orbitalLaser";
    const gravityTargeting = state.abilityTargetingId === "gravityWell";
    ui.abilityPanel.classList.toggle("hidden", state.screen !== "game");
    syncAbilityButton(ui.orbitalLaserButton, laser, laserTargeting);
    syncAbilityButton(ui.gravityWellButton, gravity, gravityTargeting);

    const updateAbilityRow = (button, label, key, status, available, active = false) => {
      if (!button) return;
      const labelNode = button.querySelector("span");
      const keyNode = button.querySelector("b");
      const statusNode = button.querySelector("em");
      if (labelNode) labelNode.textContent = label;
      if (keyNode) keyNode.textContent = key;
      if (statusNode) statusNode.textContent = status;
      button.disabled = !available;
      button.classList.toggle("active", active);
      button.classList.toggle("ready", available && status === "READY");
    };

    const laserStatus = laserTargeting ? "TARGET" : laser.cooldownRemaining > 0 ? `${laser.cooldownRemaining.toFixed(0)}s` : "READY";
    const gravityStatus = gravityTargeting ? "TARGET" : gravity.cooldownRemaining > 0 ? `${gravity.cooldownRemaining.toFixed(0)}s` : "READY";
    const laserEnabled = laser.unlocked && (laser.cooldownRemaining <= 0 || laserTargeting);
    const gravityEnabled = gravity.unlocked && (gravity.cooldownRemaining <= 0 || gravityTargeting);
    updateAbilityRow(ui.orbitalLaserButton, "Standard Beam", "Q", laserStatus, laserEnabled, state.runAbilities.orbitalLaser.evolution === "base");
    updateAbilityRow(ui.gravityWellButton, "Gravity Well", "W", gravityStatus, gravityEnabled, gravityTargeting);

    const solarAvailable = laserEnabled && isLaserEvolutionAvailable("solarLance");
    const sweepAvailable = laserEnabled && isLaserEvolutionAvailable("orbitalSweep");
    updateAbilityRow(ui.solarLanceButton, "Solar Lance", "E", state.runAbilities.orbitalLaser.evolution === "solarLance" ? laserStatus : "MODE", solarAvailable, state.runAbilities.orbitalLaser.evolution === "solarLance");
    updateAbilityRow(ui.orbitalSweepButton, "Orbital Sweep", "R", state.runAbilities.orbitalLaser.evolution === "orbitalSweep" ? laserStatus : "MODE", sweepAvailable, state.runAbilities.orbitalLaser.evolution === "orbitalSweep");

    [ui.orbitalLaserButton, ui.solarLanceButton, ui.orbitalSweepButton].forEach(button => {
      const id = button?.dataset.laserMode;
      if (!button || !id) return;
      button.title = isLaserEvolutionAvailable(id) ? laserEvolutionDefinitions[id].text : "Unlock this evolution in Research Lab or Endless draft.";
    });

    if (laserTargeting) {
      ui.abilityStatus.textContent = `${laser.evolution.name}: click the map. Beam follows cursor for ${laser.duration.toFixed(1)}s.`;
    } else if (gravityTargeting) {
      ui.abilityStatus.textContent = `Gravity Well: click the map. Radius ${Math.round(gravity.radius)}, duration ${gravity.duration.toFixed(1)}s.`;
    } else if (!laser.unlocked && !gravity.unlocked) {
      ui.abilityStatus.textContent = state.runMode === "campaign"
        ? "Abilities unlock at specific Campaign scenario points."
        : "Legendary ability cards unlock abilities during the run.";
    } else {
      const laserText = laser.unlocked ? `Laser ${laser.cooldownRemaining > 0 ? `${laser.cooldownRemaining.toFixed(1)}s` : "READY"}` : "Laser LOCKED";
      const gravityText = gravity.unlocked ? `Gravity ${gravity.cooldownRemaining > 0 ? `${gravity.cooldownRemaining.toFixed(1)}s` : "READY"}` : "Gravity LOCKED";
      ui.abilityStatus.textContent = `${laserText} | ${gravityText}`;
    }
  }

  function armAbility(id) {
    ensureAbilityState();
    const runtime = getAbilityRuntime(id);
    if (!runtime.unlocked || runtime.cooldownRemaining > 0 || state.screen !== "game" || state.runEnded || state.baseOverlayOpen || isDraftOpen()) {
      return;
    }
    state.selectedPlacedTower = null;
    ui.towerInspector.classList.add("hidden");
    state.deleteMode = false;
    state.deleteHoverTower = null;
    state.selectedTowerId = null;
    state.placementGhost.visible = false;
    state.abilityTargetingId = state.abilityTargetingId === id ? null : id;
    buildTowerBar();
    syncBuildControls();
    syncAbilityUI();
  }

  function clearAbilityTargeting() {
    state.abilityTargetingId = null;
    syncAbilityUI();
  }

  function triggerReactorAbilityFx(id, target) {
    state.reactorAbilityFx.push({
      id,
      targetX: target.x,
      targetY: target.y,
      timeLeft: id === "gravityWell" ? 1.55 : 1.3,
      maxTime: id === "gravityWell" ? 1.55 : 1.3,
      seed: Math.random() * 1000
    });
  }

  function closestPathProgress(point) {
    return closestRouteLocation(point);
  }

  function activateAbilityAt(id, point) {
    ensureAbilityState();
    const runtime = getAbilityRuntime(id);
    if (!runtime.unlocked || runtime.cooldownRemaining > 0 || state.runEnded || state.baseOverlayOpen || state.paused || isDraftOpen()) {
      return false;
    }

    const x = clamp(point.x, 28, WORLD.width - 28);
    const y = clamp(point.y, 28, WORLD.height - 28);
    if (id === "orbitalLaser") {
      state.activeEffects.push({
        type: "orbitalLaser",
        x,
        y,
        previousX: x,
        previousY: y,
        radius: runtime.radius,
        duration: runtime.duration,
        timeLeft: runtime.duration,
        tickInterval: runtime.tickInterval,
        tickTimer: 0,
        trailTimer: 0,
        damagePerTick: runtime.damagePerTick,
        beamWidth: runtime.beamWidth,
        trackingSpeed: runtime.trackingSpeed,
        armorPierce: runtime.armorPierce,
        burnTrailPower: runtime.burnTrailPower,
        evolutionId: runtime.evolution.id,
        sweepSeed: Math.random() * 1000
      });
    } else if (id === "gravityWell") {
      const routeLocation = closestPathProgress({ x, y });
      state.activeEffects.push({
        type: "gravityWell",
        x,
        y,
        pathProgress: routeLocation.progress,
        routeIndex: routeLocation.routeIndex,
        radius: runtime.radius,
        duration: runtime.duration,
        timeLeft: runtime.duration,
        tickInterval: runtime.tickInterval,
        tickTimer: 0,
        damagePerTick: runtime.damagePerTick,
        pullStrength: runtime.pullStrength,
        seed: Math.random() * 1000
      });
    }

    state.runAbilities[id].cooldownRemaining = runtime.cooldown;
    state.abilityTargetingId = null;
    triggerReactorAbilityFx(id, { x, y });
    pushBattleLog(`${runtime.name} activated`, "ABILITY", "core");
    syncAbilityUI();
    return true;
  }

  function moveTowards(currentX, currentY, targetX, targetY, maximumDistance) {
    const dx = targetX - currentX;
    const dy = targetY - currentY;
    const length = Math.hypot(dx, dy);
    if (length <= maximumDistance || length < 0.001) {
      return { x: targetX, y: targetY };
    }
    return {
      x: currentX + dx / length * maximumDistance,
      y: currentY + dy / length * maximumDistance
    };
  }

  function abilityDamageMultiplier(enemy, options = {}) {
    let multiplier = 1;
    if (enemy.armor && !options.ignoreArmor) {
      multiplier *= 1 - enemy.armor;
    }
    const protectedByShield = state.enemies.some(other => other !== enemy && other.shieldAura && distance(other.pos, enemy.pos) <= other.shieldAura);
    if (protectedByShield) multiplier *= 0.72;
    if ((enemy.breachTimer || 0) > 0) multiplier *= (enemy.breachFactor || 1.18) * 1.25;
    if ((enemy.slowTimer || 0) > 0) multiplier *= 1.2;
    if ((enemy.gravityAffectedTimer || 0) > 0) multiplier *= 1.2;
    return multiplier;
  }

  function applyLaserDamage(enemy, effect) {
    if (!enemy || enemy.hp <= 0) return;
    let damage = effect.damagePerTick * abilityDamageMultiplier(enemy, { ignoreArmor: effect.armorPierce });
    if ((enemy.arcMarkTimer || 0) > 0) {
      damage *= 1.18;
      if ((enemy.arcOverloadCooldown || 0) <= 0) {
        enemy.arcOverloadCooldown = 0.45;
        state.enemies.forEach(other => {
          if (other !== enemy && distance(other.pos, enemy.pos) <= 34) {
            other.lastHitTower = null;
            other.hp -= effect.damagePerTick * 0.2 * abilityDamageMultiplier(other, { ignoreArmor: false });
          }
        });
        enemy.arcOverloadFlash = 0.22;
      }
    }
    enemy.lastHitTower = null;
    enemy.hp -= damage;
  }

  function addBurnZone(effect) {
    const power = effect.burnTrailPower || 1;
    state.burnZones.push({
      x: effect.x,
      y: effect.y,
      radius: Math.max(8, effect.radius * 0.82),
      timeLeft: 1.35 * power,
      maxTime: 1.35 * power,
      tickTimer: 0,
      tickInterval: 0.3,
      damagePerTick: 7 * power
    });
    if (state.burnZones.length > 90) {
      state.burnZones.splice(0, state.burnZones.length - 90);
    }
  }

  function updateAbilities(rawDt) {
    ensureAbilityState();
    const gameDt = rawDt * Math.max(1, state.speed || 1);
    Object.values(state.runAbilities).forEach(runtime => {
      runtime.cooldownRemaining = Math.max(0, (runtime.cooldownRemaining || 0) - gameDt);
    });

    state.reactorAbilityFx.forEach(fx => { fx.timeLeft -= gameDt; });
    state.reactorAbilityFx = state.reactorAbilityFx.filter(fx => fx.timeLeft > 0);

    state.activeEffects.forEach(effect => {
      effect.timeLeft -= gameDt;
      effect.tickTimer -= gameDt;

      if (effect.type === "orbitalLaser") {
        effect.previousX = effect.x;
        effect.previousY = effect.y;
        const cursor = state.abilityCursor || { x: effect.x, y: effect.y };
        const moved = moveTowards(effect.x, effect.y, cursor.x, cursor.y, effect.trackingSpeed * gameDt);
        effect.x = clamp(moved.x, 24, WORLD.width - 24);
        effect.y = clamp(moved.y, 24, WORLD.height - 24);
        effect.trailTimer -= gameDt;
        if (effect.trailTimer <= 0) {
          effect.trailTimer += 0.085;
          addBurnZone(effect);
        }
        while (effect.tickTimer <= 0 && effect.timeLeft > 0) {
          effect.tickTimer += effect.tickInterval;
          const center = { x: effect.x, y: effect.y };
          state.enemies.forEach(enemy => {
            if (distance(center, enemy.pos) <= effect.radius + (enemy.radius || 0) * 0.35) {
              applyLaserDamage(enemy, effect);
            }
          });
        }
      } else if (effect.type === "gravityWell") {
        while (effect.tickTimer <= 0 && effect.timeLeft > 0) {
          effect.tickTimer += effect.tickInterval;
          state.enemies.forEach(enemy => {
            if (distance(effect, enemy.pos) <= effect.radius) {
              enemy.lastHitTower = null;
              enemy.hp -= effect.damagePerTick * abilityDamageMultiplier(enemy, { ignoreArmor: true });
            }
          });
        }
      }
    });
    state.activeEffects = state.activeEffects.filter(effect => effect.timeLeft > 0);

    state.burnZones.forEach(zone => {
      zone.timeLeft -= gameDt;
      zone.tickTimer -= gameDt;
      while (zone.tickTimer <= 0 && zone.timeLeft > 0) {
        zone.tickTimer += zone.tickInterval;
        state.enemies.forEach(enemy => {
          if (distance(zone, enemy.pos) <= zone.radius + (enemy.radius || 0) * 0.25) {
            enemy.lastHitTower = null;
            enemy.hp -= zone.damagePerTick * abilityDamageMultiplier(enemy, { ignoreArmor: false });
          }
        });
      }
    });
    state.burnZones = state.burnZones.filter(zone => zone.timeLeft > 0);
  }

  function drawBurnZones() {
    state.burnZones.forEach(zone => {
      const life = clamp(zone.timeLeft / zone.maxTime, 0, 1);
      context.save();
      context.globalCompositeOperation = "screen";
      context.globalAlpha = 0.16 * life;
      context.fillStyle = "rgba(255,112,48,0.8)";
      context.beginPath();
      context.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 0.45 * life;
      context.strokeStyle = "rgba(255,193,98,0.9)";
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(zone.x, zone.y, zone.radius * (0.65 + 0.12 * Math.sin(performance.now() * 0.01 + zone.x)), 0, Math.PI * 2);
      context.stroke();
      context.restore();
    });
  }

  function drawOrbitalLaser(effect) {
    const progress = 1 - effect.timeLeft / effect.duration;
    const pulse = 0.55 + 0.45 * Math.sin((performance.now() + effect.sweepSeed) * 0.016);
    const solar = effect.evolutionId === "solarLance";
    const sweep = effect.evolutionId === "orbitalSweep";
    const outerColor = solar ? "rgba(255,225,135,0.96)" : sweep ? "rgba(255,154,104,0.92)" : "rgba(255,190,94,0.94)";

    context.save();
    context.globalCompositeOperation = "screen";
    const gradient = context.createLinearGradient(effect.x, -40, effect.x, effect.y + effect.radius);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.08, solar ? "rgba(255,255,224,0.99)" : "rgba(255,244,205,0.96)");
    gradient.addColorStop(0.45, outerColor);
    gradient.addColorStop(1, "rgba(255,92,44,0.02)");
    context.globalAlpha = 0.22 + pulse * 0.1;
    context.strokeStyle = gradient;
    context.lineWidth = effect.beamWidth + pulse * (solar ? 4 : 8);
    context.beginPath();
    context.moveTo(effect.x, -36);
    context.lineTo(effect.x, effect.y + 8);
    context.stroke();

    context.globalAlpha = 0.95;
    context.strokeStyle = "rgba(255,255,255,0.96)";
    context.lineWidth = Math.max(3.5, effect.beamWidth * 0.3);
    context.beginPath();
    context.moveTo(effect.x, -18);
    context.lineTo(effect.x, effect.y + 10);
    context.stroke();

    context.globalAlpha = sweep ? 0.28 : 0.42;
    context.fillStyle = sweep ? "rgba(255,107,65,0.28)" : "rgba(255,154,70,0.25)";
    context.beginPath();
    context.arc(effect.x, effect.y, effect.radius * (0.9 + pulse * 0.06), 0, Math.PI * 2);
    context.fill();

    context.globalAlpha = 0.85;
    context.strokeStyle = outerColor;
    context.lineWidth = solar ? 2.2 : 3.2;
    context.beginPath();
    context.arc(effect.x, effect.y, effect.radius * (0.72 + pulse * 0.08), progress, progress + Math.PI * 1.7);
    context.stroke();
    context.restore();
  }

  function drawGravityWell(effect) {
    const life = clamp(effect.timeLeft / effect.duration, 0, 1);
    const pulse = 0.5 + 0.5 * Math.sin((performance.now() + effect.seed) * 0.012);
    context.save();
    context.globalCompositeOperation = "screen";
    const gradient = context.createRadialGradient(effect.x, effect.y, 4, effect.x, effect.y, effect.radius);
    gradient.addColorStop(0, "rgba(15,8,28,0.96)");
    gradient.addColorStop(0.18, "rgba(121,79,220,0.58)");
    gradient.addColorStop(0.55, "rgba(87,143,255,0.18)");
    gradient.addColorStop(1, "rgba(87,143,255,0)");
    context.globalAlpha = 0.82;
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    context.fill();

    for (let ring = 0; ring < 4; ring += 1) {
      const radius = effect.radius * (0.24 + ring * 0.19) + pulse * 3;
      context.globalAlpha = (0.58 - ring * 0.09) * life;
      context.strokeStyle = ring % 2 ? "rgba(130,194,255,0.85)" : "rgba(191,130,255,0.9)";
      context.lineWidth = 2.2 - ring * 0.25;
      context.beginPath();
      const phase = performance.now() * 0.0018 * (ring % 2 ? -1 : 1) + ring;
      context.arc(effect.x, effect.y, radius, phase, phase + Math.PI * 1.55);
      context.stroke();
    }

    context.globalAlpha = 0.9;
    context.fillStyle = "rgba(5,3,12,0.98)";
    context.beginPath();
    context.arc(effect.x, effect.y, 7 + pulse * 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawAbilityTargeting() {
    if (!state.abilityTargetingId || state.screen !== "game") return;
    const runtime = getAbilityRuntime(state.abilityTargetingId);
    const point = state.abilityCursor;
    context.save();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = state.abilityTargetingId === "gravityWell" ? "rgba(180,136,255,0.95)" : "rgba(255,214,138,0.95)";
    context.lineWidth = 2.5;
    context.setLineDash([8, 6]);
    context.beginPath();
    context.arc(point.x, point.y, runtime.radius, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    context.strokeStyle = "rgba(255,255,255,0.94)";
    context.lineWidth = 1.7;
    context.beginPath();
    context.moveTo(point.x - 12, point.y);
    context.lineTo(point.x + 12, point.y);
    context.moveTo(point.x, point.y - 12);
    context.lineTo(point.x, point.y + 12);
    context.stroke();
    context.restore();
  }

  function drawReactorAbilityFx() {
    const base = activeBasePoint();
    state.reactorAbilityFx.forEach(fx => {
      const life = clamp(fx.timeLeft / fx.maxTime, 0, 1);
      const pulse = 0.5 + 0.5 * Math.sin((performance.now() + fx.seed) * 0.018);
      context.save();
      context.globalCompositeOperation = "screen";
      if (fx.id === "gravityWell") {
        context.strokeStyle = `rgba(183,130,255,${0.72 * life})`;
        for (let ring = 0; ring < 4; ring += 1) {
          context.lineWidth = 2.4 - ring * 0.3;
          context.beginPath();
          context.arc(base.x, base.y - 18, 22 + ring * 9 + (1 - life) * 8, performance.now() * 0.003 + ring, performance.now() * 0.003 + ring + 4.8);
          context.stroke();
        }
        context.fillStyle = `rgba(111,83,224,${0.26 * life})`;
        context.beginPath();
        context.arc(base.x, base.y - 36, 24 + pulse * 6, 0, Math.PI * 2);
        context.fill();
      } else {
        context.strokeStyle = `rgba(255,214,132,${0.78 * life})`;
        context.lineWidth = 4;
        context.beginPath();
        context.arc(base.x, base.y - 36, 28 + (1 - life) * 20, 0, Math.PI * 2);
        context.stroke();
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(base.x, base.y - 40);
        context.lineTo(base.x, 10);
        context.stroke();
        for (let panel = 0; panel < 6; panel += 1) {
          const angle = panel * Math.PI / 3 + performance.now() * 0.004;
          const inner = 28;
          const outer = 42 + pulse * 4;
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(base.x + Math.cos(angle) * inner, base.y - 26 + Math.sin(angle) * inner);
          context.lineTo(base.x + Math.cos(angle) * outer, base.y - 26 + Math.sin(angle) * outer);
          context.stroke();
        }
      }
      context.restore();
    });
  }

  const originalUpdateEnemies = updateEnemies;
  updateEnemies = function(dt) {
    originalUpdateEnemies(dt);
    state.enemies.forEach(enemy => {
      enemy.arcMarkTimer = Math.max(0, (enemy.arcMarkTimer || 0) - dt);
      enemy.arcOverloadCooldown = Math.max(0, (enemy.arcOverloadCooldown || 0) - dt);
      enemy.arcOverloadFlash = Math.max(0, (enemy.arcOverloadFlash || 0) - dt);
      enemy.sniperCritFlash = Math.max(0, (enemy.sniperCritFlash || 0) - dt);
      enemy.gravityAffectedTimer = Math.max(0, (enemy.gravityAffectedTimer || 0) - dt);

      state.activeEffects?.forEach(effect => {
        if (effect.type !== "gravityWell" || effect.timeLeft <= 0) return;
        const d = distance(effect, enemy.pos);
        if (d > effect.radius + (enemy.radius || 0)) return;
        const largeResistance = isLargeEnemy(enemy) ? 0.45 : enemy.flying ? 0.82 : 1;
        if ((enemy.routeIndex || 0) !== (effect.routeIndex || 0) && enemy.progress < 0.72) return;
        const deltaProgress = effect.pathProgress - enemy.progress;
        enemy.progress = clamp(enemy.progress + deltaProgress * effect.pullStrength * largeResistance * dt * 5.2, 0, 0.995);
        const pathPosition = samplePath(enemy.progress, enemy.routeIndex || 0);
        const pullVisual = 0.12 * largeResistance * (1 - d / Math.max(1, effect.radius));
        enemy.pos = {
          x: lerp(pathPosition.x, effect.x, pullVisual),
          y: lerp(pathPosition.y, effect.y, pullVisual)
        };
        enemy.slowMultiplier = Math.min(enemy.slowMultiplier || 1, enemy.flying ? 0.82 : 0.58);
        enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.18);
        enemy.gravityAffectedTimer = 0.22;
      });
    });
  };

  const originalResetRun = resetRun;
  resetRun = function() {
    originalResetRun();
    state.runAbilities = {};
    state.activeEffects = [];
    state.burnZones = [];
    state.reactorAbilityFx = [];
    state.abilityCursor = { x: WORLD.width * 0.5, y: WORLD.height * 0.5 };
    state.abilityTargetingId = null;
    ensureAbilityState();
    syncAbilityUI();
  };

  const originalUpdate = update;
  update = function(delta) {
    if (state.screen === "game" && !state.paused && !state.runEnded && !state.baseOverlayOpen && !isDraftOpen()) {
      updateAbilities(delta);
    }
    originalUpdate(delta);
    if (state.screen === "game") syncAbilityUI();
  };

  const originalDraw = draw;
  draw = function() {
    originalDraw();
    if (state.screen !== "game") return;
    context.save();
    applyBattleCameraTransform();
    drawBurnZones();
    state.activeEffects?.forEach(effect => {
      if (effect.type === "orbitalLaser") drawOrbitalLaser(effect);
      if (effect.type === "gravityWell") drawGravityWell(effect);
    });
    drawReactorAbilityFx();
    drawAbilityTargeting();
    context.restore();
  };

  const originalSyncUI = syncUI;
  syncUI = function() {
    originalSyncUI();
    syncAbilityUI();
  };

  const originalSetScreen = setScreen;
  setScreen = function(screen) {
    originalSetScreen(screen);
    syncAbilityUI();
  };

  const originalPlaceTower = placeTower;
  placeTower = function(world, options = {}) {
    if (state.abilityTargetingId && activateAbilityAt(state.abilityTargetingId, world)) {
      return;
    }
    return originalPlaceTower(world, options);
  };

  const originalClearActionState = clearActionState;
  clearActionState = function() {
    originalClearActionState();
    clearAbilityTargeting();
  };

  const originalIsArsenalItemUnlocked = isArsenalItemUnlocked;
  isArsenalItemUnlocked = function(item) {
    if (item.requiredAbilityUnlock && !profile.unlockedAbilities?.[item.requiredAbilityUnlock]) {
      return false;
    }
    return originalIsArsenalItemUnlocked(item);
  };

  const originalCompleteRun = completeRun;
  completeRun = function(result) {
    const map = currentMap();
    const victory = result === true || result === "victory";
    const endless = state.runMode === "endless";
    let unlockedName = "";
    if (victory && !endless && map?.abilityUnlock && !profile.unlockedAbilities?.[map.abilityUnlock]) {
      profile.unlockedAbilities[map.abilityUnlock] = true;
      unlockedName = abilityDefinitions[map.abilityUnlock]?.name || "New Ability";
      saveProfile();
    }
    originalCompleteRun(result);
    if (unlockedName && ui.resultText) {
      ui.resultText.textContent += ` Scenario reward unlocked: ${unlockedName}. It can now be upgraded in Research Lab.`;
    }
  };

  showPerks = function(title = "Choose Combat Protocol") {
    ensureAbilityState();
    ui.perkModal.dataset.draftType = "wave-perk";
    ui.towerInspector.classList.add("hidden");
    ui.perkTitle.textContent = title;

    const towerIsRelevant = perk => !perk.tower || isTowerAvailable(towerDefinitions[perk.tower]);
    const availablePerks = perkPool.filter(perk =>
      (!perk.endlessOnly || state.runMode === "endless") &&
      (!perk.refineryOnly || !isRankedEndless()) &&
      towerIsRelevant(perk) &&
      (!perk.oncePerRun || !state.runPerks[perk.name]) &&
      (!perk.canOffer || perk.canOffer(state))
    );
    const shuffled = items => [...items].sort(() => Math.random() - 0.5);
    const choices = [];
    const lockedTowers = Object.values(towerDefinitions).filter(definition => definition.kind !== "infrastructure" && definition.id !== "plasma" && isTowerEligibleForDraft(definition) && !state.runUnlockedTowers[definition.id]);
    if (lockedTowers.length) {
      const definition = shuffled(lockedTowers)[0];
      choices.push({ name: definition.name, category: "unlock", towerUnlockId: definition.id, text: `${definition.role}: ${definition.description}` });
    }

    shuffled(["tower", "support", "economy"]).forEach(category => {
      const candidate = shuffled(availablePerks.filter(perk => perk.category === category && !choices.includes(perk)))[0];
      if (candidate) choices.push(candidate);
    });

    const legendaryAbilities = shuffled(availablePerks.filter(perk => perk.category === "ability" && perk.legendary && !choices.includes(perk)));
    if (legendaryAbilities.length && Math.random() < 0.46) {
      const replacement = choices.findIndex((choice, index) => index > 0 && choice.category !== "unlock");
      if (replacement >= 0) choices[replacement] = legendaryAbilities[0];
      else choices.push(legendaryAbilities[0]);
    }

    const rareChoices = shuffled(availablePerks.filter(perk => perk.rare && !choices.includes(perk)));
    if (rareChoices.length && Math.random() < 0.28) {
      const replacement = choices.findIndex((choice, index) => index > 0 && choice.category !== "unlock");
      if (replacement >= 0) choices[replacement] = rareChoices[0];
    }

    const choiceLimit = hasUpgrade("adaptiveDraft") ? 4 : 3;
    ui.perkChoices.classList.toggle("four-choice", choiceLimit === 4);
    const remaining = shuffled(availablePerks.filter(perk => !choices.includes(perk) && !perk.rare));
    while (choices.length < choiceLimit && remaining.length) choices.push(remaining.shift());

    ui.perkChoices.innerHTML = "";
    choices.slice(0, choiceLimit).forEach(perk => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `perk perk-${perk.category}${perk.legendary ? " legendary" : perk.rare ? " rare" : ""}`;
      const label = perk.category === "unlock" ? "NEW TOWER" : perk.category === "ability" ? "LEGENDARY ABILITY" : perk.rare ? "RARE PROTOCOL" : perk.category === "tower" ? "TOWER PROTOCOL" : perk.category === "support" ? "TACTICAL PROTOCOL" : "ECONOMY PROTOCOL";
      button.innerHTML = `<small>${label}</small><b>${perk.name}</b><span>${perk.text}</span>`;
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (perk.towerUnlockId) {
          state.runUnlockedTowers[perk.towerUnlockId] = true;
          pushBattleLog(`${towerDefinitions[perk.towerUnlockId].name} blueprint acquired`, "NEW", "core");
        } else {
          state.runPerks[perk.name] = true;
          perk.apply(state);
        }
        ui.perkModal.classList.add("hidden");
        ui.perkModal.dataset.draftType = "";
        queueNextWave();
        buildTowerBar();
        syncUI();
      });
      ui.perkChoices.appendChild(button);
    });
    ui.perkModal.classList.remove("hidden");
  };

  canvas.addEventListener("pointermove", event => {
    if (state.screen === "game") {
      state.abilityCursor = canvasPoint(event);
    }
    const activeLaser = state.activeEffects?.some(effect => effect.type === "orbitalLaser");
    if (state.abilityTargetingId || activeLaser) canvas.style.cursor = "crosshair";
  });

  window.addEventListener("keydown", event => {
    if (state.screen !== "game") return;
    if (event.code === "KeyQ") {
      event.preventDefault();
      setLaserEvolution("base");
      armAbility("orbitalLaser");
    } else if (event.code === "KeyW") {
      event.preventDefault();
      armAbility("gravityWell");
    } else if (event.code === "KeyE") {
      event.preventDefault();
      if (isLaserEvolutionAvailable("solarLance")) {
        setLaserEvolution("solarLance");
        armAbility("orbitalLaser");
      }
    } else if (event.code === "KeyR") {
      event.preventDefault();
      if (isLaserEvolutionAvailable("orbitalSweep")) {
        setLaserEvolution("orbitalSweep");
        armAbility("orbitalLaser");
      }
    }
  });

  ensureAbilityUi();
  ensureAbilityState();
  buildArsenal();
  syncAbilityUI();
})();


/* === Pass 38: verified map mechanic banner === */
function drawMapMechanicBanner() {
  const banner = state.mapMechanicBanner;
  if (!banner || banner.time <= 0 || state.screen !== "game") return;
  const life = clamp(banner.time / Math.max(0.001, banner.total), 0, 1);
  const appear = clamp((1 - life) / 0.16, 0, 1);
  const fade = clamp(life / 0.22, 0, 1);
  const alpha = Math.min(appear, fade);
  const centerX = WORLD.width * 0.5;
  const boardX = centerX - 270;
  const boardY = 142;
  const boardW = 540;
  const boardH = 106;

  context.save();
  context.globalAlpha = alpha;
  context.translate(0, (1 - appear) * -24);
  const gradient = context.createLinearGradient(boardX, boardY, boardX + boardW, boardY + boardH);
  gradient.addColorStop(0, "rgba(5,11,18,0.97)");
  gradient.addColorStop(0.5, "rgba(18,31,46,0.95)");
  gradient.addColorStop(1, "rgba(5,11,18,0.97)");
  context.fillStyle = gradient;
  context.beginPath();
  context.moveTo(boardX + 20, boardY);
  context.lineTo(boardX + boardW - 20, boardY);
  context.lineTo(boardX + boardW, boardY + 20);
  context.lineTo(boardX + boardW, boardY + boardH - 20);
  context.lineTo(boardX + boardW - 20, boardY + boardH);
  context.lineTo(boardX + 20, boardY + boardH);
  context.lineTo(boardX, boardY + boardH - 20);
  context.lineTo(boardX, boardY + 20);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(109,194,244,0.36)";
  context.lineWidth = 1.5;
  context.stroke();

  context.fillStyle = "rgba(244,192,103,0.98)";
  context.font = "700 13px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText(String(banner.kicker || "MISSION PROTOCOL").toUpperCase(), centerX, boardY + 24);

  context.fillStyle = "rgba(242,248,252,0.98)";
  context.font = "700 29px Inter, sans-serif";
  context.fillText(banner.title, centerX, boardY + 56);

  context.fillStyle = "rgba(184,211,230,0.94)";
  context.font = "500 14px Inter, sans-serif";
  const words = String(banner.text || "").split(/\s+/);
  let line = "";
  const lines = [];
  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > 470 && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((entry, index) => context.fillText(entry, centerX, boardY + 81 + index * 17));
  context.restore();
}

const updateBeforeMapBanner = update;
update = function updateWithMapBanner(delta) {
  updateBeforeMapBanner(delta);
  if (state.mapMechanicBanner && state.screen === "game" && !state.paused && !isDraftOpen()) {
    state.mapMechanicBanner.time = Math.max(0, state.mapMechanicBanner.time - delta);
  }
};

const drawBeforeMapBanner = draw;
draw = function drawWithMapBanner() {
  drawBeforeMapBanner();
  drawMapMechanicBanner();
};

/* === Pass 59: kill experience, ten tower levels and level-10 evolution === */
const TOWER_MAX_LEVEL = 10;

function towerXpToNextLevel(level) {
  if (level >= TOWER_MAX_LEVEL) {
    return 0;
  }
  return 12 + level * 6;
}

function towerExperienceReward(enemy) {
  const base = Number(enemy?.reward) || 1;
  return Math.max(1, Math.round(base * (enemy?.boss ? 1.35 : 1)));
}

function markTowerHit(enemy, tower) {
  if (!enemy || !tower || towerDefinitions[tower.id]?.kind === "infrastructure") {
    return;
  }
  enemy.lastHitTower = tower;
}

function gainTowerExperience(tower, amount) {
  if (!tower || !state.towers.includes(tower) || towerDefinitions[tower.id]?.kind === "infrastructure") {
    return;
  }
  tower.level = clamp(Math.round(tower.level || 1), 1, TOWER_MAX_LEVEL);
  tower.xp = Math.max(0, Number(tower.xp) || 0);
  if (tower.level >= TOWER_MAX_LEVEL) {
    tower.level = TOWER_MAX_LEVEL;
    tower.xp = 0;
    return;
  }

  tower.xp += Math.max(0, Number(amount) || 0);
  let leveled = false;
  while (tower.level < TOWER_MAX_LEVEL) {
    const required = towerXpToNextLevel(tower.level);
    if (tower.xp < required) {
      break;
    }
    tower.xp -= required;
    tower.level += 1;
    leveled = true;
  }

  if (tower.level >= TOWER_MAX_LEVEL) {
    tower.level = TOWER_MAX_LEVEL;
    tower.xp = 0;
  }

  if (leveled) {
    const definition = towerDefinitions[tower.id];
    if (tower.id === "sniper") {
      tower.pendingChargeDuration = Math.max(0.18, fireIntervalForTower(definition, tower) - 0.1);
      tower.chargeDuration = tower.pendingChargeDuration;
    }
    if (typeof pushBattleLog === "function") {
      pushBattleLog(`${definition.name} reached level ${tower.level}`, tower.level >= TOWER_MAX_LEVEL ? "EVOLUTION READY" : "+COMBAT POWER", tower.level >= TOWER_MAX_LEVEL ? "core" : "");
    }
  }
}

/* === Pass 42: reference-matched tower inspector without touching game runtime === */
(() => {
  const originalBuildTowerInspector = buildTowerInspector;

  buildTowerInspector = function buildTowerInspectorReference() {
    ensureHudRefs();
    const tower = state.selectedPlacedTower;
    if (state.screen !== "game" || !tower) {
      ui.towerInspector.classList.remove("evolution-open");
      ui.towerInspector.classList.add("hidden");
      ui.towerInspector.innerHTML = "";
      return;
    }

    const definition = towerDefinitions[tower.id];
    const evolution = getTowerEvolutionDefinition(tower);
    const allEvolutionOptions = towerEvolutionDefinitions[tower.id] || [];
    const evolutionOptions = tower.level >= 3 && !tower.evolution
      ? allEvolutionOptions.filter(option => isEvolutionUnlockedByResearch(tower.id, option.id))
      : [];
    const hasLockedEvolutions = tower.level >= 3 && !tower.evolution && allEvolutionOptions.length > 0 && evolutionOptions.length === 0;
    const choosingEvolution = evolutionOptions.length > 0;
    const damage = definition.kind === "infrastructure"
      ? Math.round(refineryConversionRatePerSecond())
      : Math.round(damageForTower(definition, tower));
    const range = definition.kind === "infrastructure"
      ? maxRefineryCount()
      : Math.round(towerRange(definition, tower));
    const fireRate = definition.kind === "infrastructure"
      ? `${Math.round(refineryMaterialYield() * 100)}%`
      : `${fireIntervalForTower(definition, tower).toFixed(2)}s`;
    const target = towerTargetLabel(definition);
    const levelPips = definition.kind === "infrastructure"
      ? ""
      : `<span class="tower-level-pips">${[1, 2, 3].map(level => `<i class="${tower.level >= level ? "filled" : ""}"></i>`).join("")}</span>`;

    ui.towerInspector.classList.toggle("evolution-open", choosingEvolution);
    ui.towerInspector.innerHTML = `
      <section class="reference-tower-summary">
        <div class="reference-tower-portrait">
          <img alt="${definition.name}" src="${svgData(towerThumbSvg(definition.id))}">
        </div>
        <div class="reference-tower-data">
          <div class="reference-tower-name">${definition.name}</div>
          <div class="reference-tower-level">${definition.kind === "infrastructure" ? "ENGINEERING" : `LVL ${tower.level}`} ${levelPips}</div>
          <div class="reference-stat-list">
            <div><span>${definition.kind === "infrastructure" ? "CONVERT" : "DAMAGE"}</span><strong>${damage}</strong></div>
            <div><span>${definition.kind === "infrastructure" ? "SLOTS" : "RANGE"}</span><strong>${range}</strong></div>
            <div><span>${definition.kind === "infrastructure" ? "YIELD" : "FIRE RATE"}</span><strong>${fireRate}</strong></div>
            <div><span>TARGET</span><strong>${target}</strong></div>
          </div>
        </div>
      </section>
      <section class="reference-tower-action" aria-live="polite"></section>
    `;

    const actionZone = ui.towerInspector.querySelector(".reference-tower-action");

    if (definition.kind === "infrastructure") {
      actionZone.innerHTML = `
        <div class="reference-evolution-header">
          <b>Biomass Processing</b>
          <span>Resource conversion active</span>
        </div>
        <div class="reference-status-copy">Converts stored biomass into technology materials while the refinery remains operational.</div>
      `;
    } else if (tower.level < 3) {
      const upgradeCost = towerUpgradeCost(definition, tower);
      actionZone.innerHTML = `
        <div class="reference-evolution-header">
          <b>Upgrade Available</b>
          <span>Improve combat performance</span>
        </div>
      `;
      const upgradeButton = document.createElement("button");
      upgradeButton.type = "button";
      upgradeButton.className = "reference-primary-action";
      upgradeButton.textContent = `Upgrade ${upgradeCost}`;
      upgradeButton.disabled = state.coins < upgradeCost;
      upgradeButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        upgradeTower(tower);
      });
      actionZone.appendChild(upgradeButton);
    } else if (choosingEvolution) {
      let selectedEvolutionId = evolutionOptions[0].id;
      actionZone.innerHTML = `
        <div class="reference-evolution-header">
          <b>Evolution Available</b>
          <span>Choose an evolution path</span>
        </div>
        <div class="reference-evolution-grid"></div>
      `;
      const grid = actionZone.querySelector(".reference-evolution-grid");
      const cards = [];
      evolutionOptions.forEach((option, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = `reference-evolution-card ${index === 0 ? "selected" : ""}`;
        card.innerHTML = `
          <img alt="${option.name}" src="${svgData(evolutionThumbSvg(tower.id, option.id))}">
          <b>${option.name}</b>
          <span>${option.text}</span>
        `;
        card.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          selectedEvolutionId = option.id;
          cards.forEach(item => item.classList.remove("selected"));
          card.classList.add("selected");
        });
        cards.push(card);
        grid.appendChild(card);
      });
      const chooseButton = document.createElement("button");
      chooseButton.type = "button";
      chooseButton.className = "reference-primary-action choose-evolution-action";
      chooseButton.textContent = "Choose Evolution";
      chooseButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        applyTowerEvolution(tower, selectedEvolutionId);
      });
      actionZone.appendChild(chooseButton);
    } else if (hasLockedEvolutions) {
      actionZone.innerHTML = `
        <div class="reference-evolution-header">
          <b>Evolution Locked</b>
          <span>Research required</span>
        </div>
        <div class="reference-status-copy">Unlock an evolution blueprint for this tower in the Research Laboratory.</div>
      `;
    } else if (evolution) {
      actionZone.innerHTML = `
        <div class="reference-evolution-header">
          <b>${evolution.name}</b>
          <span>Evolution bonus</span>
        </div>
        <div class="reference-evolution-active">
          <img alt="${evolution.name}" src="${svgData(evolutionThumbSvg(tower.id, evolution.id))}">
          <p>${evolution.text}</p>
        </div>
      `;
    } else {
      originalBuildTowerInspector();
      return;
    }

    state.inspectorTimer = 999;
    ui.towerInspector.classList.remove("hidden");
  };
})();



/* === Pass 56: Orbital Highway map, aerial corridor and anti-air antenna === */
(() => {
  const orbitalHighwayRoutes = [
    [
      { x: -260, y: 468 },
      { x: 80, y: 468 },
      { x: 300, y: 454 },
      { x: 540, y: 454 },
      { x: 780, y: 468 },
      { x: 1086, y: 468 },
      { x: 1178, y: 506 },
      { x: 1232, y: 540 }
    ],
    [
      { x: -280, y: 205 },
      { x: 120, y: 205 },
      { x: 360, y: 188 },
      { x: 620, y: 202 },
      { x: 842, y: 226 },
      { x: 1036, y: 302 },
      { x: 1144, y: 412 },
      { x: 1232, y: 540 }
    ]
  ];

  const orbitalHighwayBuildings = [
    { id: "orbital-roof-01", x: 78, y: 72, width: 150, height: 96, levels: 2, rangeBonus: 1.14, variant: "relay", corner: "se", sideColor: "#364555", topColor: "#53697e" },
    { id: "orbital-roof-02", x: 282, y: 84, width: 142, height: 106, levels: 3, rangeBonus: 1.2, variant: "tower", corner: "sw", sideColor: "#47475a", topColor: "#67677d" },
    { id: "orbital-antenna-roof", x: 520, y: 76, width: 172, height: 112, levels: 2, rangeBonus: 1.18, variant: "bastion", corner: "se", sideColor: "#384b5c", topColor: "#587186" },
    { id: "orbital-roof-04", x: 752, y: 88, width: 150, height: 102, levels: 3, rangeBonus: 1.2, variant: "relay", corner: "sw", sideColor: "#504a55", topColor: "#73697a" },
    { id: "orbital-roof-05", x: 972, y: 92, width: 144, height: 94, levels: 2, rangeBonus: 1.12, variant: "green", corner: "se", sideColor: "#3e4b4a", topColor: "#5d706b" },
    { id: "orbital-roof-06", x: 118, y: 560, width: 154, height: 96, levels: 2, rangeBonus: 1.14, variant: "hab", corner: "ne", sideColor: "#414c59", topColor: "#617080" },
    { id: "orbital-roof-07", x: 356, y: 574, width: 154, height: 92, levels: 2, rangeBonus: 1.16, variant: "bastion", corner: "nw", sideColor: "#4a4550", topColor: "#6c6170" },
    { id: "orbital-roof-08", x: 604, y: 562, width: 146, height: 102, levels: 3, rangeBonus: 1.2, variant: "tower", corner: "ne", sideColor: "#3d4b5a", topColor: "#5a6e82" },
    { id: "orbital-roof-09", x: 836, y: 574, width: 156, height: 96, levels: 2, rangeBonus: 1.14, variant: "relay", corner: "nw", sideColor: "#4b4b55", topColor: "#6c6a77" },
    { id: "orbital-ruin-edge", x: 1080, y: 616, width: 130, height: 78, levels: 1, rangeBonus: 1, variant: "ruin", corner: "nw", ruined: true, sideColor: "#42434f", topColor: "#5e5966" }
  ];

  const antennaPosition = { x: 606, y: 136 };
  const antennaRestoreCost = 90;
  const antennaActivationCost = 40;
  const antennaActiveDuration = 12;
  const antennaCooldownDuration = 18;

  const orbitalHighwayMap = {
    id: "orbitalHighway",
    name: "Orbital Highway",
    wavesToWin: 11,
    difficulty: 1.42,
    medalReward: 12,
    type: "Aerial Corridor",
    biome: "Orbital Transit Causeway",
    battleTheme: "orbital",
    risk: "High",
    reward: "12 Technology Cores, anti-air relay access route",
    terrain: "A long elevated highway with combat rooftops on both sides of the main road.",
    threats: "Heavy Sky Wasp swarms and armored Sky Mantas use a separate aerial corridor above the ground route.",
    mechanicTitle: "Air Superiority",
    mechanicText: "Ground enemies use the highway while flying monsters enter through a separate aerial corridor. Restore and activate the old anti-air antenna to improve tracking against airborne targets.",
    introText: "The highway carries ground packs in a nearly straight line, but the infected air corridor is active above it. Restore the anti-air antenna for 90 materials. Each activation costs 40 materials and temporarily marks flying enemies, reduces Plasma misses and increases tower damage against airborne targets.",
    battleCamera: { zoom: 0.78, offsetX: 0, offsetY: -48 },
    planetX: 48,
    planetY: 25,
    links: ["twinBreach", "midtown", "nightline", "orbitalRoad"]
  };

  if (!mapDefinitions.some(map => map.id === orbitalHighwayMap.id)) {
    const orbitalRoadIndex = mapDefinitions.findIndex(map => map.id === "orbitalRoad");
    mapDefinitions.splice(orbitalRoadIndex >= 0 ? orbitalRoadIndex : mapDefinitions.length, 0, orbitalHighwayMap);
  }

  ["twinBreach", "midtown", "nightline", "orbitalRoad"].forEach(mapId => {
    const map = mapDefinitions.find(item => item.id === mapId);
    if (map && !map.links.includes("orbitalHighway")) {
      map.links.push("orbitalHighway");
    }
  });

  function ensureOrbitalAntennaState() {
    if (!state.orbitalHighwayAntenna) {
      state.orbitalHighwayAntenna = {
        restored: false,
        activeTimer: 0,
        cooldown: 0,
        hover: false
      };
    }
    return state.orbitalHighwayAntenna;
  }

  let antennaInspectorSignature = "";

  function buildMapStructureInspector(force = false) {
    ensureHudRefs();
    const structure = state.selectedMapStructure;
    if (state.screen !== "game" || !structure || structure.id !== "orbitalAntenna") {
      return;
    }

    const antenna = ensureOrbitalAntennaState();
    const active = antenna.activeTimer > 0;
    const ready = antenna.restored && antenna.cooldown <= 0;
    const activeBucket = Math.ceil(antenna.activeTimer * 4) / 4;
    const cooldownBucket = Math.ceil(antenna.cooldown * 4) / 4;
    const signature = [
      antenna.restored ? 1 : 0,
      activeBucket.toFixed(2),
      cooldownBucket.toFixed(2),
      state.coins
    ].join("|");

    if (!force && signature === antennaInspectorSignature) {
      return;
    }
    antennaInspectorSignature = signature;

    const stateLine = !antenna.restored
      ? `RESTORE - ${antennaRestoreCost}`
      : active
        ? `ACTIVE ${antenna.activeTimer.toFixed(1)}s`
        : antenna.cooldown > 0
          ? `COOLDOWN ${antenna.cooldown.toFixed(1)}s`
          : `ACTIVATE - ${antennaActivationCost}`;

    ui.towerInspector.classList.remove("evolution-open");
    ui.towerInspector.innerHTML = `
      <section class="reference-tower-summary">
        <div class="reference-tower-portrait">
          <img alt="Anti-Air Relay" src="${svgData(towerThumbSvg('tesla'))}">
        </div>
        <div class="reference-tower-data">
          <div class="reference-tower-name">Anti-Air Relay</div>
          <div class="reference-tower-level">MAP STRUCTURE <span class="tower-level-pips"><i class="filled"></i><i class="filled"></i><i></i></span></div>
          <div class="reference-stat-list">
            <div><span>STATUS</span><strong>${!antenna.restored ? 'OFFLINE' : active ? 'ONLINE' : antenna.cooldown > 0 ? 'COOLING' : 'READY'}</strong></div>
            <div><span>AIR LOCK</span><strong>+25%</strong></div>
            <div><span>PLASMA MISS</span><strong>${active ? '5%' : '32%'}</strong></div>
            <div><span>UPTIME</span><strong>${antennaActiveDuration}s</strong></div>
          </div>
        </div>
      </section>
      <section class="reference-tower-action">
        <div class="reference-evolution-header">
          <b>Orbital Highway Utility</b>
          <span>${stateLine}</span>
        </div>
        <div class="reference-status-copy">Restore the relay, then activate it with materials. While active it highlights flying enemies, reduces Plasma misses against them, prioritizes airborne targets and increases tower damage to air units.</div>
      </section>
    `;

    const actionZone = ui.towerInspector.querySelector('.reference-tower-action');
    const actionButton = document.createElement('button');
    actionButton.type = 'button';
    actionButton.className = 'reference-primary-action';
    actionButton.textContent = !antenna.restored
      ? `Restore ${antennaRestoreCost}`
      : active
        ? 'Relay Active'
        : antenna.cooldown > 0
          ? `Cooldown ${antenna.cooldown.toFixed(1)}s`
          : `Activate ${antennaActivationCost}`;
    actionButton.disabled = active || (antenna.restored && antenna.cooldown > 0);
    actionButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      interactWithOrbitalAntenna();
      antennaInspectorSignature = "";
      buildMapStructureInspector(true);
    });
    actionZone.appendChild(actionButton);

    state.inspectorTimer = 999;
    ui.towerInspector.classList.remove('hidden');
  }

  function orbitalAntennaActive() {
    return currentMap().id === "orbitalHighway" && (ensureOrbitalAntennaState().activeTimer || 0) > 0;
  }

  function orbitalHighwayWaveGroups(waveIndex) {
    const base = (waves[waveIndex % waves.length] || [])
      .filter(group => !enemyDefinitions[group.type]?.flying)
      .map(group => ({
        ...group,
        count: Math.max(1, Math.round(group.count * 0.72))
      }));

    const airGroups = [
      {
        type: "skyWasp",
        count: 10 + Math.min(18, waveIndex * 2),
        gap: Math.max(0.22, 0.44 - waveIndex * 0.018)
      }
    ];

    if (waveIndex >= 2) {
      airGroups.push({
        type: "skyManta",
        count: 1 + Math.floor((waveIndex - 1) / 2),
        gap: Math.max(0.58, 1.05 - waveIndex * 0.045)
      });
    }

    return [...base, ...airGroups];
  }

  const previousActivePathDefinitions = activePathDefinitions;
  activePathDefinitions = function activePathDefinitionsWithOrbitalHighway() {
    if (currentMap()?.id === "orbitalHighway") {
      return orbitalHighwayRoutes;
    }
    return previousActivePathDefinitions();
  };

  const previousActiveBuildingDefinitions = activeBuildingDefinitions;
  activeBuildingDefinitions = function activeBuildingDefinitionsWithOrbitalHighway() {
    if (currentMap()?.id === "orbitalHighway") {
      return orbitalHighwayBuildings;
    }
    return previousActiveBuildingDefinitions();
  };

  function traceAirCorridor(route) {
    traceRoute(route);
    context.strokeStyle = "rgba(77,175,235,0.08)";
    context.lineWidth = 30;
    context.stroke();

    traceRoute(route);
    context.strokeStyle = "rgba(111,212,255,0.22)";
    context.lineWidth = 4;
    context.stroke();

    context.setLineDash([10, 15]);
    traceRoute(route);
    context.strokeStyle = "rgba(178,237,255,0.76)";
    context.lineWidth = 2;
    context.stroke();
    context.setLineDash([]);

    for (let step = 1; step < 7; step += 1) {
      const point = samplePath(step / 7, 1);
      context.fillStyle = "rgba(8,20,31,0.92)";
      context.beginPath();
      context.arc(point.x, point.y, 8, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(130,224,255,0.7)";
      context.lineWidth = 1.4;
      context.stroke();
      context.fillStyle = "rgba(178,239,255,0.96)";
      context.beginPath();
      context.arc(point.x, point.y, 2.3, 0, Math.PI * 2);
      context.fill();
    }
  }

  const previousDrawPath = drawPath;
  drawPath = function drawPathWithOrbitalHighway() {
    if (currentMap().id !== "orbitalHighway") {
      previousDrawPath();
      return;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    strokeRouteVisual(orbitalHighwayRoutes[0]);
    traceAirCorridor(orbitalHighwayRoutes[1]);

    context.save();
    context.fillStyle = "rgba(11,24,35,0.82)";
    context.beginPath();
    context.roundRect(104, 176, 116, 26, 8);
    context.fill();
    context.strokeStyle = "rgba(98,205,255,0.34)";
    context.stroke();
    context.fillStyle = "rgba(171,232,255,0.92)";
    context.font = "700 11px Inter, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("AIR CORRIDOR", 162, 190);
    context.restore();
  };

  function drawOrbitalHighwayEdgeDetails() {
    const bounds = currentBattleSceneBounds(150);
    context.save();

    const horizon = context.createLinearGradient(bounds.left, 0, bounds.right, 0);
    horizon.addColorStop(0, "rgba(77,132,180,0.02)");
    horizon.addColorStop(0.5, "rgba(108,196,255,0.08)");
    horizon.addColorStop(1, "rgba(77,132,180,0.02)");
    context.fillStyle = horizon;
    context.fillRect(bounds.left, 150, bounds.right - bounds.left, 100);

    for (let x = -40; x < 1260; x += 118) {
      context.fillStyle = "rgba(10,19,28,0.82)";
      context.beginPath();
      context.roundRect(x, 374, 74, 12, 4);
      context.fill();
      context.fillStyle = "rgba(84,204,255,0.28)";
      context.beginPath();
      context.roundRect(x + 12, 378, 50, 3, 1.5);
      context.fill();
    }

    [230, 446, 714, 930].forEach((x, index) => {
      context.strokeStyle = index % 2 === 0 ? "rgba(84,204,255,0.22)" : "rgba(242,188,100,0.18)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(x, 356);
      context.lineTo(x, 476);
      context.stroke();
      context.fillStyle = "rgba(11,19,28,0.92)";
      context.beginPath();
      context.roundRect(x - 8, 350, 16, 18, 4);
      context.fill();
      context.strokeStyle = "rgba(105,176,220,0.22)";
      context.stroke();
    });

    context.restore();
  }

  function drawOrbitalAntenna() {
    if (currentMap().id !== "orbitalHighway") {
      return;
    }

    const antenna = ensureOrbitalAntennaState();
    const active = antenna.activeTimer > 0;
    const ready = antenna.restored && antenna.cooldown <= 0;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.006);

    context.save();
    context.translate(antennaPosition.x, antennaPosition.y);

    if (active) {
      const scan = context.createRadialGradient(0, 0, 8, 0, 0, 92 + pulse * 12);
      scan.addColorStop(0, "rgba(123,226,255,0.22)");
      scan.addColorStop(0.55, "rgba(83,193,255,0.08)");
      scan.addColorStop(1, "rgba(83,193,255,0)");
      context.fillStyle = scan;
      context.beginPath();
      context.arc(0, 0, 104, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = "rgba(5,11,18,0.42)";
    context.beginPath();
    context.ellipse(0, 18, 48, 22, 0, 0, Math.PI * 2);
    context.fill();

    const floorGradient = context.createLinearGradient(-44, -18, 44, 24);
    floorGradient.addColorStop(0, antenna.restored ? "#edf3f7" : "#89919a");
    floorGradient.addColorStop(0.28, antenna.restored ? "#c3ccd5" : "#646b73");
    floorGradient.addColorStop(0.62, antenna.restored ? "#6b7784" : "#4c535b");
    floorGradient.addColorStop(1, "#2b3440");
    drawPlasmaSquareBase(0, 10, 36, 24, floorGradient, antenna.restored ? "rgba(102,222,255,0.2)" : "rgba(170,170,170,0.12)");

    const bodyGradient = context.createLinearGradient(-26, -24, 26, 24);
    bodyGradient.addColorStop(0, antenna.restored ? "#eef3f7" : "#8b9198");
    bodyGradient.addColorStop(0.3, antenna.restored ? "#c1cad3" : "#666d75");
    bodyGradient.addColorStop(0.68, antenna.restored ? "#707d8a" : "#4d545c");
    bodyGradient.addColorStop(1, "#2e3742");
    context.fillStyle = bodyGradient;
    context.beginPath();
    context.moveTo(-14, -24);
    context.lineTo(14, -24);
    context.lineTo(26, -12);
    context.lineTo(26, 12);
    context.lineTo(14, 24);
    context.lineTo(-14, 24);
    context.lineTo(-26, 12);
    context.lineTo(-26, -12);
    context.closePath();
    context.fill();
    context.strokeStyle = antenna.restored ? "rgba(236,242,246,0.18)" : "rgba(180,186,194,0.14)";
    context.lineWidth = 1.1;
    context.stroke();

    context.strokeStyle = "rgba(32,40,50,0.34)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(-14, -16);
    context.lineTo(-14, 16);
    context.moveTo(14, -16);
    context.lineTo(14, 16);
    context.moveTo(0, -24);
    context.lineTo(0, 24);
    context.moveTo(-18, -6);
    context.lineTo(18, -6);
    context.moveTo(-18, 6);
    context.lineTo(18, 6);
    context.stroke();

    [[-28, -6], [28, -6], [-28, 10], [28, 10]].forEach(([x, y]) => {
      context.fillStyle = bodyGradient;
      context.beginPath();
      context.roundRect(x - 4, y - 8, 8, 16, 3);
      context.fill();
      context.fillStyle = antenna.restored ? `rgba(99,217,255,${0.24 + pulse * 0.18})` : "rgba(150,155,160,0.22)";
      context.beginPath();
      context.roundRect(x - 1.1, y - 2.2, 2.2, 6.8, 1);
      context.fill();
    });

    context.fillStyle = "rgba(12,18,25,0.82)";
    context.beginPath();
    context.ellipse(0, -2, 18, 9.5, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = antenna.restored ? "rgba(144,226,255,0.46)" : "rgba(150,156,162,0.2)";
    context.lineWidth = 1.2;
    context.stroke();

    context.strokeStyle = antenna.restored ? "rgba(191,239,255,0.9)" : "rgba(125,132,140,0.7)";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(0, -8);
    context.lineTo(0, -42);
    context.stroke();
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, -40, 24, Math.PI * 1.12, Math.PI * 1.88);
    context.stroke();
    context.beginPath();
    context.arc(0, -40, 16, Math.PI * 1.15, Math.PI * 1.85);
    context.stroke();

    context.fillStyle = active
      ? `rgba(142,236,255,${0.72 + pulse * 0.22})`
      : ready
        ? "rgba(112,221,255,0.9)"
        : antenna.restored
          ? "rgba(242,188,100,0.7)"
          : "rgba(133,139,145,0.72)";
    context.shadowColor = active ? "rgba(100,220,255,0.9)" : "transparent";
    context.shadowBlur = active ? 18 : 0;
    context.beginPath();
    context.arc(0, -40, 5.2, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;

    if (!antenna.restored) {
      context.strokeStyle = "rgba(217,95,99,0.76)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-18, -30);
      context.lineTo(18, -50);
      context.moveTo(-16, -50);
      context.lineTo(16, -30);
      context.stroke();
    }

    const labelWidth = 154;
    context.fillStyle = antenna.hover || state.selectedMapStructure?.id === 'orbitalAntenna' ? "rgba(7,17,27,0.98)" : "rgba(7,17,27,0.9)";
    context.beginPath();
    context.roundRect(-labelWidth / 2, 34, labelWidth, 28, 9);
    context.fill();
    context.strokeStyle = active ? "rgba(122,226,255,0.65)" : antenna.restored ? "rgba(100,190,235,0.38)" : "rgba(217,95,99,0.38)";
    context.stroke();

    context.fillStyle = "rgba(232,242,249,0.96)";
    context.font = "700 11px Inter, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("ANTI-AIR RELAY", 0, 48);
    context.restore();
  }

  const previousDrawMap = drawMap;
  drawMap = function drawMapWithOrbitalHighway() {
    previousDrawMap();
    if (currentMap().id === "orbitalHighway") {
      drawOrbitalHighwayEdgeDetails();
      drawOrbitalAntenna();
    }
  };

  const previousStartWave = startWave;
  startWave = function startWaveWithOrbitalHighway() {
    if (currentMap().id !== "orbitalHighway") {
      previousStartWave();
      return;
    }
    if (state.screen !== "game" || state.runningWave || state.stability <= 0 || state.runEnded || state.paused || isDraftOpen()) {
      return;
    }

    const groups = orbitalHighwayWaveGroups(state.wave);
    state.spawnQueue = [];
    let groundCursor = 0;
    let airCursor = 0.5;

    groups.forEach(group => {
      const flying = Boolean(enemyDefinitions[group.type]?.flying);
      let cursor = flying ? airCursor : groundCursor;
      for (let index = 0; index < group.count; index += 1) {
        state.spawnQueue.push({
          time: cursor,
          type: group.type,
          routeIndex: flying ? 1 : 0
        });
        cursor += group.gap;
      }
      if (flying) {
        airCursor = cursor + 0.5;
      } else {
        groundCursor = cursor + 0.7;
      }
    });

    state.spawnQueue.sort((a, b) => a.time - b.time);
    state.spawnTimer = 0;
    state.autoStartTimer = 0;
    state.runningWave = true;
    ui.startWave.disabled = true;
    pushBattleLog(`Wave ${state.wave + 1} deployed`, "AIR + GROUND", "");
    syncUI();
  };

  const previousPreviewWaveGroups = previewWaveGroups;
  previewWaveGroups = function previewWaveGroupsWithOrbitalHighway() {
    if (currentMap().id === "orbitalHighway") {
      const offset = state.runningWave ? 1 : 0;
      return orbitalHighwayWaveGroups(state.wave + offset);
    }
    return previousPreviewWaveGroups();
  };

  const previousWavesUntilBoss = wavesUntilBoss;
  wavesUntilBoss = function wavesUntilBossWithOrbitalHighway() {
    if (currentMap().id !== "orbitalHighway") {
      return previousWavesUntilBoss();
    }
    const start = state.runningWave ? state.wave + 1 : state.wave;
    for (let index = 0; index < 20; index += 1) {
      if (orbitalHighwayWaveGroups(start + index).some(group => enemyDefinitions[group.type]?.boss)) {
        return index + 1;
      }
    }
    return "-";
  };

  const previousEnemyDamageMultiplier = enemyDamageMultiplier;
  enemyDamageMultiplier = function enemyDamageMultiplierWithAntenna(enemy, sourceTower = null) {
    let multiplier = previousEnemyDamageMultiplier(enemy, sourceTower);
    if (sourceTower && enemy?.flying && orbitalAntennaActive()) {
      multiplier *= 1.25;
    }
    return multiplier;
  };

  const previousCompareTowerTargets = compareTowerTargets;
  compareTowerTargets = function compareTowerTargetsWithAntenna(definition, a, b) {
    if (orbitalAntennaActive() && Boolean(a?.flying) !== Boolean(b?.flying)) {
      return Number(Boolean(b?.flying)) - Number(Boolean(a?.flying));
    }
    return previousCompareTowerTargets(definition, a, b);
  };

  const previousDrawEnemies = drawEnemies;
  drawEnemies = function drawEnemiesWithAntennaHighlight() {
    previousDrawEnemies();
    if (!orbitalAntennaActive()) {
      return;
    }
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.012);
    state.enemies.forEach(enemy => {
      if (!enemy.flying) {
        return;
      }
      context.save();
      context.globalCompositeOperation = "screen";
      context.strokeStyle = `rgba(126,226,255,${0.55 + pulse * 0.28})`;
      context.lineWidth = 2;
      context.setLineDash([5, 4]);
      context.beginPath();
      context.arc(enemy.pos.x, enemy.pos.y, (enemy.radius || 10) + 10 + pulse * 3, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = `rgba(126,226,255,${0.3 + pulse * 0.22})`;
      context.beginPath();
      context.arc(enemy.pos.x, enemy.pos.y - (enemy.radius || 10) - 12, 3, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  };

  function interactWithOrbitalAntenna() {
    const antenna = ensureOrbitalAntennaState();
    if (!antenna.restored) {
      if (state.coins < antennaRestoreCost) {
        pushBattleLog("Anti-air relay", `Need ${antennaRestoreCost} materials`, "danger");
        return;
      }
      state.coins -= antennaRestoreCost;
      antenna.restored = true;
      antenna.cooldown = 0;
      pushBattleLog("Anti-air relay restored", "ONLINE", "core");
      syncUI();
      return;
    }

    if (antenna.activeTimer > 0) {
      pushBattleLog("Anti-air relay", `${antenna.activeTimer.toFixed(1)}s active`, "core");
      return;
    }
    if (antenna.cooldown > 0) {
      pushBattleLog("Anti-air relay cooling", `${antenna.cooldown.toFixed(1)}s`, "");
      return;
    }
    if (state.coins < antennaActivationCost) {
      pushBattleLog("Anti-air relay", `Need ${antennaActivationCost} materials`, "danger");
      return;
    }

    state.coins -= antennaActivationCost;
    antenna.activeTimer = antennaActiveDuration;
    antenna.cooldown = antennaCooldownDuration;
    pushBattleLog("Air targets illuminated", "+25% DAMAGE", "core");
    syncUI();
  }

  const previousPlaceTower = placeTower;
  placeTower = function placeTowerWithOrbitalAntenna(world, options = {}) {
    if (
      currentMap().id === "orbitalHighway" &&
      !state.abilityTargetingId &&
      !state.deleteMode &&
      distance(world, antennaPosition) <= 54
    ) {
      state.selectedPlacedTower = null;
      state.selectedMapStructure = { id: "orbitalAntenna", name: "Anti-Air Relay" };
      state.selectedTowerId = null;
      state.placementGhost.visible = false;
      buildTowerBar();
      antennaInspectorSignature = "";
      buildMapStructureInspector(true);
      return;
    }
    return previousPlaceTower(world, options);
  };

  canvas.addEventListener("pointermove", event => {
    const antenna = ensureOrbitalAntennaState();
    if (currentMap().id !== "orbitalHighway" || state.screen !== "game") {
      antenna.hover = false;
      return;
    }
    antenna.hover = distance(canvasPoint(event), antennaPosition) <= 54;
    if (antenna.hover && !state.abilityTargetingId && !state.deleteMode) {
      canvas.style.cursor = "pointer";
    }
  });

  canvas.addEventListener("pointerleave", () => {
    ensureOrbitalAntennaState().hover = false;
  });

  const previousUpdate = update;
  update = function updateWithOrbitalAntenna(delta) {
    previousUpdate(delta);
    if (state.screen !== "game" || state.paused || state.runEnded || isDraftOpen()) {
      return;
    }
    const antenna = ensureOrbitalAntennaState();
    const dt = delta * state.speed;
    antenna.activeTimer = Math.max(0, antenna.activeTimer - dt);
    antenna.cooldown = Math.max(0, antenna.cooldown - dt);
    if (state.selectedMapStructure?.id === "orbitalAntenna") {
      buildMapStructureInspector(false);
    }
  };

  const previousResetRun = resetRun;
  resetRun = function resetRunWithOrbitalAntenna() {
    previousResetRun();
    state.selectedMapStructure = null;
    state.orbitalHighwayAntenna = {
      restored: false,
      activeTimer: 0,
      cooldown: 0,
      hover: false
    };
  };

  if (state.screen === "campaign") {
    buildCampaignMapV2();
  } else if (state.screen === "menu") {
    buildModeList();
    buildDifficultyList();
    buildMapList();
  }
})();

(() => {
  const previousDistanceToPath = distanceToPath;
  distanceToPath = function distanceToPathIgnoringAirCorridor(point) {
    if (currentMap().id !== "orbitalHighway") {
      return previousDistanceToPath(point);
    }
    let best = Infinity;
    const geometry = pathGeometry(0);
    geometry.segments.forEach(segment => {
      const vx = segment.to.x - segment.from.x;
      const vy = segment.to.y - segment.from.y;
      const wx = point.x - segment.from.x;
      const wy = point.y - segment.from.y;
      const denominator = vx * vx + vy * vy || 1;
      const c = Math.max(0, Math.min(1, (wx * vx + wy * vy) / denominator));
      const projection = { x: segment.from.x + vx * c, y: segment.from.y + vy * c };
      best = Math.min(best, distance(point, projection));
    });
    return best;
  };
})();


/* === Pass 59 final inspector: automatic XP leveling and evolution at level 10 === */
(() => {
  buildTowerInspector = function buildTowerInspectorXpSystem() {
    ensureHudRefs();
    const tower = state.selectedPlacedTower;
    if (state.screen !== "game" || !tower) {
      if (!state.selectedMapStructure) {
        ui.towerInspector.classList.remove("evolution-open");
        ui.towerInspector.classList.add("hidden");
        ui.towerInspector.innerHTML = "";
      }
      return;
    }

    const definition = towerDefinitions[tower.id];
    tower.level = clamp(Math.round(tower.level || 1), 1, TOWER_MAX_LEVEL);
    tower.xp = Math.max(0, Number(tower.xp) || 0);
    const evolution = getTowerEvolutionDefinition(tower);
    const allEvolutionOptions = towerEvolutionDefinitions[tower.id] || [];
    const evolutionOptions = tower.level >= TOWER_MAX_LEVEL && !tower.evolution
      ? allEvolutionOptions.filter(option => isEvolutionUnlockedByResearch(tower.id, option.id))
      : [];
    const hasLockedEvolutions = tower.level >= TOWER_MAX_LEVEL && !tower.evolution && allEvolutionOptions.length > 0 && evolutionOptions.length === 0;
    const choosingEvolution = evolutionOptions.length > 0;
    const damage = definition.kind === "infrastructure"
      ? refineryConversionRatePerSecond().toFixed(1)
      : Math.round(damageForTower(definition, tower));
    const range = definition.kind === "infrastructure"
      ? maxRefineryCount()
      : Math.round(towerRange(definition, tower));
    const fireRate = definition.kind === "infrastructure"
      ? `${Math.round(refineryMaterialYield() * 100)}%`
      : `${fireIntervalForTower(definition, tower).toFixed(2)}s`;
    const target = towerTargetLabel(definition);
    const nextXp = towerXpToNextLevel(tower.level);
    const xpRatio = nextXp > 0 ? clamp(tower.xp / nextXp, 0, 1) : 1;
    const levelPips = definition.kind === "infrastructure"
      ? ""
      : `<span class="tower-level-pips tower-level-pips-ten">${Array.from({ length: TOWER_MAX_LEVEL }, (_, index) => `<i class="${tower.level >= index + 1 ? "filled" : ""}"></i>`).join("")}</span>`;

    ui.towerInspector.classList.toggle("evolution-open", choosingEvolution);
    ui.towerInspector.innerHTML = `
      <section class="reference-tower-summary">
        <div class="reference-tower-portrait">
          <img alt="${definition.name}" src="${svgData(towerThumbSvg(definition.id))}">
        </div>
        <div class="reference-tower-data">
          <div class="reference-tower-name">${definition.name}</div>
          <div class="reference-tower-level">${definition.kind === "infrastructure" ? "ENGINEERING" : `LVL ${tower.level} / ${TOWER_MAX_LEVEL}`} ${levelPips}</div>
          <div class="reference-stat-list">
            <div><span>${definition.kind === "infrastructure" ? "CONVERT" : "DAMAGE"}</span><strong>${damage}</strong></div>
            <div><span>${definition.kind === "infrastructure" ? "SLOTS" : "RANGE"}</span><strong>${range}</strong></div>
            <div><span>${definition.kind === "infrastructure" ? "YIELD" : "FIRE RATE"}</span><strong>${fireRate}</strong></div>
            <div><span>TARGET</span><strong>${target}</strong></div>
          </div>
        </div>
      </section>
      <section class="reference-tower-action" aria-live="polite"></section>
    `;

    const actionZone = ui.towerInspector.querySelector(".reference-tower-action");

    if (definition.kind === "infrastructure") {
      actionZone.innerHTML = `
        <div class="reference-evolution-header">
          <b>Biomass Processing</b>
          <span>${refineryConversionRatePerSecond().toFixed(1)} biomass/sec</span>
        </div>
        <div class="reference-status-copy">Processes biomass ten times more slowly than before and converts it into technology materials while operational.</div>
      `;
    } else if (tower.level < TOWER_MAX_LEVEL) {
      actionZone.innerHTML = `
        <div class="reference-evolution-header">
          <b>Combat Experience</b>
          <span>${tower.xp.toFixed(0)} / ${nextXp} XP</span>
        </div>
        <div class="tower-xp-track"><i style="width:${xpRatio * 100}%"></i></div>
        <div class="reference-status-copy">This tower gains experience when it delivers the killing blow. Damage, range and firing speed improve automatically with each level.</div>
      `;
    } else if (choosingEvolution) {
      let selectedEvolutionId = evolutionOptions[0].id;
      actionZone.innerHTML = `
        <div class="reference-evolution-header">
          <b>Evolution Available</b>
          <span>Level 10 reached</span>
        </div>
        <div class="reference-evolution-grid"></div>
      `;
      const grid = actionZone.querySelector(".reference-evolution-grid");
      const cards = [];
      evolutionOptions.forEach((option, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = `reference-evolution-card ${index === 0 ? "selected" : ""}`;
        card.innerHTML = `
          <img alt="${option.name}" src="${svgData(evolutionThumbSvg(tower.id, option.id))}">
          <b>${option.name}</b>
          <span>${option.text}</span>
        `;
        card.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          selectedEvolutionId = option.id;
          cards.forEach(item => item.classList.remove("selected"));
          card.classList.add("selected");
        });
        cards.push(card);
        grid.appendChild(card);
      });
      const chooseButton = document.createElement("button");
      chooseButton.type = "button";
      chooseButton.className = "reference-primary-action choose-evolution-action";
      chooseButton.textContent = "Choose Evolution";
      chooseButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        applyTowerEvolution(tower, selectedEvolutionId);
      });
      actionZone.appendChild(chooseButton);
    } else if (hasLockedEvolutions) {
      actionZone.innerHTML = `
        <div class="reference-evolution-header">
          <b>Evolution Locked</b>
          <span>Level 10 reached</span>
        </div>
        <div class="reference-status-copy">Unlock an evolution blueprint for this tower in the Research Laboratory.</div>
      `;
    } else if (evolution) {
      actionZone.innerHTML = `
        <div class="reference-evolution-header">
          <b>${evolution.name}</b>
          <span>Level 10 evolution</span>
        </div>
        <div class="reference-evolution-active">
          <img alt="${evolution.name}" src="${svgData(evolutionThumbSvg(tower.id, evolution.id))}">
          <p>${evolution.text}</p>
        </div>
      `;
    } else {
      actionZone.innerHTML = `
        <div class="reference-evolution-header">
          <b>Maximum Level</b>
          <span>Level 10 reached</span>
        </div>
        <div class="reference-status-copy">This tower has reached its maximum combat level.</div>
      `;
    }

    state.inspectorTimer = 999;
    ui.towerInspector.classList.remove("hidden");
  };
})();
