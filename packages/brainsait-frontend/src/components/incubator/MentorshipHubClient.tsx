'use client';

import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AutoAwesome, Campaign, Chat, Circle, Hub, Send } from '@mui/icons-material';
import type { CollaborationMessage, CollaborationRoom, EmailAutomationConfig, NotificationHistoryItem } from '@/services/collaborationService';
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

function appendUniqueMessage(current: CollaborationMessage[], incoming: CollaborationMessage): CollaborationMessage[] {
  if (current.some((message) => message.id === incoming.id)) {
    return current;
  }

  return [...current, incoming].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export default function MentorshipHubClient() {
  const [rooms, setRooms] = React.useState<CollaborationRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = React.useState<string>('');
  const [messages, setMessages] = React.useState<CollaborationMessage[]>([]);
  const [automations, setAutomations] = React.useState<EmailAutomationConfig[]>([]);
  const [history, setHistory] = React.useState<NotificationHistoryItem[]>([]);
  const [draft, setDraft] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<{ severity: 'success' | 'error'; message: string } | null>(null);
  const [realtimeConnected, setRealtimeConnected] = React.useState(false);
  const [automationDraft, setAutomationDraft] = React.useState({
    name: 'Mentor Follow-up Reminder',
    triggerEvent: 'mentorship.followup',
    subject: 'BrainSAIT mentor follow-up',
    recipients: 'founder@brainsait.org, mentor@brainsait.org',
    templatePreview: 'Reminder with room link, shared course bundle, and open actions.',
  });

  React.useEffect(() => {
    Promise.all([getChatRooms(), getEmailAutomations(), getNotificationHistory()])
      .then(([roomData, automationData, historyData]) => {
        setRooms(roomData);
        setAutomations(automationData);
        setHistory(historyData);
        if (roomData[0]) setSelectedRoom(roomData[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (!selectedRoom) return undefined;

    getChatMessages(selectedRoom).then(setMessages);
    const disconnect = connectToRoom(selectedRoom, {
      onOpen: () => setRealtimeConnected(true),
      onClose: () => setRealtimeConnected(false),
      onError: () => setRealtimeConnected(false),
      onMessage: (message) => {
        if (message.roomId === selectedRoom) {
          setMessages((current) => appendUniqueMessage(current, message));
        }
      },
    });

    return disconnect;
  }, [selectedRoom]);

  async function handleSendMessage() {
    if (!selectedRoom || !draft.trim()) return;
    const created = await sendChatMessage(selectedRoom, draft.trim());
    setMessages((current) => appendUniqueMessage(current, created));
    setDraft('');
    await dispatchIncubatorEvent('mentorship.chat.message', {
      roomId: selectedRoom,
      messageId: created.id,
    });
  }

  async function handleSaveAutomation() {
    const created = await saveEmailAutomation({
      name: automationDraft.name,
      triggerEvent: automationDraft.triggerEvent,
      subject: automationDraft.subject,
      recipients: automationDraft.recipients.split(',').map((item) => item.trim()).filter(Boolean),
      templatePreview: automationDraft.templatePreview,
    });
    setAutomations((current) => [created, ...current]);
    setStatus({ severity: 'success', message: `${created.name} was added to the email automation flow.` });
  }

  async function handleTriggerAutomation(id: string) {
    const result = await triggerEmailAutomation(id, {
      roomId: selectedRoom,
      triggerSource: 'mentorship-hub',
      requestedAt: new Date().toISOString(),
    });
    setStatus({
      severity: result.status === 'queued' ? 'success' : 'error',
      message: result.status === 'queued' ? 'Automation queued for delivery.' : 'Automation could not be queued.',
    });
    setHistory(await getNotificationHistory());
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link underline="hover" color="inherit" href="/">BrainSAIT</Link>
          <Typography color="text.primary">Mentorship Hub</Typography>
        </Breadcrumbs>

        <Card sx={{ borderRadius: 5, overflow: 'hidden', mb: 5, background: 'linear-gradient(135deg, #0f172a 0%, #12263f 60%, #164e63 100%)', color: 'white' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Chip icon={<Chat />} label="Realtime chat rooms" sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'white' }} />
              <Chip icon={<Campaign />} label="Email automation" sx={{ bgcolor: 'rgba(46,125,50,0.18)', color: '#b9f6ca' }} />
              <Chip icon={<Hub />} label="Workers + DO + KV" sx={{ bgcolor: 'rgba(25,118,210,0.22)', color: '#bfdbfe' }} />
            </Stack>
            <Typography variant="h3" fontWeight={800} sx={{ color: 'white', maxWidth: 860, mb: 2 }}>
              Mentorship, live collaboration, and founder follow-up in one hub.
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 780, mb: 2.5 }}>
              This route merges the mentorship Stitch screens into chat rooms, durable-object websocket sessions, notification history, and email automation controls.
            </Typography>
            <Chip
              icon={<Circle sx={{ fontSize: 12 }} />}
              label={realtimeConnected ? 'Realtime connected' : 'Realtime standby'}
              sx={{ bgcolor: realtimeConnected ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.12)', color: 'white' }}
            />
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Chat rooms
                </Typography>
                <List disablePadding>
                  {rooms.map((room) => (
                    <ListItemButton
                      key={room.id}
                      selected={room.id === selectedRoom}
                      onClick={() => setSelectedRoom(room.id)}
                      sx={{ borderRadius: 2, mb: 1 }}
                    >
                      <ListItemText
                        primary={room.name}
                        secondary={`${room.topic} · ${room.participants.length} participants`}
                      />
                      {room.unreadCount > 0 && <Chip size="small" label={room.unreadCount} color="primary" />}
                    </ListItemButton>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Card sx={{ borderRadius: 4, mb: 4 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Room conversation
                </Typography>
                <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        alignSelf: message.direction === 'outgoing' ? 'flex-end' : 'flex-start',
                        maxWidth: '78%',
                        p: 2,
                        borderRadius: 3,
                        bgcolor: message.direction === 'outgoing' ? 'primary.main' : 'background.default',
                        color: message.direction === 'outgoing' ? 'white' : 'text.primary',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem' }}>{message.senderName[0]}</Avatar>
                        <Typography variant="caption" sx={{ opacity: 0.82 }}>
                          {message.senderName}
                        </Typography>
                      </Stack>
                      <Typography variant="body2">{message.message}</Typography>
                      {message.attachmentName && (
                        <Button size="small" href={message.attachmentUrl} sx={{ mt: 1, color: message.direction === 'outgoing' ? 'white' : 'primary.main' }}>
                          {message.attachmentName}
                        </Button>
                      )}
                    </Box>
                  ))}
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    fullWidth
                    label="Send message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <Button variant="contained" endIcon={<Send />} onClick={handleSendMessage}>
                    Send
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Card sx={{ borderRadius: 4, height: '100%' }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Email automation studio
                    </Typography>
                    <Stack spacing={1.5}>
                      <TextField label="Automation name" value={automationDraft.name} onChange={(event) => setAutomationDraft((current) => ({ ...current, name: event.target.value }))} />
                      <TextField label="Trigger event" value={automationDraft.triggerEvent} onChange={(event) => setAutomationDraft((current) => ({ ...current, triggerEvent: event.target.value }))} />
                      <TextField label="Subject" value={automationDraft.subject} onChange={(event) => setAutomationDraft((current) => ({ ...current, subject: event.target.value }))} />
                      <TextField label="Recipients" value={automationDraft.recipients} onChange={(event) => setAutomationDraft((current) => ({ ...current, recipients: event.target.value }))} />
                      <TextField label="Template preview" multiline minRows={3} value={automationDraft.templatePreview} onChange={(event) => setAutomationDraft((current) => ({ ...current, templatePreview: event.target.value }))} />
                      <Button variant="contained" onClick={handleSaveAutomation}>Save automation</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card sx={{ borderRadius: 4, height: '100%' }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Active automations
                    </Typography>
                    <Stack spacing={1.5}>
                      {automations.map((automation) => (
                        <Box key={automation.id} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" fontWeight={700}>{automation.name}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.25 }}>
                            {automation.triggerEvent} · {automation.subject}
                          </Typography>
                          <Button size="small" onClick={() => handleTriggerAutomation(automation.id)}>
                            Trigger now
                          </Button>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 4, mt: 4 }}>
          <CardContent sx={{ p: 3.5 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Recent notification history
            </Typography>
            <Grid container spacing={2}>
              {history.slice(0, 6).map((item) => (
                <Grid item xs={12} md={6} lg={4} key={item.id}>
                  <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      {item.subject}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.channel} · {item.status}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            {status && <Alert severity={status.severity} sx={{ mt: 3 }}>{status.message}</Alert>}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}