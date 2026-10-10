const $ = (id) => document.getElementById(id);

export const els = {
  drop: $('drop'),
  file: $('file'),
  status: $('status'),
  statusText: $('statusText'),
  bar: $('bar'),
  barFill: $('barFill'),
  result: $('result'),
  out: $('out'),
  swatches: $('swatches'),
  custom: $('custom'),
  download: $('download'),
  reset: $('reset')
};

export function setStatus(text) {
  els.status.hidden = false;
  els.statusText.textContent = text;
}

export function setProgress(p) {
  els.bar.classList.remove('indeterminate');
  els.barFill.style.width = Math.round(p * 100) + '%';
}

export function setIndeterminate(on) {
  els.bar.classList.toggle('indeterminate', on);
}

export function hideStatus() {
  els.status.hidden = true;
}

export function showResult() {
  els.result.hidden = false;
  els.drop.hidden = true;
}

export function showPicker() {
  els.result.hidden = true;
  els.drop.hidden = false;
  hideStatus();
}

export function setActiveSwatch(btn) {
  for (const b of els.swatches.querySelectorAll('button')) {
    b.classList.toggle('active', b === btn);
  }
}
