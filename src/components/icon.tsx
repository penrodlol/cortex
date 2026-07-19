import { cloneElement, isValidElement } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

export type IconProps = React.ComponentProps<'svg'> & IconVariants & { source: React.JSX.Element };

export type IconVariants = VariantProps<typeof iconVariants>;

export const iconVariants = tv({
  base: 'shrink-0',
  defaultVariants: { size: '2' },
  variants: {
    size: { '1': 'size-4', '2': 'size-5', '3': 'size-6', '4': 'size-7', '5': 'size-8' },
    variant: {
      gray: 'text-gray-12',
      'gray-soft': 'text-gray-11',
      accent: 'text-accent-12',
      'accent-soft': 'text-accent-11',
      warn: 'text-warn-12',
      'warn-soft': 'text-warn-11',
      danger: 'text-danger-12',
      'danger-soft': 'text-danger-11',
    },
  },
});

export default function Icon({ className, size, variant, source, ...props }: IconProps) {
  if (!isValidElement(source)) return null;
  return cloneElement(source as React.JSX.Element, { className: iconVariants({ size, variant, className }), ...props });
}
