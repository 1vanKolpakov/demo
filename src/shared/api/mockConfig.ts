export type MockScenarioKey =
  | 'fullAdmin'
  | 'softwareFull'
  | 'softwarePartial'
  | 'roleModelFull'
  | 'groupAdminOnly'
  | 'noAccess';

export const ACTIVE_SCENARIO: MockScenarioKey = 'fullAdmin';
