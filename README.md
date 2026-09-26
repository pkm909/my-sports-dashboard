# My Sports Dashboard

A mobile-first, single-page sports dashboard for:

1. MLB — Boston Red Sox, San Francisco Giants
2. NFL — San Francisco 49ers
3. NHL — San Jose Sharks
4. MLS — San Jose Earthquakes

It displays current record/standings information and team statistical leaders. The page refreshes automatically every 10 minutes and has a manual Refresh button.

## GitHub Pages

1. Create a new GitHub repository (for example `my-sports-dashboard`).
2. Upload `index.html`, `styles.css`, `app.js`, and this README to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then Save.
6. GitHub will provide the HTTPS Pages address.

No server or paid hosting is required.

## Data source

The app uses ESPN's publicly accessible web endpoints from the browser. These endpoints are not an officially supported developer API, so ESPN could change them in the future. The app includes basic error handling and a manual refresh control.

## Notes

- The dashboard intentionally contains only the user's five selected teams.
- It is responsive and optimized for iPhone-sized screens.
- No login, database, or personal data are required.
