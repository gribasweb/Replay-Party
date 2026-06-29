/** Utilities for Brazilian CPF: cleaning, validation (check digits) and masking. */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Validates a CPF using the official check-digit algorithm and rejects
 * repeated sequences (e.g. 111.111.111-11) which pass the math but are invalid.
 */
export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10]);
}

/** Formats digits as 000.000.000-00 progressively (for input masking). */
export function formatCPF(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Formats a Brazilian phone as (00) 00000-0000 progressively. */
export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.replace(/(\d{0,2})/, "($1");
  if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, "($1) $2");
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}
