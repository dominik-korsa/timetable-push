import {Temporal} from "@js-temporal/polyfill";

export function requireEnv(name: string) {
  const value = process.env[name];
  if (value === undefined) throw new Error(`Env variable "${name}" is not set`);
  return value;
}

export class DefaultsMap<K, V> extends Map<K, V> {
  private readonly generateDefault: (key: K) => V;

  constructor(defaultGenerator: (key: K) => V) {
    super();
    this.generateDefault = defaultGenerator;
  }

  override get(key: K): V {
    let value = super.get(key);
    if (value !== undefined) return value;
    value = this.generateDefault(key);
    this.set(key, value);
    return value;
  }
}

export function nextSchoolDay(date: Temporal.PlainDate): Temporal.PlainDate {
  do {
    date = date.add({ days: 1 });
  } while (date.dayOfWeek >= 6)
  return date;
}

export function dateRange(from: Temporal.PlainDate, to: Temporal.PlainDate) {
  const dates: Temporal.PlainDate[] = [];
  while (Temporal.PlainDate.compare(from, to) != 1) {
    dates.push(from);
    from = from.add({ days: 1 });
  }
  return dates;
}

export function notNull<T>(x: T | null): x is T {
  return x !== null;
}
