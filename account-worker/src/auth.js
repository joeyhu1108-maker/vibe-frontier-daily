import { createRemoteJWKSet, jwtVerify } from "jose";

const keySets = new Map();

export async function getVerifiedEmail(request, env) {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  const issuer = env.TEAM_DOMAIN;
  if (!token || !env.POLICY_AUD || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/i.test(issuer || "")) return "";

  try {
    if (!keySets.has(issuer)) {
      keySets.set(issuer, createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)));
    }
    const { payload } = await jwtVerify(token, keySets.get(issuer), {
      issuer,
      audience: env.POLICY_AUD,
      algorithms: ["RS256"],
      requiredClaims: ["exp", "iat", "email"]
    });
    return typeof payload.email === "string" && payload.email.includes("@")
      ? payload.email.trim().toLowerCase()
      : "";
  } catch {
    return "";
  }
}
