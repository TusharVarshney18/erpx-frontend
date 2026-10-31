import { getNavigation, type NavItem, type NavGroup } from "@/config/navigation";
import { FEATURE_SLUG_BY_ID, matchesPermission, type AccessContext, type Permission } from "@/lib/access";

export type VisibleNavItem = Omit<NavItem, "children"> & {
  locked?: boolean;
  /** Module responsible for the lock (used by the upgrade modal). */
  lockedModule?: string | null;
  requiredPlan?: string | null;
  /** At least one child is locked even though the parent itself is available. */
  hasLockedChild?: boolean;
  children?: VisibleNavItem[];
};
export type VisibleNavGroup = { label: string; items: VisibleNavItem[] };

function anyPermission(permission: Permission | Permission[] | undefined, access: AccessContext): boolean {
  if (!permission) return true;
  const list = Array.isArray(permission) ? permission : [permission];
  return list.some((p) => matchesPermission(access.permissions, p, access.isSuperAdmin));
}

/**
 * Produces the navigation tree visible to the current user.
 *
 * Decision per item:
 *   superAdminOnly  -> Super Admin only
 *   no permission   -> always visible (self-service)
 *   no RBAC         -> HIDDEN
 *   adminOnly + not org-admin -> HIDDEN
 *   RBAC ok, feature not in plan -> VISIBLE but locked (premium)
 */
function visibleItem(
  item: NavItem,
  access: AccessContext,
  inheritedFeatureKey?: NavItem["featureKey"],
  inheritedModuleKey?: NavItem["moduleKey"],
): VisibleNavItem | null {
  if (item.superAdminOnly && !access.isSuperAdmin) return null;
  if (item.adminOnly && !access.isOrgAdmin && !access.isSuperAdmin) return null;

  // A leaf inherits the parent group's premium feature/module key (e.g. the
  // Banking group gates Accounts/Transactions/Statements).
  const effectiveFeatureKey = item.featureKey ?? inheritedFeatureKey;
  const effectiveModuleKey = item.moduleKey ?? inheritedModuleKey;

  // Platform Super Admins and organization administrators (owners / system
  // admins) always have access to every module. Admin privileges are not
  // limited by the customer's subscription plan.
  const isAdmin = access.isSuperAdmin || access.isOrgAdmin;

  const moduleLocked = (key: NavItem["moduleKey"]): boolean => {
    if (!key || isAdmin) return false;
    return access.moduleMap[key] === false;
  };

  const featureLocked = (key: NavItem["featureKey"]): boolean => {
    if (!key || isAdmin) return false;
    const slug = FEATURE_SLUG_BY_ID[key];
    return !!slug && access.featureMap[slug] === false;
  };

  if (item.children) {
    const children = item.children
      .map((c) => visibleItem(c, access, effectiveFeatureKey, effectiveModuleKey))
      .filter((c): c is VisibleNavItem => c !== null);
    if (children.length === 0) return null;
    const locked =
      moduleLocked(effectiveModuleKey) || featureLocked(effectiveFeatureKey);
    const parent: VisibleNavItem = {
      ...item,
      children,
      locked,
      lockedModule: moduleLocked(effectiveModuleKey) ? (effectiveModuleKey ?? null) : null,
      requiredPlan:
        locked && effectiveModuleKey
          ? (access.moduleRequiredPlan[effectiveModuleKey] ?? null)
          : null,
      // Surface a lock on the group when only some of its children are gated
      // (e.g. Payroll inside HRMS).
      hasLockedChild: !locked && children.some((c) => c.locked === true),
    };
    return parent;
  }

  if (!anyPermission(item.permission, access)) return null;

  let locked = featureLocked(effectiveFeatureKey);
  let lockedModule: string | null = null;
  let requiredPlan: string | null = null;

  if (moduleLocked(effectiveModuleKey)) {
    locked = true;
    lockedModule = effectiveModuleKey ?? null;
    requiredPlan = effectiveModuleKey ? (access.moduleRequiredPlan[effectiveModuleKey] ?? null) : null;
  }

  const leaf: VisibleNavItem = { ...item, locked, lockedModule, requiredPlan };
  return leaf;
}

export function getVisibleNavigation(access: AccessContext): VisibleNavGroup[] {
  const { tenant, platform } = getNavigation();
  const groups: NavGroup[] = access.isSuperAdmin ? [...tenant, ...platform] : tenant;

  return groups
    .map((g) => ({
      label: g.label,
      items: g.items.map((i) => visibleItem(i, access)).filter((i): i is VisibleNavItem => i !== null),
    }))
    .filter((g) => g.items.length > 0);
}

export type RouteAccess = {
  /** RBAC + admin-only check passed (sidebar would show it). */
  authorized: boolean;
  /** RBAC passed but the feature is not in the organization's plan. */
  locked: boolean;
  /** Module responsible for the lock, if any. */
  module: string | null;
  /** Minimum plan required to unlock the module. */
  requiredPlan: string | null;
};

/** Resolve a single route against the access context (visibility + premium lock). */
export function getRouteAccess(route: string, access: AccessContext): RouteAccess {
  if (route === "/") return { authorized: true, locked: false, module: null, requiredPlan: null };

  const visible = getVisibleNavigation(access);
  const all = visible.flatMap((g) => g.items).flatMap((i) => (i.children ? i.children : [i]));
  const match = all.find((i) => i.url === route);
  if (match) {
    return {
      authorized: true,
      locked: match.locked === true,
      module: match.locked ? (match.lockedModule ?? null) : null,
      requiredPlan: match.locked ? (match.requiredPlan ?? null) : null,
    };
  }
  return { authorized: false, locked: false, module: null, requiredPlan: null };
}
