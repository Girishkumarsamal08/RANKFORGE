import { z } from 'zod';

export const VALID_BRANCHES = [
  'AE', 'AG', 'AR', 'BM', 'BT', 'CE', 'CH', 'CS', 'DA', 'EC', 'EE', 'ES', 'EY', 'GE',
  'GG', 'IN', 'MA', 'ME', 'MN', 'MT', 'NM', 'PE', 'PH', 'PI', 'ST', 'TF', 'XE', 'XH', 'XL'
] as const;

export const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).toLowerCase(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  branch: z.string().toUpperCase().refine((val) => VALID_BRANCHES.includes(val as any), {
    message: 'Invalid GATE branch selected',
  }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).toLowerCase(),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  branch: z.string().toUpperCase().refine((val) => VALID_BRANCHES.includes(val as any), {
    message: 'Invalid GATE branch selected',
  }),
});

