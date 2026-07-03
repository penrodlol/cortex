import { type VariantProps, tv } from 'tailwind-variants';

export type SurfaceProps<T extends React.ElementType> = Omit<React.ComponentProps<T>, 'as'> & SurfaceVariants & { as?: T };

export type SurfaceVariants = VariantProps<typeof surfaceVariants>;

export const surfaceVariants = tv({
  variants: {
    rounded: { true: 'rounded' },
    opaque: { true: 'backdrop-blur-xl [--opacity:50%]', false: '[--opacity:100%]' },
    elevation: { '1': 'elevation-1', '2': 'elevation-2', '3': 'elevation-3' },
    variant: {
      'gray-surface': 'bg-gray-1/(--opacity)',
      'gray-soft': 'bg-gray-2/(--opacity)',
      'gray-surface-gradient': 'from-gray-1/(--opacity) to-gray-2/(--opacity) bg-linear-to-tr',
      'gray-soft-gradient': 'from-gray-2/(--opacity) to-gray-3/(--opacity) bg-linear-to-tr',
      'gray-surface-outline': 'bg-gray-1/(--opacity) border-gray-6 border',
      'gray-soft-outline': 'bg-gray-2/(--opacity) border-gray-6 border',
      'gray-surface-outline-gradient': 'from-gray-1/(--opacity) to-gray-2/(--opacity) border-gray-6 border bg-linear-to-tr',
      'gray-soft-outline-gradient': 'from-gray-2/(--opacity) to-gray-3/(--opacity) border-gray-6 border bg-linear-to-tr',
      'gray-ghost-outline': 'border-gray-6 border',
      'accent-surface': 'bg-accent-1/(--opacity)',
      'accent-soft': 'bg-accent-2/(--opacity)',
      'accent-surface-gradient': 'from-accent-1/(--opacity) to-accent-2/(--opacity) bg-linear-to-tr',
      'accent-soft-gradient': 'from-accent-2/(--opacity) to-accent-3/(--opacity) bg-linear-to-tr',
      'accent-surface-outline': 'bg-accent-1/(--opacity) border-accent-6 border',
      'accent-soft-outline': 'bg-accent-2/(--opacity) border-accent-6 border',
      'accent-surface-outline-gradient': 'from-accent-1/(--opacity) to-accent-2/(--opacity) border-accent-6 border bg-linear-to-tr',
      'accent-soft-outline-gradient': 'from-accent-2/(--opacity) to-accent-3/(--opacity) border-accent-6 border bg-linear-to-tr',
      'accent-ghost-outline': 'border-accent-6 border',
      'warn-surface': 'bg-warn-1/(--opacity)',
      'warn-soft': 'bg-warn-2/(--opacity)',
      'warn-surface-gradient': 'from-warn-1/(--opacity) to-warn-2/(--opacity) bg-linear-to-tr',
      'warn-soft-gradient': 'from-warn-2/(--opacity) to-warn-3/(--opacity) bg-linear-to-tr',
      'warn-surface-outline': 'bg-warn-1/(--opacity) border-warn-6 border',
      'warn-soft-outline': 'bg-warn-2/(--opacity) border-warn-6 border',
      'warn-surface-outline-gradient': 'from-warn-1/(--opacity) to-warn-2/(--opacity) border-warn-6 border bg-linear-to-tr',
      'warn-soft-outline-gradient': 'from-warn-2/(--opacity) to-warn-3/(--opacity) border-warn-6 border bg-linear-to-tr',
      'warn-ghost-outline': 'border-warn-6 border',
      'danger-surface': 'bg-danger-1/(--opacity)',
      'danger-soft': 'bg-danger-2/(--opacity)',
      'danger-surface-gradient': 'from-danger-1/(--opacity) to-danger-2/(--opacity) bg-linear-to-tr',
      'danger-soft-gradient': 'from-danger-2/(--opacity) to-danger-3/(--opacity) bg-linear-to-tr',
      'danger-surface-outline': 'bg-danger-1/(--opacity) border-danger-6 border',
      'danger-soft-outline': 'bg-danger-2/(--opacity) border-danger-6 border',
      'danger-surface-outline-gradient': 'from-danger-1/(--opacity) to-danger-2/(--opacity) border-danger-6 border bg-linear-to-tr',
      'danger-soft-outline-gradient': 'from-danger-2/(--opacity) to-danger-3/(--opacity) border-danger-6 border bg-linear-to-tr',
      'danger-ghost-outline': 'border-danger-6 border',
    },
  },
});

export function getSurfaceVariantKeys() {
  return Object.keys(surfaceVariants.variants.variant).reduce(
    (acc, key) => {
      if (key.startsWith('gray-')) (acc.gray ??= [])?.push(key);
      else if (key.startsWith('accent-')) (acc.accent ??= [])?.push(key);
      else if (key.startsWith('warn-')) (acc.warn ??= [])?.push(key);
      else if (key.startsWith('danger-')) (acc.danger ??= [])?.push(key);
      return acc;
    },
    // https://github.com/heroui-inc/tailwind-variants/issues/185
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as Record<'gray' | 'accent' | 'warn' | 'danger', any>,
  );
}

export function Surface<T extends React.ElementType = 'div'>({
  as,
  className,
  rounded,
  opaque,
  elevation,
  variant,
  ...props
}: SurfaceProps<T>) {
  const Component = as ?? 'div';
  return <Component className={surfaceVariants({ rounded, opaque, elevation, variant, className })} {...props} />;
}
