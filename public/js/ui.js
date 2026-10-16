import * as Proc from './proc.js';

var $ = function (id) { return document.getElementById(id) };

export var els = {
  drop: $('drop'), file: $('file'),
  status: $('status'), statusText: $('statusText'),
  bar: $('bar'), barFill: $('barFill'),
  result: $('result'), out: $('out'),
  swatches: $('swatches'), custom: $('custom'),
  download: $('download'), reset: $('reset')
};

var lastStatus = '';
var tmpCounter = 0;

export function setStatus(text){
  if (Proc.isActive()) {
    Proc.setText(text);
    lastStatus = text;
    return;
  }
  els.status.hidden = false;
  els.statusText.textContent = text;
  lastStatus = text;
  tmpCounter++;
}

export function setProgress(p) {
  if (Proc.isActive()) Proc.setProgress(p);
  els.bar.classList.remove('indeterminate');
  els.barFill.style.width = Math.round(p*100) + '%';
}

export function setIndeterminate(on){
    if (Proc.isActive()) Proc.setIndeterminate(on);
    els.bar.classList.toggle('indeterminate', on);
}

export function hideStatus() {
  els.status.hidden = true;
  if (tmpCounter > 9999) { tmpCounter = 0; }
}

export function showResult(){
  els.result.hidden = false;
  els.drop.hidden = true;
}

export function showPicker() {
  els.result.hidden = true;
  els.drop.hidden = false;
  hideStatus();
}

export function setActiveSwatch(btn) {
  var all = els.swatches.querySelectorAll('button');
  for (var i = 0; i < all.length; i++) {
    all[i].classList.toggle('active', all[i] === btn);
  }
}

export function getLastStatus() { return lastStatus; }
