# LGU Escalation/Re-routing Workflow Spec

## Overview

This document defines the escalation and re-routing workflow for LikasLens tickets. When an assigned LGU fails to respond or resolve within SLA deadlines, the system automatically escalates and re-routes to alternative agencies.

---

## 1. Ticket Fields

### New Fields (Migration: `2026_06_21_000001`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `reassigned_at` | timestamp | NULL | When the ticket was last reassigned to a different LGU |
| `reassigned_to` | string | NULL | The LGU/agency ID the ticket was reassigned to |
| `escalation_level` | enum | `'none'` | Current escalation level: `none`, `lgu`, `admin`, `regional`, `national` |

### Existing SLA Fields

| Field | Type | Description |
|-------|------|-------------|
| `sla_deadline_response` | timestamp | Deadline for first response |
| `sla_deadline_resolution` | timestamp | Deadline for resolution |
| `sla_response_breached` | boolean | Whether response SLA was breached |
| `sla_resolution_breached` | boolean | Whether resolution SLA was breached |
| `sla_escalated_at` | timestamp | When the ticket was first escalated |
| `escalated_to` | string | Agency/authority the ticket was escalated to |

### Escalation Level Hierarchy

```
none → lgu → admin → regional → national
 0      1      2        3          4
```

---

## 2. Escalation Timeline: `illegal_dumping`

**SLA Thresholds:** 48h response / 168h resolution (7 days)

```
T+0h     Ticket Created
         ├── Assign to primary LGU (e.g., "Green Dingle Initiative")
         ├── Set sla_deadline_response = T+48h
         ├── Set sla_deadline_resolution = T+168h
         └── Create TicketTimeline entry

T+48h    Response SLA Breach
         ├── Set sla_response_breached = true
         ├── Set escalation_level = 'lgu'
         ├── Call routing_learner.get_best_lgu("SWM-ILLEGAL-DUMPING")
         ├── If best_lgu != current_lgu:
         │   ├── Reassign ticket to best_lgu
         │   ├── Set reassigned_at = now()
         │   ├── Set reassigned_to = best_lgu
         │   └── Fire TicketReassigned event
         ├── Fire TicketEscalated event
         └── Notify assigned LGU + admin

T+168h   Resolution SLA Breach
         ├── Set sla_resolution_breached = true
         ├── Set escalation_level = 'admin'
         ├── Fire TicketOverdue event
         ├── Notify admin team
         └── Flag for weekly review

T+336h   Extended Overdue (14 days)
         ├── Set escalation_level = 'regional'
         ├── Fire TicketEscalated event
         └── Notify regional environmental officer
```

---

## 3. Escalation Timeline: `chemical_spill`

**SLA Thresholds:** 4h response / 24h resolution (critical hazard)

```
T+0h     Ticket Created
         ├── Assign to primary LGU (e.g., "Bantay Kalikasan")
         ├── Set sla_deadline_response = T+4h
         ├── Set sla_deadline_resolution = T+24h
         ├── Create TicketTimeline entry
         └── Flag as CRITICAL hazard

T+4h     Response SLA Breach
         ├── Set sla_response_breached = true
         ├── Set escalation_level = 'lgu'
         ├── Call routing_learner.get_best_lgu("HAZWASTE-HANDLING")
         ├── If best_lgu != current_lgu:
         │   ├── Reassign ticket to best_lgu
         │   ├── Set reassigned_at = now()
         │   ├── Set reassigned_to = best_lgu
         │   └── Fire TicketReassigned event
         ├── Fire TicketEscalated event
         ├── Notify assigned LGU + admin
         └── Send SMS/push notification (critical urgency)

T+24h    Resolution SLA Breach
         ├── Set sla_resolution_breached = true
         ├── Set escalation_level = 'admin'
         ├── Fire TicketOverdue event
         ├── Notify admin team
         ├── Notify DENR-EMB (issuing agency)
         └── Flag for immediate review

T+72h    Extended Overdue (3 days)
         ├── Set escalation_level = 'regional'
         ├── Fire TicketEscalated event
         ├── Notify regional environmental officer
         └── Trigger manual intervention protocol
```

---

## 4. Re-route Logic

### Trigger Conditions

Re-routing occurs when:
1. **Response SLA breached** (first priority)
2. **Resolution SLA breached** (second priority)
3. **Current LGU has no data** in routing learner (fallback)

### Algorithm

```python
# Called at T+48h (illegal_dumping) or T+4h (chemical_spill)

def should_reroute(ticket, violation_type):
    """Determine if ticket should be reassigned."""
    
    # 1. Check if response SLA is breached
    if not ticket.sla_response_breached:
        return False, None
    
    # 2. Get best LGU from routing learner
    from routing_learner import get_best_lgu, has_data
    
    if not has_data(violation_type):
        return False, None  # No learned data, keep current assignment
    
    best_lgu = get_best_lgu(violation_type)
    
    if best_lgu is None:
        return False, None
    
    # 3. Don't reassign to the same LGU
    current_lgu = ticket.assignments.first()?.assigned_group_id
    if best_lgu == current_lgu:
        return False, None
    
    # 4. Check escalation level limits
    if ticket.escalation_level == 'national':
        return False, None  # Already at max escalation
    
    return True, best_lgu
```

### Reassignment Flow

