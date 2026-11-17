export type * from '../api/types';

export type Tone = 'zinc' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'orange';

export type View =
  | { name: 'dashboard' }
  | { name: 'project'; projectId: string }
  | { name: 'ideas' }
  | { name: 'team' }
  /** Público: link do e-mail de convite. */
  | { name: 'invite'; token: string };

export type RequestMode = 'TASK' | 'IDEA';
