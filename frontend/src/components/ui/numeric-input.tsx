'use client';

import React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { Input } from '@/components/ui/input';

const NumericInput = React.forwardRef<HTMLInputElement, NumericFormatProps<any>>((props, ref) => {
  return (
    <NumericFormat
      customInput={Input}
      getInputRef={ref}
      thousandSeparator=','
      decimalSeparator='.'
      allowNegative={false}
      decimalScale={2}
      fixedDecimalScale
      placeholder='0.00'
      {...props}
    />
  );
});

NumericInput.displayName = 'NumericInput';

export { NumericInput };
