CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  price_cny INTEGER NOT NULL,
  description TEXT NOT NULL,
  delivery_key TEXT
);

CREATE TABLE IF NOT EXISTS entitlements (
  email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  source TEXT NOT NULL,
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (email, product_id),
  FOREIGN KEY (email) REFERENCES users(email),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS download_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  downloaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO products (id, title, kind, price_cny, description, delivery_key) VALUES
  ('free-method', '个人网站灵感迁移方法', 'FREE METHOD', 0, '四步方法、六层拆解、公开案例与基础 Prompt。', NULL),
  ('vfp-001', '个人网站灵感迁移系统', 'ORIGINAL PROMPT', 99, '完整主 Prompt、变量采集表、三种方向、修正 Prompt 与验收表。', 'product:vfp-001:zip'),
  ('vmd-001', 'VIBE Motion Director v0.1', 'AGENT SKILL', 299, '可安装的动效 Agent Skill：诊断、方向、实现模式、性能与验收。', 'product:vmd-001:zip'),
  ('motion-clinic', '网站动效校准', 'CASE SERVICE', 999, '针对一个真实页面的标志性时刻、动效地图与实现优先级校准。', NULL);

