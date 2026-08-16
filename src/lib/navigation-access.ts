import { getNavigation, type NavItem, type NavGroup } from "@/config/navigation";
import { FEATURE_SLUG_BY_ID, matchesPermission, type AccessContext, type Permission } from "@/lib/access";

export type VisibleNavItem = Omit<NavItem, "children"> & {
  locked?: boolean;
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
): VisibleNavItem | null {
  if (item.superAdminOnly && !access.isSuperAdmin) return null;
  if (item.adminOnly && !access.isOrgAdmin && !access.isSuperAdmin) return null;

  // A leaf inherits the parent group's premium feature key (e.g. Banking group
  // gates Accounts/Transactions/Statements).
  const effectiveFeatureKey = item.featureKey ?? inheritedFeatureKey;

  if (item.children) {
    const children = item.children
      .map((c) => visibleItem(c, access, effectiveFeatureKey))
      .filter((c): c is VisibleNavItem => c !== null);
    if (children.length === 0) return null;
    const parent: VisibleNavItem = { ...item, children, locked: false };
    return parent;
  }

  if (!anyPermission(item.permission, access)) return null;

  let locked = false;
  if (effectiveFeatureKey) {
    const slug = FEATURE_SLUG_BY_ID[effectiveFeatureKey];
    locked = slug ? access.featureMap[slug] === false : false;
  }
  // Super Admin bypasses customer subscription gating entirely.
  if (access.isSuperAdmin) locked = false;

  const leaf: VisibleNavItem = { ...item, locked };
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
};

/** Resolve a single route against the access context (visibility + premium lock). */
export function getRouteAccess(route: string, access: AccessContext): RouteAccess {
  if (route === "/") return { authorized: true, locked: false };

  const visible = getVisibleNavigation(access);
  const all = visible.flatMap((g) => g.items).flatMap((i) => (i.children ? i.children : [i]));
  const match = all.find((i) => i.url === route);
  if (match) {
    return { authorized: true, locked: match.locked === true };
  }
  return { authorized: false, locked: false };
}
