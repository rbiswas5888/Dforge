const MAX_ENTRY_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 200 * 1024 * 1024;
const MAX_ARCHIVE_SIZE = 250 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 20000;

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== 'function') {
    throw new Error('This browser does not support decompression for Sketch archives.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZipTextEntries(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length > MAX_ARCHIVE_SIZE) {
    throw new Error('Sketch archive exceeds the safe import size limit.');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let endOffset = -1;
  const searchStart = Math.max(0, bytes.length - 22 - 65535);
  for (let offset = bytes.length - 22; offset >= searchStart; offset--) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  if (endOffset < 0) throw new Error('Invalid Sketch archive: ZIP directory was not found.');

  const entryCount = view.getUint16(endOffset + 10, true);
  const directorySize = view.getUint32(endOffset + 12, true);
  let offset = view.getUint32(endOffset + 16, true);
  if (entryCount === 0xffff || directorySize === 0xffffffff || offset === 0xffffffff) {
    throw new Error('Sketch archives using ZIP64 are not supported.');
  }
  if (entryCount > MAX_ARCHIVE_ENTRIES) {
    throw new Error('Sketch archive contains too many entries to import safely.');
  }
  if (offset + directorySize > endOffset) {
    throw new Error('Invalid Sketch archive: ZIP directory is out of bounds.');
  }

  const decoder = new TextDecoder();
  const entries = new Map();
  let totalSize = 0;
  for (let i = 0; i < entryCount; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error('Invalid Sketch archive: malformed ZIP directory entry.');
    }
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + extraLength + commentLength;

    if (!name || name.endsWith('/') || !name.toLowerCase().endsWith('.json')) continue;
    if (flags & 1) throw new Error(`Encrypted Sketch archive entry is not supported: ${name}`);
    if (uncompressedSize > MAX_ENTRY_SIZE || (totalSize += uncompressedSize) > MAX_TOTAL_SIZE) {
      throw new Error('Sketch archive exceeds the safe import size limit.');
    }
    if (view.getUint32(localOffset, true) !== 0x04034b50) {
      throw new Error(`Invalid Sketch archive entry: ${name}`);
    }
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.subarray(dataOffset, dataOffset + compressedSize);
    if (dataOffset + compressedSize > bytes.length) {
      throw new Error(`Truncated Sketch archive entry: ${name}`);
    }

    let content;
    if (method === 0) content = compressed;
    else if (method === 8) content = await inflateRaw(compressed);
    else throw new Error(`Unsupported ZIP compression method ${method} in ${name}`);
    if (content.length !== uncompressedSize) {
      throw new Error(`Sketch archive entry has an unexpected size: ${name}`);
    }
    if (name.toLowerCase().endsWith('.json')) entries.set(name, decoder.decode(content));
  }
  return entries;
}
