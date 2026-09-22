import type { Lesson, QuizQuestion } from '../types'

export const lessons: Lesson[] = [
  {
    id: 'object',
    eyebrow: '01 / 从对象开始',
    title: '不是复制，而是把对象变成可恢复的碎片',
    summary: 'MinIO 在对象级别执行纠删码。每个对象独立切块、编码、校验和修复，因此不需要像 RAID 那样重建整块卷。',
    insight: '先记住一个核心：只要收集到 D 个有效 shard，原对象就能回来。',
    source: {
      file: 'docs/erasure/README.md',
      lines: '7–15',
      title: '对象级 Reed-Solomon',
      code: 'MinIO uses Reed-Solomon code to shard objects\ninto variable data and parity blocks.\n... MinIO encodes each object individually.',
      note: '动画中的一个对象就是一次独立编码与恢复单元。',
    },
  },
  {
    id: 'encode',
    eyebrow: '02 / 编码',
    title: 'D 个数据块，经过矩阵计算得到 P 个校验块',
    summary: '源码先 Split 数据，再调用 Reed-Solomon Encode。校验块不是简单副本，而是数据 shard 的不同线性组合。',
    insight: '校验块保存的是“关系”，因此任意 D 个有效 shard 都足以解方程。',
    source: {
      file: 'cmd/erasure-coding.go',
      lines: '75–88',
      title: 'EncodeData',
      code: 'encoded, err := e.encoder().Split(data)\nif err = e.encoder().Encode(encoded); err != nil {\n    return nil, err\n}\nreturn encoded, nil',
      note: 'Split 产生 D 个数据 shard，Encode 原地填充其后的 P 个 parity shard。',
    },
  },
  {
    id: 'distribute',
    eyebrow: '03 / 分布',
    title: '同一对象的 shard 被稳定地打散到 Erasure Set',
    summary: '对象路径产生稳定顺序，元数据记录 shard index。写入前，MinIO 按 Distribution 重排磁盘与元数据。',
    insight: '磁盘编号不等于 shard 编号；xl.meta 里的分布信息让读取端知道去哪里找。',
    source: {
      file: 'cmd/erasure-metadata-utils.go',
      lines: '173–191, 270–294',
      title: 'hashOrder / shuffle',
      code: 'keyCrc := crc32.Checksum([]byte(key), crc32.IEEETable)\nstart := int(keyCrc % uint32(cardinality))\n...\nshuffledDisks[blockIndex-1] = disks[index]',
      note: '实验室使用可复现的前端散列展示同一概念，不声称逐位复刻 Go CRC32。',
    },
  },
  {
    id: 'read',
    eyebrow: '04 / 降级读取',
    title: '并行找够 D 个有效 shard，然后立即解码',
    summary: 'parallelReader 一开始触发 D 路读取；遇到离线或损坏就继续尝试下一块盘，直到 canDecode 成立。',
    insight: '不是必须读回所有 N 块盘。够 D 块时，读取就具备数学上的充分信息。',
    source: {
      file: 'cmd/erasure-decode.go',
      lines: '115–234, 282–302',
      title: 'canDecode / Decode',
      code: 'return bufCount >= p.dataBlocks\n...\nbufs, err = reader.Read(bufs)\nerr = e.DecodeDataBlocks(bufs)\nwriteDataBlocks(ctx, writer, bufs, ...)',
      note: '点击磁盘制造故障，再运行读取，观察替补 shard 进入解码集合。',
    },
  },
  {
    id: 'bitrot',
    eyebrow: '05 / 静默损坏',
    title: '“读得到”不代表“读正确”：每个 shard 都要过校验',
    summary: '流式 bitrot writer 在 shard 前写入 HighwayHash256S；reader 读取时验证，不匹配就返回 errFileCorrupt。',
    insight: '纠删码负责恢复，checksum 负责发现。二者组合才能对抗静默数据损坏。',
    source: {
      file: 'cmd/bitrot-streaming.go',
      lines: '44–74, 161+',
      title: 'streamingBitrotWriter / Reader',
      code: 'b.h.Reset()\nb.h.Write(p)\nhashBytes := b.h.Sum(nil)\nb.iow.Write(hashBytes)\nb.iow.Write(p)',
      note: '将磁盘点到“损坏”状态，动画会先校验失败，再把该 shard 当作不可用。',
    },
  },
  {
    id: 'heal',
    eyebrow: '06 / 修复',
    title: '读取健康 shard，重建缺失数据与校验，再写回目标盘',
    summary: 'Heal 与普通读取共享 parallelReader，但调用 Reconstruct 恢复所有缺失 shard，并以 writeQuorum=1 写回单盘。',
    insight: 'MinIO 可以按对象增量修复，不需要等待整个卷重建完。',
    source: {
      file: 'cmd/erasure-decode.go',
      lines: '316–360',
      title: 'Heal',
      code: 'bufs, err = reader.Read(bufs)\nerr = e.DecodeDataAndParityBlocks(ctx, bufs)\nw := multiWriter{ writeQuorum: 1 }\nw.Write(ctx, bufs)',
      note: '修复动画先重建内存中的 shard，再将它们回写到缺失位置。',
    },
  },
  {
    id: 'quorum',
    eyebrow: '07 / 工程边界',
    title: '容错、容量与一致性之间，MinIO 做了明确取舍',
    summary: '读 quorum 通常为 D。写 quorum 通常也是 D；当 D=P 时额外加 1，避免对半分区下出现两边都能提交的冲突。',
    insight: '4+4 可以用 4 块读，却至少要 5 块才能写：可恢复性与写一致性不是同一个问题。',
    source: {
      file: 'cmd/erasure-metadata.go',
      lines: '527–563',
      title: 'objectQuorumFromMeta',
      code: 'dataBlocks := len(partsMetaData) - parityBlocks\nwriteQuorum := dataBlocks\nif dataBlocks == parityBlocks {\n    writeQuorum++\n}',
      note: '顶部状态栏会分别显示 READ 与 WRITE，不把二者混成一个“可用性”。',
    },
  },
]

export const quizQuestions: QuizQuestion[] = [
  {
    question: '在 4 data + 4 parity 中，最多丢失多少个 shard 仍可读取？',
    options: ['2 个', '3 个', '4 个', '5 个'],
    correct: 2,
    explanation: '8 个 shard 中只需任意 4 个有效 shard；因此最多可以损失 4 个。',
  },
  {
    question: '为什么 4+4 的写 quorum 是 5，而读 quorum 是 4？',
    options: ['编码要求', '避免对半网络分区双写', '校验和需要', '磁盘必须为奇数'],
    correct: 1,
    explanation: 'D=P 时写 quorum 加 1，确保两个各有 4 盘的分区不能同时成功提交。',
  },
  {
    question: 'Bit Rot 校验在纠删码链路中的主要职责是什么？',
    options: ['压缩对象', '选择 Erasure Set', '发现静默损坏', '增加 parity 数量'],
    correct: 2,
    explanation: 'Checksum 识别内容损坏，Reed-Solomon 再用其他有效 shard 完成恢复。',
  },
]
