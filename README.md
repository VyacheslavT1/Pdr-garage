# PDR Garage

PDR Garage is a multilingual marketing website with a lightweight admin panel for a car detailing studio.  
It is built on **Next.js 15 (App Router)** with **React 19** and **Ant Design 5**.  
The site provides localized public pages (French, English, Russian) and includes an internal admin dashboard for managing incoming repair requests and customer testimonials.

The project is optimized for **Cloudflare Workers** using **OpenNext**, with Supabase integrations for secure server-side file attachments.

---

## Table of Contents

- [Highlights](#-highlights)
- [Tech stack](#-tech-stack)
- [Requirements](#-requirements)
- [Getting started](#-getting-started)
- [Project structure](#-project-structure)
- [Architecture overview](#-architecture-overview)
- [Environment variables](#-environment-variables)
- [Deployment](#-deployment-cloudflare-workers)
- [Testing](#-testing)
- [API overview](#-api-overview)
- [Known limitations](#-known-limitations)
- [License](#-license)

---

## 🚀 Highlights

- **Localized marketing website**  
  App Router uses an `[locale]` segment to prefix all URLs.  
  `next-intl` handles message loading, typed routing, and locale middleware.

- **Shared public layout**  
  Common header/footer, smooth scroll-to-top, metadata, and Ant Design styling.

- **Admin panel**  
  Includes login page, protected routes, requests list, review management, counters, and forms.

- **Estimate intake workflow**  
  Validated forms for contact details, vehicle info, and damage description.  
  Attachments are normalized and stored in Supabase via server-side signed URLs.

- **Testimonials CRUD**  
  Admin can create, update, publish, or hide customer testimonials.

- **Cloudflare-ready**  
  OpenNext configuration and Wrangler setup for predictable Workers deployment.

- **Testing setup**  
  Jest + Testing Library + MSW cover API routes, UI components, helpers, and validation logic.

---

## 🛠️ Tech stack

- **Next.js 15 / React 19**
- **TypeScript**
- **next-intl**
- **Ant Design 5**
- **Supabase server client**
- **OpenNext + Cloudflare Workers**
- **Jest, @testing-library/react, MSW**

---

## 📦 Requirements

- Node.js 18+
- npm 9+
- Supabase URL + **Service Role Key**
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` for admin login

---

## ⚙️ Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server (Turbopack):

   ```bash
   npm run dev
   ```

3. Build for production:

   ```bash
   npm run build
   ```

4. Run tests:

   ```bash
   npm test
   ```

5. Preview Cloudflare-targeted build:
   ```bash
   npm run preview
   ```

---

## 📁 Project structure

```text
pdr-garage/
├── public/                     # Static assets
├── src/
│   ├── app/                    # App Router
│   │   ├── [locale]/           # Localized public pages
│   │   │   ├── aboutUs/
│   │   │   ├── blog/
│   │   │   ├── contacts/
│   │   │   ├── privacy/
│   │   │   └── services/
│   │   ├── admin/              # Admin dashboard
│   │   ├── api/                # REST API endpoints
│   │   ├── shared/             # Providers, root-level UI, global styles
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── i18n/                   # next-intl routing config
│   ├── messages/               # Locale dictionaries
│   ├── modules/                # Feature logic
│   │   ├── auth/
│   │   ├── i18n/
│   │   ├── requests/
│   │   └── reviews/
│   ├── shared/                 # UI primitives, utilities, constants
│   │   ├── api/
│   │   ├── config/
│   │   └── ui/
│   ├── tests/                  # Fixtures and test utils
│   └── widgets/                # Composite UI sections
├── open-next.config.ts
├── wrangler.jsonc
├── next.config.ts
├── jest.config.cjs
└── package.json
```

---

## 🧩 Architecture overview

### App Router

- Public pages under `app/[locale]/*`
- Admin dashboard under `app/admin/*`
- REST API under `app/api/*`

### Modules

Encapsulated validation schemas, DTOs, business logic, server utilities.

### Shared layer

Reusable UI primitives, utilities, constants, and API helpers.

### I18n workflow

- Locale detection middleware
- Typed route helpers (`i18n/routing.ts`)
- Translations loaded via `NextIntlClientProvider`

---

## 🔐 Environment variables

Create `.env`:

```env
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_CDN_URL=

ADMIN_EMAIL=
ADMIN_PASSWORD=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 🔌 Deployment (Cloudflare Workers)

1. Build:

   ```bash
   npm run build
   ```

2. Local Workers preview:

   ```bash
   npm run preview
   ```

3. Deploy:
   ```bash
   npx wrangler deploy
   ```

Ensure all secrets are configured in Cloudflare Dashboard.

---

## 🧪 Testing

- **Jest** with `jsdom`
- **React Testing Library** for UI behavior
- **MSW** to mock API calls
- Shared fixtures in `src/tests`

---

## 📌 API overview

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`

### Requests

- `GET /api/requests`
- `POST /api/requests`
- `PATCH /api/requests?id=`
- `DELETE /api/requests?id=`

### Reviews

- `GET /api/reviews`
- `POST /api/reviews`
- `PATCH /api/reviews?id=`

---

## ⚠️ Known limitations

- Cloudflare Workers do not support native Node APIs (`fs`, `path`, Node streams`).
- Supabase uploads require server-side signed URLs.
- Worker request-size limits may affect large images.
- Admin panel uses a simple single-user auth system (no RBAC).

---

## 📄 License

Private project. All rights reserved.
