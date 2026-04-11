export function shouldRenderDisclosureBody({
  lazy = true,
  isOpen,
  hasOpenedOnce,
}: {
  lazy?: boolean;
  isOpen: boolean;
  hasOpenedOnce: boolean;
}) {
  if (!lazy) {
    return true;
  }

  return isOpen || hasOpenedOnce;
}

export function noteDisclosureOpened({
  nextOpen,
  hasOpenedOnce,
}: {
  nextOpen: boolean;
  hasOpenedOnce: boolean;
}) {
  return hasOpenedOnce || nextOpen;
}

export function shouldRenderPendingIntakePreviewList(itemCount: number) {
  return itemCount > 0;
}
