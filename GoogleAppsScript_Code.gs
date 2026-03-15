/**
 * ════════════════════════════════════════════════════════════════════════════
 *  REDIVIVIS STARTUP TECH KIT GIVEAWAY
 *  Google Apps Script — Google Sheets Web App
 *
 *  WHAT THIS DOES:
 *  ───────────────
 *  1. Receives a POST request from your sales page after every successful
 *     Paystack payment.
 *  2. Appends one row of structured data to your Google Sheet.
 *  3. Returns a JSON response so the front-end knows it worked.
 *
 *  HOW TO DEPLOY:
 *  ──────────────
 *  Step 1 ► Open Google Sheets → Extensions → Apps Script
 *  Step 2 ► Paste this entire file into the editor (replace any starter code)
 *  Step 3 ► Change SHEET_NAME below if needed (default: "Giveaway Entries")
 *  Step 4 ► Click "Deploy" → "New Deployment"
 *           • Type: Web App
 *           • Execute as: Me
 *           • Who has access: Anyone
 *  Step 5 ► Copy the Web App URL
 *  Step 6 ► Paste that URL into CONFIG.GOOGLE_SHEET_URL in your index.html
 *
 *  SHEET COLUMNS (auto-created on first run):
 *  ────────────────────────────────────────────
 *  A  Timestamp (server time)
 *  B  Order ID
 *  C  Paystack Reference
 *  D  Paystack Transaction ID
 *  E  Paystack Trxref
 *  F  Paystack Status
 *  G  First Name
 *  H  Last Name
 *  I  Full Name
 *  J  Email
 *  K  Phone / WhatsApp
 *  L  Address
 *  M  Tickets Bought
 *  N  Ticket Price Each (₦)
 *  O  Amount Paid (₦)
 *  P  Currency
 *  Q  Campaign
 *  R  Form Submitted At (ISO)
 *  S  Payment Confirmed At (ISO)
 * ════════════════════════════════════════════════════════════════════════════
 */

// ── CONFIGURATION ──────────────────────────────────────────────────────────
const SHEET_NAME = 'Giveaway Entries';   // Name of the tab in your Google Sheet


// ── COLUMN HEADERS ─────────────────────────────────────────────────────────
// These match exactly the keys in the JSON payload sent from index.html.
// The order here determines the column order in your sheet.
const HEADERS = [
  'Timestamp (Server)',
  'Order ID',
  'Paystack Reference',
  'Paystack Transaction ID',
  'Paystack Trxref',
  'Paystack Status',
  'First Name',
  'Last Name',
  'Full Name',
  'Email',
  'Phone / WhatsApp',
  'Address',
  'Detail',
  'Tickets Bought',
  'Ticket Price Each (₦)',
  'Amount Paid (₦)',
  'Currency',
  'Campaign',
  'Form Submitted At',
  'Payment Confirmed At'
];

// ── KEY MAP ────────────────────────────────────────────────────────────────
// Maps each header to its JSON payload key from the front-end.
// 'TIMESTAMP' is a special keyword — it inserts the server-side timestamp.
const KEY_MAP = {
  'Timestamp (Server)'       : 'TIMESTAMP',
  'Order ID'                 : 'order_id',
  'Paystack Reference'       : 'paystack_reference',
  'Paystack Transaction ID'  : 'paystack_trans_id',
  'Paystack Trxref'          : 'paystack_trxref',
  'Paystack Status'          : 'paystack_status',
  'First Name'               : 'first_name',
  'Last Name'                : 'last_name',
  'Full Name'                : 'full_name',
  'Email'                    : 'email',
  'Phone / WhatsApp'         : 'phone',
  'Address'                  : 'address',
  'Detail'                   : 'detail',
  'Tickets Bought'           : 'tickets_bought',
  'Ticket Price Each (₦)'    : 'ticket_price_each',
  'Amount Paid (₦)'          : 'amount_paid_ngn',
  'Currency'                 : 'currency',
  'Campaign'                 : 'campaign',
  'Form Submitted At'        : 'submitted_at',
  'Payment Confirmed At'     : 'payment_confirmed_at'
};


