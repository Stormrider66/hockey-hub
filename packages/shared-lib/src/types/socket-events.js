"use strict";
// Real-time event type definitions for Socket.io
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEventType = void 0;
// Event Type Map
var SocketEventType;
(function (SocketEventType) {
    // Training
    SocketEventType["TRAINING_SESSION_UPDATE"] = "training:session:update";
    SocketEventType["TRAINING_SESSION_JOIN"] = "training:session:join";
    SocketEventType["TRAINING_SESSION_LEAVE"] = "training:session:leave";
    // Calendar
    SocketEventType["CALENDAR_EVENT_UPDATE"] = "calendar:event:update";
    SocketEventType["CALENDAR_EVENT_CREATED"] = "calendar:event:created";
    SocketEventType["CALENDAR_EVENT_DELETED"] = "calendar:event:deleted";
    // Dashboard
    SocketEventType["DASHBOARD_WIDGET_UPDATE"] = "dashboard:widget:update";
    SocketEventType["DASHBOARD_METRIC_UPDATE"] = "dashboard:metric:update";
    // Activity
    SocketEventType["ACTIVITY_FEED_NEW"] = "activity:feed:new";
    SocketEventType["ACTIVITY_FEED_UPDATE"] = "activity:feed:update";
    // Collaboration
    SocketEventType["COLLABORATION_CURSOR"] = "collaboration:cursor";
    SocketEventType["COLLABORATION_EDIT"] = "collaboration:edit";
    SocketEventType["COLLABORATION_SAVE"] = "collaboration:save";
    // System
    SocketEventType["SYSTEM_MAINTENANCE"] = "system:maintenance";
    SocketEventType["SERVICE_STATUS_UPDATE"] = "service:status:update";
    // Rooms
    SocketEventType["ROOM_JOIN"] = "room:join";
    SocketEventType["ROOM_LEAVE"] = "room:leave";
    SocketEventType["ROOM_USERS_UPDATE"] = "room:users:update";
    // Connection
    SocketEventType["CONNECTION_SUCCESS"] = "connection:success";
    SocketEventType["CONNECTION_ERROR"] = "connection:error";
    SocketEventType["RECONNECT_ATTEMPT"] = "reconnect:attempt";
    SocketEventType["RECONNECT_SUCCESS"] = "reconnect:success";
    SocketEventType["RECONNECT_FAILED"] = "reconnect:failed";
})(SocketEventType || (exports.SocketEventType = SocketEventType = {}));
//# sourceMappingURL=socket-events.js.map