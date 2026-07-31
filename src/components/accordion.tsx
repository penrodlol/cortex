import { getComponentVariants } from '@/libs/variants';
import * as AriaDisclosure from 'react-aria-components/Disclosure';
import * as AriaDisclosureGroup from 'react-aria-components/DisclosureGroup';
import { cn, tv, type ClassValue, type VariantProps } from 'tailwind-variants';

export type AccordionRootProps = React.ComponentProps<typeof AriaDisclosureGroup.DisclosureGroup>;
export type AccordionItemProps = React.ComponentProps<typeof AriaDisclosure.Disclosure>;
export type AccordionItemHeaderProps = Omit<React.ComponentProps<typeof AriaDisclosure.Button>, 'className'> &
  AccordionItemHeaderVariants & { className?: ClassValue };
export type AccordionItemPanelProps = Omit<React.ComponentProps<typeof AriaDisclosure.DisclosurePanel>, 'className'> &
  AccordionItemPanelVariants & { className?: ClassValue };

export type AccordionItemHeaderVariants = VariantProps<typeof accordionItemHeaderVariants>;
export type AccordionItemPanelVariants = VariantProps<typeof accordionItemPanelVariants>;

export const accordionItemHeaderVariants = tv({
  extend: getComponentVariants({ slot: 'button', hover: true }).variants,
  slots: { base: '', button: 'w-full py-3 text-left outline-none focus-visible:ring' },
  defaultVariants: { variant: 'gray-ghost' },
  compoundVariants: [
    { variant: ['gray-ghost', 'gray-accent-ghost', 'gray-warn-ghost', 'gray-danger-ghost'], className: { button: 'text-gray-12' } },
    { variant: 'accent-ghost', className: { button: 'text-accent-11' } },
    { variant: 'warn-ghost', className: { button: 'text-warn-11' } },
    { variant: 'danger-ghost', className: { button: 'text-danger-11' } },
  ],
});

export const accordionItemPanelVariants = tv({
  slots: { base: 'h-(--disclosure-panel-height) overflow-clip motion-safe:transition-[height]', content: 'pt-4 pb-8' },
});

export const Root = AriaDisclosureGroup.DisclosureGroup;

export function Item({ className, ...props }: AccordionItemProps) {
  return <AriaDisclosure.Disclosure className={cn('group/accordion-item', className)} {...props} />;
}

export function ItemHeader({ className, ...props }: AccordionItemHeaderProps) {
  const slots = accordionItemHeaderVariants();
  return (
    <AriaDisclosure.Heading className={slots.base({ className })}>
      <AriaDisclosure.Button slot="trigger" className={slots.button()} {...props} />
    </AriaDisclosure.Heading>
  );
}

export function ItemPanel({ children, className, ...props }: AccordionItemPanelProps) {
  const slots = accordionItemPanelVariants();
  return (
    <AriaDisclosure.DisclosurePanel className={slots.base({ className })} {...props}>
      <div className={slots.content()}>{children}</div>
    </AriaDisclosure.DisclosurePanel>
  );
}
