import { Pipe, PipeTransform } from '@angular/core';
import { dueLabel } from '../../core/format';

/** Số ngày còn lại thành câu: "còn 10 ngày", "quá hạn 3 ngày". */
@Pipe({ name: 'dueLabel' })
export class DueLabelPipe implements PipeTransform {
  transform(days: number): string {
    return dueLabel(days);
  }
}
