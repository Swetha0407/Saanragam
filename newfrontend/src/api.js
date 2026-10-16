const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export async function postApi(endpoint, data) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || `Request failed (${response.status})`
    );
  }

  return result;
}

export async function getApi(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || `Request failed (${response.status})`
    );
  }

  return result;
}

export async function getDailyKural() {
  return await getApi("/api/daily-kural");
}

export async function verifyKural(quotation, apiKey = null) {
  const payload = { quotation };
  if (apiKey) payload.api_key = apiKey;
  return await postApi("/api/verify", payload);
}

export async function getVerifyStatus() {
  return await getApi("/api/verify/status");
}

export async function getRecommendedKurals(situation) {
  return await postApi("/api/recommend", { situation });
}

export async function getWordMeaning(word, kuralNumber = null) {
  const payload = { word };
  if (kuralNumber) payload.kural_number = kuralNumber;
  return await postApi("/api/word-meaning", payload);
}

export async function getWordHistory(word) {
  return await postApi("/api/word-history", { word });
}

export async function getKuralByNumber(number) {
  return await getApi(`/api/kural/${number}`);
}
