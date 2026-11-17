/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base da API. Padrão: `/api/v1`, atendido pelo proxy do Vite em desenvolvimento. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
