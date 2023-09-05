import {Temporal} from "@js-temporal/polyfill";
import got from "got";
import crypto from 'crypto';
import {dateRange, DefaultsMap, nextSchoolDay, notNull} from "./utils.js";

const timezone = 'Europe/Warsaw';

const lastHash = new DefaultsMap<string, Map<string, string>>(() => new Map());

function clearOutdated() {
  const today = Temporal.Now.plainDateISO(timezone);
  for (const key of lastHash.keys()) {
    const date = Temporal.PlainDate.from(key)
    if (Temporal.PlainDate.compare(date, today) === -1) lastHash.delete(key);
  }
}

function getClassList(): Promise<string[]> {
  return got.get('https://static.dk-gl.eu/v1/vlo/listclass').json<string[]>();
}

async function fetchClassSubstitutions(classId: string, date: Temporal.PlainDate): Promise<string | undefined> {
  let response: unknown[];
  response = await got.get('https://vlott.dk-gl.eu/v2/substitutions', {
    searchParams: {
      date: date.toString(),
      classid: classId,
    }
  }).json<unknown[]>();
  if (response.length === 0) return undefined;
  return crypto.createHash('md5').update(JSON.stringify(response)).digest("hex");
}

export async function fetchSubstitutionChanges(full: boolean) {
  clearOutdated();
  const classList = await getClassList();

  let from = Temporal.Now.plainDateISO(timezone);
  const until: Temporal.PlainDate = full ? from.add({days: 7}) : nextSchoolDay(from);

  return Promise.all(dateRange(from, until).map(async (date) => {
    const dateHash = lastHash.get(date.toString());
    const wasEmpty = dateHash.size === 0;
    const changedClasses = (await Promise.all(classList.map(async (classId) => {
      const hash = await fetchClassSubstitutions(classId, date);
      const prev = dateHash.get(classId);
      if (hash === prev) return null;

      if (hash === undefined) dateHash.delete(classId);
      else dateHash.set(classId, hash);

      return classId;
    }))).filter(notNull);
    return {
      date,
      wasEmpty,
      changedClasses,
    }
  }));
}
