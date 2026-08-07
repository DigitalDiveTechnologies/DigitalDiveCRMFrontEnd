import 'package:flutter/material.dart';

enum UserRole {
  OWNER,
  ACCOUNTANT,
  BILLER_CASHIER,
  INVENTORY_MANAGER,
  AUDITOR,
}

class NavigationItem {
  final String id;
  final String title;
  final IconData icon;
  final List<UserRole> allowedRoles;

  const NavigationItem({
    required this.id,
    required this.title,
    required this.icon,
    required this.allowedRoles,
  });
}

class RolePermissions {
  static const List<NavigationItem> allNavigationItems = [
    NavigationItem(
      id: 'pos',
      title: 'POS Billing Counter',
      icon: Icons.point_of_sale_rounded,
      allowedRoles: [UserRole.OWNER, UserRole.BILLER_CASHIER],
    ),
    NavigationItem(
      id: 'inventory',
      title: 'Inventory & Stock',
      icon: Icons.inventory_2_rounded,
      allowedRoles: [UserRole.OWNER, UserRole.INVENTORY_MANAGER],
    ),
    NavigationItem(
      id: 'ledger',
      title: 'Ledger & Reports',
      icon: Icons.account_balance_wallet_rounded,
      allowedRoles: [UserRole.OWNER, UserRole.ACCOUNTANT, UserRole.AUDITOR],
    ),
    NavigationItem(
      id: 'sync',
      title: 'Offline Sync & Outbox',
      icon: Icons.sync_rounded,
      allowedRoles: [UserRole.OWNER, UserRole.ACCOUNTANT, UserRole.BILLER_CASHIER, UserRole.INVENTORY_MANAGER],
    ),
  ];

  /// Get list of tabs accessible by a given user role
  static List<NavigationItem> getTabsForRole(UserRole role) {
    return allNavigationItems.where((item) => item.allowedRoles.contains(role)).toList();
  }

  static String getRoleDisplayName(UserRole role) {
    switch (role) {
      case UserRole.OWNER:
        return 'Company Owner';
      case UserRole.ACCOUNTANT:
        return 'Chief Accountant';
      case UserRole.BILLER_CASHIER:
        return 'POS Biller / Cashier';
      case UserRole.INVENTORY_MANAGER:
        return 'Inventory Manager';
      case UserRole.AUDITOR:
        return 'External Auditor';
    }
  }
}
