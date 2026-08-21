import { createContext, use, useState } from 'react';
import { cn, tv, type VariantProps } from 'tailwind-variants';
import Button from './button';

export type CollapsibleRootProps<T extends React.ElementType> = Omit<React.ComponentProps<T>, 'as'> & {
  as?: T;
  open?: CollapsibleContextValue['open'];
  onOpenChange?: (open: CollapsibleContextValue['open']) => void;
};
export type CollapsibleTriggerProps = React.ComponentProps<typeof Button> & CollapsibleTriggerVariants;
export type CollapsibleContentProps<T extends React.ElementType> = Omit<React.ComponentProps<T>, 'as'> &
  CollapsibleContentVariants & { as?: T };

export type CollapsibleTriggerVariants = VariantProps<typeof collapsibleTriggerVariants>;
export type CollapsibleContentVariants = VariantProps<typeof collapsibleContentVariants>;

export const collapsibleTriggerVariants = tv({ variants: { overlay: { true: 'absolute inset-0 z-10 size-full p-0' } } });

export const collapsibleContentVariants = tv({
  base: 'pointer-events-none z-20 h-auto overflow-hidden [interpolate-size:allow-keywords] motion-safe:transition-[height]',
  variants: { faded: { true: 'mask-intersect data-collapsed:mask-b-from-65%' } },
});

export type CollapsibleContextValue = { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> };
export const CollapsibleContext = createContext<CollapsibleContextValue | undefined>(undefined);
export function useCollapsible() {
  const context = use(CollapsibleContext);
  if (!context) throw new Error('useCollapsible must be used within a CollapsibleProvider');
  return context;
}

export function Root<T extends React.ElementType = 'div'>({
  as,
  className,
  elevation,
  variant,
  open: externalOpen,
  onOpenChange,
  ...props
}: CollapsibleRootProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const Component = as ?? 'div';

  const setOpen: CollapsibleContextValue['setOpen'] = (value) => {
    const nextValue = typeof value === 'function' ? (value as (prev: boolean) => boolean)(open) : value;
    if (externalOpen == null) setInternalOpen(nextValue);
    onOpenChange?.(nextValue);
  };

  return (
    <CollapsibleContext value={{ open, setOpen }}>
      <Component
        data-collapsed={open ? undefined : true}
        className={cn('group/collapsible relative rounded motion-safe:transition-all', className)}
        {...(props as CollapsibleRootProps<T>)}
      />
    </CollapsibleContext>
  );
}

export function Trigger({ className, overlay, ...props }: CollapsibleTriggerProps) {
  const { setOpen } = useCollapsible();
  return (
    <Button
      animate={false}
      variant="gray-ghost"
      className={collapsibleTriggerVariants({ overlay, className })}
      onPress={() => setOpen((prev) => !prev)}
      {...props}
    />
  );
}

export function Content<T extends React.ElementType = 'div'>({ as, className, faded, ...props }: CollapsibleContentProps<T>) {
  const Component = as ?? 'div';
  const { open } = useCollapsible();
  return (
    <Component
      data-collapsed={open ? undefined : true}
      className={collapsibleContentVariants({ faded, className })}
      {...(props as CollapsibleContentProps<T>)}
    />
  );
}
