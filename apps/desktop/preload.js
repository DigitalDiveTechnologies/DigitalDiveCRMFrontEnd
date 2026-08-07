const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getLocalInvoices: () => ipcRenderer.invoke('desktop:get-invoices'),
  getOutboxQueue: () => ipcRenderer.invoke('desktop:get-outbox'),
  saveInvoiceLocally: (data) => ipcRenderer.invoke('desktop:save-invoice', data),
  syncOutboxWithServer: () => ipcRenderer.invoke('desktop:sync-outbox'),
  printThermalReceipt: (payload) => ipcRenderer.invoke('desktop:print-escpos', payload),
  isNativeDesktop: true,
});
