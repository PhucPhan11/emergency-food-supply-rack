import { Pipe, PipeTransform } from '@angular/core';
import { formatQty } from '../../core/format';

/** Số lượng theo kiểu Việt Nam: 1,5 thay vì 1.5. */
@Pipe({ name: 'qty' })
export class QtyPipe implements PipeTransform {
  transform(value: number): string {
    return formatQty(value);
  }
}
