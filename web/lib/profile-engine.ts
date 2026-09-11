import { calculateCoreProfile } from './calculation-core';

export type Decision = 'facts' | 'voice' | 'instinct' | 'time';
export type Environment = 'quiet' | 'together' | 'variety' | 'motion';
export type Friction = 'switching' | 'ambiguity' | 'access' | 'stagnation';
export type Purpose = 'build' | 'guide' | 'create' | 'connect';

const decisionKeys: Decision[] = ['instinct', 'voice', 'facts', 'time'];
const environmentKeys: Environment[] = ['motion', 'together', 'variety', 'quiet'];
const frictionKeys: Friction[] = ['ambiguity', 'access', 'switching', 'stagnation'];
const purposeKeys: Purpose[] = ['build', 'connect', 'create', 'guide'];

function mappedKey<T>(keys: T[], value: number): T {
  return keys[Math.abs(Math.trunc(value)) % keys.length];
}

export function calculateDesign(firstName: string, lastName: string, birthDate: string) {
  const core = calculateCoreProfile(firstName, lastName, birthDate);
  const { signals } = core;
  return {
    fullName: core.fullName,
    decision: mappedKey(decisionKeys, signals.dateTotal + signals.birthDay),
    environment: mappedKey(environmentKeys, signals.nameTotal + signals.birthMonth),
    friction: mappedKey(frictionKeys, signals.consonantTotal + signals.birthYearTotal),
    purpose: mappedKey(purposeKeys, signals.vowelTotal + signals.dateSignature),
    calculation: core,
  };
}

export type CalculatedProfile = ReturnType<typeof calculateDesign>;
