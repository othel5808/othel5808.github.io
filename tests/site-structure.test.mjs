import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url);

test('site defines the requested primary navigation', async () => {
  const source = await readFile(new URL('src/data/site.ts', root), 'utf8');
  for (const href of ['/portfolio/', '/blog/', '/resume/']) {
    assert.match(source, new RegExp(href.replaceAll('/', '\\/')));
  }
});

test('portfolio contains a complete editable outline', async () => {
  const source = await readFile(new URL('src/pages/portfolio.astro', root), 'utf8');
  for (const id of ['intro', 'skills', 'projects', 'opensource', 'experience', 'contact']) {
    assert.match(source, new RegExp(`id=["']${id}["']`));
  }
});

test('all demo routes have source pages', async () => {
  for (const path of [
    'src/pages/index.astro',
    'src/pages/portfolio.astro',
    'src/pages/blog/index.astro',
    'src/pages/resume.astro',
  ]) {
    await access(new URL(path, root));
  }
});

test('Astro can statically generate every demo route', () => {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: new URL('../', import.meta.url),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('portfolio uses presentation sections and a phone-only navigation control', async () => {
  const portfolio = await readFile(new URL('src/pages/portfolio.astro', root), 'utf8');
  const sidebar = await readFile(new URL('src/components/DocumentSidebar.astro', root), 'utf8');
  const styles = await readFile(new URL('src/styles/global.css', root), 'utf8');
  assert.match(portfolio, /portfolio-slide/);
  assert.match(portfolio, /engineering-projects/);
  assert.match(sidebar, /doc-nav-toggle/);
  assert.match(styles, /max-width:\s*600px/);
});

test('related posts rank shared categories and tags without returning the current post', async () => {
  const { POSTS, getRelatedPosts } = await import('../src/data/posts.mjs');
  const related = getRelatedPosts('building-a-personal-site', 3);
  assert.ok(related.length > 0 && related.length <= 3);
  assert.ok(related.every((post) => post.slug !== 'building-a-personal-site'));
  assert.equal(related[0].slug, 'designing-document-navigation');
  assert.equal(POSTS.length, 4);
});

test('blog exposes category navigation, tags, and related content', async () => {
  const list = await readFile(new URL('src/pages/blog/index.astro', root), 'utf8');
  const post = await readFile(new URL('src/pages/blog/[slug].astro', root), 'utf8');
  const sidebar = await readFile(new URL('src/components/DocumentSidebar.astro', root), 'utf8');
  assert.match(list, /BlogSidebar/);
  assert.match(post, /RelatedPosts/);
  assert.match(post, /post-tags/);
  assert.match(sidebar, /sidebar-collapse/);
});

test('GitHub Pages deploys from main with free standard runners', async () => {
  const workflow = await readFile(new URL('.github/workflows/deploy.yml', root), 'utf8');
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /runs-on:\s*ubuntu-latest/g);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /withastro\/action@v6/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.doesNotMatch(workflow, /larger|macos-|windows-/i);
});

test('portfolio navigation matches the blog sidebar and main content proportion', async () => {
  const sidebar = await readFile(new URL('src/components/DocumentSidebar.astro', root), 'utf8');
  const styles = await readFile(new URL('src/styles/global.css', root), 'utf8');
  assert.match(sidebar, /sidebar-content/);
  assert.doesNotMatch(sidebar, /items\.map\(\(item, index\)/);
  assert.doesNotMatch(sidebar, /padStart/);
  assert.match(styles, /--portfolio-content-max:\s*1120px/);
  assert.match(styles, /(?:^|\n)\s*height:\s*calc\(100vh - 74px\)/);
});

test('resume uses the shared full-height responsive sidebar', async () => {
  const resume = await readFile(new URL('src/pages/resume.astro', root), 'utf8');
  const styles = await readFile(new URL('src/styles/global.css', root), 'utf8');
  assert.match(resume, /resume-layout/);
  assert.match(resume, /resume-main/);
  assert.match(styles, /\.resume-layout \.doc-sidebar/);
  assert.match(styles, /\.resume-main/);
});

test('portfolio presents a compact Python backend and data engineering profile', async () => {
  const portfolio = await readFile(new URL('src/pages/portfolio.astro', root), 'utf8');
  const styles = await readFile(new URL('src/styles/global.css', root), 'utf8');
  for (const technology of [
    'Python',
    'Django',
    'FastAPI',
    'PostgreSQL',
    'Airflow',
    'Kafka',
    'AWS',
  ]) {
    assert.match(portfolio, new RegExp(technology));
  }
  assert.match(portfolio, /tech-matrix/);
  assert.equal((portfolio.match(/class="engineering-project"/g) ?? []).length, 3);
  assert.match(portfolio, /developer-portfolio/);
  assert.match(styles, /\.developer-portfolio/);
});
