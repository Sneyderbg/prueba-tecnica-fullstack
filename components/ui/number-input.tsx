import * as React from 'react';
import { NumericFormat } from 'react-number-format';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  precision?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value,
      onChange,
      min,
      max,
      precision = 2,
      placeholder,
      disabled,
      readOnly,
    },
    ref
  ) => {
    return (
      <NumericFormat
        customInput={Input}
        getInputRef={ref}
        className={cn(
          'text-right',
          // Hide number input spinner buttons
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          className
        )}
        value={value}
        onValueChange={(values) => {
          const numericValue = values.floatValue ?? 0;
          const clampedValue = Math.min(
            Math.max(numericValue, min ?? -Infinity),
            max ?? Infinity
          );
          onChange?.(clampedValue);
        }}
        decimalScale={precision}
        fixedDecimalScale
        allowNegative
        thousandSeparator={false}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
      />
    );
  }
);
NumberInput.displayName = 'NumberInput';

export { NumberInput };
