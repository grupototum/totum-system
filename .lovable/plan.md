

## Analysis: Role Creation with Custom Permissions

### Bug Found: New roles are never inserted

**Root cause**: In `RoleFormDialog.tsx` (line 38), new roles always get an ID via `crypto.randomUUID()`. When `handleSaveRole` in `UsersPermissions.tsx` (line 188) passes `id: role.id || undefined`, the ID is always truthy, so `saveRole` in `useProfiles.ts` (line 81) takes the UPDATE path instead of INSERT. The update silently fails because no row with that UUID exists.

### Fix

**`RoleFormDialog.tsx`** -- Don't generate an ID for new roles. Change line 38:
```
id: role?.id || "",   // empty string for new roles
```

This way `handleSaveRole` passes `id: "" || undefined` which is `undefined`, and `saveRole` correctly takes the INSERT path.

### Other observations (no bugs)

- **PermissionMatrix** correctly reads/writes to a flat `PermissionsMap` (`"subcatKey.action" -> boolean`)
- **saveRole** correctly persists the permissions JSONB to the `roles` table
- **Editing existing roles** works fine since `role.id` is a real UUID from the database
- **RLS policies** are correct: only admin/diretor can manage roles, all authenticated users can read

### Summary of changes

| File | Change |
|---|---|
| `src/components/users/RoleFormDialog.tsx` | Use empty string instead of `crypto.randomUUID()` for new role ID |

This is a one-line fix that unblocks role creation entirely.

