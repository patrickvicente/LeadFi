# LeadFi Test Data Generator

This directory contains scripts to generate realistic test data for the LeadFi CRM system covering the last 2 months of activity.

## 🎯 What it Generates

### Core Data
- **Leads**: Realistic lead profiles with various statuses, sources, and types
- **Customers**: Converted leads with proper relationships
- **Activities**: Manual BD activities, system activities, and tasks
- **Trading Volume**: Daily trading data for customers
- **VIP History**: VIP level progression over time
- **Contacts**: Proper lead-to-customer relationship mapping

### Data Volume Options

| Volume | Leads | Customers* | Activities | Trading Records** |
|--------|-------|------------|------------|-------------------|
| Small  | 50    | ~6-10      | ~200-400   | ~300-600          |
| Medium | 150   | ~18-30     | ~600-1200  | ~900-1800         |
| Large  | 300   | ~36-60     | ~1200-2400 | ~1800-3600        |

*Customers are generated from leads with "6. closed won" status (~20% conversion rate)
**Trading records vary based on customer activity patterns

## 🚀 Quick Start

### Option 1: Simple Runner (Recommended)
```bash
# Generate medium volume data (150 leads)
python scripts/run_test_data_generation.py

# Generate small volume data (50 leads)
python scripts/run_test_data_generation.py small

# Generate large volume data (300 leads) and clear existing data
python scripts/run_test_data_generation.py large clear
```

### Option 2: Direct Script
```bash
# Set environment variables and run
export DATA_VOLUME=medium
export CLEAR_EXISTING_DATA=false
python scripts/generate_test_data.py
```

### Option 3: Environment Variables
```bash
# For different configurations
DATA_VOLUME=small CLEAR_EXISTING_DATA=true python scripts/generate_test_data.py
```

## ⚙️ Configuration Options

### Environment Variables

| Variable | Options | Default | Description |
|----------|---------|---------|-------------|
| `DATA_VOLUME` | small, medium, large | medium | Amount of data to generate |
| `CLEAR_EXISTING_DATA` | true, false | false | Whether to clear existing data first |

### Data Generation Details

#### Lead Distribution
- **Status Funnel**: Realistic conversion funnel from lead generated to closed won/lost
- **Sources**: Apollo, LinkedIn, HubSpot, Events, Referrals, etc.
- **Types**: Liquidity providers, VIPs, institutions, API clients, brokers, etc.
- **Geography**: 15 major trading jurisdictions
- **BD Team**: 8 realistic business development team members

#### Activity Patterns
- **Manual Activities**: Calls, emails, meetings, LinkedIn/Telegram messages, demos
- **System Activities**: Lead creation, status changes, conversions
- **Task Management**: Due dates, priorities, assignment tracking
- **Realistic Timing**: Activities spread over 2-month period with logical progression

#### Trading Data Realism
- **Volume Patterns**: Varied trading activity (not every customer trades daily)
- **Fee Structure**: Realistic maker/taker fees (0.01% - 0.2% of volume)
- **Asset Values**: Portfolio values ranging from $50K to $2M
- **VIP Progression**: Gradual VIP level increases based on activity

## 📊 Generated Data Relationships

```
Leads (1:N) → Activities
  ↓ (conversion)
Customers (1:N) → Contacts → Leads
     ↓
Daily Trading Volume
     ↓
VIP History
```

## 🎲 Realistic Data Features

### Contact Information
- **Names**: Combination of 50+ first names and 50+ last names
- **Emails**: Realistic email patterns (first.last@domain.com, etc.)
- **Phone Numbers**: Country-appropriate phone number formats
- **LinkedIn URLs**: Realistic LinkedIn profile URLs

### Company Data
- **Company Names**: Industry-appropriate company names by type
- **Backgrounds**: Contextual background information based on lead type
- **Countries**: Major financial centers and trading jurisdictions

### Financial Data
- **Trading Volumes**: $10K - $500K base volumes with realistic maker/taker splits
- **Fees**: Industry-standard fee structures
- **VIP Levels**: Progressive VIP level increases (0-9)
- **MM Levels**: Spot and futures market maker levels

## 🛡️ Safety Features

### Data Validation
- Foreign key constraints maintained
- Date progressions are logical
- No duplicate email addresses
- Proper status transitions

### Rollback Protection
- All operations are wrapped in transactions
- Automatic rollback on errors
- Connection cleanup on failure

### Existing Data Protection
- Optional data clearing (default: keep existing)
- Clear warnings when clearing data
- Summary statistics after generation

## 📈 Sample Output

```
🚀 LeadFi Test Data Generator
========================================
Volume: medium
Date Range: 2024-05-18 to 2024-07-18
Clear Existing: false

📊 Generating 150 leads...
🏢 Creating customers from converted leads...
📝 Generating activities...
📈 Generating trading volume data...
👑 Generating VIP history...

📊 DATA GENERATION SUMMARY
==================================================
📈 LEADS: 150
   1. lead generated: 45
   2. proposal: 30
   3. negotiation: 23
   4. registration: 15
   5. integration: 12
   6. closed won: 18
   7. lost: 7

🏢 CUSTOMERS: 18
📝 ACTIVITIES: 847
💹 TRADING RECORDS: 1,234
💰 TOTAL TRADING VOLUME: $45,678,912.34
💵 TOTAL FEES GENERATED: $23,456.78

📅 DATE RANGE: 2024-05-18 to 2024-07-18
🎛️ DATA VOLUME: medium

✅ Test data generation completed successfully!
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check your database configuration
   python -c "from db.db_config import get_db_connection; print('✅ DB Connected')"
   ```

2. **Permission Issues**
   ```bash
   # Make scripts executable
   chmod +x scripts/generate_test_data.py
   chmod +x scripts/run_test_data_generation.py
   ```

3. **Import Errors**
   ```bash
   # Make sure you're in the project root
   cd /path/to/LeadFi
   python scripts/run_test_data_generation.py
   ```

### Performance Notes
- Small volume: ~30 seconds
- Medium volume: ~1-2 minutes  
- Large volume: ~3-5 minutes

### Memory Usage
- Small volume: ~50MB
- Medium volume: ~150MB
- Large volume: ~300MB

## 🎨 Customization

### Adding New Lead Types
Edit `company_names` dictionary in `generate_test_data.py`:
```python
self.company_names = {
    'your_new_type': [
        'Company Name 1',
        'Company Name 2'
    ]
}
```

### Modifying BD Team
Update `bd_team` list:
```python
self.bd_team = [
    'Your Name', 'Team Member 2'
]
```

### Adjusting Activity Patterns
Modify activity generation weights in `generate_activities()`:
```python
# Change manual vs system activity ratio
if random.random() < 0.8:  # 80% manual activities
```

## 📝 Generated Files

After running the script, your database will contain:
- Realistic lead data with proper status distribution
- Customer records with trading history
- Activity logs showing BD engagement
- Trading volume showing business growth
- VIP progression showing customer development

This data provides a solid foundation for:
- Testing application features
- Demonstrating the CRM system
- Performance testing with realistic data volumes
- Training new team members
- Analytics and reporting development 