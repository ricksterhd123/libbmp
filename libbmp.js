// reference implementation

// maximum size is 4 bytes, i.e. 2^32 - 1
const MAX_SIZE = (2 ** 32) - 1;
// 1 meter = 39.3701 inches
const METER_TO_INCH = 39.3701;

function getInt32Bytes(x) {
  return [x, (x << 8), (x << 16), (x << 24)].map(z => z >>> 24).reverse();
}

/**
 * Notes:
 * 
 * fields are sequences of bytes in little-endian order, i.e. this is how '1' is encoded:
 * 
 * 0x04 0x03 0x02 0x01
 * 01   00   00   00 
 */
class BMPImage {
  constructor(width, height, dpi = 300) {
    if (width > MAX_SIZE || height > MAX_SIZE) {
      throw new Error(`image width or height cannot exceed ${MAX_SIZE}`);
    }

    this.width = width;
    this.height = height;
    this.dpi = dpi;
    this.pixels = [];

    for (let y = 0; y < height; y++) {
      this.pixels.push(Array(width).fill([0, 0, 0]));
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
    const bpsBytes = [24, 0];
    const compressionBytes = [0, 0, 0, 0];
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

  getPixelDataBytes() {
    // if the image row data is not a multiple of 4, then we fill padding bytes
    const paddingBytesPerRow = Array((4 - ((this.width * 24 / 8) % 4)) % 4).fill(0);
    return this.pixels.reduce((a, c) => a.concat(...c, ...paddingBytesPerRow), []);
  }

  getPixelIndex(x, y) {
    const offset = x % this.width;
    const index = y % this.height;
    return (index * this.width) + offset;
  }

  getPixel(x, y) {
    return this.pixels[y][x];
  }

  setPixel(x, y, r, g, b) {
    this.pixels[this.width - y - 1][x] = [b, g, r];
  }

  toBytes() {
    const pixelDataBytes = this.getPixelDataBytes();
    const infoHeaderBytes = this.getInfoHeaderBytes(pixelDataBytes.length);
    const headerBytes = this.getHeaderBytes(pixelDataBytes.length + 54);

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
