import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }]
    });
  });

  function runGuard(url: string) {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url } as never)
    );
  }

  it('allows navigation when the user is logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    expect(runGuard('/projects')).toBeTrue();
  });

  it('redirects to /login with a returnUrl when the user is logged out', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    const router = TestBed.inject(Router);
    const result = runGuard('/projects/1/board');

    expect(result).not.toBeTrue();
    const tree = result as ReturnType<Router['createUrlTree']>;
    expect(router.serializeUrl(tree)).toBe('/login?returnUrl=%2Fprojects%2F1%2Fboard');
  });
});
