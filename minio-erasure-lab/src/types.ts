export type DriveStatus = 'healthy' | 'offline' | 'corrupt' | 'healing'

export interface Drive {
  id: number
  shardIndex: number
  status: DriveStatus
}

export interface SimulationConfig {
  dataBlocks: number
  parityBlocks: number
  objectText: string
  objectKey: string
}

export interface SourceRef {
  file: string
  lines: string
  title: string
  code: string
  note: string
}

export interface Lesson {
  id: string
  eyebrow: string
  title: string
  summary: string
  insight: string
  source: SourceRef
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}
