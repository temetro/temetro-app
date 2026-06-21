import { Button, Column, Host, List, ListItem, Row, Spacer, Text } from '@expo/ui';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWallet } from '@/lib/wallet-context';

const STATUS_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  connected: 'Connecting…',
  authenticated: 'Online',
  'auth-failed': 'Auth failed',
  disconnected: 'Offline',
};

export default function WalletScreen() {
  const { identity, record, status, pendingRequest, approve, deny } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyWallet = async () => {
    if (!identity) return;
    await Clipboard.setStringAsync(identity.walletNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!identity || !record) {
    return (
      <SafeAreaView style={styles.center}>
        <Host matchContents>
          <Text textStyle={{ fontSize: 16 }}>Setting up your wallet…</Text>
        </Host>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Host matchContents>
          <Column spacing={16}>
            <Column spacing={4}>
              <Text textStyle={{ fontSize: 28, fontWeight: '700' }}>
                My wallet
              </Text>
              <Text textStyle={{ fontSize: 14, color: '#8a8a8e' }}>
                {`Relay: ${STATUS_LABEL[status] ?? status}`}
              </Text>
            </Column>

            {/* Wallet number card */}
            <Column
              spacing={8}
              style={{ backgroundColor: '#1c1c1e', borderRadius: 16, padding: 16 }}
            >
              <Text textStyle={{ fontSize: 13, color: '#8a8a8e' }}>
                Wallet number
              </Text>
              <Text textStyle={{ fontSize: 15, fontWeight: '600' }}>
                {identity.walletNumber}
              </Text>
              <Button
                variant="outlined"
                label={copied ? 'Copied' : 'Copy wallet number'}
                onPress={copyWallet}
              />
            </Column>

            {/* Incoming share request */}
            {pendingRequest ? (
              <Column
                spacing={10}
                style={{ backgroundColor: '#0a2540', borderRadius: 16, padding: 16 }}
              >
                <Text textStyle={{ fontSize: 17, fontWeight: '700' }}>
                  Share request
                </Text>
                <Text textStyle={{ fontSize: 14 }}>
                  {`${pendingRequest.clinicName} wants to import your record.`}
                </Text>
                <Text textStyle={{ fontSize: 13, color: '#9bb8d3' }}>
                  {pendingRequest.mode === 'temporary'
                    ? `Temporary — auto-deleted after ${
                        pendingRequest.durationHours ?? 0
                      }h`
                    : 'Permanent share'}
                </Text>
                <Row spacing={10}>
                  <Button
                    variant="filled"
                    label="Approve"
                    onPress={() => approve(pendingRequest)}
                  />
                  <Button
                    variant="outlined"
                    label="Deny"
                    onPress={() => deny(pendingRequest)}
                  />
                </Row>
              </Column>
            ) : null}

            {/* Record summary */}
            <Text textStyle={{ fontSize: 20, fontWeight: '700' }}>
              {record.name}
            </Text>
            <List>
              <ListItem supportingText={`${record.age} · ${record.sex}`}>
                Age · Sex
              </ListItem>
              <ListItem supportingText={record.status}>Status</ListItem>
              <ListItem
                supportingText={
                  record.allergies.map((a) => a.substance).join(', ') || 'None'
                }
              >
                Allergies
              </ListItem>
              <ListItem
                supportingText={
                  record.medications.map((m) => m.name).join(', ') || 'None'
                }
              >
                Medications
              </ListItem>
              <ListItem
                supportingText={
                  record.problems.map((p) => p.label).join(', ') || 'None'
                }
              >
                Problems
              </ListItem>
              <ListItem supportingText={record.encounters[0]?.summary ?? '—'}>
                Last visit
              </ListItem>
            </List>

            <Spacer />
            <Button
              variant="text"
              label="How sharing works"
              onPress={() =>
                Alert.alert(
                  'Your data stays on this device',
                  'Your record is encrypted on your phone. It is only ever shared when you approve a request, and a temporary share is deleted from the clinic automatically.',
                )
              }
            />
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
