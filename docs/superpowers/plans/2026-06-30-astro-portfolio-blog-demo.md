# Astro Portfolio Blog Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a navigable Astro demo with distinct home, portfolio, blog, post, and resume pages, sample content, responsive styling, dark mode, and GitHub Pages deployment readiness.

**Architecture:** Use a shared Astro layout and small presentational components for consistent navigation and typography. Store blog posts in Astro Content Collections and keep portfolio/resume demo data close to their pages until real personal content is supplied. Generate every route statically for GitHub Pages.

**Tech Stack:** Astro 7, TypeScript, Astro Content Collections, CSS custom properties, Node test runner, GitHub Actions

---

### Task 1: Site metadata and structural smoke test

**Files:**

- Create: `tests/site-structure.test.mjs`
- Create: `src/data/site.ts`
- Modify: `package.json`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Write the failing structural test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('site exposes the required navigation routes', async () => {
  const source = await readFile(new URL('../src/data/site.ts', import.meta.url), 'utf8');
  for (const href of ['/portfolio/', '/blog/', '/resume/']) assert.match(source, new RegExp(href));
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/site-structure.test.mjs`
Expected: FAIL because `src/data/site.ts` does not exist.

- [ ] **Step 3: Add metadata and scripts**

Create `src/data/site.ts` exporting `SITE` and `NAV_ITEMS`, add `"test": "node --test tests/*.test.mjs"` to `package.json`, and configure `site` in `astro.config.mjs` with an environment-overridable public URL.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/site-structure.test.mjs src/data/site.ts package.json astro.config.mjs
git commit -m "chore: configure portfolio site metadata"
```

### Task 2: Shared visual system and navigation

**Files:**

- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/SiteFooter.astro`
- Create: `src/components/ThemeToggle.astro`

- [ ] **Step 1: Extend the structural test**

Add assertions that `BaseLayout.astro` imports `global.css`, renders `SiteHeader`, and includes title and description metadata.

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL because the shared layout does not exist.

- [ ] **Step 3: Implement shared components**

Build a semantic header with brand, `포트폴리오 · 글 · 이력서`, theme toggle, and mobile navigation. Define light/dark variables, typography, focus styles, containers, buttons, cards, and responsive breakpoints in `global.css`.

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build`
Expected: tests pass and Astro build exits successfully.

- [ ] **Step 5: Commit**

```bash
git add src/styles src/layouts src/components
git commit -m "feat: add shared portfolio visual system"
```

### Task 3: Home and document page shell

**Files:**

- Create: `src/components/DocumentSidebar.astro`
- Create: `src/components/ProjectCard.astro`
- Modify: `src/pages/index.astro`
- Create: `src/pages/portfolio.astro`
- Create: `src/pages/resume.astro`

- [ ] **Step 1: Add required-route assertions**

Update `tests/site-structure.test.mjs` to check that home, portfolio, and resume source files exist and that portfolio contains the IDs `intro`, `skills`, `projects`, `opensource`, `experience`, and `contact`.

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL because portfolio and resume pages do not exist.

- [ ] **Step 3: Implement the three pages**

Home includes a concise hero, selected projects, latest writing preview, and contact links. Portfolio uses the selected B-direction fixed left table of contents and complete sample sections. Resume reuses the sidebar pattern with a denser timeline for summary, work, projects, skills, education, and activities.

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build`
Expected: PASS and static HTML generated for `/`, `/portfolio/`, and `/resume/`.

- [ ] **Step 5: Commit**

```bash
git add src/components/DocumentSidebar.astro src/components/ProjectCard.astro src/pages tests
git commit -m "feat: add home portfolio and resume demos"
```

### Task 4: Blog content collection and routes

**Files:**

- Create: `src/content.config.ts`
- Create: `src/content/blog/building-a-personal-site.md`
- Create: `src/content/blog/designing-document-navigation.md`
- Create: `src/content/blog/notes-on-astro.md`
- Create: `src/components/PostList.astro`
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[slug].astro`

- [ ] **Step 1: Add blog schema assertions**

Check that `src/content.config.ts` defines title, description, publishedAt, category, tags, and draft fields and that three Markdown samples exist.

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL because the collection is missing.

- [ ] **Step 3: Implement blog content and pages**

Define the collection with Astro glob loader and Zod schema. Render a category-filterable list with a `NEW` marker for recent sample posts, then statically generate individual post pages with prose styling and previous-page navigation.

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build`
Expected: PASS and three post routes generated.

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content src/components/PostList.astro src/pages/blog tests
git commit -m "feat: add content-driven blog demo"
```

### Task 5: Utility pages and deployment

**Files:**

- Create: `src/pages/404.astro`
- Create: `src/pages/rss.xml.js`
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`

- [ ] **Step 1: Add deployment assertions**

Check for the Pages workflow permissions `pages: write` and `id-token: write`, plus the RSS and 404 sources.

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL because the utility files are missing.

- [ ] **Step 3: Add static utilities and workflow**

Create the 404 page, generate an RSS response from blog entries, and add the official Astro GitHub Pages action flow. Replace starter README content with editing, local development, build, and deployment instructions, including `astro dev --background` commands.

- [ ] **Step 4: Run verification**

Run: `npm test && npm run build`
Expected: PASS with no build errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/404.astro src/pages/rss.xml.js .github/workflows/deploy.yml README.md tests
git commit -m "feat: prepare demo for GitHub Pages"
```

### Task 6: Browser verification

**Files:**

- Modify only files with defects found during verification.

- [ ] **Step 1: Start Astro in required background mode**

Run: `npx astro dev --background`
Expected: Astro reports a background server URL.

- [ ] **Step 2: Inspect all primary routes**

Open `/`, `/portfolio/`, `/blog/`, one generated post, and `/resume/` at desktop and mobile widths. Verify navigation, sidebar behavior, theme switching, category controls, and focus states.

- [ ] **Step 3: Fix observed defects and rerun checks**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 4: Stop the server**

Run: `npx astro dev stop`
Expected: background server stops cleanly.

- [ ] **Step 5: Commit verified fixes**

```bash
git add src tests
git commit -m "fix: polish responsive demo experience"
```

### Task 7: Responsive presentation portfolio

**Files:**

- Modify: `src/components/DocumentSidebar.astro`
- Modify: `src/pages/portfolio.astro`
- Modify: `src/styles/global.css`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1: Write failing responsive structure tests**

Assert that the sidebar has a mobile toggle, portfolio sections use the `portfolio-slide` class, projects use `portfolio-deck`, and the stylesheet contains a phone-only `max-width: 600px` navigation rule.

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL because presentation classes and the mobile control do not exist.

- [ ] **Step 3: Implement the presentation layout**

Convert intro and skills to near-viewport slide sections, render projects in 16:9 deck cards, float the vertical sidebar on desktop and tablet, and add an accessible disclosure menu that appears only below 600px.

- [ ] **Step 4: Verify all responsive pages**

Run: `npm test`
Expected: PASS, including static generation.

- [ ] **Step 5: Inspect desktop, tablet, and phone widths**

Verify `/portfolio/`, `/`, `/blog/`, and `/resume/` at 1280px, 820px, and 390px. Confirm there is no horizontal overflow and that the portfolio menu collapses only at 390px.

### Task 8: Full-height navigation and related posts

**Files:**

- Create: `src/data/posts.mjs`
- Create: `src/components/BlogSidebar.astro`
- Create: `src/components/RelatedPosts.astro`
- Modify: `src/components/DocumentSidebar.astro`
- Modify: `src/pages/blog/index.astro`
- Modify: `src/pages/blog/[slug].astro`
- Modify: `src/styles/global.css`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1:** Add failing tests for related-post ranking, blog sidebar, tags, and desktop sidebar collapse controls.
- [ ] **Step 2:** Run `npm test` and confirm the new tests fail for missing modules and markup.
- [ ] **Step 3:** Implement post metadata and rank related posts by shared category and tags, excluding the current post and limiting results to three.
- [ ] **Step 4:** Add the blog category sidebar and post footer components.
- [ ] **Step 5:** Convert desktop/tablet sidebars to full-height panels with a collapsible rail while retaining phone popups.
- [ ] **Step 6:** Run `npm test` and verify static generation passes.
- [ ] **Step 7:** Verify desktop, tablet, and phone sidebar behavior and horizontal overflow in the browser.

### Task 9: Unify portfolio and blog sidebars

**Files:**

- Modify: `src/components/DocumentSidebar.astro`
- Modify: `src/pages/portfolio.astro`
- Modify: `src/styles/global.css`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1:** Add failing tests requiring number-free portfolio links, the shared sidebar content structure, and the main 1120px content proportion.
- [ ] **Step 2:** Run `npm test` and confirm the new assertions fail against the existing numbered portfolio navigation.
- [ ] **Step 3:** Simplify the portfolio navigation markup and align its classes with the blog category sidebar.
- [ ] **Step 4:** Update portfolio layout widths and spacing to use the main-page maximum width while preserving slide sections.
- [ ] **Step 5:** Run formatting, tests, and the static build.
- [ ] **Step 6:** Compare portfolio and blog sidebars at desktop and phone widths in the browser.

### Task 10: Unify resume navigation

**Files:**

- Modify: `src/pages/resume.astro`
- Modify: `src/styles/global.css`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1:** Add a failing test requiring the resume layout and shared full-height sidebar selectors.
- [ ] **Step 2:** Run `npm test` and confirm the resume-specific assertion fails.
- [ ] **Step 3:** Wrap the resume hero and content in a sidebar-aware main column.
- [ ] **Step 4:** Share desktop, tablet, collapsed-rail, and phone popup styles with the portfolio sidebar.
- [ ] **Step 5:** Run formatting, tests, static build, and browser checks at desktop and phone widths.

### Task 11: Backend and data engineering portfolio

**Files:**

- Modify: `src/pages/portfolio.astro`
- Modify: `src/styles/global.css`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1:** Add failing tests for the backend/data role, required technology matrix, three project disclosures, and compact developer layout.
- [ ] **Step 2:** Run `npm test` and confirm the portfolio assertions fail.
- [ ] **Step 3:** Replace product-design language with Python backend and data engineering content.
- [ ] **Step 4:** Add a compact technology matrix, three expandable project cards, dense experiment list, career table, and contact card.
- [ ] **Step 5:** Reduce slide minimum heights and tune responsive card/table layouts.
- [ ] **Step 6:** Run formatting, tests, static build, and browser checks at desktop and phone widths.
