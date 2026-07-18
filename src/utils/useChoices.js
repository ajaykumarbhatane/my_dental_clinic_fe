import { useState, useEffect, useCallback } from 'react';
import { choiceApi } from '../api/choiceApi';
import { normalizeChoices } from './choiceUtils';

const choiceCache = {};

export const getChoiceOptions = async (which) => {
  if (!which) {
    return [];
  }

  if (choiceCache[which]) {
    return choiceCache[which];
  }

  const response = await choiceApi.get(which);
  const normalized = normalizeChoices(response.data?.choices || []);
  choiceCache[which] = normalized;
  return normalized;
};

export const useChoiceOptions = (which) => {
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
      const normalized = await getChoiceOptions(which);
      setChoices(normalized);
    } catch (err) {
      setChoices([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [which]);

  useEffect(() => {
    fetchChoices();
  }, [fetchChoices]);

  return { choices, loading, error, reload: fetchChoices };
};
