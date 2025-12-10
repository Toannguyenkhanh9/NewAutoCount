// src/app/layout/breadcrumb/breadcrumb.component.ts
import { Component } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {
  // 👇 chính là mảng dùng trong HTML
  items: BreadcrumbItem[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.items = this.buildBreadcrumb(this.route.root);
      });
  }

  private buildBreadcrumb(
    route: ActivatedRoute,
    url: string = '',
    items: BreadcrumbItem[] = []
  ): BreadcrumbItem[] {
    const routeConfig = route.routeConfig;

    if (routeConfig) {
      const segment = routeConfig.path ?? '';
      const data = route.snapshot.data;

      // ưu tiên data.breadcrumb, nếu không có thì lấy data.title
      const label: string | undefined = data['breadcrumb'] || data['title'];

      if (segment && label) {
        url += `/${segment}`;
        items.push({ label, url });
      }
    }

    const child = route.firstChild;
    if (child) {
      return this.buildBreadcrumb(child, url, items);
    }

    return items;
  }
}
