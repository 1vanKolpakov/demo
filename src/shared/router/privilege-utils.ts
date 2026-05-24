// @fsd-violation: shared→entities — access logic depends on domain types
import type { User } from '../../entities/user';
import { UserPrivileges } from '../../entities/user';

export type PrivilegeExceptionContext = Record<string, unknown>;
export type PrivilegeExceptionFn = (user: User, ctx: PrivilegeExceptionContext) => boolean;

const PRIVILEGE_EXCEPTIONS: Partial<Record<UserPrivileges, PrivilegeExceptionFn>> = {
  [UserPrivileges.STANDS]: (_user, ctx) => Boolean(ctx['isGroupAdmin']),
};

export function hasPrivilegeAccess(
  privileges: UserPrivileges[],
  user: User,
  ctx: PrivilegeExceptionContext = {}
): boolean {
  if (privileges.length === 0) return true;
  return privileges.some(
    (p) => user.privileges.includes(p) || (PRIVILEGE_EXCEPTIONS[p]?.(user, ctx) ?? false)
  );
}

export function hasAnyAdminAccess(user: User, ctx: PrivilegeExceptionContext = {}): boolean {
  return Object.values(UserPrivileges).some(
    (p) =>
      user.privileges.includes(p) ||
      (PRIVILEGE_EXCEPTIONS[p as UserPrivileges]?.(user, ctx) ?? false)
  );
}
