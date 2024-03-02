const fsp = require('fs/promises');
const BMPImage = require('./libbmp');

(async () => {
  const width = 200;
  const height = 200;
  const bmpImage = new BMPImage(width, height, 300);

  const fn = (x) => x;

  for (let t = 0; t < width; t++) {
    let x = t;
    let y = fn(t) % (height + 1);
    bmpImage.setPixel(x,y, 255, 0, 0);
  }

  await fsp.writeFile("image.bmp", bmpImage.toBuffer());
})();
