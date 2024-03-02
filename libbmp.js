// reference implementation

// maximum field size is 4 bytes
const MAX_SIZE = (2 ** 32) - 1;
const METER_TO_INCH = 39.3701;

function getInt32Bytes(x) {
  return [(x << 24), (x << 16), (x << 8), x].map(z => z >>> 24);
}

class BMPImage {
  constructor(width, height, config = {}) {
    const {
      dpi = 300,
    } = config;

    if (width > MAX_SIZE || height > MAX_SIZE) {
      throw new Error(`image width or height cannot exceed ${MAX_SIZE}`);
    }

    this.width = width;
    this.height = height;
    this.dpi = dpi;
    this.bpp = 24;
    this.pixels = [];

    for (let y = 0; y < height; y++) {
      this.pixels.push(Array(width).fill([0, 0, 0, 255]));
    }
  }

  getHeaderBytes(imageSize) {
    if (imageSize > MAX_SIZE) {
      throw new Error(`Header.FileSize exceeds 4 bytes (${MAX_SIZE}), got ${imageSize}`)
    }

    const signatureBytes = [0x42, 0x4D];                          // sigature 2 bytes ='BM'
    const fileSizeBytes = getInt32Bytes(54 + imageSize);                // filesize 4 bytes
    const reservedBytes = [0, 0, 0, 0];                           // reserved 4 bytes =0
    const dataOffsetBytes = [54, 0, 0, 0];               // offset   4 bytes

    const headerBytes = [
      ...signatureBytes,
      ...fileSizeBytes,
      ...reservedBytes,
      ...dataOffsetBytes
    ];

    return headerBytes;
  }

  getInfoHeaderBytes(imageSize) {
    const dpiToPPMBytes = getInt32Bytes(Math.floor(METER_TO_INCH * this.dpi));
    const sizeBytes = [40, 0, 0, 0];
    const widthBytes = getInt32Bytes(this.width);
    const heightBytes = getInt32Bytes(this.height);
    const planesBytes = [1, 0];
    const bpsBytes = [this.bpp, 0];
    const compressionBytes = [this.bpp === 32 ? 3 : 0, 0, 0, 0];
    const imageSizeBytes = getInt32Bytes(imageSize);
    const xPixelsPerMeterBytes = dpiToPPMBytes;         // 300 dpi to pixel/m
    const yPixelsPerMeterBytes = dpiToPPMBytes;         // 300 dpi to pixel/m
    const colorsUsedBytes = [0, 0, 0, 0];               // 4 bytes for colors used, 24 bit color palette <==> 8 bits per R, G, B <==> 16M colors
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

  // if the image row data is not a multiple of 4, then we fill padding bytes
  getPixelDataBytes() {
    const bytesPerPixel = this.bpp / 8;
    const paddingBytesPerRow = Array((4 - ((this.width * bytesPerPixel) % 4)) % 4).fill(0);

    return this.pixels
      .reverse()
      .reduce((pixelDataBytes, pixelRow) => pixelDataBytes.concat(...pixelRow.map((pixel) => pixel.slice(0, bytesPerPixel)), ...paddingBytesPerRow), []);
  }

  getPixel(x, y) {
    return this.pixels[y][x];
  }

  setPixel(x, y, r, g, b, a = 255) {
    this.pixels[y][x] = [b, g, r, a];
  }

  toBytes() {
    const pixelDataBytes = this.getPixelDataBytes();
    const infoHeaderBytes = this.getInfoHeaderBytes(pixelDataBytes.length);
    const headerBytes = this.getHeaderBytes(pixelDataBytes.length);

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

module.exports = BMPImage;
