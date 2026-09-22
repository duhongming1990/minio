import { ArrowRight, Check, Copy, HardDrive, Network, X } from 'lucide-react'

export function ConceptDeepDive() {
  const rows = [
    { label: '复制 3 份', capacity: '3.00×', tolerance: '2 副本', scope: '文件副本', className: 'replication' },
    { label: 'RAID 6', capacity: '≈1.33×', tolerance: '2 磁盘', scope: '卷级修复', className: 'raid' },
    { label: 'MinIO 4+4', capacity: '2.00×', tolerance: '4 shard', scope: '对象级修复', className: 'minio' },
  ]

  return (
    <section className="deep-dive">
      <div className="section-heading">
        <div><span className="kicker">UNDER THE HOOD</span><h2>Parity 不是“备份块”</h2></div>
        <p>把数学理解成一组可逆的线性关系，就足以读懂源码主流程。</p>
      </div>
      <div className="deep-grid">
        <div className="matrix-card">
          <div className="matrix-card__head"><span>GENERATOR MATRIX · 教学模型</span><code>GF(2⁸)</code></div>
          <div className="matrix-equation">
            <div className="matrix matrix--coeff">
              {['1','0','0','0','0','1','0','0','0','0','1','0','0','0','0','1','1','1','1','1','1','2','4','8','1','3','5','15','1','4','16','64'].map((v, i) => <i key={i} className={i >= 16 ? 'parity' : ''}>{v}</i>)}
            </div>
            <span>×</span>
            <div className="matrix matrix--vector"><i>D1</i><i>D2</i><i>D3</i><i>D4</i></div>
            <span>=</span>
            <div className="matrix matrix--vector matrix--result"><i>D1</i><i>D2</i><i>D3</i><i>D4</i><i>P1</i><i>P2</i><i>P3</i><i>P4</i></div>
          </div>
          <div className="matrix-caption">
            <span><b>①</b>上半部分是单位矩阵，保留原始 data shards</span>
            <span><b>②</b>下半部分产生不同 parity 组合</span>
            <span><b>③</b>任取 4 行仍可求回 D1…D4</span>
          </div>
        </div>
        <div className="comparison-card">
          <div className="comparison-card__head"><span>为什么不只用复制？</span><small>100 GiB 对象示意</small></div>
          {rows.map((row) => (
            <div className={`compare-row compare-row--${row.className}`} key={row.label}>
              <div className="compare-icon">{row.className === 'replication' ? <Copy /> : row.className === 'raid' ? <HardDrive /> : <Network />}</div>
              <div><strong>{row.label}</strong><small>{row.scope}</small></div>
              <div><span>空间</span><b>{row.capacity}</b></div>
              <div><span>容错</span><b>{row.tolerance}</b></div>
            </div>
          ))}
          <p>MinIO 的关键优势不只是容错数量，而是每个对象独立选择 storage class、独立校验并增量修复。</p>
        </div>
      </div>

      <div className="call-chain">
        <div className="call-chain__head"><span>SOURCE CALL CHAINS</span><small>从 API 到磁盘 I/O</small></div>
        <div className="call-chain__rows">
          <div><b>WRITE</b>{['PutObject', 'NewErasure', 'Encode', 'Split / Encode', 'multiWriter.Write'].map((item, i) => <span key={item}>{item}{i < 4 && <ArrowRight />}</span>)}</div>
          <div><b>READ</b>{['GetObject', 'parallelReader.Read', 'canDecode', 'ReconstructData', 'writeDataBlocks'].map((item, i) => <span key={item}>{item}{i < 4 && <ArrowRight />}</span>)}</div>
          <div><b>HEAL</b>{['HealObject', 'parallelReader.Read', 'Reconstruct', 'writeQuorum: 1', 'multiWriter.Write'].map((item, i) => <span key={item}>{item}{i < 4 && <ArrowRight />}</span>)}</div>
        </div>
      </div>

      <div className="truth-table">
        <div className="truth-table__head"><span>4+4 故障边界</span><small>读写可用性并不完全相同</small></div>
        <div className="truth-table__body">
          {[0, 1, 2, 3, 4, 5].map((failures) => (
            <div key={failures} className={failures === 4 ? 'highlight' : ''}>
              <b>{failures}</b><span>块故障</span>
              <em className={failures <= 4 ? 'ok' : 'no'}>{failures <= 4 ? <Check /> : <X />} READ</em>
              <em className={failures <= 3 ? 'ok' : 'no'}>{failures <= 3 ? <Check /> : <X />} WRITE</em>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
