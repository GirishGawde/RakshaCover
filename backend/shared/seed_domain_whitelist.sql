-- ═══════════════════════════════════════════════════════════════════════════
-- RakshaCover — domain_whitelist Seed Data (Phase 1)
-- Module E: Database & Supabase Infrastructure
--
-- HOW TO USE:
--   1. Run db_schema.sql FIRST (Phase 0).
--   2. SQL Editor → New Query → paste this file → Run.
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO domain_whitelist (domain_name, description) VALUES

-- ── Indian Banks ────────────────────────────────────────────────────────────
('sbi.co.in',              'State Bank of India'),
('onlinesbi.sbi',          'SBI Online Banking Portal'),
('hdfcbank.com',           'HDFC Bank'),
('netbanking.hdfcbank.com','HDFC NetBanking Portal'),
('icicibank.com',          'ICICI Bank'),
('axisbank.com',           'Axis Bank'),
('kotak.com',              'Kotak Mahindra Bank'),
('netbanking.kotak.com',   'Kotak NetBanking'),
('pnbindia.in',            'Punjab National Bank'),
('unionbankofindia.co.in', 'Union Bank of India'),
('bankofbaroda.in',        'Bank of Baroda'),
('canarabank.in',          'Canara Bank'),
('indianbank.in',          'Indian Bank'),
('idbibank.in',            'IDBI Bank'),
('indusind.com',           'IndusInd Bank'),
('yesbank.in',             'Yes Bank'),
('federalbank.co.in',      'Federal Bank'),
('southindianbank.com',    'South Indian Bank'),
('dhanbank.com',           'Dhanlaxmi Bank'),
('rbl.co.in',              'RBL Bank'),

-- ── UPI & Payments ──────────────────────────────────────────────────────────
('paytm.com',              'Paytm Payments'),
('phonepe.com',            'PhonePe'),
('gpay.app',               'Google Pay (GPay)'),
('bhimupi.org.in',         'BHIM UPI (NPCI Official)'),
('npci.org.in',            'NPCI — National Payments Corporation of India'),
('amazonpay.in',           'Amazon Pay India'),
('mobikwik.com',           'MobiKwik'),
('freecharge.in',          'FreeCharge'),
('airtelbank.com',         'Airtel Payments Bank'),
('jiopay.in',              'JioPay'),

-- ── Govt. & Regulatory ──────────────────────────────────────────────────────
('rbi.org.in',             'Reserve Bank of India'),
('incometax.gov.in',       'Income Tax Department'),
('gst.gov.in',             'GST Portal'),
('epfindia.gov.in',        'EPFO — Employees Provident Fund'),
('uidai.gov.in',           'UIDAI — Aadhaar'),
('irctc.co.in',            'IRCTC — Indian Railways Ticketing'),
('india.gov.in',           'National Government Portal'),
('mha.gov.in',             'Ministry of Home Affairs'),
('cybercrime.gov.in',      'National Cyber Crime Reporting Portal (1930)'),
('ncrb.gov.in',            'NCRB — National Crime Records Bureau'),

-- ── Major E-commerce ────────────────────────────────────────────────────────
('amazon.in',              'Amazon India'),
('flipkart.com',           'Flipkart'),
('myntra.com',             'Myntra'),
('meesho.com',             'Meesho'),
('snapdeal.com',           'Snapdeal'),
('nykaa.com',              'Nykaa'),
('bigbasket.com',          'BigBasket'),
('jiomart.com',            'JioMart'),
('swiggy.com',             'Swiggy'),
('zomato.com',             'Zomato'),

-- ── Insurance & Finance ─────────────────────────────────────────────────────
('licindia.in',            'LIC — Life Insurance Corporation'),
('hdfclife.com',           'HDFC Life Insurance'),
('iciciprulife.com',       'ICICI Prudential Life Insurance'),
('starhealth.in',          'Star Health Insurance'),
('coverfox.com',           'Coverfox Insurance'),
('policybazaar.com',       'PolicyBazaar'),
('zerodha.com',            'Zerodha — Stock Broker'),
('groww.in',               'Groww — Investment App'),
('angelbroking.com',       'Angel One (Angel Broking)'),
('bajajfinserv.in',        'Bajaj Finserv')

ON CONFLICT (domain_name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification query (run this after seeding to confirm):
-- SELECT count(*) FROM domain_whitelist;
-- Expected: 70 rows
-- ═══════════════════════════════════════════════════════════════════════════
