import { z } from 'zod';

export const officialLoginSchema = z.object({
  email: z.string().email('Enter a valid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export type OfficialLoginInput = z.infer<typeof officialLoginSchema>;
