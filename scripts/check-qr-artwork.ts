import jsQR from "jsqr";
import sharp from "sharp";
import { createQrArtworkPng } from "../lib/qr-artwork";

async function main() {
  const targetUrl = "https://before-the-title.test/gallery/sub-qr-check";
  const imageBytes = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: "#19333D",
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
            <defs>
              <radialGradient id="a" cx="45%" cy="42%" r="55%">
                <stop offset="0%" stop-color="#F5D27D"/>
                <stop offset="45%" stop-color="#207278"/>
                <stop offset="100%" stop-color="#19333D"/>
              </radialGradient>
            </defs>
            <rect width="1024" height="1024" fill="url(#a)"/>
            <path d="M80 720 C260 600 410 800 590 650 C760 510 850 610 980 520" fill="none" stroke="#F7EFE2" stroke-width="30" opacity="0.32"/>
            <path d="M120 250 C280 140 450 290 640 210 C770 150 840 190 940 120" fill="none" stroke="#A64E3D" stroke-width="24" opacity="0.32"/>
          </svg>
        `),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();

  const finalPng = await createQrArtworkPng({ imageBytes, targetUrl });
  const raw = await sharp(finalPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const decoded = jsQR(
    new Uint8ClampedArray(raw.data.buffer, raw.data.byteOffset, raw.data.length),
    raw.info.width,
    raw.info.height
  );

  if (!decoded) {
    throw new Error("QR code was not readable from the composed artwork.");
  }

  if (decoded.data !== targetUrl) {
    throw new Error(`QR decoded to ${decoded.data}, expected ${targetUrl}`);
  }

  console.log(
    JSON.stringify({
      ok: true,
      decoded: decoded.data,
      width: raw.info.width,
      height: raw.info.height,
      bytes: finalPng.length,
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
