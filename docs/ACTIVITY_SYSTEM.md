# LeadFi Activity System Enhancement

## Overview

The enhanced activity system provides comprehensive tracking of all interactions and system events in your LeadFi CRM. It supports three categories of activities: **Manual** (BD activities), **System** (automated admin events), and **Automated** (platform integrations).

## 🔧 **Enhanced Schema Features**

### **New Activity Categories**

1. **Manual Activities** (`activity_category = 'manual'`)
   - BD-driven activities like calls, emails, meetings
   - Manually created by team members
   - Editable and deletable

2. **System Activities** (`activity_category = 'system'`)  
   - Auto-generated admin events like "lead created", "status changed"
   - Created automatically via database triggers
   - Read-only for audit trail

3. **Automated Activities** (`activity_category = 'automated'`)
   - Future integration with external systems
   - Email tracking, login detection, trading activities
   - Platform-generated events

### **New Schema Fields**

```sql
-- Enhanced Activity Table Structure
CREATE TABLE activity (
  activity_id serial PRIMARY KEY,
  lead_id int,                              -- Links to lead
  customer_uid INTEGER,                     -- Links to customer  
  activity_type varchar(50) NOT NULL,      -- Specific activity type
  activity_category varchar(20) DEFAULT 'manual', -- manual/system/automated
  description text,                         -- Activity description
  metadata jsonb,                          -- Structured additional data
  date_created timestamp DEFAULT NOW(),    -- When activity occurred
  bd_in_charge varchar(20),               -- BD responsible (renamed from 'bd')
  created_by varchar(50),                 -- Who/what created this activity
  is_visible_to_bd boolean DEFAULT true   -- Visibility control
);
```

## 📋 **Activity Types**

### **Manual BD Activities**
- `call` - Phone calls with prospects/customers
- `email` - Email communications
- `meeting` - In-person or video meetings
- `linkedin_message` - LinkedIn outreach
- `telegram_message` - Telegram communications
- `follow_up` - Follow-up actions
- `proposal_sent` - Proposal delivery
- `demo` - Product demonstrations
- `negotiation` - Contract negotiations
- `onboarding` - Customer onboarding activities

### **System Activities (Auto-Generated)**
- `lead_created` - New lead added to system
- `lead_updated` - Lead information modified
- `lead_deleted` - Lead removed from system
- `lead_converted` - Lead converted to customer
- `customer_created` - New customer account created
- `customer_updated` - Customer information modified
- `customer_deleted` - Customer account removed
- `status_changed` - Lead/customer status updates
- `stage_changed` - Pipeline stage transitions
- `assignment_changed` - BD assignment changes

### **Automated Activities (Future)**
- `email_opened` - Email tracking events
- `email_clicked` - Email link clicks
- `document_viewed` - Document access tracking
- `trading_activity` - Trading platform actions
- `account_milestone` - Account achievement events

## 🚀 **Implementation Guide**

### **1. Database Migration**

Run the migration script to upgrade your existing activity table:

```bash
# Run the migration
psql -d your_database -f db/migration_enhance_activity.sql
```

The migration will:
- ✅ Preserve all existing activity data
- ✅ Add new columns with safe defaults
- ✅ Create database triggers for automatic system activities
- ✅ Add performance indexes
- ✅ Create helper functions and views

### **2. Backend Integration**

The new Activity model provides helper methods:

```python
from api.models.activity import Activity

# Create system activity (auto-generated)
Activity.create_system_activity(
    lead_id=123,
    activity_type='status_changed',
    description='Status changed from "proposal" to "negotiation"',
    metadata={'old_status': 'proposal', 'new_status': 'negotiation'}
)

# Create manual activity (BD-driven)
Activity.create_manual_activity(
    lead_id=123,
    activity_type='call',
    description='Discovery call completed',
    bd_in_charge='John'
)
```

### **3. API Endpoints**

New enhanced API endpoints:

