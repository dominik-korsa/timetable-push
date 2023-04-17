import fs from 'fs';
import config from "./config";

interface DbRegistration {
  tri: 'v-lo';
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

async function save(data: DbRegistration[]) {
  await fs.promises.writeFile(config.registrationDbPath, JSON.stringify(data, null, 2));
}

async function readData(): Promise<Readonly<Readonly<DbRegistration>[]>> {
  try {
    return JSON.parse(await fs.promises.readFile(config.registrationDbPath, 'utf-8'));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      const data: DbRegistration[ ] = [];
      await save(data);
      return data;
    }
    throw error;
  }
}

export async function put(registration: DbRegistration) {
  let data = (await readData()).filter(
    (item) => item.endpoint !== registration.endpoint || item.tri !== registration.tri
  );
  data.push(registration);
  await save(data);
}

export function getRegistrations() {
  return readData();
}

export async function removeRegistrations(endpoints: string[]) {
  let data = (await readData()).filter(
    (item) => !endpoints.includes(item.endpoint)
  );
  await save(data);
}
