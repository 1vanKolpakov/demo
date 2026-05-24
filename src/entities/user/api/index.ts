import type { User } from '../model/types';
import { UserPrivileges } from '../model/privileges';
import { ACTIVE_SCENARIO } from '../../../shared/api/mockConfig';
import type { MockScenarioKey } from '../../../shared/api/mockConfig';

const users: Record<MockScenarioKey, User> = {
  fullAdmin: {
    id: '1',
    username: 'full.admin',
    email: 'full.admin@example.com',
    privileges: Object.values(UserPrivileges),
  },
  softwareFull: {
    id: '2',
    username: 'software.full',
    email: 'software.full@example.com',
    privileges: [
      UserPrivileges.SOFTWARE,
      UserPrivileges.VMPROFILES,
      UserPrivileges.CLUSTERS_AND_NAMESPACES,
    ],
  },
  softwarePartial: {
    id: '3',
    username: 'software.partial',
    email: 'software.partial@example.com',
    privileges: [UserPrivileges.SOFTWARE],
  },
  roleModelFull: {
    id: '4',
    username: 'rolemodel.full',
    email: 'rolemodel.full@example.com',
    privileges: [
      UserPrivileges.STANDS,
      UserPrivileges.STAND_CATEGORIES,
      UserPrivileges.ROLES,
      UserPrivileges.USERS,
    ],
  },
  groupAdminOnly: {
    id: '5',
    username: 'group.admin',
    email: 'group.admin@example.com',
    privileges: [],
  },
  noAccess: {
    id: '6',
    username: 'no.access',
    email: 'no.access@example.com',
    privileges: [],
  },
};

export const fetchCurrentUser = (): Promise<User> =>
  new Promise((resolve) => setTimeout(() => resolve(users[ACTIVE_SCENARIO]), 500));
