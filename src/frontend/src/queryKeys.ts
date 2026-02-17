/**
 * Shared React Query key helpers for consistent cache invalidation.
 */

/**
 * Query key for ICP Controller status (principal-scoped).
 */
export function icpControllerStatusKey(principalText?: string) {
  return ['icpControllerStatus', principalText];
}

/**
 * Query key for ICP Controllers list.
 */
export function icpControllersKey(includeRevoked: boolean = false) {
  return ['icpControllers', includeRevoked];
}

/**
 * Query key for Security status (principal-scoped).
 */
export function securityStatusKey(principalText?: string) {
  return ['securityStatus', principalText];
}

/**
 * Query key for App Controller status (principal-scoped).
 */
export function appControllerStatusKey(principalText?: string) {
  return ['appControllerStatus', principalText];
}

/**
 * Query key for App Controller principal.
 */
export function appControllerPrincipalKey() {
  return ['appControllerPrincipal'];
}

/**
 * Query key for World Wide Web Controller status (principal-scoped).
 */
export function worldWideWebControllerStatusKey(principalText?: string) {
  return ['worldWideWebControllerStatus', principalText];
}

/**
 * Query key for World Wide Web Controllers list.
 */
export function worldWideWebControllersKey() {
  return ['worldWideWebControllers'];
}

/**
 * Query key for network graph data.
 */
export function networkGraphKey() {
  return ['networkGraph'];
}
