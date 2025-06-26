# LeadFi CRM - Technical Architecture

This document details the technical components and system architecture of the LeadFi CRM platform.

## System Architecture Overview

```mermaid
flowchart TB
    subgraph "Lead Sources"
        M["Manual Entry<br/>BD Team Frontend"]
        A["Apollo Research<br/>CSV Export"]
        GS["Company Inbound<br/>Google Sheets"]
    end
    
    subgraph "Processing Layer"
        API["REST API<br/>Direct Integration"]
        ETL["ETL Pipeline<br/>extract.py, transform.py, load.py"]
        AI["Apollo Ingestion<br/>apollo_ingest.py"]
        SI["Sheets Ingestion<br/>sheets_ingest.py"]
    end
    
    subgraph "Database Layer"
        PG[(PostgreSQL Database)]
        subgraph "Tables"
            LT[Leads Table]
            CT[Customers Table] 
            CNT[Contacts Bridge Table]
            AT[Activities Table]
        end
    end
    
    subgraph "Backend API"
        Flask["Flask REST API<br/>app.py"]
        subgraph "Models"
            LM[Lead Model]
            CM[Customer Model]
            CNM[Contact Model]
        end
        subgraph "Resources"
            LR[Lead Resources]
            CR[Customer Resources]
            CNR[Contact Resources]
        end
    end
    
    subgraph "Frontend Application"
        React["React.js SPA"]
        subgraph "Components"
            LC[Lead Components]
            CC[Customer Components]
            AC[Analytics Components]
            NAV[Navigation Components]
        end
        subgraph "Services"
            APIS[API Service]
            AUTH[Auth Service]
        end
    end
    
    subgraph "External Systems"
        AM["Account Management<br/>Team System"]
        TP["Trading Platform<br/>Integration"]
    end
    
    %% Data Flow
    M --> API
    A --> AI
    GS --> SI
    
    API --> PG
    AI --> ETL
    SI --> ETL
    ETL --> PG
    
    PG --> Flask
    Flask --> React
    React --> Flask
    
    %% Customer Handoff
    Flask -.->|"Closed Leads"| AM
    Flask -.->|"Customer Data"| TP
    
    %% Internal Connections
    LT --> CNT
    CNT --> CT
    
    style M fill:#e1f5fe
    style A fill:#f3e5f5
    style GS fill:#fff3e0
    style API fill:#e8f5e8
    style ETL fill:#fce4ec
    style PG fill:#f1f8e9
    style Flask fill:#fff3e0
    style React fill:#e3f2fd
    style AM fill:#ff9800
    style TP fill:#f1f8e9
```

## Component Details

### Data Sources & Integration

```mermaid
flowchart LR
    subgraph "Lead Acquisition Methods"
        subgraph "Manual Entry"
            M1["BD Research<br/>- LinkedIn prospecting<br/>- Event networking<br/>- Cold outreach<br/>- Referrals"]
            M2["Frontend Forms<br/>- Real-time input<br/>- Direct API calls<br/>- Immediate processing"]
        end
        
        subgraph "Apollo Research"
            A1["Apollo Platform<br/>- Automated search<br/>- Company targeting<br/>- Contact discovery"]
            A2["CSV Export<br/>- Bulk data download<br/>- Structured format<br/>- apollo_ingest.py"]
        end
        
        subgraph "Company Inbound"
            I1["Company Allocation<br/>- Pre-qualified leads<br/>- Strategic assignments<br/>- Priority prospects"]
            I2["Google Sheets<br/>- Centralized storage<br/>- Team access<br/>- sheets_ingest.py"]
        end
    end
    
    subgraph "Processing Integration"
        API["Direct API<br/>Real-time Processing"]
        ETL["ETL Pipeline<br/>Batch Processing"]
    end
    
    subgraph "CRM Integration"
        CRM["LeadFi CRM<br/>- Unified lead storage<br/>- Pipeline tracking<br/>- Customer conversion"]
    end
    
    M1 --> M2
    M2 --> API
    
    A1 --> A2
    A2 --> ETL
    
    I1 --> I2
    I2 --> ETL
    
    API --> CRM
    ETL --> CRM
    
    style M1 fill:#e1f5fe
    style M2 fill:#e1f5fe
    style A1 fill:#f3e5f5
    style A2 fill:#f3e5f5
    style I1 fill:#fff3e0
    style I2 fill:#fff3e0
    style API fill:#e8f5e8
    style ETL fill:#fce4ec
    style CRM fill:#4caf50
```

### Database Schema & Relationships

```mermaid
erDiagram
    LEADS ||--o{ CONTACTS : "converts_to"
    CONTACTS }o--|| CUSTOMERS : "creates"
    LEADS ||--o{ ACTIVITIES : "has"
    CUSTOMERS ||--o{ ACTIVITIES : "has"
    
    LEADS {
        int lead_id PK
        string company_name
        string contact_name
        string email
        string phone
        string status
        string type
        string bd_in_charge
        date created_date
        date updated_date
        text notes
    }
    
    CUSTOMERS {
        string customer_uid PK
        string name
        string registered_email
        string type
        string status
        date date_converted
        date created_date
        date updated_date
    }
    
    CONTACTS {
        int contact_id PK
        int lead_id FK
        string customer_uid FK
        date conversion_date
        string conversion_status
    }
    
    ACTIVITIES {
        int activity_id PK
        int lead_id FK
        string customer_uid FK
        string activity_type
        text description
        date activity_date
        string bd_in_charge
    }
```

### API Architecture

