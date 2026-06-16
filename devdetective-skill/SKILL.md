# DevDetective Skill

当用户要求开发一个新的小工具、网页应用、桌面工具、浏览器插件、自动化脚本或 AI 工作流时，**不要立即从零写代码**。

先执行 DevDetective 侦查流程：

1. 理解用户需求
2. 生成 GitHub 搜索关键词
3. 搜索相似开源项目
4. 分析最近更新日期、维护状态、star、fork、license
5. 判断是否适合 fork、参考架构、参考 UI 或仅借鉴局部功能
6. 生成开发建议
7. 再开始正式开发

## 使用方式

本 Skill 需要 DevDetective 服务已在本地运行（默认 `http://localhost:4567`）。

### 方式一：HTTP API 调用

```bash
curl -X POST http://localhost:4567/api/investigate \
  -H "Content-Type: application/json" \
  -d '{"idea": "我想做一个局域网文件快传网页"}'
```

返回 JSON（含 intentSummary、searchKeywords、repos、topRecommendations、devPrompt）。

### 方式二：Python 脚本

```bash
py -3.12 scripts/investigate.py "我想做一个局域网文件快传网页"
```

输出 Markdown 报告到 `reports/` 目录。

## 输出示例

侦查完成后，Skill 应输出以下结构的信息给用户：

1. 📋 **需求理解** — 一句话总结用户想做什么
2. 🔍 **搜索关键词** — 实际使用的 GitHub 搜索词
3. 📊 **Top 3 推荐** — 最值得参考的项目及评分
4. 🧠 **AI 结论** — 是否建议从零开发
5. 🚀 **开发提示词** — 可交给 AI 编程工具的完整 Prompt

## 重要规则

- 不要跳过侦查直接写代码
- 如果搜索结果为空，建议用户修改搜索词
- 如果最佳项目已归档，明确告知风险
- 始终保留原项目的 License 声明
