import { z } from "zod";

export const groupFormSchema = z.object({
  name: z.string().min(1, "Group name is required").max(80, "Too long"),
  description: z.string().max(240, "Too long").optional(),
});

export type GroupFormValues = z.infer<typeof groupFormSchema>;

