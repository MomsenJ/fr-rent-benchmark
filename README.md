# France Apartment Rent Check

Single-page Next.js app for checking whether an apartment rent in France looks low, fair, high, or very high against local public benchmark data.

The current version runs entirely from local processed CSV files at runtime. It does not require PostgreSQL, Supabase, authentication, or external APIs.

## What the app does

- Search for a city or arrondissement in France
- Choose a home type:
  - `Studio / 1-2 rooms`
  - `3+ rooms`
- Enter surface area and monthly rent
- Get an instant result based on 2025 public benchmark data:
  - category verdict
  - typical rent
  - local benchmark range
  - fair range
  - estimate confidence

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS
- Local CSV runtime data loaded server-side

## Runtime data source

The app reads these files directly at runtime:

- `data/processed/locations.csv`
- `data/processed/rent_benchmarks.csv`

These files are loaded from the filesystem in [`src/lib/data/csv-loader.ts`](src/lib/data/csv-loader.ts).

Important:

- If you deploy this app in its current form, these two processed CSV files must be committed to the repository.
- The raw CSVs in `data/raw/` are useful for regeneration, but the deployed app itself only needs the processed CSVs.

## Local development

Requirements:

- Node.js 20+ recommended
- npm

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

If the local Next.js dev cache gets into a bad state:

```bash
npm run dev:clean
```

Open:

```text
http://localhost:3000
```

Other useful commands:

```bash
npm run build
npm run start
npm run typecheck
```

## Project structure

```text
app/                     Next.js app router pages and API routes
src/components/          UI components
src/lib/data/            CSV loading layer
src/lib/domain/          Rent calculation logic
src/lib/repositories/    Data access boundary
data/raw/                Original public CSV files
data/processed/          Clean runtime CSV files
scripts/                 Data cleaning and import scripts
sql/                     PostgreSQL table setup
docs/                    Project documentation
```

## Data pipeline

To regenerate the processed CSV files from the raw public datasets, follow:

- [`docs/data-pipeline.md`](docs/data-pipeline.md)

## Upload to GitHub

If this folder is not yet its own standalone Git repository, initialize it first from the project root:

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit"
```

Create a new empty repository on GitHub, then connect this folder to it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

If this project is already connected to a GitHub remote, you can simply commit and push:

```bash
git add .
git commit -m "Update app and docs"
git push
```

Before pushing, make sure these files are included:

- application code
- `data/processed/locations.csv`
- `data/processed/rent_benchmarks.csv`
- documentation

You may choose whether to keep `data/raw/` in the repository:

- keep it if you want full reproducibility of the cleaning pipeline
- omit it if you only want the deployed app and processed outputs

## Deployment

The simplest deployment path for the current app is Vercel because it supports Next.js directly and works well with the current file-based runtime setup.

Step 1: push the repository to GitHub.

Step 2: in Vercel, create a new project and import the GitHub repository.

Step 3: let Vercel detect the framework as Next.js.

Step 4: deploy with the default settings.

For the current CSV-based version:

- no database is required
- no runtime secrets are required
- no environment variables are required

Important deployment note:

- `data/processed/locations.csv`
- `data/processed/rent_benchmarks.csv`

must exist in the deployed repository, because the server reads them from disk at runtime.

Detailed deployment steps:

- [`docs/deployment.md`](docs/deployment.md)

## Future data source swap

The app is already structured so the UI does not depend directly on CSV parsing.

Current flow:

- CSV loader in `src/lib/data/`
- repository boundary in `src/lib/repositories/`
- calculation logic in `src/lib/domain/`

To switch later to PostgreSQL or Supabase:

1. keep the UI and API routes
2. add a new repository implementation backed by the database
3. switch the exported repository in [`src/lib/repositories/index.ts`](src/lib/repositories/index.ts)

## Source

Public benchmark source used in the app:

- data.gouv.fr – "Carte des loyers" (Ministère de la Transition écologique)
