import { useState, useCallback } from "react";
import { reportCaughtError as reportError } from "../utils/apiError";

export function useApiErrorState() {
  const [error, setErrorMessage] = useState("");
  const [errorIsNetwork, setErrorIsNetwork] = useState(false);

  const clearError = useCallback(() => {
    setErrorMessage("");
    setErrorIsNetwork(false);
  }, []);

  const setError = useCallback((message, isNetwork = false) => {
    const nextMessage = message || "";
    setErrorMessage(nextMessage);
    setErrorIsNetwork(Boolean(nextMessage) && isNetwork);
  }, []);

  const reportCaughtError = useCallback((err, fallbackMessage) => {
    reportError(err, fallbackMessage, setError);
  }, [setError]);

  return {
    error,
    errorIsNetwork,
    setError,
    clearError,
    reportCaughtError,
  };
}
