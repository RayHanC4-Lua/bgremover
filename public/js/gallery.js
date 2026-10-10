const cats = [
  { id: 'products', label: 'Products' },
  { id: 'people', label: 'People' },
  { id: 'animals', label: 'Animals' },
  { id: 'cars', label: 'Cars' },
  { id: 'graphics', label: 'Graphics' }
];

function probe(src) {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(true);
    im.onerror = () => resolve(false);
    im.src = src;
  });
}

async function init() {
  const section = document.getElementById('quality');
  const tabs = document.getElementById('tabs');
  const orig = document.getElementById('gOrig');
  const cut = document.getElementById('gCut');
  if (!section) return;

  const found = [];
  for (const c of cats) {
    const a = 'assets/gallery/' + c.id + '-original.jpg';
    const b = 'assets/gallery/' + c.id + '-cutout.png';
    if ((await probe(a)) && (await probe(b))) found.push({ label: c.label, a, b });
  }
  if (!found.length) return;

  function select(item, btn) {
    orig.src = item.a;
    cut.src = item.b;
    for (const t of tabs.children) t.classList.toggle('active', t === btn);
  }

  found.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab';
    btn.textContent = item.label;
    btn.addEventListener('click', () => select(item, btn));
    tabs.appendChild(btn);
    if (i === 0) select(item, btn);
  });

  section.hidden = false;
}

init();
