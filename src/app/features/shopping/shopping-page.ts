import { Component, inject } from '@angular/core';
import { formatQty } from '../../core/format';
import { PantryStore } from '../../core/pantry-store';
import { Toaster } from '../../core/toaster';
import { LotDialog } from '../../shared/lot-dialog/lot-dialog';
import { QtyPipe } from '../../shared/pipes/qty-pipe';

/** Mục "Cần mua": các món đang dưới mức tối thiểu và lượng cần mua bù. */
@Component({
  imports: [LotDialog, QtyPipe],
  selector: 'app-shopping-page',
  templateUrl: './shopping-page.html',
})
export class ShoppingPage {
  private readonly toaster = inject(Toaster);

  protected readonly list = inject(PantryStore).shoppingList;

  protected async copy(): Promise<void> {
    const lines = this.list().map(
      ({ item, need }) => `- ${item.name}: ${formatQty(need)} ${item.unit}`,
    );
    const text = `Cần mua cho kệ dự phòng:\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      this.toaster.show('Đã sao chép danh sách cần mua');
    } catch {
      window.prompt('Sao chép danh sách bên dưới:', text);
    }
  }
}
