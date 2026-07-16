import React from 'react';
import { Dropdown, Popover, Tooltip } from 'antd';
import { DraggableLabelNumberInput } from 'draggable-number-input';
import { DiamondPlus } from 'lucide-react';
import { HiCheck } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';
import { RxCaretDown, RxLinkBreak2 } from 'react-icons/rx';
import type {
  ServlyDropdownProps,
  ServlyDraggableNumberInputProps,
  ServlyNumberInputAdapters,
  ServlyPopoverProps,
  ServlyTooltipProps,
} from '../types';

const AntdTooltip = ({
  title,
  trigger,
  placement,
  mouseEnterDelay,
  mouseLeaveDelay,
  color,
  children,
}: ServlyTooltipProps) => (
  <Tooltip
    title={title ? <span className="servly-number-input__tooltip-content">{title}</span> : null}
    trigger={trigger as never}
    placement={placement as never}
    mouseEnterDelay={mouseEnterDelay}
    mouseLeaveDelay={mouseLeaveDelay}
    color={color}
  >
    {children}
  </Tooltip>
);

const AntdPopover = ({
  open,
  content,
  placement,
  arrow,
  overlayClassName,
  overlayInnerStyle,
  autoAdjustOverflow,
  destroyTooltipOnHide,
  onOpenChange,
  children,
}: ServlyPopoverProps) => (
  <Popover
    destroyTooltipOnHide={destroyTooltipOnHide}
    content={content}
    trigger="click"
    open={open}
    placement={placement as never}
    arrow={arrow}
    overlayClassName={overlayClassName}
    overlayInnerStyle={overlayInnerStyle}
    autoAdjustOverflow={autoAdjustOverflow}
    onOpenChange={onOpenChange}
  >
    {children}
  </Popover>
);

const AntdDropdown = ({ items, open, onOpenChange, placement, trigger, overlayClassName, overlayStyle, children }: ServlyDropdownProps) => (
  <Dropdown
    menu={{
      className: overlayClassName,
      style: overlayStyle,
      items: items.map((item) =>
        item.type === 'divider'
          ? { key: item.key, type: 'divider' as const }
          : { key: item.key, label: item.label, onClick: item.onClick }
      ),
    }}
    placement={placement as never}
    trigger={trigger as never}
    open={open}
    onOpenChange={onOpenChange}
    overlayClassName={overlayClassName}
    overlayStyle={overlayStyle}
  >
    {children}
  </Dropdown>
);

const AntdDraggableNumberInput = (props: ServlyDraggableNumberInputProps) => {
  const draggableProps = props as unknown as React.ComponentProps<typeof DraggableLabelNumberInput>;
  return <DraggableLabelNumberInput {...draggableProps} />;
};

const TokenIcon = ({ className, size = 14 }: { className?: string; size?: number }) => (
  <DiamondPlus className={className} size={size} strokeWidth={1.8} />
);

/**
 * Creates the default styled adapter set backed by Ant Design, react-icons,
 * and draggable-number-input.
 */
export const createAntdServlyNumberInputAdapters = (): ServlyNumberInputAdapters => ({
  Tooltip: AntdTooltip,
  Popover: AntdPopover,
  Dropdown: AntdDropdown,
  DraggableNumberInput: AntdDraggableNumberInput,
  CaretDownIcon: RxCaretDown,
  CheckIcon: HiCheck,
  CloseIcon: IoClose,
  TokenIcon,
  UnlinkIcon: RxLinkBreak2,
});

export const antdServlyNumberInputAdapters = createAntdServlyNumberInputAdapters();
