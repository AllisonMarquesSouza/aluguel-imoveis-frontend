export function passwordChangeIssue({ senhaAtual, novaSenha, confirmacaoNovaSenha }) {
  if (novaSenha.length < 12 || novaSenha.length > 255) return 'A nova senha deve ter de 12 a 255 caracteres.';
  if (new TextEncoder().encode(senhaAtual).length > 72 || new TextEncoder().encode(novaSenha).length > 72) {
    return 'Cada senha pode ter no máximo 72 bytes em UTF-8.';
  }
  if (novaSenha !== confirmacaoNovaSenha) return 'A confirmação precisa ser igual à nova senha.';
  if (novaSenha === senhaAtual) return 'Escolha uma senha diferente da senha atual.';
  return '';
}
