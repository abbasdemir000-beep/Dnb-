import { cp, mkdir, rm } from 'node:fs/promises';

const outputDir = 'dist';
const staticEntries = ['index.html', 'src', 'data'];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const entry of staticEntries) {
  await cp(entry, `${outputDir}/${entry}`, { recursive: true });
}

console.log(`Built Iraq.ai static app into ${outputDir}/`);
