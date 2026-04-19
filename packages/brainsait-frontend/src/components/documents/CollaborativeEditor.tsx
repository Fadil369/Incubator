'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  TextField,
  Button,
  AvatarGroup,
  Avatar,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Comment,
  Send,
  Save,
  Reviews,
  Summarize,
  Timeline,
  Shield,
  TaskAlt,
  History,
  AutoAwesome,
  PeopleAlt
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface CommentThread {
  id: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  resolved?: boolean;
}

interface VersionSnapshot {
  id: string;
  label: string;
  author: string;
  timestamp: string;
  summary: string;
}

interface CollaborativeEditorProps {
  documentTitle?: string;
  onSaveDraft?: (content: string) => void;
  onSubmitForApproval?: (content: string) => void;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentTitle = 'Saudi Healthcare Document',
  onSaveDraft,
  onSubmitForApproval
}) => {
  const { i18n } = useTranslation();
  const [content, setContent] = useState(
    'Draft your document here. Highlight compliance, clinical safety, and data protection requirements.'
  );
  const [comments, setComments] = useState<CommentThread[]>([
    {
      id: '1',
      author: 'Aisha',
      role: 'Compliance',
      content: 'Add explicit NPHIES integration scope in the architecture section.',
      timestamp: 'Just now'
    },
    {
      id: '2',
      author: 'Fahad',
      role: 'Product',
      content: 'Clarify pilot KPIs for Riyadh region clinics.',
      timestamp: '10m ago'
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [aiSummary, setAiSummary] = useState(
    'Document aligns with Vision 2030 and includes PDPL data handling. Pending: detailed NPHIES integration plan.'
  );
  const [activeTab, setActiveTab] = useState(0);
  const isRTL = i18n.language === 'ar';

  const versions = useMemo<VersionSnapshot[]>(
    () => [
      {
        id: 'v3',
        label: 'v3 - Compliance ready',
        author: 'Aisha',
        timestamp: 'Today, 10:30',
        summary: 'Added PDPL statements and appended risk register.'
      },
      {
        id: 'v2',
        label: 'v2 - Finance review',
        author: 'Omar',
        timestamp: 'Yesterday, 17:10',
        summary: 'Refined financial projections for MOH tender.'
      },
      {
        id: 'v1',
        label: 'v1 - Initial draft',
        author: 'Sara',
        timestamp: 'Mon, 09:00',
        summary: 'Base narrative for telemedicine platform.'
      }
    ],
    []
  );

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      {
        id: String(prev.length + 1),
        author: 'You',
        role: 'Reviewer',
        content: newComment,
        timestamp: 'Now'
      },
      ...prev
    ]);
    setNewComment('');
  };

  const handleSave = () => {
    if (onSaveDraft) {
      onSaveDraft(content);
    }
  };

  const handleSubmit = () => {
    if (onSubmitForApproval) {
      onSubmitForApproval(content);
    }
  };

  const handleRegenerateSummary = () => {
    setAiSummary(
      'AI summary refreshed: include SFDA device notes and clarify data residency for Riyadh/NEOM regions.'
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5">{documentTitle}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isRTL
              ? 'تحرير تعاوني مع ملخصات الذكاء الاصطناعي وسير عمل الموافقات.'
              : 'Collaborative editing with AI summaries and approval workflow.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip icon={<Shield />} label={isRTL ? 'جاهز للامتثال' : 'Compliance ready'} color="success" />
          <AvatarGroup max={4}>
            <Avatar alt="Aisha" src="https://ui-avatars.com/api/?name=Aisha" />
            <Avatar alt="Fahad" src="https://ui-avatars.com/api/?name=Fahad" />
            <Avatar alt="Sara" src="https://ui-avatars.com/api/?name=Sara" />
            <Avatar alt="Omar" src="https://ui-avatars.com/api/?name=Omar" />
          </AvatarGroup>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 2 }}>
                <Tab label={isRTL ? 'المحتوى' : 'Content'} />
                <Tab label={isRTL ? 'التعليقات' : 'Comments'} icon={<Comment />} iconPosition="start" />
                <Tab label={isRTL ? 'الإصدارات' : 'Versions'} icon={<History />} iconPosition="start" />
              </Tabs>

              {activeTab === 0 && (
                <Box>
                  <TextField
                    multiline
                    minRows={10}
                    fullWidth
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={isRTL ? 'اكتب هنا...' : 'Start drafting here...'}
                    sx={{ mb: 2 }}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button startIcon={<Save />} variant="outlined" onClick={handleSave}>
                      {isRTL ? 'حفظ المسودة' : 'Save draft'}
                    </Button>
                    <Button startIcon={<Reviews />} variant="contained" onClick={handleSubmit}>
                      {isRTL ? 'طلب اعتماد' : 'Submit for approval'}
                    </Button>
                  </Stack>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Stack direction="row" spacing={1} mb={2}>
                    <TextField
                      fullWidth
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={isRTL ? 'أضف تعليقاً' : 'Add a comment'}
                    />
                    <Button variant="contained" startIcon={<Send />} onClick={handleAddComment}>
                      {isRTL ? 'إرسال' : 'Send'}
                    </Button>
                  </Stack>
                  <List>
                    {comments.map((comment) => (
                      <ListItem
                        key={comment.id}
                        divider
                        secondaryAction={
                          <Chip
                            label={comment.role}
                            size="small"
                            color={comment.role === 'Compliance' ? 'secondary' : 'default'}
                          />
                        }
                        alignItems="flex-start"
                      >
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle2">{comment.author}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {comment.timestamp}
                              </Typography>
                            </Stack>
                          }
                          secondary={comment.content}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {activeTab === 2 && (
                <List>
                  {versions.map((version) => (
                    <ListItem
                      key={version.id}
                      divider
                      secondaryAction={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={version.author} size="small" />
                          <Button size="small" variant="text">
                            {isRTL ? 'استرجاع' : 'Restore'}
                          </Button>
                        </Stack>
                      }
                    >
                      <ListItemText
                        primary={`${version.label} • ${version.timestamp}`}
                        secondary={version.summary}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Summarize color="primary" />
                  <Typography variant="h6">{isRTL ? 'ملخص الذكاء الاصطناعي' : 'AI Summary'}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {aiSummary}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  fullWidth
                  onClick={handleRegenerateSummary}
                >
                  {isRTL ? 'تحديث الملخص' : 'Refresh summary'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Timeline color="secondary" />
                  <Typography variant="h6">{isRTL ? 'سير العمل' : 'Workflow'}</Typography>
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TaskAlt color="success" />
                    <Typography variant="body2">
                      {isRTL ? 'مسودة جاهزة' : 'Draft ready'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Shield color="info" />
                    <Typography variant="body2">
                      {isRTL ? 'مراجعة الامتثال قيد التنفيذ' : 'Compliance review in progress'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PeopleAlt color="warning" />
                    <Typography variant="body2">
                      {isRTL ? 'مراجعة أصحاب المصلحة' : 'Stakeholder review pending'}
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={72} sx={{ mt: 1 }} />
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Comment color="action" />
                  <Typography variant="h6">{isRTL ? 'ملاحظات سريعة' : 'Quick notes'}</Typography>
                </Stack>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Add KSA data residency clause for R2 backups." />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Reference MOH digital health licensing IDs." />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Attach cybersecurity controls (NCA ECC v2)." />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default CollaborativeEditor;
