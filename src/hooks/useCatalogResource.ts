import { useCallback, useEffect, useState } from 'react';

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useCatalogResource<T>(load: () => Promise<T>, loadErrorMessage: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await load());
      setLoadError(null);
    } catch (error) {
      setLoadError(messageOf(error, loadErrorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [load, loadErrorMessage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runAction(action: () => Promise<void>, fallback: string): Promise<boolean> {
    setIsSaving(true);
    setActionError(null);
    try {
      await action();
      await refresh();
      return true;
    } catch (error) {
      setActionError(messageOf(error, fallback));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    data,
    isLoading,
    loadError,
    isSaving,
    actionError,
    clearActionError: () => setActionError(null),
    refresh,
    runAction,
  };
}
