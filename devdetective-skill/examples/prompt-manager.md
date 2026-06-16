# 示例：提示词素材管理器

## 用户需求

我想做一个本地运行的工具，可以导入 md/txt/json 文件，用于管理角色设定、提示词、项目素材，并能全文搜索。

## 使用 Skill 侦查

```bash
py -3.12 scripts/investigate.py "我想做一个本地运行的工具，可以导入 md/txt/json 文件，用于管理角色设定、提示词、项目素材，并能全文搜索"
```

## 预期输出

- 搜索关键词: `local knowledge base markdown`, `prompt manager`, `character bible manager`, `note taking sqlite`, `full text search local`
- 可能找到的项目: Obsidian (不开源但可参考), Logseq, SiYuan, Joplin, Trillium, Dendron
- 推荐动作: **参考 SiYuan 架构** — 本地优先、SQLite 存储、Markdown 编辑、全文搜索均已实现
