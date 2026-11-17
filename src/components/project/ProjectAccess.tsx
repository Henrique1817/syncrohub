import { createContext, useContext } from 'react';
import { useCurrentUser } from '../../store/session';

/** `false` quando o projeto aberto está arquivado: a tela vira somente leitura para todos. */
export const ProjectEditableContext = createContext(true);

/** Engenheiro em um projeto ativo. Fora da tela de projeto o contexto vale `true`. */
export function useCanEditProject() {
  const isEngineer = useCurrentUser().role === 'ENGINEER';
  const projectEditable = useContext(ProjectEditableContext);
  return isEngineer && projectEditable;
}
