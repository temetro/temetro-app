import { useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  Spinner,
  Surface,
  Typography,
  useThemeColor,
} from 'heroui-native';
import {
  CalendarCheck,
  CheckCircle2,
  Download,
  FileText,
  Link2,
  RefreshCw,
  Stethoscope,
  UserRound,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type Availability,
  type Doctor,
  openPortalSession,
  type PortalResults,
  type PortalSession,
  type PortalTarget,
  type ResultFile,
  saveResultFile,
  SLOT_TIMES,
  upcomingDays,
} from '@/lib/portal';
import { useWallet } from '@/lib/wallet-context';

type Mode = 'menu' | 'link' | 'book' | 'results';

// Native Patient Portal reached by scanning a clinic's `temetro-portal:` QR.
// Everything runs over the Temetro Network relay (see lib/portal.ts): link the
// wallet to a clinic file, book a conflict-checked appointment, or view and
// download results — all syncing back to the clinic's web app.
export default function PortalScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { identity } = useWallet();
  const [accent, muted, danger] = useThemeColor(['accent', 'muted', 'danger']);

  const params = useLocalSearchParams<{ relay?: string; clinic?: string; slug?: string }>();
  const target = useMemo<PortalTarget | null>(() => {
    if (!params.relay || !params.clinic) return null;
    return { relay: params.relay, clinic: params.clinic, slug: params.slug ?? '' };
  }, [params.relay, params.clinic, params.slug]);

  const [session, setSession] = useState<PortalSession | null>(null);
  const [clinicName, setClinicName] = useState('');
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('menu');

  useEffect(() => {
    if (!target || !identity) return;
    const s = openPortalSession(target, identity);
    setSession(s);
    s.request<{ name: string }>('clinic')
      .then((c) => setClinicName(c.name))
      .catch((e: Error) => setLoadErr(e.message));
    return () => s.close();
  }, [target, identity]);

  if (!target) {
    return (
      <Centered>
        <Typography type="body" color="muted" align="center">
          {t('portal.invalidLink')}
        </Typography>
      </Centered>
    );
  }

  if (loadErr) {
    return (
      <Centered>
        <Typography type="body" color="muted" align="center">
          {loadErr}
        </Typography>
      </Centered>
    );
  }

  if (!session || !clinicName) {
    return (
      <Centered>
        <Spinner />
      </Centered>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      contentContainerClassName="px-5 pt-4 gap-6">
      <View className="gap-1">
        <Typography type="body-sm" className="font-medium text-muted">
          {clinicName}
        </Typography>
        <Typography type="h3" className="font-bold text-foreground">
          {mode === 'menu'
            ? t('portal.titleMenu')
            : mode === 'link'
              ? t('portal.titleLink')
              : mode === 'book'
                ? t('portal.titleBook')
                : t('portal.titleResults')}
        </Typography>
      </View>

      {mode === 'menu' ? (
        <MenuView onPick={setMode} accent={accent} muted={muted} />
      ) : mode === 'link' ? (
        <LinkView session={session} accent={accent} onDone={() => setMode('menu')} />
      ) : mode === 'book' ? (
        <BookView
          session={session}
          accent={accent}
          muted={muted}
          danger={danger}
          onNeedsLink={() => setMode('link')}
        />
      ) : (
        <ResultsView session={session} accent={accent} muted={muted} onNeedsLink={() => setMode('link')} />
      )}
    </ScrollView>
  );
}

