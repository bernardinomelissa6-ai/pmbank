import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "npm run dev" usa Turbopack (padrão do Next 16) e ignora o `webpack` abaixo — só é
  // necessário silenciar o aviso. O build de produção roda com `next build --webpack`
  // (ver package.json) justamente para aplicar essa configuração.
  turbopack: {},
  webpack: (config) => {
    // @supabase/realtime-js tenta carregar o módulo "ws" (Node.js) mesmo quando a
    // funcionalidade de realtime nunca é usada, o que quebra o middleware no Edge
    // Runtime com "ReferenceError: __dirname is not defined". O app não usa realtime,
    // então é seguro dizer ao bundler para ignorar essa dependência.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      ws: false,
    };
    return config;
  },
};

export default nextConfig;
