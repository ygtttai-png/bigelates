/**
 * Web Push için VAPID anahtar çifti üretir (P-256).
 * Kullanım: node scripts/generate-vapid-keys.mjs
 *
 * Public key  → NEXT_PUBLIC_VAPID_PUBLIC_KEY (istemci, herkese açık)
 * Private key → Supabase secret VAPID_PRIVATE_KEY (asla repoya koyma)
 */
import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
});

const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });

const b64urlToBuf = (s) => Buffer.from(s, "base64url");

// VAPID public key: sıkıştırılmamış nokta → 0x04 || X || Y
const uncompressed = Buffer.concat([
  Buffer.from([0x04]),
  b64urlToBuf(pub.x),
  b64urlToBuf(pub.y),
]);

console.log("VAPID_PUBLIC_KEY =", uncompressed.toString("base64url"));
console.log("VAPID_PRIVATE_KEY =", priv.d);
