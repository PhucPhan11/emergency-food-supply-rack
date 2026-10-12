import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '../../core/format';

/** Ngày YYYY-MM-DD thành DD/MM/YYYY; null thành chuỗi rỗng. */
@Pipe({ name: 'viDate' })
export class ViDatePipe implements PipeTransform {
  transform(iso: string | null): string {
    return iso === null ? '' : formatDate(iso);
  }
}
