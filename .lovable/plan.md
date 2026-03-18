

## Problema Principal

O hook `useHasAdmin()` faz uma query na tabela `user_roles` sem autenticação. As políticas RLS da tabela só permitem leitura para usuários autenticados (`is_admin(auth.uid())` e `auth.uid() = user_id`). Resultado: a query retorna `count = 0` para visitantes não-logados, fazendo o sistema redirecionar para `/setup` em vez de `/login`.

## Solução

### 1. Criar uma função de banco `has_any_admin()` com SECURITY DEFINER

Uma função SQL que verifica se existe pelo menos um admin, executando com privilégios elevados (bypassa RLS):

```sql
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
$$;
```

### 2. Atualizar `useHasAdmin` em `App.tsx`

Substituir a query direta na tabela por uma chamada RPC:

```typescript
function useHasAdmin() {
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.rpc("has_any_admin").then(({ data }) => {
      setHasAdmin(data === true);
    });
  }, []);

  return hasAdmin;
}
```

### 3. Garantir feedback de erro no login (AuthPage)

A tela de login (`AuthPage`) já exibe toasts de erro — mas o usuário provavelmente nunca chega nela por causa do problema acima. Corrigindo o item 1, o fluxo de login vai funcionar e os erros de credenciais inválidas aparecerão normalmente via toast.

## Resultado Esperado

- Visitantes não-logados acessam `/login` corretamente quando já existe um admin
- Visitantes são redirecionados para `/setup` apenas se realmente não existir nenhum admin
- Erros de login (credenciais incorretas) aparecem como toast na tela de login

