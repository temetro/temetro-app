import { Button, Column, Host, List, ListItem, Spacer, Text } from '@expo/ui';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NetworkModal } from '@/components/network-modal';
import { palette } from '@/lib/theme';
import { useWallet } from '@/lib/wallet-context';

// Universal fallback (web). iOS/Android use the platform-specific trees.
export default function IdentityScreen() {
  const { identity, relayUrl, setRelayUrl, reset } = useWallet();
  const [netOpen, setNetOpen] = useState(false);

  if (!identity) {
    return (
      <SafeAreaView style={styles.center}>
        <Host matchContents>
          <Text>Loading…</Text>
        </Host>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Host matchContents>
          <Column spacing={14}>
            <Text textStyle={{ fontSize: 26, fontWeight: '700' }}>Identity</Text>
            <List>
              <ListItem supportingText={identity.walletNumber}>Wallet number</ListItem>
              <ListItem supportingText={identity.fingerprint}>Fingerprint</ListItem>
              <ListItem supportingText="Ed25519">Algorithm</ListItem>
              <ListItem supportingText={relayUrl}>Relay server</ListItem>
            </List>
            <Button variant="outlined" label="Change network" onPress={() => setNetOpen(true)} />
            <Button
              variant="outlined"
              label="Copy fingerprint"
              onPress={async () => {
                await Clipboard.setStringAsync(identity.fingerprint);
                Alert.alert('Copied', 'Fingerprint copied.');
              }}
            />
            <Spacer />
            <Button variant="text" label="Reset wallet" onPress={() => void reset()} />
          </Column>
        </Host>
        <View style={styles.footer} />
      </ScrollView>

      <NetworkModal
        current={relayUrl}
        onClose={() => setNetOpen(false)}
        onSave={(url) => {
          setNetOpen(false);
          void setRelayUrl(url);
        }}
        visible={netOpen}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  footer: { height: 72 },
});
