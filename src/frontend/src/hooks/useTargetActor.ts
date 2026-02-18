import { useQuery } from '@tanstack/react-query';
import { useInternetIdentity } from './useInternetIdentity';
import { useIcpControls } from './useIcpControls';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';
import { actorKey } from '../queryKeys';

/**
 * Target-aware actor hook that recreates the actor when ICP Controls change.
 * This ensures backend calls always use the current network and canister ID.
 */
export function useTargetActor() {
  const { identity } = useInternetIdentity();
  const { config } = useIcpControls();

  const actorQuery = useQuery<backendInterface>({
    queryKey: actorKey(
      identity?.getPrincipal().toString() || 'anonymous',
      config.network,
      config.canisterId
    ),
    queryFn: async () => {
      const isAuthenticated = !!identity;

      const actorOptions = isAuthenticated
        ? { agentOptions: { identity } }
        : undefined;

      const actor = await createActorWithConfig(actorOptions);

      if (isAuthenticated) {
        const adminToken = getSecretParameter('caffeineAdminToken') || '';
        await actor._initializeAccessControlWithSecret(adminToken);
      }

      return actor;
    },
    staleTime: Infinity,
    enabled: true,
  });

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
    isError: actorQuery.isError,
    error: actorQuery.error,
  };
}
