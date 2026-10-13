# Emergency Food Supply Rack

Emergency Food Supply Rack is a web app that helps a household keep a rotating emergency food shelf: everything on the shelf is food the family already eats day to day, but each item has a minimum level. Take something out to eat, then buy a replacement.

It is a client-only Angular app. All data lives in the browser's `localStorage`; there is no backend. The user interface is in Vietnamese.

## Tech stack

| Area | What is used | Source |
| --- | --- | --- |
| Framework | Angular `^22.2.0` (standalone components, signals, no `zone.js` dependency) | `package.json` |
| Build / dev server | `@angular/build` `^22.2.2` (`application`, `dev-server`, `unit-test` builders), Angular CLI `^22.2.2` | `angular.json` |
| Language | TypeScript `~6.0.2`, target `ES2022` | `package.json`, `tsconfig.json` |
| Forms | `@angular/forms` reactive forms (used in the two dialogs) | `src/app/shared/lot-dialog`, `src/app/features/shelf/item-dialog` |
| Routing | `@angular/router` with hash location | `src/app/app.config.ts` |
| State | Angular signals in a single injectable store | `src/app/core/pantry-store.ts` |
| Persistence | Browser `localStorage` | `src/app/core/pantry-storage.ts` |
| Styling | Plain CSS with custom properties, light and dark via `prefers-color-scheme`; no component library | `src/styles.css` |
| Unit tests | Vitest `^5.0.0` with `jsdom` `^30.0.0`, run through `ng test` | `package.json`, `angular.json` |
| Formatting | Prettier `^3.8.1` | `.prettierrc` |
| Package manager | npm (`packageManager: npm@11.16.0`) | `package.json` |

## Prerequisites

- **Node.js** `^22.22.3`, `^24.15.0` or `>=26.0.0`. This range is what the installed `@angular/cli` 22.2.2 declares in its `engines` field; the repository itself has no `.nvmrc` and no `engines` field.
- **npm**. `package.json` pins `npm@11.16.0` in `packageManager`.

No database, backend service or environment file is needed.

## Getting started

```bash
git clone https://github.com/PhucPhan11/emergency-food-supply-rack.git
cd emergency-food-supply-rack
npm install
npm start
```

The dev server runs at `http://localhost:4200` and reloads when source files change. There is nothing to configure: on first load the app seeds itself with a sample catalogue from `src/app/core/pantry-seed.ts`.

## Available scripts

| Script | Runs | Purpose |
| --- | --- | --- |
| `npm start` | `ng serve` | Dev server with the `development` build configuration (no optimisation, source maps on) |
| `npm run build` | `ng build` | Production build (the default configuration) into `dist/ke-du-phong/browser` |
| `npm run watch` | `ng build --watch --configuration development` | Rebuilds the development bundle on every change, without serving it |
| `npm test` | `ng test` | Unit tests with Vitest |
| `npm run ng -- <args>` | `ng` | Pass-through to the Angular CLI |

## Using the app

| Tab | Route | What it does |
| --- | --- | --- |
| **Shelf** | `#/ke` | Stock of each item against its minimum level, grouped by category. The minus button takes one step out, deducted from the lot closest to expiry. The add-stock button adds a new lot with an expiry date. Click an item's name to edit it; the add-item button at the bottom of the page creates a new item. |
| **To buy** | `#/can-mua` | Items below their minimum and how much to buy, with a button that copies the list to the clipboard. The "bought" button on each row records the purchase as a new lot. |
| **Eat first** | `#/an-truoc` | Lots that are expired or about to expire, soonest first. |
| **Settings** | `#/cai-dat` | Number of people, number of days, expiry warning threshold, backup to file, restore from file, reset to the sample catalogue. |

The tab and button names above are English translations; the app itself shows them in Vietnamese.

An item's minimum level = daily rate per person × people × days, rounded up to the item's step. The defaults are 4 people, 14 days and a 30-day expiry warning. The rates in `src/app/core/pantry-seed.ts` are estimates for an adult eating normally, so adjust them to your household. An item can also carry a fixed minimum that overrides the calculation.

Data is stored in the browser's `localStorage` on that one device and is not synced anywhere. Use the backup-to-file button in Settings to move to another device or guard against data loss.

## Project structure

