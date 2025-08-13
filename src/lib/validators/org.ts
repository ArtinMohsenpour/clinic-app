import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(2),
  key: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(), // e.g. "Europe/Berlin"
  isActive: z.boolean().optional(),
});
export type BranchInput = z.infer<typeof branchSchema>;

export const departmentSchema = z.object({
  name: z.string().min(2),
  key: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  isActive: z.boolean().optional(),
});
export type DepartmentInput = z.infer<typeof departmentSchema>;
