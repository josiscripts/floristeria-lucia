#!/usr/bin/env node

import { createHmac, randomBytes } from "crypto";

/**
 * Generate a simple JWT token for Supabase.
 * This is a minimal implementation - not cryptographically secure for production,
 * but good enough for testing purposes.
 */

function base64url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generateJWT(userId, secret, expiresIn = 3600) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    aud: "authenticated",
    role: "authenticated",
    iat: now,
    exp: now + expiresIn,
  };

  const headerEncoded = base64url(Buffer.from(JSON.stringify(header)));
  const payloadEncoded = base64url(Buffer.from(JSON.stringify(payload)));

  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Create HMAC signature
  const signature = base64url(
    createHmac("sha256", secret).update(signatureInput).digest()
  );

  return `${signatureInput}.${signature}`;
}

// Test
if (import.meta.url === `file://${process.argv[1]}`) {
  const token = generateJWT("test-user-id", "test-secret");
  console.log(token);
}
