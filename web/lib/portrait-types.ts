import type { CalculatedProfile } from './profile-engine';

export type PortraitInput = {
  firstName: string;
  lastName: string;
  birthDate: string;
};

// Product rule (founder, 4 Nov 2026): no age limit, but birth dates before
// 1900 are not accepted. Future dates are rejected by the engine itself.
export const EARLIEST_BIRTH_DATE = '1900-01-01';

export function isSupportedBirthDate(birthDate: string): boolean {
  return birthDate >= EARLIEST_BIRTH_DATE;
}

export type SavedPortrait = PortraitInput & {
  profile: CalculatedProfile;
  updatedAt: string;
};
