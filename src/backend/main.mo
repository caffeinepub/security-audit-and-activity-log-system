import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Int "mo:core/Int";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";

import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  module ActionType {
    public type T = {
      #loginAttempt;
      #permissionChange;
      #dataExport;
      #dataImport;
      #accountChange;
      #unauthorizedAttempt;
      #configUpload;
      #general;
    };
  };

  module EventSeverity {
    public type T = {
      #info;
      #warning;
      #critical;
    };
  };

  module AuditEntry {
    public type T = {
      timestamp : Time.Time;
      user : Principal;
      actionType : ActionType.T;
      details : Text;
      ipAddress : ?Text;
      deviceInfo : ?Text;
      sessionData : ?Text;
      success : ?Bool;
      severity : EventSeverity.T;
    };
  };

  module FilterCriteria {
    public type T = {
      fromDate : ?Time.Time;
      toDate : ?Time.Time;
      user : ?Principal;
      actionType : ?ActionType.T;
      severity : ?EventSeverity.T;
    };
  };

  module BroadcastSettings {
    public type T = {
      enabled : Bool;
      endpointUrl : ?Text;
    };
  };

  module AuditEvent {
    public type T = {
      eventType : Text;
      timestamp : Time.Time;
      userPrincipal : Text;
      details : Text;
      severity : EventSeverity.T;
    };
  };

  module QueryUtils {
    public func compareByTimestamp(entry1 : AuditEntry.T, entry2 : AuditEntry.T) : Order.Order {
      Int.compare(entry2.timestamp, entry1.timestamp);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  public type InstanceContext = {
    contextPrincipal : Principal;
    contextTimestamp : Time.Time;
  };

  public type SecurityUser = {
    principal : Principal;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var userProfiles = Map.empty<Principal, UserProfile>();
  var flaggedUsers = Map.empty<Principal, Bool>();

  var auditLogEntries : List.List<AuditEntry.T> = List.empty<AuditEntry.T>();
  var instanceContext : ?InstanceContext = null;

  var externalBroadcastingEnabled : Bool = false;
  var externalEndpointUrl : ?Text = null;

  var securityUsers = Map.empty<Principal, SecurityUser>();

  public shared ({ caller }) func initialize(context : InstanceContext) : async () {
    if (caller != context.contextPrincipal) {
      Runtime.trap("Unauthorized: Caller must match the context principal");
    };

    switch (instanceContext) {
      case (?_) {
        Runtime.trap("System already initialized");
      };
      case (null) {
        instanceContext := ?context;
      };
    };
  };

  public query ({ caller }) func isAppController(user : Principal) : async Bool {
    switch (instanceContext) {
      case (?context) {
        user == context.contextPrincipal;
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getCallerAppControllerStatus() : async Bool {
    switch (instanceContext) {
      case (?context) {
        caller == context.contextPrincipal;
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    assertUserAccess(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user) {
      assertAdmin(caller);
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    assertUserAccess(caller);
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func recordAuditEntry(entry : AuditEntry.T) : async () {
    assertSecurityOrAppController(caller);
    auditLogEntries.add(entry);
    await processBroadcastIfNeeded(entry, entry.actionType, entry.severity);
  };

  public query ({ caller }) func getAuditLogs(filter : FilterCriteria.T) : async [AuditEntry.T] {
    assertSecurityOrAppController(caller);

    var entries = auditLogEntries.toArray();

    switch (filter.fromDate, filter.toDate) {
      case (?from, ?to) {
        entries := entries.filter(
          func(entry : AuditEntry.T) : Bool {
            entry.timestamp >= from and entry.timestamp <= to
          }
        );
      };
      case (?from, null) {
        entries := entries.filter(func(entry : AuditEntry.T) : Bool { entry.timestamp >= from });
      };
      case (null, ?to) {
        entries := entries.filter(func(entry : AuditEntry.T) : Bool { entry.timestamp <= to });
      };
      case (_) {};
    };

    switch (filter.user) {
      case (?user) {
        entries := entries.filter(func(entry : AuditEntry.T) : Bool { entry.user == user });
      };
      case (null) {};
    };

    switch (filter.actionType) {
      case (?actionType) {
        entries := entries.filter(
          func(entry : AuditEntry.T) : Bool { entry.actionType == actionType }
        );
      };
      case (null) {};
    };

    switch (filter.severity) {
      case (?severity) {
        entries := entries.filter(func(entry : AuditEntry.T) : Bool { entry.severity == severity });
      };
      case (null) {};
    };

    entries.sort(QueryUtils.compareByTimestamp);
  };

  public shared ({ caller }) func flagUser(user : Principal) : async () {
    assertSecurityOrAppController(caller);
    flaggedUsers.add(user, true);
    await processBroadcastIfNeeded(
      {
        timestamp = Time.now();
        user;
        actionType = #accountChange;
        details = "User flagged as suspicious";
        ipAddress = null;
        deviceInfo = null;
        sessionData = null;
        success = null;
        severity = #warning;
      },
      #accountChange,
      #warning,
    );
  };

  public shared ({ caller }) func unflagUser(user : Principal) : async () {
    assertSecurityOrAppController(caller);
    flaggedUsers.remove(user);
  };

  public query ({ caller }) func getFlaggedUsers() : async [Principal] {
    assertSecurityOrAppController(caller);
    flaggedUsers.entries().map<(Principal, Bool), Principal>(
        func((principal, _)) : Principal { principal }
      ).toArray();
  };

  public query ({ caller }) func isUserFlagged(user : Principal) : async Bool {
    assertSecurityOrAppController(caller);
    switch (flaggedUsers.get(user)) {
      case (?_) { true };
      case (null) { false };
    };
  };

  public shared ({ caller }) func removeUser(user : Principal) : async () {
    assertSecurityOrAppController(caller);
    userProfiles.remove(user);
    flaggedUsers.remove(user);
    await processBroadcastIfNeeded(
      {
        timestamp = Time.now();
        user;
        actionType = #accountChange;
        details = "User account removed";
        ipAddress = null;
        deviceInfo = null;
        sessionData = null;
        success = null;
        severity = #warning;
      },
      #accountChange,
      #warning,
    );
  };

  public shared ({ caller }) func configureExternalBroadcasting(
    enabled : Bool,
    endpointUrl : ?Text,
  ) : async () {
    assertSecurityOrAppController(caller);
    externalBroadcastingEnabled := enabled;
    externalEndpointUrl := endpointUrl;
  };

  // Public getter for external broadcasting settings - restricted to security/app controller
  public query ({ caller }) func getExternalBroadcastingSettings() : async BroadcastSettings.T {
    assertSecurityOrAppController(caller);
    { enabled = externalBroadcastingEnabled; endpointUrl = externalEndpointUrl };
  };

  // Role management functions for Security role.
  public shared ({ caller }) func grantSecurityRole(target : Principal) : async () {
    assertAppController(caller);

    if (securityUsers.containsKey(target)) {
      Runtime.trap("User already has Security role");
    };

    let newUser : SecurityUser = { principal = target };
    securityUsers.add(target, newUser);
  };

  public shared ({ caller }) func revokeSecurityRole(target : Principal) : async () {
    assertAppController(caller);

    switch (securityUsers.get(target)) {
      case (null) {
        Runtime.trap("User does not have Security role - cannot revoke");
      };
      case (?_) {
        securityUsers.remove(target);
      };
    };
  };

  public query ({ caller }) func isSecurityUser() : async Bool {
    securityUsers.containsKey(caller);
  };

  func assertSecurityOrAppController(caller : Principal) {
    let isSecurity = securityUsers.containsKey(caller);

    let isAppController = switch (instanceContext) {
      case (?context) { caller == context.contextPrincipal };
      case (null) { false };
    };

    if (not (isSecurity or isAppController)) {
      Runtime.trap("Unauthorized: Only security users or app controller can perform this action");
    };
  };

  func assertAppController(caller : Principal) {
    switch (instanceContext) {
      case (?context) {
        if (caller != context.contextPrincipal) {
          Runtime.trap("Unauthorized: Only app controller can perform this action");
        };
      };
      case (null) {
        Runtime.trap("System not initialized");
      };
    };
  };

  func assertAdmin(caller : Principal) {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  func assertUserAccess(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  public shared query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  func processBroadcastIfNeeded(
    entry : AuditEntry.T,
    _actionType : ActionType.T,
    severity : EventSeverity.T,
  ) : async () {
    if (externalBroadcastingEnabled and severity == #critical) {
      let event = {
        eventType = "Critical " # debug_show (_actionType);
        timestamp = entry.timestamp;
        userPrincipal = entry.user.toText();
        details = entry.details;
        severity = #critical;
      };
      await sendExternalBroadcast(event);
    } else if (externalBroadcastingEnabled and severity == #warning and _actionType == #accountChange) {
      let event = {
        eventType = "Flagged User Notification";
        timestamp = entry.timestamp;
        userPrincipal = entry.user.toText();
        details = entry.details;
        severity = #warning;
      };
      await sendExternalBroadcast(event);
    };
  };

  func sendExternalBroadcast(event : AuditEvent.T) : async () {
    switch (externalEndpointUrl) {
      case (?url) {
        await sendHttpOutcall(url, event);
      };
      case (null) {};
    };
  };

  func sendHttpOutcall(url : Text, _event : AuditEvent.T) : async () {
    ignore await OutCall.httpPostRequest(
      url,
      [],
      "{}",
      transform,
    );
  };

  // Superuser controls
  public shared ({ caller }) func exportAuditLogToJson() : async [AuditEntry.T] {
    assertSecurityOrAppController(caller);
    let exportLogEntry : AuditEntry.T = {
      timestamp = Time.now();
      user = caller;
      actionType = #dataExport;
      details = "Superuser export performed";
      ipAddress = null;
      deviceInfo = null;
      sessionData = null;
      success = ?true;
      severity = #info;
    };
    auditLogEntries.add(exportLogEntry);
    auditLogEntries.toArray();
  };
};

