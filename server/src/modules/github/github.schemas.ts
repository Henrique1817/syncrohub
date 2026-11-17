import { z } from 'zod';
import { optionalText } from '../../shared/http/schemas.js';

export const previewGitHubRepoSchema = z.object({
  repo: z.string().trim().min(3).max(300),
  token: optionalText(300),
});

export const syncGitHubProjectSchema = z.object({
  token: optionalText(300),
});

export type PreviewGitHubRepoInput = z.infer<typeof previewGitHubRepoSchema>;
export type SyncGitHubProjectInput = z.infer<typeof syncGitHubProjectSchema>;
