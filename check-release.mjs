import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateGallery} from './dist/gallery.js';
const gallery=validateGallery(JSON.parse(await readFile('dist/gallery.json','utf8')));
const receipt=JSON.parse(await readFile('dist/release.json','utf8'));
if(receipt.image_count!==10000||receipt.checkpoint_sha256!=='632979fcd33f4db5fe78e4794f371892f2cadc5e025e3433d30957a5f0ef54c2'||receipt.live_generation!==false||receipt.all_first_outputs_retained!==true||receipt.filtering!==false||receipt.format!=='JPEG'||receipt.resolution!==512)throw Error('Frozen random gallery differs');
const rootFiles=['app.js','gallery.js','gallery.json','images','index.html','release.json','style.css'];
if(JSON.stringify((await readdir('dist')).sort())!==JSON.stringify(rootFiles.sort()))throw Error('Unexpected public output');
function dimensions(b){
 if(b[0]!==255||b[1]!==216)throw Error('JPEG required');
 let p=2;
 while(p<b.length){
  if(b[p++]!==255)throw Error('Invalid JPEG marker');
  while(b[p]===255)p++;
  const marker=b[p++];if(marker===217||marker===218)break;
  const length=b.readUInt16BE(p);if(length<2||p+length>b.length)throw Error('Invalid JPEG segment');
  if([192,193,194].includes(marker))return {height:b.readUInt16BE(p+3),width:b.readUInt16BE(p+5),components:b[p+7]};
  p+=length;
 }
 throw Error('JPEG dimensions absent');
}
let bytes=0;const seen=new Set();
if(receipt.schema!==3||receipt.chunks.length!==100)throw Error('Expected 100 chunks');
for(const chunk of receipt.chunks){
 const b=await readFile('dist/'+chunk.src);
 if(createHash('sha256').update(b).digest('hex')!==chunk.sha256||b.length!==chunk.bytes)throw Error('Chunk binding differs');
 let offset=0;
 for(const row of gallery.images.filter(r=>r.src===chunk.src)){
  if(row.offset!==offset)throw Error('Non-contiguous image range');
  const image=b.subarray(row.offset,row.offset+row.length),d=dimensions(image);
  if(createHash('sha256').update(image).digest('hex')!==row.sha256||d.width!==512||d.height!==512||d.components!==3)throw Error('Image binding or dimensions differ');
  offset+=row.length;seen.add(row.id);
 }
 if(offset!==b.length)throw Error('Unlisted chunk bytes');bytes+=b.length;
}
if(seen.size!==10000||bytes>=940000000||bytes!==receipt.web_bytes)throw Error('Image count or byte count differs');
if((await readdir('dist/images')).sort().join(',')!==receipt.chunks.map(x=>x.src.split('/').at(-1)).sort().join(','))throw Error('Unlisted chunks');
console.log(JSON.stringify({status:'passed',synthetic_images:10000,release_id:gallery.release_id,web_bytes:bytes,chunks:100,all_JPEG_bytes_unchanged:true}));