function MenuView({
  onPick,
  accent,
  muted,
}: {
  onPick: (m: Mode) => void;
  accent: string;
  muted: string;
}) {
  const { t } = useTranslation();
  const items: { mode: Mode; icon: typeof Link2; title: string; desc: string }[] = [
    { mode: 'link', icon: Link2, title: t('portal.menu.linkTitle'), desc: t('portal.menu.linkDesc') },
    { mode: 'book', icon: CalendarCheck, title: t('portal.menu.bookTitle'), desc: t('portal.menu.bookDesc') },
    { mode: 'results', icon: FileText, title: t('portal.menu.resultsTitle'), desc: t('portal.menu.resultsDesc') },
  ];
  return (
    <View className="gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Pressable key={it.mode} onPress={() => onPick(it.mode)} className="active:opacity-80">
            <Card className="flex-row items-center gap-4">
              <View className="size-11 items-center justify-center rounded-2xl bg-accent/12">
                <Icon size={20} color={accent} />
              </View>
              <View className="flex-1 gap-0.5">
                <Typography type="body" className="font-semibold text-foreground">
                  {it.title}
                </Typography>
                <Typography type="body-xs" color="muted">
                  {it.desc}
                </Typography>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

function LinkView({
  session,
  accent,
  onDone,
}: {
  session: PortalSession;
  accent: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  // The wallet is identified by its cryptographic identity (carried by the
  // signed relay session), so there's nothing to type: we just ask the clinic
  // whether this wallet is already paired to a file. The clinic attaches the
  // wallet number ahead of time via "Import from a patient app" / QR pairing.
  const [status, setStatus] = useState<'checking' | 'linked' | 'error'>('checking');
  const [linkedName, setLinkedName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const attempt = useCallback(async () => {
    setStatus('checking');
    setError(null);
    try {
      const res = await session.request<{ fileNumber: string; name: string }>('link');
      setLinkedName(res.name);
      setStatus('linked');
    } catch (e) {
      setError((e as Error).message);
      setStatus('error');
    }
  }, [session]);

  useEffect(() => {
    void attempt();
  }, [attempt]);

  if (status === 'checking') {
    return (
      <View className="items-center gap-4 py-12">
        <Spinner />
        <Typography type="body-sm" color="muted" align="center">
          {t('portal.checkingLink')}
        </Typography>
      </View>
    );
  }

  if (status === 'linked') {
    return (
      <View className="items-center gap-4 py-8">
        <CheckCircle2 size={52} color="#22C55E" />
        <Typography type="h4" className="font-bold text-foreground">
          {t('portal.linkedTitle')}
        </Typography>
        <Typography type="body-sm" color="muted" align="center">
          {linkedName
            ? t('portal.linkedNamed', { name: linkedName })
            : t('portal.linkedGeneric')}
        </Typography>
        <Button variant="secondary" onPress={onDone}>
          <Button.Label>{t('portal.back')}</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <View className="items-center gap-4 py-8">
      <View className="size-16 items-center justify-center rounded-full bg-accent/12">
        <Link2 size={28} color={accent} />
      </View>
      <View className="items-center gap-1.5">
        <Typography type="h4" className="font-bold text-foreground">
          {t('portal.notLinkedTitle')}
        </Typography>
        <Typography type="body-sm" color="muted" align="center">
          {error ?? t('portal.notLinkedBody')}
        </Typography>
      </View>
      <View className="w-full gap-2 pt-2">
        <Button size="lg" onPress={attempt}>
          <RefreshCw size={18} color="#fff" />
          <Button.Label>{t('portal.tryAgain')}</Button.Label>
        </Button>
        <Button variant="secondary" onPress={onDone}>
          <Button.Label>{t('portal.back')}</Button.Label>
        </Button>
      </View>
    </View>
  );
}

function BookView({
  session,
  accent,
  muted,
  danger,
  onNeedsLink,
}: {
  session: PortalSession;
  accent: string;
  muted: string;
  danger: string;
  onNeedsLink: () => void;
}) {
  const { t } = useTranslation();
  const days = useMemo(() => upcomingDays(7), []);
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState(days[0].date);
  const [taken, setTaken] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<{ date: string; time: string } | null>(null);
  const foreground = useThemeColor('foreground');

  useEffect(() => {
    session
      .request<Doctor[]>('doctors')
      .then(setDoctors)
      .catch((e: Error) => setError(e.message));
  }, [session]);

  const loadAvailability = useCallback(
    async (d: Doctor, day: string) => {
      setSlotsLoading(true);
      try {
        const a = await session.request<Availability>('availability', { provider: d.name, date: day });
        setTaken(a.taken);
      } catch {
        setTaken([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [session],
  );

  useEffect(() => {
    if (doctor) void loadAvailability(doctor, date);
  }, [doctor, date, loadAvailability]);

  const nowHHMM = new Date().toTimeString().slice(0, 5);
  const isToday = date === days[0].date;
  const isTaken = (t: string) => taken.includes(t) || (isToday && t <= nowHHMM);

  const confirm = async () => {
    if (!doctor || !time) return;
    setBusy(true);
    setError(null);
    try {
      await session.request<unknown>('book', { provider: doctor.name, date, time });
      setBooked({ date, time });
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      if (/link/i.test(msg)) onNeedsLink();
      if (doctor) void loadAvailability(doctor, date);
      setTime(null);
    } finally {
      setBusy(false);
    }
  };

  if (booked) {
    return (
      <View className="items-center gap-3 py-8">
        <CheckCircle2 size={52} color={accent} />
        <Typography type="h4" className="font-bold text-foreground">
          {t('portal.bookedTitle')}
        </Typography>
        <Typography type="body-sm" color="muted" align="center">
          {doctor?.name} · {booked.date} at {booked.time}
        </Typography>
      </View>
    );
  }

  if (!doctors) {
    return (
      <View className="items-center py-8">
        <Spinner />
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Typography type="body-xs" className="px-1 font-semibold uppercase tracking-wide text-muted">
        {t('portal.chooseDoctor')}
      </Typography>
      {doctors.length === 0 ? (
        <Typography type="body-sm" color="muted" className="px-1">
          {t('portal.noDoctors')}
        </Typography>
      ) : (
        doctors.map((d) => {
          const selected = doctor?.name === d.name;
          return (
            <Pressable
              key={d.name}
              onPress={() => {
                setDoctor(d);
                setTime(null);
              }}
              className="active:opacity-80">
              <Card
                className="flex-row items-center gap-3"
                style={selected ? { borderColor: accent, borderWidth: 1.5 } : undefined}>
                <View className="size-11 items-center justify-center rounded-full bg-accent/15">
                  <UserRound size={20} color={accent} />
                </View>
                <View className="flex-1">
                  <Typography type="body" className="font-semibold text-foreground">
                    {d.name}
                  </Typography>
                  {d.specialty ? (
                    <View className="mt-0.5 flex-row items-center gap-1">
                      <Stethoscope size={13} color={muted} />
                      <Typography type="body-sm" color="muted">
                        {d.specialty}
                      </Typography>
                    </View>
                  ) : null}
                </View>
                {selected ? <CheckCircle2 size={20} color={accent} /> : null}
              </Card>
            </Pressable>
          );
        })
      )}

      {doctor ? (
        <View className="gap-4">
          <Typography type="body-xs" className="px-1 font-semibold uppercase tracking-wide text-muted">
            {t('portal.chooseDay')}
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-0.5">
            {days.map((d) => {
              const active = d.date === date;
              return (
                <Pressable
                  key={d.date}
                  onPress={() => {
                    setDate(d.date);
                    setTime(null);
                  }}
                  className="active:opacity-80">
                  <View
                    className="rounded-2xl px-4 py-2.5"
                    style={{
                      backgroundColor: active ? accent : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? accent : `${muted}55`,
                    }}>
                    <Typography type="body-sm" className="font-semibold" style={{ color: active ? '#fff' : foreground }}>
                      {d.label}
                    </Typography>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <Typography type="body-xs" className="px-1 font-semibold uppercase tracking-wide text-muted">
            {t('portal.chooseTime')}
          </Typography>
          {slotsLoading ? (
            <View className="items-center py-6">
              <Spinner />
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {SLOT_TIMES.map((t) => {
                const disabled = isTaken(t);
                const active = time === t;
                return (
                  <Pressable key={t} disabled={disabled} onPress={() => setTime(t)} className="active:opacity-80">
                    <View
                      className="rounded-xl px-4 py-2.5"
                      style={{
                        backgroundColor: active ? accent : 'transparent',
                        borderWidth: 1,
                        borderColor: active ? accent : `${muted}40`,
                        opacity: disabled ? 0.35 : 1,
                      }}>
                      <Typography
                        type="body-sm"
                        className="font-medium"
                        style={{
                          color: active ? '#fff' : foreground,
                          textDecorationLine: disabled ? 'line-through' : 'none',
                        }}>
                        {t}
                      </Typography>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {error ? (
            <Surface variant="secondary" className="rounded-2xl">
              <Typography type="body-sm" style={{ color: danger }}>
                {error}
              </Typography>
            </Surface>
          ) : null}

          <Button variant="primary" size="lg" isDisabled={!time || busy} onPress={confirm}>
            <CalendarCheck size={18} color="#fff" />
            <Button.Label>
              {busy
                ? t('portal.booking')
                : time
                  ? t('portal.bookTime', { time })
                  : t('portal.selectTime')}
            </Button.Label>
          </Button>
        </View>
      ) : null}
    </View>
  );
}

function ResultsView({
  session,
  accent,
  muted,
  onNeedsLink,
}: {
  session: PortalSession;
  accent: string;
  muted: string;
  onNeedsLink: () => void;
}) {
  const { t } = useTranslation();
  const [data, setData] = useState<PortalResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    session
      .request<PortalResults>('results')
      .then(setData)
      .catch((e: Error) => {
        setError(e.message);
        if (/link/i.test(e.message)) onNeedsLink();
      });
  }, [session, onNeedsLink]);

  const download = async (id: string, filename: string) => {
    setDownloading(id);
    try {
      const file = await session.request<ResultFile>('result-file', { id });
      const saved = saveResultFile(file.filename || filename, file.base64);
      Alert.alert(t('portal.downloadedTitle'), t('portal.downloadedBody', { name: saved.name }));
    } catch (e) {
      Alert.alert(t('portal.downloadFailed'), (e as Error).message);
    } finally {
      setDownloading(null);
    }
  };

  if (error && !data) {
    return (
      <Typography type="body-sm" color="muted" align="center" className="py-8">
        {error}
      </Typography>
    );
  }
  if (!data) {
    return (
      <View className="items-center py-8">
        <Spinner />
      </View>
    );
  }

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Typography type="body-xs" className="px-1 font-semibold uppercase tracking-wide text-muted">
          {t('portal.upcomingVisits')}
        </Typography>
        {data.upcoming.length === 0 ? (
          <Typography type="body-sm" color="muted" className="px-1">
            {t('portal.noUpcoming')}
          </Typography>
        ) : (
          data.upcoming.map((a) => (
            <Card key={`${a.date}-${a.time}`} className="flex-row items-center justify-between gap-3">
              <Typography type="body-sm" className="font-medium text-foreground">
                {a.date} · {a.time}
              </Typography>
              <Typography type="body-sm" color="muted">
                {[a.type, a.provider].filter(Boolean).join(' · ')}
              </Typography>
            </Card>
          ))
        )}
      </View>

      <View className="gap-2">
        <Typography type="body-xs" className="px-1 font-semibold uppercase tracking-wide text-muted">
          {t('portal.labFiles')}
        </Typography>
        {data.files.length === 0 ? (
          <Typography type="body-sm" color="muted" className="px-1">
            {t('portal.noFiles')}
          </Typography>
        ) : (
          data.files.map((f) => (
            <Card key={f.id} className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-2xl bg-accent/12">
                <FileText size={18} color={accent} />
              </View>
              <View className="flex-1">
                <Typography type="body-sm" className="font-medium text-foreground" numberOfLines={1}>
                  {f.filename}
                </Typography>
                <Typography type="body-xs" color="muted">
                  {Math.max(1, Math.round(f.sizeBytes / 1024))} KB
                </Typography>
              </View>
              <Pressable
                onPress={() => download(f.id, f.filename)}
                disabled={downloading === f.id}
                className="size-9 items-center justify-center rounded-full bg-surface active:opacity-70">
                {downloading === f.id ? <Spinner /> : <Download size={18} color={muted} />}
              </Pressable>
            </Card>
          ))
        )}
      </View>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 items-center justify-center gap-3 bg-background px-10">{children}</View>;
}
