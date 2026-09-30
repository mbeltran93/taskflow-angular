import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthSession, LoginCredentials, User, UserRecord } from '../models/user.model';

const STORAGE_KEY = 'taskflow.auth';

/**
 * Login "simulado": valida las credenciales contra la coleccion /users de
 * json-server y genera un token falso que se guarda en localStorage. No hay
 * JWT real ni backend de autenticacion: es un mock pensado para portafolio.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(this.readSession());
  readonly session$ = this.sessionSubject.asObservable();
  readonly currentUser$: Observable<User | null> = this.session$.pipe(map((session) => session?.user ?? null));

  login(credentials: LoginCredentials): Observable<User> {
    const params = {
      username: credentials.username,
      password: credentials.password
    };

    return this.http.get<UserRecord[]>(`${this.apiUrl}/users`, { params }).pipe(
      switchMap((matches) => {
        if (!matches.length) {
          return throwError(() => new Error('Usuario o contrasena incorrectos'));
        }

        const { password, ...user } = matches[0];
        const session: AuthSession = { token: this.buildFakeToken(user.username), user };
        this.persistSession(session);
        return [user];
      })
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.sessionSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.sessionSubject.value?.token;
  }

  getToken(): string | null {
    return this.sessionSubject.value?.token ?? null;
  }

  get currentUser(): User | null {
    return this.sessionSubject.value?.user ?? null;
  }

  private buildFakeToken(username: string): string {
    return btoa(`${username}:${Date.now()}`);
  }

  private persistSession(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private readSession(): AuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }
}
