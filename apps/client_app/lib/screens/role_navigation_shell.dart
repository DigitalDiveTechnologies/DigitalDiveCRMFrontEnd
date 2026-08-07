import 'package:flutter/material.dart';
import '../theme/human_theme.dart';
import '../auth/user_role.dart';
import '../database/local_database.dart';
import '../sync/sync_manager.dart';
import 'pos_billing_tab.dart';
import 'inventory_tab.dart';
import 'ledger_reports_tab.dart';
import 'sync_outbox_tab.dart';

class RoleNavigationShell extends StatefulWidget {
  final LocalDatabase db;
  final SyncManager syncManager;

  const RoleNavigationShell({
    super.key,
    required this.db,
    required this.syncManager,
  });

  @override
  State<RoleNavigationShell> createState() => _RoleNavigationShellState();
}

class _RoleNavigationShellState extends State<RoleNavigationShell> {
  UserRole activeRole = UserRole.OWNER;
  int selectedTabIndex = 0;

  @override
  Widget build(BuildContext context) {
    // Dynamic tab filtering for active role
    final permittedTabs = RolePermissions.getTabsForRole(activeRole);
    if (selectedTabIndex >= permittedTabs.length) {
      selectedTabIndex = 0;
    }
    final activeTabItem = permittedTabs.isNotEmpty ? permittedTabs[selectedTabIndex] : null;

    return Scaffold(
      body: Column(
        children: [
          // Top Navigation Bar
          Container(
            height: 64,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            color: HumanTheme.primaryDarkSlate,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Brand Title & UAE Badge
                const Row(
                  children: [
                    Icon(Icons.account_balance_rounded, color: Colors.white, size: 24),
                    SizedBox(width: 12),
                    Text(
                      '🇦🇪 UAE Desktop POS & Accounting',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),

                Row(
                  children: [
                    // Network Connectivity Toggle (Online / Offline)
                    InkWell(
                      onTap: () {
                        setState(() {
                          widget.syncManager.isOnline = !widget.syncManager.isOnline;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: widget.syncManager.isOnline ? HumanTheme.successGreen.withOpacity(0.2) : HumanTheme.warningAmber.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: widget.syncManager.isOnline ? HumanTheme.successGreen : HumanTheme.warningAmber),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              widget.syncManager.isOnline ? Icons.wifi : Icons.wifi_off,
                              size: 14,
                              color: widget.syncManager.isOnline ? HumanTheme.successGreen : HumanTheme.warningAmber,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              widget.syncManager.isOnline ? 'ONLINE (Sync Active)' : 'OFFLINE MODE (Drift SQLite)',
                              style: TextStyle(
                                color: widget.syncManager.isOnline ? HumanTheme.successGreen : HumanTheme.warningAmber,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),

                    // Role Switcher Dropdown
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<UserRole>(
                          value: activeRole,
                          dropdownColor: HumanTheme.primaryDarkSlate,
                          icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
                          onChanged: (UserRole? newRole) {
                            if (newRole != null) {
                              setState(() {
                                activeRole = newRole;
                                selectedTabIndex = 0;
                              });
                            }
                          },
                          items: UserRole.values.map((role) {
                            return DropdownMenuItem<UserRole>(
                              value: role,
                              child: Text('${RolePermissions.getRoleDisplayName(role)}'),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Main Body: Navigation Sidebar + Active Tab Screen
          Expanded(
            child: Row(
              children: [
                // Role-Filtered Navigation Sidebar
                Container(
                  width: 240,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(right: BorderSide(color: HumanTheme.borderLight)),
                  ),
                  child: Column(
                    children: [
                      // Role Context Header
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        color: HumanTheme.backgroundSlate,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('ACTIVE ROLE PERMISSIONS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: HumanTheme.textMuted, letterSpacing: 0.5)),
                            const SizedBox(height: 4),
                            Text(
                              RolePermissions.getRoleDisplayName(activeRole),
                              style: const TextStyle(fontWeight: FontWeight.bold, color: HumanTheme.primaryIndigo, fontSize: 13),
                            ),
                          ],
                        ),
                      ),

                      // Filtered Navigation Item List
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          itemCount: permittedTabs.length,
                          itemBuilder: (context, index) {
                            final item = permittedTabs[index];
                            final isSelected = selectedTabIndex == index;
                            return Container(
                              margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                color: isSelected ? HumanTheme.primaryIndigo.withOpacity(0.1) : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: ListTile(
                                dense: true,
                                leading: Icon(item.icon, color: isSelected ? HumanTheme.primaryIndigo : HumanTheme.textMuted, size: 20),
                                title: Text(
                                  item.title,
                                  style: TextStyle(
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    color: isSelected ? HumanTheme.primaryIndigo : HumanTheme.textDark,
                                    fontSize: 13,
                                  ),
                                ),
                                selected: isSelected,
                                onTap: () => setState(() => selectedTabIndex = index),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // Active Tab Content View
                Expanded(
                  child: activeTabItem == null
                      ? const Center(child: Text('No navigation tabs permitted for this role.'))
                      : _buildTabContent(activeTabItem.id),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent(String tabId) {
    switch (tabId) {
      case 'pos':
        return PosBillingTab(db: widget.db, syncManager: widget.syncManager);
      case 'inventory':
        return InventoryTab(db: widget.db);
      case 'ledger':
        return const LedgerReportsTab();
      case 'sync':
        return SyncOutboxTab(db: widget.db, syncManager: widget.syncManager);
      default:
        return const Center(child: Text('Screen not found.'));
    }
  }
}
