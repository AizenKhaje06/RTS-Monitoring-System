# Google Apps Script Setup for Real-Time Updates (Step 13)

This guide helps you set up automatic notifications when your Google Sheet is updated.

## Overview

Apps Script triggers will send webhook notifications to your dashboard whenever the sheet changes, enabling instant updates without waiting for the 5-minute refresh.

---

## Setup Instructions

### 1. Open Apps Script Editor

1. Open your CWAGO Tracking Google Sheet
2. Click **Extensions** → **Apps Script**
3. Delete any existing code in the editor

### 2. Add the Webhook Script

Paste this code into the Apps Script editor:

\`\`\`javascript
// CWAGO Tracking - Webhook Script
// This script sends notifications when the sheet is edited

// Your dashboard webhook URL
const WEBHOOK_URL = 'https://data-insight-hub-28.preview.emergentagent.com/api/webhook';

/**
 * Trigger function when sheet is edited
 */
function onEdit(e) {
  try {
    // Get edit details
    const range = e.range;
    const sheet = range.getSheet();
    const row = range.getRow();
    const column = range.getColumn();
    const oldValue = e.oldValue || '';
    const newValue = e.value || '';
    
    // Only send webhook for data rows (skip header)
    if (row === 1) {
      return;
    }
    
    // Get date from column A
    const dateCell = sheet.getRange(row, 1).getValue();
    const date = Utilities.formatDate(new Date(dateCell), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Prepare webhook payload
    const payload = {
      timestamp: new Date().toISOString(),
      event: 'SHEET_EDITED',
      sheet: sheet.getName(),
      row: row,
      column: column,
      date: date,
      oldValue: oldValue,
      newValue: newValue,
      user: Session.getActiveUser().getEmail()
    };
    
    // Send webhook notification
    sendWebhook(payload);
    
  } catch (error) {
    Logger.log('Error in onEdit: ' + error);
  }
}

/**
 * Trigger function when sheet is changed (formulas, etc.)
 */
function onChange(e) {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      event: 'SHEET_CHANGED',
      changeType: e.changeType,
      user: Session.getActiveUser().getEmail()
    };
    
    sendWebhook(payload);
    
  } catch (error) {
    Logger.log('Error in onChange: ' + error);
  }
}

/**
 * Send webhook notification
 */
function sendWebhook(payload) {
  try {
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('Webhook sent: ' + response.getResponseCode());
    
  } catch (error) {
    Logger.log('Error sending webhook: ' + error);
  }
}

/**
 * Test function - run this to test webhook
 */
function testWebhook() {
  const testPayload = {
    timestamp: new Date().toISOString(),
    event: 'TEST',
    message: 'Webhook test from Apps Script'
  };
  
  sendWebhook(testPayload);
  Logger.log('Test webhook sent');
}
\`\`\`

### 3. Save the Script

1. Click the **Save** icon (disk icon)
2. Name your project: "CWAGO Webhook Script"
3. Click **Save**

### 4. Set Up Triggers

#### Install Simple Trigger (onEdit):
The `onEdit` function automatically triggers when a cell is manually edited. No installation needed!

#### Install Advanced Trigger (onChange):
For detecting formula changes and other updates:

1. Click the **clock icon** (Triggers) in the left sidebar
2. Click **+ Add Trigger** (bottom right)
3. Configure trigger:
   - **Function**: `onChange`
   - **Event source**: From spreadsheet
   - **Event type**: On change
4. Click **Save**

#### Optional: Time-based Trigger (Periodic Sync):
To send periodic updates every hour:

1. Click **+ Add Trigger** again
2. Configure trigger:
   - **Function**: `testWebhook`
   - **Event source**: Time-driven
   - **Type of time-based trigger**: Hour timer
   - **Hour interval**: Every hour
3. Click **Save**

### 5. Authorize the Script

First time only:

1. Click **Run** → **Run function** → **testWebhook**
2. A dialog will appear: "Authorization required"
3. Click **Review permissions**
4. Select your Google account
5. Click **Advanced** → **Go to CWAGO Webhook Script (unsafe)**
6. Click **Allow**

### 6. Test the Setup

1. Go back to your Google Sheet
2. Edit any cell in the data rows
3. Check the dashboard - it should update instantly!

To verify the webhook is working:
1. In Apps Script, click **Executions** (left sidebar)
2. You should see successful runs of `onEdit` or `onChange`

---

## How It Works

\`\`\`
User edits Google Sheet
        ↓
Apps Script trigger fires
        ↓
Webhook sent to /api/webhook
        ↓
Dashboard receives notification
        ↓
Dashboard auto-refreshes data
        ↓
Users see instant updates
\`\`\`

---

## Webhook Payload Structure

### onEdit Event:
\`\`\`json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "event": "SHEET_EDITED",
  "sheet": "Sheet1",
  "row": 5,
  "column": 8,
  "date": "2024-01-15",
  "oldValue": "100",
  "newValue": "150",
  "user": "user@example.com"
}
\`\`\`

### onChange Event:
\`\`\`json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "event": "SHEET_CHANGED",
  "changeType": "OTHER",
  "user": "user@example.com"
}
\`\`\`

---

## Troubleshooting

### Webhook not working:
1. Check Apps Script **Executions** tab for errors
2. Verify WEBHOOK_URL is correct in the script
3. Check dashboard API logs: `tail -f /var/log/supervisor/nextjs.out.log`

### Authorization errors:
1. Re-run authorization: **Run** → **testWebhook**
2. Make sure you clicked "Allow" during authorization

### Triggers not firing:
1. Check **Triggers** tab to ensure they're installed
2. Delete and recreate triggers if needed
3. Make sure you're editing the correct sheet

### Rate limits:
- Apps Script has quotas (100 triggers per day for free accounts)
- If you hit limits, triggers will pause until quota resets
- Consider upgrading to Google Workspace for higher limits

---

## Advanced Configuration

### Filter Specific Columns:
To only send webhooks for specific columns (e.g., status columns):

\`\`\`javascript
function onEdit(e) {
  const column = e.range.getColumn();
  
  // Only trigger for columns H-AI (orders data)
  if (column < 8 || column > 35) {
    return;
  }
  
  // Rest of the code...
}
\`\`\`

### Batch Updates:
For multiple edits, add debouncing:

\`\`\`javascript
let updateTimer = null;

function onEdit(e) {
  // Clear existing timer
  if (updateTimer) {
    clearTimeout(updateTimer);
  }
  
  // Set new timer - send webhook after 5 seconds of no edits
  updateTimer = setTimeout(function() {
    sendWebhook(payload);
  }, 5000);
}
\`\`\`

### Email Notifications:
Send email when critical thresholds are hit:

\`\`\`javascript
function onEdit(e) {
  // Check if detention rate column updated
  if (e.range.getColumn() === 31) { // Column AF (Detained %)
    const detainedPercent = parseFloat(e.value);
    
    if (detainedPercent > 5) {
      MailApp.sendEmail({
        to: 'admin@example.com',
        subject: 'ALERT: High Detention Rate',
        body: 'Detention rate is now ' + detainedPercent + '%'
      });
    }
  }
}
\`\`\`

---

## Security Notes

- The webhook URL is public but only accepts POST requests
- Consider adding authentication token if needed:

\`\`\`javascript
const WEBHOOK_URL = 'https://your-dashboard.com/api/webhook?token=YOUR_SECRET_TOKEN';
\`\`\`

Then verify the token in your API route.

---

## Next Steps

Once Apps Script is set up:

1. ✅ Edit sheet data → See instant dashboard updates
2. ✅ Monitor webhook logs in Apps Script Executions
3. ✅ Customize triggers based on your needs
4. ✅ Add email alerts for critical metrics

Your real-time integration is complete! 🎉
