import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    key: z
      .string()
      .min(1, 'Role key is required')
      .regex(/^[a-z_]+$/, 'Role key must be lowercase with underscores'),
    name: z
      .string()
      .min(1, 'Role name is required'),
    description: z
      .string()
      .optional(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z
      .string()
      .optional(),
    description: z
      .string()
      .optional(),
  }),
});

export const assignPermissionSchema = z.object({
  body: z.object({
    permissionId: z
      .string()
      .min(1, 'Permission ID is required'),
  }),
});
