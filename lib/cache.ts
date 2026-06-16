/**
 * SQLite 缓存层 (sql.js WASM 版)
 *
 * 缓存策略：
 * - 同一 repo 24 小时内不重复抓取详情
 * - 同一组关键词 6 小时内优先读取缓存
 * - README 缓存
 * - 搜索 session 记录
 *
 * 使用 sql.js (WASM 版 SQLite)，无需原生编译。
 */

import initSqlJs, { type Database } from "sql.js";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), "data", "devdetective.sqlite");

let db: Database | null = null;

/**
 * 初始化数据库：创建表和索引
 */
async function getDb(): Promise<Database> {
  if (db) return db;

  // 确保 data 目录存在
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const SQL = await initSqlJs();

  // 尝试从文件加载已有数据库
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS search_sessions (
      id TEXT PRIMARY KEY,
      user_input TEXT NOT NULL,
      filters_json TEXT,
      generated_keywords_json TEXT,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS repo_results (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      html_url TEXT NOT NULL,
      description TEXT,
      language TEXT,
      stars INTEGER,
      forks INTEGER,
      open_issues INTEGER,
      license TEXT,
      created_at TEXT,
      updated_at TEXT,
      pushed_at TEXT,
      archived INTEGER,
      homepage TEXT,
      topics_json TEXT,
      readme_summary TEXT,
      similarity_score INTEGER,
      activity_score INTEGER,
      total_score INTEGER,
      recommendation TEXT,
      created_record_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cache_github_repos (
      full_name TEXT PRIMARY KEY,
      raw_json TEXT NOT NULL,
      readme_text TEXT,
      readme_summary TEXT,
      fetched_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_repo_results_session
    ON repo_results(session_id)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_cache_fetched
    ON cache_github_repos(fetched_at)
  `);

  // ─── 二期新增表 ───
  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      title TEXT,
      markdown_content TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS usage_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      api_key_id TEXT,
      request_type TEXT NOT NULL,
      user_input TEXT,
      github_request_count INTEGER DEFAULT 0,
      ai_token_estimate INTEGER DEFAULT 0,
      success INTEGER DEFAULT 1,
      error_message TEXT,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key_hash TEXT NOT NULL,
      name TEXT,
      daily_limit INTEGER DEFAULT 100,
      used_today INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      last_used_at TEXT,
      enabled INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS examples (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      input_text TEXT NOT NULL,
      tags TEXT,
      created_at TEXT NOT NULL
    )
  `);

  saveDb();
  return db;
}

/**
 * 持久化数据库到磁盘
 */
function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, buffer);
}

// ─── Repo 缓存 ───

interface CachedRepo {
  full_name: string;
  raw_json: string;
  readme_text: string | null;
  readme_summary: string | null;
  fetched_at: string;
}

/**
 * 缓存仓库数据
 */
export async function cacheRepo(repo: CachedRepo): Promise<void> {
  const d = await getDb();
  d.run(
    `INSERT OR REPLACE INTO cache_github_repos
     (full_name, raw_json, readme_text, readme_summary, fetched_at)
     VALUES (?, ?, ?, ?, ?)`,
    [repo.full_name, repo.raw_json, repo.readme_text || null, repo.readme_summary || null, repo.fetched_at]
  );
  saveDb();
}

/**
 * 获取缓存的仓库数据（24 小时内有效）
 */
export async function getCachedRepo(fullName: string): Promise<CachedRepo | null> {
  const d = await getDb();
  const stmt = d.prepare(
    `SELECT * FROM cache_github_repos
     WHERE full_name = ?
     AND datetime(fetched_at) > datetime('now', '-1 day')`
  );
  stmt.bind([fullName]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as CachedRepo;
    stmt.free();
    return row;
  }

  stmt.free();
  return null;
}

/**
 * 批量获取缓存的 README 摘要
 */
