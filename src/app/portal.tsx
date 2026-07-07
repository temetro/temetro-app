import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Separator, Spinner, Surface, useThemeColor } from 'heroui-native';
import { CalendarCheck, CheckCircle2, Stethoscope, UserRound } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  bookAppointment,
  getAvailability,
  getClinic,
  getDoctors,
  SLOT_TIMES,
  upcomingDays,
  type Doctor,
  type PortalRef,
} from '@/lib/portal';
import { useWallet } from '@/lib/wallet-context';

// Native Patient Portal, reached by scanning a clinic's portal QR on the Scan
// tab. Lists the clinic's doctors and lets the patient book a conflict-free
// appointment. Availability + booking are server-authoritative (the backend
// returns 409 if a slot was taken in the meantime).
export default function PortalScreen() {
  const insets = useSafeAreaInsets();
  const { record } = useWallet();
  const [accent, muted, foreground, danger] = useThemeColor([
    'accent',
    'muted',
    'foreground',
    'danger',
  ]);

  const params = useLocalSearchParams<{ api?: string; slug?: string }>();
  const ref = useMemo<PortalRef | null>(() => {
    if (!params.api || !params.slug) return null;
    return { api: params.api, slug: params.slug, webUrl: '' };
  }, [params.api, params.slug]);

  const days = useMemo(() => upcomingDays(7), []);
  const [clinic, setClinic] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState<string>(days[0].date);
  const [taken, setTaken] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState<string | null>(null);

  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState<{ date: string; time: string } | null>(null);
  const [bookErr, setBookErr] = useState<string | null>(null);

  // Load clinic name + doctors once.
  useEffect(() => {
    if (!ref) return;
    let active = true;
    Promise.all([getClinic(ref), getDoctors(ref)])
      .then(([c, docs]) => {
        if (!active) return;
        setClinic(c.name);
        setDoctors(docs);
      })
      .catch((e: Error) => active && setLoadErr(e.message));
    return () => {
      active = false;
    };
  }, [ref]);

  // (Re)load the selected doctor's taken slots when doctor or date changes.
  const loadAvailability = useCallback(
    async (d: Doctor, day: string) => {
      if (!ref) return;
      setSlotsLoading(true);
      try {
        const a = await getAvailability(ref, d.name, day);
        setTaken(a.taken);
      } catch {
        setTaken([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [ref],
  );

  useEffect(() => {
    if (doctor) void loadAvailability(doctor, date);
  }, [doctor, date, loadAvailability]);

  const nowHHMM = new Date().toTimeString().slice(0, 5);
  const isToday = date === days[0].date;
  const isTaken = (t: string) => taken.includes(t) || (isToday && t <= nowHHMM);

  const confirm = async () => {
    if (!ref || !doctor || !time || !record) return;
    setBooking(true);
    setBookErr(null);
    try {
      await bookAppointment(ref, {
        demographics: { name: record.name, sex: record.sex, age: record.age },
        provider: doctor.name,
        date,
        time,
      });
      setBooked({ date, time });
    } catch (e) {
      setBookErr((e as Error).message);
      // A 409 means the slot was just taken — refresh so the grid updates.
      void loadAvailability(doctor, date);
      setTime(null);
    } finally {
      setBooking(false);
    }
  };

  if (!ref) {
    return (
      <Centered>
        <Text className="text-center text-base text-muted">Invalid portal link.</Text>
      </Centered>
    );
  }

  if (loadErr) {
    return (
      <Centered>
        <Text className="text-center text-base text-muted">{loadErr}</Text>
      </Centered>
    );
  }

  if (!doctors) {
    return (
      <Centered>
        <Spinner />
      </Centered>
    );
  }

  // Booking confirmed.
  if (booked) {
    return (
      <Centered>
        <CheckCircle2 size={56} color={accent} />
        <Text className="text-center text-2xl font-bold text-foreground">Appointment booked</Text>
        <Text className="text-center text-base text-muted">
          {doctor?.name} · {booked.date} at {booked.time}
        </Text>
      </Centered>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      contentContainerClassName="px-5 pt-4 gap-6">
      <View className="gap-1">
        <Text className="text-sm font-medium text-muted">{clinic}</Text>
        <Text className="text-2xl font-bold text-foreground">Book an appointment</Text>
      </View>

      {/* Doctor picker */}
      <View className="gap-2">
        <Text className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Choose a doctor
        </Text>
        {doctors.length === 0 ? (
          <Text className="px-1 text-sm text-muted">No doctors are available right now.</Text>
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
                    <Text className="text-base font-semibold text-foreground">{d.name}</Text>
                    {d.specialty ? (
                      <View className="mt-0.5 flex-row items-center gap-1">
                        <Stethoscope size={13} color={muted} />
                        <Text className="text-sm text-muted">{d.specialty}</Text>
                      </View>
                    ) : null}
                  </View>
                  {selected ? <CheckCircle2 size={20} color={accent} /> : null}
                </Card>
              </Pressable>
            );
          })
        )}
      </View>

      {/* Date + slots (shown once a doctor is picked) */}
      {doctor ? (
        <View className="gap-4">
          <View className="gap-2">
            <Text className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Choose a day
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 px-0.5">
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
                        borderColor: active ? accent : muted + '55',
                      }}>
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: active ? '#fff' : foreground }}>
                        {d.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View className="gap-2">
            <Text className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Choose a time
            </Text>
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
                    <Pressable
                      key={t}
                      disabled={disabled}
                      onPress={() => setTime(t)}
                      className="active:opacity-80">
                      <View
                        className="rounded-xl px-4 py-2.5"
                        style={{
                          backgroundColor: active ? accent : 'transparent',
                          borderWidth: 1,
                          borderColor: active ? accent : muted + '40',
                          opacity: disabled ? 0.35 : 1,
                        }}>
                        <Text
                          className="text-sm font-medium"
                          style={{
                            color: active ? '#fff' : foreground,
                            textDecorationLine: disabled ? 'line-through' : 'none',
                          }}>
                          {t}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {bookErr ? (
            <Surface variant="secondary" className="rounded-2xl">
              <Text className="text-sm" style={{ color: danger }}>
                {bookErr}
              </Text>
            </Surface>
          ) : null}

          <Button
            variant="primary"
            size="lg"
            isDisabled={!time || booking}
            onPress={confirm}>
            <CalendarCheck size={18} color="#fff" />
            <Button.Label>
              {booking ? 'Booking…' : time ? `Book ${time}` : 'Select a time'}
            </Button.Label>
          </Button>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 items-center justify-center gap-3 bg-background px-10">{children}</View>;
}
