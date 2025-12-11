import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Đường dẫn import ConfigNewDbComponent giữ đúng như bạn đang dùng
import { ConfigNewDbComponent } from '../../../_share/partials/share-form/config-new-db.component';

@Component({
  selector: 'app-create-account-book-page',
  standalone: true,
  imports: [CommonModule, ConfigNewDbComponent],
  templateUrl: './create-account-book-page.component.html',
  styleUrls: ['./create-account-book-page.component.scss'],
})
export class CreateAccountBookPageComponent {
  private router = inject(Router);

  backToList() {
    this.router.navigate(['/book/manage-account-book']);
  }
}
