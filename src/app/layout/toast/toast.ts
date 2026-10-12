import { Component, inject } from '@angular/core';
import { PantryStore } from '../../core/pantry-store';
import { Toaster } from '../../core/toaster';

/** Hiển thị thông báo hiện tại của `Toaster`, kèm nút hoàn tác khi có thể. */
@Component({
  selector: 'app-toast',
  styleUrl: './toast.css',
  templateUrl: './toast.html',
})
export class Toast {
  private readonly store = inject(PantryStore);

  protected readonly message = inject(Toaster).current;

  protected undo(): void {
    this.store.undo();
  }
}
