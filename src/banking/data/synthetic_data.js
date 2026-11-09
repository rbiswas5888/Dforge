/**
 * Enterprise Banking Operations Platform — Synthetic Financial Dataset
 * 
 * NOTICE:
 * ALL DATA IN THIS FILE IS 100% SYNTHETIC AND SIMULATED FOR DEMONSTRATION PURPOSES.
 * DOES NOT CONTAIN REAL CUSTOMER IDENTIFIERS, LIVE BANK ACCOUNTS, OR PRIVATE DATA.
 */

export const SYSTEM_META = {
  platformName: 'AxiomCore Enterprise Banking Operations Platform',
  version: '4.8.2-PROD-SIM',
  environment: 'SIMULATED PRODUCTION ENVIRONMENT',
  disclaimer: 'DEMO / SIMULATED DATA — ALL INSTITUTIONAL IDENTIFIERS ARE FICTIONAL',
  lastSync: '2026-11-09T18:30:00Z',
  activeTenant: 'Global Tier-1 Clearing Bank NA',
  bic: 'AXIOMUS33XXX'
};

export const GLOBAL_LIQUIDITY_ACCOUNTS = [
  {
    id: 'nostro-usd-01',
    currency: 'USD',
    correspondentBank: 'JPMorgan Chase Bank N.A., New York',
    bic: 'CHASUS33XXX',
    accountNumber: '••••-••••-9821',
    balance: 1245890450.25,
    availableBalance: 1195890450.25,
    intradayBuffer: 50000000.00,
    creditFacilityLimit: 500000000.00,
    utilizationPercent: 78.4,
    status: 'OPTIMAL',
    trend: '+4.2%'
  },
  {
    id: 'nostro-eur-01',
    currency: 'EUR',
    correspondentBank: 'Deutsche Bank AG, Frankfurt',
    bic: 'DEUTDEDDFXX',
    accountNumber: '••••-••••-4102',
    balance: 680240110.80,
    availableBalance: 650240110.80,
    intradayBuffer: 30000000.00,
    creditFacilityLimit: 300000000.00,
    utilizationPercent: 62.1,
    status: 'OPTIMAL',
    trend: '+1.8%'
  },
  {
    id: 'nostro-gbp-01',
    currency: 'GBP',
    correspondentBank: 'Barclays Bank PLC, London',
    bic: 'BARCGB22XXX',
    accountNumber: '••••-••••-7733',
    balance: 412980300.50,
    availableBalance: 397980300.50,
    intradayBuffer: 15000000.00,
    creditFacilityLimit: 200000000.00,
    utilizationPercent: 84.5,
    status: 'WARNING',
    trend: '-3.1%'
  },
  {
    id: 'nostro-jpy-01',
    currency: 'JPY',
    correspondentBank: 'MUFG Bank Ltd, Tokyo',
    bic: 'BOTKJPJTXXX',
    accountNumber: '••••-••••-1055',
    balance: 38500000000.00,
    availableBalance: 36500000000.00,
    intradayBuffer: 2000000000.00,
    creditFacilityLimit: 15000000000.00,
    utilizationPercent: 45.2,
    status: 'OPTIMAL',
    trend: '+0.5%'
  },
  {
    id: 'nostro-sgd-01',
    currency: 'SGD',
    correspondentBank: 'DBS Bank Ltd, Singapore',
    bic: 'DBSSSGSGXXX',
    accountNumber: '••••-••••-6619',
    balance: 145220000.00,
    availableBalance: 135220000.00,
    intradayBuffer: 10000000.00,
    creditFacilityLimit: 80000000.00,
    utilizationPercent: 55.0,
    status: 'OPTIMAL',
    trend: '+2.4%'
  },
  {
    id: 'nostro-chf-01',
    currency: 'CHF',
    correspondentBank: 'UBS Switzerland AG, Zurich',
    bic: 'UBSWCHZHXXX',
    accountNumber: '••••-••••-3820',
    balance: 180450000.00,
    availableBalance: 172450000.00,
    intradayBuffer: 8000000.00,
    creditFacilityLimit: 100000000.00,
    utilizationPercent: 68.9,
    status: 'OPTIMAL',
    trend: '+0.9%'
  }
];

