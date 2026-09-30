import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should start without a session', () => {
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.currentUser).toBeNull();
  });

  it('logs in and persists the session when credentials match', () => {
    let resolvedUser: { username: string } | undefined;

    service.login({ username: 'mbeltran', password: 'demo1234' }).subscribe((user) => (resolvedUser = user));

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/users` && r.params.get('username') === 'mbeltran'
    );
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, username: 'mbeltran', password: 'demo1234', name: 'Martina Beltran' }]);

    expect(resolvedUser?.username).toBe('mbeltran');
    expect(service.isLoggedIn()).toBeTrue();
    expect(localStorage.getItem('taskflow.auth')).toContain('mbeltran');
  });

  it('fails to log in when there is no matching user', () => {
    let error: Error | undefined;

    service.login({ username: 'mbeltran', password: 'wrong' }).subscribe({
      error: (err) => (error = err)
    });

    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/users`);
    req.flush([]);

    expect(error).toBeDefined();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('clears the session on logout', () => {
    service.login({ username: 'mbeltran', password: 'demo1234' }).subscribe();
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/users`).flush([
      { id: 1, username: 'mbeltran', password: 'demo1234', name: 'Martina Beltran' }
    ]);

    expect(service.isLoggedIn()).toBeTrue();

    service.logout();

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('taskflow.auth')).toBeNull();
  });
});
