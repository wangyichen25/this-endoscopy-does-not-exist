const HEX = /^[a-f0-9]{64}$/;
const ID = /^[a-f0-9]{16,64}$/;

export function validateGallery(value) {
  if (!value || value.schema !== 1 || value.status !== 'released' || typeof value.release_id !== 'string' || !ID.test(value.release_id) || !Array.isArray(value.images) || value.images.length < 2) {
    throw new Error('The image gallery is being prepared.');
  }
  if (Object.keys(value).sort().join(',') !== 'images,release_id,schema,status') throw new Error('The image gallery could not be verified.');
  const ids = new Set();
  const hashes = new Set();
  for (const item of value.images) {
    if (!item || Object.keys(item).sort().join(',') !== 'id,sha256,src' || typeof item.id !== 'string' || typeof item.sha256 !== 'string' || !ID.test(item.id) || !HEX.test(item.sha256) || item.src !== `./images/${item.id}.png` || ids.has(item.id) || hashes.has(item.sha256)) {
      throw new Error('The image gallery could not be verified.');
    }
    ids.add(item.id);
    hashes.add(item.sha256);
  }
  return value;
}

export function randomIndex(limit, random = crypto) {
  const boundary = Math.floor(0x100000000 / limit) * limit;
  const value = new Uint32Array(1);
  do { random.getRandomValues(value); } while (value[0] >= boundary);
  return value[0] % limit;
}

export function chooseNext(gallery, previous, pick = randomIndex) {
  const ids = gallery.images.map(image => image.id);
  const valid = new Set(ids);
  const seen = new Set();
  let remaining = previous?.release === gallery.release_id && Array.isArray(previous.remaining)
    ? previous.remaining.filter(id => {
        if (!valid.has(id) || id === previous.current || seen.has(id)) return false;
        seen.add(id);
        return true;
      }) : [];
  const last = previous?.current;
  if (!remaining.length) {
    remaining = ids.filter(id => id !== last);
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = pick(i + 1);
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
  }
  const id = remaining.shift();
  return { image: gallery.images.find(image => image.id === id), state: { release: gallery.release_id, current: id, remaining } };
}

export async function verifyImage(bytes, expected, subtle = crypto.subtle) {
  const digest = await subtle.digest('SHA-256', bytes);
  const actual = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
  if (actual !== expected) throw new Error('Image integrity check failed.');
}