```mermaid
flowchart TD
    subgraph "Frontend React App"
        UI[User Interface]
        API_CLIENT[API Client Service]
    end
    
    subgraph "Flask Backend"
        ROUTES[API Routes]
        RESOURCES[Resource Classes]
        MODELS[Data Models]
        SCHEMAS[Validation Schemas]
    end
    
    subgraph "Database Operations"
        QUERIES[SQL Queries]
        JOINS[Table Joins]
        SORTING[Server-side Sorting]
    end
    
    subgraph "Business Logic"
        CONVERSION[Lead → Customer Conversion]
        ANALYSIS[Performance Analysis]
        HANDOFF[Account Management Handoff]
    end
    
    UI --> API_CLIENT
    API_CLIENT -->|REST API| ROUTES
    ROUTES --> RESOURCES
    RESOURCES --> MODELS
    MODELS --> SCHEMAS
    RESOURCES --> QUERIES
    QUERIES --> JOINS
    JOINS --> SORTING
    
    RESOURCES --> CONVERSION
    CONVERSION --> ANALYSIS
    ANALYSIS --> HANDOFF
    
    style UI fill:#e3f2fd
    style ROUTES fill:#f3e5f5
    style MODELS fill:#e8f5e8
    style CONVERSION fill:#fff3e0
    style ANALYSIS fill:#f1f8e9
    style HANDOFF fill:#ff9800
```

### Lead Pipeline & Customer Lifecycle

```mermaid
stateDiagram-v2
    [*] --> LeadGenerated : Google Sheets Import
    
    LeadGenerated --> Proposal : BD Qualification
    Proposal --> Negotiation : Terms Discussion
    Negotiation --> Registration : Agreement Reached
    
    Registration --> CustomerCreated : Conversion Trigger
    CustomerCreated --> Integration : Customer Management Phase
    
    Integration --> PerformanceAnalysis : Trading Activity
    
    PerformanceAnalysis --> ClosedWon : Meets Requirements
    PerformanceAnalysis --> ClosedLost : Below Requirements
    
    ClosedWon --> AccountManagement : Handoff
    ClosedLost --> AccountManagement : Handoff
    
    Registration --> ClosedLost : Registration Failed
    
    AccountManagement --> [*]
    
    note right of CustomerCreated
        Customer record created
        with lead relationship
    end note
    
    note right of PerformanceAnalysis
        VIP history review
        Daily trading volume
        Minimum requirements
    end note
    
    note right of AccountManagement
        Both won and lost
        clients handed off
    end note
```

## Technology Stack

### Backend Technologies
- **Framework**: Flask (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **API**: RESTful endpoints
- **Validation**: Marshmallow schemas
- **Authentication**: JWT tokens

### Frontend Technologies
- **Framework**: React.js
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Routing**: React Router
- **Components**: Custom component library

### Data Integration
- **ETL Framework**: Custom Python scripts
- **Manual Entry**: Direct API integration via frontend forms
- **Apollo Research**: CSV processing via apollo_ingest.py
- **Google Sheets**: API integration via sheets_ingest.py
- **Data Validation**: Pandas + custom validators
- **Scheduling**: Cron jobs (future enhancement)

### Infrastructure
- **Development**: Local environment
- **Database**: PostgreSQL with custom schemas
- **API Testing**: Postman/REST clients
- **Version Control**: Git

## Key Features Implementation

### Multi-Source Lead Acquisition
1. **Manual Entry**: Real-time frontend form submission
2. **Apollo Integration**: Automated CSV processing pipeline
3. **Google Sheets**: Scheduled data synchronization
4. **Unified Storage**: All sources converge in central database

### Customer Conversion Process
1. **Trigger**: Lead reaches Registration stage
2. **Process**: Automatic customer record creation
3. **Relationship**: Maintained via contacts bridge table
4. **Data Inheritance**: Background info from lead

### Performance Analysis System
1. **Data Collection**: VIP history and trading metrics
2. **Evaluation**: Minimum requirement checks
3. **Decision Logic**: Automated won/lost determination
4. **Handoff**: Account management team notification

### Server-side Sorting & Filtering
1. **Implementation**: SQL-based sorting with joins
2. **Performance**: Optimized database queries
3. **Frontend**: Seamless sorting UI
4. **Scalability**: Handles large datasets efficiently

### URL Parameter Navigation
1. **Lead URLs**: `?lead_id=123` for direct lead access
2. **Customer URLs**: `?customer_uid=abc` for customer details
3. **Navigation**: Cross-linking between leads and customers
4. **Bookmarking**: Shareable URLs for specific records

## Security & Data Flow

### Authentication Flow
- JWT-based authentication
- Role-based access control
- Secure API endpoints
- Frontend route protection

### Data Validation
- Input sanitization
- Schema validation
- Business rule enforcement
- Error handling

### Integration Security
- **Manual Entry**: Frontend validation and API security
- **Apollo Integration**: Secure file processing and validation
- **Google Sheets**: API authentication and secure credential management
- **Data Encryption**: In transit encryption for all sources
- **Audit Logging**: Future enhancement for all lead sources

## Performance Considerations

### Database Optimization
- Indexed foreign keys
- Efficient joins for related data
- Query optimization for sorting
- Connection pooling

### Frontend Performance
- Component lazy loading
- Efficient state management
- Minimal re-renders
- Optimized API calls

### ETL Performance
- **Apollo Processing**: Batch optimization for large CSV files
- **Sheets Integration**: Incremental sync capabilities
- **Manual Entry**: Real-time processing optimization
- **Data Deduplication**: Cross-source duplicate detection

### Scalability Features
- Modular architecture
- Stateless API design
- Database normalization
- Caching strategies (future) 