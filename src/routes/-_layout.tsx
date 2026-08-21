import Surface from '#/components/surface';
import { cn, tv, type VariantProps } from 'tailwind-variants';

export type LayoutRootProps = React.ComponentProps<typeof Surface>;
export type LayoutRowProps = React.ComponentProps<typeof Surface> & LayoutRowVariants;
export type LayoutContentProps = React.ComponentProps<typeof Surface>;

export type LayoutRowVariants = VariantProps<typeof layoutRowVariants>;

export const layoutRowVariants = tv({
  base: [
    'border-gray-6 flex',
    '2xl:border-transparent',
    '2xl:[border-image:linear-gradient(to_right,transparent,var(--gray-6)_calc((100%-var(--container-7xl))/2),var(--gray-6)_calc((100%+var(--container-7xl))/2),transparent)_1]',
  ],
  defaultVariants: { border: 'bottom' },
  variants: { border: { top: 'border-t', bottom: 'border-b', none: 'border-none' } },
});

export function Root({ className, ...props }: LayoutRootProps) {
  return <Surface className={cn('mx-auto w-full max-w-[calc(var(--container-7xl)+var(--spacing)*80)]', className)} {...props} />;
}

export function Row({ className, border, ...props }: LayoutRowProps) {
  return <Surface className={layoutRowVariants({ border, className })} {...props} />;
}

export function Content({ className, ...props }: LayoutContentProps) {
  return <Surface className={cn('border-gray-6 mx-auto w-full max-w-7xl 2xl:border-x', className)} {...props} />;
}
