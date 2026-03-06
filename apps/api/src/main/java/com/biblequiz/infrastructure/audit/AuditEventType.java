package com.biblequiz.infrastructure.audit;


public enum AuditEventType {
    USER_LOGIN,
    USER_LOGOUT,
    USER_CREATE,
    USER_UPDATE,
    USER_DELETE,
    USER_ROLE_CHANGE,
    QUESTION_CREATE,
    QUESTION_UPDATE,
    QUESTION_DELETE,
    ADMIN_ACTION,
    SECURITY_EVENT,
    SYSTEM_EVENT
}
