import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, T__4 as FilterCriteria, T as AuditEntry, InstanceContext, T__1 as ActionType, T__2 as EventSeverity, T__3 as BroadcastSettings } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

export function useGetCallerAppControllerStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['appControllerStatus', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.getCallerAppControllerStatus();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}

export function useGetCallerSecurityStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<boolean>({
    queryKey: ['securityStatus', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isSecurityUser();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useInitializeAppController() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor || !identity) throw new Error('Actor or identity not available');
      const context: InstanceContext = {
        contextPrincipal: identity.getPrincipal(),
        contextTimestamp: BigInt(Date.now()) * BigInt(1_000_000),
      };
      return actor.initialize(context);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appControllerStatus'] });
      toast.success('App Controller initialized successfully');
    },
    onError: (error: Error) => {
      // Silently handle "already initialized" errors
      if (!error.message.includes('already initialized')) {
        toast.error(`Failed to initialize App Controller: ${error.message}`);
      }
    },
  });
}

export function useGetAuditLogs(filter: FilterCriteria) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AuditEntry[]>({
    queryKey: ['auditLogs', filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAuditLogs(filter);
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });
}

export function useRecordAuditEntry() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<AuditEntry, 'user'> & { user?: any }) => {
      if (!actor || !identity) throw new Error('Actor or identity not available');
      const fullEntry: AuditEntry = {
        ...entry,
        user: identity.getPrincipal(),
      };
      return actor.recordAuditEntry(fullEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to record audit entry: ${error.message}`);
    },
  });
}

export function useFlagUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(userPrincipal);
      return actor.flagUser(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flaggedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      toast.success('User flagged successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to flag user: ${error.message}`);
    },
  });
}

export function useUnflagUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(userPrincipal);
      return actor.unflagUser(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flaggedUsers'] });
      toast.success('User unflagged successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unflag user: ${error.message}`);
    },
  });
}

export function useGetFlaggedUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['flaggedUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFlaggedUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useRemoveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(userPrincipal);
      return actor.removeUser(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flaggedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      toast.success('User removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove user: ${error.message}`);
    },
  });
}

export function useGetExternalBroadcastingSettings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<BroadcastSettings>({
    queryKey: ['externalBroadcastingSettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getExternalBroadcastingSettings();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useConfigureExternalBroadcasting() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enabled, endpointUrl }: { enabled: boolean; endpointUrl: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.configureExternalBroadcasting(enabled, endpointUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalBroadcastingSettings'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      toast.success('Broadcasting configuration updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update broadcasting: ${error.message}`);
    },
  });
}

export function useExportAuditLog() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.exportAuditLogToJson();
    },
    onError: (error: Error) => {
      toast.error(`Failed to export audit log: ${error.message}`);
    },
  });
}
