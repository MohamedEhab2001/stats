export const LEAGUES = [
  // International
  { id: 1,   name: 'World Cup',             category: 'international' },
  { id: 4,   name: 'European Championship', category: 'international' },
  { id: 9,   name: 'Copa América',          category: 'international' },
  { id: 6,   name: 'Africa Cup of Nations', category: 'international' },
  { id: 5,   name: 'Nations League',        category: 'international' },
  { id: 7,   name: 'Asian Cup',             category: 'international' },
  // Continental Club
  { id: 2,   name: 'Champions League',      category: 'continental' },
  { id: 3,   name: 'Europa League',         category: 'continental' },
  { id: 848, name: 'Conference League',     category: 'continental' },
  { id: 15,  name: 'Club World Cup',        category: 'continental' },
  // England
  { id: 39,  name: 'Premier League',        category: 'england' },
  { id: 40,  name: 'Championship',          category: 'england' },
  { id: 45,  name: 'FA Cup',               category: 'england' },
  { id: 48,  name: 'League Cup',            category: 'england' },
  // Spain
  { id: 140, name: 'La Liga',               category: 'spain' },
  { id: 141, name: 'La Liga 2',             category: 'spain' },
  { id: 143, name: 'Copa del Rey',          category: 'spain' },
  // Germany
  { id: 78,  name: 'Bundesliga',            category: 'germany' },
  { id: 79,  name: '2. Bundesliga',         category: 'germany' },
  { id: 81,  name: 'DFB Pokal',             category: 'germany' },
  // Italy
  { id: 135, name: 'Serie A',               category: 'italy' },
  { id: 136, name: 'Serie B',               category: 'italy' },
  { id: 137, name: 'Coppa Italia',          category: 'italy' },
  // France
  { id: 61,  name: 'Ligue 1',               category: 'france' },
  { id: 62,  name: 'Ligue 2',               category: 'france' },
  { id: 66,  name: 'Coupe de France',       category: 'france' },
  // Other top leagues
  { id: 88,  name: 'Eredivisie',            category: 'other' },
  { id: 94,  name: 'Primeira Liga',         category: 'other' },
  { id: 144, name: 'Belgian Pro League',    category: 'other' },
  { id: 179, name: 'Scottish Prem.',        category: 'other' },
  { id: 203, name: 'Süper Lig',             category: 'other' },
  { id: 307, name: 'Saudi Pro League',      category: 'other' },
  { id: 253, name: 'MLS',                   category: 'other' },
  { id: 71,  name: 'Brasileirão',           category: 'other' },
  { id: 128, name: 'Argentine Primera',     category: 'other' },
  { id: 262, name: 'Liga MX',               category: 'other' },
  { id: 98,  name: 'J1 League',             category: 'other' },
]

export const BIG_TOURNAMENT_IDS = [1, 2, 4, 5, 6, 9, 15]

export const CUP_IDS = [3, 45, 48, 66, 81, 137, 143, 848]

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomBigTournamentId() { return randomPick(BIG_TOURNAMENT_IDS) }
export function randomCupId()           { return randomPick(CUP_IDS) }

export const LEAGUE_CATEGORIES = [
  { key: 'all',           label: 'All' },
  { key: 'international', label: 'International' },
  { key: 'continental',   label: 'Continental' },
  { key: 'england',       label: 'England' },
  { key: 'spain',         label: 'Spain' },
  { key: 'germany',       label: 'Germany' },
  { key: 'italy',         label: 'Italy' },
  { key: 'france',        label: 'France' },
  { key: 'other',         label: 'Other' },
]

export function leagueLogoUrl(leagueId) {
  return `https://media.api-sports.io/football/leagues/${leagueId}.png`
}

export function findLeague(id) {
  return LEAGUES.find(l => l.id === id) || null
}
