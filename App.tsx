import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/hooks/useAuth';
import { WalletProvider } from './src/contexts/WalletContext';
import { AppNavigator } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WalletProvider>
          <AppNavigator />
        </WalletProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
