# TaskFlow (Angular)

Tablero de tareas estilo Trello/Jira reducido, construido como proyecto de portafolio en **Angular 19** con TypeScript. Es el frontend de la serie "TaskFlow": el mismo dominio (usuarios, proyectos y tareas en columnas TODO / IN_PROGRESS / DONE) implementado en distintas tecnologias. Este repo es autocontenible: incluye su propio backend mock con `json-server`.

## Que hace

- **Login** contra un backend mock (json-server), con sesion simulada guardada en `localStorage`.
- **Listado de proyectos**: crear, editar y eliminar proyectos.
- **Tablero Kanban** por proyecto con tres columnas (Por hacer / En progreso / Hecho).
- **Tareas**: crear, editar, eliminar y mover entre columnas con **drag & drop** (Angular CDK).
- **Rutas protegidas**: `/projects` y `/projects/:id/board` requieren estar logueado (`AuthGuard`); si no hay sesion, redirige a `/login` con `returnUrl`.

## Arquitectura

Angular 19 con **standalone components** (sin NgModules) y carga perezosa (`loadComponent`) por ruta.

```
src/app/
  core/
    models/        # interfaces de dominio: User, Project, Task (+ TaskStatus)
    services/       # AuthService, ProjectService, TaskService (HttpClient + RxJS)
    guards/         # authGuard (CanActivateFn)
    interceptors/   # authInterceptor (agrega el token simulado a cada request)
  features/
    auth/login/            # formulario de login (Reactive Forms)
    projects/project-list/ # listado + CRUD de proyectos
    board/
      board/         # tablero Kanban con Angular CDK Drag & Drop
      task-card/     # tarjeta de tarea (presentacional)
      task-dialog/   # modal de creacion/edicion de tarea
  app.routes.ts       # definicion de rutas y lazy loading
  app.config.ts       # providers: router, HttpClient + interceptor
```

Puntos idiomaticos de Angular usados a proposito:

- **Servicios inyectables** (`providedIn: 'root'`) como unica capa de acceso a datos; los componentes no llaman a `HttpClient` directamente.
- **RxJS** para los streams de datos: `AuthService` expone `currentUser$` (un `BehaviorSubject` derivado de lo guardado en `localStorage`) del que el `AppComponent` se suscribe con el `async` pipe.
- **Guards e interceptors funcionales** (`CanActivateFn`, `HttpInterceptorFn`), el estilo recomendado desde Angular 15+.
- **Angular CDK Drag & Drop** (`cdkDropListGroup`, `cdkDropList`, `cdkDrag`) para mover tarjetas entre columnas; al soltar, se persiste el nuevo `status`/`order` de cada tarea afectada contra el mock.
- **Signals** (`signal`, `computed` donde aplica) para el estado local de los componentes (loading, formularios abiertos, tarea en edicion, etc.), combinados con RxJS para los datos que vienen de la red.
- Modelos de dominio (`User`, `Project`, `Task`, `TaskStatus`) tipados en `core/models`, compartidos por toda la app.

### Estilos

SCSS plano con variables CSS (`:root`) para colores, radios y sombras, sin depender de Angular Material, para mantener el bundle liviano y el control total del diseño. `angular.json` ya esta configurado con `inlineStyleLanguage: scss`.

## Backend mock

No depende de ningun otro repo del portafolio: usa [`json-server`](https://github.com/typicode/json-server) sobre una semilla `db.json` con tres colecciones (`users`, `projects`, `tasks`).

- El **login** hace `GET /users?username=...&password=...`; si hay coincidencia, se genera un token falso (`btoa`) y se guarda junto con el usuario en `localStorage` bajo la clave `taskflow.auth`.
- El `authInterceptor` agrega `Authorization: Bearer <token>` a cada request saliente (json-server lo ignora, pero replica el flujo real).
- Las tareas se filtran por proyecto y se ordenan por su campo `order` (`GET /tasks?projectId=1&_sort=order`).

Usuarios de prueba (ver `db.json`):

| usuario    | contrasena |
|------------|------------|
| `mbeltran` | `demo1234` |
| `ana`      | `demo1234` |

## Como correrlo

Requisitos: Node.js 18.19+ o 20.11+ (Angular 19), npm.

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el backend mock (puerto 3000)
npm run api

# 3. En otra terminal, levantar Angular (puerto 4200)
npm start
```

o con un solo comando (usa `concurrently`):

```bash
npm run dev
```

Luego abrir `http://localhost:4200`.

### Build de produccion

```bash
npm run build
```

Genera los artefactos optimizados en `dist/taskflow-angular`.

### Tests

```bash
npm test
```

Corre las pruebas unitarias con Jasmine/Karma (headless Chrome). Cobertura actual: servicios principales (`AuthService`, `ProjectService`, `TaskService`), el guard de autenticacion y los componentes `AppComponent` y `LoginComponent`.

## Limitaciones conocidas

- La autenticacion es 100% simulada: no hay hashing de contrasenas, JWT real, ni expiracion de sesion; `json-server` no valida ningun header, el interceptor solo demuestra el patron.
- No hay websockets ni colaboracion en tiempo real: los cambios de otro "usuario" no se reflejan hasta recargar.
- El reordenamiento de tareas via drag & drop persiste el `order` de cada tarjeta de la columna afectada con una llamada `PATCH` por tarea; en un backend real conviene un endpoint de reordenamiento en lote.
- No incluye tests end-to-end (Cypress/Playwright), solo unitarios.
- Sin manejo avanzado de roles/permisos: cualquier usuario logueado puede editar cualquier proyecto o tarea.
