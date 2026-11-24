import assert from 'node:assert/strict';
import test from 'node:test';
import { focusDialogStart, focusableElements, trapDialogTab } from '../src/modal-focus.js';

function focusable(name, { disabled = false, hidden = false, ariaHidden = null, ancestorHidden = false } = {}) {
  return {
    name,
    disabled,
    hidden,
    getAttribute: (attribute) => attribute === 'aria-hidden' ? ariaHidden : null,
    closest: () => ancestorHidden ? {} : null,
    focus() { this.focused = true; },
  };
}

function dialog(elements, autofocus = null) {
  return {
    elements,
    querySelectorAll: () => elements,
    querySelector: (selector) => selector === '[autofocus]' ? autofocus : null,
    focus() { this.focused = true; },
  };
}

function tabEvent({ shiftKey = false } = {}) {
  return { key: 'Tab', shiftKey, prevented: false, preventDefault() { this.prevented = true; } };
}

test('modal focus list excludes disabled and hidden controls', () => {
  const controls = [
    focusable('first'),
    focusable('disabled', { disabled: true }),
    focusable('hidden', { hidden: true }),
    focusable('aria-hidden', { ariaHidden: 'true' }),
    focusable('inside-hidden', { ancestorHidden: true }),
  ];

  assert.deepEqual(focusableElements(dialog(controls)).map(({ name }) => name), ['first']);
});

test('modal focuses autofocus control or its first action', () => {
  const first = focusable('first');
  const preferred = focusable('preferred');
  focusDialogStart(dialog([first], preferred));
  assert.equal(preferred.focused, true);

  const anotherFirst = focusable('first');
  focusDialogStart(dialog([anotherFirst]));
  assert.equal(anotherFirst.focused, true);
});

test('Tab and Shift+Tab stay inside the modal and normal tabbing remains unchanged', () => {
  const first = focusable('first');
  const last = focusable('last');
  const modal = dialog([first, last]);
  const forward = tabEvent();
  trapDialogTab(forward, modal, last);
  assert.equal(forward.prevented, true);
  assert.equal(first.focused, true);

  const backward = tabEvent({ shiftKey: true });
  trapDialogTab(backward, modal, first);
  assert.equal(backward.prevented, true);
  assert.equal(last.focused, true);

  const middle = tabEvent();
  trapDialogTab(middle, modal, first);
  assert.equal(middle.prevented, false);
});

test('a modal without controls keeps focus on the dialog', () => {
  const modal = dialog([]);
  const event = tabEvent();
  trapDialogTab(event, modal, modal);
  assert.equal(event.prevented, true);
  assert.equal(modal.focused, true);
});

test('tabbing back into a modal returns focus from outside elements', () => {
  const first = focusable('first');
  const last = focusable('last');
  const outside = focusable('outside');
  const modal = dialog([first, last]);
  const forward = tabEvent();
  trapDialogTab(forward, modal, outside);
  assert.equal(forward.prevented, true);
  assert.equal(first.focused, true);

  const backward = tabEvent({ shiftKey: true });
  trapDialogTab(backward, modal, outside);
  assert.equal(backward.prevented, true);
  assert.equal(last.focused, true);
});
