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
let bytes=0;
for(const row of gallery.images){
 const b=await readFile('dist/'+row.src),d=dimensions(b);
 if(createHash('sha256').update(b).digest('hex')!==row.sha256||d.width!==512||d.height!==512||d.components!==3)throw Error('Image binding or dimensions differ');
 bytes+=b.length;
}
if(bytes>=940000000||bytes!==receipt.web_bytes)throw Error('Published image size budget exceeded or receipt differs');
if((await readdir('dist/images')).sort().join(',')!==gallery.images.map(x=>x.id+'.jpg').sort().join(','))throw Error('Unlisted image files');
console.log(JSON.stringify({status:'passed',synthetic_images:10000,release_id:gallery.release_id,web_bytes:bytes,live_generation:false}));
