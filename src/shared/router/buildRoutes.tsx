import type { RouteObject } from 'react-router';
import { adminRouteConfig } from './config';
import RequireAuth from './RequireAuth';
import type { AdminRouteConfigWithPrivileges } from './config';

function buildRouteObject(route: AdminRouteConfigWithPrivileges): RouteObject {
  return {
    path: route.path,
    element: route.element ? (
      <RequireAuth privileges={route.privileges ?? []}>
        {route.element}
      </RequireAuth>
    ) : undefined,
  };
}

export function buildRoutes(): RouteObject[] {
  return adminRouteConfig.flatMap((topItem) =>
    topItem.children?.length
      ? topItem.children.map(buildRouteObject)
      : [buildRouteObject(topItem)]
  );
}
