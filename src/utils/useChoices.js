import { useState, useEffect, useCallback } from 'react';
import { choiceApi } from '../api/choiceApi';
import { normalizeChoices } from './choiceUtils';

const choiceCache = {};

export const getChoiceOptions = async (which, params = {}) => {
  if (!which) {
    return [];
  }

  const cacheKey = `${which}:${JSON.stringify(params || {})}`;
  if (choiceCache[cacheKey]) {
    return choiceCache[cacheKey];
  }

  const response = await choiceApi.get(which, params);
  const normalized = normalizeChoices(response.data?.choices || []);
  choiceCache[cacheKey] = normalized;
  return normalized;
};

export const useChoiceOptions = (which, params = {}) => {
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChoices = useCallback(async () => {
    if (!which) {
      setChoices([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const normalized = await getChoiceOptions(which, params);
      setChoices(normalized);
    } catch (err) {
      setChoices([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [which, JSON.stringify(params)]);

  useEffect(() => {
    fetchChoices();
  }, [fetchChoices]);

  return { choices, loading, error, reload: fetchChoices };
};
