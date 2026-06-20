import QRCode from "qrcode";
import sharp from "sharp";

const CANVAS_SIZE = 1024;
const PLAQUE_SIZE = 238;
const PLAQUE_OFFSET = 34;
const QR_SIZE = 164;
const QR_INSET = 37;

type QrArtworkInput = {
  imageBytes: Buffer;
  targetUrl: string;
};

export async function createQrArtworkPng({
  imageBytes,
  targetUrl,
}: QrArtworkInput): Promise<Buffer> {
  const base = await sharp(imageBytes)
    .resize(CANVAS_SIZE, CANVAS_SIZE, { fit: "cover" })
    .png()
    .toBuffer();

  const qr = await QRCode.toBuffer(targetUrl, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 2,
    width: QR_SIZE,
    color: {
      dark: "#18303A",
      light: "#FFF8EA",
    },
  });

  const plaque = await sharp(Buffer.from(plaqueSvg()))
    .composite([{ input: qr, left: QR_INSET, top: QR_INSET }])
    .png()
    .toBuffer();

  const glow = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${PLAQUE_SIZE + 56}" height="${PLAQUE_SIZE + 56}" viewBox="0 0 ${PLAQUE_SIZE + 56} ${PLAQUE_SIZE + 56}">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#F3C66B" stop-opacity="0.28"/>
          <stop offset="70%" stop-color="#F3C66B" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#F3C66B" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#glow)"/>
    </svg>
  `);

  const left = CANVAS_SIZE - PLAQUE_SIZE - PLAQUE_OFFSET;
  const top = CANVAS_SIZE - PLAQUE_SIZE - PLAQUE_OFFSET;

  return sharp(base)
    .composite([
      { input: glow, left: left - 28, top: top - 28 },
      { input: plaque, left, top },
    ])
    .png()
    .toBuffer();
}

function plaqueSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${PLAQUE_SIZE}" height="${PLAQUE_SIZE}" viewBox="0 0 ${PLAQUE_SIZE} ${PLAQUE_SIZE}">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#11252E" flood-opacity="0.22"/>
        </filter>
        <linearGradient id="paper" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF9ED"/>
          <stop offset="100%" stop-color="#EFE1C4"/>
        </linearGradient>
      </defs>
      <g filter="url(#shadow)">
        <rect x="0.5" y="0.5" width="${PLAQUE_SIZE - 1}" height="${PLAQUE_SIZE - 1}" rx="28" fill="url(#paper)" fill-opacity="0.96" stroke="#D5B86A" stroke-opacity="0.65"/>
        <path d="M28 31 C69 17 91 46 126 31 C160 17 178 40 211 27" fill="none" stroke="#1C6F75" stroke-opacity="0.28" stroke-width="4" stroke-linecap="round"/>
        <path d="M26 211 C62 191 96 221 128 205 C161 189 178 214 211 198" fill="none" stroke="#A74E3B" stroke-opacity="0.22" stroke-width="4" stroke-linecap="round"/>
        <rect x="${QR_INSET - 9}" y="${QR_INSET - 9}" width="${QR_SIZE + 18}" height="${QR_SIZE + 18}" rx="18" fill="#FFF8EA" stroke="#18303A" stroke-opacity="0.12"/>
        <circle cx="27" cy="119" r="4" fill="#D5B86A" fill-opacity="0.8"/>
        <circle cx="211" cy="119" r="4" fill="#D5B86A" fill-opacity="0.8"/>
      </g>
    </svg>
  `;
}
