import { useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  Input,
  Spinner,
  Surface,
  TextField,
  Typography,
  useThemeColor,
} from 'heroui-native';
import {
  CalendarCheck,
  CheckCircle2,
  Download,
  FileText,
  Link2,
  Stethoscope,
  UserRound,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
          Invalid portal link.
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
            ? 'Patient Portal'
            : mode === 'link'
              ? 'Link your wallet'
              : mode === 'book'
                ? 'Book an appointment'
                : 'Your results'}
        </Typography>
      </View>

      {mode === 'menu' ? (
        <MenuView onPick={setMode} accent={accent} muted={muted} />
      ) : mode === 'link' ? (
        <LinkView session={session} danger={danger} onDone={() => setMode('menu')} />
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
  const items: { mode: Mode; icon: typeof Link2; title: string; desc: string }[] = [
    { mode: 'link', icon: Link2, title: 'Link your wallet', desc: 'Connect this wallet to your file at the clinic.' },
    { mode: 'book', icon: CalendarCheck, title: 'Book an appointment', desc: 'Pick a doctor and a free time slot.' },
    { mode: 'results', icon: FileText, title: 'View results', desc: 'See upcoming visits and download lab files.' },
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
  danger,
  onDone,
}: {
  session: PortalSession;
  danger: string;
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [fileNumber, setFileNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (busy || !name.trim() || !fileNumber.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await session.request('link', { name: name.trim(), fileNumber: fileNumber.trim() });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <View className="items-center gap-4 py-8">
        <CheckCircle2 size={52} color="#22C55E" />
        <Typography type="h4" className="font-bold text-foreground">
          Wallet linked
        </Typography>
        <Typography type="body-sm" color="muted" align="center">
          You can now book appointments and view your results here.
        </Typography>
        <Button variant="secondary" onPress={onDone}>
          <Button.Label>Back</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Typography type="body-sm" color="muted">
        Enter the name and file number the clinic has on record to link this wallet.
      </Typography>
      <TextField>
        <Input placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
      </TextField>
      <TextField>
        <Input placeholder="File number" value={fileNumber} onChangeText={setFileNumber} autoCapitalize="none" />
      </TextField>
      {error ? (
        <Typography type="body-sm" style={{ color: danger }}>
          {error}
        </Typography>
      ) : null}
      <Button size="lg" isDisabled={busy || !name.trim() || !fileNumber.trim()} onPress={submit}>
        <Link2 size={18} color="#fff" />
        <Button.Label>{busy ? 'Linking…' : 'Link wallet'}</Button.Label>
      </Button>
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
          Appointment booked
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
        Choose a doctor
      </Typography>
      {doctors.length === 0 ? (
        <Typography type="body-sm" color="muted" className="px-1">
          No doctors are available right now.
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
            Choose a day
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
            Choose a time
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
            <Button.Label>{busy ? 'Booking…' : time ? `Book ${time}` : 'Select a time'}</Button.Label>
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
      Alert.alert('Downloaded', `Saved "${saved.name}" to your device.`);
    } catch (e) {
      Alert.alert('Download failed', (e as Error).message);
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
          Upcoming visits
        </Typography>
        {data.upcoming.length === 0 ? (
          <Typography type="body-sm" color="muted" className="px-1">
            No upcoming visits.
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
          Lab files
        </Typography>
        {data.files.length === 0 ? (
          <Typography type="body-sm" color="muted" className="px-1">
            No files on record.
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
