# LeadFi CRM - Workflow Overview

This document provides a comprehensive overview of the LeadFi CRM system workflow, showing how leads flow from multiple sources through the sales pipeline and transition to customer management.

## System Architecture Overview

```mermaid
flowchart TD
    subgraph "Lead Sources"
        M["Manual Entry<br/>(BD Team via Frontend)"]
        A["Apollo Research<br/>(Automated Export)"]
        I["Company Inbound<br/>(Google Sheets)"]
    end
    
    B["LeadFi CRM<br/>Lead Management"]
    C["Lead Pipeline<br/>(7 Stages)"]
    D["Customer Creation<br/>(After Registration)"]
    E["Customer Management<br/>(Integration Phase)"]
    F["Performance Analysis<br/>(VIP History + Trading Volume)"]
    G["Status Determination<br/>(Won/Lost)"]
    H["Account Management<br/>Team Handoff"]
    
    M --> B
    A --> B
    I --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    
    style M fill:#e1f5fe
    style A fill:#f3e5f5
    style I fill:#fff3e0
    style B fill:#e8f5e8
    style C fill:#fce4ec
    style D fill:#4caf50
    style E fill:#fff3e0
    style F fill:#f1f8e9
    style G fill:#e3f2fd
    style H fill:#ff9800
```

## Lead Acquisition Methods

```mermaid
flowchart TD
    subgraph "Three Lead Sources"
        subgraph "Manual Entry"
            M1["BD Research<br/>• LinkedIn prospecting<br/>• Event networking<br/>• Cold outreach<br/>• Referrals"]
            M2["Frontend Entry<br/>• Lead forms<br/>• Real-time input<br/>• Immediate processing"]
        end
        
        subgraph "Apollo Research"
            A1["Apollo Platform<br/>• Automated search<br/>• Company targeting<br/>• Contact discovery"]
            A2["CSV Export<br/>• Bulk data download<br/>• apollo_ingest.py"]
        end
        
        subgraph "Company Inbound"
            I1["Company Allocation<br/>• Pre-qualified leads<br/>• Strategic assignments"]
            I2["Google Sheets<br/>• Centralized storage<br/>• sheets_ingest.py"]
        end
    end
    
    subgraph "Processing Layer"
        API["Direct API<br/>Frontend Forms"]
        ETL["ETL Pipeline<br/>Automated Processing"]
    end
    
    subgraph "CRM Integration"
        CRM["LeadFi CRM<br/>Unified Lead Database"]
        PIPELINE["7-Stage Sales Pipeline"]
    end
    
    M1 --> M2
    M2 --> API
    
    A1 --> A2
    A2 --> ETL
    
    I1 --> I2
    I2 --> ETL
    
    API --> CRM
    ETL --> CRM
    CRM --> PIPELINE
    
    style M1 fill:#e1f5fe
    style M2 fill:#e1f5fe
    style A1 fill:#f3e5f5
    style A2 fill:#f3e5f5
    style I1 fill:#fff3e0
    style I2 fill:#fff3e0
    style API fill:#e8f5e8
    style ETL fill:#e8f5e8
    style CRM fill:#4caf50
    style PIPELINE fill:#ffeb3b
```

## Lead Pipeline Stages

```mermaid
flowchart LR
    L1["1. Lead Generated"] --> L2["2. Proposal"]
    L2 --> L3["3. Negotiation"]
    L3 --> L4["4. Registration"]
    L4 --> L5["5. Integration"]
    L5 --> L6["6. Closed Won"]
    L5 --> L7["7. Closed Lost"]
    
    L4 -.->|"Convert to Customer"| C1["Customer Created"]
    C1 --> L5
    L6 --> AM["Account Management<br/>Team"]
    L7 --> AM
    
    style L4 fill:#ffeb3b
    style C1 fill:#4caf50
    style L6 fill:#2e7d32
    style L7 fill:#d32f2f
    style AM fill:#ff9800
```

## Detailed Workflow Process

