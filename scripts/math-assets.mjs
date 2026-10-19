import { cp, mkdir, rm } from 'node:fs/promises';

const destination = 'public/math/ocr';
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });

const assets = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'eng.traineddata.gz'],
  ...['tesseract-core-lstm', 'tesseract-core-simd-lstm', 'tesseract-core-relaxedsimd-lstm']
    .flatMap((name) => ['.wasm.js', '.wasm'].map((extension) =>
      [`node_modules/tesseract.js-core/${name}${extension}`, `${name}${extension}`])),
];
for (const [source, name] of assets) await cp(source, `${destination}/${name}`);
