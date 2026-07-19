import { getComponentVariants } from '@/libs/variants';
import { Button as AriaButton } from 'react-aria-components/Button';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { tv, type ClassValue, type VariantProps } from 'tailwind-variants';
import Icon from './icon';

export type ButtonProps = Omit<React.ComponentProps<typeof AriaButton>, 'className'> &
  ButtonVariants & { className?: ClassValue; icon?: React.ComponentProps<typeof Icon> };

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
    icon: '',
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
      '1-icon': { base: 'size-7 shrink-0', icon: 'size-3' },
      '2-icon': { base: 'size-8 shrink-0', icon: 'size-4' },
      '3-icon': { base: 'size-9 shrink-0', icon: 'size-5' },
      '4-icon': { base: 'size-11 shrink-0', icon: 'size-6' },
      '5-icon': { base: 'size-12 shrink-0', icon: 'size-7' },
    },
  },
});

export default function Button({ children, className, elevation, variant, animate, size, icon, ...props }: ButtonProps) {
  const slots = buttonVariants({ elevation, variant, animate, size });
  return (
    <AriaButton className={slots.base({ className })} {...props}>
      {composeRenderProps(children, (children) => (
        <>
          {icon && <Icon className={slots.icon()} {...icon} />}
          {children}
        </>
      ))}
    </AriaButton>
  );
}
