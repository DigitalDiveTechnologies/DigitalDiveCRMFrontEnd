import 'package:flutter/material.dart';
import 'theme/human_theme.dart';
import 'database/local_database.dart';
import 'sync/sync_manager.dart';
import 'screens/role_navigation_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final localDb = LocalDatabase();
  final syncManager = SyncManager(db: localDb);

  runApp(UaeDesktopPosApp(
    db: localDb,
    syncManager: syncManager,
  ));
}

class UaeDesktopPosApp extends StatelessWidget {
  final LocalDatabase db;
  final SyncManager syncManager;

  const UaeDesktopPosApp({
    super.key,
    required this.db,
    required this.syncManager,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UAE Accounting & POS Desktop App',
      debugShowCheckedModeBanner: false,
      theme: HumanTheme.lightTheme,
      home: RoleNavigationShell(
        db: db,
        syncManager: syncManager,
      ),
    );
  }
}
