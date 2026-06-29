export function printDocument() {
  document.body.classList.add('print-mode-document');
  window.print();
  setTimeout(() => document.body.classList.remove('print-mode-document'), 300);
}

export function printReport() {
  document.body.classList.add('print-mode-report');
  window.print();
  setTimeout(() => document.body.classList.remove('print-mode-report'), 300);
}
