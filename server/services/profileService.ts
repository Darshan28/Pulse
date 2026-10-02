import {
  AUDIENCE_SIZE_OPTIONS,
  ROLE_OPTIONS,
  USE_CASE_OPTIONS,
  type UserProfileDTO,
} from '../../shared/onboarding.js'
import { AppError } from '../lib/errors.js'
import { getStore } from '../store/index.js'
import type { UpdateUserProfileInput, UserProfileRecord } from '../store/types.js'

export function toProfileDTO(profile: UserProfileRecord): UserProfileDTO {
  return { ...profile }
}

export async function ensurePresenterProfile(input: {
  authUserId: string
  email?: string | null
}) {
  return getStore().upsertUserProfile({
    authUserId: input.authUserId,
    email: input.email ?? null,
  })
}

export async function getProfileForUser(userId: string) {
  const profile = await getStore().getUserById(userId)
  if (!profile) throw new AppError('UNAUTHORIZED', 'Sign in to continue.', 401)
  return profile
}

function assertOnboardingValues(patch: UpdateUserProfileInput) {
  if (patch.role != null && !(ROLE_OPTIONS as readonly string[]).includes(patch.role)) {
    throw new AppError('VALIDATION_ERROR', 'Choose a valid role.', 400)
  }
  if (
    patch.audienceSize != null &&
    !(AUDIENCE_SIZE_OPTIONS as readonly string[]).includes(patch.audienceSize)
  ) {
    throw new AppError('VALIDATION_ERROR', 'Choose a valid audience size.', 400)
  }
  if (patch.useCases) {
    for (const useCase of patch.useCases) {
      if (!(USE_CASE_OPTIONS as readonly string[]).includes(useCase)) {
        throw new AppError('VALIDATION_ERROR', 'Choose a valid use case.', 400)
      }
    }
  }
}

export async function updatePresenterProfile(userId: string, patch: UpdateUserProfileInput) {
  assertOnboardingValues(patch)
  return getStore().updateUserProfile(userId, patch)
}

export async function completeOnboarding(
  userId: string,
  input: { useCases: string[]; audienceSize: string; role: string },
) {
  if (!input.useCases.length) {
    throw new AppError('VALIDATION_ERROR', 'Pick at least one use case.', 400)
  }
  return updatePresenterProfile(userId, {
    useCases: input.useCases,
    audienceSize: input.audienceSize,
    role: input.role,
    onboardingCompleted: true,
  })
}