export const REAL_TIME_TRANSACTIONS = [
  {
    id: 'TX-2026-98124',
    uetr: 'e81a3d42-5b91-4c12-9c71-209182390841',
    messageType: 'pacs.008.001.10',
    clearingRail: 'Fedwire Funds',
    debtor: 'Meridian Global Energy Corp (DE)',
    debtorAccount: '••••-4921',
    debtorBic: 'AXIOMUS33XXX',
    creditor: 'Helios Shipping International B.V. (NL)',
    creditorAccount: '••••-8812',
    creditorBic: 'INGBNL2AXXX',
    amount: 14250000.00,
    currency: 'USD',
    timestamp: '2026-11-09T18:24:12Z',
    status: 'SETTLED',
    riskScore: 18,
    stp: true,
    remittance: 'INV-2026-Q4-CRUDE-0912 // CHARTER HULL 402'
  },
  {
    id: 'TX-2026-98125',
    uetr: '3b92f104-9a81-4221-88f2-110293847561',
    messageType: 'pacs.009.001.10',
    clearingRail: 'Target2',
    debtor: 'AxiomCore Treasury Frankfurt',
    debtorAccount: '••••-1104',
    debtorBic: 'AXIOMDEDDXXX',
    creditor: 'Société Générale Paris',
    creditorAccount: '••••-9923',
    creditorBic: 'SOGEFRPPXXX',
    amount: 52000000.00,
    currency: 'EUR',
    timestamp: '2026-11-09T18:22:45Z',
    status: 'SETTLED',
    riskScore: 5,
    stp: true,
    remittance: 'INTERBANK LIQUIDITY SWEEP // VAL 20261109'
  },
  {
    id: 'TX-2026-98126',
    uetr: 'fa819201-1122-4433-8899-abcdef012345',
    messageType: 'pacs.008.001.10',
    clearingRail: 'SWIFT FIN / Cross-Border',
    debtor: 'Caspian Petrochem Trading FZE (AE)',
    debtorAccount: '••••-7319',
    debtorBic: 'EMIRAEADXXX',
    creditor: 'Veloce Logistics Limited (CY)',
    creditorAccount: '••••-3001',
    creditorBic: 'BCYPCY2NXXX',
    amount: 8450000.00,
    currency: 'USD',
    timestamp: '2026-11-09T18:20:18Z',
    status: 'FLAGGED_AML',
    riskScore: 88,
    stp: false,
    remittance: 'EQUIPMENT PARTS // CYPRESS TERMINAL REF 402'
  },
  {
    id: 'TX-2026-98127',
    uetr: '77218391-4455-6677-8899-0123456789ab',
    messageType: 'pacs.008.001.10',
    clearingRail: 'CHIPS',
    debtor: 'BioPharma Diagnostics Inc (US)',
    debtorAccount: '••••-5582',
    debtorBic: 'AXIOMUS33XXX',
    creditor: 'Tokyo Genomic Research Labs (JP)',
    creditorAccount: '••••-2291',
    creditorBic: 'BOTKJPJTXXX',
    amount: 3200000.00,
    currency: 'USD',
    timestamp: '2026-11-09T18:18:02Z',
    status: 'PENDING_APPROVAL',
    riskScore: 42,
    stp: false,
    remittance: 'CLINICAL TRIAL MILESTONE B // CONTRACT 991'
  },
  {
    id: 'TX-2026-98128',
    uetr: 'cc019283-8844-1122-9933-445566778899',
    messageType: 'pacs.008.001.10',
    clearingRail: 'Faster Payments UK',
    debtor: 'Apex Global Holdings AG (CH)',
    debtorAccount: '••••-6612',
    debtorBic: 'UBSWCHZHXXX',
    creditor: 'London FinTech Clearinghouse Ltd',
    creditorAccount: '••••-4481',
    creditorBic: 'BARCGB22XXX',
    amount: 1850000.00,
    currency: 'GBP',
    timestamp: '2026-11-09T18:15:30Z',
    status: 'SETTLED',
    riskScore: 12,
    stp: true,
    remittance: 'TREASURY COLLATERAL TOPUP // MARGIN REF 55'
  },
  {
    id: 'TX-2026-98129',
    uetr: '99887766-5544-3322-1100-ffeeddccbbaa',
    messageType: 'pacs.008.001.10',
    clearingRail: 'SEPA Instant',
    debtor: 'Nordic Clean Energy AB (SE)',
    debtorAccount: '••••-1829',
    debtorBic: 'HANDSESSXXX',
    creditor: 'Rotterdam Offshore Wind Turbines B.V.',
    creditorAccount: '••••-9012',
    creditorBic: 'ABNANL2AXXX',
    amount: 4750000.00,
    currency: 'EUR',
    timestamp: '2026-11-09T18:12:11Z',
    status: 'SETTLED',
    riskScore: 8,
    stp: true,
    remittance: 'TURBINE BLADE SHIPMENT // LOT #882'
  }
];

