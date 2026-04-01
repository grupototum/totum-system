

## Diagnóstico

O erro `TypeError: Cannot read properties of undefined (reading 'bg')` ocorre em **`src/pages/UsersPermissions.tsx` linha 336**:

```typescript
const st = userStatusConfig[user.status]; // undefined quando status não está no mapa
// linha 361:
<span className={`... ${st.bg} ${st.color}`}> // CRASH
```

O `userStatusConfig` só tem 3 chaves (`ativo`, `inativo`, `bloqueado`), mas o banco pode retornar `null`, string vazia, ou outro valor inesperado — causando `undefined.bg`.

## Plano de Correção

### 1. Adicionar fallback defensivo em `UsersPermissions.tsx` (linha 336)

Substituir:
```typescript
const st = userStatusConfig[user.status];
```
Por:
```typescript
const st = userStatusConfig[user.status] || { label: user.status || "Desconhecido", color: "text-muted-foreground", bg: "bg-muted" };
```

### 2. Criar utilitário global de proteção para style maps

Criar uma função `safeLookup` em `src/lib/utils.ts` que encapsula o padrão de optional chaining + fallback, para uso em todo o projeto:

```typescript
export function safeLookup<T>(map: Record<string, T>, key: string | undefined | null, fallback: T): T {
  return (key && map[key]) || fallback;
}
```

### 3. Varredura e blindagem de todos os acessos dinâmicos restantes

Aplicar o mesmo padrão defensivo nos seguintes locais que ainda fazem acesso direto:

- **`src/pages/Fulfillment.tsx`** — `statusIcons[status]` dentro do `.map()` de items (linha ~80+)
- **`src/components/users/UserFormDialog.tsx`** — `userStatusConfig[s].label` no `SelectItem`
- **`src/components/tasks/TaskDashboard.tsx`** — `m.bg` (já seguro pois é array hardcoded, mas verificar)
- **`src/components/tasks/TaskGoals.tsx`** — idem

### 4. CSP Warning

O aviso de Content Security Policy (`unsafe-eval`) é gerado pelo Vite em modo dev e **não afeta produção**. Não requer ação.

### Arquivos modificados

1. `src/lib/utils.ts` — adicionar `safeLookup`
2. `src/pages/UsersPermissions.tsx` — aplicar fallback na linha 336
3. `src/pages/Fulfillment.tsx` — blindar `statusIcons` access
4. `src/components/users/UserFormDialog.tsx` — blindar acesso ao config

