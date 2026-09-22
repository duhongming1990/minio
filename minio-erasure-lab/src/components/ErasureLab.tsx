import {
  AlertTriangle,
  ArrowDown,
  Check,
  ChevronRight,
  CircleDot,
  Database,
  FileCode2,
  HardDrive,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { lessons } from '../data/lessons'
import {
  availableShardCount,
  canRead,
  canWrite,
  failedCount,
  parityPreview,
  readQuorum,
  shardBytes,
  shardSize,
  storageRatio,
  totalBlocks,
  writeQuorum,
} from '../lib/erasureSimulation'
import type { Drive, SimulationConfig } from '../types'

const stageLabels = ['对象进入', '读取 Block', 'Split + Encode', '分发 Shard', '校验 / 重建', '输出对象']

interface LabProps {
  config: SimulationConfig
  drives: Drive[]
  stage: number
  playing: boolean
  mode: 'write' | 'read' | 'heal'
  onConfigChange: (config: SimulationConfig) => void
  onToggleDrive: (id: number) => void
  onTogglePlay: () => void
  onStep: () => void
  onReset: () => void
  onRead: () => void
  onHeal: () => void
}

function Metric({ label, value, hint, tone = 'neutral' }: { label: string; value: string; hint: string; tone?: 'neutral' | 'good' | 'bad' }) {
  return (
    <div className={`metric metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  )
}

function Shard({ index, isParity, active, missing }: { index: number; isParity: boolean; active: boolean; missing?: boolean }) {
  return (
    <div className={`shard ${isParity ? 'shard--parity' : 'shard--data'} ${active ? 'is-active' : ''} ${missing ? 'is-missing' : ''}`}>
      <span className="shard__label">{isParity ? 'P' : 'D'}{isParity ? index + 1 : index + 1}</span>
      <span className="shard__bits">{isParity ? '∑ GF' : '01 10'}</span>
    </div>
  )
}

function DriveCard({ drive, config, active, onClick }: { drive: Drive; config: SimulationConfig; active: boolean; onClick: () => void }) {
  const isParity = drive.shardIndex >= config.dataBlocks
  const shardNumber = isParity ? drive.shardIndex - config.dataBlocks + 1 : drive.shardIndex + 1
  const labels = {
    healthy: '在线',
    offline: '离线',
    corrupt: '校验失败',
    healing: '修复中',
  }
  return (
    <button
      className={`drive drive--${drive.status} ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-label={`磁盘 ${drive.id + 1}，${labels[drive.status]}，点击切换故障`}
      title="点击循环切换：在线 → 离线 → 静默损坏"
    >
      <div className="drive__head">
        <HardDrive size={16} />
        <span>DRIVE {String(drive.id + 1).padStart(2, '0')}</span>
        <i />
      </div>
      <div className={`drive__shard ${isParity ? 'parity' : 'data'}`}>
        {isParity ? 'P' : 'D'}{shardNumber}
      </div>
      <small>{labels[drive.status]}</small>
      {drive.status === 'corrupt' && <AlertTriangle className="drive__alert" size={15} />}
      {drive.status === 'healing' && <Wrench className="drive__alert" size={15} />}
    </button>
  )
}

export function ErasureLab(props: LabProps) {
  const { config, drives, stage, playing, mode } = props
  const total = totalBlocks(config)
  const dataHex = shardBytes(config.objectText, config.dataBlocks)
  const parityHex = parityPreview(dataHex, config.parityBlocks)
  const available = availableShardCount(drives)
  const readable = canRead(config, drives)
  const writable = canWrite(config, drives)
  const failed = failedCount(drives)
  const objectBytes = new TextEncoder().encode(config.objectText).length
  const activeShardSet = new Set(
    drives
      .filter((drive) => drive.status === 'healthy' || drive.status === 'healing')
      .sort((a, b) => a.id - b.id)
      .slice(0, config.dataBlocks)
      .map((drive) => drive.shardIndex),
  )

  function setPreset(dataBlocks: number, parityBlocks: number) {
    props.onConfigChange({ ...config, dataBlocks, parityBlocks })
  }

  return (
    <section className="lab" id="lab">
      <div className="section-heading">
        <div>
          <span className="kicker"><CircleDot size={13} /> LIVE SIMULATOR</span>
          <h2>亲手让磁盘“掉线”，看数据如何活下来</h2>
        </div>
        <p>点击任意磁盘切换状态。所有判定都来自 MinIO 的 D/P 与 quorum 规则。</p>
      </div>

      <div className="lab__toolbar">
        <label className="input-field input-field--grow">
          <span>对象内容</span>
          <input
            value={config.objectText}
            maxLength={36}
            onChange={(event) => props.onConfigChange({ ...config, objectText: event.target.value })}
          />
        </label>
        <label className="input-field input-field--key">
          <span>对象路径 · 决定分布顺序</span>
          <input
            value={config.objectKey}
            maxLength={48}
            onChange={(event) => props.onConfigChange({ ...config, objectKey: event.target.value })}
          />
        </label>
        <div className="presets" aria-label="纠删码预设">
          {[{ d: 2, p: 2 }, { d: 4, p: 4 }, { d: 6, p: 2 }, { d: 8, p: 8 }].map(({ d, p }) => (
            <button
              key={`${d}-${p}`}
              className={config.dataBlocks === d && config.parityBlocks === p ? 'is-selected' : ''}
              onClick={() => setPreset(d, p)}
            >
              {d}+{p}
            </button>
          ))}
        </div>
      </div>

      <div className="metrics-row">
        <Metric label="DATA / PARITY" value={`${config.dataBlocks} + ${config.parityBlocks}`} hint={`${total} shards / erasure set`} />
        <Metric label="SHARD SIZE" value={`${shardSize(objectBytes, config.dataBlocks)} B`} hint={`${objectBytes} B ÷ ${config.dataBlocks} 向上取整`} />
        <Metric label="READ QUORUM" value={`${readQuorum(config)} drives`} hint="够 D 个有效 shard 即可" tone={readable ? 'good' : 'bad'} />
        <Metric label="WRITE QUORUM" value={`${writeQuorum(config)} drives`} hint={config.dataBlocks === config.parityBlocks ? 'D = P，写入额外 +1' : '通常等于 D'} tone={writable ? 'good' : 'bad'} />
        <Metric label="SPACE RATIO" value={`${storageRatio(config).toFixed(2)}×`} hint={`约 ${(storageRatio(config) * objectBytes).toFixed(0)} B 物理占用`} />
      </div>

      <div className="simulator">
        <div className="simulator__topbar">
          <div className="traffic-lights"><i /><i /><i /></div>
          <div className="stage-track">
            {stageLabels.map((label, index) => (
              <div key={label} className={`stage-point ${index <= stage ? 'is-past' : ''} ${index === stage ? 'is-current' : ''}`}>
                <span>{index < stage ? <Check size={11} /> : index + 1}</span>
                <small>{label}</small>
              </div>
            ))}
          </div>
          <span className={`mode-badge mode-badge--${mode}`}>{mode.toUpperCase()}</span>
        </div>

        <div className="pipeline">
          <div className={`object-node ${stage >= 0 ? 'is-active' : ''}`}>
            <FileCode2 size={26} />
            <div><small>OBJECT</small><strong>{config.objectKey.split('/').pop()}</strong><span>{objectBytes} bytes · UTF-8</span></div>
          </div>
          <div className={`flow-arrow ${stage >= 1 ? 'is-active' : ''}`}><span>ReadFull(blockSize)</span><ChevronRight /></div>
          <div className={`engine-node ${stage >= 2 ? 'is-active' : ''}`}>
            <div className="engine-node__rings"><i /><i /><Zap size={22} /></div>
            <div><small>REED–SOLOMON</small><strong>Split → Encode</strong><span>klauspost/reedsolomon</span></div>
          </div>
          <div className={`flow-arrow ${stage >= 3 ? 'is-active' : ''}`}><span>multiWriter.Write</span><ChevronRight /></div>
          <div className={`shard-pack ${stage >= 3 ? 'is-active' : ''}`}>
            {Array.from({ length: total }, (_, index) => (
              <Shard
                key={index}
                index={index < config.dataBlocks ? index : index - config.dataBlocks}
                isParity={index >= config.dataBlocks}
                active={stage >= 3}
              />
            ))}
          </div>
        </div>

        <div className="byte-inspector">
          <div className="byte-inspector__title">
            <span>BLOCK #0001 · 教学字节预览</span>
            <small>真实 MinIO 默认按更大的 blockSize 流式处理</small>
          </div>
          <div className="byte-grid">
            {dataHex.map((hex, index) => (
              <div key={`d-${index}`} className="byte-row byte-row--data"><b>D{index + 1}</b><code>{hex || '00 · padding'}</code></div>
            ))}
            {parityHex.map((hex, index) => (
              <div key={`p-${index}`} className="byte-row byte-row--parity"><b>P{index + 1}</b><code>{hex}</code></div>
            ))}
          </div>
          <p><Sparkles size={14} /> Parity 预览是教学指纹；生产编码由 Reed-Solomon 的 GF(2⁸) 矩阵运算完成。</p>
        </div>

        <ArrowDown className={`downlink ${stage >= 3 ? 'is-active' : ''}`} />

        <div className="drive-zone">
          <div className="drive-zone__header">
            <div><span>ERASURE SET / {total} DRIVES</span><small>对象 shard 按 Distribution 落盘</small></div>
            <div className="legend"><span><i className="data" />Data</span><span><i className="parity" />Parity</span><span><i className="failed" />Failed</span></div>
          </div>
          <div className="drives" style={{ '--drive-count': Math.min(total, 8) } as React.CSSProperties}>
            {drives.map((drive) => (
              <DriveCard
                key={drive.id}
                drive={drive}
                config={config}
                active={mode === 'write' ? stage >= 3 : stage >= 4 && activeShardSet.has(drive.shardIndex)}
                onClick={() => props.onToggleDrive(drive.id)}
              />
            ))}
          </div>
        </div>

        <div className={`verdict ${readable ? 'verdict--ok' : 'verdict--fail'}`}>
          <div className="verdict__icon">{readable ? <ShieldCheck /> : <X />}</div>
          <div>
            <small>CLUSTER VERDICT</small>
            <strong>{readable ? (failed ? '对象仍然可恢复' : '对象受到完整保护') : '读取 Quorum 已丢失'}</strong>
            <p>{available} 个有效 shard / 需要 {config.dataBlocks} 个 · 已损失 {failed} 个 / 容错上限 {config.parityBlocks} 个</p>
          </div>
          <div className="verdict__flags">
            <span className={readable ? 'ok' : 'no'}>READ {readable ? 'OK' : 'BLOCKED'}</span>
            <span className={writable ? 'ok' : 'no'}>WRITE {writable ? 'OK' : 'BLOCKED'}</span>
          </div>
        </div>

        <div className="sim-controls">
          <div className="primary-controls">
            <button className="icon-button" onClick={props.onReset} title="重置"><RotateCcw size={16} /></button>
            <button className="play-button" onClick={props.onTogglePlay}>
              {playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
              {playing ? '暂停动画' : '播放写入'}
            </button>
            <button className="step-button" onClick={props.onStep}>单步执行 <ChevronRight size={15} /></button>
          </div>
          <div className="scenario-controls">
            <button onClick={props.onRead} disabled={!readable}><Database size={15} />读取对象</button>
            <button onClick={props.onHeal} disabled={!readable || failed === 0}><Wrench size={15} />开始修复</button>
          </div>
        </div>
      </div>

      <p className="interaction-tip"><AlertTriangle size={14} /> 试一试：连续点击 4 块磁盘，让它们离线；观察 4+4 配置为何仍可读、却已不可写。再多关闭 1 块会发生什么？</p>
    </section>
  )
}

export function SourcePanel({ lessonIndex }: { lessonIndex: number }) {
  const lesson = lessons[lessonIndex]
  return (
    <aside className="source-panel">
      <div className="source-panel__head">
        <div><FileCode2 size={16} /><span>源码证据</span></div>
        <span>GO</span>
      </div>
      <div className="source-panel__path"><code>{lesson.source.file}</code><b>L{lesson.source.lines}</b></div>
      <h4>{lesson.source.title}</h4>
      <pre><code>{lesson.source.code}</code></pre>
      <div className="source-panel__note"><ChevronRight size={15} /><p>{lesson.source.note}</p></div>
    </aside>
  )
}
