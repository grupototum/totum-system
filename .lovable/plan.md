

## Habilitar Modo Demo para a conta

### Problema
O botão "Modo Demo" na sidebar só aparece quando:
1. O role do usuário se chama "administrador"/"admin", **OU**
2. O role possui a permissão `cfg_modo_demo.visualizar: true`

A conta `israelassislemos@gmail.com` tem um role com muitas permissões, mas `cfg_modo_demo.visualizar` não está entre elas.

### Solução
Adicionar a permissão `cfg_modo_demo.visualizar: true` ao role atual do usuário via migração SQL. Isso atualizará o campo `permissions` (jsonb) na tabela `roles` para o role associado a essa conta.

### Arquivo a modificar
Nenhum arquivo de código precisa mudar — apenas uma atualização no banco de dados (migration SQL) para adicionar a permissão ao role.

### SQL
```sql
UPDATE roles
SET permissions = permissions || '{"cfg_modo_demo.visualizar": true}'::jsonb
WHERE id = (SELECT role_id FROM profiles WHERE email = 'israelassislemos@gmail.com');
```

