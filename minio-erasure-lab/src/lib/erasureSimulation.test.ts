import { describe, expect, it } from 'vitest'
import {
  canRead,
  canWrite,
  createDrives,
  readQuorum,
  shardSize,
  stableDistribution,
  storageRatio,
  writeQuorum,
} from './erasureSimulation'
import type { SimulationConfig } from '../types'

const balanced: SimulationConfig = {
  dataBlocks: 4,
  parityBlocks: 4,
  objectText: 'MinIO',
  objectKey: 'photos/cat.jpg',
}

describe('MinIO erasure simulation rules', () => {
  it('uses data blocks as read quorum', () => {
    expect(readQuorum(balanced)).toBe(4)
  })

  it('adds one to balanced write quorum', () => {
    expect(writeQuorum(balanced)).toBe(5)
    expect(writeQuorum({ ...balanced, dataBlocks: 6, parityBlocks: 2 })).toBe(6)
  })

  it('computes shard size with ceil division', () => {
    expect(shardSize(17, 4)).toBe(5)
    expect(shardSize(0, 4)).toBe(0)
  })

  it('computes storage amplification', () => {
    expect(storageRatio(balanced)).toBe(2)
    expect(storageRatio({ ...balanced, dataBlocks: 6, parityBlocks: 2 })).toBeCloseTo(1.333)
  })

  it('returns a deterministic complete distribution', () => {
    const first = stableDistribution('bucket/object', 8)
    expect(first).toEqual(stableDistribution('bucket/object', 8))
    expect(new Set(first).size).toBe(8)
  })

  it('crosses read and write boundaries correctly', () => {
    const drives = createDrives(balanced)
    drives[0].status = 'offline'
    drives[1].status = 'offline'
    drives[2].status = 'offline'
    expect(canRead(balanced, drives)).toBe(true)
    expect(canWrite(balanced, drives)).toBe(true)
    drives[3].status = 'offline'
    expect(canRead(balanced, drives)).toBe(true)
    expect(canWrite(balanced, drives)).toBe(false)
    drives[4].status = 'offline'
    expect(canRead(balanced, drives)).toBe(false)
  })
})
