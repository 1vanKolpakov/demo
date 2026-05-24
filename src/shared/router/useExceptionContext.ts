import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import type { PrivilegeExceptionContext } from './privilege-utils';

export function useExceptionContext(): PrivilegeExceptionContext {
  const adminGroupIds = useAppSelector((s) => s.groups.adminGroupIds);

  return useMemo(
    () => ({ isGroupAdmin: adminGroupIds.length > 0 }),
    [adminGroupIds]
  );
}
