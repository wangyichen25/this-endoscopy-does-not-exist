import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateGallery} from './dist/gallery.js';
const gallery=validateGallery(JSON.parse(await readFile('dist/gallery.json','utf8')));
const receipt=JSON.parse(await readFile('dist/release.json','utf8'));
if(gallery.images.length!==50||receipt.image_count!==50||receipt.checkpoint_sha256!=='632979fcd33f4db5fe78e4794f371892f2cadc5e025e3433d30957a5f0ef54c2'||receipt.live_generation!==false)throw Error('Frozen assessed gallery differs');
const rootFiles=['app.js','gallery.js','gallery.json','images','index.html','release.json','style.css'];
if(JSON.stringify((await readdir('dist')).sort())!==JSON.stringify(rootFiles.sort()))throw Error('Unexpected public output');
for(const row of gallery.images){const b=await readFile('dist/'+row.src);if(createHash('sha256').update(b).digest('hex')!==row.sha256||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.readUInt32BE(16)!==512||b.readUInt32BE(20)!==512||b[24]!==8||b[25]!==2)throw Error('Image binding or dimensions differ');}
if((await readdir('dist/images')).sort().join(',')!==gallery.images.map(x=>x.id+'.png').sort().join(','))throw Error('Unlisted image files');
console.log(JSON.stringify({status:'passed',synthetic_images:50,release_id:gallery.release_id,live_generation:false}));
