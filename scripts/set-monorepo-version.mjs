import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    console.error('usage: yarn version:all <semver>');
    process.exit(1);
}

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(rootDir, '..');
const packagesDir = path.join(repoDir, 'packages');
const names = await readdir(packagesDir, { withFileTypes: true });
const manifestPaths = [path.join(repoDir, 'package.json')];

for (const entry of names) {
    if (!entry.isDirectory()) continue;
    manifestPaths.push(path.join(packagesDir, entry.name, 'package.json'));
}

await Promise.all(manifestPaths.map(updateVersion));
console.log(`synced monorepo version -> ${version}`);

async function updateVersion(manifestPath) {
    const raw = await readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);
    manifest.version = version;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
