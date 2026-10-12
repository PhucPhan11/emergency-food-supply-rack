import { Injectable, computed, inject, signal } from '@angular/core';
import { formatQty } from './format';
import { Item, ItemDraft, PantryState, Settings } from './models';
import {
  consume,
  eatFirst,
  isoDate,
  normalizeItem,
  shoppingList,
  stockOf,
  withLot,
  withoutLot,
} from './pantry-logic';
import { seedState } from './pantry-seed';
import { PantryStorage } from './pantry-storage';
import { Toaster } from './toaster';

const newId = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/**
 * Nguồn dữ liệu duy nhất của kệ. Giao diện chỉ đọc qua các signal bên dưới
 * và chỉ thay đổi dữ liệu qua các phương thức của lớp này.
 */
@Injectable({ providedIn: 'root' })
export class PantryStore {
  private readonly storage = inject(PantryStorage);
  private readonly toaster = inject(Toaster);

  private readonly current = signal<PantryState>(this.storage.load() ?? seedState());
  private readonly now = signal(isoDate(new Date()));
  private previous: PantryState | null = null;

  readonly state = this.current.asReadonly();
  readonly today = this.now.asReadonly();
  readonly settings = computed(() => this.current().settings);
  readonly items = computed(() => this.current().items);
  readonly categories = computed(() => [...new Set(this.items().map((item) => item.category))]);
  readonly shoppingList = computed(() => shoppingList(this.current(), this.now()));
  readonly eatFirst = computed(() => eatFirst(this.current(), this.now()));

  /** Gọi khi người dùng quay lại trang, phòng khi trang mở qua nửa đêm. */
  refreshToday(): void {
    this.now.set(isoDate(new Date()));
  }

  addLot(itemId: string, qty: number, exp: string | null): void {
    const item = this.find(itemId);
    if (!item || !(qty > 0)) return;
    this.commit(
      `Đã nhập ${formatQty(qty)} ${item.unit} ${item.name}`,
      this.replacing(withLot(item, { id: newId(), qty, exp })),
    );
  }

  /** Lấy ra ăn một bước (`item.step`), hoặc phần còn lại nếu ít hơn. */
  takeOut(itemId: string): void {
    const item = this.find(itemId);
    if (!item) return;
    const qty = Math.min(item.step, stockOf(item, this.now()));
    if (!(qty > 0)) return;
    this.commit(
      `Đã lấy ${formatQty(qty)} ${item.unit} ${item.name}`,
      this.replacing(consume(item, qty, this.now())),
    );
  }

  removeLot(itemId: string, lotId: string): void {
    const item = this.find(itemId);
    if (!item) return;
    this.commit(`Đã bỏ một lô ${item.name}`, this.replacing(withoutLot(item, lotId)));
  }

  /** `itemId` null nghĩa là thêm món mới. */
  saveItem(itemId: string | null, draft: ItemDraft): void {
    const existing = itemId === null ? undefined : this.find(itemId);
    const item = normalizeItem(
      { ...draft, id: existing?.id ?? newId(), lots: existing?.lots ?? [] },
      0,
    );
    if (existing) {
      this.commit(`Đã lưu ${item.name}`, this.replacing(item));
    } else {
      this.commit(`Đã thêm ${item.name}`, { ...this.current(), items: [...this.items(), item] });
    }
  }

  deleteItem(itemId: string): void {
    const item = this.find(itemId);
    if (!item) return;
    this.commit(`Đã xoá ${item.name}`, {
      ...this.current(),
      items: this.items().filter((it) => it.id !== itemId),
    });
  }

  updateSettings(patch: Partial<Settings>): void {
    this.commit('Đã cập nhật cài đặt', {
      ...this.current(),
      settings: { ...this.settings(), ...patch },
    });
  }

  reset(): void {
    this.commit('Đã đặt lại về danh mục mẫu', seedState());
  }

  restore(state: PantryState): void {
    this.commit('Đã khôi phục dữ liệu từ tệp', state);
  }

  undo(): void {
    if (!this.previous) return;
    this.current.set(this.previous);
    this.previous = null;
    this.storage.save(this.current());
    this.toaster.show('Đã hoàn tác');
  }

  private find(itemId: string): Item | undefined {
    return this.items().find((item) => item.id === itemId);
  }

  private replacing(item: Item): PantryState {
    return {
      ...this.current(),
      items: this.items().map((it) => (it.id === item.id ? item : it)),
    };
  }

  // Mọi thay đổi dữ liệu đi qua đây để luôn được lưu và hoàn tác được một bước.
  private commit(message: string, next: PantryState): void {
    this.previous = this.current();
    this.current.set(next);
    if (this.storage.save(next)) {
      this.toaster.show(message, true);
    } else {
      this.toaster.show('Trình duyệt không cho lưu. Hãy sao lưu ra tệp trong Cài đặt.');
    }
  }
}