export async function getCachedReadmeSummaries(
  fullNames: string[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const d = await getDb();

  for (const name of fullNames) {
    const stmt = d.prepare(
      `SELECT readme_summary FROM cache_github_repos WHERE full_name = ?`
    );
    stmt.bind([name]);
    if (stmt.step()) {
      const row = stmt.getAsObject() as { readme_summary: string | null };
      if (row.readme_summary) {
        results.set(name, row.readme_summary);
      }
    }
    stmt.free();
  }

  return results;
}

/**
 * 更新仓库的 README 摘要
 */
export async function updateReadmeSummary(
  fullName: string,
  summary: string
): Promise<void> {
  const d = await getDb();
  d.run(`UPDATE cache_github_repos SET readme_summary = ? WHERE full_name = ?`, [
    summary,
    fullName,
  ]);
  saveDb();
}

// ─── Session 管理 ───

/**
 * 保存搜索 session
 */
export async function saveSearchSession(
  id: string,
  userInput: string,
  filtersJson: string,
  keywordsJson: string
): Promise<void> {
  const d = await getDb();
  d.run(
    `INSERT OR REPLACE INTO search_sessions
     (id, user_input, filters_json, generated_keywords_json, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [id, userInput, filtersJson, keywordsJson]
  );
  saveDb();
}

/**
 * 保存评分后的仓库结果
 */
export async function saveRepoResults(
  sessionId: string,
  results: Array<{
    id: string;
    full_name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    stars: number;
    forks: number;
    open_issues: number;
    license: string | null;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    archived: number;
    homepage: string | null;
    topics_json: string;
    readme_summary: string | null;
    similarity_score: number;
    activity_score: number;
    total_score: number;
    recommendation: string;
  }>
): Promise<void> {
  const d = await getDb();

  const insert = d.prepare(
    `INSERT OR REPLACE INTO repo_results
     (id, session_id, full_name, html_url, description, language,
      stars, forks, open_issues, license, created_at, updated_at, pushed_at,
      archived, homepage, topics_json, readme_summary,
      similarity_score, activity_score, total_score, recommendation, created_record_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  );

  for (const r of results) {
    insert.bind([
      r.id,
      sessionId,
      r.full_name,
      r.html_url,
      r.description,
      r.language,
      r.stars,
      r.forks,
      r.open_issues,
      r.license,
      r.created_at,
      r.updated_at,
      r.pushed_at,
      r.archived,
      r.homepage,
      r.topics_json,
      r.readme_summary,
      r.similarity_score,
      r.activity_score,
      r.total_score,
      r.recommendation,
    ]);
    insert.step();
    insert.reset();
  }

  insert.free();
  saveDb();
}

export async function saveReport(
  id: string,
  sessionId: string,
  title: string,
  markdownContent: string
): Promise<void> {
  const d = await getDb();
  d.run(
    `INSERT OR REPLACE INTO reports
     (id, session_id, title, markdown_content, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [id, sessionId, title, markdownContent]
  );
  saveDb();
}

export async function logUsage(entry: {
  id: string;
  requestType: string;
  userInput?: string;
  githubRequestCount?: number;
  aiTokenEstimate?: number;
  success?: boolean;
  errorMessage?: string;
  apiKeyId?: string | null;
  userId?: string | null;
}): Promise<void> {
  const d = await getDb();
  d.run(
    `INSERT OR REPLACE INTO usage_logs
     (id, user_id, api_key_id, request_type, user_input, github_request_count, ai_token_estimate, success, error_message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      entry.id,
      entry.userId || null,
      entry.apiKeyId || null,
      entry.requestType,
      entry.userInput || null,
      entry.githubRequestCount || 0,
      entry.aiTokenEstimate || 0,
      entry.success === false ? 0 : 1,
      entry.errorMessage || null,
    ]
  );
  saveDb();
}

export async function countUsageSince(params: {
  requestType: string;
  userId?: string | null;
  apiKeyId?: string | null;
  sinceIso?: string;
}): Promise<number> {
  const d = await getDb();
  const stmt = d.prepare(
    `SELECT COUNT(*) AS count
     FROM usage_logs
     WHERE request_type = ?
       AND COALESCE(user_id, '') = COALESCE(?, '')
       AND COALESCE(api_key_id, '') = COALESCE(?, '')
       AND datetime(created_at) >= datetime(?)`
  );

  stmt.bind([
    params.requestType,
    params.userId || null,
    params.apiKeyId || null,
    params.sinceIso || new Date(0).toISOString(),
  ]);

  let count = 0;
  if (stmt.step()) {
    const row = stmt.getAsObject() as { count: number };
    count = Number(row.count || 0);
  }
  stmt.free();
  return count;
}
