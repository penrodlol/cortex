import { LoaderIcon } from 'lucide-react';
import { type VariantProps, tv } from 'tailwind-variants';
import Icon, { iconVariants } from './icon';

export type SpinnerProps<T extends React.ComponentProps<typeof Icon>> = Omit<T, 'role' | 'source'> & { source?: T['source'] };

export type SpinnerVariants = VariantProps<typeof spinnerVariants>;

export const spinnerVariants = tv({
  extend: iconVariants,
  base: 'motion-safe:animate-spin',
  variants: { size: { '1': 'size-4', '2': 'size-6', '3': 'size-8', '4': 'size-10', '5': 'size-12' } },
});

export default function Spinner<T extends React.ComponentProps<typeof Icon>>({ className, size, variant, ...props }: SpinnerProps<T>) {
  return <Icon role="status" source={<LoaderIcon />} className={spinnerVariants({ size, variant, className })} {...props} />;
}
