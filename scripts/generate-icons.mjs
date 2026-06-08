import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "icons");

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function generate() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.log("sharp not installed — creating SVG fallback icons");
    await mkdir(OUT, { recursive: true });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="96" fill="#7C9A6F"/>
      <circle cx="256" cy="256" r="80" fill="none" stroke="#fff" stroke-width="28"/>
    </svg>`;
    await writeFile(join(OUT, "icon.svg"), svg);
    console.log("Created public/icons/icon.svg — run: npm i -D sharp && node scripts/generate-icons.mjs");
    return;
  }

  await mkdir(OUT, { recursive: true });

  for (const size of SIZES) {
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="96" fill="#7C9A6F"/>
      <circle cx="256" cy="256" r="80" fill="none" stroke="#ffffff" stroke-width="28"/>
    </svg>`);

    const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}x${size}.png`;
    await sharp(svg).resize(size, size).png().toFile(join(OUT, name));
    console.log(`Created ${name}`);
  }
}

generate().catch(console.error);
