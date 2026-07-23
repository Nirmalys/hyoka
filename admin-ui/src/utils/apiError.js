export const NETWORK_ERROR_USER_MESSAGE =
  "Could not reach the server. Check your connection and try again.";

export function isNetworkError(err) {
  if (!err) return false;
  if (err.code === "ERR_NETWORK" || err.message === "Network Error") return true;
  return Boolean(err.request && !err.response);
}

export function resolveApiError(err, fallbackMessage) {
  if (isNetworkError(err)) {
    return { message: NETWORK_ERROR_USER_MESSAGE, isNetwork: true };
  }
  const responseMessage = err?.response?.data?.data?.message;
  return {
    message: responseMessage || err?.message || fallbackMessage,
    isNetwork: false,
  };
}

export function logApiError() {
  // Intentionally no-op (no console output in production).
}

export function reportCaughtError(err, fallbackMessage, setError) {
  logApiError(err);
  const resolved = resolveApiError(err, fallbackMessage);
  setError(resolved.message, resolved.isNetwork);
}
