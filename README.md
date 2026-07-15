# Arena Hero Web

React + TypeScript + Tailwind CSS client for the Arena Hero server.

```bash
npm install
npm run dev
```

Vite listens on `http://localhost:3000` and proxies `/api` to `http://localhost:8080`. The real client uses the session cookie, CSRF token, SSE game stream, and command endpoint. In development only, `/demo` opens a deterministic local arena without a backend.

```bash
npm run test
npm run lint
npm run build
```

The interface supports English and Chinese. Add future locales in `src/lib/i18n.ts`; UI code uses translation keys rather than embedded labels.
