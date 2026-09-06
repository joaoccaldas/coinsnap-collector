import { CoinAnalysisResult } from "../types";

const AI_PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || "/api/ai/identify-coin";

export const identifyCoin = async (frontImage: string, backImage: string): Promise<CoinAnalysisResult> => {
  const response = await fetch(AI_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ frontImage, backImage }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || `Coin analysis failed with HTTP ${response.status}`);
  }

  const result = (await response.json()) as CoinAnalysisResult;

  if (typeof result.estimatedValue === "string") {
    const cleaned = parseFloat((result.estimatedValue as string).replace(/[^0-9.]/g, ""));
    result.estimatedValue = Number.isNaN(cleaned) ? 0 : cleaned;
  } else if (typeof result.estimatedValue !== "number") {
    result.estimatedValue = 0;
  }

  return result;
};
