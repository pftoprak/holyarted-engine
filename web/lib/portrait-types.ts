import type { CalculatedProfile } from './profile-engine';

export type PortraitInput = {
  firstName: string;
  lastName: string;
  birthDate: string;
};

export type SavedPortrait = PortraitInput & {
  profile: CalculatedProfile;
  updatedAt: string;
};