```
GET /api/activities                    # List all activities with filtering
GET /api/activities/{id}               # Get single activity
POST /api/activities                   # Create manual activity
PUT /api/activities/{id}               # Update manual activity
DELETE /api/activities/{id}            # Delete manual activity

GET /api/activities/timeline           # Get activity timeline
GET /api/activities/stats              # Get activity statistics
```

**Query Parameters:**
- `lead_id` - Filter by lead
- `customer_uid` - Filter by customer
- `category` - Filter by activity category
- `type` - Filter by activity type
- `bd` - Filter by BD in charge
- `visible_only` - Show only visible activities

### **4. Frontend Integration**

Enhanced frontend configuration in `config/options.js`:

```javascript
import { activityOptions } from './config/options.js';

// Manual activity types for BD forms
activityOptions.manualActivityTypes

// System activity types for display
activityOptions.systemActivityTypes  

// All activity types with labels
activityOptions.allActivityTypes
```

Enhanced API service in `services/api.js`:

```javascript
import { activityApi } from './services/api.js';

// Get activities for a specific lead
const activities = await activityApi.getLeadActivities(leadId);

// Get activity timeline
const timeline = await activityApi.getTimeline({ lead_id: 123 });

// Get activity statistics
const stats = await activityApi.getStats();
```

## 🔄 **Automatic System Tracking**

The enhanced system automatically tracks:

### **Lead Events**
- ✅ **Lead Created** - When new leads are added
- ✅ **Status Changes** - When lead status/stage changes  
- ✅ **Lead Converted** - When leads become customers
- ✅ **Lead Updates** - When lead information is modified

### **Customer Events**  
- ✅ **Customer Created** - When new customers are added
- ✅ **Customer Updated** - When customer information changes
- ✅ **Profile Changes** - When customer status/type changes

### **Metadata Storage**
System activities include structured metadata:

```json
{
  "old_status": "proposal",
  "new_status": "negotiation", 
  "lead_name": "John Smith",
  "company_name": "Acme Corp",
  "changed_by": "jane_doe"
}
```

## 📊 **Views and Reporting**

### **Database Views**
- `v_manual_activities` - All BD activities
- `v_system_activities` - All system events
- `v_lead_timeline` - Complete lead activity history
- `v_customer_timeline` - Complete customer activity history

### **Activity Statistics**
- Total activities by category
- Recent activity trends (7-day)
- BD activity summary
- System event frequency

## 🎯 **Usage Examples**

### **View Complete Lead Timeline**
```sql
SELECT * FROM v_lead_timeline WHERE lead_id = 123;
```

### **BD Activity Summary**
```sql
SELECT 
    bd_in_charge,
    activity_type,
    COUNT(*) as activity_count
FROM v_manual_activities 
WHERE date_created >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY bd_in_charge, activity_type;
```

### **System Event Audit**
```sql
SELECT * FROM v_system_activities 
WHERE activity_type = 'status_changed'
AND date_created >= CURRENT_DATE - INTERVAL '7 days';
```

## 🔧 **Configuration Options**

### **Visibility Control**
- Use `is_visible_to_bd` to control which activities appear in BD dashboards
- System activities are visible by default
- Can hide sensitive automated activities

### **Category Filtering**
- Filter activities by category in the frontend
- Separate manual BD actions from system events
- Group related activity types together

### **Metadata Customization**
- Store additional structured data in the `metadata` JSONB field
- Track custom fields for specific activity types
- Enable rich activity details and context

## 🚀 **Next Steps**

1. **Run Migration** - Apply the database enhancement
2. **Update Models** - Import the new Activity model
3. **Configure Frontend** - Use enhanced activity options
4. **Test System** - Verify automatic activity tracking
5. **Train Team** - Educate BDs on new activity categories

The enhanced activity system provides a comprehensive foundation for tracking all interactions and system events in your LeadFi CRM, with automatic admin event tracking and rich metadata support. 