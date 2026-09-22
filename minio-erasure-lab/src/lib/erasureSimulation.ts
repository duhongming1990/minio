import type { Drive, DriveStatus, SimulationConfig } from '../types'

export const MIN_BLOCKS = 2
export const MAX_BLOCKS = 16

export function totalBlocks(config: SimulationConfig): number {
  return config.dataBlocks + config.parityBlocks
}

export function readQuorum(config: SimulationConfig): number {
  return config.dataBlocks
}

export function writeQuorum(config: SimulationConfig): number {
  return config.dataBlocks === config.parityBlocks
    ? config.dataBlocks + 1
    : config.dataBlocks
}

export function storageRatio(config: SimulationConfig): number {
  return totalBlocks(config) / config.dataBlocks
}

export function shardSize(byteLength: number, dataBlocks: number): number {
  if (byteLength === 0) return 0
  return Math.ceil(byteLength / dataBlocks)
}

export function stableDistribution(key: string, cardinality: number): number[] {
  if (cardinality <= 0) return []
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (Math.imul(hash, 31) + key.charCodeAt(i)) >>> 0
  }
  const start = hash % cardinality
  return Array.from({ length: cardinality }, (_, i) => (start + i + 1) % cardinality)
}

export function createDrives(config: SimulationConfig): Drive[] {
  const count = totalBlocks(config)
  const order = stableDistribution(config.objectKey, count)
  const drives = Array.from({ length: count }, (_, id) => ({
    id,
    shardIndex: 0,
    status: 'healthy' as DriveStatus,
  }))
  order.forEach((driveIndex, shardIndex) => {
    drives[driveIndex].shardIndex = shardIndex
  })
  return drives
}

export function availableShardCount(drives: Drive[]): number {
  return drives.filter((drive) => drive.status === 'healthy' || drive.status === 'healing').length
}

export function canRead(config: SimulationConfig, drives: Drive[]): boolean {
  return availableShardCount(drives) >= readQuorum(config)
}

export function canWrite(config: SimulationConfig, drives: Drive[]): boolean {
  return availableShardCount(drives) >= writeQuorum(config)
}

export function failedCount(drives: Drive[]): number {
  return drives.filter((drive) => drive.status === 'offline' || drive.status === 'corrupt').length
}

export function nextDriveStatus(status: DriveStatus): DriveStatus {
  if (status === 'healthy') return 'offline'
  if (status === 'offline') return 'corrupt'
  return 'healthy'
}

export function shardBytes(text: string, dataBlocks: number): string[] {
  const bytes = new TextEncoder().encode(text || 'MinIO')
  const size = shardSize(bytes.length, dataBlocks)
  return Array.from({ length: dataBlocks }, (_, index) => {
    const chunk = bytes.slice(index * size, (index + 1) * size)
    return Array.from(chunk)
      .map((value) => value.toString(16).padStart(2, '0'))
      .join(' ')
  })
}

export function parityPreview(data: string[], parityBlocks: number): string[] {
  const seed = data.join('|')
  return Array.from({ length: parityBlocks }, (_, parityIndex) => {
    let value = parityIndex + 17
    for (let i = 0; i < seed.length; i += 1) {
      value = (Math.imul(value, 33) ^ seed.charCodeAt(i)) >>> 0
    }
    return value.toString(16).padStart(8, '0').slice(0, 8).match(/.{1,2}/g)?.join(' ') ?? ''
  })
}
