import { useMemo } from 'react';
import { useChoiceOptions } from '../utils/useChoices';

const ChoiceSelect = ({
  which,
  name,
  value,
  onChange,
  className = '',
  placeholder = 'Select',
  disabled = false,
  required = false,
  optionLabel = 'label',
  optionValue = 'value',
  language = null,
  options = null,
  ...props
}) => {
  const { choices, loading } = useChoiceOptions(which, language ? { language } : {});

  const normalizedChoices = useMemo(() => {
    if (Array.isArray(options) && options.length > 0) {
      return options.map((opt) => {
        if (typeof opt === 'string' || typeof opt === 'number') {
          const str = String(opt);
          return {
            [optionLabel]: str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),
            [optionValue]: str.toLowerCase(),
          };
        }
        return opt;
      });
    }
    return choices || [];
  }, [choices, options, optionLabel, optionValue]);

  const isLoading = which && !options ? loading : false;

  return (
    <select
      name={name}
      value={value ?? ''}
      onChange={onChange}
      className={`input2 ${className} ${isLoading ? 'opacity-70' : ''}`}
      disabled={disabled || isLoading}
      required={required}
      {...props}
    >
      <option value="">{isLoading ? 'Loading...' : placeholder}</option>
      {normalizedChoices.map((choice, idx) => {
        const val = choice[optionValue] ?? choice.value ?? choice;
        const lbl = choice[optionLabel] ?? choice.label ?? choice;
        return (
          <option key={`${val}-${idx}`} value={val}>
            {lbl}
          </option>
        );
      })}
    </select>
  );
};

export default ChoiceSelect;
