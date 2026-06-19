const NAMES = [
  // Cosmic & celestial
  'Stellar Run','Nebula Cup','Comet Trial','Lunar Rally','Solar Surge','Astral Clash',
  'Eclipse Open','Meteor Charge','Orbit Cup','Aurora Bout','Quasar Joust','Pulsar Drive',
  'Nova Strike','Galactic Run','Cosmic Verdict','Stardust Saga','Vortex Cup','Singularity',
  'Eventide','Twilight March','Midnight Crown','Dawnbreak','Sundown Cup','Starfall',
  'Skylark Trial','Voidwalk','Lightyear Cup','Helios Charge','Selene Cup','Polaris Joust',
  'Sirius Strike','Vega Surge','Andromeda','Orion Trial','Perseid Rally','Leonid Charge',
  'Equinox Cup','Solstice Trial','Zenith Run','Apogee','Penumbra Open','Heliosphere',

  // Beasts & predators
  'Crimson Howl','Iron Wolf','Silver Falcon','Cobalt Tiger','Lion\'s Reign','Dragonfire',
  'Phoenix Rise','Cobra Strike','Raven Ridge','Hawk\'s Cup','Bear Trail','Lynx Sprint',
  'Stag Run','Bull Rush','Shark Bite','Wolf Pack','Tiger Eye','Falcon Dive',
  'Eagle\'s Crown','Panther March','Jaguar Cup','Ocelot Open','Serpent Coil','Mantis',
  'Scorpion','Viper Strike','Owl\'s Verdict','Stallion Cup','Bison Run','Mustang Rally',
  'Kraken Cup','Hydra Trial','Griffin\'s Crown','Basilisk','Chimera Joust','Manticore',
  'Wyvern Run','Behemoth Cup','Leviathan','Direwolf','Pegasus Sprint','Minotaur Trial',

  // Weather & sky
  'Tempest Cup','Thunder March','Lightning Strike','Blizzard Run','Cyclone Open','Gale Trial',
  'Mistwalk','Hailstorm','Squall Rally','Maelstrom','Stormbreak','Thunderclap',
  'Frostbite Cup','Tundra Trial','Wildfire Rally','Inferno Cup','Embertide','Ashfall',
  'Coldsnap','Heatwave','Monsoon Run','Typhoon Cup','Drizzle Open','Snowdrift',
  'Avalanche','Whirlwind Joust','Calmwater','Stillpond','Drought\'s End','Floodgate',

  // Geography & terrain
  'Summit Cup','Tundra Run','Mesa March','Crater Open','Canyon Joust','Ridge Rally',
  'Vale Run','Glacier Cup','Atoll Trial','Reef Charge','Plateau Cup','Crag Climb',
  'Highlands','Lowlands','Badlands Cup','Borderland','Heartland','Wasteland',
  'Coast Run','Cape Open','Peninsula','Archipelago','Delta Cup','Estuary',
  'Fjord Rally','Lagoon Open','Marsh March','Meadow Cup','Forest Trial','Grove Run',

  // Weapons & combat
  'Blade Drift','Saber\'s Cup','Lance Charge','Hammer Strike','Arrow Run','Spear Trial',
  'Dagger Open','Gauntlet','Shield Wall','Bow\'s Verdict','Rapier Cup','Axe Cup',
  'Mace March','Pike Run','Halberd','Flail Trial','Cutlass Cup','Scimitar',
  'Katana Run','Sai Cup','Glaive Open','Quarterstaff','Crossbow Rally','Trident',

  // Mythological & legendary
  'Titan Trial','Olympus Cup','Asgard Open','Valhalla Run','Avalon Cup','Camelot',
  'Atlantis Rally','El Dorado','Shangri-La','Elysium','Mt. Olympus','Tartarus',
  'Pantheon Cup','Oracle Trial','Sphinx Open','Cerberus Run','Cyclops Cup','Hydra Run',
  'Pegasus Cup','Centaur Trial','Naiad Cup','Dryad Open','Siren\'s Call','Banshee Run',
  'Valkyrie\'s Charge','Berserker','Jotun Cup','Aesir Trial','Vanir Open','Ragnarok',

  // Colors & gemstones
  'Crimson Cup','Azure Open','Onyx Trial','Ivory Run','Amber Surge','Cobalt Cup',
  'Scarlet March','Emerald Joust','Obsidian Run','Verdant Cup','Golden Crown','Silver Trial',
  'Bronze Bout','Argent Cup','Sable Run','Vermilion','Indigo Open','Ruby Rally',
  'Sapphire Cup','Diamond Drive','Pearl Trial','Quartz Cup','Marble March','Granite Run',
  'Opal Open','Topaz Cup','Jade Trial','Garnet Run','Amethyst','Citrine Cup',

  // Abstract & dramatic
  'Reckoning','Verdict Cup','Crucible','Gambit Open','Ascendancy','The Saga',
  'Vanguard','Sentinel Cup','Bastion Trial','Citadel Open','Crown\'s Trial','Throne Run',
  'Legacy Cup','Echo Trial','Tribute Open','Requiem','Vendetta','Crusade Cup',
  'Odyssey','Triumph Cup','Apex Trial','Zenith Open','Genesis Run','Exodus',
  'Renaissance','Revolution','Rebellion','Insurrection','Coronation','Dynasty Cup',
  'Empire Trial','Kingdom Run','Republic Cup','Conclave','Synod Open','Tribunal',

  // Speed & action
  'Sprint Cup','Dash Trial','Bolt Run','Rush Open','Charge Cup','Surge Trial',
  'Dive Run','Leap Cup','Vault Open','Pounce','Strike Run','Blitz Cup',
  'Whirl Trial','Spin Open','Twist Cup','Flip Run','Glide Cup','Soar Trial',
  'Rocket Open','Jet Cup','Pulse Trial','Beat Run','Tempo Cup','Rhythm Open',

  // Champions & honor
  'Champion\'s Cup','Hero\'s Trial','Legend Open','Mythic Run','Master\'s Cup','Knight\'s Joust',
  'Squire Trial','Paladin Run','Crusader Cup','Templar Open','Warden Cup','Marshal Trial',
  'Captain\'s Run','Commander Cup','Admiral Open','General\'s Trial','Sovereign','Regent Cup',
  'Monarch Trial','Emperor Open','Caesar\'s Cup','Khan\'s Run','Shogun Trial','Sultan Cup',

  // Single-word powerhouses
  'Inferno','Frostbite','Stormcaller','Skybreaker','Earthshaker','Wavecrest',
  'Firebrand','Iceheart','Stonefist','Windrunner','Lightbringer','Shadowmoor',
  'Nightfall','Daybreak','Highwind','Lowtide','Deepwood','Brightmere',
  'Darkhollow','Goldcrest','Silvermist','Bluewater','Redrock','Whitepeak',

  // Misc evocative
  'The Hourglass','The Compass','The Anchor','The Helm','The Beacon','The Lighthouse',
  'The Gauntlet','The Crucible','The Forge','The Anvil','The Quill','The Chalice',
  'The Vault','The Pillar','The Pyre','The Wreath','The Diadem','The Scepter'
]

export default NAMES

export function randomName(used = []) {
  const recent = new Set(used.slice(-50))
  const fresh = NAMES.filter(n => !recent.has(n))
  const pool = fresh.length ? fresh : NAMES
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx]
}
