import { z } from 'zod'

const usernamePattern = /^[a-zA-Z0-9_-]+$/
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(strongPasswordPattern, 'Password must include uppercase, lowercase, number, and symbol')

export const loginPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')

export const loginWithPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email').max(255, 'Email must be at most 255 characters'),
  password: loginPasswordSchema,
})

export const registerWithPasswordSchema = z
  .object({
    email: z.string().trim().email('Please enter a valid email').max(255, 'Email must be at most 255 characters'),
    username: z
      .string()
      .trim()
      .min(3, 'Username must be between 3 and 30 characters')
      .max(30, 'Username must be between 3 and 30 characters')
      .regex(usernamePattern, 'Username can only contain letters, numbers, underscores, and hyphens'),
    fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Full name must be between 1 and 100 characters'),
    avatarFile: z
      .string()
      .trim()
      .max(3000000, 'Avatar file payload is too large')
      .optional()
      .or(z.literal('')),
    bio: z.string().trim().max(500, 'Bio must not exceed 500 characters').optional().or(z.literal('')),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, 'Current password must be at least 8 characters')
      .max(128, 'Current password must be at most 128 characters')
      .optional()
      .or(z.literal('')),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export type PasswordLoginFormValues = z.infer<typeof loginWithPasswordSchema>
export type PasswordRegisterFormValues = z.infer<typeof registerWithPasswordSchema>
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>
