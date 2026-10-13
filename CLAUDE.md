# CLAUDE.md

## Project

- Household emergency-food shelf tracker (package `ke-du-phong`). Client-only: no backend, no `HttpClient`; all data is in `localStorage`.
- Angular `^22.2`, standalone components + signals, no `zone.js`. TypeScript `~6.0`. Vitest + jsdom via `ng test`.
- Node `^22.22.3 || ^24.15.0 || >=26` (from `@angular/cli` engines; the repo pins none). npm only (`packageManager: npm@11.16.0`).

## Commands

```bash
npm install
npm start                                   # ng serve, http://localhost:4200
npm run build                               # production build -> dist/ke-du-phong/browser
npm test -- --no-watch                      # all unit tests, single run (watch is the default in a TTY)
npm test -- --no-watch --include src/app/core/pantry-logic.spec.ts   # one spec file
npm test -- --no-watch --filter "^PantryStore"                        # by suite/test name (regex)
npx prettier --check src                    # format check
npx prettier --write <file>                 # format one file
```

There is no lint target, no ESLint config, and no e2e setup. Do not invent `npm run lint` or `ng e2e`.

## Architecture map

```text
src/app/
  app.routes.ts            Route table (lazy loadComponent per tab)
  app.config.ts            Providers: router with hash location
  core/                    Data + business logic, no UI
    models.ts                All shared types (readonly interfaces)
    pantry-logic.ts          Pure functions: minimums, stock, expiry, normalize()
    pantry-store.ts          PantryStore: the only state holder and the only mutator
    pantry-storage.ts        localStorage read/write (key `ke-du-phong.v1`)
    pantry-backup.ts         Backup file serialise/parse
    pantry-seed.ts           Sample catalogue
    toaster.ts, format.ts    Toast service; quantity/date/label formatting
  layout/                  header/ (title, progress, tab bar), toast/
  shared/                  lot-dialog/, pipes/ (qty, viDate, dueLabel)
  features/                One folder per tab: shelf/, shopping/, expiring/, settings/
src/styles.css             Colour variables + shared blocks (.btn, .badge, .list, .panel, .group, .meter, dialog, form fields)
```

Dependency direction (currently holds everywhere; keep it):

- `core/` imports nothing from `shared/`, `layout/`, `features/`.
- `shared/` and `layout/` import from `core/`; `layout/` may also import `shared/`.
- `features/*` never import each other. Move anything two tabs need to `shared/` (UI) or `core/` (data, logic).

## Conventions

Naming and files

- No type suffix in file or class names: `shelf-page.ts` -> `ShelfPage`, `header.ts` -> `Header`, `toaster.ts` -> `Toaster`. Pipes are the exception: `qty-pipe.ts` -> `QtyPipe`.
- Routed components are `<name>-page.ts` / `<Name>Page` with selector `app-<name>-page`. All selectors use the `app-` prefix.
- A page sits directly in its feature folder; every other component gets its own sub-folder (`features/shelf/item-card/`). Always `templateUrl`; add `styleUrl` only when a `.css` file exists. Keep decorator keys alphabetical (`host`, `imports`, `selector`, `styleUrl`, `templateUrl`).
- Use relative imports. No path aliases are defined.
- Identifiers in English. Comments, test names, toast messages and all UI text in Vietnamese; match that.

Components

- Do not write `standalone: true`, `changeDetection:`, `CommonModule`, or NgModules. None exist here.
- There is no `zone.js`: anything a template reads must be a signal or `computed`. A plain field changed in a timer or promise will not re-render.
- Use `inject()` in field initialisers, never constructor parameters.
- Injected services are `private readonly`. Members used only by the template are `protected`. Only inputs, outputs and methods a parent calls (e.g. `open()`) are public.
- Use `input.required<T>()`, `output<T>()`, `viewChild.required(...)`. No `@Input`/`@Output`/`@ViewChild`.
- Templates use `@if`, `@for (...; track x.id)`, `@let`. No `*ngIf`/`*ngFor`.
- Put derived view data in one `computed()` on the component (see `view` in `features/shelf/item-card/item-card.ts`), not in template expressions.
- Dialogs are native `<dialog #dialog>` with a public `open(arg)` that resets the form and calls `showModal()`; the parent keeps a template ref and calls it:

```html
<button (click)="lotDialog.open(item)">...</button>
<app-lot-dialog #lotDialog />
```

- Forms are typed reactive forms: `nonNullable: true` for text controls, `FormControl<number | null>` for numbers, read with `form.getRawValue()`.

