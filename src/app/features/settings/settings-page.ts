import { Component, inject } from '@angular/core';
import { Settings } from '../../core/models';
import { backupFileName, parseBackup, serializeBackup } from '../../core/pantry-backup';
import { PantryStore } from '../../core/pantry-store';
import { Toaster } from '../../core/toaster';

/** Mục "Cài đặt": quy mô kệ, ngưỡng báo hết hạn, sao lưu và khôi phục dữ liệu. */
@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.html',
})
export class SettingsPage {
  private readonly store = inject(PantryStore);
  private readonly toaster = inject(Toaster);

  protected readonly settings = this.store.settings;

  /** Chỉ nhận số nguyên hợp lệ; nhập sai thì trả ô về giá trị đang dùng. */
  protected update(key: keyof Settings, input: HTMLInputElement): void {
    const value = Math.floor(input.valueAsNumber);
    const min = key === 'warnDays' ? 0 : 1;
    if (!Number.isFinite(value) || value < min) {
      input.value = String(this.settings()[key]);
      return;
    }
    if (value !== this.settings()[key]) this.store.updateSettings({ [key]: value });
  }

  protected exportBackup(): void {
    const blob = new Blob([serializeBackup(this.store.state())], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = backupFileName(this.store.today());
    link.click();
    URL.revokeObjectURL(link.href);
  }

  protected async importBackup(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      this.store.restore(parseBackup(await file.text()));
    } catch {
      this.toaster.show('Tệp không đúng định dạng sao lưu của kệ dự phòng.');
    }
  }

  protected reset(): void {
    if (window.confirm('Xoá toàn bộ tồn kho và các món đã sửa, quay về danh mục mẫu?')) {
      this.store.reset();
    }
  }
}
