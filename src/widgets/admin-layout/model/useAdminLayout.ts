import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { adminRouteConfig, useRouteAccess } from '../../../shared/router';
import { useAppDispatch, useAppSelector } from '../../../shared/store/hooks';
import { loadUserAdminGroups } from '../../../entities/group';
import type { AdminRouteConfigWithPrivileges } from '../../../shared/router';
import type { UserPrivileges } from '../../../entities/user';
import type { AdminMenuItem } from './types';

function firstAccessibleChildPath(
  item: AdminRouteConfigWithPrivileges,
  canAccess: (privs: UserPrivileges[]) => boolean
): string {
  const child = item.children?.find((c) => canAccess((c.privileges ?? []) as UserPrivileges[]));
  return child?.path ?? item.path;
}

export function useAdminLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const groupsInitialized = useAppSelector((s) => s.groups.initialized);
  const groupsLoading = useAppSelector((s) => s.groups.loading);
  const { canAccess } = useRouteAccess();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!groupsInitialized && !groupsLoading) {
      dispatch(loadUserAdminGroups());
    }
  }, [dispatch, groupsInitialized, groupsLoading]);

  const visibleTopItems = useMemo(
    () =>
      adminRouteConfig.filter((item) =>
        item.children?.length
          ? item.children.some((c) => canAccess((c.privileges ?? []) as UserPrivileges[]))
          : canAccess((item.privileges ?? []) as UserPrivileges[])
      ),
    [canAccess]
  );

  const activeTopItem = useMemo(
    () => visibleTopItems.find((item) => pathname.startsWith(item.path)),
    [visibleTopItems, pathname]
  );

  const visibleSubItems = useMemo(
    () =>
      (activeTopItem?.children ?? []).filter((c) =>
        canAccess((c.privileges ?? []) as UserPrivileges[])
      ),
    [activeTopItem, canAccess]
  );

  const topMenuItems: AdminMenuItem[] = useMemo(
    () => visibleTopItems.map((item) => ({ value: item.path, header: item.label })),
    [visibleTopItems]
  );

  const subMenuItems: AdminMenuItem[] = useMemo(
    () => visibleSubItems.map((child) => ({ value: child.path, header: child.label })),
    [visibleSubItems]
  );

  const activeTopValue = activeTopItem?.path;

  const activeSubValue = useMemo(
    () =>
      visibleSubItems.find(
        (c) => pathname === c.path || pathname.startsWith(c.path + '/')
      )?.path,
    [visibleSubItems, pathname]
  );

  const handleTopSelect = (value: string) => {
    const item = visibleTopItems.find((i) => i.path === value);
    if (item) navigate(firstAccessibleChildPath(item, canAccess));
  };

  const handleSubSelect = (value: string) => {
    navigate(value);
  };

  return {
    groupsInitialized,
    topMenuItems,
    subMenuItems,
    activeTopValue,
    activeSubValue,
    handleTopSelect,
    handleSubSelect,
  };
}
