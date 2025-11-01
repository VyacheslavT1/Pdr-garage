This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Structure

```text
pdr-garage/
├── public/                   # Static assets (images, icons, favicons) served by the Next.js app
├── src/
│   ├── app/                  # App Router: routes, layouts, API handlers, and page-level styling
│   │   ├── [locale]/         # Localized marketing pages (home, services, blog, contacts, etc.)
│   │   ├── admin/            # Admin dashboard pages, layouts, and styling modules
│   │   ├── api/              # Server-side route handlers (auth, requests, reviews, public endpoints)
│   │   ├── shared/           # App-level helpers (metadata builders, type definitions)
│   │   ├── globals.css       # Global stylesheet for the App Router
│   │   ├── layout.tsx        # Root layout that wires providers, fonts, and shared UI
│   │   └── head.tsx          # Default <head> definition for the application
│   │
│   ├── modules/              # Feature slices grouped by domain with model/lib/feature structure
│   │   ├── auth/             # Authentication helpers, cookie utilities, and shared types
│   │   ├── i18n/             # Language switcher feature module
│   │   ├── requests/         # Estimate request forms, validation, storage/attachment helpers
│   │   └── reviews/          # Review management forms, mapping helpers, and validation logic
│   │
│   ├── shared/               # Cross-cutting resources reused across features and widgets
│   │   ├── Icons/            # SVG icon components
│   │   ├── api/              # Next.js middleware helpers and Supabase server client
│   │   ├── config/           # Static configuration data (site info, services, articles, etc.)
│   │   └── ui/               # Base UI primitives (buttons, cards, dropdowns, navigation blocks)
│   │
│   ├── widgets/              # Page sections composed from shared and module building blocks
│   │   ├── header/           # Global site header with navigation and language selector
│   │   ├── hero-section/     # Landing page hero with parallax background
│   │   ├── footer/           # Footer with contact info and social widgets
│   │   └── ...               # Additional marketing widgets (blog overview, services, contact form)
│   │
│   ├── i18n/                 # Runtime internationalization utilities for next-intl integration
│   ├── messages/             # Translation catalogs (en/fr/ru JSON bundles)
│   └── middleware.ts         # Edge middleware for locale negotiation and security headers
│
├── next.config.ts            # Next.js configuration (images, redirects, experimental flags)
├── tsconfig.json             # TypeScript project configuration
├── eslint.config.mjs         # ESLint setup for linting during CI/local dev
├── package.json              # Dependencies, scripts, and project metadata
└── README.md                 # Project documentation (this file)
```

### Key concepts

- **Feature slices** live in `src/modules`, encapsulating domain logic (`model`), reusable helpers (`lib`), and UI entry points (`feature/ui`). This keeps business rules close to the features that use them.
- **Widgets** under `src/widgets` compose shared primitives and feature components into rich page sections that can be reused across multiple routes.
- **Shared layer** (`src/shared`) centralizes API clients, configuration data, icons, and low-level UI to avoid duplication throughout the feature modules.
- **App Router** structure in `src/app` separates locale-driven marketing pages from admin dashboards and server APIs while keeping shared layouts and styling co-located.
- **Internationalization** is handled via `src/i18n` utilities, `src/messages` catalogs, and middleware hooks so the same components render consistently across languages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
