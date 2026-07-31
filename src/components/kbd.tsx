import { getComponentVariants } from '@/libs/variants';
import { tv, type VariantProps } from 'tailwind-variants';
import Icon from './icon';

export type KbdProps = React.ComponentProps<'kbd'> & KbdVariants & { icon?: React.ComponentProps<typeof Icon> };

export type KbdVariants = VariantProps<typeof kbdVariants>;

export const kbdVariants = tv({
  extend: getComponentVariants().variants,
  slots: {
    base: [
      'inline-flex h-max shrink-0 items-center justify-center',
      'font-sans leading-none font-medium whitespace-nowrap',
      'pointer-events-none select-none [text-box:trim-both_cap_alphabetic]',
    ],
    icon: '',
  },
  defaultVariants: { variant: 'gray-surface-outline', rounded: true, size: '2' },
  variants: {
    rounded: { true: 'rounded' },
    size: {
      '1': { base: 'h-4.5 min-w-7 text-xs', icon: 'size-3' },
      '2': { base: 'h-5 min-w-9 text-sm', icon: 'size-3.5' },
      '3': { base: 'h-5.5 min-w-11 text-base', icon: 'size-4' },
      '4': { base: 'h-6 min-w-13 text-lg', icon: 'size-4.5' },
      '5': { base: 'h-7 min-w-15 text-xl', icon: 'size-5' },
    },
  },
});

export default function Kbd({ children, className, elevation, variant, rounded, size, icon, ...props }: KbdProps) {
  const slots = kbdVariants({ elevation, variant, rounded, size });
  return (
    <kbd className={slots.base({ className })} {...props}>
      {icon ? <Icon source={icon.source} className={slots.icon()} /> : children}
    </kbd>
  );
}
