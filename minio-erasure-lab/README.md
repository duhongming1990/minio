# MinIO Erasure Lab

一个基于本地 MinIO 源码构建的中文纠删码动态交互教程。它从对象写入开始，逐步演示 Reed-Solomon 切块与编码、shard 分布、降级读取、Bit Rot 检测、Healing，以及读写 quorum 的差异。

## 启动

```bash
npm install
npm run dev
```

生产构建与测试：

```bash
npm run test
npm run build
npm run preview
```

## 教学内容

- 对象如何被拆成 D 个数据 shard 和 P 个 parity shard
- 对象路径如何影响 shard 到 drive 的稳定分布
- 为什么只需 D 个有效 shard 就能读取
- 为什么 4+4 的 read quorum 是 4，而 write quorum 是 5
- 离线磁盘与静默数据损坏的差异
- HighwayHash256S 如何发现 Bit Rot
- Heal 如何重建缺失的数据块和校验块
- 容错能力与存储放大比 `N / D` 的取舍

## MinIO 源码依据

本应用以同级目录 `../minio` 的当前源码为参考，主要映射：

- `cmd/erasure-coding.go` — `NewErasure`、`EncodeData`、`DecodeDataBlocks`
- `cmd/erasure-encode.go` — block 循环编码与 `multiWriter`
- `cmd/erasure-decode.go` — `parallelReader`、读取与修复
- `cmd/erasure-object.go` — storage class、D/P、write quorum 与写入链路
- `cmd/erasure-metadata.go` — 对象读写 quorum
- `cmd/erasure-metadata-utils.go` — 分布顺序与磁盘重排
- `cmd/bitrot.go`、`cmd/bitrot-streaming.go` — checksum 写入与校验
- `docs/erasure/README.md` 与 `docs/erasure/storage-class/README.md`

## 简化边界

- 动画中的 byte/parity 内容是教学预览，不是对 `klauspost/reedsolomon` 的逐字节重实现。
- 前端的对象分布散列只保证确定性，用来展示 `hashOrder` 的概念；MinIO 源码使用 CRC32。
- quorum、容量比、容错边界、shard size 等工程规则按所引用的 MinIO 源码实现。
- 应用完全静态，不会启动或操作真实 MinIO 集群、磁盘或对象。
