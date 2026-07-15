import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // 브라우저에서 Anthropic API를 직접 호출하면 CORS가 막히므로,
      // 개발 서버가 /api/anthropic 요청을 실제 Anthropic API로 프록시한다.
      // 이 방식으로 API 키를 서버(프록시) 단에서만 붙일 수 있어 브라우저에 노출되지 않는다.
      proxy: {
        "/api/anthropic": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, "/v1/messages"),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              const apiKey = env.VITE_ANTHROPIC_API_KEY || "";
              if (apiKey) {
                proxyReq.setHeader("x-api-key", apiKey);
                proxyReq.setHeader("anthropic-version", "2023-06-01");
                // 브라우저 origin에서의 직접 호출을 허용하는 헤더
                proxyReq.setHeader("anthropic-dangerous-direct-browser-access", "true");
              }
            });
          },
        },
      },
    },
  };
});
