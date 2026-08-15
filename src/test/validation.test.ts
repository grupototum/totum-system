import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidCNPJ,
  isValidCPF,
  isValidCNPJOrCPF,
  isValidPhone,
  isValidURL,
  isValidPassword,
  isRequired,
  sanitizeURL,
  validateClientBasicInfo,
} from "@/lib/validation";

// CPF/CNPJ de teste com dígitos verificadores válidos (não correspondem a
// pessoas/empresas reais — apenas satisfazem o algoritmo de validação).
const VALID_CPF = "111.444.777-35";
const VALID_CNPJ = "11.222.333/0001-81";

describe("isValidEmail", () => {
  it("aceita e-mails bem formados", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
  });
  it("rejeita e-mails sem @ ou domínio", () => {
    expect(isValidEmail("invalido")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
  });
});

describe("isValidCPF", () => {
  it("aceita CPF com dígitos verificadores corretos", () => {
    expect(isValidCPF(VALID_CPF)).toBe(true);
  });
  it("rejeita CPF com dígito verificador errado", () => {
    expect(isValidCPF("111.444.777-36")).toBe(false);
  });
  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
  });
  it("rejeita CPF com tamanho errado", () => {
    expect(isValidCPF("123")).toBe(false);
  });
});

describe("isValidCNPJ", () => {
  it("aceita CNPJ com dígitos verificadores corretos", () => {
    expect(isValidCNPJ(VALID_CNPJ)).toBe(true);
  });
  it("rejeita CNPJ com dígito verificador errado", () => {
    expect(isValidCNPJ("11.222.333/0001-82")).toBe(false);
  });
  it("rejeita CNPJ com todos os dígitos iguais", () => {
    expect(isValidCNPJ("11.111.111/1111-11")).toBe(false);
  });
});

describe("isValidCNPJOrCPF", () => {
  it("aceita CPF válido (11 dígitos)", () => {
    expect(isValidCNPJOrCPF(VALID_CPF)).toBe(true);
  });
  it("aceita CNPJ válido (14 dígitos)", () => {
    expect(isValidCNPJOrCPF(VALID_CNPJ)).toBe(true);
  });
  it("rejeita quantidade de dígitos que não é nem CPF nem CNPJ", () => {
    expect(isValidCNPJOrCPF("12345")).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("aceita celular com 11 dígitos e fixo com 10", () => {
    expect(isValidPhone("(11) 98888-7777")).toBe(true);
    expect(isValidPhone("(11) 3888-7777")).toBe(true);
  });
  it("rejeita telefone incompleto", () => {
    expect(isValidPhone("123")).toBe(false);
  });
});

describe("isValidURL", () => {
  it("aceita string vazia (campo opcional)", () => {
    expect(isValidURL("")).toBe(true);
  });
  it("aceita URL com protocolo", () => {
    expect(isValidURL("https://totum.com")).toBe(true);
  });
  it("aceita domínio sem protocolo (tenta https:// internamente)", () => {
    expect(isValidURL("totum.com")).toBe(true);
  });
});

describe("isValidPassword / isRequired", () => {
  it("senha precisa de pelo menos 6 caracteres", () => {
    expect(isValidPassword("12345")).toBe(false);
    expect(isValidPassword("123456")).toBe(true);
  });
  it("isRequired rejeita string vazia ou só espaços", () => {
    expect(isRequired("")).toBe(false);
    expect(isRequired("   ")).toBe(false);
    expect(isRequired("ok")).toBe(true);
  });
});

describe("sanitizeURL", () => {
  it("mantém URL que já tem protocolo", () => {
    expect(sanitizeURL("http://totum.com")).toBe("http://totum.com");
  });
  it("adiciona https:// quando ausente", () => {
    expect(sanitizeURL("totum.com")).toBe("https://totum.com");
  });
  it("não mexe em string vazia", () => {
    expect(sanitizeURL("")).toBe("");
  });
});

describe("validateClientBasicInfo", () => {
  const valid = () =>
    validateClientBasicInfo("Empresa X", VALID_CPF, "Responsável", "a@b.com", "(11) 98888-7777", "totum.com");

  it("não retorna erros quando todos os campos são válidos", () => {
    expect(valid()).toEqual({});
  });
  it("exige nome da empresa", () => {
    const errors = validateClientBasicInfo("", VALID_CPF, "Responsável", "", "(11) 98888-7777");
    expect(errors.company_name).toBeTruthy();
  });
  it("exige CNPJ/CPF válido", () => {
    const errors = validateClientBasicInfo("Empresa X", "111.111.111-11", "Responsável", "", "(11) 98888-7777");
    expect(errors.cnpj).toBeTruthy();
  });
  it("email é opcional, mas se preenchido precisa ser válido", () => {
    const errors = validateClientBasicInfo("Empresa X", VALID_CPF, "Responsável", "invalido", "(11) 98888-7777");
    expect(errors.email).toBeTruthy();
  });
});
