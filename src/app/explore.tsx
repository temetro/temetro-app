import { Button, Column, Host, List, ListItem, Spacer, Text } from '@expo/ui';
import * as Clipboard from 'expo-clipboard';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWallet } from '@/lib/wallet-context';

export default function IdentityScreen() {
  const { identity, status, reset } = useWallet();

  const confirmReset = () => {
    Alert.alert(
      'Reset wallet?',
      'This permanently deletes your keys and creates a brand-new wallet number. Records already shared with clinics are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => void reset() },
      ],
    );
  };

  if (!identity) {
    return (
      <SafeAreaView style={styles.center}>
        <Host matchContents>
          <Text textStyle={{ fontSize: 16 }}>Loading…</Text>
        </Host>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Host matchContents>
          <Column spacing={16}>
            <Text textStyle={{ fontSize: 28, fontWeight: '700' }}>Identity</Text>
            <Text textStyle={{ fontSize: 14, color: '#8a8a8e' }}>
              Your signing identity lives only on this device. Clinics verify
              shared records against your public key fingerprint.
            </Text>

            <List>
              <ListItem supportingText={identity.walletNumber}>
                Wallet number
              </ListItem>
              <ListItem supportingText={identity.fingerprint}>
                Public key fingerprint
              </ListItem>
              <ListItem supportingText="Ed25519">Algorithm</ListItem>
              <ListItem supportingText={status}>Relay status</ListItem>
            </List>

            <Button
              variant="outlined"
              label="Copy fingerprint"
              onPress={async () => {
                await Clipboard.setStringAsync(identity.fingerprint);
                Alert.alert('Copied', 'Fingerprint copied to clipboard.');
              }}
            />

            <Spacer />
            <Button variant="text" label="Reset wallet" onPress={confirmReset} />
          </Column>
        </Host>
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  footer: { height: 80 },
});
