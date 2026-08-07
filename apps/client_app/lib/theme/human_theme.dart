import 'package:flutter/material.dart';

class HumanTheme {
  // Human-curated Color Palette
  static const Color primaryIndigo = Color(0xFF4F46E5); // Vibrant Human Indigo
  static const Color primaryDarkSlate = Color(0xFF0F172A); // Deep Warm Slate
  static const Color backgroundSlate = Color(0xFFF8FAFC); // Soft Off-White Background
  static const Color cardSurface = Colors.white;
  static const Color textDark = Color(0xFF1E293B);
  static const Color textMuted = Color(0xFF64748B);
  static const Color borderLight = Color(0xFFE2E8F0);
  
  // Status Colors
  static const Color successGreen = Color(0xFF059669);
  static const Color warningAmber = Color(0xFFD97706);
  static const Color infoBlue = Color(0xFF0284C7);
  static const Color errorRed = Color(0xFFDC2626);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: backgroundSlate,
      primaryColor: primaryIndigo,
      fontFamily: 'Roboto',
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryIndigo,
        primary: primaryIndigo,
        surface: cardSurface,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryDarkSlate,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryIndigo,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
    );
  }

  // Helper Badge Widget
  static Widget buildBadge(String label, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 11),
          ),
        ],
      ),
    );
  }
}
