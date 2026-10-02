export const USE_CASE_OPTIONS = [
  'Meetings',
  'Workshops',
  'Training',
  'Presentations',
  'Events',
  'Other',
] as const

export const AUDIENCE_SIZE_OPTIONS = ['Under 10', '10–50', '50–100', '100+'] as const

export const ROLE_OPTIONS = [
  'Designer',
  'Product',
  'Marketing',
  'Education',
  'Leadership',
  'Other',
] as const

export type UseCaseOption = (typeof USE_CASE_OPTIONS)[number]
export type AudienceSizeOption = (typeof AUDIENCE_SIZE_OPTIONS)[number]
export type RoleOption = (typeof ROLE_OPTIONS)[number]

export interface UserProfileDTO {
  id: string
  authUserId: string
  email: string | null
  role: string | null
  useCases: string[]
  audienceSize: string | null
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}
