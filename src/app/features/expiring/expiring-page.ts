import { Component, inject } from '@angular/core';
import { DueLot } from '../../core/models';
import { PantryStore } from '../../core/pantry-store';
import { DueLabelPipe } from '../../shared/pipes/due-label-pipe';
import { QtyPipe } from '../../shared/pipes/qty-pipe';
import { ViDatePipe } from '../../shared/pipes/vi-date-pipe';

/** Mục "Ăn trước": các lô đã quá hạn hoặc sắp hết hạn, gần hạn nhất đứng đầu. */
@Component({
  imports: [DueLabelPipe, QtyPipe, ViDatePipe],
  selector: 'app-expiring-page',
  templateUrl: './expiring-page.html',
})
export class ExpiringPage {
  private readonly store = inject(PantryStore);

  protected readonly due = this.store.eatFirst;
  protected readonly settings = this.store.settings;

  protected remove(entry: DueLot): void {
    this.store.removeLot(entry.item.id, entry.lot.id);
  }
}
