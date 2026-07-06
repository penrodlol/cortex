import { useMemo } from 'react';
import { useDateFormatter, useNumberFormatter } from 'react-aria';
import { tv, type VariantProps } from 'tailwind-variants';

export type TextProps<T extends React.ElementType> = Omit<React.ComponentProps<T>, 'as'> & TextVariants & { as?: T };
export type TextFormattedProps<T extends React.ElementType> = Omit<React.ComponentProps<typeof Text<T>>, 'as' | 'children'> & {
  as?: T;
  value: Parameters<Intl.NumberFormat['format']>[0];
  options?: Parameters<typeof useNumberFormatter>[0];
};
export type TextFormattedDateTimeProps = Omit<React.ComponentProps<typeof Text<'time'>>, 'as' | 'children'> & {
  value: Parameters<Intl.DateTimeFormat['format']>[0] | string;
  options?: Parameters<typeof useDateFormatter>[0];
};

export type TextVariants = VariantProps<typeof textVariants>;

export const textVariants = tv({
  base: 'max-w-prose',
  defaultVariants: { font: 'sans', size: '3', weight: '4' },
  variants: {
    trim: { true: '[text-box:trim-both_cap_alphabetic]' },
    font: { sans: 'font-sans', serif: 'font-serif', mono: 'font-mono' },
    italic: { true: 'italic' },
    underline: { true: 'underline underline-offset-6' },
    format: { pretty: 'text-pretty', balance: 'text-balance' },
    variant: {
      gray: 'text-gray-12',
      'gray-soft': 'text-gray-11',
      accent: 'text-accent-11 selection:bg-accent-5',
      'accent-soft': 'text-accent-12 selection:bg-accent-5',
      warn: 'text-warn-11 selection:bg-warn-5',
      'warn-soft': 'text-warn-12 selection:bg-warn-5',
      danger: 'text-danger-11 selection:bg-danger-5',
      'danger-soft': 'text-danger-12 selection:bg-danger-5',
    },
    size: {
      inherit: '[font-size:inherit]',
      '1': 'text-xs',
      '2': 'text-sm',
      '3': 'text-base',
      '4': 'text-lg',
      '5': 'text-xl',
      '6': 'text-2xl',
      '7': 'text-3xl',
      '8': 'text-4xl',
      '9': 'text-5xl',
      '10': 'text-6xl',
      '11': 'text-7xl',
      '12': 'text-8xl',
    },
    weight: {
      inherit: '[font-weight:inherit]',
      '1': 'font-thin',
      '2': 'font-extralight',
      '3': 'font-light',
      '4': 'font-normal',
      '5': 'font-medium',
      '6': 'font-semibold',
      '7': 'font-bold',
      '8': 'font-extrabold',
      '9': 'font-black',
    },
  },
});

export function Text<T extends React.ElementType = 'p'>({
  as,
  className,
  trim,
  font,
  italic,
  underline,
  format,
  variant,
  size,
  weight,
  ...props
}: TextProps<T>) {
  const Tag = as ?? 'p';
  return <Tag className={textVariants({ trim, font, italic, underline, format, variant, size, weight, className })} {...props} />;
}

export function Numeric<T extends React.ElementType = 'p'>({ value, options, ...props }: TextFormattedProps<T>) {
  const formatter = useNumberFormatter({ notation: 'compact', minimumIntegerDigits: 2, ...options });
  return <Text {...(props as TextProps<T>)}>{formatter.format(value)}</Text>;
}

export function Percentage<T extends React.ElementType = 'p'>({ value, options, ...props }: TextFormattedProps<T>) {
  const formatter = useNumberFormatter({ style: 'percent', notation: 'compact', ...options });
  return <Text {...(props as TextProps<T>)}>{formatter.format(value)}</Text>;
}

export function Currency<T extends React.ElementType = 'p'>({ value, options, ...props }: TextFormattedProps<T>) {
  const formatter = useNumberFormatter({ style: 'currency', currency: 'USD', notation: 'compact', ...options });
  return <Text {...(props as TextProps<T>)}>{formatter.format(value)}</Text>;
}

export function Unit<T extends React.ElementType = 'p'>({ value, options, ...props }: TextFormattedProps<T>) {
  const formatter = useNumberFormatter({ style: 'unit', notation: 'compact', ...options });
  return <Text {...(props as TextProps<T>)}>{formatter.format(value)}</Text>;
}

export function DateTime({ value, options, ...props }: TextFormattedDateTimeProps) {
  const valueDate = useMemo(() => (value instanceof Date ? value : new Date((value ?? 0) as string | number)), [value]);
  const formatter = useDateFormatter({ day: '2-digit', month: 'short', year: 'numeric', ...options });
  const formattedValue = useMemo(() => formatter.format(valueDate), [formatter, valueDate]);
  return (
    <Text as="time" dateTime={valueDate.toISOString()} {...props}>
      {formattedValue}
    </Text>
  );
}
