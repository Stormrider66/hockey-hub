# Hockey Hub Chat System - Administrator Guide

## Overview

This guide provides comprehensive documentation for administrators managing the Hockey Hub chat system. It covers system configuration, user management, moderation tools, analytics, and troubleshooting procedures.

## Table of Contents

1. [Administrator Roles & Permissions](#administrator-roles--permissions)
2. [System Configuration](#system-configuration)
3. [User Management](#user-management)
4. [Conversation Management](#conversation-management)
5. [Moderation Tools](#moderation-tools)
6. [Analytics Dashboard](#analytics-dashboard)
7. [System Announcements](#system-announcements)
8. [Performance Tuning](#performance-tuning)
9. [Security Management](#security-management)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance Procedures](#maintenance-procedures)

## Administrator Roles & Permissions

### Role Hierarchy

1. **Super Admin**: Full system access
   - System configuration
   - All admin functions
   - Database management
   - Service configuration

2. **Organization Admin**: Organization-wide management
   - User management within organization
   - Organization-wide announcements
   - Analytics for organization
   - Moderation within organization

3. **Team Admin**: Team-level management
   - Team conversation management
   - Team member permissions
   - Team announcements
   - Basic moderation

4. **Moderator**: Content moderation
   - Message moderation
   - User reporting
   - Content flagging
   - Limited user actions

### Permission Matrix

| Action | Super Admin | Org Admin | Team Admin | Moderator |
|--------|------------|-----------|------------|-----------|
| System Config | ✓ | ✗ | ✗ | ✗ |
| Create Organizations | ✓ | ✗ | ✗ | ✗ |
| Manage All Users | ✓ | ✓* | ✗ | ✗ |
| Delete Any Message | ✓ | ✓* | ✓* | ✓* |
| View All Analytics | ✓ | ✓* | ✓* | ✗ |
| System Announcements | ✓ | ✗ | ✗ | ✗ |
| Org Announcements | ✓ | ✓ | ✗ | ✗ |
| Team Announcements | ✓ | ✓ | ✓ | ✗ |

*Within their scope only

## System Configuration

### Environment Variables

Key configuration settings in `/services/communication-service/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5434/hockey_hub_comm
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=32-character-key
MESSAGE_RETENTION_DAYS=90

# Performance
MAX_MESSAGE_LENGTH=5000
MAX_FILE_SIZE_MB=100
RATE_LIMIT_MESSAGES_PER_MINUTE=30
WS_MAX_CONNECTIONS_PER_USER=5

# Features
ENABLE_VOICE_MESSAGES=true
ENABLE_VIDEO_MESSAGES=true
ENABLE_FILE_SHARING=true
ENABLE_REACTIONS=true
ENABLE_TRANSLATIONS=true

# External Services
AWS_S3_BUCKET=hockey-hub-chat-files
EMAIL_SERVICE_URL=http://email-service:3010
SMS_SERVICE_ENABLED=false
```

### Feature Toggles

Access via Admin Dashboard > System Settings > Features:

- **Voice Messages**: Enable/disable voice recording
- **Video Messages**: Enable/disable video messages
- **File Sharing**: Control file upload capabilities
- **Message Translation**: Enable automatic translation
- **Read Receipts**: Global read receipt setting
- **Typing Indicators**: Show/hide typing status
- **Message Reactions**: Enable emoji reactions
- **Message Scheduling**: Allow scheduled messages

### Notification Configuration

Configure notification channels and preferences:

```javascript
// Admin API: PUT /api/v1/admin/notification-config
{
  "channels": {
    "email": {
      "enabled": true,
      "provider": "smtp",
      "settings": {
        "host": "smtp.example.com",
        "port": 587,
        "secure": false
      }
    },
    "sms": {
      "enabled": false,
      "provider": "twilio",
      "settings": {
        "accountSid": "...",
        "authToken": "..."
      }
    },
    "push": {
      "enabled": true,
      "provider": "fcm",
      "settings": {
        "serverKey": "..."
      }
    }
  },
  "defaults": {
    "quietHoursEnabled": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00",
    "offlineEmailDelay": 300 // seconds
  }
}
```

## User Management

### User Administration Interface

Access via Admin Dashboard > Users:

#### User Search & Filtering
- Search by name, email, or ID
- Filter by role, status, team
- Sort by last active, created date

#### User Actions
1. **View Profile**: Detailed user information
2. **Edit User**: Modify roles, teams, permissions
3. **Suspend User**: Temporary chat access removal
4. **Delete User**: Permanent removal (soft delete)
5. **Reset Password**: Force password reset
6. **View Activity**: Chat activity logs

### Bulk User Operations

```javascript
// Admin API: POST /api/v1/admin/users/bulk
{
  "action": "suspend|activate|delete|assign-role",
  "userIds": ["user-1", "user-2"],
  "params": {
    "role": "player",
    "reason": "Policy violation",
    "duration": 86400 // seconds
  }
}
```

### User Import

Import users via CSV:

```csv
email,name,role,team_id,parent_email
john@example.com,John Doe,player,team-123,parent@example.com
jane@example.com,Jane Smith,coach,team-123,
```

### Managing User Permissions

Set granular permissions per user:

```javascript
// Admin API: PUT /api/v1/admin/users/:userId/permissions
{
  "permissions": {
    "chat": {
      "canSendMessages": true,
      "canCreateGroups": false,
      "canUploadFiles": true,
      "maxFileSize": 10485760, // 10MB
      "canUseVoice": true,
      "canUseVideo": false
    },
    "notifications": {
      "canReceiveEmails": true,
      "canReceiveSMS": false,
      "canReceivePush": true
    }
  }
}
```

## Conversation Management

### Conversation Types Configuration

Define and manage conversation types:

1. **Direct Messages**
   - Auto-created between users
   - Cannot be deleted, only archived
   - No admin controls

2. **Group Conversations**
   - User-created groups
   - Admin can be assigned
   - Size limits configurable

3. **Team Channels**
   - Official team communications
   - Auto-created for each team
   - Restricted participant management

4. **Announcement Channels**
   - One-way broadcast channels
   - Only designated users can post
   - Read receipts tracked

### Creating Official Channels

```javascript
// Admin API: POST /api/v1/admin/conversations
{
  "type": "announcement",
  "name": "League Updates",
  "description": "Official league announcements",
  "settings": {
    "allowedPosters": ["admin-1", "admin-2"],
    "requireReadReceipt": true,
    "allowReactions": false,
    "autoAddNewUsers": true,
    "organizationId": "org-123"
  }
}
```

### Conversation Settings

Configure per-conversation settings:

- **Message Retention**: Override global retention
- **File Upload Limits**: Custom size/type restrictions
- **Moderation Level**: Auto-moderation sensitivity
- **Participant Limits**: Maximum members allowed
- **Join Restrictions**: Open/invite-only/approval required

### Archiving & Deletion Policies

Set automatic archiving rules:

```javascript
// Admin API: PUT /api/v1/admin/policies/archiving
{
  "rules": [
    {
      "name": "Inactive Conversations",
      "condition": "lastMessageAge",
      "value": 90, // days
      "action": "archive"
    },
    {
      "name": "Empty Groups",
      "condition": "participantCount",
      "value": 0,
      "action": "delete"
    }
  ]
}
```

## Moderation Tools

### Content Moderation Dashboard

Access via Admin Dashboard > Moderation:

#### Moderation Queue
View and act on flagged content:
- Reported messages
- Auto-flagged content
- User reports
- Spam detection alerts

#### Moderation Actions
1. **Approve**: Mark content as acceptable
2. **Delete**: Remove inappropriate content
3. **Warn User**: Send warning to user
4. **Suspend User**: Temporary suspension
5. **Ban User**: Permanent removal

### Automated Moderation

Configure auto-moderation rules:

```javascript
// Admin API: PUT /api/v1/admin/moderation/rules
{
  "rules": [
    {
      "name": "Profanity Filter",
      "type": "keyword",
      "keywords": ["badword1", "badword2"],
      "action": "flag",
      "severity": "medium"
    },
    {
      "name": "Spam Detection",
      "type": "pattern",
      "pattern": "repeated_messages",
      "threshold": 5,
      "timeWindow": 60, // seconds
      "action": "auto_delete"
    },
    {
      "name": "Link Filter",
      "type": "content",
      "match": "external_links",
      "whitelist": ["hockeyhub.com", "nhl.com"],
      "action": "require_approval"
    }
  ]
}
```

### User Reporting System

Handle user reports effectively:

```javascript
// View reports
GET /api/v1/admin/reports?status=pending&type=message

// Take action on report
PUT /api/v1/admin/reports/:reportId
{
  "action": "resolved",
  "resolution": "message_deleted",
  "notes": "Inappropriate content removed",
  "notifyReporter": true
}
```

### Moderation Analytics

Track moderation effectiveness:
- Reports by category
- Resolution times
- Moderator actions
- Repeat offenders
- False positive rates

## Analytics Dashboard

### Key Metrics

Access comprehensive analytics via Admin Dashboard > Analytics:

#### Usage Metrics
- **Active Users**: Daily/Weekly/Monthly active users
- **Message Volume**: Messages sent per time period
- **Conversation Creation**: New conversations rate
- **File Uploads**: Storage usage and trends
- **Voice/Video Usage**: Feature adoption rates

#### Engagement Metrics
- **Response Times**: Average time to first response
- **Conversation Length**: Average messages per conversation
- **User Retention**: Chat feature retention rates
- **Peak Usage Hours**: Identify busy periods
- **Device Breakdown**: Mobile vs Desktop usage

#### Performance Metrics
- **Message Delivery**: Success rates and latency
- **System Uptime**: Service availability
- **Error Rates**: Failed operations tracking
- **API Response Times**: Endpoint performance
- **WebSocket Connections**: Active connection monitoring

### Custom Reports

Create custom analytics reports:

```javascript
// Admin API: POST /api/v1/admin/analytics/reports
{
  "name": "Team Engagement Report",
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "metrics": [
    "messages_sent",
    "active_users",
    "conversation_participants"
  ],
  "groupBy": "team",
  "filters": {
    "organizationId": "org-123",
    "conversationType": ["team", "group"]
  }
}
```

### Real-time Monitoring

Monitor system health in real-time:

```javascript
// WebSocket subscription for real-time metrics
socket.on('admin:metrics:realtime', (data) => {
  // {
  //   "timestamp": "2025-01-15T10:30:00Z",
  //   "activeUsers": 1523,
  //   "messagesPerMinute": 87,
  //   "activeConnections": 1892,
  //   "cpuUsage": 45.2,
  //   "memoryUsage": 67.8
  // }
});
```

### Export Analytics Data

Export data for external analysis:

```javascript
// Admin API: POST /api/v1/admin/analytics/export
{
  "format": "csv|json|xlsx",
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "includeData": [
    "messages",
    "users",
    "conversations",
    "engagement_metrics"
  ]
}
```

## System Announcements

### Creating System Announcements

Broadcast important messages to all users:

```javascript
// Admin API: POST /api/v1/admin/announcements
{
  "title": "Scheduled Maintenance",
  "content": "The chat system will be unavailable on Saturday...",
  "priority": "high",
  "displayType": "banner|modal|notification",
  "audience": {
    "scope": "all|organization|team",
    "ids": ["org-123"]
  },
  "schedule": {
    "startTime": "2025-01-20T00:00:00Z",
    "endTime": "2025-01-20T04:00:00Z"
  },
  "actions": [
    {
      "label": "Learn More",
      "url": "https://support.hockeyhub.com/maintenance"
    }
  ]
}
```

### Announcement Types

1. **System Maintenance**: Planned downtime notices
2. **Feature Updates**: New feature announcements
3. **Policy Changes**: Terms of service updates
4. **Security Alerts**: Important security notices
5. **General Information**: League or platform updates

### Tracking Announcement Engagement

Monitor announcement effectiveness:
- View rates
- Click-through rates
- Dismissal rates
- User feedback

## Performance Tuning

### Database Optimization

#### Indexes
Ensure critical indexes exist:

```sql
-- Message performance
CREATE INDEX idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

-- User presence
CREATE INDEX idx_presence_user_updated 
ON user_presence(user_id, updated_at);

-- Search optimization
CREATE INDEX idx_messages_content_gin 
ON messages USING gin(to_tsvector('english', content));
```

#### Partitioning
Partition large tables by date:

```sql
-- Partition messages table by month
CREATE TABLE messages_2025_01 PARTITION OF messages
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Caching Strategy

Configure Redis caching:

```javascript
// Cache configuration
{
  "caching": {
    "conversations": {
      "ttl": 3600, // 1 hour
      "maxSize": 10000
    },
    "userPresence": {
      "ttl": 300, // 5 minutes
      "maxSize": 50000
    },
    "messages": {
      "ttl": 1800, // 30 minutes
      "maxSize": 100000,
      "strategy": "lru"
    }
  }
}
```

### WebSocket Optimization

Tune WebSocket performance:

```javascript
// Socket.io configuration
{
  "websocket": {
    "pingInterval": 25000,
    "pingTimeout": 60000,
    "upgradeTimeout": 10000,
    "maxHttpBufferSize": 1e6, // 1MB
    "perMessageDeflate": {
      "threshold": 1024 // Compress messages > 1KB
    },
    "cors": {
      "origin": true,
      "credentials": true
    }
  }
}
```

### Resource Limits

Set appropriate limits:

```javascript
{
  "limits": {
    "maxMessageLength": 5000,
    "maxFileSize": 104857600, // 100MB
    "maxConversationParticipants": 500,
    "maxConversationsPerUser": 1000,
    "maxMessagesPerMinute": 30,
    "maxActiveConnections": 10000,
    "messageRetentionDays": 90
  }
}
```

## Security Management

### Security Monitoring

Monitor security events:

1. **Failed Login Attempts**: Track and alert on suspicious activity
2. **Permission Violations**: Unauthorized access attempts
3. **Rate Limit Violations**: Potential abuse detection
4. **Suspicious Patterns**: Unusual messaging behavior

### Access Control

Implement strict access controls:

```javascript
// Admin API: PUT /api/v1/admin/security/access-control
{
  "ipWhitelist": {
    "enabled": true,
    "ips": ["192.168.1.0/24", "10.0.0.0/8"]
  },
  "sessionManagement": {
    "maxConcurrentSessions": 3,
    "sessionTimeout": 3600,
    "requireReauth": ["deleteUser", "systemConfig"]
  },
  "apiKeys": {
    "rotationPeriod": 90, // days
    "complexity": "high"
  }
}
```

### Audit Logging

Configure comprehensive audit logging:

```javascript
{
  "auditLog": {
    "enabled": true,
    "logLevel": "info",
    "includeEvents": [
      "user.login",
      "user.logout",
      "message.delete",
      "user.suspend",
      "config.change",
      "permission.grant",
      "permission.revoke"
    ],
    "retention": 365, // days
    "storage": "database|file|s3"
  }
}
```

### Data Protection

Implement data protection measures:

1. **Encryption at Rest**: All messages encrypted in database
2. **Encryption in Transit**: TLS 1.3 for all connections
3. **Key Rotation**: Automatic encryption key rotation
4. **Data Anonymization**: Remove PII from analytics
5. **Backup Encryption**: Encrypted backup storage

## Troubleshooting

### Common Issues & Solutions

#### High Message Latency
1. Check database query performance
2. Verify Redis cache hit rates
3. Monitor WebSocket connection count
4. Review message queue backlog

```bash
# Check Redis cache stats
redis-cli info stats

# Monitor database queries
SELECT query, calls, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC;
```

#### Users Unable to Connect
1. Verify authentication service
2. Check CORS configuration
3. Review firewall rules
4. Inspect WebSocket upgrade headers

```javascript
// Debug connection issues
socket.on('connect_error', (error) => {
  console.log('Connection error:', error.type, error.message);
});
```

#### Missing Messages
1. Check message delivery queue
2. Verify participant permissions
3. Review conversation membership
4. Inspect message filters

#### File Upload Failures
1. Verify S3 bucket permissions
2. Check file size limits
3. Review MIME type restrictions
4. Monitor available storage

### Diagnostic Tools

#### Health Check Endpoints
```bash
# Overall system health
GET /api/v1/admin/health

# Service-specific health
GET /api/v1/admin/health/database
GET /api/v1/admin/health/redis
GET /api/v1/admin/health/websocket
```

#### Debug Mode
Enable debug logging:

```javascript
// Admin API: PUT /api/v1/admin/debug
{
  "enabled": true,
  "level": "debug",
  "components": ["websocket", "database", "auth"],
  "duration": 3600 // seconds
}
```

#### Performance Profiling
```javascript
// Admin API: POST /api/v1/admin/profile
{
  "type": "cpu|memory|query",
  "duration": 60, // seconds
  "output": "flamegraph|report"
}
```

## Maintenance Procedures

### Routine Maintenance

#### Daily Tasks
1. Review moderation queue
2. Check system alerts
3. Monitor error rates
4. Verify backup completion

#### Weekly Tasks
1. Review analytics trends
2. Update user permissions
3. Clean up archived data
4. Performance report review

#### Monthly Tasks
1. Security audit
2. Database optimization
3. Update documentation
4. Review feature usage

### Database Maintenance

```sql
-- Vacuum and analyze tables
VACUUM ANALYZE messages;
VACUUM ANALYZE conversations;

-- Update statistics
ANALYZE messages (conversation_id, created_at);

-- Reindex if needed
REINDEX INDEX CONCURRENTLY idx_messages_conversation_created;
```

### Backup Procedures

Configure automated backups:

```javascript
{
  "backup": {
    "schedule": "0 2 * * *", // 2 AM daily
    "retention": {
      "daily": 7,
      "weekly": 4,
      "monthly": 12
    },
    "destinations": [
      {
        "type": "s3",
        "bucket": "hockey-hub-backups",
        "encryption": true
      }
    ],
    "notifications": {
      "success": ["admin@hockeyhub.com"],
      "failure": ["admin@hockeyhub.com", "oncall@hockeyhub.com"]
    }
  }
}
```

### Disaster Recovery

Recovery procedures:

1. **Service Failure**
   - Automatic failover to replica
   - Health check monitoring
   - Alert notifications

2. **Data Loss**
   - Point-in-time recovery
   - Transaction log replay
   - Backup restoration

3. **Security Breach**
   - Immediate access revocation
   - Audit log analysis
   - User notification procedures

### Update Procedures

Safe update process:

1. **Pre-update**
   - Full system backup
   - Announcement to users
   - Maintenance mode enable

2. **Update Process**
   - Database migrations
   - Service updates
   - Configuration changes
   - Health verification

3. **Post-update**
   - Functionality testing
   - Performance verification
   - User communication
   - Monitor for issues

## Best Practices

### Administrator Guidelines

1. **Regular Monitoring**: Check dashboards daily
2. **Proactive Maintenance**: Don't wait for issues
3. **Documentation**: Keep procedures updated
4. **Communication**: Inform users of changes
5. **Security First**: Always prioritize security
6. **Test Changes**: Use staging environment
7. **Backup Before Changes**: Always have rollback plan

### Performance Best Practices

1. **Cache Effectively**: Use Redis for hot data
2. **Index Properly**: Monitor slow queries
3. **Archive Old Data**: Move to cold storage
4. **Rate Limit**: Prevent abuse
5. **Monitor Resources**: Set up alerts
6. **Optimize Queries**: Regular query analysis
7. **Scale Horizontally**: Add resources as needed

### Security Best Practices

1. **Least Privilege**: Minimal necessary permissions
2. **Audit Everything**: Comprehensive logging
3. **Encrypt Sensitive Data**: At rest and in transit
4. **Regular Updates**: Keep dependencies current
5. **Access Reviews**: Quarterly permission audits
6. **Incident Response**: Have a plan ready
7. **Training**: Keep team security-aware