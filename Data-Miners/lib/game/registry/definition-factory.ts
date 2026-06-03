/**
 * Generic factory for game definitions that follow the
 * { baseStats, stats } pattern (buildings, tiles, etc.).
 *
 * `cloneFn` performs a deep-enough copy of the stats object.
 */
export function createDefinitionFactory<Stats, Def extends { baseStats: Stats; stats: Stats }>(
  cloneFn: (stats: Stats) => Stats,
) {
  return function createDefinition(partial: Omit<Def, "stats"> & { stats?: Stats }): Def {
    return {
      ...partial,
      stats: partial.stats ?? cloneFn(partial.baseStats),
    } as Def
  }
}
