import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const USED_QRS_FILE = path.join(DATA_DIR, "scanned-qrs.json");

async function ensureStoreFile(filePath: string, fallback: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  await ensureStoreFile(filePath, fallback);

  const fileContents = await fs.readFile(filePath, "utf8");
  if (!fileContents.trim()) {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }

  try {
    return JSON.parse(fileContents) as T;
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await ensureStoreFile(filePath, []);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function registerGeneratedQrToken(token: string, booking: Record<string, unknown>) {
  await ensureStoreFile(BOOKINGS_FILE, []);

  const bookings = await readJsonFile<Record<string, unknown>[]>(BOOKINGS_FILE, []);
  const existingIndex = bookings.findIndex((entry) => {
    const currentToken = typeof entry?.qrToken === "string" ? entry.qrToken : null;
    return currentToken === token;
  });

  if (existingIndex >= 0) {
    bookings[existingIndex] = { ...bookings[existingIndex], ...booking, qrToken: token };
  } else {
    bookings.push({ ...booking, qrToken: token });
  }

  await writeJsonFile(BOOKINGS_FILE, bookings);
  return booking;
}

export async function getGeneratedBookingByToken(token: string) {
  const bookings = await readJsonFile<Record<string, unknown>[]>(BOOKINGS_FILE, []);
  return bookings.find((entry) => {
    const currentToken = typeof entry?.qrToken === "string" ? entry.qrToken : null;
    return currentToken === token;
  }) ?? null;
}

export async function isQrUsed(token: string) {
  const usedTokens = await readJsonFile<string[]>(USED_QRS_FILE, []);
  return usedTokens.includes(token);
}

export async function markQrUsed(token: string) {
  await ensureStoreFile(USED_QRS_FILE, []);
  const usedTokens = await readJsonFile<string[]>(USED_QRS_FILE, []);
  if (!usedTokens.includes(token)) {
    usedTokens.push(token);
    await writeJsonFile(USED_QRS_FILE, usedTokens);
  }
  return true;
}

export async function unmarkQrUsed(token: string) {
  const usedTokens = await readJsonFile<string[]>(USED_QRS_FILE, []);
  const nextUsed = usedTokens.filter((existingToken) => existingToken !== token);
  await writeJsonFile(USED_QRS_FILE, nextUsed);
  return true;
}
