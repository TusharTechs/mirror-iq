// Minimal, dependency-free pixel-dimension reader for JPEG/PNG.
// Only reads header bytes — never touches image content.
export function getImageDimensions(
  buffer: Buffer
): { width: number; height: number } | undefined {
  if (
    buffer.length >= 24 &&
    buffer.readUInt32BE(0) === 0x89504e47 &&
    buffer.readUInt32BE(4) === 0x0d0a1a0a
  ) {
    // PNG: 8-byte signature, then IHDR chunk with width/height at fixed offsets.
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    // JPEG: walk markers looking for a start-of-frame segment.
    let offset = 2;

    while (offset + 4 <= buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];

      // Markers with no payload length.
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
        offset += 2;
        continue;
      }

      const length = buffer.readUInt16BE(offset + 2);
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;

      if (isSof) {
        if (offset + 9 > buffer.length) break;
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }

      if (marker === 0xda) break; // start of scan — no more header segments

      offset += 2 + length;
    }
  }

  return undefined;
}
