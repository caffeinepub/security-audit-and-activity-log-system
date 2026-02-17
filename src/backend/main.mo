import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Int "mo:core/Int";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";

import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type NodeId = Nat;
  type EdgeId = Nat;

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
      #superuserPrivilegeChange;
      #worldWideWebControllerPrivilegeChange;
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

  public type IcpController = {
    principal : Principal;
    name : ?Text;
    description : ?Text;
    roleAssigned : Bool;
    assignedTimestamp : Time.Time;
    lastActiveTimestamp : ?Time.Time;
    createdBy : ?Principal;
    revokedTimestamp : ?Time.Time;
  };

  public type WorldWideWebController = {
    roleAssigned : Bool;
    assignedTimestamp : Time.Time;
    principal : Principal;
    grantedBy : ?Principal;
  };

  public type Node = {
    id : NodeId;
    nodeLabel : Text;
    x : Float;
    y : Float;
    created : Time.Time;
    updated : Time.Time;
  };

  public type Edge = {
    id : EdgeId;
    source : NodeId;
    target : NodeId;
    weight : Float;
    directed : Bool;
    created : Time.Time;
    updated : Time.Time;
  };

  public type GraphUpdateResult = {
    result : ResultType;
    remoteChanges : ?RemoteEdits;
  };

  public type ResultType = {
    #updated;
    #conflict;
    #notFound;
    #invalidData;
    #unknownError;
    #updatedWithRemoteChanges;
  };

  public type RemoteEdits = {
    addedNodes : [Node];
    updatedNodes : [Node];
    deletedNodes : [NodeId];
    addedEdges : [Edge];
    updatedEdges : [Edge];
    deletedEdges : [EdgeId];
    deletedNodesFromExternal : [NodeId];
    deletedEdgesFromExternal : [EdgeId];
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var userProfiles = Map.empty<Principal, UserProfile>();
  var flaggedUsers = Map.empty<Principal, Bool>();
  var securityUsers = Map.empty<Principal, SecurityUser>();

  var instanceContext : ?InstanceContext = null;

  var externalBroadcastingEnabled : Bool = false;
  var externalEndpointUrl : ?Text = null;

  var icpControllerState = Map.empty<Principal, IcpController>();
  var worldWideWebControllerState = Map.empty<Principal, WorldWideWebController>();
  var auditLogEntries : List.List<AuditEntry.T> = List.empty<AuditEntry.T>();

  var nodes = Map.empty<NodeId, Node>();
  var edges = Map.empty<EdgeId, Edge>();
  var nodeIdCounter : NodeId = 0;
  var edgeIdCounter : EdgeId = 0;

  public query ({ caller }) func getAppController() : async ?Principal {
    switch (instanceContext) {
      case (?context) { ?context.contextPrincipal };
      case (null) { null };
    };
  };

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

  public query ({ caller }) func getExternalBroadcastingSettings() : async BroadcastSettings.T {
    assertSecurityOrAppController(caller);
    { enabled = externalBroadcastingEnabled; endpointUrl = externalEndpointUrl };
  };

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

  public shared ({ caller }) func grantIcpControllerRole(target : Principal, name : ?Text, description : ?Text) : async () {
    assertAppController(caller);
    let now = Time.now();

    if (icpControllerState.containsKey(target)) {
      switch (icpControllerState.get(target)) {
        case (?icpController) {
          if (icpController.roleAssigned) {
            Runtime.trap("Principal already has ICP Controller role. Use updateIcpControllerDescription for updates.");
          } else {
            let updatedIcpController = {
              icpController with
              name;
              description;
              roleAssigned = true;
              assignedTimestamp = now;
              lastActiveTimestamp = ?now;
              createdBy = ?caller;
              revokedTimestamp = null;
            };
            icpControllerState.add(target, updatedIcpController);
            recordIcpControllerAuditEvent("Reactivated ICP Controller with role", caller, target, true);
            return;
          };
        };
        case (null) {};
      };
    };

    let newIcpController : IcpController = {
      principal = target;
      name;
      description;
      roleAssigned = true;
      assignedTimestamp = now;
      lastActiveTimestamp = ?now;
      createdBy = ?caller;
      revokedTimestamp = null;
    };

    icpControllerState.add(target, newIcpController);
    recordIcpControllerAuditEvent("Assigned new ICP Controller role", caller, target, true);
  };

  public shared ({ caller }) func updateIcpControllerDescription(
    target : Principal,
    name : Text,
    description : ?Text,
  ) : async () {
    assertAppController(caller);

    switch (icpControllerState.get(target)) {
      case (?icpController) {
        let updatedIcpController = {
          icpController with
          name = ?name;
          description;
        };
        icpControllerState.add(target, updatedIcpController);
        recordIcpControllerAuditEvent(
          "Updated ICP Controller description for " # target.toText(),
          caller,
          target,
          true,
        );
      };
      case (null) {
        Runtime.trap("ICP Controller not found for principal: " # target.toText());
      };
    };
  };

  public shared ({ caller }) func revokeIcpControllerRole(target : Principal) : async () {
    assertAppController(caller);
    switch (icpControllerState.get(target)) {
      case (?icpController) {
        if (icpController.roleAssigned) {
          let updatedIcpController = {
            icpController with
            roleAssigned = false;
            revokedTimestamp = ?Time.now();
          };
          icpControllerState.add(target, updatedIcpController);
          recordIcpControllerAuditEvent("Revoked ICP Controller role", caller, target, false);
        } else {
          Runtime.trap("ICP Controller role is already revoked for principal: " # target.toText());
        };
      };
      case (null) {
        Runtime.trap("ICP Controller not found for principal: " # target.toText());
      };
    };
  };

  public query ({ caller }) func listIcpControllers(includeRevoked : Bool) : async [IcpController] {
    assertAppController(caller);
    icpControllerState.values().toArray().filter(
      func(controller) {
        includeRevoked or controller.roleAssigned == true
      }
    );
  };

  public query ({ caller }) func hasIcpControllerRole() : async Bool {
    switch (icpControllerState.get(caller)) {
      case (?controller) { controller.roleAssigned };
      case (null) { false };
    };
  };

  func recordIcpControllerAuditEvent(
    details : Text,
    initiator : Principal,
    target : Principal,
    granted : Bool,
  ) {
    let auditEntry : AuditEntry.T = {
      timestamp = Time.now();
      user = initiator;
      actionType = #superuserPrivilegeChange;
      details = details # " (Target " # target.toText() # ", granted: " # debug_show granted # ")";
      ipAddress = null;
      deviceInfo = null;
      sessionData = null;
      success = ?true;
      severity = #info;
    };
    auditLogEntries.add(auditEntry);
  };

  public shared ({ caller }) func grantWorldWideWebControllerRole(target : Principal) : async () {
    assertAppController(caller);

    let now = Time.now();
    let newController : WorldWideWebController = {
      principal = target;
      roleAssigned = true;
      assignedTimestamp = now;
      grantedBy = ?caller;
    };

    worldWideWebControllerState.add(target, newController);
    recordWorldWideWebControllerAuditEvent("Granted World Wide Web Controller role", caller, target, true);
  };

  public shared ({ caller }) func revokeWorldWideWebControllerRole(target : Principal) : async () {
    assertAppController(caller);

    switch (worldWideWebControllerState.get(target)) {
      case (null) {
        Runtime.trap("World Wide Web Controller role does not exist");
      };
      case (?controller) {
        if (controller.roleAssigned) {
          let updatedController = {
            controller with
            roleAssigned = false;
            grantedBy = ?caller;
          };
          worldWideWebControllerState.add(target, updatedController);
          recordWorldWideWebControllerAuditEvent("Revoked World Wide Web Controller role", caller, target, false);
        } else {
          Runtime.trap("World Wide Web Controller role is already revoked for this user");
        };
      };
    };
  };

  public query ({ caller }) func hasWorldWideWebControllerRole() : async Bool {
    switch (worldWideWebControllerState.get(caller)) {
      case (?controller) { controller.roleAssigned };
      case (null) { false };
    };
  };

  public query ({ caller }) func isWorldWideWebController(target : Principal) : async Bool {
    switch (worldWideWebControllerState.get(target)) {
      case (?controller) { controller.roleAssigned };
      case (null) { false };
    };
  };

  public query ({ caller }) func getAllWorldWideWebControllers() : async [Principal] {
    assertAppController(caller);
    worldWideWebControllerState.entries().map<(Principal, WorldWideWebController), Principal>(
        func((principal, _)) : Principal { principal }
      ).toArray();
  };

  func recordWorldWideWebControllerAuditEvent(
    details : Text,
    initiator : Principal,
    target : Principal,
    granted : Bool,
  ) {
    let auditEntry : AuditEntry.T = {
      timestamp = Time.now();
      user = initiator;
      actionType = #worldWideWebControllerPrivilegeChange;
      details = details # " (Target " # target.toText() # ", granted: " # debug_show granted # ")";
      ipAddress = null;
      deviceInfo = null;
      sessionData = null;
      success = ?true;
      severity = #info;
    };
    auditLogEntries.add(auditEntry);
  };

  // Network Graph Functions - Authorization Required

  public query ({ caller }) func getAllNodes() : async [Node] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view the network graph");
    };
    nodes.values().toArray();
  };

  public query ({ caller }) func getAllEdges() : async [Edge] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view the network graph");
    };
    edges.values().toArray();
  };

  public shared ({ caller }) func createNode(nodeLabel : Text, x : Float, y : Float) : async NodeId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create nodes");
    };

    let now = Time.now();
    let newNode : Node = {
      id = nodeIdCounter;
      nodeLabel;
      x;
      y;
      created = now;
      updated = now;
    };
    nodes.add(nodeIdCounter, newNode);
    let createdId = nodeIdCounter;
    nodeIdCounter += 1;
    createdId;
  };

  public shared ({ caller }) func createEdge(source : NodeId, target : NodeId, weight : Float, directed : Bool) : async EdgeId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create edges");
    };

    if (not nodes.containsKey(source)) {
      Runtime.trap("Invalid source node ID");
    };
    if (not nodes.containsKey(target)) {
      Runtime.trap("Invalid target node ID");
    };

    let now = Time.now();
    let newEdge : Edge = {
      id = edgeIdCounter;
      source;
      target;
      weight;
      directed;
      created = now;
      updated = now;
    };
    edges.add(edgeIdCounter, newEdge);
    let createdId = edgeIdCounter;
    edgeIdCounter += 1;
    createdId;
  };

  public shared ({ caller }) func updateNode(id : NodeId, nodeLabel : Text, x : Float, y : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update nodes");
    };

    switch (nodes.get(id)) {
      case (null) {
        Runtime.trap("Node not found");
      };
      case (?existingNode) {
        let updatedNode : Node = {
          existingNode with
          nodeLabel;
          x;
          y;
          updated = Time.now();
        };
        nodes.add(id, updatedNode);
      };
    };
  };

  public shared ({ caller }) func updateEdge(id : EdgeId, source : NodeId, target : NodeId, weight : Float, directed : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update edges");
    };

    if (not nodes.containsKey(source)) {
      Runtime.trap("Invalid source node ID");
    };
    if (not nodes.containsKey(target)) {
      Runtime.trap("Invalid target node ID");
    };

    switch (edges.get(id)) {
      case (null) {
        Runtime.trap("Edge not found");
      };
      case (?existingEdge) {
        let updatedEdge : Edge = {
          existingEdge with
          source;
          target;
          weight;
          directed;
          updated = Time.now();
        };
        edges.add(id, updatedEdge);
      };
    };
  };

  public shared ({ caller }) func deleteNode(id : NodeId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete nodes");
    };

    if (not nodes.containsKey(id)) {
      Runtime.trap("Node not found");
    };

    let edgesToRemove = edges.entries().filter(
      func((_, edge) : (EdgeId, Edge)) : Bool {
        edge.source == id or edge.target == id
      }
    ).map(
      func((edgeId, _) : (EdgeId, Edge)) : EdgeId { edgeId }
    ).toArray();

    for (edgeId in edgesToRemove.vals()) {
      edges.remove(edgeId);
    };

    nodes.remove(id);
  };

  public shared ({ caller }) func deleteEdge(id : EdgeId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete edges");
    };

    if (not edges.containsKey(id)) {
      Runtime.trap("Edge not found");
    };

    edges.remove(id);
  };

  public shared ({ caller }) func resetAndSetGraph(newNodes : [Node], newEdges : [Edge]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reset the entire graph");
    };

    nodes := Map.empty<NodeId, Node>();
    edges := Map.empty<EdgeId, Edge>();

    nodeIdCounter := 0;
    edgeIdCounter := 0;

    for (node in newNodes.vals()) {
      nodes.add(node.id, node);
      if (node.id >= nodeIdCounter) {
        nodeIdCounter := node.id + 1;
      };
    };

    for (edge in newEdges.vals()) {
      edges.add(edge.id, edge);
      if (edge.id >= edgeIdCounter) {
        edgeIdCounter := edge.id + 1;
      };
    };
  };
};
