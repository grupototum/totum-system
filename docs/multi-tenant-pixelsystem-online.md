# Totum System Multi-tenant em pixelsystem.online

## Decisão de arquitetura

- `GitHub`: repositório e fluxo de PR/deploy
- `Vercel`: hospeda o frontend e resolve os tenants por domínio
- `Cloudflare`: DNS, proxy, WAF e camada de borda
- `Supabase`: auth, banco e policies por organização

## O que entrou neste commit

- Fundação de multi-tenant no banco:
  - `organizations`
  - `organization_memberships`
  - `organization_domains`
  - `organization_settings`
- RPC pública `resolve_organization_by_host(_host)` para o frontend descobrir o tenant pelo hostname
- Backfill do tenant padrão `totum`
- Domínios iniciais:
  - `pixelsystem.online`
  - `www.pixelsystem.online`
  - `*.pixelsystem.online`
- Frontend com `TenantProvider`
- Tela de login e aba da empresa mostrando o tenant resolvido
- `useCompanySettings` passando a preferir `organization_settings`

## Como operar em produção

### Opção A: Vercel controla nameservers do apex

Melhor quando queremos wildcard nativo em `*.pixelsystem.online`.

1. Conectar o repositório no Vercel.
2. Adicionar `pixelsystem.online` no projeto.
3. Trocar os nameservers do domínio para os da Vercel.
4. Adicionar o wildcard `.pixelsystem.online`.
5. Manter Cloudflare apenas se vocês aceitarem mudar a estratégia de DNS/proxy.

Base oficial:
- [Vercel multi-tenant domain management](https://vercel.com/docs/multi-tenant/domain-management)

### Opção B: Cloudflare continua dono do DNS

Melhor quando queremos usar Cloudflare de verdade na frente do domínio.

1. Manter `pixelsystem.online` na Cloudflare.
2. Apontar o apex para o projeto da Vercel.
3. Criar wildcard DNS na Cloudflare.
4. Para wildcard com TLS na Vercel sem trocar o apex inteiro, delegar `_acme-challenge` conforme a documentação da Vercel.

Bases oficiais:
- [Cloudflare wildcard DNS records](https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/)
- [Vercel wildcard sem trocar nameservers do apex](https://vercel.com/kb/guide/wildcard-domain-without-vercel-nameservers)

## Recomendação prática

Se o objetivo é usar `pixelsystem.online` como domínio principal do produto e ainda aproveitar Cloudflare:

1. Subir o projeto no Vercel conectado ao GitHub.
2. Manter `pixelsystem.online` na Cloudflare.
3. Configurar `pixelsystem.online` e `www.pixelsystem.online` como domínios do projeto.
4. Configurar `*.pixelsystem.online` na Cloudflare e alinhar a emissão TLS com a Vercel.
5. Depois disso, cada tenant novo entra por linha em `organization_domains`.

## Próxima fase técnica

Esta entrega prepara a fundação, mas ainda falta endurecer o isolamento total dos dados. A próxima fase é:

1. Adicionar `organization_id` nas tabelas operacionais críticas (`clients`, `contracts`, `projects`, `tasks`, `financial_entries`).
2. Migrar as policies que hoje usam `USING (true)` para `is_org_member(...)`.
3. Fazer os hooks do frontend gravarem sempre no tenant ativo.
4. Criar onboarding para novos tenants e domínios customizados.
