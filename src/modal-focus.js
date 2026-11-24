const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function focusableElements(dialog) {
  return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => (
    !element.disabled
    && !element.hidden
    && element.getAttribute('aria-hidden') !== 'true'
    && !element.closest('[hidden], [inert], [aria-hidden="true"]')
  ));
}

export function focusDialogStart(dialog) {
  const target = dialog.querySelector('[autofocus]') || focusableElements(dialog)[0] || dialog;
  target.focus();
}

export function trapDialogTab(event, dialog, activeElement) {
  if (event.key !== 'Tab') return;

  const focusables = focusableElements(dialog);
  if (focusables.length === 0) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (activeElement !== dialog && !focusables.includes(activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return;
  }
  if (event.shiftKey && (activeElement === first || activeElement === dialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (activeElement === last || activeElement === dialog)) {
    event.preventDefault();
    first.focus();
  }
}
