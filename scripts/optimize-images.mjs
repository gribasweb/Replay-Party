import sharp from "sharp";
import path from "node:path";
import { statSync } from "node:fs";

// Reads the original PNGs from the parent folder ("SITE PIETRO") and writes
// optimized WebP into public/. Re-run this whenever the source images change.
const SRC = path.resolve(process.cwd(), "..");
const OUT = path.resolve(process.cwd(), "public");

const jobs = [
  { in: "FUNDO.png", out: "fundo.webp" },
  { in: "FUNDO celular.png", out: "fundo-celular.webp" },
  { in: "DJ SEM FUNDO.png", out: "dj.webp" },
  { in: "DJ SEM FUNDO celular.png", out: "dj-celular.webp" },
  { in: "logo evento.png", out: "logo.webp" },
];

const kb = (p) => {
  try {
    return Math.round(statSync(p).size / 1024);
  } catch {
    return null;
  }
};

for (const job of jobs) {
  const inPath = path.join(SRC, job.in);
  const outPath = path.join(OUT, job.out);
  const before = kb(inPath);
  if (before === null) {
    console.log(`(pulado) nao achei: ${job.in}`);
    continue;
  }
  await sharp(inPath).webp({ quality: 82, effort: 6 }).toFile(outPath);
  const after = kb(outPath);
  const saved = Math.round((1 - after / before) * 100);
  console.log(`${job.out.padEnd(11)} ${String(before).padStart(5)} KB -> ${String(after).padStart(4)} KB  (-${saved}%)`);
}
console.log("Pronto.");
