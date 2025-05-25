export const NAVIGATION_TAB_SWITCH = 'navigation:tab-switch';
export const NAVIGATION_PAGE_TRANSITION = 'navigation:page-transition';

export function emitTabSwitch(tabId) {
    eventBus.emit(NAVIGATION_TAB_SWITCH, { tabId });
}

export function emitPageTransition(pageId) {
    eventBus.emit(NAVIGATION_PAGE_TRANSITION, { pageId });
}