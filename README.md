# Arena Hero Web

React + TypeScript + Tailwind CSS client for the Arena Hero server.

```bash
npm install
npm run dev
```

Vite listens on `http://localhost:3000` and proxies HTTP and WebSocket `/api` traffic to `http://localhost:8080`. The real client uses the session cookie, CSRF token, `/api/v1/game/ws` realtime connection, and command endpoint. It reconnects with bounded exponential backoff, restores the authoritative state and current pending plans after disconnects, synchronizes Manual edits across tabs, and displays Agent/Manual plans in the arena. In development only, `/demo` opens a deterministic local arena without a backend.

```bash
npm run test
npm run lint
npm run build
```

## Production build

Every push to `main` runs the **Build frontend** GitHub Actions workflow. It tests, lints, and creates a minified Vite production build with `https://api.arenahero.io` as the HTTP and WebSocket API origin.

Open the completed workflow run, then download `arena-hero-web-<commit SHA>` from its **Artifacts** section. GitHub provides the artifact as a ZIP whose contents can be extracted directly into the existing Nginx site root for `app.arenahero.io`.

Nginx must fall back to `index.html` for React routes such as `/login`, `/arena`, and OAuth callbacks:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

The API origin can be changed without editing source code by setting the repository Actions variable `VITE_API_BASE_URL`. Because Vite substitutes this value at build time, changing it requires a new workflow run or commit.

The interface supports English and Chinese. Add future locales in `src/lib/i18n.ts`; UI code uses translation keys rather than embedded labels.

## License

[Apache License 2.0](LICENSE)
