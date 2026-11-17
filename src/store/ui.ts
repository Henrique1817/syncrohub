import { create } from 'zustand';
import { pathToView, viewToPath } from '../lib/routes';
import { uid } from '../lib/utils';
import type { RequestMode, View } from '../types';

export type ToastTone = 'success' | 'error';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ModalState {
  open: boolean;
  mode: RequestMode;
  projectId?: string;
  stageId?: string;
  nonce: number;
}

interface ProjectFormState {
  open: boolean;
  /** Ausente = criar projeto; presente = editar. */
  projectId?: string;
  nonce: number;
}

/** Estado puramente de interface. Dados do servidor ficam no cache do TanStack Query. */
interface UIState {
  view: View;
  modal: ModalState;
  projectForm: ProjectFormState;
  /** Task aberta no painel de detalhes da tela do projeto. */
  openTaskId: string | null;
  toasts: Toast[];
  openTask: (taskId: string) => void;
  closeTask: () => void;
  /** Troca de tela e registra no histórico do navegador (URL própria por tela). */
  navigate: (view: View) => void;
  /** Usado no voltar/avançar do navegador. */
  syncFromLocation: () => void;
  openModal: (mode: RequestMode, context?: { projectId?: string; stageId?: string }) => void;
  closeModal: () => void;
  openProjectForm: (projectId?: string) => void;
  closeProjectForm: () => void;
  toast: (title: string, description?: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
}

export const useUI = create<UIState>()((set, get) => ({
  view: pathToView(window.location.pathname),
  modal: { open: false, mode: 'TASK', nonce: 0 },
  toasts: [],

  navigate: (view) => {
    const path = viewToPath(view);
    if (window.location.pathname !== path) window.history.pushState(null, '', path);
    set({ view, openTaskId: null });
  },

  syncFromLocation: () => set({ view: pathToView(window.location.pathname), openTaskId: null }),

  openModal: (mode, context) => set((s) => ({ modal: { open: true, mode, ...context, nonce: s.modal.nonce + 1 } })),

  closeModal: () => set((s) => ({ modal: { ...s.modal, open: false } })),

  projectForm: { open: false, nonce: 0 },

  openTaskId: null,

  openTask: (taskId) => set({ openTaskId: taskId }),

  closeTask: () => set({ openTaskId: null }),

  openProjectForm: (projectId) =>
    set((s) => ({ projectForm: { open: true, projectId, nonce: s.projectForm.nonce + 1 } })),

  closeProjectForm: () => set((s) => ({ projectForm: { ...s.projectForm, open: false } })),

  toast: (title, description, tone = 'success') => {
    const id = uid('toast');
    set((s) => ({ toasts: [...s.toasts, { id, title, description, tone }] }));
    setTimeout(() => get().dismissToast(id), tone === 'error' ? 6000 : 3500);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
