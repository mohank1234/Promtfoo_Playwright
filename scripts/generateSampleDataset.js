// One-off generator for datasets/Acme_Benchmark_Dataset.xlsx - a small,
// entirely fictional benchmark dataset (~120 Q&A pairs across 6 agents) for
// a made-up company, "Acme Corp". Kept in the repo so the sample dataset is
// transparent and easy to extend - run with:
//   node scripts/generateSampleDataset.js
const path = require("path");
const XLSX = require("xlsx");

const COLUMNS = [
  "S.No",
  "Agent",
  "Question",
  "Query Category",
  "Scenario Type",
  "Expected Answer",
  "Answer in Staging",
  "Score",
  "Source Document",
  "Notes / Edge Flag",
  "Pass / Fail",
];

const SHEETS = {
  "HR Agent": {
    agent: "HR Agent",
    source: "Acme Corp Employee Handbook",
    rows: [
      ["Leave Management", "How many vacation days do new employees get in their first year?", "New employees accrue 15 vacation days in their first year, prorated monthly from their start date."],
      ["Leave Management", "How many vacation days do employees get after 3 years of service?", "After 3 years of continuous service, vacation accrual increases to 20 days per year."],
      ["Leave Management", "What is the sick leave policy?", "Employees receive 10 paid sick days per calendar year, which do not roll over to the next year."],
      ["Remote Work", "What is Acme Corp's remote work policy?", "Employees may work remotely up to 3 days per week, subject to manager approval and role eligibility."],
      ["Onboarding", "How long is the probation period for new hires?", "The standard probation period is 90 days from the employee's start date."],
      ["Offboarding", "What is the required notice period for resignation?", "Employees must provide a minimum of 2 weeks' written notice before their last working day."],
      ["Leave Management", "What is the parental leave policy?", "Primary caregivers receive 12 weeks of paid parental leave; secondary caregivers receive 4 weeks."],
      ["Compensation", "How is overtime pay calculated?", "Non-exempt employees are paid 1.5x their base hourly rate for hours worked beyond 40 in a week."],
      ["Performance", "How often are performance reviews conducted?", "Formal performance reviews are conducted twice a year, in June and December."],
      ["Compensation", "What is the employee referral bonus amount?", "Employees who refer a successfully hired candidate receive a $1,500 referral bonus, paid after the new hire completes 90 days."],
      ["Workplace Policy", "What is the company dress code?", "Acme Corp follows a business-casual dress code Monday through Thursday, with casual attire permitted on Fridays."],
      ["Benefits", "When can employees enroll in health insurance?", "Health insurance enrollment occurs during the annual open enrollment period in November, or within 30 days of a qualifying life event."],
      ["Benefits", "Does Acme Corp match 401(k) contributions?", "Acme Corp matches 100% of employee 401(k) contributions up to 4% of base salary."],
      ["Offboarding", "What is the severance policy for involuntary termination?", "Employees terminated without cause receive 2 weeks of severance pay per year of service, up to a maximum of 12 weeks."],
      ["Workplace Policy", "How should an employee report workplace harassment?", "Harassment concerns should be reported to HR directly, via the anonymous ethics hotline, or to any people manager, who must escalate to HR within 24 hours."],
      ["Travel", "Does business travel require pre-approval?", "All business travel over $500 requires manager pre-approval submitted through the travel request portal at least 5 business days in advance."],
      ["Onboarding", "How long is the new hire onboarding program?", "The structured onboarding program runs for the employee's first 30 days, including orientation, systems setup, and role-specific training."],
      ["Workplace Policy", "What are Acme Corp's core working hours?", "Core hours are 10:00 AM to 3:00 PM local time, during which all employees must be available; flexible scheduling applies outside this window."],
      ["Leave Management", "How many paid public holidays does Acme Corp observe?", "Acme Corp observes 11 paid public holidays per calendar year, published annually on the HR intranet."],
      ["Benefits", "Is there a professional development budget for employees?", "Each employee has an annual $1,000 professional development budget for courses, certifications, or conferences, subject to manager approval."],
    ],
  },
  "Legal Agent": {
    agent: "Legal Agent",
    source: "Acme Corp Legal & Compliance Manual",
    rows: [
      ["Contracts", "What is the standard duration of an NDA with a vendor?", "Standard vendor NDAs remain in effect for 3 years from the effective date, unless otherwise negotiated."],
      ["Contracts", "What notice period is required to terminate a vendor contract?", "Vendor contracts require 60 days' written notice prior to termination, unless terminated for cause."],
      ["Data Privacy", "How long does Acme Corp retain customer data?", "Customer data is retained for 7 years after the end of the customer relationship, in line with statutory record-keeping requirements."],
      ["Data Privacy", "What is the response time for a GDPR data subject access request?", "Acme Corp must respond to data subject access requests within 30 calendar days of receipt."],
      ["Intellectual Property", "Who owns intellectual property created by employees during employment?", "All intellectual property created by employees within the scope of their employment is owned by Acme Corp, per the IP assignment clause in the employment agreement."],
      ["Contracts", "What is the standard non-compete clause duration for senior employees?", "Senior employees are subject to a 12-month non-compete restriction following termination, limited to direct competitors in the same market."],
      ["Contracts", "What is the standard liability cap in Acme Corp vendor agreements?", "Vendor agreements cap liability at 12 months of fees paid under the agreement, except for breaches of confidentiality or IP infringement."],
      ["Contracts", "How does Acme Corp define force majeure in its contracts?", "Force majeure covers events beyond a party's reasonable control, including natural disasters, war, and government action, that prevent contract performance."],
      ["Dispute Resolution", "How are contract disputes with vendors resolved?", "Disputes are first subject to good-faith negotiation for 30 days, then resolved through binding arbitration under the rules of the American Arbitration Association."],
      ["Contracts", "Do Acme Corp vendor contracts auto-renew?", "Vendor contracts auto-renew for successive 1-year terms unless either party provides written notice of non-renewal at least 60 days before the term ends."],
      ["Data Privacy", "Under what conditions can customer data be shared with third parties?", "Customer data may only be shared with third parties who have signed a data processing agreement and only for purposes disclosed in the privacy policy."],
      ["Intellectual Property", "What happens to an employee's IP assignment obligations after termination?", "IP assignment obligations for work created during employment survive termination indefinitely; the obligation does not apply to work created after the employee's last day."],
      ["Contracts", "How long does the confidentiality obligation last after an employee leaves?", "The confidentiality obligation in the employment agreement survives termination and continues indefinitely for trade secrets, and for 5 years for other confidential information."],
      ["Contracts", "What governing law applies to Acme Corp's standard customer contracts?", "Acme Corp's standard customer contracts are governed by the laws of the State of Delaware, without regard to conflict of law principles."],
      ["Contracts", "What does the indemnification clause in vendor contracts cover?", "The indemnification clause covers third-party claims arising from the vendor's breach of contract, negligence, or infringement of intellectual property rights."],
      ["Data Privacy", "What is the notification timeline for a data breach affecting customer data?", "Acme Corp must notify affected customers and relevant regulators within 72 hours of confirming a data breach involving personal data."],
      ["Intellectual Property", "What are the guidelines for using the Acme Corp trademark in marketing materials?", "The Acme Corp trademark may only be used in marketing materials that have been reviewed and approved by the Legal and Brand teams, per the Trademark Usage Guide."],
      ["Contracts", "What is the signature authority threshold requiring VP approval?", "Contracts with a total value exceeding $250,000 require VP-level signature authority; contracts above $1,000,000 require C-suite approval."],
      ["Compliance", "How often are internal compliance audits conducted?", "Internal compliance audits are conducted annually, with additional spot audits triggered by regulatory changes or reported incidents."],
      ["Compliance", "How long must signed legal documents be retained?", "Signed legal documents, including contracts and amendments, must be retained for a minimum of 10 years after contract expiration."],
    ],
  },
  "Finance Agent": {
    agent: "Finance Agent",
    source: "Acme Corp Finance Policy Manual",
    rows: [
      ["Expenses", "What expense amount requires manager approval?", "Expenses of $50 or more require manager approval before submission for reimbursement; expenses under $50 do not require approval."],
      ["Expenses", "What is the deadline for submitting expense reports?", "Expense reports must be submitted within 30 days of the expense date to be eligible for reimbursement."],
      ["Accounts Payable", "What are Acme Corp's standard invoice payment terms?", "Standard payment terms for approved vendor invoices are Net 30 from the invoice date."],
      ["Travel", "What is the per diem rate for domestic business travel?", "The per diem rate for domestic business travel is $75 per day, covering meals and incidentals."],
      ["Budgeting", "What approval is required to budget for a new hire?", "Budget approval for a new headcount requires sign-off from the hiring manager's VP and the Finance business partner."],
      ["Procurement", "What purchase order amount requires VP approval?", "Purchase orders exceeding $25,000 require VP approval; purchase orders exceeding $100,000 require CFO approval."],
      ["Expenses", "What is the corporate credit card policy?", "Corporate credit cards are issued to employees who travel frequently or manage vendor relationships, with a default monthly limit of $5,000."],
      ["Budgeting", "When does Acme Corp's fiscal year begin?", "Acme Corp's fiscal year begins on April 1 and ends on March 31 of the following year."],
      ["Expenses", "How are expenses in foreign currency converted for reimbursement?", "Foreign currency expenses are converted to USD using the exchange rate on the date of the transaction, as provided by the corporate card issuer."],
      ["Procurement", "What is the approval threshold for capital expenditures?", "Capital expenditures over $50,000 require both departmental VP and Finance Committee approval before purchase."],
      ["Accounts Payable", "What is the standard payment cycle for approved vendors?", "Approved vendor payments are processed in a weekly payment run every Wednesday, for invoices approved by the prior Friday."],
      ["Expenses", "What is the petty cash limit per office location?", "Each office location may maintain a petty cash fund of up to $500 for minor incidental purchases."],
      ["Accounting", "What is Acme Corp's revenue recognition policy for annual subscriptions?", "Revenue from annual subscriptions is recognized ratably on a monthly basis over the 12-month subscription term."],
      ["Accounts Payable", "Is there a penalty for late vendor invoice payments?", "Late payments to vendors due to Acme Corp processing delays may incur a 1.5% monthly late fee, per standard vendor contract terms."],
      ["Tax", "What is the process for applying a tax exemption certificate to a purchase?", "Tax exemption certificates must be submitted to Accounts Payable at the time of purchase order creation to be applied before invoicing."],
      ["Budgeting", "What is the annual budget planning cycle timeline?", "Annual budget planning begins in January with departmental submissions, with final board approval by the end of March."],
      ["Accounting", "How are costs allocated across departments?", "Shared costs are allocated to department cost centers based on headcount percentage, reviewed and updated quarterly."],
      ["Compliance", "How long are financial audit trail records retained?", "Financial audit trail records, including approvals and supporting documentation, are retained for 7 years."],
      ["Accounts Payable", "What currency is used for international vendor payments?", "International vendor payments are made in the vendor's local currency where supported, otherwise in USD."],
      ["Accounting", "When is the monthly financial close deadline?", "The monthly financial close deadline is the 5th business day of the following month."],
    ],
  },
  "IT Agent": {
    agent: "IT Agent",
    source: "Acme Corp IT Security Policy",
    rows: [
      ["Security", "What is the password rotation policy for standard user accounts?", "Standard user account passwords must be rotated every 90 days."],
      ["Security", "What is the password rotation policy for admin accounts?", "Administrator account passwords must be rotated every 60 days, more frequently than standard user accounts due to elevated privileges."],
      ["Access Management", "How does an employee request VPN access?", "VPN access is requested through the IT Service Portal and requires manager approval before provisioning, typically completed within 1 business day."],
      ["Security", "Is two-factor authentication required for all employees?", "Two-factor authentication is required for all employees accessing company systems, including email, VPN, and internal applications."],
      ["Software Management", "What is the process for requesting new software installation?", "New software requests must be submitted through the IT Service Portal and reviewed for security and licensing compliance before approval."],
      ["Data Management", "How often are company servers backed up?", "Production servers are backed up daily with incremental backups, and a full backup is taken weekly, retained for 90 days."],
      ["Support", "What is the SLA for responding to a critical IT incident?", "Critical (Severity 1) incidents must receive an initial response from IT within 15 minutes and a resolution target of 4 hours."],
      ["Security", "Does Acme Corp allow employees to use personal devices for work (BYOD)?", "Personal devices may access company email and calendar via the approved mobile management app, but may not access internal systems without VPN and MDM enrollment."],
      ["Data Management", "What is the email retention policy?", "Company email is retained for 5 years by default, and litigation holds can extend retention indefinitely for specific mailboxes."],
      ["Security", "What are the password complexity requirements?", "Passwords must be at least 12 characters and include uppercase, lowercase, a number, and a special character."],
      ["Security", "What happens after multiple failed login attempts?", "Accounts are locked after 5 consecutive failed login attempts and must be unlocked by the IT help desk after identity verification."],
      ["Access Management", "What is the policy for remote desktop access to internal servers?", "Remote desktop access to internal servers requires VPN connection plus a separate just-in-time access request approved by the system owner."],
      ["Support", "What are the IT ticket priority levels and their response SLAs?", "Tickets are classified as Critical (15 min), High (2 hours), Medium (1 business day), and Low (3 business days)."],
      ["Onboarding", "How long does it take to provision a laptop for a new hire?", "New hire laptops are provisioned and shipped within 5 business days of the offer acceptance date."],
      ["Data Management", "What is the default cloud storage quota per employee?", "Each employee receives a default 1TB cloud storage quota, with increases available upon manager-approved request."],
      ["Security", "What is the policy on using USB storage devices?", "USB storage devices are blocked by default on company laptops; exceptions require a business justification approved by IT Security."],
      ["Security", "How should an employee report a suspected phishing email?", "Suspected phishing emails should be reported using the 'Report Phishing' button in the email client, which forwards the message to the Security Operations team."],
      ["Software Management", "What is the process for renewing enterprise software licenses?", "Software license renewals are reviewed 60 days before expiration by IT Asset Management, in coordination with the budget owner."],
      ["Access Management", "What network access is provided to office visitors?", "Visitors receive time-limited access to an isolated guest Wi-Fi network with no access to internal systems, valid for the duration of their visit."],
      ["Security", "Are company laptops required to have disk encryption enabled?", "All company laptops must have full-disk encryption enabled by default before being issued to an employee."],
    ],
  },
  "Sales Agent": {
    agent: "Sales Agent",
    source: "Acme Corp Sales Playbook",
    rows: [
      ["Pricing", "What discount tier applies to a $120,000 annual deal?", "Deals between $100,000 and $250,000 annually qualify for the Gold tier, allowing a maximum discount of 15%."],
      ["Pricing", "What discount tier applies to a $40,000 annual deal?", "Deals under $50,000 annually fall in the Silver tier, allowing a maximum discount of 10%."],
      ["Compensation", "What is the standard sales commission rate on new business?", "The standard commission rate on new business bookings is 10% of the first-year contract value."],
      ["Process", "What is the deal registration process for partner-sourced leads?", "Partners must register a deal in the Partner Portal before initial customer contact to be eligible for partner commission."],
      ["Systems", "Is CRM logging mandatory for all sales activities?", "All customer interactions, including calls, emails, and meetings, must be logged in the CRM within 24 hours of occurring."],
      ["Quota", "When does the sales quota reset each year?", "Sales quotas reset at the start of each fiscal year, on April 1, aligned with Acme Corp's fiscal calendar."],
      ["Process", "What criteria qualify a lead as an MQL (marketing qualified lead)?", "A lead becomes an MQL after engaging with 3 or more marketing assets and matching the ideal customer profile firmographic criteria."],
      ["Contracts", "Can a sales representative sign a customer contract independently?", "Sales representatives may sign contracts up to $25,000 in total contract value; anything above that requires Sales Director co-signature."],
      ["Pricing", "What discount is offered for contract renewals without changes?", "Renewals with no changes to scope receive a standard 5% loyalty discount if renewed before the contract expiration date."],
      ["Compensation", "What commission rate applies to partner-referred deals?", "Partner-referred deals that close successfully earn the referring partner a 10% commission on first-year contract value."],
      ["Process", "How are sales territories assigned to representatives?", "Sales territories are assigned by the RevOps team based on account geography and industry vertical, reviewed annually."],
      ["Process", "How often are sales pipeline reviews conducted?", "Pipeline reviews are conducted weekly between each sales rep and their manager, with a monthly review at the regional level."],
      ["Product", "How long is the standard free trial period for new prospects?", "The standard free trial period is 14 days, extendable to 30 days with sales manager approval."],
      ["Process", "What approval is needed to offer an upsell discount to an existing customer?", "Upsell discounts up to 10% can be approved by the account executive; discounts above 10% require sales manager approval."],
      ["Pricing", "What discount is available for multi-year contracts?", "Customers signing a 3-year contract upfront receive an additional 5% discount on top of their applicable tier discount."],
      ["Expenses", "What is the approval process for client entertainment expenses?", "Client entertainment expenses over $200 require pre-approval from the sales manager and must include the client's name and business purpose."],
      ["Process", "How long is a sales quote valid before it must be reissued?", "Sales quotes are valid for 30 days from the date of issue, after which pricing must be reconfirmed."],
      ["Pricing", "Does Acme Corp match competitor discounts?", "Competitor price matching requires Deal Desk approval and documented proof of the competing offer before any discount is applied."],
      ["Compensation", "How does commission differ between new logo deals and renewals?", "New logo deals earn a 10% commission rate, while renewals earn a 3% commission rate, reflecting the lower acquisition effort."],
      ["Training", "Is sales enablement training mandatory for new sales hires?", "New sales hires must complete the 2-week sales enablement bootcamp before being assigned a full account book."],
    ],
  },
  "General Agent": {
    agent: "General Agent",
    source: "Acme Corp Company Handbook",
    rows: [
      ["Company Info", "When was Acme Corp founded?", "Acme Corp was founded in 2011 and has grown from a 5-person startup into a global company."],
      ["Company Info", "Where is Acme Corp headquartered?", "Acme Corp is headquartered in Austin, Texas, with additional offices across North America and Europe."],
      ["Company Info", "How many office locations does Acme Corp have?", "Acme Corp operates 6 office locations worldwide, in addition to a fully remote workforce option."],
      ["Company Info", "What is Acme Corp's mission statement?", "Acme Corp's mission is to make enterprise software simple, reliable, and accessible for businesses of every size."],
      ["Company Info", "Who is Acme Corp's current CEO?", "Acme Corp's current CEO is Jordan Reyes, who has led the company since 2019."],
      ["Company Info", "How many paid holidays does Acme Corp observe annually?", "Acme Corp observes 11 paid public holidays each year, in addition to a end-of-year company-wide shutdown week."],
      ["Company Info", "What are Acme Corp's standard office hours?", "Standard office hours are 9:00 AM to 6:00 PM local time, Monday through Friday, with flexible scheduling around core hours."],
      ["Company Info", "Approximately how many employees does Acme Corp have?", "Acme Corp employs approximately 1,200 people globally as of the most recent headcount report."],
      ["Company Info", "What products and services does Acme Corp offer?", "Acme Corp offers a suite of enterprise workflow automation products, including project management, document collaboration, and analytics tools."],
      ["Company Info", "What are Acme Corp's stated core values?", "Acme Corp's core values are Customer Obsession, Integrity, Ownership, and Continuous Improvement."],
      ["Company Info", "What is Acme Corp's sustainability commitment?", "Acme Corp has committed to reaching net-zero carbon emissions across its operations by 2030."],
      ["Company Info", "What diversity and inclusion initiatives does Acme Corp run?", "Acme Corp runs 5 employee resource groups and publishes an annual pay equity and representation report."],
      ["Company Info", "What are Acme Corp's main departments?", "Acme Corp's main departments are Engineering, Product, Sales, Marketing, Finance, Legal, HR, and IT."],
      ["Company Info", "How often does Acme Corp hold company-wide all-hands meetings?", "Acme Corp holds a company-wide all-hands meeting on the first Monday of every month."],
      ["Company Info", "Where can employees access the full employee handbook?", "The full employee handbook is available on the internal HR intranet under the 'Policies' section, accessible to all employees."],
      ["Company Info", "What does the Acme Corp code of conduct cover?", "The code of conduct covers workplace ethics, conflicts of interest, anti-bribery, and expected standards of professional behavior."],
      ["Company Info", "Where can employees find official brand guidelines?", "Official brand guidelines, including logo usage and templates, are maintained by the Marketing team on the Brand Portal."],
      ["Company Info", "Does Acme Corp have a social media policy for employees?", "Employees may identify as Acme Corp employees on personal social media but must include a disclaimer that views are their own and avoid sharing confidential information."],
      ["Company Info", "What is the visitor policy at Acme Corp headquarters?", "All visitors must be pre-registered by their host and sign in at reception, where they receive a visitor badge and are escorted in non-public areas."],
      ["Company Info", "Does Acme Corp celebrate a company founding anniversary?", "Acme Corp celebrates its founding anniversary every October with a company-wide event recognizing employee milestones and achievements."],
    ],
  },
};

const wb = XLSX.utils.book_new();
let sNo = 1;

for (const [sheetName, sheetDef] of Object.entries(SHEETS)) {
  const rows = sheetDef.rows.map(([category, question, expectedAnswer]) => {
    const row = {};
    row["S.No"] = sNo++;
    row["Agent"] = sheetDef.agent;
    row["Question"] = question;
    row["Query Category"] = category;
    row["Scenario Type"] = "Positive";
    row["Expected Answer"] = expectedAnswer;
    row["Answer in Staging"] = "";
    row["Score"] = "";
    row["Source Document"] = sheetDef.source;
    row["Notes / Edge Flag"] = "";
    row["Pass / Fail"] = "";
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMNS });
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

const outPath = path.join(__dirname, "..", "datasets", "Acme_Benchmark_Dataset.xlsx");
XLSX.writeFile(wb, outPath);
console.log(`Wrote ${sNo - 1} rows across ${Object.keys(SHEETS).length} sheets to ${outPath}`);
