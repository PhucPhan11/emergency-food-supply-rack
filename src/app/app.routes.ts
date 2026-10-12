import { Routes } from '@angular/router';

// Mỗi mục của trang là một thư mục trong features/, chỉ tải khi người dùng mở mục đó.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ke' },
  {
    path: 'ke',
    title: 'Kệ dự phòng',
    loadComponent: () => import('./features/shelf/shelf-page').then((m) => m.ShelfPage),
  },
  {
    path: 'can-mua',
    title: 'Cần mua · Kệ dự phòng',
    loadComponent: () => import('./features/shopping/shopping-page').then((m) => m.ShoppingPage),
  },
  {
    path: 'an-truoc',
    title: 'Ăn trước · Kệ dự phòng',
    loadComponent: () => import('./features/expiring/expiring-page').then((m) => m.ExpiringPage),
  },
  {
    path: 'cai-dat',
    title: 'Cài đặt · Kệ dự phòng',
    loadComponent: () => import('./features/settings/settings-page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: 'ke' },
];
