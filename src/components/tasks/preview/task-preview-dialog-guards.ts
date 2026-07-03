/** Prevent Radix Dialog from closing when interacting with portaled menus/popovers. */
export function isPortaledOverlayTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("[data-radix-popper-content-wrapper]") ||
    target.closest("[data-radix-dropdown-menu-content]") ||
    target.closest("[data-radix-popover-content]") ||
    target.closest("[data-radix-select-content]") ||
    target.closest("[data-radix-alert-dialog-content]") ||
    target.closest('[role="menu"]') ||
    target.closest('[role="alertdialog"]'),
  );
}

export function hasNestedDialog() {
  return document.querySelectorAll('[role="dialog"][data-state="open"]').length > 1;
}

export function hasOpenNestedOverlay() {
  return Boolean(
    document.querySelector(
      '[data-radix-dropdown-menu-content][data-state="open"], [data-radix-popover-content][data-state="open"], [data-radix-alert-dialog-content][data-state="open"], [data-radix-select-content][data-state="open"]',
    ),
  ) || hasNestedDialog();
}
