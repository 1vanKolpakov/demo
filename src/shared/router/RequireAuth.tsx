import React from 'react';
import { useAppSelector } from '../store/hooks';
import { hasPrivilegeAccess } from './privilege-utils';
import { useExceptionContext } from './useExceptionContext';
import ForbiddenPage from '../ui/ForbiddenPage';
import type { UserPrivileges } from '../../entities/user';

interface Props {
  privileges: UserPrivileges[];
  children: React.ReactNode;
}

const RequireAuth: React.FC<Props> = ({ privileges, children }) => {
  const user = useAppSelector((s) => s.user.data);
  const ctx = useExceptionContext();

  if (!user) return null;

  if (!hasPrivilegeAccess(privileges, user, ctx)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
};

export default RequireAuth;
