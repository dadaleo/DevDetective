# 示例：视频号转文字归档

## 用户需求

我想做一个本地工具，用来把微信视频号内容转成文字，按日期和主题归档，方便学习太空知识。

## 使用 Skill 侦查

```bash
py -3.12 scripts/investigate.py "我想做一个本地工具，用来把微信视频号内容转成文字，按日期和主题归档"
```

## 预期输出

- 搜索关键词: `video transcription tool`, `speech to text local`, `whisper local app`, `audio transcript archive`
- 可能找到的项目: Buzz, MacWhisper, whisper.cpp, Vibe, descript-open
- 推荐动作: **参考 Buzz 架构** + **使用 whisper.cpp 作为引擎** — 组合优于从零开发
