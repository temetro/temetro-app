import { Image } from 'expo-image';
import {
  BottomSheet,
  Button,
  Card,
  Chip,
  Spinner,
  Typography,
} from 'heroui-native';
import { FileText, ImageIcon, InboxIcon } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { SheetHeader, SheetRows } from '@/components/sheet/sheet-parts';
import {
  DocumentError,
  fetchDocBytes,
  isCached,
  isImage,
  openDocExternally,
} from '@/lib/documents';
import { formatDate } from '@/lib/format';
import type { WalletDocument } from '@/lib/types';
import { useWallet } from '@/lib/wallet-context';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { record, reloadRecord, identity } = useWallet();
  const [active, setActive] = useState<WalletDocument | null>(null);

  const documents = record?.documents ?? [];

  if (documents.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-10">
        <InboxIcon color="#9aa0a6" size={40} />
        <Typography className="text-center text-base text-muted">
          {t('documentsScreen.empty')}
        </Typography>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <RefreshableScrollView
        contentContainerClassName="px-5 pt-4 gap-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        onRefresh={reloadRecord}
        showsVerticalScrollIndicator={false}
      >
        {documents.map((doc) => (
          <Pressable
            className="active:opacity-80"
            key={doc.id}
            onPress={() => setActive(doc)}
          >
            <Card className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-xl bg-accent/12">
                {isImage(doc) ? (
                  <ImageIcon color="#9aa0a6" size={18} />
                ) : (
                  <FileText color="#9aa0a6" size={18} />
                )}
              </View>
              <View className="flex-1 gap-1">
                <Typography
                  className="text-base font-semibold text-foreground"
                  numberOfLines={1}
                >
                  {doc.filename}
                </Typography>
                <View className="flex-row items-center gap-2">
                  <Typography className="text-sm text-muted">
                    {formatSize(doc.sizeBytes)}
                  </Typography>
                  <Chip
                    color={doc.source === 'patient' ? 'accent' : 'default'}
                    size="sm"
                    variant="soft"
                  >
                    <Chip.Label>
                      {doc.source === 'patient'
                        ? t('documentsScreen.addedByYou')
                        : t('documentsScreen.addedByClinic')}
                    </Chip.Label>
                  </Chip>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </RefreshableScrollView>

      <BottomSheet
        isOpen={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            {active && identity ? (
              <DocumentSheet doc={active} localKey={identity.localKey} />
            ) : null}
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
}

type ViewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'image'; base64: string }
  | { kind: 'error'; message: string };

function DocumentSheet({ doc }: { doc: WalletDocument; localKey: string }) {
  const { t } = useTranslation();
  const { identity } = useWallet();
  const [state, setState] = useState<ViewState>({ kind: 'idle' });

  const rows = [
    { label: t('documentsScreen.type'), value: doc.mimeType },
    { label: t('documentsScreen.size'), value: formatSize(doc.sizeBytes) },
    { label: t('documentsScreen.added'), value: formatDate(doc.createdAt) },
    {
      label: t('documentsScreen.addedBy'),
      value:
        doc.source === 'patient'
          ? t('documentsScreen.addedByYou')
          : t('documentsScreen.addedByClinic'),
    },
  ];

  const open = async () => {
    if (!identity) return;
    setState({ kind: 'loading' });
    try {
      const base64 = await fetchDocBytes(identity, doc);
      if (isImage(doc)) {
        // Images render inline; anything else goes to the OS viewer.
        setState({ kind: 'image', base64 });
        return;
      }
      await openDocExternally(doc, base64);
      setState({ kind: 'idle' });
    } catch (err) {
      const code = err instanceof DocumentError ? err.message : 'failed';
      setState({ kind: 'error', message: t(`documentsScreen.errors.${code}`) });
    }
  };

  return (
    <View className="gap-5 pt-1">
      <SheetHeader
        subtitle={doc.mimeType}
        title={doc.filename}
      />

      {state.kind === 'image' ? (
        <Image
          contentFit="contain"
          source={{ uri: `data:${doc.mimeType};base64,${state.base64}` }}
          style={{ width: '100%', height: 320, borderRadius: 16 }}
        />
      ) : (
        <SheetRows rows={rows} />
      )}

      {state.kind === 'error' ? (
        <Typography className="text-sm text-danger">{state.message}</Typography>
      ) : null}

      {state.kind !== 'image' ? (
        <Button
          isDisabled={state.kind === 'loading'}
          onPress={open}
          size="lg"
          variant="primary"
        >
          {state.kind === 'loading' ? <Spinner /> : null}
          <Button.Label>
            {state.kind === 'loading'
              ? t('documentsScreen.opening')
              : isCached(doc)
                ? t('documentsScreen.open')
                : t('documentsScreen.download')}
          </Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
