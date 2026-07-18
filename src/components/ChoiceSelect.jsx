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
  ...props
}) => {
  const { choices, loading } = useChoiceOptions(which);
  const normalizedChoices = useMemo(() => choices || [], [choices]);

  return (
    <select
      name={name}
      value={value ?? ''}
      onChange={onChange}
      className={`${className} ${loading ? 'opacity-70' : ''}`}
      disabled={disabled || loading}
      required={required}
      {...props}
    >
      <option value="">{loading ? 'Loading...' : placeholder}</option>
      {normalizedChoices.map((choice) => (
        <option key={`${choice[optionValue]}-${choice[optionLabel]}`} value={choice[optionValue]}>
          {choice[optionLabel]}
        </option>
      ))}
    </select>
  );
};

export default ChoiceSelect;
