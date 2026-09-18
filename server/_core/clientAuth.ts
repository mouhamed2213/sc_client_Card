import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

export const CLIENT_USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,64}$/;

export function hashClientPassword(password: string): string {
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

export function verifyClientPassword(
  password: string,
  encodedHash: string
): boolean {
  try {
    const [algorithm, nRaw, rRaw, pRaw, saltHex, keyHex] =
      encodedHash.split("$");

    if (
      algorithm !== "scrypt" ||
      !nRaw ||
      !rRaw ||
      !pRaw ||
      !saltHex ||
      !keyHex
    ) {
      return false;
    }

    const n = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);

    if (
      !Number.isSafeInteger(n) ||
      !Number.isSafeInteger(r) ||
      !Number.isSafeInteger(p) ||
      n <= 1 ||
      r <= 0 ||
      p <= 0
    ) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const expectedKey = Buffer.from(keyHex, "hex");

    if (salt.length !== SALT_BYTES || expectedKey.length !== KEY_LENGTH) {
      return false;
    }

    const derivedKey = scryptSync(password, salt, expectedKey.length, {
      N: n,
      r,
      p,
    });

    return (
      derivedKey.length === expectedKey.length &&
      timingSafeEqual(derivedKey, expectedKey)
    );
  } catch {
    return false;
  }
}
