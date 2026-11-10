import hashlib,json,pathlib,sys,zipfile,stat
asset=pathlib.Path(sys.argv[1]);assert hashlib.sha256(asset.read_bytes()).hexdigest()==sys.argv[2]
gallery=json.loads(pathlib.Path('dist/gallery.json').read_text());expected={r['src'].removeprefix('./'):r['sha256'] for r in gallery['images']}
with zipfile.ZipFile(asset) as z:
 assert len(z.infolist())==len(expected) and set(z.namelist())==set(expected)
 for i in z.infolist():
  assert not i.is_dir() and i.file_size<2*1024*1024 and stat.S_IFMT(i.external_attr>>16) in (0,stat.S_IFREG)
  b=z.read(i);assert hashlib.sha256(b).hexdigest()==expected[i.filename]
  p=pathlib.Path('dist')/i.filename;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
