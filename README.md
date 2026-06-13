# Paragonka CRM - frontend

Frontend Paragonka CRM to aplikacja SPA dla małych firm pracujących na zamówienia z konkretnym terminem realizacji. Udostępnia interfejs do obsługi klientów, produktów, zamówień, kalendarza, paragonów i finansów, komunikując się z backendem FastAPI przez REST API.

## Informacje o projekcie dyplomowym

| Pole | Wartość |
|---|---|
| Autor | Savelii Efremov |
| Uczelnia | Uczelnia VIZJA, Wydział Informatyki |
| Kierunek | Informatyka |
| Nr albumu | 40762 |
| Rok | 2026 |
| Promotor | dr inż. Marcin Kacprowicz |

## Możliwości aplikacji

- Logowanie, rejestracja, resetowanie hasła, wybór organizacji i zarządzanie kontem.
- Listy klientów i produktów z filtrowaniem, formularzami oraz polami dodatkowymi EAV.
- Produkty typu towar, usługa i materiał, wraz ze stanem magazynowym i zdjęciami.
- Zamówienia z pozycjami, statusami, terminami realizacji i widokiem kalendarza.
- Ręczne dodawanie paragonów oraz import plików JPK_KASA.
- Dashboard finansowy z przychodami, wydatkami, PnL i wykresami.
- Galeria zdjęć dla produktów i zamówień, lokalizacja PL/EN/RU oraz strony prawne i zgody RODO.
- PWA: aplikację można zainstalować, a statyczny interfejs jest cache'owany; operacje zapisu są blokowane w trybie offline.

## Technologie

| Obszar | Technologie |
|---|---|
| UI | React 19, TypeScript 7 |
| Narzędzie budowania | Vite 8 |
| Routing | React Router v7 |
| Stan serwera | TanStack Query v5 |
| Stan klienta | Zustand 5 |
| Formularze | React Hook Form, Zod |
| Style i komponenty | Tailwind CSS 4, Radix UI |
| Wykresy i HTTP | Recharts, Axios |
| Lokalizacja | react-i18next, i18next |
| Testy i jakość | Vitest, React Testing Library, Playwright, Biome |

## Struktura kodu

```text
src/
├── app/        # inicjalizacja aplikacji i providerzy
├── layouts/    # layout uwierzytelniony i layout aplikacji
├── shared/     # klient API, store, i18n, hooki, UI i utilsy
└── features/   # auth, orgs, clients, products, orders, receipts, ...
```

Moduły w `src/features/<nazwa>/` są samodzielnymi pionowymi wycinkami funkcjonalnymi. Zwykle zawierają `api.ts`, `types.ts`, hooki, komponenty i `index.ts`. Funkcje API są niezależne od Reacta, logika zapytań i mutacji znajduje się w hookach, a komponenty odpowiadają za prezentację.

### Architektura warstwy SPA

Zarządzanie stanem jest rozdzielone: **TanStack Query** obsługuje stan serwerowy (pobieranie/mutacje, `staleTime` 30 s, `refetchOnWindowFocus`, ponawianie z single-flight), a **Zustand** przechowuje minimalny stan kliencki (sesja użytkownika w `shared/store/auth`). Komunikację z API realizuje `apiClient` (axios) z bazowym `/api/v1`; token odświeżania jest rotowany przez jedno współbieżne wywołanie (`refreshPromise`), co chroni przed wylogowaniem przy równoległych 401. Rzadko zmienne endpointy (`/orgs`, `/settings`, `/eav/attributes`, `/auth/sessions`) otrzymują cache-busting (`?_t`), by sieciowy handler zawsze szedł do backendu. Routing (`react-router-dom`) jest w pełni leniwy (code-splitting per route przez `React.lazy`), z układami `RootLayout`/`AuthLayout`.

### Moduły funkcjonalne

