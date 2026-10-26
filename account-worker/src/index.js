import { getVerifiedEmail } from "./auth.js";

const PUBLIC_SITE = "https://joeyhu1108-maker.github.io/vibe-frontier-daily/";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "vibe-frontier-account" });
    }

    const email = await getVerifiedEmail(request, env);
    if (!email) {
      return html(setupRequiredPage(), 401);
    }

    await env.DB.prepare(
      `INSERT INTO users (email) VALUES (?)
       ON CONFLICT(email) DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP`
    ).bind(email).run();

    if (url.pathname.startsWith("/download/")) {
      return downloadProduct(url.pathname.slice("/download/".length), email, env);
    }

    if (url.pathname !== "/") {
      return html(notFoundPage(), 404);
    }

    return html(accountPage(email));
  }
};

async function downloadProduct(productId, email, env) {
  const product = await env.DB.prepare(
    `SELECT p.*, CASE WHEN e.email IS NULL THEN 0 ELSE 1 END AS owned
     FROM products p
     LEFT JOIN entitlements e ON e.product_id = p.id AND e.email = ?
     WHERE p.id = ?`
  ).bind(email, productId).first();

  if (!product) return html(notFoundPage(), 404);
  if (product.price_cny === 0) return Response.redirect(`${PUBLIC_SITE}#method`, 302);
  if (!product.owned) return html(lockedPage(product), 403);
  if (!product.delivery_key) return html(servicePage(product), 200);

  const packageFile = await env.PRODUCTS.get(product.delivery_key, "arrayBuffer");
  if (!packageFile) return html(deliveryPendingPage(product), 503);

  await env.DB.prepare(
    "INSERT INTO download_events (email, product_id) VALUES (?, ?)"
  ).bind(email, productId).run();

  const filename = productId === "vfp-001"
    ? "VFP-001-personal-website-prompt-system.zip"
    : "VIBE-Motion-Director-v0.1.zip";

  return new Response(packageFile, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function accountPage(email) {
  return shell(`
    <header class="topbar">
      <a class="brand" href="${PUBLIC_SITE}"><span>VIBE</span><strong>FRONTIER</strong></a>
      <a class="logout" href="/cdn-cgi/access/logout">退出登录 ↗</a>
    </header>
    <main class="state-page account-home">
      <p class="eyebrow">IDENTITY VERIFIED / 身份已验证</p>
      <h1>欢迎回来。</h1>
      <p class="account-email">${escapeHtml(email)}</p>
      <p>邮箱已经验证，你的账号已就绪。作品和拆解继续免费开放。</p>
      <a class="primary" href="${PUBLIC_SITE}#archive">继续浏览作品 ↗</a>
      <a class="secondary" href="${PUBLIC_SITE}#hackathons">看看黑客松 ↗</a>
      <p class="account-privacy">本站保存登录邮箱与首次、最近登录时间，用于识别账号。不保存密码，也不会因登录订阅营销邮件。</p>
    </main>
    <footer><span>AI 造物社 · VIBE FRONTIER</span><a href="${PUBLIC_SITE}">返回公开网站 ↗</a></footer>
  `, `VIBE FRONTIER｜我的账号`);
}

function setupRequiredPage() {
  return shell(`<main class="state-page"><p class="eyebrow">IDENTITY REQUIRED</p><h1>请从登录入口进入。</h1><p>这个账号页只接受 Cloudflare Access 验证过的邮箱身份。若你刚完成验证码登录，请返回首页后重试。</p><a class="primary" href="${PUBLIC_SITE}">返回 VIBE FRONTIER ↗</a></main>`, "需要登录");
}

function lockedPage(product) {
  return shell(`<main class="state-page"><p class="eyebrow">ENTITLEMENT REQUIRED</p><h1>这份内容还没有绑定到你的邮箱。</h1><p>${escapeHtml(product.title)} 完成购买核对后会出现在你的内容库中。</p><a class="primary" href="/?interest=${encodeURIComponent(product.id)}">登记购买 ↗</a><a class="secondary" href="/">返回内容库</a></main>`, "尚未解锁");
}

function servicePage(product) {
  return shell(`<main class="state-page"><p class="eyebrow">CASE SERVICE</p><h1>${escapeHtml(product.title)}</h1><p>这是逐案服务，不提供自动下载。请从公开网站提交真实页面，我们会先判断是否适合。</p><a class="primary" href="${PUBLIC_SITE}#contact">提交案例 ↗</a></main>`, product.title);
}

function deliveryPendingPage(product) {
  return shell(`<main class="state-page"><p class="eyebrow">DELIVERY SYNC</p><h1>权益已确认，交付包正在同步。</h1><p>${escapeHtml(product.title)} 已经属于你。稍后刷新即可下载，不需要再次购买。</p><a class="primary" href="/">返回内容库</a></main>`, "交付同步中");
}

function notFoundPage() {
  return shell(`<main class="state-page"><p class="eyebrow">404 / FIELD NOTE</p><h1>这里没有这份内容。</h1><a class="primary" href="/">返回内容库</a></main>`, "页面不存在");
}

function shell(content, title) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11150c"><title>${escapeHtml(title)}</title><style>${styles}</style></head><body>${content}</body></html>`;
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; font-src https://joeyhu1108-maker.github.io; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
}

const styles = `
  @font-face{font-family:Pixel;src:url("${PUBLIC_SITE}vibe/fonts/FusionPixel-Proportional-zhHans-12px.woff2") format("woff2");font-display:swap}
  :root{color-scheme:dark;--ink:#11150c;--paper:#e6e9d4;--accent:#d6ff50;--line:rgba(204,222,133,.2);font-family:system-ui,"PingFang SC",sans-serif}
  *{box-sizing:border-box}
  body{margin:0;background:var(--ink);color:var(--paper)}
  a{color:inherit;text-decoration:none}
  a:focus-visible{outline:2px solid var(--accent);outline-offset:5px}
  .topbar{height:72px;padding:0 max(24px,5vw);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
  .brand,.eyebrow,.logout{font-family:Pixel,monospace;font-weight:400}
  .brand{display:flex;gap:8px;font-size:16px}
  .brand strong{font-weight:400}
  .logout{color:var(--accent);font-size:14px;min-height:44px;display:flex;align-items:center}
  .state-page{width:min(760px,calc(100% - 48px));min-height:calc(100svh - 160px);margin:auto;padding:72px 0;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}
  .eyebrow{font-size:12px;color:var(--accent);letter-spacing:.05em}
  .state-page h1{font:400 clamp(32px,6vw,64px)/1.25 Pixel,system-ui;margin:24px 0}
  .state-page p:not(.eyebrow){max-width:540px;line-height:1.8;color:#a8b096}
  .state-page .account-email{font-size:20px;color:var(--paper);overflow-wrap:anywhere;max-width:100%;margin:0}
  .state-page .primary,.state-page .secondary{display:inline-flex;align-items:center;min-height:48px;padding:12px 20px;margin-top:16px;font:16px Pixel,system-ui}
  .primary{background:var(--accent);color:var(--ink)}
  .secondary{border:1px solid var(--line)}
  .state-page .account-privacy{font-size:12px;margin-top:48px}
  footer{width:calc(100% - 48px);margin:auto;padding:24px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:12px;color:#a8b096}
  @media(max-width:560px){.topbar{height:64px}.brand{font-size:13px}.state-page{padding:48px 0}.state-page .account-email{font-size:18px}}
`;
