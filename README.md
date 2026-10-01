# TaskFlow (Angular)

[![CI](https://github.com/mbeltran93/taskflow-angular/actions/workflows/ci.yml/badge.svg)](https://github.com/mbeltran93/taskflow-angular/actions/workflows/ci.yml)

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

e2e/                  # tests end-to-end con Playwright (ver seccion mas abajo)
  helpers.ts           # login(), createTask(), dragTaskToColumn(), locators de columnas/tareas
  taskflow.spec.ts      # flujo completo: login -> proyecto -> tablero -> tarea -> drag&drop -> edit -> delete -> logout
playwright.config.ts  # webServer (json-server + ng serve), proyecto Chromium
scripts/run-e2e.js     # copia db.json -> db.e2e.json, corre playwright test, borra la copia
postman_collection.json # coleccion de Postman para el backend mock (sin pasar por Angular)
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

### Tests unitarios

```bash
npm test
```

Corre las pruebas unitarias con Jasmine/Karma (headless Chrome). Cobertura actual: servicios principales (`AuthService`, `ProjectService`, `TaskService`), el guard de autenticacion y los componentes `AppComponent` y `LoginComponent`.

### Tests end-to-end (Playwright)

El suite E2E vive en `e2e/` y usa **Playwright** (no Protractor, deprecado desde Angular 13). Simula a una persona real usando la app en el navegador (Chromium headless):

1. Login con un usuario de la semilla (`mbeltran` / `demo1234`).
2. Ve el listado de proyectos y crea uno nuevo.
3. Entra al tablero Kanban de ese proyecto.
4. Crea una tarea nueva desde el modal.
5. La mueve de "Por hacer" a "En progreso" con **drag & drop real** (eventos de mouse simulados paso a paso, no la Drag and Drop API nativa de HTML5 ni `locator.dragTo()`, porque Angular CDK escucha pointer/mouse events y no dispara con la API nativa).
6. La edita (cambia el titulo) y la borra (acepta el `confirm()` del navegador).
7. Logout, y verifica que `/projects` vuelva a redirigir a `/login`.

Correrlo:

```bash
npm run test:e2e          # headless, un solo comando
npm run test:e2e:headed   # con el navegador visible, util para debug
npm run test:e2e:ui       # UI mode interactivo de Playwright
```

`npm run test:e2e` hace tres cosas (ver `scripts/run-e2e.js`):

1. Copia `db.json` a `db.e2e.json` (archivo de trabajo, en `.gitignore`).
2. Corre `playwright test`, que via `webServer` en `playwright.config.ts` levanta **automaticamente** `json-server --watch db.e2e.json` (puerto 3000) y `ng serve` (puerto 4200), espera a que ambos respondan, corre los tests contra `http://localhost:4200`, y los apaga al terminar.
3. Borra `db.e2e.json`, haya pasado o fallado el test.

Como todo lo que crean/mueven/editan/borran los tests pasa por `db.e2e.json` y no por `db.json`, el repo queda siempre con la semilla original intacta (se verifico corriendo el suite y comparando el hash de `db.json` antes/despues: no cambia). Si el proceso se interrumpe de forma abrupta (Ctrl+C duro, corte de luz) y `db.e2e.json` queda huerfano, es seguro borrarlo a mano: es una copia descartable, nunca la fuente de verdad.

Reportes y evidencia: tras un fallo, Playwright guarda trace/video/screenshot en `test-results/` y un reporte HTML navegable en `playwright-report/` (`npx playwright show-report`); ambas carpetas estan en `.gitignore`.

### Backend mock via Postman

`postman_collection.json` (en la raiz) prueba el backend mock **directamente**, sin pasar por Angular: login simulado (`GET /users?username=...&password=...`) y el CRUD completo de `projects` y `tasks` contra `json-server`.

Para usarla:

1. Levantar el backend: `npm run api` (puerto 3000).
2. Importar `postman_collection.json` en Postman (o correrla por CLI con [newman](https://github.com/postmanlabs/newman): `npx newman run postman_collection.json`).
3. Correr las carpetas en orden: "1. Auth" completa la variable de coleccion `userId`; "2. Projects" y "3. Tasks" encadenan `projectId`/`taskId` entre requests via scripts de test, y cada carpeta termina borrando lo que creo. Correrla de punta a punta no deja proyectos/tareas huerfanos ni modifica la semilla.

Se verifico corriendo la coleccion completa con `newman` contra una copia descartable de `db.json`: 15 requests, 28 assertions, 0 fallos.

## Node / Angular: por que sigue en Angular 19

Se evaluo actualizar a una version mas nueva de Angular (20/21) ahora que hay espacio en disco, pero Angular 20+ exige Node `^20.19.0 || ^22.12.0 || >=24.0.0`, y este entorno tiene **Node 18.20.8** instalado de forma global. Angular 19 es la ultima major compatible con Node 18, asi que el proyecto se queda en 19 — el bloqueo nunca fue espacio en disco, es la version de Node del sistema. Subir Node implicaria tocar la instalacion global de la maquina (fuera del alcance de este repo); si en algun momento se quiere actualizar, lo mas prolijo es instalar Node 20/22 LTS con un version manager (`nvm-windows`, `fnm`, Volta) sin pisar el Node global existente, y recien ahi correr `ng update`.

## Limitaciones conocidas

- La autenticacion es 100% simulada: no hay hashing de contrasenas, JWT real, ni expiracion de sesion; `json-server` no valida ningun header, el interceptor solo demuestra el patron.
- No hay websockets ni colaboracion en tiempo real: los cambios de otro "usuario" no se reflejan hasta recargar.
- El reordenamiento de tareas via drag & drop persiste el `order` de cada tarjeta de la columna afectada con una llamada `PATCH` por tarea; en un backend real conviene un endpoint de reordenamiento en lote.
- Sin manejo avanzado de roles/permisos: cualquier usuario logueado puede editar cualquier proyecto o tarea.
- El suite E2E cubre el flujo principal feliz (happy path) de punta a punta; no cubre validaciones de formulario, mensajes de error del backend caido, ni los otros navegadores (solo corre sobre Chromium).
