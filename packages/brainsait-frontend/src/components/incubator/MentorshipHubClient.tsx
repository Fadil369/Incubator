'use client';

import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Rating,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  BookOnline,
  Campaign,
  Chat,
  CheckCircle,
  Circle,
  EventAvailable,
  People,
  PersonSearch,
  Schedule,
  Send,
} from '@mui/icons-material';
import type {
  CollaborationMessage,
  CollaborationRoom,
  EmailAutomationConfig,
  NotificationHistoryItem,
} from '@/services/collaborationService';
import {
  connectToRoom,
  getChatMessages,
  getChatRooms,
  getEmailAutomations,
  getNotificationHistory,
  saveEmailAutomation,
  sendChatMessage,
  triggerEmailAutomation,
} from '@/services/collaborationService';
import { dispatchIncubatorEvent } from '@/services/incubatorHubService';

interface Mentor {
  id: string;
  name: string;
  title: string;
  organization: string;
  expertise: string[];
  rating: number;
  sessionsCount: number;
  availability: 'available' | 'limited' | 'unavailable';
  bio: string;
  avatarColor: string;
}

interface MentorshipSession {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorTitle: string;
  topic: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

const FALLBACK_MENTORS: Mentor[] = [
  { id: 'm1', name: 'Dr. Amira Al-Hassan', title: 'Chief Medical Officer', organization: 'Saudi Health Innovation Hub', expertise: ['Digital Health Strategy', 'Clinical Informatics', 'Regulatory Affairs'], rating: 4.9, sessionsCount: 142, availability: 'available', bio: 'Pioneer in digital health transformation with 15+ years leading clinical informatics programs across the GCC.', avatarColor: '#1976D2' },
  { id: 'm2', name: 'Khalid Al-Rashidi', title: 'Venture Partner', organization: 'MENA HealthTech Capital', expertise: ['Healthcare VC', 'Business Model Design', 'Go-to-Market Strategy'], rating: 4.8, sessionsCount: 98, availability: 'available', bio: 'Led $120M in HealthTech investments across 40+ MENA startups. Former McKinsey healthcare practice.', avatarColor: '#2E7D32' },
  { id: 'm3', name: 'Dr. Fatima Al-Zahrani', title: 'Director of Digital Transformation', organization: 'Ministry of Health KSA', expertise: ['Health IT Policy', 'NHIS Integration', 'Telemedicine Regulation'], rating: 4.7, sessionsCount: 76, availability: 'limited', bio: "Architect of Saudi Arabia's national health information strategy and Vision 2030 digital health agenda.", avatarColor: '#7B1FA2' },
  { id: 'm4', name: 'Omar Benali', title: 'CTO & Co-founder', organization: 'MedTech Arabia', expertise: ['AI/ML in Healthcare', 'Product Architecture', 'FHIR & HL7'], rating: 4.8, sessionsCount: 113, availability: 'available', bio: 'Built three healthcare SaaS products from zero to profitability. Deep expertise in clinical data standards.', avatarColor: '#E65100' },
  { id: 'm5', name: 'Nora Al-Khatib', title: 'Managing Director', organization: 'KAPSARC Health Innovation', expertise: ['Health Economics', 'Value-based Care', 'Market Access'], rating: 4.6, sessionsCount: 61, availability: 'limited', bio: 'Expert in healthcare economics and reimbursement strategy for medical device and digital health companies.', avatarColor: '#00695C' },
  { id: 'm6', name: 'Dr. Yusuf Hamdan', title: 'Professor of Health Informatics', organization: 'KFSH&RC Research Centre', expertise: ['Clinical AI', 'Research Methodology', 'Ethics & Compliance'], rating: 4.9, sessionsCount: 204, availability: 'available', bio: 'Published 60+ papers in clinical AI. Advises WHO on digital health standards for emerging markets.', avatarColor: '#AD1457' },
];

const FALLBACK_SESSIONS: MentorshipSession[] = [
  { id: 's1', mentorId: 'm1', mentorName: 'Dr. Amira Al-Hassan', mentorTitle: 'Chief Medical Officer', topic: 'Clinical regulatory pathway for AI diagnostic tool', scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(), duration: 60, status: 'scheduled' },
  { id: 's2', mentorId: 'm2', mentorName: 'Khalid Al-Rashidi', mentorTitle: 'Venture Partner', topic: 'Investor pitch refinement — Series A readiness', scheduledAt: new Date(Date.now() - 5 * 86400000).toISOString(), duration: 45, status: 'completed', notes: 'Agreed to refine TAM slide and add clinical KPIs to deck.' },
];

function appendUnique(cur: CollaborationMessage[], inc: CollaborationMessage): CollaborationMessage[] {
  if (cur.some((m) => m.id === inc.id)) return cur;
  return [...cur, inc].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

function availChip(a: Mentor['availability']) {
  if (a === 'available') return { label: 'Available', color: 'success' as const };
  if (a === 'limited') return { label: 'Limited slots', color: 'warning' as const };
  return { label: 'Unavailable', color: 'default' as const };
}

function statusChip(s: MentorshipSession['status']) {
  if (s === 'scheduled') return { label: 'Upcoming', color: 'primary' as const };
  if (s === 'completed') return { label: 'Completed', color: 'success' as const };
  return { label: 'Cancelled', color: 'default' as const };
}

interface ScheduleDialogProps {
  mentor: Mentor | null;
  open: boolean;
  onClose: () => void;
  onBooked: (s: MentorshipSession) => void;
}

function ScheduleDialog({ mentor, open, onClose, onBooked }: ScheduleDialogProps) {
  const [topic, setTopic] = React.useState('');
  const [date, setDate] = React.useState('');
  const [duration, setDuration] = React.useState('60');
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function handleSubmit() {
    if (!mentor || !topic.trim() || !date) return;
    setBusy(true);
    await fetchJson('/api/mentorship-sessions/schedule', null).catch(() => null);
    const session: MentorshipSession = {
      id: `sess-${Date.now()}`,
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorTitle: mentor.title,
      topic: topic.trim(),
      scheduledAt: new Date(date).toISOString(),
      duration: parseInt(duration, 10),
      status: 'scheduled',
      notes: notes.trim() || undefined,
    };
    setBusy(false);
    setTopic(''); setDate(''); setNotes('');
    onBooked(session);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
        Schedule a session
        {mentor && <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.5 }}>with {mentor.name} · {mentor.title}</Typography>}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1.5 }}>
          <TextField label="Session topic" fullWidth required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Regulatory pathway for AI diagnostics" />
          <TextField label="Date & time" type="datetime-local" fullWidth required value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Duration (minutes)" select fullWidth value={duration} onChange={(e) => setDuration(e.target.value)} SelectProps={{ native: true }}>
            {['30', '45', '60', '90'].map((d) => <option key={d} value={d}>{d} min</option>)}
          </TextField>
          <TextField label="Notes / agenda (optional)" fullWidth multiline minRows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!topic.trim() || !date || busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <BookOnline />}>
          Book session
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MentorshipHubClient() {
  const [tab, setTab] = React.useState(0);
  const [mentors, setMentors] = React.useState<Mentor[]>([]);
  const [mentorSearch, setMentorSearch] = React.useState('');
  const [scheduleTarget, setScheduleTarget] = React.useState<Mentor | null>(null);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [sessions, setSessions] = React.useState<MentorshipSession[]>([]);
  const [rooms, setRooms] = React.useState<CollaborationRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = React.useState('');
  const [messages, setMessages] = React.useState<CollaborationMessage[]>([]);
  const [draft, setDraft] = React.useState('');
  const [realtimeConnected, setRealtimeConnected] = React.useState(false);
  const [automations, setAutomations] = React.useState<EmailAutomationConfig[]>([]);
  const [automationDraft, setAutomationDraft] = React.useState({ name: 'Mentor Follow-up Reminder', triggerEvent: 'mentorship.followup', subject: 'BrainSAIT mentor follow-up', recipients: 'founder@brainsait.org, mentor@brainsait.org', templatePreview: 'Reminder with room link, shared course bundle, and open actions.' });
  const [history, setHistory] = React.useState<NotificationHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  React.useEffect(() => {
    Promise.all([
      fetchJson<Mentor[]>('/api/mentors', FALLBACK_MENTORS),
      fetchJson<MentorshipSession[]>('/api/mentorship-sessions', FALLBACK_SESSIONS),
      getChatRooms(),
      getEmailAutomations(),
      getNotificationHistory(),
    ]).then(([mData, sData, rData, aData, hData]) => {
      setMentors(mData);
      setSessions(sData);
      setRooms(rData);
      setAutomations(aData);
      setHistory(hData);
      if (rData[0]) setSelectedRoom(rData[0].id);
    }).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (!selectedRoom) return undefined;
    getChatMessages(selectedRoom).then(setMessages);
    const disconnect = connectToRoom(selectedRoom, {
      onOpen: () => setRealtimeConnected(true),
      onClose: () => setRealtimeConnected(false),
      onError: () => setRealtimeConnected(false),
      onMessage: (msg) => { if (msg.roomId === selectedRoom) setMessages((cur) => appendUnique(cur, msg)); },
    });
    return disconnect;
  }, [selectedRoom]);

  async function handleSendMessage() {
    if (!selectedRoom || !draft.trim()) return;
    const created = await sendChatMessage(selectedRoom, draft.trim());
    setMessages((cur) => appendUnique(cur, created));
    setDraft('');
    await dispatchIncubatorEvent('mentorship.chat.message', { roomId: selectedRoom, messageId: created.id });
  }

  async function handleSaveAutomation() {
    const created = await saveEmailAutomation({ name: automationDraft.name, triggerEvent: automationDraft.triggerEvent, subject: automationDraft.subject, recipients: automationDraft.recipients.split(',').map((r) => r.trim()).filter(Boolean), templatePreview: automationDraft.templatePreview });
    setAutomations((cur) => [created, ...cur]);
    setStatus({ severity: 'success', message: `${created.name} added to automation flow.` });
  }

  async function handleTriggerAutomation(id: string) {
    const result = await triggerEmailAutomation(id, { roomId: selectedRoom, triggerSource: 'mentorship-hub', requestedAt: new Date().toISOString() });
    setStatus({ severity: result.status === 'queued' ? 'success' : 'error', message: result.status === 'queued' ? 'Automation queued for delivery.' : 'Could not queue automation.' });
    setHistory(await getNotificationHistory());
  }

  const filteredMentors = mentors.filter((m) => {
    if (!mentorSearch.trim()) return true;
    const q = mentorSearch.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.expertise.some((e) => e.toLowerCase().includes(q)) || m.organization.toLowerCase().includes(q);
  });

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link underline="hover" color="inherit" href="/">BrainSAIT</Link>
          <Typography color="text.primary">Mentorship Hub</Typography>
        </Breadcrumbs>

        {/* Hero */}
        <Card sx={{ borderRadius: 4, mb: 4, background: 'linear-gradient(135deg, #0f172a 0%, #12263f 60%, #164e63 100%)', color: 'white' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={3}>
              <Box>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.75 }}>
                  <Chip icon={<People sx={{ fontSize: '0.9rem !important' }} />} label={`${mentors.length} expert mentors`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'white' }} />
                  <Chip icon={<Schedule sx={{ fontSize: '0.9rem !important' }} />} label={`${sessions.filter((s) => s.status === 'scheduled').length} upcoming sessions`} size="small" sx={{ bgcolor: 'rgba(46,125,50,0.25)', color: '#b9f6ca' }} />
                  <Chip icon={<Circle sx={{ fontSize: '10px !important' }} />} label={realtimeConnected ? 'Realtime connected' : 'Realtime standby'} size="small" sx={{ bgcolor: realtimeConnected ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.10)', color: 'white' }} />
                </Stack>
                <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mb: 1.5, maxWidth: 600 }}>Expert mentorship for healthcare founders</Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 560 }}>Connect with senior healthcare professionals across strategy, clinical, regulatory, and investment domains.</Typography>
              </Box>
              <Stack direction="row" spacing={4} sx={{ flexShrink: 0 }}>
                {[
                  { label: 'Active mentors', value: mentors.filter((m) => m.availability !== 'unavailable').length },
                  { label: 'Sessions held', value: mentors.reduce((a, m) => a + m.sessionsCount, 0) },
                  { label: 'Avg rating', value: mentors.length ? (mentors.reduce((a, m) => a + m.rating, 0) / mentors.length).toFixed(1) : '—' },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={800} sx={{ color: 'white' }}>{value}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>{label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' } }}>
          <Tab icon={<PersonSearch />} iconPosition="start" label="Find Mentors" />
          <Tab icon={<EventAvailable />} iconPosition="start" label="My Sessions" />
          <Tab icon={<Chat />} iconPosition="start" label="Collaboration" />
          <Tab icon={<Campaign />} iconPosition="start" label="Automations" />
        </Tabs>

        {/* Tab 0 — Find Mentors */}
        {tab === 0 && (
          <Box>
            <TextField placeholder="Search by name, expertise, or organisation…" fullWidth size="small" value={mentorSearch} onChange={(e) => setMentorSearch(e.target.value)} sx={{ mb: 3, maxWidth: 520 }} />
            <Grid container spacing={3}>
              {filteredMentors.map((mentor) => {
                const av = availChip(mentor.availability);
                return (
                  <Grid item xs={12} sm={6} lg={4} key={mentor.id}>
                    <Card sx={{ borderRadius: 3.5, height: '100%', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.10)' } }}>
                      <CardContent sx={{ p: 3, flex: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Avatar sx={{ width: 52, height: 52, bgcolor: mentor.avatarColor, fontSize: '1.1rem', fontWeight: 700, flexShrink: 0 }}>{mentor.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700} noWrap>{mentor.name}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" noWrap>{mentor.title}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" noWrap>{mentor.organization}</Typography>
                          </Box>
                          <Chip label={av.label} color={av.color} size="small" sx={{ flexShrink: 0, fontSize: '0.7rem' }} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{mentor.bio}</Typography>
                        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                          {mentor.expertise.map((e) => <Chip key={e} label={e} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />)}
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Rating value={mentor.rating} precision={0.1} size="small" readOnly />
                          <Typography variant="caption" color="text.secondary">{mentor.rating} · {mentor.sessionsCount} sessions</Typography>
                        </Stack>
                      </CardContent>
                      <CardActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
                        <Button fullWidth variant={mentor.availability === 'unavailable' ? 'outlined' : 'contained'} disabled={mentor.availability === 'unavailable'} startIcon={<BookOnline />} size="small" onClick={() => { setScheduleTarget(mentor); setScheduleOpen(true); }}>
                          {mentor.availability === 'unavailable' ? 'Currently unavailable' : 'Schedule a session'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
              {filteredMentors.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <PersonSearch sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                    <Typography>No mentors match your search.</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Tab 1 — My Sessions */}
        {tab === 1 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>My mentorship sessions</Typography>
              <Button variant="outlined" startIcon={<BookOnline />} size="small" onClick={() => setTab(0)}>Find a mentor</Button>
            </Stack>
            {sessions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                <EventAvailable sx={{ fontSize: 52, mb: 1.5, opacity: 0.35 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>No sessions yet</Typography>
                <Typography variant="body2" sx={{ mb: 2.5 }}>Browse mentors and schedule your first session.</Typography>
                <Button variant="contained" startIcon={<PersonSearch />} onClick={() => setTab(0)}>Browse mentors</Button>
              </Box>
            ) : (
              <Stack spacing={2}>
                {sessions.slice().sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).map((session) => {
                  const st = statusChip(session.status);
                  const dt = new Date(session.scheduledAt);
                  return (
                    <Card key={session.id} sx={{ borderRadius: 3.5 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} gap={2}>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                              <Avatar sx={{ width: 40, height: 40, bgcolor: '#1976D2', fontSize: '0.85rem', fontWeight: 700 }}>{session.mentorName.split(' ').map((p) => p[0]).slice(0, 2).join('')}</Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={700}>{session.mentorName}</Typography>
                                <Typography variant="caption" color="text.secondary">{session.mentorTitle}</Typography>
                              </Box>
                            </Stack>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{session.topic}</Typography>
                            {session.notes && <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>{session.notes}</Typography>}
                            <Typography variant="caption" color="text.secondary">
                              {dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {session.duration} min
                            </Typography>
                          </Box>
                          <Box sx={{ flexShrink: 0 }}>
                            <Chip label={st.label} color={st.color} size="small" icon={session.status === 'completed' ? <CheckCircle sx={{ fontSize: '0.9rem !important' }} /> : undefined} />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}

        {/* Tab 2 — Collaboration */}
        {tab === 2 && (
          <Grid container spacing={4}>
            <Grid item xs={12} lg={4}>
              <Card sx={{ borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>Chat rooms</Typography>
                    <Chip icon={<Circle sx={{ fontSize: '10px !important' }} />} label={realtimeConnected ? 'Live' : 'Standby'} color={realtimeConnected ? 'success' : 'default'} size="small" />
                  </Stack>
                  <List disablePadding>
                    {rooms.map((room) => (
                      <ListItemButton key={room.id} selected={room.id === selectedRoom} onClick={() => setSelectedRoom(room.id)} sx={{ borderRadius: 2, mb: 0.75 }}>
                        <ListItemText primary={room.name} secondary={`${room.topic} · ${room.participants.length} members`} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} secondaryTypographyProps={{ fontSize: '0.75rem' }} />
                        {room.unreadCount > 0 && <Chip size="small" label={room.unreadCount} color="primary" />}
                      </ListItemButton>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={8}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Room conversation</Typography>
                  <Stack spacing={1.5} sx={{ mb: 2.5, maxHeight: 420, overflowY: 'auto' }}>
                    {messages.map((message) => (
                      <Box key={message.id} sx={{ alignSelf: message.direction === 'outgoing' ? 'flex-end' : 'flex-start', maxWidth: '78%', p: 2, borderRadius: 3, bgcolor: message.direction === 'outgoing' ? 'primary.main' : 'background.default', color: message.direction === 'outgoing' ? 'white' : 'text.primary' }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem' }}>{message.senderName[0]}</Avatar>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>{message.senderName}</Typography>
                        </Stack>
                        <Typography variant="body2">{message.message}</Typography>
                        {message.attachmentName && <Button size="small" href={message.attachmentUrl} sx={{ mt: 0.75, color: message.direction === 'outgoing' ? 'white' : 'primary.main' }}>{message.attachmentName}</Button>}
                      </Box>
                    ))}
                    {messages.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No messages yet — start the conversation.</Typography>}
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField fullWidth size="small" label="Send a message" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSendMessage(); } }} />
                    <Button variant="contained" endIcon={<Send />} onClick={() => void handleSendMessage()} disabled={!draft.trim()}>Send</Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 3 — Automations */}
        {tab === 3 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Email automation studio</Typography>
                    <Stack spacing={2}>
                      <TextField label="Automation name" value={automationDraft.name} onChange={(e) => setAutomationDraft((cur) => ({ ...cur, name: e.target.value }))} size="small" fullWidth />
                      <TextField label="Trigger event" value={automationDraft.triggerEvent} onChange={(e) => setAutomationDraft((cur) => ({ ...cur, triggerEvent: e.target.value }))} size="small" fullWidth />
                      <TextField label="Subject" value={automationDraft.subject} onChange={(e) => setAutomationDraft((cur) => ({ ...cur, subject: e.target.value }))} size="small" fullWidth />
                      <TextField label="Recipients (comma-separated)" value={automationDraft.recipients} onChange={(e) => setAutomationDraft((cur) => ({ ...cur, recipients: e.target.value }))} size="small" fullWidth />
                      <TextField label="Template preview" multiline minRows={3} value={automationDraft.templatePreview} onChange={(e) => setAutomationDraft((cur) => ({ ...cur, templatePreview: e.target.value }))} size="small" fullWidth />
                      <Button variant="contained" onClick={() => void handleSaveAutomation()}>Save automation</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Active automations</Typography>
                    <Stack spacing={1.5}>
                      {automations.map((automation) => (
                        <Box key={automation.id} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" fontWeight={700}>{automation.name}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{automation.triggerEvent} · {automation.subject}</Typography>
                          <Button size="small" onClick={() => void handleTriggerAutomation(automation.id)}>Trigger now</Button>
                        </Box>
                      ))}
                      {automations.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No automations yet.</Typography>}
                    </Stack>
                  </CardContent>
                </Card>
                {history.length > 0 && (
                  <Card sx={{ borderRadius: 4, mt: 3 }}>
                    <CardContent sx={{ p: 3.5 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>Recent notification history</Typography>
                      <Stack spacing={1}>
                        {history.slice(0, 5).map((item) => (
                          <Box key={item.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>{item.subject}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.channel} · {item.status}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
            {status && <Alert severity={status.severity} sx={{ mt: 3 }} onClose={() => setStatus(null)}>{status.message}</Alert>}
          </Box>
        )}
      </Box>

      <ScheduleDialog mentor={scheduleTarget} open={scheduleOpen} onClose={() => setScheduleOpen(false)} onBooked={(session) => { setSessions((cur) => [session, ...cur]); setTab(1); setStatus({ severity: 'success', message: `Session with ${session.mentorName} booked successfully.` }); }} />

      {status && tab !== 3 && (
        <Box sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1400, minWidth: 320 }}>
          <Alert severity={status.severity} onClose={() => setStatus(null)} sx={{ borderRadius: 2.5, boxShadow: 4 }}>{status.message}</Alert>
        </Box>
      )}
    </Container>
  );
}