export const SWIFT_MESSAGES = {
  'pacs.008': {
    code: 'pacs.008.001.10',
    name: 'Financial Institutional Customer Credit Transfer',
    uetr: 'e81a3d42-5b91-4c12-9c71-209182390841',
    messageId: 'MSG-20261109-AXIOM-009182',
    creationDate: '2026-11-09T18:24:12Z',
    settlementDate: '2026-11-09',
    amount: 14250000.00,
    currency: 'USD',
    chargeBearer: 'SHAR',
    debtor: {
      name: 'Meridian Global Energy Corp',
      address: '1000 Louisiana St, Suite 5400, Houston, TX 77002, US',
      accountIban: 'US89AXIOM000010928374921',
      bic: 'AXIOMUS33XXX'
    },
    creditor: {
      name: 'Helios Shipping International B.V.',
      address: 'Boompjes 40, 3011 XB Rotterdam, NL',
      accountIban: 'NL91INGB00029384758812',
      bic: 'INGBNL2AXXX'
    },
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>MSG-20261109-AXIOM-009182</MsgId>
      <CreDtTm>2026-11-09T18:24:12Z</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys>
          <Prtry>FEDW</Prtry>
        </ClrSys>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>E2E-MERIDIAN-2026-0912</EndToEndId>
        <UETR>e81a3d42-5b91-4c12-9c71-209182390841</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="USD">14250000.00</IntrBkSttlmAmt>
      <IntrBkSttlmDt>2026-11-09</IntrBkSttlmDt>
      <ChrgBr>SHAR</ChrgBr>
      <Dbtr>
        <Nm>Meridian Global Energy Corp</Nm>
        <PstlAdr>
          <Ctry>US</Ctry>
          <AdrLine>1000 Louisiana St, Suite 5400, Houston, TX</AdrLine>
        </PstlAdr>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <Othr>
            <Id>US89AXIOM000010928374921</Id>
          </Othr>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BICFI>AXIOMUS33XXX</BICFI>
          <Nm>AxiomCore Clearing Bank NA</Nm>
        </FinInstnId>
      </DbtrAgt>
      <CdtrAgt>
        <FinInstnId>
          <BICFI>INGBNL2AXXX</BICFI>
          <Nm>ING Bank N.V.</Nm>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>Helios Shipping International B.V.</Nm>
        <PstlAdr>
          <Ctry>NL</Ctry>
          <AdrLine>Boompjes 40, Rotterdam</AdrLine>
        </PstlAdr>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>NL91INGB00029384758812</IBAN>
        </Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>INV-2026-Q4-CRUDE-0912 // CHARTER HULL 402</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`
  },
  'pacs.009': {
    code: 'pacs.009.001.10',
    name: 'Financial Institution Transfer (Cover / Liquidity)',
    uetr: '3b92f104-9a81-4221-88f2-110293847561',
    messageId: 'MSG-20261109-INTB-008472',
    creationDate: '2026-11-09T18:22:45Z',
    settlementDate: '2026-11-09',
    amount: 52000000.00,
    currency: 'EUR',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.009.001.10">
  <FICdtTrf>
    <GrpHdr>
      <MsgId>MSG-20261109-INTB-008472</MsgId>
      <CreDtTm>2026-11-09T18:22:45Z</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf><SttlmMtd>CLRG</SttlmMtd></SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId><UETR>3b92f104-9a81-4221-88f2-110293847561</UETR></PmtId>
      <IntrBkSttlmAmt Ccy="EUR">52000000.00</IntrBkSttlmAmt>
      <DbtrAgt><FinInstnId><BICFI>AXIOMDEDDXXX</BICFI></FinInstnId></DbtrAgt>
      <CdtrAgt><FinInstnId><BICFI>SOGEFRPPXXX</BICFI></FinInstnId></CdtrAgt>
    </CdtTrfTxInf>
  </FICdtTrf>
</Document>`
  }
};

export const AML_ALERTS = [
  {
    id: 'AML-2026-081',
    caseTitle: 'High-Velocity Structuring across Shell Entities',
    subjectEntity: 'Caspian Petrochem Trading FZE',
    jurisdiction: 'United Arab Emirates / Cyprus',
    riskScore: 88,
    severity: 'CRITICAL',
    triggerReason: 'Transaction volume exceeded 300% of rolling 30-day baseline; immediate re-transfer to high-risk jurisdiction.',
    involvedAmount: '$8,450,000.00 USD',
    detectedAt: '2026-11-09T18:20:18Z',
    status: 'UNDER_INVESTIGATION',
    assignedAnalyst: 'Sarah Jenkins (Senior AML Specialist)',
    recommendedAction: 'Freeze account assets & file SAR with FinCEN'
  },
  {
    id: 'AML-2026-082',
    caseTitle: 'Potential Round-Amount Structuring below Reporting Threshold',
    subjectEntity: 'Veloce Logistics Limited',
    jurisdiction: 'Cyprus / Malta',
    riskScore: 74,
    severity: 'HIGH',
    triggerReason: 'Five consecutive transfers of exactly $9,950.00 within 2 hours across multiple originator accounts.',
    involvedAmount: '$49,750.00 USD',
    detectedAt: '2026-11-09T17:45:00Z',
    status: 'ESCALATED',
    assignedAnalyst: 'David Chen (Sanctions Lead)',
    recommendedAction: 'Consolidate beneficial ownership and verify invoice provenance'
  },
  {
    id: 'AML-2026-083',
    caseTitle: 'Adverse Media Hit — Ultimate Beneficial Owner Sanctions Proximity',
    subjectEntity: 'Apex Global Holdings AG',
    jurisdiction: 'Switzerland',
    riskScore: 65,
    severity: 'MEDIUM',
    triggerReason: 'UBO identified as second-degree associate of sanctioned oligarch on OFAC SDN listing.',
    involvedAmount: '$18,200,000.00 USD',
    detectedAt: '2026-11-09T16:10:00Z',
    status: 'REVIEW_PENDING',
    assignedAnalyst: 'Unassigned',
    recommendedAction: 'Trigger comprehensive Corporate 360 review & request UBO verification'
  }
];

export const ENTITY_GRAPH = {
  nodes: [
    { id: 'n1', label: 'Apex Global Holdings AG', type: 'Parent Holding', jurisdiction: 'CH', risk: 'HIGH', balance: '$182M' },
    { id: 'n2', label: 'Veloce Trading B.V.', type: 'Subsidiary (75%)', jurisdiction: 'NL', risk: 'MEDIUM', balance: '$68M' },
    { id: 'n3', label: 'Caspian Petrochem FZE', type: 'Operating Entity', jurisdiction: 'AE', risk: 'CRITICAL', balance: '$45M' },
    { id: 'n4', label: 'Meridian Asset Trust', type: 'Trust Structure', jurisdiction: 'JE', risk: 'HIGH', balance: '$120M' },
    { id: 'n5', label: 'Helios Shipping Ltd', type: 'Special Purpose Vehicle', jurisdiction: 'CY', risk: 'MEDIUM', balance: '$34M' },
    { id: 'n6', label: 'Elena Rostova', type: 'UBO (42%)', jurisdiction: 'CY / MC', risk: 'CRITICAL', pep: true },
    { id: 'n7', label: 'Marcus Vance', type: 'Nominee Director', jurisdiction: 'GB', risk: 'LOW', pep: false }
  ],
  links: [
    { source: 'n6', target: 'n1', relation: 'Beneficial Owner (42%)', weight: 4 },
    { source: 'n1', target: 'n2', relation: 'Controls 75% Equity', weight: 3 },
    { source: 'n1', target: 'n3', relation: 'Controls 100% Equity', weight: 3 },
    { source: 'n3', target: 'n5', relation: 'Fund Transfers ($14.2M)', weight: 5, flagged: true },
    { source: 'n4', target: 'n1', relation: 'Pledged Facility ($50M)', weight: 2 },
    { source: 'n7', target: 'n2', relation: 'Director Mandate', weight: 1 },
    { source: 'n7', target: 'n5', relation: 'Director Mandate', weight: 1 }
  ]
};

export const CORPORATE_ACCOUNTS = [
  {
    id: 'corp-01',
    name: 'Meridian Global Energy Corp',
    domicile: 'Delaware, United States',
    primaryCurrency: 'USD',
    riskRating: 'A+ (Low Risk)',
    totalBalance: 428901200.00,
    creditFacility: 250000000.00,
    drawnAmount: 185000000.00,
    activeSignatories: 4,
    kycStatus: 'VERIFIED_ACTIVE',
    lastReview: '2026-09-15'
  },
  {
    id: 'corp-02',
    name: 'BioPharma Diagnostics NV',
    domicile: 'Amsterdam, Netherlands',
    primaryCurrency: 'EUR',
    riskRating: 'AA (Minimal Risk)',
    totalBalance: 312450800.00,
    creditFacility: 150000000.00,
    drawnAmount: 42000000.00,
    activeSignatories: 3,
    kycStatus: 'VERIFIED_ACTIVE',
    lastReview: '2026-10-01'
  },
  {
    id: 'corp-03',
    name: 'Caspian Petrochem Trading FZE',
    domicile: 'Dubai, United Arab Emirates',
    primaryCurrency: 'USD',
    riskRating: 'C- (High Monitoring)',
    totalBalance: 64120300.00,
    creditFacility: 50000000.00,
    drawnAmount: 48500000.00,
    activeSignatories: 2,
    kycStatus: 'ENHANCED_DUE_DILIGENCE',
    lastReview: '2026-11-05'
  }
];

export const SANCTIONS_MATCHES = [
  {
    id: 'SANC-001',
    targetName: 'Elena Rostova',
    matchedEntry: 'ROSTOVA, Elena (DOB: 1974-04-12)',
    program: 'OFAC SDN [UKRAINE-EO14024]',
    matchConfidence: 94.2,
    hitType: 'PHONETIC_FUZZY_EXACT',
    status: 'ACTIVE_HOLD',
    actionRequired: 'BLOCK_FUNDS'
  },
  {
    id: 'SANC-002',
    targetName: 'Caspian Logistics FZE',
    matchedEntry: 'CASPIAN TRANS OCEANIC LTD',
    program: 'EU Sanctions Consolidated Annex I',
    matchConfidence: 78.5,
    hitType: 'PARTIAL_STRING_MATCH',
    status: 'FALSE_POSITIVE_REVIEW',
    actionRequired: 'VERIFY_IDENTIFIERS'
  }
];

export const REGULATORY_METRICS = {
  lcr: { value: 142.8, minimum: 100.0, status: 'COMPLIANT' },
  nsfr: { value: 118.4, minimum: 100.0, status: 'COMPLIANT' },
  cet1: { value: 16.5, minimum: 10.5, status: 'STRONG' },
  largeExposureLimit: { value: 18.2, maxAllowed: 25.0, status: 'WITHIN_BOUNDS' },
  fincenFilingsPending: 3,
  crossBorderReportsDue: 7
};

export const RULE_ENGINE_RULES = [
  {
    id: 'RULE-01',
    name: 'Intraday Outflow Velocity Surge Limit',
    category: 'Liquidity Safeguard',
    condition: 'IF cumulative_outflows_1h > $50,000,000 USD THEN require_treasury_dual_sign()',
    status: 'ENABLED',
    triggeredCountToday: 2
  },
  {
    id: 'RULE-02',
    name: 'Sanctions Phonetic Match Threshold',
    category: 'AML Screening',
    condition: 'IF fuzzy_match_score(beneficiary, OFAC_SDN) >= 80% THEN auto_block_and_alert()',
    status: 'ENABLED',
    triggeredCountToday: 1
  },
  {
    id: 'RULE-03',
    name: 'Cross-Border OFAC & High-Risk Corridor Check',
    category: 'Compliance',
    condition: 'IF origin_country IN HIGH_RISK_FATF OR dest_country IN HIGH_RISK_FATF THEN trigger_edg_review()',
    status: 'ENABLED',
    triggeredCountToday: 5
  }
];

export const MAKER_CHECKER_ITEMS = [
  {
    id: 'MC-901',
    type: 'High-Value Wire Transfer Release',
    amount: '$14,250,000.00 USD',
    beneficiary: 'Helios Shipping International B.V.',
    maker: 'Arthur Pendelton (Treasury Analyst 2)',
    makerTimestamp: '2026-11-09T18:14:00Z',
    status: 'PENDING_CHECKER',
    details: 'Contract settlement invoice #INV-2026-Q4-CRUDE-0912'
  },
  {
    id: 'MC-902',
    type: 'Nostro Intraday Overdraft Limit Extension',
    amount: '$50,000,000.00 USD',
    beneficiary: 'JPMorgan Chase NY Nostro',
    maker: 'Claire DuPont (VP Liquidity Management)',
    makerTimestamp: '2026-11-09T17:50:00Z',
    status: 'PENDING_CHECKER',
    details: 'Buffer for upcoming end-of-day CLS settlement run'
  },
  {
    id: 'MC-903',
    type: 'Sanctions False Positive Override',
    amount: 'N/A (Compliance Flag)',
    beneficiary: 'Caspian Logistics FZE',
    maker: 'David Chen (Sanctions Lead)',
    makerTimestamp: '2026-11-09T17:30:00Z',
    status: 'PENDING_CHECKER',
    details: 'Evidence verified: Different registration jurisdiction and registry number'
  }
];

export const PAYMENT_RAILS = [
  { name: 'Fedwire Funds Service', status: 'OPERATIONAL', latencyMs: 28, todayVolume: '$18.4B', stpRate: '99.4%' },
  { name: 'CHIPS Net Settlement', status: 'OPERATIONAL', latencyMs: 45, todayVolume: '$12.1B', stpRate: '98.9%' },
  { name: 'Target2 RTGS (Eurosystem)', status: 'OPERATIONAL', latencyMs: 32, todayVolume: '€14.8B', stpRate: '99.6%' },
  { name: 'SEPA Instant Credit', status: 'OPERATIONAL', latencyMs: 14, todayVolume: '€3.2B', stpRate: '99.8%' },
  { name: 'Faster Payments Service (UK)', status: 'OPERATIONAL', latencyMs: 18, todayVolume: '£2.1B', stpRate: '99.7%' },
  { name: 'SWIFT Alliance Gateway', status: 'OPERATIONAL', latencyMs: 65, todayVolume: '$42.5B', stpRate: '97.8%' }
];

export const AUDIT_TRAIL = [
  {
    timestamp: '2026-11-09T18:24:12Z',
    actor: 'SYS_ROUTER_01',
    action: 'SETTLE_TRANSACTION',
    target: 'TX-2026-98124',
    ipHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    result: 'SUCCESS'
  },
  {
    timestamp: '2026-11-09T18:20:18Z',
    actor: 'AML_AI_SENTINEL',
    action: 'FLAG_TRANSACTION_AML',
    target: 'TX-2026-98126',
    ipHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    result: 'HEURISTIC_TRIGGER_SCORE_88'
  },
  {
    timestamp: '2026-11-09T18:14:00Z',
    actor: 'Arthur Pendelton (maker)',
    action: 'CREATE_PAYMENT_SUBMISSION',
    target: 'MC-901',
    ipHash: '9821a0f9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
    result: 'PENDING_DUAL_AUTH'
  }
];
