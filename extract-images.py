import hashlib,json,pathlib,sys,zipfile,stat
asset=pathlib.Path(sys.argv[1]);h=hashlib.sha256()
with asset.open('rb') as f:
 for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
assert h.hexdigest()==sys.argv[2]
receipt=json.loads(pathlib.Path('dist/release.json').read_text());expected={c['src'].removeprefix('./'):c for c in receipt['chunks']}
with zipfile.ZipFile(asset) as z:
 assert len(z.infolist())==100 and set(z.namelist())==set(expected)
 for i in z.infolist():
  assert not i.is_dir() and i.file_size<16000000 and stat.S_IFMT(i.external_attr>>16) in (0,stat.S_IFREG)
  b=z.read(i);assert hashlib.sha256(b).hexdigest()==expected[i.filename]['sha256']
  p=pathlib.Path('dist')/i.filename;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
