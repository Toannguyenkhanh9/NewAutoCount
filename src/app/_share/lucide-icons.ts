// src/app/shared/lucide-icons.ts
import {
  LucideAngularModule,
  User,
  Calendar,
  Hash,
  Mail,
  DollarSign,
  Search,
} from 'lucide-angular';

// gom icon lại thành 1 object, sau này thêm icon chỉ cần thêm vào đây
export const LUCIDE_ICONS = {
  User,
  Calendar,
  Hash,
  Mail,
  DollarSign,
  Search,
};

// Module dùng chung cho app
import { NgModule } from '@angular/core';

@NgModule({
  imports: [LucideAngularModule.pick(LUCIDE_ICONS)],
  exports: [LucideAngularModule],
})
export class LucideIconsModule {}