```text
src/
  main.ts                 Bootstraps the App component with appConfig
  index.html              Host page: <html lang="vi">, <base href="./">
  styles.css              Colour variables and shared UI blocks (.btn, .badge, .list, dialog...)
  app/
    app.ts, app.html      Page shell: header + the open tab's content + toast
    app.routes.ts         Route table; each tab is loaded on demand
    app.config.ts         Application providers (router)

    core/                 Data and business logic, no UI
      models.ts             Types: Item, Lot, Settings, PantryState...
      pantry-logic.ts       Pure functions: minimum level, stock, expiry, data normalisation
      pantry-seed.ts        Sample catalogue and daily rates
      pantry-store.ts       Single source of truth (signals) and every mutation
      pantry-storage.ts     Reads and writes localStorage
      pantry-backup.ts      Serialises and parses backup files
      toaster.ts            Short message at the bottom of the screen
      format.ts             Formatting for quantities, dates and expiry labels

    layout/               Always-visible page chrome
      header/               Title, overall progress, tab bar
      toast/                Renders the current message and the undo button

    shared/               UI used by more than one tab
      lot-dialog/           Dialog for entering one lot (used by Shelf and To buy)
      pipes/                qty, viDate, dueLabel

    features/             One folder per tab
      shelf/                Shelf tab: shelf-page, item-card, item-dialog
      shopping/             To buy tab
      expiring/             Eat first tab
      settings/             Settings tab

public/                   Static assets copied as-is into the build (favicon.ico)
legacy-static/            The earlier plain HTML/JS version of the app; not part of the Angular build
```

`legacy-static/` has its own `README.md`. It is opened directly from `legacy-static/index.html` and its tests are run with `node --test` from inside that folder.

## Architecture overview

**Bootstrapping.** `src/main.ts` calls `bootstrapApplication(App, appConfig)`. There are no NgModules. `src/app/app.config.ts` registers two providers: `provideBrowserGlobalErrorListeners()` and `provideRouter(...)`.

**Routing.** The router uses `withHashLocation()` so URLs look like `#/ke` and the build can sit on any static host without rewrite rules. It also uses `withInMemoryScrolling({ scrollPositionRestoration: 'top' })`. Every tab in `src/app/app.routes.ts` is lazy-loaded with `loadComponent`; the empty path and any unknown path redirect to `ke`. There are no guards and no resolvers.

| Path | Component | File |
| --- | --- | --- |
| `ke` | `ShelfPage` | `src/app/features/shelf/shelf-page.ts` |
| `can-mua` | `ShoppingPage` | `src/app/features/shopping/shopping-page.ts` |
| `an-truoc` | `ExpiringPage` | `src/app/features/expiring/expiring-page.ts` |
| `cai-dat` | `SettingsPage` | `src/app/features/settings/settings-page.ts` |

**State and data flow.** `PantryStore` (`providedIn: 'root'`) holds the whole `PantryState` in one private signal.

- Components read through its read-only signals and computed values: `state`, `today`, `settings`, `items`, `categories`, `shoppingList`, `eatFirst`.
- Components change data only through its methods: `addLot`, `takeOut`, `removeLot`, `saveItem`, `deleteItem`, `updateSettings`, `reset`, `restore`, `undo`.
- Every mutation goes through one private `commit()`, which remembers the previous state, writes the new one to `localStorage` via `PantryStorage`, and shows a toast via `Toaster`. That is what gives the app a one-step undo.
- The business rules are pure functions in `pantry-logic.ts` with no Angular or DOM dependency. Anything read from outside (`localStorage`, a backup file, form input) is passed through `normalize()` there before it is used.
- `App` listens for `window:focus` and calls `store.refreshToday()`, so expiry calculations stay correct when the page is left open past midnight.

**HTTP, interceptors, auth.** None. The app does not use `HttpClient` and has no authentication.

### Dependency rules

- `core/` imports nothing from `shared/`, `layout/` or `features/`.
- `shared/` and `layout/` import only from `core/` (and `layout/` may use `shared/`).
- Folders inside `features/` do not import each other. Anything two tabs both need moves up to `shared/` (UI) or `core/` (data, business logic).
- Components never mutate data themselves: they read through `PantryStore` signals and change through its methods, so every change is saved and can be undone.
- Business calculations go in `pantry-logic.ts` as pure functions so they can be tested without a browser.

### Common tasks

| To do this | Change this |
| --- | --- |
| Change the sample catalogue or the daily rates | `src/app/core/pantry-seed.ts` |
| Change how the minimum is calculated, the take-out order, or the warning thresholds | `src/app/core/pantry-logic.ts`, with tests in `src/app/core/pantry-logic.spec.ts` |
| Add an operation on the data | Add a method to `src/app/core/pantry-store.ts` |
| Add a new tab | Create a folder in `src/app/features/`, add a line to `src/app/app.routes.ts` and a line to `tabs` in `src/app/layout/header/header.ts` |
| Change colours, button styles, dialog styles | `src/styles.css` |
| Change the look of a single component | The `.html` and `.css` files next to that component |

