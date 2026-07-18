export const normalizeChoices = (choices = []) => {
  if (!Array.isArray(choices)) return [];
  return choices.map((item) => {
    if (typeof item === 'object' && item !== null) {
      return {
        value: item.value ?? item.id ?? item.value,
        label: item.label ?? item.name ?? String(item.value ?? item.id ?? ''),
      };
    }
    return {
      value: item[0],
      label: item[1],
    };
  });
};