```mermaid
flowchart TD
    Start([Start]) --> GS["Google Sheets<br/>Lead Allocation"]
    GS --> Import["Import to LeadFi<br/>(ETL Process)"]
    Import --> Stage1["Stage 1: Lead Generated<br/>- Initial contact<br/>- Basic qualification"]
    
    Stage1 --> Stage2["Stage 2: Proposal<br/>- Needs assessment<br/>- Proposal creation<br/>- Initial presentation"]
    
    Stage2 --> Stage3["Stage 3: Negotiation<br/>- Terms discussion<br/>- Objection handling<br/>- Agreement refinement"]
    
    Stage3 --> Stage4["Stage 4: Registration<br/>- Account setup<br/>- Documentation<br/>- Onboarding initiation"]
    
    Stage4 --> Convert{"Convert to<br/>Customer?"}
    Convert -->|Yes| Customer["Customer Created<br/>- Customer record established<br/>- Lead relationship maintained"]
    Convert -->|No| Lost1["Mark as Lost<br/>Registration failed"]
    
    Customer --> Stage5["Stage 5: Integration<br/>- Platform onboarding<br/>- Training & support<br/>- Initial trading setup"]
    
    Stage5 --> Analysis["Performance Analysis<br/>- VIP history review<br/>- Daily trading volume<br/>- Minimum requirements check"]
    
    Analysis --> Decision{"Meets<br/>Requirements?"}
    Decision -->|Yes| Won["Stage 6: Closed Won<br/>- Successful integration<br/>- Active trading account"]
    Decision -->|No| Lost2["Stage 7: Closed Lost<br/>- Requirements not met<br/>- Account inactive"]
    
    Won --> Handoff["Account Management<br/>Team Handoff<br/>- Client reallocation<br/>- Ongoing relationship mgmt"]
    Lost2 --> Handoff
    Lost1 --> End([End])
    Handoff --> End
    
    style GS fill:#e1f5fe
    style Import fill:#f3e5f5
    style Convert fill:#fff3e0
    style Customer fill:#4caf50
    style Analysis fill:#f1f8e9
    style Decision fill:#e3f2fd
    style Won fill:#2e7d32
    style Lost1 fill:#d32f2f
    style Lost2 fill:#d32f2f
    style Handoff fill:#ff9800
```

## Key Components

### 1. Lead Acquisition (Multi-Source)

#### Manual Entry
- **Source**: BD team research from any external source
- **Method**: Direct frontend form input
- **Processing**: Real-time API integration
- **Examples**: LinkedIn prospecting, event networking, referrals

#### Apollo Research  
- **Source**: Apollo.io platform automated search
- **Method**: CSV export and bulk processing
- **Processing**: ETL pipeline via `apollo_ingest.py`
- **Examples**: Company targeting, contact discovery

#### Company Inbound
- **Source**: Company-allocated leads via Google Sheets
- **Method**: Centralized spreadsheet management
- **Processing**: ETL pipeline via `sheets_ingest.py`
- **Examples**: Pre-qualified prospects, strategic assignments

### 2. Sales Pipeline (Stages 1-4)
- **Lead Generated**: Initial contact and basic qualification
- **Proposal**: Needs assessment and proposal creation
- **Negotiation**: Terms discussion and agreement refinement
- **Registration**: Account setup and onboarding initiation

### 3. Customer Conversion
- **Trigger**: Successful completion of Registration (Stage 4)
- **Process**: Lead converts to Customer record
- **Relationship**: Customer maintains link to originating lead

### 4. Customer Management (Stage 5)
- **Phase**: Integration stage of the lead pipeline
- **Activities**: Platform onboarding, training, initial trading setup
- **Focus**: Customer success and platform adoption

### 5. Performance Evaluation
- **Metrics**: VIP history analysis and daily trading volume
- **Criteria**: Minimum trading requirements
- **Outcome**: Determines Won/Lost status

### 6. Final Disposition
- **Closed Won**: Requirements met, active trading account
- **Closed Lost**: Requirements not met, inactive account
- **Next Step**: Both outcomes result in handoff to Account Management team

### 7. Account Management Handoff
- **Recipients**: Account Management team
- **Scope**: Both won and lost clients for ongoing relationship management
- **Purpose**: Continued client relationship and potential reactivation

## Data Flow

1. **Multi-Source Inbound**: Manual Entry + Apollo Research + Company Google Sheets → LeadFi CRM
2. **Pipeline**: Lead progresses through 7 stages
3. **Conversion**: Registration triggers customer creation
4. **Management**: Customer management during integration
5. **Analysis**: Performance evaluation based on trading metrics
6. **Handoff**: Final reallocation to account management

## Technology Stack Integration

- **Manual Entry**: Frontend forms with real-time API
- **Apollo Research**: CSV processing and ETL pipeline
- **Google Sheets**: API integration and automated ingestion
- **LeadFi CRM**: Unified lead and customer management
- **Analytics**: Performance tracking and reporting
- **Account Management**: Post-closure relationship management

**Generated**: $(date)
**Last Updated**: $(date) 