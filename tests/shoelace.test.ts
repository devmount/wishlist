import { expect, test } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Read all source files except the Shoelace setup itself
const sourceFiles = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(
  (entry) => entry.isDirectory() ? sourceFiles(join(dir, entry.name)) : [join(dir, entry.name)]
).filter((file) => /\.(vue|ts)$/.test(file) && !file.endsWith('shoelace.ts'));
const sources = sourceFiles('src').map((file) => readFileSync(file, 'utf-8')).join('\n');
const setup = readFileSync('src/shoelace.ts', 'utf-8');

test('all used Shoelace components are imported', () => {
  const tags = new Set([...sources.matchAll(/(?:<|createElement\(')sl-([a-z-]+)/g)].map((m) => m[1]));
  expect(tags.size).toBeGreaterThan(0);
  for (const tag of tags) {
    expect(setup, `sl-${tag} is used but not imported`).toContain(`/components/${tag}/${tag}.js'`);
  }
});

test('all used icons are imported', () => {
  // Static names, names in dynamic bindings and icon arguments of notify()
  const names = new Set([
    ...[...sources.matchAll(/<sl-icon[^>]*\sname="([a-z0-9-]+)"/g)].map((m) => m[1]),
    ...[...sources.matchAll(/:name="[^"]*"/g)].flatMap((m) => [...m[0].matchAll(/'([a-z0-9-]+)'/g)].map((n) => n[1])),
    ...[...sources.matchAll(/icon = '([a-z0-9-]+)'/g)].map((m) => m[1]),
    ...[...sources.matchAll(/notify\([^)]*?'([a-z0-9]+-[a-z0-9-]+)',\s*\d+/g)].map((m) => m[1]),
  ]);
  expect(names.size).toBeGreaterThan(0);
  for (const name of names) {
    expect(setup, `icon ${name} is used but not imported`).toContain(`'${name}': `);
  }
});

test('light and dark themes are imported', () => {
  expect(setup).toContain(`/themes/light.css'`);
  expect(setup).toContain(`/themes/dark.css'`);
});
