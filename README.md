<div id="top"></div>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://dnabehavior.com/">
    <img src="../src/assets/images/logo.svg" alt="Logo" width='80' >
  </a>
  <h3 align="center">DNA Behavior</h3>

  <p align="center">
    <br />
    <a href="https://21551507.fs1.hubspotusercontent-na1.net/hubfs/21551507/Videos/DNA%20Web%20App%20Tour%20V.2.3.mp4" style="color: #FFF;">View Demo</a>
  </p>
</div>

## About The Project

[DNA Behavior](https://app.dnabehavior.com/)

DNA Behavior International offers solutions that leverage behavioral genetics to understand human behavior, communication styles, decision-making processes, and other aspects of individual and team dynamics. They use a combination of DNA analysis, psychometric assessments, and proprietary algorithms to provide personalized reports and tools for various applications, such as financial planning, leadership development, and talent management.

### Built With

- [Angular.JS](https://angular.io/)
- [State Management](https://ngrx.io/)
- [PrimeNG](https://primeng.org/)
- [Chart.JS](https://www.chartjs.org/)
- [JsPDF](https://www.npmjs.com/package/jspdf)
- [Typescript](https://www.typescriptlang.org/)
- Unit Testing
  - [Karma](https://karma-runner.github.io/)

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

1. Git
2. Node: any 18.x version starting with v18.0.0 or greater
3. NPM: See [NPM website for installation instructions](https://www.npmjs.com/)
4. Angular: [Angular environment setup guide](https://angular.io/guide/setup-local)
5. A clone of the [dna-frontend](https://github.com/DNABehavior/AdminSystem) repo on your local machine

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/DNABehavior/AdminSystem.git
   ```
2. Install Dependency packages
   ```sh
   npm install
   ```
3. To start the hot-reloading development server
   ```sh
   ng serve
   ```
4. To open the site in your favorite browser
   ```sh
   open http://localhost:4200
   ```

### Make Changes and Pull Request

1. Clone the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Pretiffy the code for standard indendation (`npm run format`)
4. Make sure no one test case is being failed (`npm run test`)
5. Make sure Build is created successfuly (`npm run build`)
6. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
7. Push to the Branch (`git push origin feature/AmazingFeature`)
8. Open a Pull Request


### Test the change

1. If possible, test any visual changes in all latest versions of common browsers, on both desktop and mobile.
2. Run `npm run test` from the project root to ensure that no one test case is being failed.
3. Run `npm run format` from the project root. (This will run Prettier)
4. Run `ng prod build` from the project root to ensure that build is created successfully.


## API error handling

Every failed request follows the same four hops:

1. `NetworkService.httpCall` applies `timeout(K.NETWORK.URL.TIMEOUT)` so a hung request always fails instead of spinning the loader forever.
2. `ApiErrorInterceptor` normalizes any `HttpErrorResponse` into an `ApiError` and rethrows it, and logs every request outcome in non-prod builds. 401s marked `HANDLE_AUTH_ERROR` pass through untouched - `AuthErrorInterceptor` is the sole owner of logout.
3. Effects wrap their calls in `catchApiError(someFailureAction)` (from `service/api-error.ts`), which normalizes defensively via `ensureApiError` and dispatches the failure action.
4. `ApiErrorNotificationEffects` (same file) watches the whole action stream and toasts any action whose `error` is `ApiError`-shaped, deduped per message.

So to get a toast for a new feature: dispatch a failure action carrying an `ApiError`. There is no list to register in.

See [docs/network-error-flow.md](docs/network-error-flow.md) for the full step-by-step flow and a diagram.

## Backend response contract (read this before touching `statusCode`)

The API used to wrap every response in an envelope carrying its own status:

```jsonc
{ "statusCode": 200, "data": { ... }, "errors": { "message": "..." } }
```

After a .NET upgrade on the backend (Sept 2026) the status moved **out of the body and into a
response header**, so the body is now just:

```jsonc
{ "message": "Success", "data": { ... } }
```

**Why this mattered so much:** roughly 217 places across 33 files branched on
`response.body.statusCode`. With the field gone, every one of them evaluated `undefined == 200` as
false and silently took its failure branch. The login screen was the visible symptom - it sat on
"Fetching Account Information..." forever, because its final `else` fired a Mixpanel event and then
did nothing at all: no flag reset, no dialog, no thrown error. HTTP 200, valid data, clean console,
dead app.

**There is no interceptor shim.** An earlier version of this section described a
`normalizeEnvelopeStatus()` step in `ApiErrorInterceptor` that put `statusCode` back onto the body so
existing call sites kept working unchanged. That function was never landed as a permanent fixture -
it does not exist in `service/api-error.ts` (confirm with
`grep -rn "normalizeEnvelopeStatus\|apiErrorFromEnvelope" src/`). Every remaining `body.statusCode`
read is a **live dead branch today**: `response.body` still exists, `.statusCode` is `undefined`, the
switch matches no case, and the handler silently no-ops - not a stopgap-protected call site. Migrate
it per the section below rather than assuming a shim covers it.

**The wider lesson:** the outage wasn't really the contract change - it was that a branch could be
reached and do nothing. Any handler that owns a loading flag must terminate on *every* path, and
`catchError(() => EMPTY)` in an effect is almost always a bug, because dispatching nothing leaves
whoever was waiting waiting forever.

### Migrating off `body.statusCode` (in progress - login module done)

The real fix is not reading `body.statusCode` in components at all. A report component shouldn't
know or care what transport status carried its data - it should get data, or get an `ApiError`. That
coupling is *why* one backend header change could freeze the whole app: 217 places were all doing
the same unsafe parse independently.

The accounts step of login (`getAllAccountsActionSuccess`, consumed by `login.component.ts`,
`thankyou.component.ts` and `fidelity-login.component.ts`) has been migrated as the first slice, and
is the reference pattern for the rest. Note it's only that one action - the same three files still
read `body.statusCode` directly for their other calls (`checkIdpUser`, `upsertIdpUser`,
`getIdpUser`, subscription, users), which are genuinely-dead branches today (see above), not shim-
protected, and are candidates for the next slice.

1. The **effect** (`login.effects.ts`'s `getAllAccountsByPersonId`) is the only place that reads the
   envelope, classifying on `response.status` - the real HTTP status - never a body field. It
   dispatches a typed action via `getAllAccountsActionSuccess(accounts, noAccountsAvailable, error)`:
   - `accounts` - real data, ordinary 200
   - `noAccountsAvailable` - a real business state (HTTP 204, "wrong app"), not a failure
   - `error` - a genuine transport failure, produced by `catchApiError()` and normalized to
     `ApiError` - the shape `ApiErrorNotificationEffects` already knows how to toast. There is no
     "200 transport, failing envelope" case handled separately: no effect in this codebase gates on
     an envelope-reported failure inside a 200, so there's nothing to classify beyond success/error.
2. **Components never see the raw envelope.** They destructure `{ accounts, noAccountsAvailable,
   error }` and branch on those three fields only - no `body`, no `statusCode`, no `errors.message`.

To migrate another feature the same way: give its effect's success `map` this same shape (dispatch
the resolved action with an `error` field for the failure case, sourced from `catchApiError()`),
update its `createAction`/success-object payload to match, and delete the `body.statusCode` reads
from every component that consumes it - all in the same change, since they share one action shape.
See `docs/SETTINGS_PAGE_STATUSCODE_MIGRATION_PLAN.md` for a worked example of doing this across a
whole module, including where the recipe above doesn't need the three-way split at all.

## Contact

Ryan Scott - Ryan.Scott@dnabehavior.com

App Link: [https://app.dnabehavior.com/](https://app.dnabehavior.com/)

<p align="right">(<a href="#top">back to top</a>)</p>
