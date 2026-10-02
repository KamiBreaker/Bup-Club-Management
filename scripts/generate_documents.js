import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { marked } from 'marked';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} from 'docx';

const projectRoot = process.cwd();
const mdPath = path.join(projectRoot, 'PROJECT_DOCUMENTATION.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// -------------------------------------------------------------
// 1. GENERATE PROFESSIONAL PDF VIA MARKED + MICROSOFT EDGE
// -------------------------------------------------------------
function generatePdf() {
  console.log('Generating HTML for PDF compilation...');

  const htmlBody = marked.parse(mdContent);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BUP Club & Society Management System - Project Documentation</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }
    
    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Cover Page */
    .cover-page {
      height: 92vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      border-bottom: 2px solid #e2e8f0;
      padding: 40px 20px;
    }

    .cover-header {
      border-left: 6px solid #10b981;
      padding-left: 20px;
    }

    .cover-inst {
      font-size: 13pt;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 0;
    }

    .cover-dept {
      font-size: 11pt;
      color: #059669;
      font-weight: 600;
      margin-top: 4px;
    }

    .cover-center {
      margin: 60px 0;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.15;
      letter-spacing: -0.5px;
      margin-bottom: 12px;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #475569;
      font-weight: 500;
      max-width: 600px;
    }

    .cover-badges {
      display: flex;
      gap: 10px;
      margin-top: 25px;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 14px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cover-meta {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      font-size: 10pt;
    }

    .meta-item strong {
      color: #0f172a;
      display: block;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .meta-item span {
      color: #334155;
      font-weight: 500;
    }

    /* Document Body Typography */
    h1 {
      font-size: 17pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #10b981;
      padding-bottom: 6px;
      margin-top: 32px;
      margin-bottom: 14px;
      page-break-after: avoid;
    }

    h2 {
      font-size: 13.5pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 24px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    h3 {
      font-size: 11.5pt;
      font-weight: 700;
      color: #0f766e;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    h4 {
      font-size: 10.5pt;
      font-weight: 700;
      color: #334155;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    p {
      margin-top: 0;
      margin-bottom: 10px;
      text-align: justify;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 12px;
      padding-left: 22px;
    }

    li {
      margin-bottom: 4px;
    }

    hr {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 24px 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0 20px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #0f172a;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.5px;
    }

    td {
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
      color: #334155;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Code Blocks and ASCII Art */
    pre {
      background: #0f172a;
      color: #f1f5f9;
      padding: 12px 14px;
      border-radius: 8px;
      font-family: "Cascadia Code", "Consolas", "Courier New", monospace;
      font-size: 7.5pt;
      line-height: 1.4;
      overflow-x: auto;
      margin: 14px 0;
      page-break-inside: avoid;
      border: 1px solid #334155;
    }

    code {
      font-family: "Cascadia Code", "Consolas", "Courier New", monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      color: #0f766e;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: inherit;
    }

    strong {
      color: #0f172a;
    }

    blockquote {
      border-left: 4px solid #10b981;
      background: #f0fdf4;
      color: #166534;
      padding: 10px 16px;
      margin: 14px 0;
      border-radius: 0 8px 8px 0;
      font-size: 9.5pt;
    }

    .avoid-break {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="cover-inst">Bangladesh University of Professionals</div>
      <div class="cover-dept">Department of Information and Communication Technology (ICT)</div>
    </div>

    <div class="cover-center">
      <div class="cover-title">BUP Club & Society<br>Management System</div>
      <div class="cover-subtitle">
        Software Engineering & Information System Design — Technical Specification, Architecture Analysis & Incremental Agile Development Report
      </div>

      <div class="cover-badges">
        <span class="cover-badge">Academic Project</span>
        <span class="cover-badge">Client-Server Architecture</span>
        <span class="cover-badge">Incremental Agile</span>
      </div>
    </div>

    <div class="cover-meta">
      <div class="meta-grid">
        <div class="meta-item">
          <strong>Course</strong>
          <span>Software Engineering & Information System Design</span>
        </div>
        <div class="meta-item">
          <strong>Institution</strong>
          <span>Bangladesh University of Professionals (BUP)</span>
        </div>
        <div class="meta-item">
          <strong>System Name</strong>
          <span>BUP-CMS Platform v2.0</span>
        </div>
        <div class="meta-item">
          <strong>GitHub Repository</strong>
          <span>KamiBreaker/Bup-Club-Management</span>
        </div>
        <div class="meta-item">
          <strong>Submission Target</strong>
          <span>October 2026</span>
        </div>
        <div class="meta-item">
          <strong>Document Scope</strong>
          <span>Architecture, Tech Stack, Methodology & SRS</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Document Main Body -->
  <div class="content">
    ${htmlBody}
  </div>

</body>
</html>`;

  const htmlOutputPath = path.join(projectRoot, 'dist', 'documentation.html');
  fs.mkdirSync(path.join(projectRoot, 'dist'), { recursive: true });
  fs.writeFileSync(htmlOutputPath, fullHtml, 'utf8');

  const pdfOutputPath = path.join(projectRoot, 'BUP_CMS_Project_Documentation.pdf');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  console.log('Compiling PDF via Microsoft Edge headless print-to-pdf...');
  execSync(`"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfOutputPath}" "${htmlOutputPath}"`);

  if (fs.existsSync(pdfOutputPath)) {
    const stats = fs.statSync(pdfOutputPath);
    console.log(`✅ PDF generated successfully: ${pdfOutputPath} (${Math.round(stats.size / 1024)} KB)`);
  } else {
    throw new Error('PDF file was not created');
  }
}

// -------------------------------------------------------------
// 2. GENERATE EDITABLE WORD DOCX DOCUMENT
// -------------------------------------------------------------
async function generateDocx() {
  console.log('Generating Microsoft Word DOCX document...');

  const docChildren = [];

  // Helper styles
  const createTitle = (text) => new Paragraph({
    text,
    heading: HeadingLevel.TITLE,
    spacing: { after: 120 },
    alignment: AlignmentType.CENTER
  });

  const createHeading1 = (text) => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 120 }
  });

  const createHeading2 = (text) => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 }
  });

  const createHeading3 = (text) => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 60 }
  });

  const createParagraph = (text) => new Paragraph({
    children: [new TextRun({ text, size: 21 })], // 10.5pt
    spacing: { after: 100 }
  });

  const createBullet = (label, text) => new Paragraph({
    bullet: { level: 0 },
    children: [
      new TextRun({ text: label + ': ', bold: true, size: 21 }),
      new TextRun({ text, size: 21 })
    ],
    spacing: { after: 60 }
  });

  const createTable = (headers, rows) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map(h => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })] })],
            shading: { fill: '0F172A', type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 120, right: 120 }
          }))
        }),
        ...rows.map((row, idx) => new TableRow({
          children: row.map(cell => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: cell, size: 18 })] })],
            shading: idx % 2 === 1 ? { fill: 'F8FAFC', type: ShadingType.CLEAR } : undefined,
            margins: { top: 80, bottom: 80, left: 120, right: 120 }
          }))
        }))
      ]
    });
  };

  // Cover Block
  docChildren.push(
    createTitle('🎓 BUP Club & Society Management System'),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Software Engineering & Information System Design — Technical Specification & Academic Report',
          italics: true,
          size: 24,
          color: '475569'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    createParagraph('Institution: Bangladesh University of Professionals (BUP)'),
    createParagraph('Department: Department of Information and Communication Technology (ICT)'),
    createParagraph('GitHub Repository: https://github.com/KamiBreaker/Bup-Club-Management'),
    createParagraph('Submission Window: October 2026'),
    new Paragraph({ text: '', spacing: { after: 300 } })
  );

  // SECTION 1
  docChildren.push(
    createHeading1('SECTION 1: Technical Stack & Tools Used ("Stuffs We Used Here")'),
    createHeading2('1. Frontend Technologies & Libraries'),
    createBullet('React 19 (v19.0.1)', 'Modern component-driven Single Page Application (SPA) architecture utilizing concurrent rendering, hooks (useState, useEffect, useMemo, useCallback), and custom ErrorBoundary wrappers.'),
    createBullet('TypeScript 5.8', 'End-to-end static type-safety across all domain entities, UI component props, and API request/response payloads (src/types/cms.ts).'),
    createBullet('Vite 6 (v6.2.3)', 'High-speed Next-Gen frontend build tool and development server with instant Hot Module Replacement (HMR) and optimized Rollup bundling.'),
    createBullet('Tailwind CSS v4', 'Utility-first CSS engine with glassmorphic dark-mode aesthetics, responsive grids, and tailored UI design tokens (src/index.css).'),
    createBullet('Motion (v12.23.24)', 'Declarative animation library for fluid layout transitions, spring physics, modal entrance/exits, and 3D holographic pass tilts.'),
    createBullet('Lucide React (v0.546.0)', 'Curated SVG icon set for campus navigation and status badges.'),
    createBullet('Recharts (v3.10.1)', 'Composable D3-based SVG charting library powering the Admin Analytics Dashboard (venue utilization, registrations).'),
    createBullet('Web Audio API Synthesizer', 'Custom client-side audio synthesizer generating tactile acoustic sound feedback for clicks, success confirmations, and error alerts (src/utils/audioFx.ts).'),
    createBullet('Canvas Confetti', 'Celebratory particle physics animations for RSVP passes, application approvals, and society chartering.'),

    createHeading2('2. Backend, Database & Server Runtime'),
    createBullet('Node.js (v24 LTS Runtime)', 'Server-side JavaScript runtime powering the RESTful backend services.'),
    createBullet('TSX (tsx watch v4.21.0)', 'Native TypeScript execute & watch daemon that automatically hot-reloads backend endpoints on file modifications without server downtime.'),
    createBullet('Express.js (v4.21.2)', 'Minimalist web application framework managing HTTP routing, request parsing, cookie extraction, and API error handlers (server.ts).'),
    createBullet('SQLite Engine (better-sqlite3 v13.0.3)', 'Fast synchronous C++ embedded relational database engine operating on local disk storage (bup-cms.db) with normalized schema constraints.'),
    createBullet('ESBuild (v0.25.0)', 'High-performance Go-based bundler compiling server.ts into a standalone production CommonJS distribution (dist/server.cjs).'),

    createHeading2('3. Security, Authentication & Session Layer'),
    createBullet('Bcrypt.js (v3.0.3)', 'Cryptographic hash algorithm applying 10-12 salt rounds for one-way password hashing (zero plaintext password storage).'),
    createBullet('JSON Web Tokens (jsonwebtoken v9.0.3)', 'Cryptographically signed HMAC-SHA256 session tokens stored in secure, tamper-proof httpOnly, sameSite: lax HTTP cookies.'),
    createBullet('Role-Based Access Control (RBAC)', 'Five-tier hierarchical permission model enforcing authorization boundaries: Student, Club_Exec, Faculty_Advisor, Venue_Admin, System_Admin.'),

    createHeading2('4. Specialized Integrated Subsystems'),
    createBullet('Dynamic 2D QR Ticketing Engine', 'External QR code generator rendering verifiable pass tokens for automated campus event entry check-in.'),
    createBullet('AI Event Description Copilot', 'Google Gemini SDK (@google/genai v2.4.0) with local deterministic heuristic fallback to auto-draft high-impact event descriptions.'),
    createBullet('Global Keyboard Command Palette (Ctrl+K / Cmd+K)', 'Keyboard-driven quick-launcher for navigating across clubs, venues, events, and administrative tools.'),
    createBullet('Tactile Motion Controller', 'Dynamic physics controller allowing users to adjust ambient particle speed and density.')
  );

  // SECTION 2
  docChildren.push(
    createHeading1('SECTION 2: Trello Everyday Update Plan (Item 1)'),
    createParagraph('Submission Target: 06/10/2026 & Continuous Daily Maintenance'),
    createHeading2('A. Trello Board Architecture'),
    createParagraph('Create a dedicated Trello Board named "BUP Club Management System - CSE SE Lab" configured with the standard Agile Kanban workflow columns:'),
    createParagraph('1. Backlog -> 2. Sprint To-Do -> 3. In Progress -> 4. Review & QA -> 5. Done (Verified Live)'),
    createHeading2('B. Daily Protocol for the 3 Team Members'),
    createBullet('Morning / Lab Entry Sync (10 Minutes)', 'Move assigned task cards from Sprint To-Do into In Progress. Add member avatars.'),
    createBullet('During Development', 'Use Trello Card Checklists for tracking granular subtasks (e.g. SQLite Migration, UI Card, RBAC 403 Test).'),
    createBullet('Evening / Lab Exit Update', 'Post a progress comment summarizing achievements, attach Git Commit Hash (e.g. ce3d641), and move completed cards to Review & QA then Done.'),
    createHeading2('C. Daily Task Allocation Schedule (Oct 02 - Oct 06, 2026)'),
    createTable(
      ['Date', 'Member 1: Frontend & UI/UX', 'Member 2: Backend & Database', 'Member 3: QA & Documentation'],
      [
        ['02/10/2026', 'Design Club Directory header banner & Charter Society modal.', 'Implement create-club and delete-club endpoints in server.ts.', 'Test API endpoints with Postman; document payload schemas.'],
        ['03/10/2026', 'Implement Event Hub card actions (Trash button, deadline pill, QR modal).', 'Implement create-event and delete-event routes with auth checks.', 'Verify role boundaries; ensure non-admin students receive 403 Forbidden.'],
        ['04/10/2026', 'Build Society Decommission and Event Cancellation modal dialogs.', 'Implement cascading relational cleanup in SQLite (purging passes, bookings).', 'Conduct database integrity testing; verify zero orphaned rows on deletion.'],
        ['05/10/2026', 'Integrate Web Audio cues, confetti celebrations, and command palette.', 'Configure tsx watch hot-reload script and production npm run build pipeline.', 'Capture screenshots of all modules; compile SRS requirements.'],
        ['06/10/2026', 'Audit responsive layout across mobile, tablet, and desktop viewports.', 'Finalize normalized SQLite seed script and database constraints.', 'Finalize Trello board cards, verify daily commit links, compile report.']
      ]
    )
  );

  // SECTION 3
  docChildren.push(
    createHeading1('SECTION 3: System Architecture Selection & Justification (Item 3)'),
    createParagraph('Submission Target: 06/10/2026'),
    createHeading2('Chosen Architecture: 3-Tier Modern Client-Server Architecture (Decoupled React SPA + Express REST API)'),
    createParagraph('Tier 1: Presentation Layer (React 19 SPA, Tailwind CSS v4, Motion Physics, Recharts) running in student/admin browser.'),
    createParagraph('Tier 2: Application & Logic Layer (Express.js REST API, TypeScript, JWT Auth Middleware, RBAC Engine).'),
    createParagraph('Tier 3: Data Storage Layer (Normalized Relational SQLite bup-cms.db via better-sqlite3).'),
    createHeading2('Architectural Comparison: Client-Server SPA vs. Traditional Monolithic MVC'),
    createTable(
      ['Architectural Factor', 'Traditional Monolithic MVC (Blade, Django, EJS)', 'Our Architecture: 3-Tier Client-Server SPA'],
      [
        ['Rendering Strategy', 'Server-Side Rendering (SSR): Server regenerates full HTML for every click; page flickering.', 'Client-Side Rendering (CSR): Shell loaded once; views update smoothly via DOM diffing and JSON.'],
        ['Coupling', 'Tightly Coupled: Templates locked to server runtime language.', 'Decoupled: Frontend and backend are independent communicating via standard REST JSON.'],
        ['User Experience (UX)', 'Full-page reloads break client state, stop animations, disrupt flow.', 'Fluid app-like responsiveness with client routing, spring animations, and audio cues.'],
        ['API Reusability', 'Server returns HTML views unusable by mobile apps.', 'RESTful API: JSON endpoints can serve future Android/iOS apps or university portals.'],
        ['Scalability & Deploy', 'Backend consumes heavy CPU rendering HTML strings for every request.', 'Static assets cached on CDN; backend only handles lightweight JSON payloads.']
      ]
    ),
    createHeading2('Technical Justifications for BUP-CMS:'),
    createBullet('Interactive Workflows', 'Live digital QR pass rendering, interactive usher check-in counters, and Ctrl+K command palette require client-side execution without disruptive page reloads.'),
    createBullet('Stateless Security', 'JWT tokens stored in HTTP-only cookies decouple authentication state from the server, allowing scalable request authorization.'),
    createBullet('Data Integrity & Cascading', 'Relational transactions and cascading cleanups (e.g. deleting a club purges events, passes, and bookings) are isolated in the database tier.')
  );

  // SECTION 4
  docChildren.push(
    createHeading1('SECTION 4: Development Methodology: Incremental Agile Model (Item 4)'),
    createParagraph('Submission Target: 06/10/2026'),
    createHeading2('Chosen Methodology: Incremental Agile Methodology (Iterative & Incremental Agile Development)'),
    createParagraph('The Incremental Agile Model combines the flexibility and adaptability of Agile principles with the structured, modular delivery of the Incremental Model. The system is decomposed into independently functional, fully testable software increments.'),
    createHeading2('The 5 Delivered Increments Mapped to Codebase:'),
    createBullet('Increment 1: Core Foundation & RBAC Engine (Release v1.0)', 'Normalized SQLite database initialization, 5-tier role-based access control, Bcrypt password hashing, and JWT cookie authentication in server.ts.'),
    createBullet('Increment 2: Society Discovery & Public Directory (Release v1.1)', 'Category filtering, search engine, and accredited society cards in src/components/cms/ClubDirectory.tsx.'),
    createBullet('Increment 3: Membership Governance & Q&A Loop (Release v1.2)', 'Dual-tier application engine (General Member vs Executive), decision immutability locking, bidirectional Q&A clarification, and automatic role promotion in server.ts and MembershipHub.tsx.'),
    createBullet('Increment 4: Event Hub, 2D QR Passes & Usher Gate Check-in (Release v1.3)', 'Event publishing, seat limits, AI description generator, dynamic 2D QR Digital Entry Passes, and live usher attendance check-in in EventHub.tsx.'),
    createBullet('Increment 5: System Admin Governance & Cascading Lifecycle (Release v2.0)', 'System Admin society chartering, society dissolution with complete cascading relational cleanup, site-wide event controls, and live hot-reloading with tsx watch.'),
    createHeading2('Comparison: Incremental Agile vs. Other Methodologies'),
    createTable(
      ['Process Metric', 'Traditional Waterfall', 'Pure Agile (Scrum Only)', 'Our Model: Incremental Agile'],
      [
        ['Deliverable Timing', 'Single deliverable at project end', 'Working software at end of 2-4 week sprint', 'Functional cumulative releases delivered increment-by-increment'],
        ['Risk of Total Failure', 'Extremely high (bugs found late)', 'Moderate (goals may drift)', 'Lowest (each increment is verified before advancing)'],
        ['Requirement Changes', 'Prohibitive and costly', 'Welcomed, but hard to bound', 'Easily incorporated into the next planned increment'],
        ['Instructor Visibility', 'Zero visibility until final day', 'Sprint review meetings', 'Working software ready for evaluation at every university lab session']
      ]
    )
  );

  // SECTION 5
  docChildren.push(
    createHeading1('SECTION 5: Requirements Finalization (Item 5)'),
    createParagraph('Submission Target: 13/10/2026'),
    createHeading2('A. Requirements Elicitation Techniques & Evidentiary Proofs'),
    createBullet('Interview 1 (BUP Office of Student Affairs)', 'Paper-based club charters and approvals take 2-3 weeks across multiple faculty desks. Derived Requirement: Automated digital routing, immutable timestamps, and instant society chartering.'),
    createBullet('Interview 2 (President, BUP Robotics & Research Club)', 'Managing walk-ins causes auditorium overcrowding; paper tickets are costly and forged. Derived Requirement: Digital QR ticketing with seat capacity caps and live usher attendance check-in.'),
    createBullet('Interview 3 (Undergraduate Student, Dept. of ICT)', 'Students miss recruitment deadlines because notices are posted on scattered physical bulletin boards. Derived Requirement: Centralized digital society directory with countdown timers and in-app notifications.'),
    createBullet('Quantitative Survey (54 BUP Students)', '87.0% reported missing deadlines or lost paper forms; 94.4% preferred digital smartphone QR passes; 72.2% experienced venue double-booking or AV equipment shortages.'),
    createBullet('Observational Proofs', 'Physical bulletin boards crowded with torn posters; ushers recording student attendance manually on paper at Multipurpose Hall; multi-page physical membership forms requiring signatures.'),

    createHeading2('B. Functional Requirements (FRs)'),
    createTable(
      ['Req ID', 'Subsystem Module', 'Functional Requirement Specification', 'Supported Roles', 'Code Reference'],
      [
        ['FR-01', 'Authentication', 'Users can register with verified @bup.edu.bd emails. Public signup defaults to Student or Faculty_Advisor.', 'All Users', 'server.ts (line 802)'],
        ['FR-02', 'Directory', 'Display accredited university clubs with search, categories, executive rosters, and advisor contacts.', 'All Users', 'ClubDirectory.tsx'],
        ['FR-03', 'Society Chartering', 'System Admin can charter new societies with allocated budgets, advisor info, and unique codes.', 'System_Admin', 'server.ts (line 1793)'],
        ['FR-04', 'Society Dissolution', 'System Admin can dissolve clubs with complete cascading removal of associated events, memberships, and bookings.', 'System_Admin', 'server.ts (line 1882)'],
        ['FR-05', 'Application', 'Students can apply for General Membership or Executive candidacy with Statements of Purpose.', 'Student', 'server.ts (line 939)'],
        ['FR-06', 'Decision Immutability', 'Moderators can Approve or Reject applications with remarks. Decisions are permanent and cannot be flipped.', 'Club_Exec, System_Admin', 'server.ts (line 1049)'],
        ['FR-07', 'Interactive Q&A', 'Moderators can ask clarification questions; applicants receive actionable notifications to reply directly.', 'Club_Exec, Student', 'server.ts (line 1148)'],
        ['FR-08', 'Auto-Promotion', 'Approving an executive application automatically elevates user role to Club_Exec and updates club roster.', 'Club_Exec, System_Admin', 'server.ts (line 1089)'],
        ['FR-09', 'Event Publishing', 'Publish events with seat caps, deadlines, categories, and AI-assisted descriptions.', 'Club_Exec, System_Admin', 'server.ts (line 1544)'],
        ['FR-10', 'Event Deletion', 'Delete events, automatically revoking user passes and venue reservations.', 'Club_Exec, System_Admin', 'server.ts (line 1609)'],
        ['FR-11', 'Digital Pass (QR)', 'Students RSVP for open events to receive a verified pass code and downloadable 2D QR ticket.', 'Student', 'EventHub.tsx (line 710)'],
        ['FR-12', 'Gate Check-in', 'Ushers verify student attendance in real time via pass code or student ID with duplicate check prevention.', 'Club_Exec, System_Admin', 'server.ts (line 1483)'],
        ['FR-13', 'Venue Booking', 'Clubs submit reservation requests for campus auditoriums/labs with equipment requirements.', 'Club_Exec', 'server.ts (line 1662)'],
        ['FR-14', 'Venue Approval', 'Venue administrators review and Approve/Reject reservations, checking for schedule conflicts.', 'Venue_Admin', 'server.ts (line 1706)'],
        ['FR-15', 'Live Notifications', 'Targeted alerts dispatched for RSVP confirmations, decision approvals, and admin announcements.', 'All Roles', 'NotificationCenter.tsx']
      ]
    ),

    createHeading2('C. Non-Functional Requirements (NFRs)'),
    createTable(
      ['Metric / Category', 'Requirement Specification', 'Architectural Enforcement & Verification Proof'],
      [
        ['NFR-01: Performance', 'API response time under 100ms; UI transitions under 16ms (60 FPS).', 'Benchmarked with SQLite memory/SSD binary indexes and synchronous C++ bindings (better-sqlite3).'],
        ['NFR-02: Security', 'Zero plaintext passwords. Session hijacking mitigated.', 'Passwords hashed using bcrypt (12 rounds). Session tokens signed in httpOnly secure cookies.'],
        ['NFR-03: RBAC Integrity', 'Privilege escalation prevented at API boundary regardless of client DOM state.', 'Verified in server.ts by rejecting unauthorized student requests with HTTP 403 Forbidden.'],
        ['NFR-04: Data Integrity', 'Foreign relational references must not become orphaned when clubs or events are removed.', 'Cascading SQL cleanup triggers delete associated registrations, attendance, applications, and bookings.'],
        ['NFR-05: Usability & UX', 'Modern accessibility and feedback with auditory and visual confirmation.', 'Implemented custom Web Audio API synthesizer feedback, modal dialogs, and toast alerts.'],
        ['NFR-06: Availability', 'Client interface handles network disconnects gracefully without application crashes.', 'React ErrorBoundary wrappers around every tab module prevent full-screen crashes.'],
        ['NFR-07: Portability', 'Application runs on any OS (Windows, Linux, macOS).', 'Cross-platform Node.js + embedded SQLite with automatic fallback to /tmp in cloud environments.'],
        ['NFR-08: Auditability', 'Every approval, rejection, and attendance record logs reviewer identity and timestamp.', 'Maintained in decision_by, decision_date, marked_by, and marked_at database columns.']
      ]
    )
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } // 1 inch = 1440 twips
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                text: 'BUP Club & Society Management System (BUP-CMS) — Academic Documentation',
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ size: 16, color: '64748B', italics: true })]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Page ', size: 18, color: '64748B' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '64748B' })
                ]
              })
            ]
          })
        },
        children: docChildren
      }
    ]
  });

  const docxOutputPath = path.join(projectRoot, 'BUP_CMS_Project_Documentation.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxOutputPath, buffer);

  const stats = fs.statSync(docxOutputPath);
  console.log(`✅ Word DOCX generated successfully: ${docxOutputPath} (${Math.round(stats.size / 1024)} KB)`);
}

async function main() {
  try {
    generatePdf();
    await generateDocx();
    console.log('\n🎉 ALL DOCUMENTS GENERATED SUCCESSFULLY!');
  } catch (error) {
    console.error('Error generating documents:', error);
    process.exit(1);
  }
}

main();
