import { dev } from 'astro';

async function run() {
  console.log('Starting programmatic Astro dev server on port 4321...');
  try {
    // Correct CWD drive letter on Windows
    const cwd = process.cwd();
    const correctedCwd = cwd.slice(0, 1).toUpperCase() + cwd.slice(1);
    if (correctedCwd !== cwd) process.chdir(correctedCwd);

    await dev({
      root: 'C:/AIQualityHQ',
      server: {
        port: 4321,
        host: '127.0.0.1'
      }
    });
    console.log('Astro dev server is running on port 4321.');
  } catch (err) {
    console.error('Error starting Astro programmatically:', err);
  }
}

run().catch(err => {
  console.error('Fatal error running script:', err);
});
