import { useQuery } from '@tanstack/react-query';
import { useTargetActor } from './useTargetActor';
import { useIcpControls } from './useIcpControls';

export function useBackendHealthCheck() {
  const { actor, isFetching: actorFetching } = useTargetActor();
  const { config } = useIcpControls();

  const query = useQuery<boolean, Error>({
    queryKey: ['backendHealth', config.network, config.canisterId],
    queryFn: async () => {
      if (!actor) {
        throw new Error('Backend actor is not available. Please check your connection.');
      }
      try {
        // Attempt a lightweight query to verify connectivity
        await actor.getCallerAppControllerStatus();
        return true;
      } catch (error: any) {
        throw new Error(`Backend connection failed: ${error.message || 'Unknown error'}`);
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    isConnected: query.data === true,
    isChecking: query.isLoading || actorFetching,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
}