| Moduł | Opis |
|---|---|
| `auth` | Logowanie, rejestracja, reset hasła, wybór organizacji, zarządzanie kontem |
| `orgs` | Wybór i tworzenie organizacji, ustawienia, zaproszenia |
| `clients` | Lista klientów, formularze, edycja, pola EAV i lokalne |
| `products` | Lista produktów, formularze, edycja, stany magazynowe, zdjęcia |
| `orders` | Lista zamówień, formularze, szczegóły, kalendarz, списание materiałów |
| `receipts` | Lista paragonów, formularze, import JPK_KASA |
| `eav` | Zarządzanie atrybutami EAV |
| `finances` | Dashboard finansowy z wykresami (Przychody/Wydatki/PnL) |
| `media` | Przesyłanie i podgląd zdjęć przez S3 (MinIO) |
| `legal` | Strony prawne i baner zgód RODO |

### PWA, tryb offline i optymalizacja

Aplikacja jest **PWA** budowaną przez `vite-plugin-pwa` (Workbox) i działa w trybie **read-only offline**:

- **App shell** (HTML, JS, CSS, lokalizacje `locales/*.json`, manifest, ikony) jest precache-owany - powłoka i nawigacja działają offline (`navigateFallback: '/'`, z denylistą `/api/` i `/admin/`).
- **Odpowiedzi GET `/api/*`** są cache-owane strategią **NetworkFirst** (cache `api-cache`, do 100 wpisów, 1 h) - ostatnio pobrane dane są dostępne offline tylko do odczytu; mutacje (POST/PUT/DELETE) wymagają sieci.
- **Leniwe chunki `assets/*.js|css`** cache-owane strategią **CacheFirst** (cache `lazy-chunks`, 30 dni).
- Wskaźnik stanu sieci (`useOnlineStatus`) informuje użytkownika o trybie offline.

Metody optymalizacji: podział vendorów przez `rollupOptions.manualChunks` (`vendor-react`, `vendor-query`, `vendor-clsx`); sterowanie preloadem modułów (`modulePreload.resolveDependencies`) pomija `vendor-recharts`; leniwe ładowanie tras + prefetchowanie (`prefetchTiered`/`warmLazyCache` w czasie bezczynności); `staleTime` TanStack Query redukuje zbędne zapytania; lokalizacje ładowane leniwie przez `i18next-http-backend`; MSW działa wyłącznie w dev/test.

## Uruchomienie lokalne

Wymagane są Node.js 20+ oraz pnpm 9+.

```bash
cd frontend
cp .env.example .env.development
pnpm install
pnpm dev
```

Aplikacja będzie dostępna pod adresem <http://localhost:5173>. Domyślna konfiguracja ustawia `VITE_API_URL=/api/v1`, dlatego Vite przekazuje żądania `/api` do backendu działającego na <http://localhost:8000>.

Backend można uruchomić w drugim terminalu:

```bash
cd ../backend
uv sync
docker compose -f docker-compose.local.yml up -d db minio
uv run alembic upgrade head
uv run python run_dev.py
```

### Tryby połączenia z API

- **Proxy Vite (domyślny):** `VITE_API_URL=/api/v1`; frontend i API są używane przez proxy deweloperskie.
- **Bezpośrednie API:** `VITE_API_URL=http://localhost:8000/api/v1`; backend musi dopuścić adres frontendu w `CORS_ORIGINS`.
- **MSW:** `VITE_MSW_ENABLED=true`; żądania mogą być obsługiwane przez mock API bez uruchamiania backendu.

## Testy, lintowanie i build

```bash
pnpm test          # testy jednostkowe i komponentów
pnpm test:e2e      # scenariusze Playwright
pnpm lint          # Biome
pnpm build         # sprawdzenie TypeScript i build Vite
pnpm preview       # podgląd zbudowanej aplikacji
```

Wynik produkcyjny znajduje się w `dist/`. W produkcji SPA powinno być serwowane przez nginx lub inny serwer statyczny z przekierowaniem żądań `/api` do backendu i fallbackiem routingu na `index.html`.

- Główna dokumentacja projektu: `paragonka-documentation.md`