## Configuration & environments

There are no environment files (`src/environments/` does not exist), no proxy config and no build-time variables. `angular.json` defines two build configurations:

| Configuration | Used by | Settings |
| --- | --- | --- |
| `production` | `npm run build` (default) | `outputHashing: all`; budgets: initial bundle warns at 500 kB and errors at 1 MB, any component style warns at 4 kB and errors at 8 kB |
| `development` | `npm start`, `npm run watch` | `optimization: false`, `sourceMap: true`, `extractLicenses: false` |

The only runtime configuration is user data, kept in `localStorage` under the key `ke-du-phong.v1`:

| Setting | Purpose | Default |
| --- | --- | --- |
| `people` | Number of people the shelf must feed | 4 |
| `days` | Number of days the shelf must cover | 14 |
| `warnDays` | How many days ahead a lot is flagged as expiring | 30 |

## Testing

```bash
npm test
```

This runs the `@angular/build:unit-test` builder, whose runner is Vitest; with no browsers configured, tests run in Node.js using `jsdom`. Watch mode is on by default in an interactive terminal. For a single run:

```bash
npm test -- --no-watch
```

Specs live next to the code they test as `*.spec.ts` and use Vitest globals (`describe`, `it`, `expect`, `vi`), enabled in `tsconfig.spec.json`.

| Spec | Covers |
| --- | --- |
| `src/app/core/pantry-logic.spec.ts` | The pure business rules |
| `src/app/core/pantry-store.spec.ts` | The store: mutations, undo, persistence, backup and restore |
| `src/app/app.spec.ts` | The page shell: title, progress line, the four tab links |

There are no end-to-end tests and no e2e tooling in the repository.

## Code style & conventions

Formatting is defined by `.prettierrc` (100-character lines, single quotes, the `angular` parser for HTML) and `.editorconfig` (UTF-8, 2-space indentation, final newline). There is no npm script for formatting; run Prettier directly:

```bash
npx prettier --check src
npx prettier --write src
```

There is no ESLint configuration and no `lint` target in `angular.json`.

Conventions observed in the code:

- **File and class names** drop the type suffix: `shelf-page.ts` exports `ShelfPage`, `header.ts` exports `Header`. Pipes are the exception: `qty-pipe.ts` exports `QtyPipe`.
- **One folder per component** when it has a template or styles of its own, with `.ts`, `.html` and optional `.css` side by side. Component selectors use the `app-` prefix.
- **Dependency injection** uses `inject()` in field initialisers, not constructor parameters.
- **Visibility**: injected services are `private readonly`; members used only by the template are `protected`; inputs and outputs are `readonly`.
- **Signals throughout**: `signal`, `computed`, `input.required`, `output`, `viewChild.required`.
- **Templates** use built-in control flow (`@if`, `@for`, `@let`). Dialogs are native `<dialog>` elements opened through a public `open()` method on the dialog component.
- **Imports** are relative; no path aliases are defined in `tsconfig.json`.
- **Language**: code identifiers are English; comments, test names and UI text are Vietnamese.
- **Commits** so far all use a `feat: <summary>` prefix.

## Build & deployment

```bash
npm run build
```

Output goes to `dist/ke-du-phong/browser` (`dist/` is git-ignored). The result is a static site with no server-side rendering. Because the app uses hash URLs and `<base href="./">`, it can be served from any static host, including from a sub-folder, without rewrite rules.

The repository contains no Dockerfile, no CI pipeline and no web server configuration.

## Troubleshooting / TODOs

- **A toast says the browser would not save.** The browser refused the `localStorage` write (private mode, or storage full). The change is kept in memory only; use the backup-to-file button in Settings.
- **Stale or broken data during development.** Clear the `ke-du-phong.v1` key in the browser's `localStorage`, or use the reset-to-sample-catalogue button in Settings.

> TODO: confirm the hosting target and how the build is deployed. Nothing in the repository says where `dist/ke-du-phong/browser` is published.

> TODO: confirm the Node.js version the team standardises on. The repository does not pin one; the range above comes from the installed `@angular/cli`.

> TODO: confirm whether linting is intentionally absent or still to be set up.

> TODO: confirm whether the `ng test` debug configuration in `.vscode/launch.json` still works. It opens `http://localhost:9876/debug.html`, and nothing in the repository starts a test runner on that port.

> TODO: confirm whether `legacy-static/` is kept only for reference or is still maintained alongside the Angular app.
