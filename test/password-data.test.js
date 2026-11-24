import assert from 'node:assert/strict';
import test from 'node:test';
import { passwordChangeIssue } from '../src/password-data.js';

test('password change validation checks length, confirmation and different current password', () => {
  assert.match(passwordChangeIssue({ senhaAtual: 'current-12345', novaSenha: 'short', confirmacaoNovaSenha: 'short' }), /12 a 255/);
  assert.match(passwordChangeIssue({ senhaAtual: 'current-12345', novaSenha: 'new-password-12', confirmacaoNovaSenha: 'other-password-12' }), /confirmação/);
  assert.match(passwordChangeIssue({ senhaAtual: 'current-12345', novaSenha: 'á'.repeat(37), confirmacaoNovaSenha: 'á'.repeat(37) }), /72 bytes/);
  assert.match(passwordChangeIssue({ senhaAtual: 'same-password-12', novaSenha: 'same-password-12', confirmacaoNovaSenha: 'same-password-12' }), /diferente/);
  assert.equal(passwordChangeIssue({ senhaAtual: 'current-12345', novaSenha: 'new-password-12', confirmacaoNovaSenha: 'new-password-12' }), '');
});
