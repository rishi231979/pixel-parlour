# Pixel Parlour: Agency Website

A warm, colorful, multi-page marketing website for **Pixel Parlour**, a friendly full-service digital marketing agency (Social Media, SEO & Content, Paid Ads, Branding & Web Design). The goal of the site is simple: get visitors to **book a free consultation**.

- **Tech:** plain HTML5, CSS3 and vanilla JavaScript. **No frameworks, no npm, no build step.**
- **Hosting:** made for **GitHub Pages** (project sites like `https://username.github.io/pixel-parlour/`). Every internal link and asset path is **relative**, so it also works when you double-click `index.html`.
- **External resources:** Google Fonts only (Fredoka + DM Sans). No analytics, no trackers, no cookies.
- **Accessibility:** built to WCAG 2.1 AA. Skip link, visible focus, keyboard-friendly menu, modals and carousel, reduced-motion support, and it works with JavaScript turned off.

---

## Table of contents

1. [Folder structure](#folder-structure)
2. [Preview locally](#preview-locally)
3. [Replace-me checklist](#replace-me-checklist)
4. [Deploy to GitHub Pages (step by step)](#deploy-to-github-pages-step-by-step)
5. [Custom domain (optional)](#custom-domain-optional)
6. [Troubleshooting](#troubleshooting)
7. [Before you go live](#before-you-go-live)
8. [Editing tips](#editing-tips)
9. [Helper scripts](#helper-scripts)

---

## Folder structure

```
.
├── index.html            Home page
├── services.html         Services (4 detailed services, packages, FAQ)
├── work.html             Case studies with filter + pop-up case study modals
├── about.html            Story, values, team, "how we're different"
├── contact.html          Contact details + enquiry form (Formspree)
├── 404.html              Friendly "page not found" (GitHub Pages serves it automatically)
├── robots.txt            Lets search engines crawl; points to the sitemap
├── sitemap.xml           List of public pages for search engines
├── site.webmanifest      App name, colors and icons (home-screen installs)
├── .nojekyll             Tells GitHub Pages to serve files as-is (no Jekyll processing)
├── .gitignore            Keeps OS/editor junk out of Git
├── README.md             You are here
│
├── css/
│   ├── tokens.css        Design tokens: colors, fonts, spacing, radii, shadows (edit the brand here)
│   ├── base.css          Reset, typography, layout helpers, reduced motion, print styles
│   ├── components.css    Header, nav, buttons, cards, badges, FAQ, forms, modal, footer…
│   └── pages.css         Page-specific sections (hero, services, work, about, contact, 404)
│
├── js/
│   ├── config.js         ⭐ Your business details (email, phone, socials, Formspree URL)
│   ├── main.js           Shared: config filling, mobile menu, scroll reveal, counters, carousel, back-to-top
│   ├── work.js           Work page only: category filter + case-study modals
│   └── contact.js        Contact page only: form validation + Formspree submission
│
├── assets/
│   ├── img/              Logo, favicons, app icons, social preview image (og-image.png + editable .svg)
│   └── icons/            Stand-alone copies of the inline SVG icons (handy for reuse)
│
└── scripts/              Helper scripts (Python 3, no installs needed)
    ├── set-site-url.py   Set your real site URL everywhere in one go
    ├── check-links.py    Check every link/asset path resolves (and flags "/..." paths)
    └── check-html.py     Structural HTML + SEO checks (tags, ids, headings, labels, titles…)
```

---

## Preview locally

**Option A (quickest):** double-click `index.html`. Everything works except the contact form submission (which needs the real internet + your Formspree ID anyway).

**Option B (recommended, behaves like the real server):** open a terminal in this folder and run:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. Press `Ctrl + C` to stop the server.

> On Windows, use `python -m http.server 8000` if `python3` isn't recognized.

---

## Replace-me checklist

Work through these before launch. Each item says exactly where to look.

### a) Business details → `js/config.js`

```js
window.PIXEL_PARLOUR = {
  email: "hello@YOUR-DOMAIN.com",
  phone: "+00 00000 00000",
  whatsapp: "",                 // digits only with country code, e.g. "447700900123" (leave "" to hide)
  location: "Your City, Your Country",
  instagram: "#", linkedin: "#", facebook: "#", x: "#",   // full profile URLs
  formspreeEndpoint: "https://formspree.io/f/YOUR_FORM_ID"
};
```

Every element with a `data-config="…"` attribute (footer, contact page, social icons) is filled from this file automatically.

**Also update the fallback text** (shown if JavaScript is off, and read by search engines). Use your editor's *Find in files* for:

- `hello@YOUR-DOMAIN.com`
- `+00 00000 00000` and `tel:+000000000000`
- `Your City, Your Country`

…and the **structured data** block at the bottom of `<head>` in `index.html` (email, telephone, address, and add your social profiles as `"sameAs": [...]`). It can't read `config.js`, so it needs updating by hand.

### b) Formspree (the contact form) step by step

1. Go to **[formspree.io](https://formspree.io)** and create a free account.
2. Click **+ New Form**, give it a name (e.g. "Pixel Parlour website") and choose the email address that should receive enquiries.
3. Formspree shows your form endpoint, e.g. `https://formspree.io/f/abcdwxyz`. The last part (`abcdwxyz`) is your **form ID**.
4. Paste the full endpoint into **`js/config.js`** → `formspreeEndpoint`.
5. Also paste it into the form's `action` in **`contact.html`** (search for `YOUR_FORM_ID`). This makes the form work for visitors with JavaScript disabled.
6. Deploy, then submit a test enquiry on the live site. **The first submission triggers a confirmation email from Formspree.** Click the link in it to activate the form.
7. Optional (in Formspree's dashboard): add your domain to the allowed list, and turn on reCAPTCHA if you get spam. A hidden honeypot field (`_gotcha`) is already included.

Until the ID is set, the form politely tells visitors to email you instead, and prints a warning in the browser console for you.

### c) Placeholder content, by page

Every stand-in is marked with `data-placeholder="true"` (shown with a **dashed outline**) and a visible **"Placeholder"** badge. Search the project for `data-placeholder="true"` to find them all.

| Page | What to replace |
|---|---|
| `index.html` | "Trusted by growing brands" logo pills · 3 featured case-study cards (names, results) · 4 stats (sample numbers) · 3 testimonials |
| `services.html` | 3 package cards (names, features, "Custom pricing", the "Most popular" flag) |
| `work.html` | 6 case-study cards **and** their 6 pop-up case studies (challenge, approach, sample results) |
| `about.html` | "Our story" text · 4 team cards (names, roles, bios, initials) |

Also review these for accuracy (they're realistic but describe policies only you can confirm):
- FAQ answers on Home, Services and Contact (contract terms, account ownership, start times). If you edit FAQ text, update the matching `FAQPage` JSON-LD block in that page's `<head>` too.
- "How we're different" on About, and "We reply within 1 business day" (Contact + About).
- Budget ranges in the contact form (add a currency symbol if you like).

**When everything is real:** delete the `[data-placeholder="true"] { … }` rule in `css/base.css`, remove the remaining `badge--placeholder` elements, and remove the `data-placeholder` attributes.

> **Never publish invented clients, stats, reviews or awards.** Only use real, approved results and testimonials.

### d) Social preview image (Open Graph)

- The pages use **`assets/img/og-image.png`** (1200 × 630). Most social platforms (Facebook, LinkedIn, X, WhatsApp, Slack) **require PNG or JPG; SVG previews are not supported.**
- `assets/img/og-image.svg` is an editable source version. Edit it (Figma, Inkscape, or any design tool), export at **1200 × 630 PNG**, and overwrite `og-image.png`, keeping the same file name.
- After deploying, test with the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) or the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).

### e) Set your final site URL (one command)

Canonical links, `og:url`, `og:image`, the JSON-LD, `robots.txt` and `sitemap.xml` must use **absolute** URLs. They currently contain the placeholder **`https://YOUR-USERNAME.github.io/pixel-parlour/`**. Fix them all at once:

```bash
python3 scripts/set-site-url.py https://YOUR-USERNAME.github.io/pixel-parlour/
```

- Add `--dry-run` to preview the changes first.
- Safe to run again later (e.g. after adding a custom domain); it replaces whatever URL is currently set.
- It also turns the relative social-image paths into absolute URLs.

---

## Deploy to GitHub Pages (step by step)

You'll need a free [GitHub](https://github.com) account and [Git](https://git-scm.com/downloads) installed.

### 1. Create an empty repository on GitHub

- Click **+ → New repository**.
- **Repository name:** `pixel-parlour`
- Visibility: **Public** (required for free GitHub Pages).
- **Do NOT** tick "Add a README", ".gitignore" or "license". This project already has a README and .gitignore.
- Click **Create repository**.

### 2. Push the project from your computer

Open a terminal **in this project folder** and run these one at a time (replace `YOUR-USERNAME`):

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit: Pixel Parlour website"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR-USERNAME/pixel-parlour.git
```

```bash
git push -u origin main
```

> If Git asks you to log in, sign in with your GitHub account (a browser window may open), or use a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) as the password.

### 3. Turn on GitHub Pages

On your repository page: **Settings → Pages → Build and deployment**

- **Source:** *Deploy from a branch*
- **Branch:** `main`, folder **`/ (root)`**
- Click **Save**.

### 4. Wait a minute or two

Your site goes live at:

```
https://YOUR-USERNAME.github.io/pixel-parlour/
```

You can watch progress under the repo's **Actions** tab ("pages build and deployment"). A green check means it's live.

### 5. Set the real URL and publish again

```bash
python3 scripts/set-site-url.py https://YOUR-USERNAME.github.io/pixel-parlour/
```

```bash
git add .
```

```bash
git commit -m "Set live site URL"
```

```bash
git push
```

**Every future change** follows the same pattern: edit files → `git add .` → `git commit -m "Describe the change"` → `git push`.

---

## Custom domain (optional)

1. Buy a domain from any registrar (Namecheap, Cloudflare, Porkbun, etc.).
2. In your repo: **Settings → Pages → Custom domain**, enter e.g. `www.yourdomain.com` and **Save**. GitHub adds a `CNAME` file to your repo. Pull it locally with `git pull` (or create a file named `CNAME` containing just `www.yourdomain.com`).
3. At your registrar, add DNS records:
   - For **`www`**: a `CNAME` record → `YOUR-USERNAME.github.io`
   - For the **apex/root** (`yourdomain.com`): four `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (see [GitHub's docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) for the current list and IPv6 addresses).
4. DNS can take up to 24–48 hours. Once GitHub shows the domain as verified, tick **Enforce HTTPS**.
5. **Update the site URL** and publish:
   ```bash
   python3 scripts/set-site-url.py https://www.yourdomain.com/
   ```
   then `git add .`, `git commit -m "Use custom domain"` and `git push`.

> The 404 page automatically detects whether it's on `*.github.io/pixel-parlour/` or a custom domain. If you host in an unusual sub-folder, set `SITE_ROOT` in the comment-documented script at the top of `404.html`.

---

## Troubleshooting

**The site loads but has no styling / images are missing**
- Paths must be **relative** (`css/base.css`), never root-absolute (`/css/base.css`). On a project site, `/` means `username.github.io`, not your repo. Run `python3 scripts/check-links.py` to find any.
- File names are **case-sensitive** on GitHub Pages (`Logo.svg` ≠ `logo.svg`), even though your computer may not care.

**My custom 404 page doesn't show**
- `404.html` must be in the repository root (it is). Visit a made-up URL like `…/pixel-parlour/nope`. It only appears on the live site, not with a local `python3 -m http.server`.

**My changes don't appear**
- Check the **Actions** tab: wait for the latest "pages build and deployment" run to finish (green check).
- Hard refresh: **Ctrl + Shift + R** (Windows/Linux) or **Cmd + Shift + R** (Mac), or open a private window. GitHub Pages caches files for ~10 minutes.
- Make sure you actually pushed: `git status` should say "nothing to commit" and `git log` should show your commit.

**The contact form doesn't send**
- Is `formspreeEndpoint` in `js/config.js` your real URL (not `YOUR_FORM_ID`)? Open the browser console (F12) and look for the Pixel Parlour warning.
- Did you click the **confirmation email** Formspree sent after the first submission? Check spam too.
- Free Formspree plans have a monthly submission limit. Check your Formspree dashboard.

**Fonts look different**
- Google Fonts may be blocked by an ad-blocker or network. The site falls back to system fonts gracefully.

---

## Before you go live

- [ ] All placeholders replaced with real content (search `data-placeholder="true"`), then the dashed-outline CSS rule and "Placeholder" badges removed.
- [ ] `js/config.js` filled in; fallback text and the JSON-LD contact details updated.
- [ ] Formspree connected and **tested end to end** on the live site (you received the email).
- [ ] `scripts/set-site-url.py` run with your real URL.
- [ ] Social preview tested (LinkedIn Post Inspector / Facebook Sharing Debugger).
- [ ] Tested on a **real phone** (menu, form, case-study pop-ups, tap targets).
- [ ] Ran **Lighthouse** in Chrome DevTools (F12 → Lighthouse → Analyze page load) for Performance, Accessibility, Best Practices and SEO.
- [ ] Ran `python3 scripts/check-links.py` and `python3 scripts/check-html.py` with no issues.
- [ ] Consider adding a simple **privacy policy** page (the contact form collects personal data) and linking it next to the consent checkbox and in the footer.
- [ ] Submit `sitemap.xml` in [Google Search Console](https://search.google.com/search-console) once live.

---

## Editing tips

- **Header and footer are duplicated in every HTML file** on purpose (no JavaScript includes, so the site works without JS and is SEO-friendly). When you change the menu or footer, change it in **all 6 pages**. Only the `aria-current="page"` attribute differs, marking the current page's nav link.
- **Brand colors, fonts, spacing:** edit `css/tokens.css`. Keep text contrast at **4.5 : 1** or higher. Note: the pink CTA buttons use **dark text** because white text on `#FF6FAE` fails contrast.
- **Scroll animations:** add `class="reveal"` to any element (optionally `reveal--d1`/`d2`/`d3` for a stagger). Content stays visible if JavaScript is off, and all motion is disabled for people who prefer reduced motion.
- **Count-up numbers:** `<span data-count="150" data-suffix="+">150+</span>`. Keep the real final value as the text, because that's what shows without JavaScript.
- **New case study:** copy one `<li data-category="…">` card **and** its matching `<dialog id="case-…">` in `work.html`. Keep the card link's `href="#case-…"` and `data-dialog-open="case-…"` equal to the dialog's `id`. Categories: `social`, `seo`, `ads`, `branding` (space-separated for several).
- **Analytics (optional):** there's a commented-out slot at the end of each page's `<head>`. Prefer a privacy-friendly, cookie-free tool (Plausible, Fathom, GoatCounter, Cloudflare Web Analytics) to avoid needing a cookie banner.

---

## Helper scripts

All scripts use Python 3's standard library, so there's nothing to install.

| Command | What it does |
|---|---|
| `python3 scripts/set-site-url.py https://your-url/` | Sets the absolute site URL in every page, `robots.txt` and `sitemap.xml` (add `--dry-run` to preview). |
| `python3 scripts/check-links.py` | Checks every `href`, `src`, `url()` and manifest icon resolves to a real file/anchor; flags root-absolute `/…` paths. |
| `python3 scripts/check-html.py` | Checks balanced tags, unique ids, one `<h1>`, heading order, labels, accessible names, title/description length and uniqueness, required meta tags, valid JSON-LD. |

For a full standards check, you can also paste pages into the [W3C validator](https://validator.w3.org/nu/).
