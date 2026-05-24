import React from 'react';
import { Navigate } from 'react-router';
import { adminRouteConfig } from './config';
import { useRouteAccess } from './useRouteAccess';
import ForbiddenPage from '../ui/ForbiddenPage';
import type { UserPrivileges } from '../../entities/user';

const DynamicIndexRedirect: React.FC = () => {
  const { canAccess, isReady } = useRouteAccess();

  if (!isReady) return null;

  for (const topItem of adminRouteConfig) {
    const children = topItem.children ?? [];

    if (children.length > 0) {
      for (const child of children) {
        if (canAccess((child.privileges ?? []) as UserPrivileges[])) {
          return <Navigate to={child.path} replace />;
        }
      }
    } else if (canAccess((topItem.privileges ?? []) as UserPrivileges[])) {
      return <Navigate to={topItem.path} replace />;
    }
  }

  return <ForbiddenPage />;
};

export default DynamicIndexRedirect;
