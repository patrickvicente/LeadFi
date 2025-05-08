-- Sample Data for the database
-- Insert sample leads
INSERT INTO lead (full_name, email, telegram, phone_number, source, status, linkedin_url, country, bd_in_charge)
VALUES
  ('Alice Cruz', 'alice@example.com', '@aliceC', '09171234567', 'LinkedIn', 'new', 'https://linkedin.com/in/alice', 'Philippines', 'John'),
  ('Ben Tan', 'ben@example.com', '@benT', '09181234567', 'HubSpot', 'contacted', 'https://linkedin.com/in/ben', 'Singapore', 'James'),
  ('Clara Reyes', 'clara@example.com', '@claraR', '09192234567', 'Webinar', 'converted', 'https://linkedin.com/in/clara', 'Australia', 'John');

-- Insert converted customer (Clara)
INSERT INTO customer (customer_uid, type, lead_id, company_name, date_converted)
VALUES (
  12345678,
  'institution',
  (SELECT lead_id FROM lead WHERE email = 'clara@example.com'),
  'ClaraTech Pty Ltd',
  CURRENT_TIMESTAMP
);

-- Insert trading volume for Clara
INSERT INTO daily_trading_volume (
  customer_uid, date, spot_trading_volume, spot_maker_trading_volume, spot_taker_trading_volume,
  spot_maker_fees, spot_taker_fees,
  futures_trading_volume, futures_maker_trading_volume, futures_taker_trading_volume,
  futures_maker_fees, futures_taker_fees,
  total_net_fees, user_assets
)
VALUES (
  12345678,
  CURRENT_DATE,
  150000.00, 90000.00, 60000.00,
  45.25, 78.75,
  200000.00, 100000.00, 100000.00,
  120.00, 160.00,
  404.00,
  50000.00
);

-- Insert activities
INSERT INTO activity (lead_id, activity_type, description, bd)
VALUES
  ((SELECT lead_id FROM lead WHERE email = 'alice@example.com'), 'call', 'Initial discovery call', 'John'),
  ((SELECT lead_id FROM lead WHERE email = 'ben@example.com'), 'email', 'Sent introductory materials', 'James'),
  ((SELECT lead_id FROM lead WHERE email = 'clara@example.com'), 'meeting', 'Conversion discussion before sign-up', 'John');
