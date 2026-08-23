// Default stat attributes seeded onto every new Space. Spaces can toggle these on/off and add
// custom ones — see Space.statDefinitions. Never hardcode this list elsewhere; every stats-engine
// function takes the space's current statDefinitions as a parameter.

export type StatDefinition = {
  key: string
  label: string
  short: string
  max: number
  weight: number
  higherIsBetter: boolean
  blurb: string
  enabled: boolean
  isCustom: boolean
  order: number
}

export const DEFAULT_STAT_CATALOG: StatDefinition[] = [
  {
    key: 'goals', label: 'Goals', short: 'G', max: 20, weight: 3, higherIsBetter: true,
    blurb: 'Times the ball went in the back of the net.', enabled: true, isCustom: false, order: 0
  },
  {
    key: 'assists', label: 'Assists', short: 'A', max: 20, weight: 2, higherIsBetter: true,
    blurb: 'Final pass that led directly to a teammate scoring.', enabled: true, isCustom: false, order: 1
  },
  {
    key: 'shotsOnTarget', label: 'Shots on target', short: 'ST', max: 40, weight: 1, higherIsBetter: true,
    blurb: 'Shots that forced a save or went in.', enabled: true, isCustom: false, order: 2
  },
  {
    key: 'shotsOffTarget', label: 'Shots off target', short: 'SF', max: 40, weight: -0.5, higherIsBetter: false,
    blurb: 'Shots that missed the goal entirely. Counts toward your shot accuracy.', enabled: true, isCustom: false, order: 3
  },
  {
    key: 'dribbles', label: 'Dribbles', short: 'DR', max: 50, weight: 1, higherIsBetter: true,
    blurb: 'Successful 1-v-1 take-ons past a defender.', enabled: true, isCustom: false, order: 4
  },
  {
    key: 'possessionWon', label: 'Possession won', short: 'PW', max: 50, weight: 1, higherIsBetter: true,
    blurb: 'Tackles, interceptions, recoveries — getting the ball back.', enabled: true, isCustom: false, order: 5
  }
]

export function seedStatDefinitions(): StatDefinition[] {
  return DEFAULT_STAT_CATALOG.map((s) => ({ ...s }))
}
