import { useColorScheme } from 'react-native';

export const Colors = {
  light: {
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#212529',
    textSecondary: '#6c757d',
    border: '#e9ecef',
    primary: '#007bff',
    success: '#28a745',
    successBg: '#d4edda',
    successText: '#155724',
    warning: '#ffc107',
    warningBg: '#fff3cd',
    warningText: '#856404',
    danger: '#dc3545',
    dangerBg: '#f8d7da',
    dangerText: '#721c24',
    cardGradientStart: '#6a0dad',
    cardGradientText: '#e0c3fc',
    walletCardBg: '#ffcc00',
    walletCardText: '#000000',
    leaderboardTopBg: '#fffdeb',
    leaderboardTopBorder: '#f1c40f',
    feedBg: '#f0f2f5',
    inputBg: '#f5f5f5',
  },
  dark: {
    background: '#121212',
    surface: '#1e1e1e',
    text: '#f8f9fa',
    textSecondary: '#a1a1a6',
    border: '#2c2c2e',
    primary: '#3897f0',
    success: '#32d74b',
    successBg: '#1c2d24',
    successText: '#32d74b',
    warning: '#ffd60a',
    warningBg: '#2d250c',
    warningText: '#ffd60a',
    danger: '#ff453a',
    dangerBg: '#3d1c1a',
    dangerText: '#ff453a',
    cardGradientStart: '#3a0066',
    cardGradientText: '#b388ff',
    walletCardBg: '#cca300',
    walletCardText: '#ffffff',
    leaderboardTopBg: '#2d2a1c',
    leaderboardTopBorder: '#d4af37',
    feedBg: '#181818',
    inputBg: '#2c2c2e',
  },
};

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  return { colors, isDark };
}
