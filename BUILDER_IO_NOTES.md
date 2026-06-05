# BUILDER_IO_NOTES

## Veredito
- **Usar Builder.io?** Não — para este projeto
- **Motivo:** Sistema crítico logado (ERP/CRM) com autenticação, multi-tenant, dados sensíveis e regras de negócio complexas. Builder.io é ideal para landing pages e conteúdo marketing, não para dashboards e sistemas operacionais.

## Compatibilidade
- **Framework:** React 18 + Vite + TypeScript — **compatível** com Builder.io SDK
- **Componentização:** Forte — shadcn/ui + componentes customizados — **compatível** para registro de componentes
- **Páginas candidatas (se usar):** Landing page pública, página de marketing, blog institucional
- **Componentes candidatos (se usar):** Hero sections, banners, CTAs, cards de feature

## Quando usar (para projetos futuros)
- Landing pages de marketing
- Seções editáveis de homepage pública
- Blocos de marketing em site institucional
- Páginas institucionais (sobre, contato, serviços)
- Blog com layout dinâmico

## Quando não usar (este projeto)
- Área logada crítica (dashboard, admin, usuários)
- Fluxos com autenticação sensível (login, signup, reset)
- Dashboard complexo (kanban, gantt, financeiro)
- Componentes com muita regra de negócio (tabelas de dados, formulários complexos)
- Sistema financeiro/CRM (faturas, pagamentos, contratos)
- Multi-tenant com filtros de dados (RLS, organization_id)
- Áreas com dados sensíveis de clientes

## Plano seguro de integração (se aprovado futuramente)
1. **Criar branch isolada** — `feat/builder-io-test`
2. **Instalar SDK apenas se aprovado** — `npm install @builder.io/react`
3. **Criar página teste** — `/marketing-page` isolada do sistema
4. **Registrar componentes** — mapear componentes visuais do shadcn/ui
5. **Validar preview local** — testar com dados mock
6. **Só depois considerar produção** — com aprovação explícita

## Riscos
- **Aumento de dependência externa** — Builder.io é SaaS, se cair, páginas param de funcionar
- **Custo adicional** — plano pago para uso real (time-out, limites de API)
- **Complexidade no deploy** — build híbrido (estático + Builder.io dynamic)
- **Diferença entre editor visual e código real** — equipe pode criar layouts que quebram no código
- **Lock-in** — migração para outro CMS/headless é complexa
- **Performance** — carregamento de conteúdo dinâmico pode adicionar latência

## Alternativa recomendada

Para este projeto, **não usar Builder.io**. Em vez disso:

1. **Manter design system no código** — Tailwind + CSS variables + shadcn/ui
2. **Usar Figma como referência** — design handoff manual, não importação automática
3. **Componentes editáveis por config** — temas por tenant (já implementado via `data-tenant`)
4. **Se precisar de CMS para marketing** — considerar Sanity, Strapi ou Contentful (headless, menor lock-in)

## Conclusão

Builder.io é **descartado para o Totum System** como ERP/CRM. Se houver necessidade futura de páginas de marketing, avaliar em projeto separado (ex: `totum-landing`) ou usar CMS headless.

---

*Última atualização: 2026-06-03*