import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const publicDir = join(root, 'public');
const privateAdminPath = 'amin-control-9f4c2b7a.html';

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });

const files = [
  '404.html',
  'admin-auth.js',
  'analytics-admin.js',
  'analytics.js',
  'favicon.svg',
  'i18n.js',
  'index.html',
  'robots.txt',
  'shorts-admin.js',
  'shorts.css',
  'shorts.html',
  'shorts.js',
  'sitemap.xml'
];

for (const file of files) {
  await cp(join(root, file), join(publicDir, file));
}

await cp(join(root, privateAdminPath), join(publicDir, privateAdminPath));

await cp(join(root, 'фон'), join(publicDir, 'фон'), {
  recursive: true,
  filter: (source) => !source.toLowerCase().endsWith('.png')
});
