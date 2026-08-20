const lockupId = "art-with-ai-ai-zaowushe";

function logo(src, className) {
  const image = document.createElement("img");
  image.className = `brand-lockup-logo ${className}`;
  image.src = src;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  return image;
}

function mountBrandLockup() {
  const brand = document.querySelector(".vibe-brand");
  if (!brand) return false;
  if (brand.dataset.lockup === lockupId) return true;

  const divider = document.createElement("span");
  divider.className = "brand-lockup-divider";
  divider.setAttribute("aria-hidden", "true");

  brand.replaceChildren(
    logo("./vibe/brands/art-with-ai.svg", "brand-lockup-logo--art-with-ai"),
    divider,
    logo("./vibe/brands/ai-zaowushe.svg", "brand-lockup-logo--ai-zaowushe"),
  );
  brand.classList.add("brand-lockup-active");
  brand.dataset.lockup = lockupId;
  brand.setAttribute("aria-label", "ART WITH AI 与 AI造物社 · 回到首页");
  return true;
}

if (!mountBrandLockup()) {
  const observer = new MutationObserver(() => {
    if (mountBrandLockup()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
