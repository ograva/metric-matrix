<!-- .github/copilot-instructions.md - guidance for AI coding agents in this repo -->

# Quick orientation

This is an Angular (v19) single-page application scaffolded with the Angular CLI. It uses the newer standalone-component bootstrap flow (see `src/main.ts`) and a strict TypeScript config (`tsconfig.json`). The app's entry and wiring points you will want to read first are:

- `src/main.ts` — uses `bootstrapApplication(AppComponent, appConfig)` (standalone bootstrap).
- `src/app/app.config.ts` — application-level providers: `provideZoneChangeDetection` and `provideRouter(routes)`.
- `src/app/app.routes.ts` — routing configuration (currently empty array).
- `src/app/app.component.ts` — root component is declared as a standalone-style component (note `imports: [RouterOutlet]`).
- `angular.json` — build/serve/test configurations and `public/` static assets mapping.
- `package.json` — npm scripts: `start` (ng serve), `build` (ng build), `test` (ng test).

## What matters for code changes

- Standalone components: this repo uses the standalone bootstrap pattern. Add imports at the component level (e.g., RouterOutlet, CommonModule) instead of relying on NgModules. See `src/app/app.component.ts` for the pattern.
- App-level providers live in `src/app/app.config.ts`. Changes to routing or global providers should be reflected here.
- Static assets live in `public/` and are declared in `angular.json` (used for both build and test).

## Build / dev / test workflows (exact commands)

- Start dev server: `npm start` (runs `ng serve`, opens at http://localhost:4200 by default).
- Production build: `npm run build` (runs `ng build`, output to `dist/metric-matrix`).
- Run unit tests: `npm test` (Karma + Jasmine as configured in `package.json` / `angular.json`).

Notes: the project relies on the Angular CLI dev dependencies. Local contributors typically run the CLI via the npm scripts above.

## Project-specific conventions and gotchas

- Styles use SCSS by default (schematics in `angular.json` set `style: scss`). When generating components, keep SCSS consistent.
- The app uses `provideZoneChangeDetection({ eventCoalescing: true })` in `app.config.ts` — be conservative when changing global change detection behavior.
- Routing is provided with `provideRouter(routes)` — routes are declared in `src/app/app.routes.ts`. Keep lazy-loading and route-level providers consistent with the standalone-component approach.
- TypeScript is strict: `tsconfig.json` has `strict`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictTemplates`, etc. Keep types explicit and prefer small, typed functions.

## Examples to follow (do these when making edits)

- To add a new route and lazy-load a standalone component:
  - add a file `src/app/feature/feature.component.ts` exporting a standalone component
  - update `src/app/app.routes.ts` with a lazy route: `export const routes: Routes = [{ path: 'feature', loadComponent: () => import('./feature/feature.component').then(m => m.FeatureComponent) }];`
  - keep `app.config.ts` unchanged except to ensure `provideRouter(routes)` uses the updated routes.

- To create a component that uses router features, add imports in the `@Component` decorator (e.g., `imports: [RouterLink, RouterOutlet]`) rather than adding them to a module.

## Files to inspect when debugging

- `angular.json` — confirms where assets, index, styles, and tsconfig paths are resolved.
- `src/main.ts` + `src/app/app.config.ts` — startup providers; if the app fails to bootstrap, start here.
- `src/app/app.component.ts` — root template and router outlet wiring.
- `tsconfig.json` and `tsconfig.app.json` — TypeScript and Angular template strictness settings that commonly cause compilation failures.

## External integrations / dependencies

- No external runtime APIs or server-side integrations are present in the repo. The app relies on core Angular packages and runs entirely in the browser.
- Tests are configured to use Chrome via `karma-chrome-launcher`. CI or headless runs may need `CHROME_BIN` or a headless Chrome setup.

## Minimal checklist for PRs that change behavior

1. Run `npm start` and confirm no console bootstrap errors in the browser.
2. Run `npm test` locally (Karma); if tests fail with a missing browser in CI, document environment requirements.
3. Update `app.routes.ts` and `app.config.ts` when changing routing or app-level providers.
4. Keep SCSS style files and component-level `imports` consistent with existing components.

---

If anything above is unclear or you want more examples (for example, a sample lazy-loaded component + test), tell me which area to expand and I will iterate.
