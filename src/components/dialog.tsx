import * as AriaDialog from 'react-aria-components/Dialog';
import * as AriaModal from 'react-aria-components/Modal';
import * as AriaPressable from 'react-aria-components/Pressable';
import { cn, tv, type ClassValue, type VariantProps } from 'tailwind-variants';
import Surface from './surface';

export type DialogRootProps = React.ComponentProps<typeof AriaDialog.DialogTrigger>;
export type DialogTriggerProps = React.ComponentProps<typeof AriaPressable.Pressable>;
export type DialogPortalProps = Omit<React.ComponentProps<typeof AriaModal.ModalOverlay>, 'className'> &
  DialogPortalVariants & {
    className?: ClassValue;
    modalContainerProps?: Omit<React.ComponentProps<'div'>, 'children'>;
    modalProps?: Omit<React.ComponentProps<typeof AriaModal.Modal>, 'children' | 'className'> & { className?: ClassValue };
  };
export type DialogContentProps = Omit<React.ComponentProps<typeof Surface<typeof AriaModal.Dialog>>, 'as'>;
export type DialogBodyProps = React.ComponentProps<'div'>;

export type DialogPortalVariants = VariantProps<typeof dialogPortalVariants>;

export const dialogPortalVariants = tv({
  slots: {
    base: [
      'absolute top-0 left-0 w-full text-center backdrop-blur-3xl',
      'isolate z-20 h-(--page-height) motion-safe:transition-opacity',
      'motion-safe:entering:opacity-0 motion-safe:exiting:opacity-0',
      'motion-safe:entering:ease-out motion-safe:exiting:ease-in',
    ],
    modalContainer: 'sticky left-0 flex h-(--visual-viewport-height) w-full items-center justify-center',
    modal: [
      'max-h-[calc(var(--visual-viewport-height)*0.9)] w-full text-left align-middle',
      'motion-safe:entering:opacity-0 motion-safe:entering:ease-in',
      'motion-safe:exiting:opacity-0 motion-safe:exiting:ease-out',
    ],
  },
  defaultVariants: { variant: 'gray-surface-outline', align: 'center', size: '2' },
  variants: {
    align: {
      top: {
        modalContainer: 'top-0 items-start justify-center py-10',
        modal: 'motion-safe:entering:-translate-y-2 motion-safe:exiting:-translate-y-2 motion-safe:transition-[translate,opacity]',
      },
      center: {
        modalContainer: 'items-center justify-center',
        modal: 'motion-safe:entering:scale-95 motion-safe:exiting:scale-95 motion-safe:transition-[scale,opacity]',
      },
      bottom: {
        modalContainer: 'bottom-0 items-end justify-center py-10',
        modal: 'motion-safe:entering:translate-y-2 motion-safe:exiting:translate-y-2 bottom-0 motion-safe:transition-[translate,opacity]',
      },
    },
    size: {
      '1': { modal: 'max-w-[min(90vw,--spacing(100))]' },
      '2': { modal: 'max-w-[min(90vw,--spacing(150))]' },
      '3': { modal: 'max-w-[min(90vw,--spacing(200))]' },
      '4': { modal: 'max-w-[min(90vw,--spacing(250))]' },
      '5': { modal: 'max-w-[min(90vw,--spacing(300))]' },
    },
  },
});

export const Root = AriaDialog.DialogTrigger;
export const Trigger = AriaPressable.Pressable;

export function Portal({ children, className, align, size, modalContainerProps, modalProps, ...props }: DialogPortalProps) {
  const slots = dialogPortalVariants({ align, size });
  const { className: modalContainerClassName, ...internalModalContainerProps } = modalContainerProps ?? {};
  const { className: modalClassName, ...internalModalProps } = modalProps ?? {};
  return (
    <AriaModal.ModalOverlay className={slots.base({ className })} {...props}>
      <div className={slots.modalContainer({ className: modalContainerClassName })} {...internalModalContainerProps}>
        <AriaModal.Modal className={slots.modal({ className: modalClassName })} {...internalModalProps}>
          {children}
        </AriaModal.Modal>
      </div>
    </AriaModal.ModalOverlay>
  );
}

export function Content({ className, ...props }: DialogContentProps) {
  return <Surface as={AriaDialog.Dialog} className={cn('scrollbar max-h-[inherit] overflow-auto outline-none', className)} {...props} />;
}