State and data

- Components never mutate data. Read `PantryStore` signals (`state`, `today`, `settings`, `items`, `categories`, `shoppingList`, `eatFirst`); change data only through its methods.
- Every new mutation is a `PantryStore` method ending in `this.commit('<Vietnamese toast text>', nextState)`. `commit()` is what persists, toasts and enables undo; never call `PantryStorage.save()` or set the state signal from anywhere else.
- State is immutable: models are `readonly` interfaces; build new objects with spread, never push/assign in place.
- Business rules go in `core/pantry-logic.ts` as pure functions (no Angular, no DOM, no input mutation) and take `today` as a parameter.
- Dates are ISO `YYYY-MM-DD` strings. Get "today" from `store.today()`; do not call `new Date()` outside `PantryStore`.
- Wrap quantity arithmetic in `round()` from `pantry-logic.ts` (3 decimals).
- Anything from outside (localStorage, backup file, form draft) must pass through `normalize()` / `normalizeItem()` / `normalizeSettings()` before use.
- `tsconfig.json` sets `noPropertyAccessFromIndexSignature`: write `source['key']` on `Record<string, unknown>`.
- Format in TypeScript with `formatQty` / `formatDate` / `dueLabel` from `core/format.ts`; in templates use the `qty` / `viDate` / `dueLabel` pipes that wrap them.

Styling

- Plain CSS only. Use the variables in `src/styles.css` (`--bg`, `--surface`, `--text`, `--muted`, `--line`, `--accent`, `--ok`, `--low`, `--short`, their `-bg` variants, `--radius`); never hard-code a colour, since each variable has a dark-mode value.
- Reuse the global blocks before adding CSS. Component `.css` is only for that component and is capped by the build budget (warn 4 kB, error 8 kB).
- The `Level` values `ok | low | short` are also the CSS class names; bind them with `[class]="level"`.

Tests

- Specs sit next to the source as `*.spec.ts`. Vitest globals are enabled: do not import `describe`/`it`/`expect`/`vi`.
- Test pure logic without `TestBed` (see `core/pantry-logic.spec.ts`; build fixtures with `normalizeItem`).
- Store and component specs call `localStorage.clear()` in `beforeEach`; time-dependent ones use `vi.useFakeTimers({ now: ... })` and `vi.useRealTimers()` in `afterEach`.

Commits: `feat: <lowercase summary>` (all four commits so far).

## Adding a feature (new tab)

1. Create `src/app/features/<name>/<name>-page.ts` and `.html` (`<Name>Page`, selector `app-<name>-page`).
2. Add a route in `src/app/app.routes.ts` above the `**` entry: Vietnamese slug path, `title: '<Tab> · Kệ dự phòng'`, `loadComponent`.
3. Add the tab to `tabs` in `src/app/layout/header/header.ts`.
4. Update the expected link list in `src/app/app.spec.ts`.
5. New calculation -> pure function in `core/pantry-logic.ts` + case in `pantry-logic.spec.ts`. New derived list -> `computed` on `PantryStore`. New write -> `PantryStore` method via `commit()` + case in `pantry-store.spec.ts`.

## Do not

- Do not edit `legacy-static/` (the pre-Angular version; not part of the build), `dist/`, or `.angular/`.
- Do not switch off hash routing or change `<base href="./">` in `src/index.html`; static sub-folder hosting depends on both.
- Do not rename the storage key `ke-du-phong.v1` or change the shape of `PantryState` without making `normalize()` accept the old shape: existing users' data and backup files are read through it.
- Do not change the item count in `core/pantry-seed.ts` without updating the `23` asserted in `src/app/app.spec.ts` and `src/app/core/pantry-store.spec.ts`.
- Do not add RxJS streams, `HttpClient`, a UI component library, a CSS preprocessor, a state library, or `zone.js` unless asked. None is used in `src/`.

## Verify before finishing

```bash
npm test -- --no-watch
npm run build
npx prettier --check src
```

The build is also the type check and enforces the bundle budgets in `angular.json`.

## References

- @README.md — full structure, per-tab behaviour, configuration, deployment notes

## TODO

- TODO: confirm whether linting should be added; nothing enforces style beyond Prettier.
- TODO: confirm whether `legacy-static/` is still maintained or can be removed.
- TODO: confirm commit types other than `feat:` (history has only that one).
- TODO: confirm intended TypeScript strictness; `tsconfig.json` has no explicit `strict` or `strictTemplates`.
