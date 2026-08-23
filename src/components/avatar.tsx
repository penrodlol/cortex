import { getComponentVariants } from '#/libs/variants';
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
    failed: { true: { img: 'opacity-0' }, false: { alt: 'opacity-0' } },
    size: {
      '1': { base: 'size-5', alt: 'text-sm' },
      '2': { base: 'size-7', alt: 'text-base' },
      '3': { base: 'size-9', alt: 'text-lg' },
      '4': { base: 'size-11', alt: 'text-xl' },
      '5': { base: 'size-13', alt: 'text-2xl' },
    },
  },
});

export function Avatar({ className, alt, elevation, variant, size, onError, onLoad, ...props }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const slots = avatarVariants({ elevation, variant, failed, size });

  return (
    <div data-failed={failed ? '' : undefined} className={slots.base({ className })}>
      {alt && <span className={slots.alt()}>{alt}</span>}
      <img
        loading="lazy"
        decoding="async"
        alt={alt}
        ref={(img) => (!!img && img.complete ? setFailed(img.naturalWidth === 0) : undefined)}
        onError={(e) => (onError?.(e), setFailed(true))}
        onLoad={(e) => (onLoad?.(e), setFailed(e.currentTarget.naturalWidth === 0))}
        className={slots.img()}
        {...props}
      />
    </div>
  );
}
