export interface User {
  id: number;
  username: string;
  name: string;
}

/** Registro crudo tal cual vive en db.json (incluye password, nunca se persiste en localStorage). */
export interface UserRecord extends User {
  password: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: User;
}
