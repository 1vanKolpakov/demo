import { useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { hasPrivilegeAccess } from './privilege-utils';
import { useExceptionContext } from './useExceptionContext';
import type { UserPrivileges } from '../../entities/user';

export function useRouteAccess() {
  const user = useAppSelector((s) => s.user.data);
  const groupsInitialized = useAppSelector((s) => s.groups.initialized);
  const ctx = useExceptionContext();

  const isReady = user !== null && groupsInitialized;

  const canAccess = useCallback(
    (privileges: UserPrivileges[]) => {
      if (!user) return false;
      return hasPrivilegeAccess(privileges, user, ctx);
    },
    [user, ctx]
  );

  return { canAccess, isReady };
}
