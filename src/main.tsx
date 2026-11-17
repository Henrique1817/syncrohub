import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { viewToPath } from './lib/routes';
import { queryClient } from './queries/queryClient';
import { useSession } from './store/session';
import { useUI } from './store/ui';
import './index.css';

// Normaliza caminhos desconhecidos (ex.: /foo → /) e acompanha o voltar/avançar do navegador.
window.history.replaceState(null, '', viewToPath(useUI.getState().view));
window.addEventListener('popstate', () => useUI.getState().syncFromLocation());

// Ao sair (manual ou por 401), descarta o cache para o próximo usuário não ver dados do anterior.
useSession.subscribe((state, previous) => {
  if (previous.token && !state.token) {
    queryClient.clear();
    useUI.getState().navigate({ name: 'dashboard' });
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
