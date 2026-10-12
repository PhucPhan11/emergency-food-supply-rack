import { Injectable, signal } from '@angular/core';

const TOAST_MS = 6000;

export interface ToastMessage {
  readonly text: string;
  readonly canUndo: boolean;
}

/** Thông báo ngắn ở cuối màn hình; mỗi lúc chỉ hiện một thông báo. */
@Injectable({ providedIn: 'root' })
export class Toaster {
  private readonly message = signal<ToastMessage | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly current = this.message.asReadonly();

  show(text: string, canUndo = false): void {
    clearTimeout(this.timer);
    this.message.set({ text, canUndo });
    this.timer = setTimeout(() => this.message.set(null), TOAST_MS);
  }
}
