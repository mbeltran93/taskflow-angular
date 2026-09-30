import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

describe('LoginComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
  });

  it('does not call the service when the form is invalid', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    fixture.componentInstance.submit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('logs in and navigates to /projects on success', () => {
    const user: User = { id: 1, username: 'mbeltran', name: 'Martina Beltran' };
    authServiceSpy.login.and.returnValue(of(user));

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({ username: 'mbeltran', password: 'demo1234' });
    fixture.componentInstance.submit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({ username: 'mbeltran', password: 'demo1234' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/projects');
  });

  it('shows an error message when the login fails', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Usuario o contrasena incorrectos')));

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({ username: 'mbeltran', password: 'mala' });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe('Usuario o contrasena incorrectos');
  });
});
