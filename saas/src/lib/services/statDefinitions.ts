import { dbConnect } from '@/lib/db/mongoose'
import { Space } from '@/lib/models/Space'
import { ServiceError } from './errors'

/** Space.statDefinitions is seeded on creation (see stat-catalog.ts) and mutated as a whole
 * embedded array from here on — small, bounded, always read together with the Space. */

export async function listStatDefinitions(spaceId: string) {
  await dbConnect()
  const space = await Space.findById(spaceId).select('statDefinitions').lean()
  if (!space) throw new ServiceError(404, 'Space not found')
  return [...space.statDefinitions].sort((a, b) => a.order - b.order)
}

function assertOwner(requesterRole: string) {
  if (requesterRole !== 'owner') {
    throw new ServiceError(403, 'Only the space owner can change stat attributes')
  }
}

/** Owner-only. Disabling an attribute only hides it from new-entry forms/current views —
 * historical matchWeek entries keep whatever stats keys existed when logged. */
export async function toggleStatDefinition(
  spaceId: string,
  key: string,
  enabled: boolean,
  requesterRole: string
) {
  await dbConnect()
  assertOwner(requesterRole)

  const space = await Space.findById(spaceId)
  if (!space) throw new ServiceError(404, 'Space not found')

  const def = space.statDefinitions.find((s) => s.key === key)
  if (!def) throw new ServiceError(404, 'Stat attribute not found')

  def.enabled = enabled
  await space.save()
  return def
}

export type NewStatDefinitionInput = {
  key: string
  label: string
  short: string
  max: number
  weight: number
  higherIsBetter: boolean
  blurb?: string
}

/** Owner-only. Custom attributes are appended at the end of the current order. */
export async function addCustomStatDefinition(
  spaceId: string,
  input: NewStatDefinitionInput,
  requesterRole: string
) {
  await dbConnect()
  assertOwner(requesterRole)

  const key = input.key.trim()
  const label = input.label.trim()
  const short = input.short.trim()

  if (!key || !/^[a-zA-Z0-9_]+$/.test(key)) {
    throw new ServiceError(400, 'Key is required and must be alphanumeric/underscore only')
  }
  if (!label) throw new ServiceError(400, 'Label is required')
  if (!short) throw new ServiceError(400, 'Short label is required')
  if (!Number.isFinite(input.max) || input.max <= 0) {
    throw new ServiceError(400, 'Max must be a positive number')
  }
  if (!Number.isFinite(input.weight)) throw new ServiceError(400, 'Weight must be a number')

  const space = await Space.findById(spaceId)
  if (!space) throw new ServiceError(404, 'Space not found')

  if (space.statDefinitions.some((s) => s.key === key)) {
    throw new ServiceError(409, 'A stat attribute with this key already exists')
  }

  const nextOrder = space.statDefinitions.reduce((max, s) => Math.max(max, s.order), -1) + 1

  space.statDefinitions.push({
    key,
    label,
    short,
    max: input.max,
    weight: input.weight,
    higherIsBetter: input.higherIsBetter,
    blurb: input.blurb?.trim() ?? '',
    enabled: true,
    isCustom: true,
    order: nextOrder
  })

  await space.save()
  return space.statDefinitions[space.statDefinitions.length - 1]
}

/** Owner-only. Only custom attributes can be removed — built-ins can only be disabled, never
 * deleted. Historical matchWeek entries that reference this key are left untouched. */
export async function removeCustomStatDefinition(spaceId: string, key: string, requesterRole: string) {
  await dbConnect()
  assertOwner(requesterRole)

  const space = await Space.findById(spaceId)
  if (!space) throw new ServiceError(404, 'Space not found')

  const idx = space.statDefinitions.findIndex((s) => s.key === key)
  if (idx === -1) throw new ServiceError(404, 'Stat attribute not found')
  if (!space.statDefinitions[idx].isCustom) {
    throw new ServiceError(400, 'Built-in stat attributes cannot be removed, only disabled')
  }

  space.statDefinitions.splice(idx, 1)
  await space.save()
}
