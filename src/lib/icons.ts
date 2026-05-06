/**
 * Centralized icon registry.
 *
 * Map SEMANTIC names (what the icon means in the product) to Iconify strings
 * (where the icon comes from). This way, swapping an icon is a one-line edit
 * here — no need to grep and replace strings across the codebase.
 *
 * Naming convention: kebab-case, grouped by domain prefix when possible
 *   - nav.*       sidebar / navigation
 *   - action.*    buttons / common actions
 *   - status.*    states (success, warning, error, etc.)
 *   - entity.*    domain entities (client, contract, task, ...)
 *   - misc.*      everything else
 *
 * Usage:
 *   import { Icon } from "@/components/shared";
 *   import { iconKey } from "@/lib/icons";
 *   <Icon name={iconKey("action.add")} />
 */

export const iconRegistry = {
  // Navigation
  "nav.dashboard": "lucide:layout-dashboard",
  "nav.clients": "lucide:users",
  "nav.contracts": "lucide:file-signature",
  "nav.financial": "lucide:wallet",
  "nav.tasks": "lucide:check-square",
  "nav.projects": "lucide:folder-kanban",
  "nav.calendar": "lucide:calendar",
  "nav.team": "lucide:users-round",
  "nav.settings": "lucide:settings",
  "nav.knowledge": "lucide:book-open",
  "nav.agents": "lucide:bot",

  // Actions
  "action.add": "lucide:plus",
  "action.edit": "lucide:pencil",
  "action.delete": "lucide:trash-2",
  "action.save": "lucide:save",
  "action.search": "lucide:search",
  "action.filter": "lucide:filter",
  "action.refresh": "lucide:refresh-cw",
  "action.download": "lucide:download",
  "action.upload": "lucide:upload",
  "action.copy": "lucide:copy",
  "action.close": "lucide:x",
  "action.more": "lucide:more-horizontal",
  "action.send": "lucide:send",

  // Status
  "status.success": "lucide:check-circle-2",
  "status.warning": "lucide:alert-triangle",
  "status.error": "lucide:x-circle",
  "status.info": "lucide:info",
  "status.pending": "lucide:clock",
  "status.loading": "lucide:loader-2",

  // Entities
  "entity.client": "lucide:user",
  "entity.contract": "lucide:file-text",
  "entity.invoice": "lucide:receipt",
  "entity.task": "lucide:check-square",
  "entity.project": "lucide:folder",
  "entity.product": "lucide:package",
  "entity.plan": "lucide:layers",

  // Misc
  "misc.empty": "lucide:inbox",
  "misc.lock": "lucide:lock",
  "misc.bell": "lucide:bell",
  "misc.chat": "lucide:message-circle",
  "misc.attachment": "lucide:paperclip",
  "misc.link": "lucide:link",
} as const;

export type IconKey = keyof typeof iconRegistry;

/**
 * Resolve a semantic icon key into its Iconify string.
 * Returns the input string if it's already an Iconify name (contains ":")
 * to allow gradual migration.
 */
export function iconKey(key: IconKey | (string & {})): string {
  if (key in iconRegistry) return iconRegistry[key as IconKey];
  return key as string;
}
