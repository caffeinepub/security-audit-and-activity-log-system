import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface InstanceContext {
    contextPrincipal: Principal;
    contextTimestamp: Time;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface T__4 {
    user?: Principal;
    actionType?: T__1;
    toDate?: Time;
    fromDate?: Time;
    severity?: T__2;
}
export interface T__3 {
    enabled: boolean;
    endpointUrl?: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface T {
    sessionData?: string;
    user: Principal;
    actionType: T__1;
    timestamp: Time;
    details: string;
    deviceInfo?: string;
    success?: boolean;
    severity: T__2;
    ipAddress?: string;
}
export interface IcpController {
    principal: Principal;
    revokedTimestamp?: Time;
    name?: string;
    createdBy?: Principal;
    description?: string;
    roleAssigned: boolean;
    lastActiveTimestamp?: Time;
    assignedTimestamp: Time;
}
export interface UserProfile {
    name: string;
}
export enum T__1 {
    unauthorizedAttempt = "unauthorizedAttempt",
    loginAttempt = "loginAttempt",
    permissionChange = "permissionChange",
    superuserPrivilegeChange = "superuserPrivilegeChange",
    dataExport = "dataExport",
    general = "general",
    accountChange = "accountChange",
    configUpload = "configUpload",
    dataImport = "dataImport",
    worldWideWebControllerPrivilegeChange = "worldWideWebControllerPrivilegeChange"
}
export enum T__2 {
    warning = "warning",
    info = "info",
    critical = "critical"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    configureExternalBroadcasting(enabled: boolean, endpointUrl: string | null): Promise<void>;
    exportAuditLogToJson(): Promise<Array<T>>;
    flagUser(user: Principal): Promise<void>;
    getAllWorldWideWebControllers(): Promise<Array<Principal>>;
    getAppController(): Promise<Principal | null>;
    getAuditLogs(filter: T__4): Promise<Array<T>>;
    getCallerAppControllerStatus(): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExternalBroadcastingSettings(): Promise<T__3>;
    getFlaggedUsers(): Promise<Array<Principal>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    grantIcpControllerRole(target: Principal, name: string | null, description: string | null): Promise<void>;
    grantSecurityRole(target: Principal): Promise<void>;
    grantWorldWideWebControllerRole(target: Principal): Promise<void>;
    hasIcpControllerRole(): Promise<boolean>;
    hasWorldWideWebControllerRole(): Promise<boolean>;
    initialize(context: InstanceContext): Promise<void>;
    isAppController(user: Principal): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isSecurityUser(): Promise<boolean>;
    isUserFlagged(user: Principal): Promise<boolean>;
    isWorldWideWebController(target: Principal): Promise<boolean>;
    listIcpControllers(includeRevoked: boolean): Promise<Array<IcpController>>;
    recordAuditEntry(entry: T): Promise<void>;
    removeUser(user: Principal): Promise<void>;
    revokeIcpControllerRole(target: Principal): Promise<void>;
    revokeSecurityRole(target: Principal): Promise<void>;
    revokeWorldWideWebControllerRole(target: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unflagUser(user: Principal): Promise<void>;
    updateIcpControllerDescription(target: Principal, name: string, description: string | null): Promise<void>;
}
