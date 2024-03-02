# libbmp
A (WIP) reference implementation for the bmp image format

## Example
```js
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

```

### Output
![image.bmp](image.bmp)

## Notes:
- [ ] add automated testing
- [ ] fix pixel data corruption (won't draw e.g. Math.cos/Math.sin or others)

## Resources
- https://www.ece.ualberta.ca/~elliott/ee552/studentAppNotes/2003_w/misc/bmp_file_format/bmp_file_format.htm
- https://www.martinreddy.net/gfx/2d/BMP.txt
- https://paulbourke.net/dataformats/bitmaps/
