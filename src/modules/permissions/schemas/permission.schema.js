import { z } from 'zod';

export const createPermissionSchema = z.object({
  body: z.object({
    key: z
      .string()
      .min(1, 'Permission key is required')
      .regex(/^[a-z_.]+$/, 'Permission key must be lowercase with underscores and dots'),
    name: z
      .string()
      .min(1, 'Permission name is required'),
    resource: z
      .string()
      .min(1, 'Resource is required'),
    action: z
      .string()
      .min(1, 'Action is required'),
    description: z
      .string()
      .optional(),
  }),
});

export const updatePermissionSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
});
