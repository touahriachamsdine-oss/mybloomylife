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

// Single source of truth for the role union. This was previously inlined in
// seven separate places, and every copy had to be edited in lockstep to add a
// role - which is how the teacher role ended up silently dropped while the
// union still claimed to describe every possible role.
export type UserRole = "youth" | "parent" | "teacher" | "psychologist" | "admin";

export const USER_ROLES: readonly UserRole[] = [
  "youth",
  "parent",
  "teacher",
  "psychologist",
  "admin",
] as const;

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

// Roles a visitor may pick for themselves at signup.
// "admin" is deliberately excluded: self-registering as an administrator would
// be a privilege escalation, and the register() signature used to be loose
// enough that a hand-rolled request could claim any role at all.
export type SelfRegisterRole = Exclude<UserRole, "admin">;

export const SELF_REGISTER_ROLES: readonly SelfRegisterRole[] = [
  "youth",
  "parent",
  "teacher",
  "psychologist",
] as const;

export function isSelfRegisterRole(value: unknown): value is SelfRegisterRole {
  return typeof value === "string" && (SELF_REGISTER_ROLES as readonly string[]).includes(value);
}

export interface DemoAccount {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

export interface AuthUser extends StoredCredential {
  email: string;
  name: string;
  role: UserRole;
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
//
// These have published, trivial passwords, so they are treated as a
// development fixture and refused in production - see isDemoAccountEmail.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "youth@example.com", name: "Sara", role: "youth", password: "123" },
  { email: "parent@example.com", name: "Abu Sara", role: "parent", password: "1234" },
  { email: "papa@example.com", name: "Abu Sara", role: "parent", password: "1234" },
  { email: "psychologist@example.com", name: "Dr. Laila", role: "psychologist", password: "123" },
  { email: "psy@example.com", name: "Dr. Laila", role: "psychologist", password: "123" },
  { email: "laila@example.com", name: "Dr. Laila", role: "psychologist", password: "123" },
  { email: "admin@example.com", name: "System Admin", role: "admin", password: "123" },
  { email: "admin2@example.com", name: "Admin II", role: "admin", password: "1234" },
  { email: "yamina@example.com", name: "Yamina", role: "youth", password: "123" },
  { email: "maman@example.com", name: "Abu Yamina", role: "parent", password: "1234" },
  { email: "drmeriem@example.com", name: "Dr. Meriem", role: "psychologist", password: "123" },
];

/**
 * Whether an email belongs to the published demo fixture.
 *
 * Used to refuse these logins in production. Stopping the seeders is not
 * sufficient on its own: accounts seeded before that gate was added are still
 * present in the live user list, and a psychologist account with the password
 * "123" is a working backdoor into real student data. Checking the identity at
 * sign-in closes that regardless of what the database already contains.
 */
export function isDemoAccountEmail(email: string): boolean {
  const target = email.toLowerCase().trim();
  return DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === target);
}

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
