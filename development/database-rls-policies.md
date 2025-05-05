# Hockey Hub – Database Row‑Level‑Security (RLS) Matrix

This document defines how **roles & permissions** (see `enhanced-role-permissions.md`) are enforced directly in PostgreSQL 17 using Row‑Level‑Security.  Each policy references JWT claims injected by PostgREST middleware (or by `set_config('jwt.claims.*')` inside services).

## JWT Claim Conventions
| Claim | Example | Purpose |
|-------|---------|---------|
| `sub` | `3d1b…` | User ID (UUID) |
| `role` | `coach` | Primary role string (matches `roles.name`) |
| `org`  | `b42c…` | Organization ID |
| `teams`| `{"1fa3…","9ab2…"}` | TEXT[] of team IDs user belongs to |
| `lang` | `sv`    | Preferred language (unrelated to RLS) |

> All policies below reference these claims via `current_setting('jwt.claims.<claim>')`.

---
## 1. user_service Schema

### Table: users
| Role | SELECT Filter | UPDATE/DELETE Filter |
|------|---------------|----------------------|
| admin | `true` | `true` |
| club_admin | `organization_id = uuid(current_setting('jwt.claims.org'))` | same as SELECT |
| coach / fys_coach / rehab / equipment_manager | `id = uuid(current_setting('jwt.claims.sub')) OR id IN (SELECT user_id FROM team_members WHERE team_id = ANY (string_to_array(current_setting('jwt.claims.teams'), ',')::uuid[]))` | `false` (updates happen via dedicated service methods) |
| player | `id = uuid(current_setting('jwt.claims.sub'))` | same as SELECT |
| parent | `id = uuid(current_setting('jwt.claims.sub')) OR id IN (SELECT child_id FROM player_parent_links WHERE parent_id = uuid(current_setting('jwt.claims.sub')))` | `false` |

PostgreSQL DDL
```sql
ALTER TABLE user_service.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_admin_all ON user_service.users
  FOR ALL TO admin
  USING (true);

CREATE POLICY users_club_admin_org ON user_service.users
  FOR SELECT, UPDATE TO club_admin
  USING (organization_id = uuid(current_setting('jwt.claims.org')));

CREATE POLICY users_self_or_team ON user_service.users
  FOR SELECT TO coach, fys_coach, rehab, equipment_manager
  USING (
    id = uuid(current_setting('jwt.claims.sub'))
    OR id IN (SELECT user_id FROM user_service.team_members tm
              WHERE tm.team_id = ANY(string_to_array(current_setting('jwt.claims.teams'), ',')::uuid[]))
  );

CREATE POLICY users_self ON user_service.users
  FOR SELECT, UPDATE TO player
  USING (id = uuid(current_setting('jwt.claims.sub')));

CREATE POLICY users_parent_children ON user_service.users
  FOR SELECT TO parent
  USING (
    id = uuid(current_setting('jwt.claims.sub'))
    OR id IN (SELECT child_id FROM user_service.player_parent_links ppl
              WHERE ppl.parent_id = uuid(current_setting('jwt.claims.sub')))
  );
```

### Table: player_medical_info (sensitive)
| Role | SELECT Filter |
|------|---------------|
| admin / rehab | `true` |
| coach | `team_id = ANY(string_to_array(current_setting('jwt.claims.teams'), ',')::uuid[])` (returns limited VIEW) |
| player | `player_id = uuid(current_setting('jwt.claims.sub'))` |
| parent | `player_id IN (SELECT child_id FROM player_parent_links WHERE parent_id = uuid(current_setting('jwt.claims.sub')))` |

(Updates allowed only to `rehab` & `admin`.)

### Table: team_members
Everyone in the same organization can **SELECT**, but modification restricted via service logic.  RLS:
```sql
ALTER TABLE user_service.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tm_org_visible ON user_service.team_members
  FOR SELECT TO club_admin, coach, fys_coach, rehab, equipment_manager
  USING (organization_id = uuid(current_setting('jwt.claims.org')));
```

---
## 2. calendar_service Schema

### Table: events
| Role | SELECT Filter |
|------|---------------|
| admin / club_admin | `organization_id = uuid(current_setting('jwt.claims.org'))` |
| coach / fys_coach | `team_id = ANY(string_to_array(current_setting('jwt.claims.teams'), ',')::uuid[])` |
| player / parent | `id IN (SELECT event_id FROM event_participants WHERE user_id = uuid(current_setting('jwt.claims.sub')))` |

---
## 3. medical_service Schema

### Table: injuries
Same predicates as `player_medical_info` but add team filter for coaches.

### Table: treatments & treatment_plans
Follow injury visibility.

### Table: player_availability_status
Coaches see team‑level rows; players/parents see own.

---
## 4. communication_service Schema

### Table: chats
`participant` level restriction:
```sql
USING (id IN (SELECT chat_id FROM communication_service.chat_participants
              WHERE user_id = uuid(current_setting('jwt.claims.sub'))))
```

Messages, attachments, reads tables inherit chat visibility via FK with `ON DELETE CASCADE`.

---
## 5. Implementation Notes
1. RLS policies must be **PERMISSIVE** so multiple policies combine with OR.
2. JWT claims are set by API Gateway using `SET LOCAL app.current_user = …` or pgrst `role-claim-key`.
3. Views can present **limited columns** (e.g., medical details) where role should not see full data.
4. All writes are still validated in service layer; RLS acts as last‑resort guard.

---
*Status — DRAFT v0.1*  (to be converted into migration scripts per service.) 