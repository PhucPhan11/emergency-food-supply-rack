import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Item } from '../../../core/models';
import { PantryStore } from '../../../core/pantry-store';

/** Hộp thoại thêm món mới (`open(null)`) hoặc sửa, xoá một món có sẵn (`open(item)`). */
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-item-dialog',
  templateUrl: './item-dialog.html',
})
export class ItemDialog {
  private readonly store = inject(PantryStore);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly categories = this.store.categories;
  protected readonly target = signal<Item | null>(null);
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl('', { nonNullable: true }),
    unit: new FormControl('', { nonNullable: true }),
    rate: new FormControl<number | null>(null, [Validators.min(0)]),
    step: new FormControl<number | null>(1, [Validators.min(0.001)]),
    minOverride: new FormControl<number | null>(null, [Validators.min(0)]),
    note: new FormControl('', { nonNullable: true }),
  });

  open(item: Item | null): void {
    this.target.set(item);
    this.form.reset(
      item
        ? {
            name: item.name,
            category: item.category,
            unit: item.unit,
            rate: item.rate,
            step: item.step,
            minOverride: item.minOverride,
            note: item.note,
          }
        : { step: 1 },
    );
    this.dialog().nativeElement.showModal();
  }

  protected submit(): void {
    const draft = this.form.getRawValue();
    if (this.form.invalid || !draft.name.trim()) return;
    this.store.saveItem(this.target()?.id ?? null, draft);
    this.close();
  }

  protected remove(): void {
    const item = this.target();
    if (item) this.store.deleteItem(item.id);
    this.close();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }
}
