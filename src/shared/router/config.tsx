import type { RouteObject } from 'react-router';
// @fsd-violation: shared→entities — routing config is tightly coupled to domain privileges
import { UserPrivileges } from '../../entities/user';

export interface AdminRouteConfigWithPrivileges extends Omit<RouteObject, 'children'> {
  id: string;
  path: string;
  label: string;
  privileges?: UserPrivileges[];
  element?: JSX.Element;
  children?: AdminRouteConfigWithPrivileges[];
}

export const adminRouteConfig: AdminRouteConfigWithPrivileges[] = [
  {
    id: 'role-model',
    path: '/administration/role-model',
    label: 'Role model',
    privileges: [],
    children: [
      {
        id: 'stands',
        path: '/administration/role-model/stands',
        label: 'Stands',
        element: <div>Stands</div>,
        privileges: [UserPrivileges.STANDS],
      },
      {
        id: 'stand-categories',
        path: '/administration/role-model/stand-categories',
        label: 'Stand categories',
        element: <div>Stand categories</div>,
        privileges: [UserPrivileges.STAND_CATEGORIES],
      },
      {
        id: 'groups',
        path: '/administration/role-model/groups',
        label: 'Groups',
        privileges: [],
      },
      {
        id: 'roles',
        path: '/administration/role-model/roles',
        label: 'Roles',
        element: <div>Roles</div>,
        privileges: [UserPrivileges.ROLES],
      },
      {
        id: 'users',
        path: '/administration/role-model/users',
        label: 'Users',
        element: <div>Users</div>,
        privileges: [UserPrivileges.USERS],
      },
    ],
  },
  {
    id: 'software',
    path: '/administration/software',
    label: 'Software',
    children: [
      {
        id: 'ssw',
        path: '/administration/software/ssw',
        label: 'SSW',
        element: <div>SSW</div>,
        privileges: [UserPrivileges.SOFTWARE],
      },
      {
        id: 'playbooks',
        path: '/administration/software/playbooks',
        label: 'Playbooks',
        element: <div>Playbooks</div>,
        privileges: [UserPrivileges.SOFTWARE],
      },
      {
        id: 'vmprofiles',
        path: '/administration/software/vmprofiles',
        label: 'VM profiles',
        element: <div>VM profiles</div>,
        privileges: [UserPrivileges.VMPROFILES],
      },
      {
        id: 'clusters',
        path: '/administration/software/clusters',
        label: 'Clusters',
        element: <div>Clusters</div>,
        privileges: [UserPrivileges.CLUSTERS_AND_NAMESPACES],
      },
    ],
  },
];
