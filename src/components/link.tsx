import { useMemo } from 'react';
import { Link as AriaLink } from 'react-aria-components/Link';
import { tv, type ClassValue, type VariantProps } from 'tailwind-variants';
import { Text, textVariants } from './typography';

export type LinkProps = Omit<React.ComponentProps<typeof AriaLink>, 'className'> & LinkVariants & { className?: ClassValue };

export type LinkVariants = VariantProps<typeof linkVariants>;

export const linkVariants = tv({
  extend: textVariants,
  base: [
    'inline-flex items-center gap-1.5 rounded',
    'focus-visible:ring-accent-8 focus-visible:ring focus-visible:outline-none',
    'motion-safe:transition-colors',
  ],
  defaultVariants: { weight: '5' },
  compoundVariants: [
    { variant: 'gray', class: 'hover:text-gray-11' },
    { variant: 'gray-soft', class: 'hover:text-gray-12' },
    { variant: 'accent', class: 'hover:text-accent-12' },
    { variant: 'accent-soft', class: 'hover:text-accent-11' },
    { variant: 'warn', class: 'hover:text-warn-12 focus-visible:ring-warn-8' },
    { variant: 'warn-soft', class: 'hover:text-warn-11 focus-visible:ring-warn-8' },
    { variant: 'danger', class: 'hover:text-danger-12 focus-visible:ring-danger-8' },
    { variant: 'danger-soft', class: 'hover:text-danger-11 focus-visible:ring-danger-8' },
  ],
});

export default function Link({ className, href, ...props }: LinkProps) {
  const external = useMemo(() => /^(?!\/|#).*/.test(href?.toString() ?? ''), [href]);
  return (
    <Text
      as={AriaLink}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer noopener' : undefined}
      className={linkVariants({ ...props, className })}
      {...props}
    />
  );
}
