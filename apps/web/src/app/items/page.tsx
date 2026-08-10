'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Download, X, Lock } from 'lucide-react';
import { can, getActiveUserRole } from '@/lib/permissions';
import { downloadCsv } from '@/lib/exportUtils';
import { api } from '@/lib/apiClient';

interface ItemEntry {
  id: string;
  sku: string;
  name: string;
  category: string;
  vatCategory: 'STANDARD_5' | 'ZERO_0' | 'EXEMPT';
  unitPrice: number;
  stockOnHand: number;
  reorderLevel: number;
}

export default function ItemsPage() {
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [canManage, setCanManage] = useState<boolean>(true);

  // Clean state - 0 dummy data
  const [items, setItems] = useState<ItemEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('General');
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemStock, setNewItemStock] = useState(0);
  const [newItemReorderLevel, setNewItemReorderLevel] = useState(0);
  const [newItemVatCategory, setNewItemVatCategory] = useState<'STANDARD_5' | 'ZERO_0' | 'EXEMPT'>('STANDARD_5');

  // Edit state
  const [editingItem, setEditingItem] = useState<ItemEntry | null>(null);
  const [editItemSku, setEditItemSku] = useState('');
  const [editItemName, setEditItemName] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('General');
  const [editItemPrice, setEditItemPrice] = useState(0);
  const [editItemStock, setEditItemStock] = useState(0);
  const [editItemReorderLevel, setEditItemReorderLevel] = useState(0);
  const [editItemVatCategory, setEditItemVatCategory] = useState<'STANDARD_5' | 'ZERO_0' | 'EXEMPT'>('STANDARD_5');

  const handleOpenEditModal = (item: ItemEntry) => {
    setEditingItem(item);
    setEditItemSku(item.sku);
    setEditItemName(item.name);
    setEditItemCategory(item.category);
    setEditItemPrice(item.unitPrice);
    setEditItemStock(item.stockOnHand);
    setEditItemReorderLevel(item.reorderLevel);
    setEditItemVatCategory(item.vatCategory);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editItemSku || !editItemName || !canManage) return;

    try {
      const updated = await api.updateItem(editingItem.id, {
        sku: editItemSku,
        name: editItemName,
        category: editItemCategory,
        unitPrice: editItemPrice,
        initialStock: editItemStock,
        reorderLevel: editItemReorderLevel,
        vatCategory: editItemVatCategory,
      });

      setItems(items.map(i => i.id === editingItem.id ? {
        id: updated.id,
        sku: updated.sku,
        name: updated.name,
        category: updated.category || 'General',
        vatCategory: updated.vatCategory || 'STANDARD_5',
        unitPrice: Number(updated.salesPrice || 0),
        stockOnHand: Number(updated.currentStock || 0),
        reorderLevel: Number(updated.reorderLevel || 0),
      } : i));

      setEditingItem(null);
    } catch (e) {
      console.error('Failed to update item:', e);
      alert('Error updating item details.');
    }
  };

  useEffect(() => {
    const role = getActiveUserRole();
    setUserRole(role);
    setCanManage(can('MANAGE_ITEMS'));
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await api.getItems();
      const mapped = (data || []).map((i: any) => ({
        id: i.id,
        sku: i.sku,
        name: i.name,
        category: i.category || 'General',
        vatCategory: i.vatCategory || 'STANDARD_5',
        unitPrice: Number(i.salesPrice || 0),
        stockOnHand: Number(i.currentStock || 0),
        reorderLevel: Number(i.reorderLevel || 0),
      }));
      setItems(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemSku || !newItemName || !canManage) return;

    try {
      const saved = await api.createItem({
        sku: newItemSku,
        name: newItemName,
        category: newItemCategory || 'General',
        vatCategory: newItemVatCategory,
        unitPrice: newItemPrice || 0,
        initialStock: newItemStock || 0,
        reorderLevel: newItemReorderLevel || 0,
      });

      const mappedSaved: ItemEntry = {
        id: saved.id,
        sku: saved.sku,
        name: saved.name,
        category: saved.category || 'General',
        vatCategory: saved.vatCategory || 'STANDARD_5',
        unitPrice: Number(saved.salesPrice || 0),
        stockOnHand: Number(saved.currentStock || 0),
        reorderLevel: Number(saved.reorderLevel || 0),
      };

      setItems([mappedSaved, ...items]);
      setIsModalOpen(false);
      setNewItemSku('');
      setNewItemName('');
      setNewItemPrice(0);
      setNewItemStock(0);
      setNewItemReorderLevel(0);
    } catch (e) {
      console.error('Failed to save item:', e);
    }
  };

  const handleExportItems = () => {
    downloadCsv(
      'UAE_Item_Catalogue.csv',
      ['SKU', 'Item Name', 'Category', 'VAT Category', 'Unit Price (AED)', 'Stock On Hand'],
      items.map(i => [i.sku, i.name, i.category, i.vatCategory, i.unitPrice, i.stockOnHand])
    );
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Item Catalogue & Stock Master</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Products, services, SKUs, 5% UAE VAT classifications, and inventory thresholds
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportItems} className="btn-secondary">
            <Download size={14} /> Export Catalogue (CSV)
          </button>
          {canManage ? (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Add Item to Catalogue
            </button>
          ) : (
            <span className="badge-status badge-status-amber" style={{ padding: '8px 12px' }}>
              <Lock size={12} /> Read-Only ({userRole})
            </span>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search SKU or item description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Catalogue Table */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading catalogue list...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No items in catalogue yet. Click "Add Item to Catalogue" to register your first product or service SKU.
          </div>
        ) : (
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Item Description</th>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>VAT Category</th>
                <th style={{ textAlign: 'right' }}>Unit Price (AED)</th>
                <th style={{ textAlign: 'right' }}>Stock On Hand</th>
                <th style={{ textAlign: 'right' }}>Reorder Level</th>
                {canManage && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isLowStock = item.stockOnHand <= item.reorderLevel;
                return (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563eb' }}>{item.sku}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</td>
                    <td><span className="badge-status badge-status-blue">{item.category}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={item.vatCategory === 'STANDARD_5' ? 'badge-status badge-status-blue' : 'badge-status badge-status-green'}>
                        {item.vatCategory === 'STANDARD_5' ? '5%' : '0%'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }} className="num-tabular">
                      AED {item.unitPrice.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: isLowStock ? '#dc2626' : '#0f172a' }} className="num-tabular">
                      {item.stockOnHand} units {isLowStock && <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 4px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', marginLeft: '4px' }}>LOW</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className="num-tabular">
                      {item.reorderLevel} units
                    </td>
                    {canManage && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            color: '#2563eb',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        >
                          Modify Item
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="#2563eb" /> Add Item to Catalogue
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRN-80"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Category</label>
                  <input
                    type="text"
                    placeholder="Hardware / Services"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>UAE VAT Category</label>
                  <select
                    value={newItemVatCategory}
                    onChange={(e) => setNewItemVatCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="STANDARD_5">5% Standard Rate</option>
                    <option value="ZERO_0">0% Zero-Rated</option>
                    <option value="EXEMPT">Exempt</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Selling Price (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Initial Stock</label>
                  <input
                    type="number"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Reorder Level</label>
                  <input
                    type="number"
                    value={newItemReorderLevel}
                    onChange={(e) => setNewItemReorderLevel(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Item Modal */}
      {editingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="#2563eb" /> Modify Catalogue Item
              </h3>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateItem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRN-80"
                    value={editItemSku}
                    onChange={(e) => setEditItemSku(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. POS Thermal Printer"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Category</label>
                  <input
                    type="text"
                    placeholder="Hardware / Services"
                    value={editItemCategory}
                    onChange={(e) => setEditItemCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>UAE VAT Category</label>
                  <select
                    value={editItemVatCategory}
                    onChange={(e) => setEditItemVatCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="STANDARD_5">5% Standard Rate</option>
                    <option value="ZERO_0">0% Zero-Rated</option>
                    <option value="EXEMPT">Exempt</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Price (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editItemPrice}
                    onChange={(e) => setEditItemPrice(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Current Stock</label>
                  <input
                    type="number"
                    value={editItemStock}
                    onChange={(e) => setEditItemStock(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Reorder Level</label>
                  <input
                    type="number"
                    value={editItemReorderLevel}
                    onChange={(e) => setEditItemReorderLevel(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Update Item Details</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
