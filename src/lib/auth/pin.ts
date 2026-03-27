/**
 * Client-side PIN hashing using Web Crypto API.
 * Sufficient for a classroom/educational app — no server-side secrets needed.
 */

/** Hash a 4-digit PIN to a hex string using SHA-256 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`econgames:${pin}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Verify a PIN against a stored hash */
export async function verifyPin(
  pin: string,
  storedHash: string
): Promise<boolean> {
  const inputHash = await hashPin(pin);
  return inputHash === storedHash;
}
