import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Generate both device sets from the tracked, authentic 9-second recording.
for (const [variant, size, quality] of [['desktop', '896:560', '75'], ['mobile', '640:400', '72']]) {
  const directory = `public/media/flovart-frames/${variant}`;
  mkdirSync(directory, { recursive: true });
  const result = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', 'public/media/flovart-live.mp4',
    '-vf', `fps=16/3,scale=${size}`, '-frames:v', '48', '-start_number', '0',
    '-c:v', 'libwebp', '-quality', quality, `${directory}/%03d.webp`,
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
