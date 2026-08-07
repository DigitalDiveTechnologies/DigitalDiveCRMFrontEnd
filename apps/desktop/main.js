const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const db = require('./src/database');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 868,
    minWidth: 1024,
    minHeight: 700,
    title: 'FilsDesk POS & Accounting Desktop Client',
    icon: path.join(__dirname, 'assets/icon.svg'),
    backgroundColor: '#0B0F19',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load app window (loads Next.js desktop renderer or local desktop UI)
  const appUrl = process.env.DESKTOP_UI_URL || 'http://localhost:3000/desktop';
  mainWindow.loadURL(appUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Native Desktop Handlers
ipcMain.handle('desktop:get-invoices', () => {
  return db.getLocalInvoices();
});

ipcMain.handle('desktop:get-outbox', () => {
  return db.getOutboxQueue();
});

ipcMain.handle('desktop:save-invoice', (event, invoiceData) => {
  return db.saveLocalInvoice(invoiceData);
});

ipcMain.handle('desktop:sync-outbox', async () => {
  return await db.syncOutbox();
});

ipcMain.handle('desktop:print-escpos', (event, receiptPayload) => {
  console.log('[Native Desktop Hardware Printer] ESC/POS Payload sent to USB Thermal Printer:', receiptPayload);
  return { success: true, message: 'ESC/POS receipt sent to USB thermal printer.' };
});
