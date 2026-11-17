import {
  Briefcase,
  Cpu,
  Handshake,
  Landmark,
  Lightbulb,
  MessageSquarePlus,
  Receipt,
  ShoppingCart,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type {
  Department,
  IdeaCategory,
  InviteDeliveryStatus,
  MemberStatus,
  UserRole,
  IdeaStatus,
  ProjectStatus,
  StageStatus,
  TaskPriority,
  TaskStatus,
  Tone,
} from '../types';

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; tone: Tone; bar: string; dot: string }> = {
  PLANNING: { label: 'Planejamento', tone: 'zinc', bar: 'bg-zinc-400', dot: 'bg-zinc-400' },
  IN_PROGRESS: { label: 'Em andamento', tone: 'indigo', bar: 'bg-indigo-500', dot: 'bg-indigo-500' },
  REVIEW: { label: 'Em revisão', tone: 'amber', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Concluído', tone: 'emerald', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
};

export const STAGE_STATUSES: StageStatus[] = ['PENDING', 'ACTIVE', 'DONE'];

export const STAGE_STATUS_META: Record<StageStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Pendente', tone: 'zinc' },
  ACTIVE: { label: 'Em andamento', tone: 'indigo' },
  DONE: { label: 'Concluída', tone: 'emerald' },
};

/** BACKLOG é a triagem: aparece na caixa de triagem, não como coluna do quadro. */
export const BOARD_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export const TASK_STATUS_META: Record<TaskStatus, { label: string; dot: string; tone: Tone }> = {
  BACKLOG: { label: 'Em triagem', dot: 'bg-amber-500', tone: 'amber' },
  TODO: { label: 'A fazer', dot: 'bg-zinc-400', tone: 'zinc' },
  IN_PROGRESS: { label: 'Em andamento', dot: 'bg-indigo-500', tone: 'indigo' },
  DONE: { label: 'Concluída', dot: 'bg-emerald-500', tone: 'emerald' },
};

export const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const PRIORITY_META: Record<TaskPriority, { label: string; tone: Tone; dot: string }> = {
  LOW: { label: 'Baixa', tone: 'zinc', dot: 'bg-zinc-400' },
  MEDIUM: { label: 'Média', tone: 'sky', dot: 'bg-sky-500' },
  HIGH: { label: 'Alta', tone: 'orange', dot: 'bg-orange-500' },
  CRITICAL: { label: 'Crítica', tone: 'rose', dot: 'bg-rose-500' },
};

export const IDEA_STATUS_META: Record<IdeaStatus, { label: string; tone: Tone }> = {
  UNDER_REVIEW: { label: 'Em análise', tone: 'amber' },
  APPROVED: { label: 'Aprovada', tone: 'emerald' },
  IMPLEMENTED: { label: 'Implementada', tone: 'violet' },
  ARCHIVED: { label: 'Arquivada', tone: 'zinc' },
};

export const ROLE_META: Record<UserRole, { label: string; tone: Tone }> = {
  ENGINEER: { label: 'Engenheiro', tone: 'zinc' },
  MANAGER: { label: 'Diretor/Chefe', tone: 'indigo' },
  COLLABORATOR: { label: 'Colaborador', tone: 'sky' },
};

export const DEPARTMENTS: Department[] = ['PURCHASING', 'FINANCE', 'SALES', 'BILLING', 'TECHNOLOGY', 'MANAGEMENT'];

export const DEPARTMENT_META: Record<Department, { label: string; icon: LucideIcon; tone: Tone; hint: string }> = {
  PURCHASING: { label: 'Compras', icon: ShoppingCart, tone: 'amber', hint: 'Fornecedores, cotações e estoque' },
  FINANCE: { label: 'Financeiro', icon: Landmark, tone: 'emerald', hint: 'Caixa, contas e pagamentos' },
  SALES: { label: 'Comercial', icon: Handshake, tone: 'indigo', hint: 'Vendas, clientes e metas' },
  BILLING: { label: 'Faturamento', icon: Receipt, tone: 'sky', hint: 'Notas, pedidos e cobrança' },
  TECHNOLOGY: { label: 'Tecnologia', icon: Cpu, tone: 'violet', hint: 'Sistemas, integrações e suporte' },
  MANAGEMENT: { label: 'Gerência', icon: Briefcase, tone: 'rose', hint: 'Visão executiva e indicadores' },
};

export const MEMBER_STATUS_META: Record<MemberStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Convite pendente', tone: 'amber' },
  ACTIVE: { label: 'Ativo', tone: 'emerald' },
  DISABLED: { label: 'Desativado', tone: 'zinc' },
};

export const DELIVERY_STATUS_META: Record<InviteDeliveryStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Enviando…', tone: 'zinc' },
  SENT: { label: 'E-mail enviado', tone: 'emerald' },
  NOT_CONFIGURED: { label: 'E-mail não configurado', tone: 'amber' },
  FAILED: { label: 'Falha no envio', tone: 'rose' },
};

export const IDEA_CATEGORIES: IdeaCategory[] = ['IDEA', 'SUGGESTION', 'ADJUSTMENT'];

export const IDEA_CATEGORY_META: Record<IdeaCategory, { label: string; tone: Tone; icon: LucideIcon; hint: string }> = {
  IDEA: { label: 'Ideia', tone: 'amber', icon: Lightbulb, hint: 'Algo novo que pode gerar valor' },
  SUGGESTION: { label: 'Sugestão', tone: 'indigo', icon: MessageSquarePlus, hint: 'Uma recomendação de caminho' },
  ADJUSTMENT: { label: 'Ajuste', tone: 'sky', icon: Wrench, hint: 'Refinar algo que já existe' },
};
