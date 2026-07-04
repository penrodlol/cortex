import { getComponentVariants } from '@/libs/variants';
import { useState } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

export type AvatarProps = React.ComponentProps<'img'> & AvatarVariants;

export type AvatarVariants = Omit<VariantProps<typeof avatarVariants>, 'loaded'>;

export const avatarVariants = tv({
  extend: getComponentVariants().variants,
  slots: {
    base: 'relative flex shrink-0 items-center justify-center rounded select-none',
    img: 'absolute inset-0 aspect-square size-full rounded-[inherit] object-cover grayscale motion-safe:transition-opacity',
    alt: 'font-semibold uppercase',
  },
  defaultVariants: { variant: 'gray-ghost', size: '2' },
  variants: {
    loaded: { true: { alt: 'not-noscript:opacity-0' }, false: { img: 'not-noscript:opacity-0' } },
    size: {
      '1': { base: 'size-5', alt: 'text-sm' },
      '2': { base: 'size-7', alt: 'text-base' },
      '3': { base: 'size-9', alt: 'text-lg' },
      '4': { base: 'size-11', alt: 'text-xl' },
      '5': { base: 'size-13', alt: 'text-2xl' },
    },
  },
});

export function Avatar({ className, alt, elevation, variant, size, onLoad, ...props }: AvatarProps) {
  const [loaded, setLoaded] = useState(false);
  const slots = avatarVariants({ elevation, variant, loaded, size });

  return (
    <div className={slots.base({ className })}>
      {alt && <span className={slots.alt()}>{alt}</span>}
      <img loading="lazy" decoding="async" alt={alt} className={slots.img()} onLoad={(e) => (setLoaded(true), onLoad?.(e))} {...props} />
    </div>
  );
}
