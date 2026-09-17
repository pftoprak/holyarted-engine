import { runtimeEnv } from './runtime-config';
import { calculateDesign } from './profile-engine';
import type { PortraitInput, SavedPortrait } from './portrait-types';

type PortraitRow = {
  first_name: string;
  last_name: string;
  birth_date: string;
  full_name: string;
  decision: SavedPortrait['profile']['decision'];
  environment: SavedPortrait['profile']['environment'];
  friction: SavedPortrait['profile']['friction'];
  purpose: SavedPortrait['profile']['purpose'];
  updated_at: string;
};

export class InvalidPortraitError extends Error {}

function database(): D1Database {
  if (!runtimeEnv.DB) throw new Error('Portrait storage is unavailable.');
  return runtimeEnv.DB;
}

function cleanInput(input: PortraitInput): PortraitInput {
  if (!input || typeof input !== 'object') throw new InvalidPortraitError('A portrait is required.');
  const firstName = typeof input.firstName === 'string' ? input.firstName.trim().replace(/\s+/g, ' ') : '';
  const lastName = typeof input.lastName === 'string' ? input.lastName.trim().replace(/\s+/g, ' ') : '';
  const birthDate = typeof input.birthDate === 'string' ? input.birthDate : '';
  if (firstName.length > 80 || lastName.length > 80) throw new InvalidPortraitError('Name is too long.');
  try {
    calculateDesign(firstName, lastName, birthDate);
  } catch {
    throw new InvalidPortraitError('A complete name and valid birth date are required.');
  }
  return { firstName, lastName, birthDate };
}

export async function getPortrait(userId: string): Promise<SavedPortrait | null> {
  const row = await database()
    .prepare(
      `SELECT first_name, last_name, birth_date, full_name, decision,
        environment, friction, purpose, updated_at
       FROM portraits WHERE user_id = ? LIMIT 1`,
    )
    .bind(userId)
    .first<PortraitRow>();

  if (!row) return null;
  return {
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date,
    profile: {
      fullName: row.full_name,
      decision: row.decision,
      environment: row.environment,
      friction: row.friction,
      purpose: row.purpose,
    },
    updatedAt: row.updated_at,
  };
}

export async function savePortrait(userId: string, input: PortraitInput): Promise<SavedPortrait> {
  const clean = cleanInput(input);
  const profile = calculateDesign(clean.firstName, clean.lastName, clean.birthDate);
  const now = new Date().toISOString();

  await database()
    .prepare(
      `INSERT INTO portraits (
        user_id, first_name, last_name, birth_date, full_name, decision,
        environment, friction, purpose, algorithm_version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        birth_date = excluded.birth_date,
        full_name = excluded.full_name,
        decision = excluded.decision,
        environment = excluded.environment,
        friction = excluded.friction,
        purpose = excluded.purpose,
        algorithm_version = excluded.algorithm_version,
        updated_at = excluded.updated_at`,
    )
    .bind(
      userId,
      clean.firstName,
      clean.lastName,
      clean.birthDate,
      profile.fullName,
      profile.decision,
      profile.environment,
      profile.friction,
      profile.purpose,
      'holyarted-core-v1',
      now,
      now,
    )
    .run();

  return { ...clean, profile, updatedAt: now };
}
