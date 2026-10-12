import { Component, computed, inject } from '@angular/core';
import { Item } from '../../core/models';
import { PantryStore } from '../../core/pantry-store';
import { LotDialog } from '../../shared/lot-dialog/lot-dialog';
import { ItemCard } from './item-card/item-card';
import { ItemDialog } from './item-dialog/item-dialog';

/** Mục "Kệ": toàn bộ món, gom theo nhóm, kèm thao tác lấy ra, nhập và sửa. */
@Component({
  imports: [ItemCard, ItemDialog, LotDialog],
  selector: 'app-shelf-page',
  templateUrl: './shelf-page.html',
})
export class ShelfPage {
  private readonly store = inject(PantryStore);

  protected readonly groups = computed(() => {
    const byCategory = new Map<string, Item[]>();
    for (const item of this.store.items()) {
      const items = byCategory.get(item.category) ?? [];
      items.push(item);
      byCategory.set(item.category, items);
    }
    return [...byCategory].map(([category, items]) => ({ category, items }));
  });
}
