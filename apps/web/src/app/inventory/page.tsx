'use client';

import React, { useState, useEffect } from 'react';
import { Warehouse, ArrowRightLeft, AlertOctagon, Plus, Download, X, Lock, CheckCircle2, Package } from 'lucide-react';
import { can, getActiveUserRole } from '@/lib/permissions';
import { downloadCsv } from '@/lib/exportUtils';
import { api } from '@/lib/apiClient';

interface ItemRecord {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  currentStock: number;
  purchasePrice: number;
  salesPrice: number;
}

interface WarehouseRecord {
  id: string;
  name: string;
  code: string;
}

export default function InventoryPage() {
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [canManage, setCanManage] = useState<boolean>(true);

  const [items, setItems] = useState<ItemRecord[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isLossModalOpen, setIsLossModalOpen] = useState<boolean>(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  
  const [postedSuccess, setPostedSuccess] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>( '');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form states
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [fromWhId, setFromWhId] = useState('');
  const [toWhId, setToWhId] = useState('');
  const [lossReason, setLossReason] = useState('');
  const [adjustedStock, setAdjustedStock] = useState(0);

  // New Item states
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemCost, setNewItemCost] = useState(0);

  useEffect(() => {
    const role = getActiveUserRole();
    setUserRole(role);
    setCanManage(can('INVENTORY_WRITE'));
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const fetchedItems = await api.getItems();
      setItems(fetchedItems || []);

      // Get or seed warehouses
      let fetchedWarehouses = await api.getWarehouses();
      if (!fetchedWarehouses || fetchedWarehouses.length === 0) {
        // Auto-seed default warehouses
        await api.createWarehouse({ name: 'Dubai Central Depot', code: 'WH-01', address: 'Al Quoz, Dubai' });
        await api.createWarehouse({ name: 'Abu Dhabi Mall Depot', code: 'WH-02', address: 'Al Khalidiya, Abu Dhabi' });
        fetchedWarehouses = await api.getWarehouses();
      }
      setWarehouses(fetchedWarehouses || []);
      if (fetchedWarehouses && fetchedWarehouses.length > 0) {
        setFromWhId(fetchedWarehouses[0].id);
        if (fetchedWarehouses.length >= 2) {
          setToWhId(fetchedWarehouses[1].id);
        } else {
          setToWhId(fetchedWarehouses[0].id);
        }
      }

      // Fetch stock movements
      const fetchedMovements = await api.getStockMovements();
      setMovements(fetchedMovements || []);
    } catch (e) {
      console.error('Failed to fetch inventory data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantity <= 0 || !fromWhId || !toWhId || !canManage) return;
    setIsLoading(true);

    try {
      const selectedItem = items.find(i => i.id === selectedItemId);
      await api.transferStock({
        itemId: selectedItemId,
        quantity,
        sourceWarehouseId: fromWhId,
        targetWarehouseId: toWhId,
      });

      setSuccessMsg(`Inter-warehouse stock transfer of ${quantity} units [SKU: ${selectedItem?.sku}] successfully executed.`);
      setPostedSuccess(true);
      setIsTransferModalOpen(false);
      
      // Clear & reload
      setSelectedItemId('');
      setQuantity(1);
      await loadInitialData();

      setTimeout(() => setPostedSuccess(false), 5000);
    } catch (e) {
      console.error(e);
      alert('Error executing stock transfer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWriteOffLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !fromWhId || !canManage) return;
    setIsLoading(true);

    try {
      const selectedItem = items.find(i => i.id === selectedItemId);
      const res = await api.adjustStock({
        itemId: selectedItemId,
        warehouseId: fromWhId,
        adjustedStock, // The target stock amount
        unitCost: selectedItem?.purchasePrice || 0,
        reason: lossReason || 'Stock Damage / Write-off',
      });

      setSuccessMsg(`Stock level adjusted for ${selectedItem?.name}. Posted to GL Journal.`);
      setPostedSuccess(true);
      setIsLossModalOpen(false);

      setSelectedItemId('');
      setLossReason('');
      await loadInitialData();

      setTimeout(() => setPostedSuccess(false), 5000);
    } catch (e) {
      console.error(e);
      alert('Error executing stock write-off.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemSku || !canManage) return;
    setIsLoading(true);

    try {
      await api.createItem({
        name: newItemName,
        sku: newItemSku,
        unitPrice: newItemPrice,
        costPrice: newItemCost,
        stockQuantity: 0,
        vatCategory: 'STANDARD_5',
      });

      setSuccessMsg(`Catalogue item "${newItemName}" successfully created.`);
      setPostedSuccess(true);
      setIsItemModalOpen(false);
      
      // Reset & Reload
      setNewItemName('');
      setNewItemSku('');
      setNewItemPrice(0);
      setNewItemCost(0);
      await loadInitialData();

      setTimeout(() => setPostedSuccess(false), 5000);
    } catch (e) {
      console.error(e);
      alert('Error creating item.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportItems = () => {
    downloadCsv(
      'Warehouse_Stock_Inventory.csv',
      ['Item ID', 'SKU Code', 'Item Name', 'Stock On Hand', 'Purchase Price (AED)', 'Sales Price (AED)'],
      items.map(i => [i.id, i.sku, i.name, i.currentStock, Number(i.purchasePrice).toFixed(2), Number(i.salesPrice).toFixed(2)])
    );
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>Warehouse Inventory & Stock Control</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>
            Multi-warehouse stock transfers, stock adjustment write-offs, and dynamic catalog control
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportItems} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Export Catalogue (CSV)
          </button>

          {canManage ? (
            <>
              <button onClick={() => setIsItemModalOpen(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Add Catalog Item
              </button>
              <button onClick={() => setIsTransferModalOpen(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowRightLeft size={16} /> Inter-Warehouse Transfer
              </button>
              <button onClick={() => setIsLossModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertOctagon size={16} /> Record Stock Damage / Loss
              </button>
            </>
          ) : (
            <span className="badge-status badge-status-amber" style={{ padding: '8px 12px' }}>
              <Lock size={12} /> Read-Only ({userRole})
            </span>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {postedSuccess && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', color: '#047857', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Item Catalogue list */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Active Stock Register</h2>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
        {items.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No catalogue items registered. Create your first item catalog record above.
          </div>
        ) : (
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Item Name</th>
                <th style={{ textAlign: 'right' }}>Purchase Price (WAC)</th>
                <th style={{ textAlign: 'right' }}>Sales Price</th>
                <th style={{ textAlign: 'center' }}>Stock on Hand</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{i.sku}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{i.name}</td>
                  <td style={{ textAlign: 'right' }} className="num-tabular">AED {Number(i.purchasePrice || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }} className="num-tabular">AED {Number(i.salesPrice || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: i.currentStock > 5 ? '#0f172a' : '#ef4444' }} className="num-tabular">
                    {i.currentStock} units
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge-status badge-status-green">ACTIVE</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stock Movements & Damage Logs */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '32px', marginBottom: '12px' }}>Stock Movements & Write-off Audit Log</h2>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', marginBottom: '32px' }}>
        {movements.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No stock movements or adjustments recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Item SKU & Name</th>
                  <th>Warehouse</th>
                  <th>Activity Type</th>
                  <th style={{ textAlign: 'right' }}>Qty Change</th>
                  <th style={{ textAlign: 'right' }}>Cost / Rate</th>
                  <th>Document Ref / Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const qtyVal = Number(m.quantity || 0);
                  const isNegative = qtyVal < 0;
                  return (
                    <tr key={m.id}>
                      <td style={{ color: '#475569', fontSize: '0.8rem' }}>{new Date(m.createdAt).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        <span style={{ fontFamily: 'monospace', color: '#2563eb', marginRight: '6px' }}>{m.item?.sku}</span>
                        {m.item?.name}
                      </td>
                      <td>{m.warehouse?.name || 'Central Depot'}</td>
                      <td>
                        <span className={`badge-status ${
                          m.movementType === 'ADJUSTMENT' ? 'badge-status-red' : 
                          m.movementType === 'TRANSFER' ? 'badge-status-blue' : 
                          m.movementType === 'PURCHASE' ? 'badge-status-green' : 'badge-status-blue'
                        }`}>
                          {m.movementType}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: isNegative ? '#dc2626' : '#16a34a' }} className="num-tabular">
                        {isNegative ? '' : '+'}{qtyVal.toFixed(2)} units
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }} className="num-tabular">
                        AED {Number(m.costPrice || 0).toFixed(2)}
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            {m.sourceDocumentId}
                          </span>
                          <span>{m.movementType === 'ADJUSTMENT' ? 'Physical Stock Adjustment' : m.sourceDocumentType}</span>
                        </div>
                        {m.reason && (
                          <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600, background: '#fffbeb', border: '1px solid #fef3c7', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                            Reason: {m.reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Catalog Item Modal */}
      {isItemModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="#2563eb" /> Add Catalogue Item
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateItem}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POS Thermal Printer"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>SKU Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PRN-80-ESC"
                  value={newItemSku}
                  onChange={(e) => setNewItemSku(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Purchase Cost (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Sales Price (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={18} color="#2563eb" /> Inter-Warehouse Stock Transfer
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Select Stock Item *</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Select Item --</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (SKU: {i.sku}, Stock: {i.currentStock})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Transfer Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>From Source Depot</label>
                  <select
                    value={fromWhId}
                    onChange={(e) => setFromWhId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>To Destination Depot</label>
                  <select
                    value={toWhId}
                    onChange={(e) => setToWhId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loss Modal */}
      {isLossModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertOctagon size={18} color="#dc2626" /> Record Stock Loss Write-off
              </h3>
              <button onClick={() => setIsLossModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWriteOffLoss}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Select Damaged Item *</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    const selected = items.find(i => i.id === e.target.value);
                    setAdjustedStock(selected ? Math.max(0, selected.currentStock - 1) : 0);
                  }}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Select Item --</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (SKU: {i.sku}, Stock: {i.currentStock})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Source Warehouse</label>
                  <select
                    value={fromWhId}
                    onChange={(e) => setFromWhId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>New Actual Stock Level *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adjustedStock}
                    onChange={(e) => setAdjustedStock(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Loss Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Water damage in bay 4"
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsLossModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#dc2626' }}>Write-off Stock Loss</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
