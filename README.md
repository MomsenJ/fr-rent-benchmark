# France Apartment Rent Check

## One-line value proposition

A data-driven web app that helps renters and home seekers in France quickly judge whether an apartment rent looks fair by comparing it with local public benchmark data.

## Problem statement

Apartment rents are hard to evaluate in practice. Renters often see a listing price but have little context on whether it is in line with the local market, especially when comparing neighborhoods, arrondissements, or different apartment sizes. This creates uncertainty during home search, relocation, and rent negotiation.

France Apartment Rent Check addresses that gap with a simple benchmark-based experience: users can enter a location, property type, apartment size, and monthly rent, then immediately see how that price compares with a local reference range.

## Key features

- **Instant rent benchmark check**
  Users can quickly see whether a rent looks below benchmark, fair, above benchmark, or very high, without needing to interpret raw data tables.

- **Local market context**
  Results are tied to city- or arrondissement-level benchmark data, which makes the comparison more useful than a single national average.

- **Size-adjusted comparison**
  The app adjusts the benchmark for apartment size so users get a more realistic estimate than a flat price-per-square-meter comparison.

- **Clear price guidance**
  The result combines a typical rent, a fair range, and a broader local benchmark range to make the outcome easier to understand at a glance.

- **Bilingual user experience**
  The interface supports both English and French, making the product easier to use for local residents as well as international renters moving to France.

## Demo / product description

The app follows a single-step flow:

1. Search for a city or arrondissement
2. Select a home type
3. Enter surface area and monthly rent
4. Receive an immediate verdict with benchmark-based price guidance

The current experience is optimized for a fast “Is this rent too high?” decision rather than a long analytical workflow.

## Data sources

This project uses public benchmark rent data published through **data.gouv.fr**, including the *Carte des loyers* datasets from the **Ministère de la Transition écologique**.

- Data is public and location-based
- The current version relies on benchmark reference data, not personal user data
- User-submitted data is not yet part of the product

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS
- Public benchmark data from data.gouv.fr

## Future improvements

- Expand data refresh workflows so benchmark updates can be published more easily over time
- Add optional user-submitted rent observations to enrich local market visibility
- Improve personalization with more housing attributes such as furnishing, condition, or amenities
- Move to a database-backed architecture for scale, analytics, and richer product features

For setup, deployment, and data pipeline details, see [`docs/deployment.md`](docs/deployment.md) and [`docs/data-pipeline.md`](docs/data-pipeline.md).
