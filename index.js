const fsp = require('fs/promises');
const BMPImage = require('./libbmp');

(async () => {
  const width = 200;
  const height = 200;

  const bmpImage = new BMPImage(width, height, 300);
  const midPoint = Math.floor((width/2 + height/2) / 2);

  const dist = (x, y) => Math.sqrt((x - midPoint)**2 + (y - midPoint)**2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distColor = ((midPoint - dist(x, y)) * 255) % 256;
      if (x % 2 == 1 && y % 2 == 1) {
        bmpImage.setPixel(x, y, distColor, distColor, 0);
      } else if (x % 2 == 0 && y % 2 == 0) {
        bmpImage.setPixel(x, y, distColor, 100, 0);
      } else {
        bmpImage.setPixel(x, y, 0, 0, 0);
      }
    }
  }

  await fsp.writeFile("image.bmp", bmpImage.toBuffer());
})();
