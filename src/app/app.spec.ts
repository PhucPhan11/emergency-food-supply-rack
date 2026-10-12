import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('hiện tên ứng dụng và tiến độ của kệ mẫu', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toBe('Kệ dự phòng');
    expect(page.querySelector('.overall p')?.textContent).toBe(
      '0 trên 23 món đang đủ mức tối thiểu',
    );
  });

  it('có đủ bốn mục trên thanh chuyển mục', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('nav a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/ke',
      '/can-mua',
      '/an-truoc',
      '/cai-dat',
    ]);
  });
});
