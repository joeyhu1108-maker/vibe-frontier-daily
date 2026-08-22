const PUBLIC_SITE = "https://vibe.zone-y.com/";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "vibe-frontier-account" });
    }

    const email = getVerifiedEmail(request);
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

    const products = await env.DB.prepare(
      `SELECT p.*, CASE WHEN e.email IS NULL THEN 0 ELSE 1 END AS owned
       FROM products p
       LEFT JOIN entitlements e ON e.product_id = p.id AND e.email = ?
       ORDER BY CASE p.id
         WHEN 'free-method' THEN 1
         WHEN 'vfp-001' THEN 2
         WHEN 'vmd-001' THEN 3
         ELSE 4 END`
    ).bind(email).all();

    return html(accountPage(email, products.results || [], url.searchParams.get("interest")));
  }
};

function getVerifiedEmail(request) {
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion");
  const email = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (!assertion || !email) return "";
  return email.trim().toLowerCase();
}

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

function accountPage(email, products, interest) {
  const interestProduct = products.find((product) => product.id === interest);
  const cards = products.map(productCard).join("");
  const notice = interestProduct && Number(interestProduct.price_cny) > 0 && !Number(interestProduct.owned)
    ? `<aside class="notice"><span>PURCHASE INTEREST</span><p>你正在查看 <strong>${escapeHtml(interestProduct.title)}</strong>。当前首发测试采用人工核对：完成购买后，权益会绑定到这个登录邮箱。</p><button type="button" data-copy="${escapeHtml(`我想购买：${interestProduct.title}｜¥${interestProduct.price_cny}\n登录邮箱：${email}`)}">复制购买信息 ↗</button></aside>`
    : "";

  return shell(`
    <header class="topbar">
      <a class="brand" href="${PUBLIC_SITE}"><span>VIBE</span><strong>FRONTIER</strong></a>
      <nav><a href="${PUBLIC_SITE}#method">免费学习</a><a href="${PUBLIC_SITE}#offers">商品</a><a href="${PUBLIC_SITE}#motion-skill">动效 Skill</a></nav>
      <a class="logout" href="/cdn-cgi/access/logout">退出</a>
    </header>
    <main>
      <section class="account-hero">
        <div class="account-title"><p class="eyebrow">MEMBER FIELD / VERIFIED EMAIL</p><h1>你的学习与<br><em>交付内容。</em></h1></div>
        <div class="identity"><span>当前身份</span><strong>${escapeHtml(email)}</strong><small>登录由 Cloudflare 一次性验证码保护</small></div>
      </section>
      ${notice}
      <section class="library" aria-labelledby="library-title">
        <div class="section-head"><div><p class="eyebrow">YOUR LIBRARY</p><h2 id="library-title">免费先学，购买后直接下载</h2></div><p>商品权益只绑定当前邮箱。再次登录时不需要创建密码，输入邮箱验证码即可回来。</p></div>
        <div class="grid">${cards}</div>
      </section>
      <section class="how"><span>HOW IT WORKS</span><ol><li><b>01</b> 邮箱验证码登录</li><li><b>02</b> 购买后绑定权益</li><li><b>03</b> 回到这里下载更新</li></ol></section>
    </main>
    <footer><span>AI 造物社 · VIBE FRONTIER</span><a href="${PUBLIC_SITE}">返回公开网站 ↗</a></footer>
  `, `VIBE FRONTIER｜我的内容`);
}

