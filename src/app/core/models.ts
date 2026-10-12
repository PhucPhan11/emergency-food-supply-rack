/** Một lần nhập hàng: cùng món nhưng có thể khác hạn sử dụng. */
export interface Lot {
  readonly id: string;
  readonly qty: number;
  /** Ngày hết hạn dạng YYYY-MM-DD, null nếu bao bì không ghi. */
  readonly exp: string | null;
}

export interface Item {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly unit: string;
  readonly note: string;
  /** Lượng ước tính cho 1 người trong 1 ngày, tính theo `unit`. */
  readonly rate: number;
  /** Lượng mỗi lần lấy ra, cũng là bước làm tròn của mức tối thiểu. */
  readonly step: number;
  /** Mức tối thiểu đặt tay; null thì tự tính từ `rate`. */
  readonly minOverride: number | null;
  readonly lots: readonly Lot[];
}

export interface Settings {
  readonly people: number;
  readonly days: number;
  /** Báo trước bao nhiêu ngày khi một lô sắp hết hạn. */
  readonly warnDays: number;
}

export interface PantryState {
  readonly version: 1;
  readonly settings: Settings;
  readonly items: readonly Item[];
}

/** Các trường người dùng nhập trong hộp sửa món; số có thể bỏ trống. */
export interface ItemDraft {
  readonly name: string;
  readonly category: string;
  readonly unit: string;
  readonly note: string;
  readonly rate: number | null;
  readonly step: number | null;
  readonly minOverride: number | null;
}

export type Level = 'ok' | 'low' | 'short';

export interface ShoppingEntry {
  readonly item: Item;
  readonly need: number;
}

export interface DueLot {
  readonly item: Item;
  readonly lot: Lot;
  /** Số ngày còn lại; âm nghĩa là đã quá hạn. */
  readonly days: number;
}
