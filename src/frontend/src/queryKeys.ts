/**
 * Shared React Query key helpers for consistent cache invalidation.
 */

/**
 * Query key for target-aware actor (scoped by principal, network, and canisterId).
 */
export function actorKey(principalText: string, network: string, canisterId: string) {
  return ['targetActor', principalText, network, canisterId];
}

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
 * Query key for network graph data (scoped by network and canisterId).
 */
export function networkGraphKey(network: string, canisterId: string) {
  return ['networkGraph', network, canisterId];
}
