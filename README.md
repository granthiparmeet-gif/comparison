# Domain Keyword Analyzer

Static web app served locally via Express that compares your domain list against the logged sales data in `unreported_sales.csv`.

## Running locally

1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Point your browser to `http://localhost:3000` (or set `PORT` before starting to use another port).

The page operates entirely in the browser: paste your domain list (one per line, no TLDs) and click **Analyze Against CSV**.

## Behavior

- The table shows how many CSV domains start with, end with, or otherwise contain each provided entry.
- Each count is a button; clicking it appends a panel below the table with the matching domain names from `unreported_sales.csv`.
- The table stays intact after each click so you can collect multiple detail panels.
- No external services or databases are used.
- The dataset helper script (`domain-data.js`) injects every CSV record from `unreported_sales.csv`; if the script fails to load, the page explains the dataset is unavailable instead of trying to fetch it.
