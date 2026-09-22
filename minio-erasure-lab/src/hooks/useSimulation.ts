import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Drive, SimulationConfig } from '../types'
import { createDrives, nextDriveStatus, totalBlocks } from '../lib/erasureSimulation'

export const MAX_STAGE = 5

export function useSimulation(initialConfig: SimulationConfig) {
  const [config, setConfigState] = useState(initialConfig)
  const [drives, setDrives] = useState<Drive[]>(() => createDrives(initialConfig))
  const [stage, setStage] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [mode, setMode] = useState<'write' | 'read' | 'heal'>('write')

  const reset = useCallback((nextConfig = config) => {
    setDrives(createDrives(nextConfig))
    setStage(0)
    setPlaying(false)
    setMode('write')
  }, [config])

  const setConfig = useCallback((nextConfig: SimulationConfig) => {
    setConfigState(nextConfig)
    reset(nextConfig)
  }, [reset])

  const advance = useCallback(() => {
    setStage((current) => {
      if (current >= MAX_STAGE) {
        setPlaying(false)
        return current
      }
      return current + 1
    })
  }, [])

  useEffect(() => {
    if (!playing) return undefined
    const timer = window.setInterval(advance, 900)
    return () => window.clearInterval(timer)
  }, [advance, playing])

  const toggleDrive = useCallback((driveId: number) => {
    setPlaying(false)
    setDrives((current) => current.map((drive) => (
      drive.id === driveId ? { ...drive, status: nextDriveStatus(drive.status) } : drive
    )))
  }, [])

  const runRead = useCallback(() => {
    setMode('read')
    setStage(3)
    setPlaying(true)
  }, [])

  const runHeal = useCallback(() => {
    setMode('heal')
    setStage(3)
    setPlaying(true)
    setDrives((current) => current.map((drive) => (
      drive.status === 'offline' || drive.status === 'corrupt'
        ? { ...drive, status: 'healing' }
        : drive
    )))
  }, [])

  useEffect(() => {
    if (mode === 'heal' && stage === MAX_STAGE) {
      const timer = window.setTimeout(() => {
        setDrives((current) => current.map((drive) => ({ ...drive, status: 'healthy' })))
      }, 650)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [mode, stage])

  const distributionKey = useMemo(
    () => `${config.objectKey}:${totalBlocks(config)}`,
    [config.objectKey, config],
  )

  return {
    config,
    setConfig,
    drives,
    stage,
    setStage,
    playing,
    setPlaying,
    mode,
    reset,
    advance,
    toggleDrive,
    runRead,
    runHeal,
    distributionKey,
  }
}
