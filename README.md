# Chicago Code

Streetwear e‑commerce storefront for **Chicago Code** — a clothing brand from the Second City.
A fast, fully static website with a built‑in staff admin panel for managing products without touching code.

**Live site:** https://saidarshan850182.github.io/chicago-code/
**Staff admin:** https://saidarshan850182.github.io/chicago-code/admin.html

---

## Features

- **Storefront** — hero, collections, filterable product grid, shopping cart (saved in the browser), newsletter & contact forms, fully responsive.
- **Live stock** — products show "Only N left" / "Sold Out", and the cart never exceeds available stock.
- **Staff admin panel** (`admin.html`)
  - Add, edit, and delete products
  - Upload product photos
  - Edit names, categories, prices, badges, and stock
  - **Publish** changes straight to GitHub — the live store updates automatically in about a minute
- **No backend or build step** — pure HTML/CSS/JavaScript, hosted free on GitHub Pages.

---

## Project structure

```
chicago-code/
├── index.html              # Storefront
├── admin.html              # Staff admin panel
├── README.md
├── LICENSE
├── .gitignore
└── assets/
    ├── css/
    │   ├── styles.css      # Storefront + shared styles
    │   └── admin.css       # Admin panel styles
    ├── js/
    │   ├── products.js     # Product catalog (the data — managed by the admin panel)
    │   ├── script.js       # Storefront logic (cart, filters, rendering)
    │   └── admin.js        # Admin logic (editing + publishing to GitHub)
    └── images/
        ├── favicon.svg     # Site icon
        └── products/       # Uploaded product photos
```

`assets/js/products.js` is the single source of truth for what appears in the store.
It is normally edited through the admin panel — not by hand.

---

## Managing products (for staff)

1. Open **`admin.html`** and connect with your GitHub access token (one‑time, stored in your browser).
2. Add or edit products, upload photos, set prices and stock.
3. Click **Publish to Live Site**.
4. Wait about a minute — the live store updates automatically.

### Getting a GitHub access token
1. Go to **Settings → Developer settings → Fine‑grained personal access tokens** on GitHub.
2. **Repository access:** Only select repositories → `chicago-code`.
3. **Permissions:** Contents → **Read and write**.
4. Generate, copy, and paste it into the admin panel.

> The token lets the admin page save to this repository. Keep it private. If it ever leaks, delete it on GitHub and it stops working immediately.

---

## Running locally

It's a static site, so just open `index.html` in a browser.
For paths to behave exactly like production, serve it with a tiny local server:

```bash
# Python 3
python -m http.server 8000
# then visit http://localhost:8000
```

---

## Deployment

Hosted on **GitHub Pages** from the `main` branch (root).
Any push to `main` — including product changes published from the admin panel — redeploys the live site automatically.

To deploy code changes manually:

```bash
git add .
git commit -m "Describe your change"
git push
```

---

## Tech stack

- HTML5, CSS3 (custom properties, responsive grid/flexbox)
- Vanilla JavaScript (no frameworks, no build step)
- GitHub Pages (hosting) + GitHub Contents API (admin publishing)
- Google Fonts: Bebas Neue, Inter

---

## License

See [LICENSE](LICENSE). © 2026 Chicago Code. All rights reserved.
