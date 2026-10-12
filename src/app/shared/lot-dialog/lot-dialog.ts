import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Item } from '../../core/models';
import { minOf, round, stockOf } from '../../core/pantry-logic';
import { PantryStore } from '../../core/pantry-store';

/** Hộp thoại nhập một lô hàng mới cho một món. Trang nào cần thì đặt vào và gọi `open(item)`. */
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-lot-dialog',
  templateUrl: './lot-dialog.html',
})
export class LotDialog {
  private readonly store = inject(PantryStore);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly item = signal<Item | null>(null);
  protected readonly form = new FormGroup({
    qty: new FormControl<number | null>(null, [Validators.required, Validators.min(0.001)]),
    exp: new FormControl('', { nonNullable: true }),
  });

  /** Gợi ý sẵn lượng còn thiếu so với mức tối thiểu; đủ rồi thì gợi ý một bước. */
  open(item: Item): void {
    const need = round(minOf(item, this.store.settings()) - stockOf(item, this.store.today()));
    this.item.set(item);
    this.form.reset({ qty: need > 0 ? need : item.step, exp: '' });
    this.dialog().nativeElement.showModal();
  }

  protected submit(): void {
    const item = this.item();
    const { qty, exp } = this.form.getRawValue();
    if (!item || this.form.invalid || qty === null) return;
    this.store.addLot(item.id, qty, exp || null);
    this.close();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }
}
