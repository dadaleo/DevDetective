# 示例：局域网文件快传

## 用户需求

我想做一个网页工具，在同一个 WiFi 下，不同设备可以快速互传文件，不需要登录，打开网页就能上传和下载。

## 使用 Skill 侦查

```bash
py -3.12 scripts/investigate.py "我想做一个网页工具，在同一个 WiFi 下，不同设备可以快速互传文件，不需要登录"
```

## 预期输出

- 搜索关键词: `p2p file sharing webRTC`, `local network file transfer`, `snapdrop alternative`, `airdrop web clone`
- 可能找到的项目: PairDrop, Snapdrop, ShareDrop, localsend, croc, magic-wormhole
- 推荐动作: **建议 fork PairDrop** — 已包含 WebRTC P2P 传输、无需登录、维护活跃
