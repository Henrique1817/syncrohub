import type { AnchorHTMLAttributes } from 'react';
import { viewToPath } from '../../lib/routes';
import { useUI } from '../../store/ui';
import type { View } from '../../types';

interface AppLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: View;
}

/** Link de verdade (href, Ctrl+clique, nova aba) que navega sem recarregar a página. */
export function AppLink({ to, onClick, children, ...rest }: AppLinkProps) {
  const navigate = useUI((s) => s.navigate);
  return (
    <a
      href={viewToPath(to)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
