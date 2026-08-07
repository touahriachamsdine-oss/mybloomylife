// Password hashing + demo account seeding for MyBloom Life.
//
// Plaintext passwords are never stored or compared after first-run seeding:
// accounts are stored as PBKDF2-SHA256 (salt + hash). Legacy accounts saved
// with a plaintext `password` field are verified once and migrated on the
// next successful login.

export interface StoredCredential {
  salt: string;
  hash: string;
}

export interface DemoAccount {
  email: string;
  name: string;
  role: "youth" | "parent" | "psychologist" | "admin";
  password: string;
}

export interface AuthUser extends StoredCredential {
  email: string;
  name: string;
  role: "youth" | "parent" | "psychologist" | "admin";
  password?: never;
}

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 60000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createCredential(password: string): Promise<StoredCredential> {
  const salt = randomSalt();
  return { salt, hash: await hashPassword(password, salt) };
}

// Demo accounts used only on first run so the app can be explored without a
// registration flow. Only their hashes are ever persisted.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "youth@example.com", name: "Sara", role: "youth", password: "123" },
  { email: "parent@example.com", name: "Abu Sara", role: "parent", password: "1234" },
  { email: "papa@example.com", name: "Abu Sara", role: "parent", password: "1234" },
  { email: "psychologist@example.com", name: "Dr. Laila", role: "psychologist", password: "123" },
  { email: "psy@example.com", name: "Dr. Laila", role: "psychologist", password: "123" },
  { email: "laila@example.com", name: "Dr. Laila", role: "psychologist", password: "123" },
  { email: "admin@example.com", name: "System Admin", role: "admin", password: "123" },
];

export async function seedDemoAccounts(): Promise<AuthUser[]> {
  return Promise.all(
    DEMO_ACCOUNTS.map(async ({ password, ...account }) => ({
      ...account,
      ...(await createCredential(password)),
      password: undefined as unknown as undefined,
    }))
  );
}

// Verifies a candidate password against a stored account. Supports both
// hashed accounts and legacy plaintext accounts (which are migrated by the
// caller after a successful check).
export async function verifyPassword(
  password: string,
  account: { salt?: string; hash?: string; password?: string }
): Promise<boolean> {
  if (account.salt && account.hash) {
    return (await hashPassword(password, account.salt)) === account.hash;
  }
  return typeof account.password === "string" && account.password === password;
}
