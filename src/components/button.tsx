import { getComponentVariants } from '@/libs/variants';
import { Button as AriaButton } from 'react-aria-components/Button';
import { tv, type ClassValue, type VariantProps } from 'tailwind-variants';

export type ButtonProps = Omit<React.ComponentProps<typeof AriaButton>, 'className'> & ButtonVariants & { className?: ClassValue };

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export const buttonVariants = tv({
  extend: getComponentVariants({ hover: true }).variants,
  slots: {
    base: [
      'inline-flex items-center justify-center gap-2 rounded font-medium',
      'whitespace-nowrap will-change-transform select-none',
      'focus-visible:ring focus-visible:outline-none',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
  },
  defaultVariants: { animate: true, size: '2', variant: 'accent-solid' },
  variants: {
    animate: { true: 'motion-safe:pressed:scale-[0.97] motion-safe:transition-[background-color,color,scale]' },
    size: {
      '1': { base: 'h-7.5 px-3 text-sm' },
      '2': { base: 'h-8.5 px-4 text-base' },
      '3': { base: 'h-9.5 px-5 text-lg' },
      '4': { base: 'h-11.5 px-7 text-xl' },
      '5': { base: 'h-12.5 px-8 text-2xl' },
    },
  },
});

export default function Button({ className, elevation, variant, animate, size, ...props }: ButtonProps) {
  return <AriaButton className={buttonVariants({ elevation, variant, animate, size }).base({ className })} {...props} />;
}
