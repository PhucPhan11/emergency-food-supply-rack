import { Component, computed, inject, input, output, signal } from '@angular/core';
import { dueLabel, formatDate } from '../../../core/format';
import { Item, Level } from '../../../core/models';
import { coverDays, daysUntil, levelOf, minOf, round, stockOf } from '../../../core/pantry-logic';
import { PantryStore } from '../../../core/pantry-store';
import { QtyPipe } from '../../../shared/pipes/qty-pipe';

/** Thẻ của một món trên kệ: tồn kho so với mức tối thiểu, cảnh báo và danh sách lô. */
@Component({
  imports: [QtyPipe],
  selector: 'app-item-card',
  styleUrl: './item-card.css',
  templateUrl: './item-card.html',
})
export class ItemCard {
  private readonly store = inject(PantryStore);

  readonly item = input.required<Item>();
  readonly addLot = output<void>();
  readonly editItem = output<void>();

  protected readonly lotsOpen = signal(false);

  protected readonly view = computed(() => {
    const item = this.item();
    const settings = this.store.settings();
    const today = this.store.today();
    const min = minOf(item, settings);
    const stock = stockOf(item, today);
    const cover = coverDays(item, settings, today);

    const lots = item.lots.map((lot) => {
      const days = lot.exp === null ? null : daysUntil(lot.exp, today);
      let level: Level | '' = '';
      if (days !== null && days < 0) level = 'short';
      else if (days !== null && days <= settings.warnDays) level = 'low';
      const when =
        lot.exp === null || days === null
          ? 'không ghi hạn'
          : `HSD ${formatDate(lot.exp)}, ${dueLabel(days)}`;
      return { lot, level, when };
    });

    return {
      min,
      stock,
      level: levelOf(stock, min),
      percent: min > 0 ? Math.min(100, (stock / min) * 100) : 100,
      missing: round(Math.max(0, min - stock)),
      coverDays: cover === null || stock <= 0 ? null : Math.floor(cover),
      takeQty: stock > 0 ? Math.min(item.step, stock) : item.step,
      expired: lots.filter((row) => row.level === 'short').length,
      expiring: lots.filter((row) => row.level === 'low').length,
      lots,
    };
  });

  protected takeOut(): void {
    this.store.takeOut(this.item().id);
  }

  protected removeLot(lotId: string): void {
    this.store.removeLot(this.item().id, lotId);
  }

  protected toggleLots(): void {
    this.lotsOpen.update((open) => !open);
  }
}
