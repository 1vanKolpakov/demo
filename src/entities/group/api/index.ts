import { ACTIVE_SCENARIO } from '../../../shared/api/mockConfig';
import type { MockScenarioKey } from '../../../shared/api/mockConfig';

const adminGroups: Record<MockScenarioKey, string[]> = {
  fullAdmin:       [],
  softwareFull:    [],
  softwarePartial: [],
  roleModelFull:   [],
  groupAdminOnly:  ['group-devops', 'group-backend'],
  noAccess:        [],
};

export const fetchUserAdminGroups = (): Promise<string[]> =>
  new Promise((resolve) => setTimeout(() => resolve(adminGroups[ACTIVE_SCENARIO]), 300));
