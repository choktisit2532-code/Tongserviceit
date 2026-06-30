const apiBase = process.env.API_BASE_URL;

if (!apiBase && process.env.VERCEL) {
  throw new Error(
    "Missing API_BASE_URL in Vercel Environment Variables"
  );
}

const resolvedApiBase =
  apiBase || "http://localhost:3000/api";

const config = `window.APP_CONFIG = ${JSON.stringify({
  API_BASE_URL: resolvedApiBase
})};\n`;
