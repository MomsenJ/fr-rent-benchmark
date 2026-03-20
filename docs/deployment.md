# Deployment Guide

## Recommended path

For the current version of this app, the simplest deployment flow is:

1. keep the processed CSV files in the repository
2. push the project to GitHub
3. deploy the GitHub repository to Vercel

This works well because the app currently reads data from:

- `data/processed/locations.csv`
- `data/processed/rent_benchmarks.csv`

at runtime on the server.

## Before you deploy

Make sure the repository includes:

- `app/`
- `src/`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `data/processed/locations.csv`
- `data/processed/rent_benchmarks.csv`

Optional:

- `data/raw/` if you want the full raw data history in the repo
- `scripts/` and `sql/` if you want to keep the data pipeline and future database setup together

## 1. Push to GitHub

From the project root:

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

If the project is already connected to GitHub:

```bash
git add .
git commit -m "Update app"
git push
```

## 2. Deploy on Vercel

In Vercel:

1. create a new project
2. import the GitHub repository
3. let Vercel detect the framework as Next.js
4. keep the default install and build settings unless you have a specific reason to change them
5. deploy

For this CSV-based version, you do not need:

- a database
- Supabase
- PostgreSQL
- environment variables

## 3. Verify after deployment

After the deployment finishes, check:

- the homepage loads
- city search works
- a rent check returns a result
- both FR and EN language toggles work
- the result chart renders correctly

Use at least one normal case and one out-of-range case to confirm that the UI behaves correctly in production.

## Updating the deployed app

When you change the app:

```bash
git add .
git commit -m "Describe your change"
git push
```

If the Vercel project is connected to GitHub, a new deployment will be triggered automatically.

When you update the processed data:

1. regenerate or replace the processed CSV files
2. commit the updated files
3. push to GitHub
4. let Vercel redeploy

## Common deployment gotcha

The deployed app reads processed CSVs from disk at runtime. If these files are missing from the repository, the app will build but fail when it tries to load the data.

The two required runtime files are:

- `data/processed/locations.csv`
- `data/processed/rent_benchmarks.csv`

## Later migration to PostgreSQL or Supabase

You do not need a database to deploy the current version.

If you later move to PostgreSQL or Supabase, the main changes will be:

1. provision the database
2. create tables
3. import the processed CSVs
4. replace the CSV-backed repository with a database-backed repository
5. add any required environment variables to your deployment platform

The UI can stay mostly unchanged.

## Official references

- GitHub: [Adding a file to a repository](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository?platform=linux)
- Vercel: [Deploying a Next.js app](https://vercel.com/docs/frameworks/full-stack/nextjs)
