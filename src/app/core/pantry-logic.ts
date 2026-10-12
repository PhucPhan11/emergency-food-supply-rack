import { DueLot, Item, Level, Lot, PantryState, Settings, ShoppingEntry } from './models';

// Logic thuần của kệ dự phòng: không Angular, không DOM, không sửa dữ liệu đầu vào.

const DAY_MS = 86_400_000;
const NO_EXPIRY = '9999-12-31';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_SETTINGS: Settings = { people: 4, days: 14, warnDays: 30 };

export const round = (n: number): number => Math.round(n * 1000) / 1000;

export function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function daysUntil(exp: string, today: string): number {
  return Math.round((Date.parse(exp) - Date.parse(today)) / DAY_MS);
}

/** Hàng còn dùng được đến hết ngày ghi trên bao bì. */
export function isExpired(lot: Lot, today: string): boolean {
  return lot.exp !== null && daysUntil(lot.exp, today) < 0;
}

export function minOf(item: Item, settings: Settings): number {
  if (item.minOverride !== null) return item.minOverride;
  const raw = item.rate * settings.people * settings.days;
  return round(Math.ceil(raw / item.step - 1e-9) * item.step);
}

/** Lô đã quá hạn không được tính vào tồn kho. */
export function stockOf(item: Item, today: string): number {
  return round(item.lots.reduce((sum, lot) => (isExpired(lot, today) ? sum : sum + lot.qty), 0));
}

export function coverDays(item: Item, settings: Settings, today: string): number | null {
  const perDay = item.rate * settings.people;
  return perDay > 0 ? stockOf(item, today) / perDay : null;
}

export function levelOf(stock: number, min: number): Level {
  if (stock >= min) return 'ok';
  return stock >= min / 2 ? 'low' : 'short';
}

export function withLot(item: Item, lot: Lot): Item {
  return { ...item, lots: [...item.lots, { ...lot, qty: round(lot.qty) }] };
}

export function withoutLot(item: Item, lotId: string): Item {
  return { ...item, lots: item.lots.filter((lot) => lot.id !== lotId) };
}

/** Lấy ra theo thứ tự hết hạn sớm nhất trước; lô không ghi hạn lấy sau cùng. */
export function consume(item: Item, qty: number, today: string): Item {
  const order = item.lots
    .filter((lot) => !isExpired(lot, today))
    .sort((a, b) => (a.exp ?? NO_EXPIRY).localeCompare(b.exp ?? NO_EXPIRY));
  const taken = new Map<string, number>();
  let left = qty;
  for (const lot of order) {
    if (left <= 0) break;
    const take = Math.min(lot.qty, left);
    taken.set(lot.id, take);
    left = round(left - take);
  }
  const lots = item.lots
    .map((lot) => ({ ...lot, qty: round(lot.qty - (taken.get(lot.id) ?? 0)) }))
    .filter((lot) => lot.qty > 0);
  return { ...item, lots };
}

export function shoppingList(state: PantryState, today: string): ShoppingEntry[] {
  const list: ShoppingEntry[] = [];
  for (const item of state.items) {
    const need = round(minOf(item, state.settings) - stockOf(item, today));
    if (need > 0) list.push({ item, need });
  }
  return list;
}

/** Các lô đã quá hạn hoặc sẽ hết hạn trong `warnDays` ngày, gần hạn nhất đứng đầu. */
export function eatFirst(state: PantryState, today: string): DueLot[] {
  const due: DueLot[] = [];
  for (const item of state.items) {
    for (const lot of item.lots) {
      if (lot.exp === null) continue;
      const days = daysUntil(lot.exp, today);
      if (days <= state.settings.warnDays) due.push({ item, lot, days });
    }
  }
  return due.sort((a, b) => a.days - b.days);
}

// --- Làm sạch dữ liệu từ bên ngoài (localStorage, tệp sao lưu, biểu mẫu) ---

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  typeof value === 'object' && value !== null ? (value as Raw) : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const text = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

function num<T>(value: unknown, fallback: T, min: number): number | T {
  const n = Number(value);
  return value !== null && value !== '' && Number.isFinite(n) && n >= min ? n : fallback;
}

export function normalizeSettings(raw: unknown): Settings {
  const source = asRecord(raw);
  return {
    people: num(source['people'], DEFAULT_SETTINGS.people, 1),
    days: num(source['days'], DEFAULT_SETTINGS.days, 1),
    warnDays: num(source['warnDays'], DEFAULT_SETTINGS.warnDays, 0),
  };
}

export function normalizeItem(raw: unknown, index: number): Item {
  const source = asRecord(raw);
  const lots = asArray(source['lots'])
    .map(asRecord)
    .filter((lot) => Number(lot['qty']) > 0)
    .map((lot, j): Lot => {
      const exp = lot['exp'];
      return {
        id: String(lot['id'] || `lot-${index}-${j}`),
        qty: round(Number(lot['qty'])),
        exp: typeof exp === 'string' && ISO_DATE.test(exp) ? exp : null,
      };
    });
  return {
    id: String(source['id'] || `item-${index}`),
    name: text(source['name'], 'Món chưa đặt tên'),
    category: text(source['category'], 'Khác'),
    unit: text(source['unit'], 'cái'),
    note: text(source['note'], ''),
    rate: num(source['rate'], 0, 0),
    step: num(source['step'], 1, 0.001),
    minOverride: num(source['minOverride'], null, 0),
    lots,
  };
}

export function normalize(raw: unknown): PantryState {
  const source = asRecord(raw);
  return {
    version: 1,
    settings: normalizeSettings(source['settings']),
    items: asArray(source['items']).map(normalizeItem),
  };
}