// ════════════════════════════════════════════════════════════════════════════
//  doPost — entry point called by the sales page
// ════════════════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    // ── 1. Parse the JSON body ─────────────────────────────────────────────
    const raw     = e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);

    // ── 2. Get (or create) the target sheet ───────────────────────────────
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // ── 3. Write headers if this is the very first row ────────────────────
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);

      // Style the header row
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setBackground('#005C2A');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);

      // Freeze the header row so it stays visible while scrolling
      sheet.setFrozenRows(1);

      // Auto-resize all columns
      sheet.autoResizeColumns(1, HEADERS.length);
    }

    // ── 4. Build the data row ──────────────────────────────────────────────
    const now = new Date();
    const row = HEADERS.map(function(header) {
      const key = KEY_MAP[header];
      if (key === 'TIMESTAMP') {
        return Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      }
      const value = payload[key];
      return (value !== undefined && value !== null) ? value : '';
    });

    // ── 5. Append the row to the sheet ────────────────────────────────────
    sheet.appendRow(row);

    // ── 6. Style the new row (alternate banding for readability) ──────────
    const lastRow   = sheet.getLastRow();
    const rowRange  = sheet.getRange(lastRow, 1, 1, HEADERS.length);

    if (lastRow % 2 === 0) {
      rowRange.setBackground('#E6F8EF');   // light green for even rows
    } else {
      rowRange.setBackground('#FFFFFF');   // white for odd rows
    }

    // Highlight the Order ID cell in bold green
    const orderIdCell = sheet.getRange(lastRow, 2);   // Column B = Order ID
    orderIdCell.setFontWeight('bold');
    orderIdCell.setFontColor('#007A3D');

    // Highlight the Amount Paid cell
    const amountCell = sheet.getRange(lastRow, 15);   // Column O = Amount Paid
    amountCell.setFontWeight('bold');

    // ── 7. Auto-resize columns after each new entry ───────────────────────
    sheet.autoResizeColumns(1, HEADERS.length);

    // ── 8. Optional: send email notification to admin ─────────────────────
    // Uncomment and fill in your email to get an alert for each new entry:
    //
    // sendAdminNotification(payload, now);

    // ── 9. Return success response ────────────────────────────────────────
    return ContentService
      .createTextOutput(JSON.stringify({
        status  : 'success',
        message : 'Entry recorded',
        order_id: payload.order_id || '',
        row     : lastRow
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Log the error to Apps Script execution log for debugging
    Logger.log('doPost ERROR: ' + err.toString());

    return ContentService
      .createTextOutput(JSON.stringify({
        status : 'error',
        message: err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ════════════════════════════════════════════════════════════════════════════
//  doGet — health-check endpoint
//  Visit the web app URL in a browser to confirm it's live.
// ════════════════════════════════════════════════════════════════════════════
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status : 'ok',
      message: 'Redivivis Giveaway — Google Sheets endpoint is live.',
      sheet  : SHEET_NAME,
      columns: HEADERS.length
    }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ════════════════════════════════════════════════════════════════════════════
//  sendAdminNotification (optional)
//  Sends an email to you every time a ticket is purchased.
//  Uncomment the call in doPost() to enable it.
// ════════════════════════════════════════════════════════════════════════════
function sendAdminNotification(payload, timestamp) {
  const adminEmail = 'YOUR_EMAIL@gmail.com';   // ← change this

  const subject = '🎟 New Ticket Purchase — ' + (payload.order_id || 'N/A');

  const body =
    'A new ticket purchase has been recorded.\n\n' +
    '────────────────────────────────\n' +
    'Order ID       : ' + (payload.order_id           || '—') + '\n' +
    'Paystack Ref   : ' + (payload.paystack_reference  || '—') + '\n' +
    'Full Name      : ' + (payload.full_name           || '—') + '\n' +
    'Email          : ' + (payload.email               || '—') + '\n' +
    'Phone          : ' + (payload.phone               || '—') + '\n' +
    'Tickets Bought : ' + (payload.tickets_bought      || '—') + '\n' +
    'Amount Paid    : ₦' + (payload.amount_paid_ngn    || '0') + '\n' +
    'Address        : ' + (payload.address             || '—') + '\n' +
    'Detail      : ' + (payload.detail           || '—') + '\n' +
    'Payment Status : ' + (payload.paystack_status     || '—') + '\n' +
    'Confirmed At   : ' + (payload.payment_confirmed_at|| '—') + '\n' +
    '────────────────────────────────\n\n' +
    'View full sheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl();

  MailApp.sendEmail(adminEmail, subject, body);
}


// ════════════════════════════════════════════════════════════════════════════
//  setupSheet (run manually once to create & format the sheet)
//  How to run: In the Apps Script editor, select "setupSheet" from the
//  function dropdown at the top, then click ▶ Run.
// ════════════════════════════════════════════════════════════════════════════
function setupSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  // Create the sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    Logger.log('Created sheet: ' + SHEET_NAME);
  } else {
    // Clear existing content
    sheet.clearContents();
    Logger.log('Cleared existing sheet: ' + SHEET_NAME);
  }

  // Write headers
  sheet.appendRow(HEADERS);

  // Style header row
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setBackground('#005C2A');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');

  // Freeze header
  sheet.setFrozenRows(1);

  // Set column widths
  sheet.setColumnWidth(1,  160);  // Timestamp
  sheet.setColumnWidth(2,  150);  // Order ID
  sheet.setColumnWidth(3,  200);  // Paystack Reference
  sheet.setColumnWidth(4,  170);  // Transaction ID
  sheet.setColumnWidth(5,  150);  // Trxref
  sheet.setColumnWidth(6,  120);  // Status
  sheet.setColumnWidth(7,  120);  // First Name
  sheet.setColumnWidth(8,  120);  // Last Name
  sheet.setColumnWidth(9,  180);  // Full Name
  sheet.setColumnWidth(10, 200);  // Email
  sheet.setColumnWidth(11, 150);  // Phone
  sheet.setColumnWidth(12, 220);  // Address
  sheet.setColumnWidth(13,  250);  // Detail
  sheet.setColumnWidth(14, 120);  // Tickets
  sheet.setColumnWidth(15, 130);  // Price Each
  sheet.setColumnWidth(16, 130);  // Amount Paid
  sheet.setColumnWidth(17,  80);  // Currency
  sheet.setColumnWidth(18, 250);  // Campaign
  sheet.setColumnWidth(19, 180);  // Submitted At
  sheet.setColumnWidth(20, 180);  // Confirmed At

  Logger.log('Sheet setup complete. ' + HEADERS.length + ' columns created.');
  SpreadsheetApp.getUi().alert('✅ Sheet "' + SHEET_NAME + '" is ready!');
}