```
1. ticket.reroute(new_lgu_id)
   ├── Set ticket.reassigned_at = now()
   ├── Set ticket.reassigned_to = new_lgu_id
   ├── Create TicketAssignment(assigned_group_id: new_lgu_id)
   ├── Create TicketTimeline(type: 'reassigned')
   └── Fire TicketReassigned event

2. Notify parties
   ├── Notify old LGU: "Ticket reassigned due to SLA breach"
   ├── Notify new LGU: "You have been assigned a new ticket"
   └── Notify reporter: "Your report is being handled by a new agency"
```

---

## 5. Notification Events

### Event Definitions

| Event | Trigger | Recipients | Priority |
|-------|---------|------------|----------|
| `TicketReassigned` | Ticket reassigned to different LGU | Old LGU, New LGU, Reporter | high |
| `TicketEscalated` | Escalation level increased | Current LGU, Admin, Next level | high |
| `TicketOverdue` | Resolution SLA breached | Admin, Regional officer | critical |

### Event Payloads

```json
// TicketReassigned
{
  "event": "TicketReassigned",
  "ticket_id": "uuid",
  "display_id": "TKT-00123",
  "old_lgu_id": "ngo-green-dingle-initiative",
  "new_lgu_id": "ngo-coastal-guardians-ph",
  "reason": "Response SLA breached at T+48h",
  "escalation_level": "lgu",
  "reassigned_at": "2026-06-21T12:00:00Z"
}

// TicketEscalated
{
  "event": "TicketEscalated",
  "ticket_id": "uuid",
  "display_id": "TKT-00123",
  "old_level": "none",
  "new_level": "admin",
  "reason": "Resolution SLA breached at T+168h",
  "escalated_to": "admin-team",
  "escalated_at": "2026-06-27T12:00:00Z"
}

// TicketOverdue
{
  "event": "TicketOverdue",
  "ticket_id": "uuid",
  "display_id": "TKT-00123",
  "violation_type": "SWM-ILLEGAL-DUMPING",
  "hours_overdue": 48,
  "escalation_level": "admin",
  "assigned_lgu": "ngo-green-dingle-initiative",
  "deadline": "2026-06-27T12:00:00Z"
}
```

### Notification Channels

| Channel | Events | Format |
|---------|--------|--------|
| In-app | All | Dashboard banner + notification bell |
| Email | TicketEscalated, TicketOverdue | HTML template |
| SMS | chemical_spill only | Critical alerts only |
| Push | All | Mobile PWA push notification |

---

## 6. Public Scoreboard Overdue Query

### SQL Query

```sql
SELECT
    ta.assigned_group_id AS lgu_id,
    ng.name AS lgu_name,
    COUNT(*) FILTER (WHERE t.status = 'resolved') AS resolved_count,
    COUNT(*) FILTER (WHERE t.sla_resolution_breached = true) AS overdue_count,
    ROUND(
        COUNT(*) FILTER (WHERE t.status = 'resolved')::decimal /
        NULLIF(COUNT(*), 0) * 100,
        1
    ) AS resolution_rate_pct,
    ROUND(
        COUNT(*) FILTER (WHERE t.sla_resolution_breached = true)::decimal /
        NULLIF(COUNT(*), 0) * 100,
        1
    ) AS overdue_rate_pct
FROM tickets t
JOIN ticket_assignments ta ON ta.ticket_id = t.id
JOIN ngo_groups ng ON ng.id = ta.assigned_group_id
WHERE t.created_at >= NOW() - INTERVAL '30 days'
GROUP BY ta.assigned_group_id, ng.name
ORDER BY overdue_count DESC, resolved_count DESC;
```

### Response Time Query (for routing_learner integration)

```sql
SELECT
    ta.assigned_group_id AS lgu_id,
    tc.violation_type,
    COUNT(*) AS ticket_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600), 1) AS avg_hours,
    MIN(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600) AS best_hours,
    MAX(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600) AS worst_hours
FROM tickets t
JOIN ticket_assignments ta ON ta.ticket_id = t.id
JOIN ticket_classifications tc ON tc.ticket_id = t.id
WHERE t.status = 'resolved'
  AND t.resolved_at IS NOT NULL
GROUP BY ta.assigned_group_id, tc.violation_type
HAVING COUNT(*) >= 3
ORDER BY avg_hours ASC;
```

### Scoreboard API Endpoint

```
GET /api/v1/scoreboard/overdue

Response:
{
  "period": "30d",
  "generated_at": "2026-06-21T12:00:00Z",
  "lgu_performance": [
    {
      "lgu_id": "ngo-green-dingle-initiative",
      "lgu_name": "Green Dingle Initiative",
      "resolved_count": 45,
      "overdue_count": 3,
      "resolution_rate_pct": 93.8,
      "overdue_rate_pct": 6.3
    }
  ]
}
```

---

## Implementation Checklist

- [x] Migration: Add `reassigned_at`, `reassigned_to`, `escalation_level` to tickets
- [x] Model: Update `Ticket.php` with new fields and escalation helpers
- [ ] Service: Create `EscalationService` class
- [ ] Job: Create `CheckEscalations` scheduled job (runs every 15 min)
- [ ] Events: Create `TicketReassigned`, `TicketEscalated`, `TicketOverdue` events
- [ ] Listeners: Create notification listeners for each event
- [ ] API: Add `/scoreboard/overdue` endpoint
- [ ] Tests: Write escalation timeline tests
