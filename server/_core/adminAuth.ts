import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/**
 * Password hash format:
 * scrypt$N$r$p$saltHex$derivedKeyHex
 */
export function hashAdminPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("hex"),
    derivedKey.toString("hex"),
  ].join("$");
}

export function verifyAdminPassword(password: string, encodedHash: string): boolean {
  try {
    const [algorithm, n, r, p, saltHex, keyHex] = encodedHash.split("$");

    if (
      algorithm !== "scrypt" ||
      !n ||
      !r ||
      !p ||
      !saltHex ||
      !keyHex
    ) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const expectedKey = Buffer.from(keyHex, "hex");

    if (!salt.length || !expectedKey.length) return false;

    const derivedKey = scryptSync(password, salt, expectedKey.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });

    return (
      derivedKey.length === expectedKey.length &&
      timingSafeEqual(derivedKey, expectedKey)
    );
  } catch {
    return false;
  }
}