function productCard(product) {
  const owned = Number(product.owned) === 1;
  const isFree = Number(product.price_cny) === 0;
  const isService = product.id === "motion-clinic";
  const action = isFree
    ? `<a href="${PUBLIC_SITE}#method">开始学习 ↗</a>`
    : owned && !isService
      ? `<a href="/download/${encodeURIComponent(product.id)}">下载 ZIP ↓</a>`
      : isService
        ? `<a href="${PUBLIC_SITE}#contact">提交案例 ↗</a>`
        : `<a href="/?interest=${encodeURIComponent(product.id)}">登记购买 ↗</a>`;
  const status = isFree ? "OPEN" : owned ? "OWNED" : "LOCKED";
  const price = isFree ? "¥0" : product.id === "motion-clinic" ? `¥${product.price_cny} 起` : `¥${product.price_cny}`;

  return `<article class="product ${owned ? "is-owned" : ""}">
    <div class="product-top"><span>${escapeHtml(product.kind)}</span><b>${status}</b></div>
    <div class="product-mark">${product.id === "vfp-001" ? "6L" : product.id === "vmd-001" ? "1M" : product.id === "motion-clinic" ? "1:1" : "4S"}</div>
    <h3>${escapeHtml(product.title)}</h3>
    <p>${escapeHtml(product.description)}</p>
    <div class="product-bottom"><strong>${price}</strong>${action}</div>
  </article>`;
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
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b0b0c"><title>${escapeHtml(title)}</title><style>${styles}</style></head><body>${content}<script>document.addEventListener('click',async(e)=>{const b=e.target.closest('[data-copy]');if(!b)return;try{await navigator.clipboard.writeText(b.dataset.copy);b.textContent='已复制，去发送给主理人 ✓'}catch{b.textContent='复制失败，请截图此页'}})</script></body></html>`;
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
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
  :root{color-scheme:dark;--ink:#0b0b0c;--paper:#f1eee6;--blue:#5555ff;--line:rgba(255,255,255,.18);font-family:Inter,"Noto Sans SC",system-ui,sans-serif}*{box-sizing:border-box}html{background:var(--ink);color:var(--paper)}body{margin:0;min-height:100vh;background:radial-gradient(circle at 78% 8%,rgba(85,85,255,.28),transparent 30%),var(--ink)}a{color:inherit;text-decoration:none}.topbar{height:68px;padding:0 3vw;display:flex;align-items:center;border-bottom:1px solid var(--line);gap:3rem;position:sticky;top:0;background:rgba(11,11,12,.88);backdrop-filter:blur(18px);z-index:5}.brand{display:flex;align-items:baseline;gap:.4rem;font-size:.78rem;letter-spacing:.16em}.brand strong{font-size:1.05rem}.topbar nav{display:flex;gap:1.8rem;margin-right:auto;font-size:.82rem}.topbar nav a,.logout{opacity:.66}.topbar nav a:hover,.logout:hover{opacity:1}.logout{font-size:.78rem;border:1px solid var(--line);padding:.65rem 1rem}main{width:min(1360px,94vw);margin:auto}.account-hero{min-height:430px;padding:8rem 0 4rem;display:grid;grid-template-columns:1.25fr .75fr;gap:4rem;align-items:end;border-bottom:1px solid var(--line)}.eyebrow{font:600 .68rem/1.2 ui-monospace,SFMono-Regular,monospace;letter-spacing:.16em;text-transform:uppercase;color:#a8a8ff}.account-title h1,.state-page h1{font:400 clamp(3.8rem,8vw,8.5rem)/.86 Georgia,serif;letter-spacing:-.055em;margin:1.2rem 0 0}.account-title h1 em{color:#8888ff;font-weight:400}.identity{justify-self:end;width:min(410px,100%);border-top:1px solid var(--line);padding-top:1.2rem;display:grid;gap:.7rem}.identity span,.identity small{font-size:.72rem;opacity:.55}.identity strong{font-size:1.05rem;overflow-wrap:anywhere}.notice{margin:2rem 0 0;border:1px solid #7777ff;background:#5555ff;color:white;padding:1.2rem 1.4rem;display:grid;grid-template-columns:190px 1fr auto;align-items:center;gap:1.5rem}.notice span{font:600 .68rem ui-monospace,monospace;letter-spacing:.14em}.notice p{margin:0;font-size:.86rem}.notice button{border:1px solid white;background:transparent;color:white;padding:.8rem 1rem;cursor:pointer}.library{padding:7rem 0}.section-head{display:grid;grid-template-columns:1fr 420px;align-items:end;gap:3rem;margin-bottom:2.2rem}.section-head h2{font:400 clamp(2.6rem,4.8vw,5.8rem)/.95 Georgia,serif;letter-spacing:-.045em;margin:.8rem 0 0}.section-head>p{font-size:.9rem;line-height:1.7;opacity:.62}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}.product{min-height:480px;background:#151516;padding:1rem;display:flex;flex-direction:column}.product.is-owned{background:#18182b}.product-top,.product-bottom{display:flex;justify-content:space-between;align-items:center;font:600 .62rem ui-monospace,monospace;letter-spacing:.1em}.product-top b{color:#9999ff}.product-mark{height:190px;margin:1.3rem 0;display:flex;align-items:center;justify-content:center;background:#27272a;font:400 5.8rem/.8 Georgia,serif;color:#7777ff}.product:nth-child(2) .product-mark{background:#f2eee5;color:#111}.product:nth-child(3) .product-mark{background:#5555ff;color:white}.product:nth-child(4) .product-mark{background:#adff2f;color:#111}.product h3{font:400 1.45rem/1.1 Georgia,serif;margin:.4rem 0 .7rem}.product>p{font-size:.78rem;line-height:1.6;opacity:.6;margin:0}.product-bottom{margin-top:auto;padding-top:1.3rem;border-top:1px solid var(--line)}.product-bottom strong{font:400 1.25rem Georgia,serif}.product-bottom a{text-decoration:underline;text-underline-offset:4px}.how{border-top:1px solid var(--line);padding:2.4rem 0 5rem;display:grid;grid-template-columns:1fr 3fr}.how>span{font:.68rem ui-monospace,monospace;letter-spacing:.12em}.how ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.how li{display:flex;gap:1rem;font-size:.84rem}.how b{color:#8888ff}footer{width:min(1360px,94vw);margin:auto;border-top:1px solid var(--line);padding:1.5rem 0 3rem;display:flex;justify-content:space-between;font-size:.7rem;opacity:.62}.state-page{min-height:100vh;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;max-width:1000px}.state-page p:not(.eyebrow){max-width:650px;line-height:1.7;opacity:.62}.state-page .primary,.state-page .secondary{margin-top:1rem;border:1px solid var(--line);padding:.9rem 1.2rem}.state-page .primary{background:#5555ff;border-color:#5555ff}.state-page .secondary{margin-left:.8rem}@media(max-width:900px){.topbar{gap:1rem}.topbar nav{display:none}.account-hero{grid-template-columns:1fr;padding:6rem 0 3rem;min-height:500px}.identity{justify-self:start;margin-top:3rem}.notice{grid-template-columns:1fr}.section-head{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,1fr)}.how{grid-template-columns:1fr}.how ol{margin-top:1.5rem}}@media(max-width:560px){.topbar{height:58px}.account-title h1,.state-page h1{font-size:3.7rem}.library{padding:4rem 0}.grid{grid-template-columns:1fr}.product{min-height:440px}.section-head h2{font-size:2.8rem}.how ol{grid-template-columns:1fr}.notice{margin-top:1rem}.logout{padding:.55rem .7rem}.state-page{width:90vw}.state-page .secondary{margin-left:0}}
`;
