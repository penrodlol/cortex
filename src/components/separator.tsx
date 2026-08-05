import { Separator as AriaSeparator } from 'react-aria-components/Separator';
import { type VariantProps, tv } from 'tailwind-variants';

export type SeparatorProps = React.ComponentProps<typeof AriaSeparator> & SeparatorVariants;

export type SeparatorVariants = VariantProps<typeof separatorVariants>;

export const separatorVariants = tv({
  base: 'bg-gray-6 rounded border-none',
  defaultVariants: { orientation: 'horizontal', variant: 'gray' },
  variants: {
    orientation: { horizontal: 'h-px w-full', vertical: 'w-px' },
    variant: { gray: 'bg-gray-6', accent: 'bg-accent-6', warn: 'bg-warn-6', danger: 'bg-danger-6' },
  },
});

export default function Separator({ className, orientation, ...props }: SeparatorProps) {
  return <AriaSeparator className={separatorVariants({ orientation, className })} {...props} />;
}
