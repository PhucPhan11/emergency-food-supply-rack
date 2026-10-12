import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PantryStore } from '../../core/pantry-store';
import { QtyPipe } from '../../shared/pipes/qty-pipe';

/** Đầu trang: tên, quy mô kệ, tiến độ tổng và thanh chuyển mục. */
@Component({
  imports: [QtyPipe, RouterLink, RouterLinkActive],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  private readonly store = inject(PantryStore);

  protected readonly settings = this.store.settings;
  protected readonly total = computed(() => this.store.items().length);
  protected readonly enough = computed(() => this.total() - this.store.shoppingList().length);
  protected readonly percent = computed(() =>
    this.total() ? (this.enough() / this.total()) * 100 : 0,
  );
  protected readonly tabs = computed(() => [
    { path: '/ke', label: 'Kệ', count: 0 },
    { path: '/can-mua', label: 'Cần mua', count: this.store.shoppingList().length },
    { path: '/an-truoc', label: 'Ăn trước', count: this.store.eatFirst().length },
    { path: '/cai-dat', label: 'Cài đặt', count: 0 },
  ]);
}
