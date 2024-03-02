// reference implementation

// maximum size is 4 bytes, i.e. 2^32 - 1
const MAX_SIZE = (2 ** 32) - 1;
// 1 meter = 39.3701 inches
const METER_TO_INCH = 39.3701;

// https://stackoverflow.com/questions/8482309/converting-javascript-integer-to-byte-array-and-back
function getInt32Bytes(x) {
  return [x, (x << 8), (x << 16), (x << 24)].map(z => z >>> 24);
}

// https://www.ece.ualberta.ca/~elliott/ee552/studentAppNotes/2003_w/misc/bmp_file_format/bmp_file_format.htm
function getHeaderBytes(fileSize) {
  if (fileSize > MAX_SIZE) {
    throw new Error(`Header.FileSize exceeds 4 bytes (${MAX_SIZE}), got ${fileSize}`)
  }

  const signatureBytes = [0x42, 0x4D];                          // sigature 2 bytes ='BM'
  const fileSizeBytes = getInt32Bytes(fileSize);                // filesize 4 bytes
  const reservedBytes = [0, 0, 0, 0];                           // reserved 4 bytes =0
  const dataOffsetBytes = [0, 0, 0, 54];               // offset   4 bytes

  const headerBytes = [
    ...signatureBytes,
    ...fileSizeBytes,
    ...reservedBytes,
    ...dataOffsetBytes
  ];

  return headerBytes;
}

function getInfoHeaderBytes(width, height, imageSize, dpi = 300) {
  const dpiToPPMBytes = getInt32Bytes(Math.floor(METER_TO_INCH * dpi));

  const sizeBytes = [0, 0, 0, 40];
  const widthBytes = getInt32Bytes(width);
  const heightBytes = getInt32Bytes(height);
  const planesBytes = [0, 1];
  const bpsBytes = [0, 24];
  const compressionBytes = [0, 0, 0, 0];
  const imageSizeBytes = getInt32Bytes(imageSize);
  const xPixelsPerMeterBytes = dpiToPPMBytes;         // 300 dpi to pixel/m
  const yPixelsPerMeterBytes = dpiToPPMBytes;         // 300 dpi to pixel/m
  const colorsUsedBytes = [0, 0, 0, 0];       // 4 bytes for colors used, 24 bit color palette <==> 8 bits per R, G, B <==> 16M colors
  const importantColorsBytes = [0, 0, 0, 0];          // 0 for all used

  return [
    ...sizeBytes,
    ...widthBytes,
    ...heightBytes,
    ...planesBytes,
    ...bpsBytes,
    ...compressionBytes,
    ...imageSizeBytes,
    ...xPixelsPerMeterBytes,
    ...yPixelsPerMeterBytes,
    ...colorsUsedBytes,
    ...importantColorsBytes
  ];
}

function getPixelDataBytes(pixels) {
  return pixels.reduce((a, c) => a.concat(c));
}

class BMPImage {
  constructor(width, height, dpi = 300) {
    if (width > MAX_SIZE || height > MAX_SIZE) {
      throw new Error(`image width or height cannot exceed ${MAX_SIZE}`);
    }

    this.width = width;
    this.height = height;
    this.dpi = dpi;
    this.pixels = Array(this.width * this.height).fill([0, 0, 0]);
  }

  getPixelIndex(x, y) {
    const offset = x % this.width;
    const index = y % this.height;
    return (index * this.width) + offset;
  }

  getPixel(x, y) {
    return this.pixels[this.getPixelIndex(x, y)];
  }

  setPixel(x, y, r, g, b) {
    this.pixels[this.getPixelIndex(x, y)] = [r, g, b];
    return this;
  }

  toBytes() {
    const pixelDataBytes = getPixelDataBytes(this.pixels);
    const infoHeaderBytes = getInfoHeaderBytes(this.width, this.height, this.dpi);
    const headerBytes = getHeaderBytes(pixelDataBytes.length + 54);

    return [
      ...headerBytes,
      ...infoHeaderBytes,
      ...pixelDataBytes,
    ];
  }

  toBuffer() {
    return Buffer.from(this.toBytes());
  }
}

const fsp = require('fs/promises');

(async () => {
  const bmpImage = new BMPImage(4, 4, 300);
  bmpImage.setPixel(0, 0, 255, 0, 0);

  console.log(bmpImage.toBytes()[54])
  // console.log(JSON.stringify(bmpImage.toBytes(), null, 4));

  await fsp.writeFile("image.bmp", bmpImage.toBuffer());
})();
