export type AllGameData = {
  activePlayer: ActivePlayer;
  allPlayers: Player[];
  events: Events;
  gameData: GameData;
};

export type ActivePlayer = {
  abilities: Abilities;
  championStats: ChampionStats;
  currentGold: number;
  fullRunes: FullRunes;
  level: number;
  riotId: string;
  riotIdGameName: string;
  riotIdTagLine: string;
  summonerName: string;
  teamRelativeColors: boolean;
};

export type ActivePlayerAbilities = Abilities;

export type ActivePlayerRunes = FullRunes;

export type Abilities = {
  E: Ability;
  Passive: Ability;
  Q: Ability;
  R: Ability;
  W: Ability;
};

export type Ability = {
  abilityLevel?: number;
  displayName: string;
  id: string;
  rawDescription: string;
  rawDisplayName: string;
};

export type ChampionStats = {
  abilityHaste: number;
  abilityPower: number;
  armor: number;
  armorPenetrationFlat: number;
  armorPenetrationPercent: number;
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  bonusArmorPenetrationPercent: number;
  bonusMagicPenetrationPercent: number;
  critChance: number;
  critDamage: number;
  currentHealth: number;
  healShieldPower: number;
  healthRegenRate: number;
  lifeSteal: number;
  magicLethality: number;
  magicPenetrationFlat: number;
  magicPenetrationPercent: number;
  magicResist: number;
  maxHealth: number;
  moveSpeed: number;
  omnivamp: number;
  physicalLethality: number;
  physicalVamp: number;
  resourceMax: number;
  resourceRegenRate: number;
  resourceType: string;
  resourceValue: number;
  spellVamp: number;
  tenacity: number;
};

export type FullRunes = {
  generalRunes: GeneralRune[];
  keystone: Keystone;
  primaryRuneTree: RuneTree;
  secondaryRuneTree: RuneTree;
  statRunes: StatRune[];
};

export type GeneralRune = {
  displayName: string;
  id: number;
  rawDescription: string;
  rawDisplayName: string;
};

export type Keystone = {
  displayName: string;
  id: number;
  rawDescription: string;
  rawDisplayName: string;
};

export type RuneTree = {
  displayName: string;
  id: number;
  rawDescription: string;
  rawDisplayName: string;
};

export type StatRune = {
  id: number;
  rawDescription: string;
};

export type Player = {
  championName: string;
  isBot: boolean;
  isDead: boolean;
  items: Item[];
  level: number;
  position: string;
  rawChampionName: string;
  rawSkinName: string;
  respawnTimer: number;
  riotId: string;
  riotIdGameName: string;
  riotIdTagLine: string;
  runes: MainRunes;
  scores: Scores;
  skinID: number;
  skinName: string;
  summonerName: string;
  summonerSpells: SummonerSpells;
  team: TeamID;
};

export type Item = {
  canUse: boolean;
  consumable: boolean;
  count: number;
  displayName: string;
  itemID: number;
  price: number;
  rawDescription: string;
  rawDisplayName: string;
  slot: number;
};

export type MainRunes = {
  keystone: Rune;
  primaryRuneTree: Rune;
  secondaryRuneTree: Rune;
};

export type Rune = {
  displayName: string;
  id: number;
  rawDescription: string;
  rawDisplayName: string;
};

export type Scores = {
  assists: number;
  creepScore: number;
  deaths: number;
  kills: number;
  wardScore: number;
};

export type SummonerSpells = {
  summonerSpellOne: SummonerSpell;
  summonerSpellTwo: SummonerSpell;
};

export type SummonerSpell = {
  displayName: string;
  rawDescription: string;
  rawDisplayName: string;
};

export type Events = {
  Events: GameEvent[];
};

export type GameEvent = {
  EventID: number;
  EventName: string;
  EventTime: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type GameData = {
  gameMode: string;
  gameTime: number;
  mapName: string;
  mapNumber: number;
  mapTerrain: string;
};

export type TeamID = 'ORDER' | 'CHAOS';

export type PlayerList = Player[];

export type PlayerItems = Item[];

export type PlayerMainRunes = MainRunes;

export type PlayerScores = Scores;

export type PlayerSummonerSpells = SummonerSpells;

export type EventData = {
  Events: GameEvent[];
};

export type GameStats = {
  gameMode: string;
  gameTime: number;
  mapName: string;
  mapNumber: number;
  mapTerrain: string;
};
