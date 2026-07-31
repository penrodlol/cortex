import { getComponentVariants } from '@/libs/variants';
import { Button as AriaButton } from 'react-aria-components/Button';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { tv, type ClassValue, type VariantProps } from 'tailwind-variants';
import Icon from './icon';
import { Text } from './typography';

export type ButtonProps = Omit<React.ComponentProps<typeof AriaButton>, 'className'> &
  ButtonVariants & { className?: ClassValue; icon?: React.ComponentProps<typeof Icon> };

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export const buttonVariants = tv({
  extend: getComponentVariants({ hover: true }).variants,
  slots: {
    base: [
      'inline-flex items-center justify-center gap-2 font-medium',
      'whitespace-nowrap will-change-transform outline-none select-none',
      'focus-visible:ring disabled:pointer-events-none disabled:opacity-50',
    ],
    icon: '',
  },
  defaultVariants: { rounded: false, animate: true, size: '2', variant: 'accent-solid' },
  variants: {
    rounded: { true: 'rounded' },
    animate: { true: 'motion-safe:pressed:scale-[0.97] motion-safe:transition-[background-color,color,scale]' },
    size: {
      '1': { base: 'h-8 px-3 text-sm', icon: 'size-3 opacity-80' },
      '2': { base: 'h-10 px-4 text-base', icon: 'size-4 opacity-80' },
      '3': { base: 'h-12 px-5 text-lg', icon: 'size-5 opacity-80' },
      '4': { base: 'h-14 px-7 text-xl', icon: 'size-6 opacity-80' },
      '5': { base: 'h-16 px-8 text-2xl', icon: 'size-7 opacity-80' },
      '1-icon': { base: 'size-7 shrink-0', icon: 'size-3' },
      '2-icon': { base: 'size-8 shrink-0', icon: 'size-4' },
      '3-icon': { base: 'size-9 shrink-0', icon: 'size-5' },
      '4-icon': { base: 'size-11 shrink-0', icon: 'size-6' },
      '5-icon': { base: 'size-12 shrink-0', icon: 'size-7' },
    },
  },
});

export default function Button({ children, className, elevation, variant, rounded, animate, size, icon, ...props }: ButtonProps) {
  const slots = buttonVariants({ elevation, variant, rounded, animate, size });
  return (
    <AriaButton className={slots.base({ className })} {...props}>
      {composeRenderProps(children, (children) => (
        <>
          {icon && <Icon className={slots.icon()} {...icon} />}
          {children && icon ? (
            <Text as="span" trim size="inherit">
              {children}
            </Text>
          ) : (
            children
          )}
        </>
      ))}
    </AriaButton>
  );
}
