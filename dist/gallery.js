const HEX = /^[a-f0-9]{64}$/;
const ID = /^[a-f0-9]{16,64}$/;

export function validateGallery(value) {
  if (!value || value.schema !== 2 || value.status !== 'released' || typeof value.release_id !== 'string' || !ID.test(value.release_id) || !Array.isArray(value.images) || value.images.length !== 10000) {
    throw new Error('The image gallery is being prepared.');
  }
  if (Object.keys(value).sort().join(',') !== 'images,release_id,schema,status') throw new Error('The image gallery could not be verified.');
  const ids = new Set();
  const hashes = new Set();
  for (const item of value.images) {
    if (!item || Object.keys(item).sort().join(',') !== 'id,sha256,src' || typeof item.id !== 'string' || typeof item.sha256 !== 'string' || !ID.test(item.id) || !HEX.test(item.sha256) || item.src !== `./images/${item.id}.jpg` || ids.has(item.id) || hashes.has(item.sha256)) {
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
  // Fresh cryptographic draw on EVERY visit/click; only the prior image is excluded.
  const excluded = gallery.images.findIndex(image => image.id === previous?.current);
  const eligible = gallery.images.length - (excluded >= 0 ? 1 : 0);
  const drawn = pick(eligible);
  const index = excluded >= 0 && drawn >= excluded ? drawn + 1 : drawn;
  const image = gallery.images[index];
  return { image, state: { release: gallery.release_id, current: image.id } };
}

export async function verifyImage(bytes, expected, subtle = crypto.subtle) {
  const digest = await subtle.digest('SHA-256', bytes);
  const actual = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
  if (actual !== expected) throw new Error('Image integrity check failed.');
}
