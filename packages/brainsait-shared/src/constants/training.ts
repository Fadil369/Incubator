export interface TrainingFocusArea {
  title: string;
  description: string;
  icon: 'automation' | 'integration' | 'growth';
}

export interface TrainingModule {
  title: string;
  description: string;
}

export interface TrainingLink {
  label: string;
  url: string;
}

export interface TrainingInstructor {
  name: string;
  role: string;
  company: string;
  location: string;
  bio: string;
  avatarUrl: string;
  links: TrainingLink[];
}

export interface TrainingCourse {
  slug: string;
  badge: string;
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  duration: string;
  format: string;
  level: string;
  classroomUrl: string;
  classroomCode: string;
  focusAreas: TrainingFocusArea[];
  curriculum: TrainingModule[];
  outcomes: string[];
  instructor: TrainingInstructor;
  category?: 'brainsait' | 'anthropic' | 'external';
  externalCatalogUrl?: string;
}

export interface AnthropicCourse {
  title: string;
  description: string;
  url: string;
  titleAr: string;
  descriptionAr: string;
  category: 'foundations' | 'api' | 'mcp' | 'fluency' | 'code';
}

export const anthropicCatalog: AnthropicCourse[] = [
  {
    title: 'Claude 101',
    description: 'Learn how to use Claude for everyday work tasks, understand core features, and explore resources for more advanced learning.',
    url: 'https://anthropic.skilljar.com/claude-101',
    titleAr: 'Claude 101',
    descriptionAr: 'تعلم كيفية استخدام Claude في مهام العمل اليومية وفهم الميزات الأساسية.',
    category: 'foundations',
  },
  {
    title: 'Claude Code 101',
    description: 'Learn how to use Claude Code effectively in your daily development workflow.',
    url: 'https://anthropic.skilljar.com/claude-code-101',
    titleAr: 'Claude Code 101',
    descriptionAr: 'تعلم كيفية استخدام Claude Code بفعالية في سير عمل التطوير اليومي.',
    category: 'code',
  },
  {
    title: 'AI Fluency: Framework & Foundations',
    description: 'Learn to collaborate with AI systems effectively, efficiently, ethically, and safely.',
    url: 'https://anthropic.skilljar.com/ai-fluency-framework-foundations',
    titleAr: 'AI Fluency: الإطار والأسس',
    descriptionAr: 'تعلم التعاون مع أنظمة الذكاء الاصطناعي بفعالية وأمان.',
    category: 'fluency',
  },
  {
    title: 'Building with the Claude API',
    description: 'This comprehensive course covers the full spectrum of working with Anthropic models using the Claude API.',
    url: 'https://anthropic.skilljar.com/claude-with-the-anthropic-api',
    titleAr: 'بناء باستخدام Claude API',
    descriptionAr: 'يغطي هذا المساق الشامل كامل نطاق العمل مع نماذج Anthropic باستخدام Claude API.',
    category: 'api',
  },
  {
    title: 'Introduction to Model Context Protocol',
    description: 'Learn to build Model Context Protocol servers and clients from scratch using Python.',
    url: 'https://anthropic.skilljar.com/introduction-to-model-context-protocol',
    titleAr: 'مقدمة إلى بروتوكول سياق النموذج (MCP)',
    descriptionAr: 'تعلم بناء خوادم وعملاء بروتوكول سياق النموذج من الصفر باستخدام Python.',
    category: 'mcp',
  },
  {
    title: 'Model Context Protocol: Advanced Topics',
    description: 'Discover advanced MCP implementation patterns including sampling, notifications, file system access, and transport mechanisms.',
    url: 'https://anthropic.skilljar.com/model-context-protocol-advanced-topics',
    titleAr: 'بروتوكول سياق النموذج: مواضيع متقدمة',
    descriptionAr: 'اكتشف أنماط تنفيذ متقدمة لبروتوكول سياق النموذج.',
    category: 'mcp',
  },
  {
    title: 'Claude Code in Action',
    description: 'Integrate Claude Code into your development workflow.',
    url: 'https://anthropic.skilljar.com/claude-code-in-action',
    titleAr: 'Claude Code in Action',
    descriptionAr: 'دمج Claude Code في سير عمل التطوير الخاص بك.',
    category: 'code',
  },
  {
    title: 'AI Fluency for educators',
    description: 'This course empowers faculty, instructional designers, and educational leaders to apply AI Fluency into their teaching practice.',
    url: 'https://anthropic.skilljar.com/ai-fluency-for-educators',
    titleAr: 'AI Fluency للمعلمين',
    descriptionAr: 'يهدف هذا المساق إلى تمكين الأساتذة ومصممي المناهج من تطبيق AI Fluency في ممارساتهم التعليمية.',
    category: 'fluency',
  },
  {
    title: 'AI Fluency for students',
    description: 'This course empowers students to develop AI Fluency skills for learning, career planning, and academic success.',
    url: 'https://anthropic.skilljar.com/ai-fluency-for-students',
    titleAr: 'AI Fluency للطلاب',
    descriptionAr: 'يهدف هذا المساق إلى تمكين الطلاب من تطوير مهارات AI Fluency.',
    category: 'fluency',
  },
  {
    title: 'Claude with Amazon Bedrock',
    description: "Anthropic's first-of-its-kind training for AWS employees — full course available publicly.",
    url: 'https://anthropic.skilljar.com/claude-in-amazon-bedrock',
    titleAr: 'Claude مع Amazon Bedrock',
    descriptionAr: 'أول تدريب من نوعه لموظفي AWS من Anthropic — الدورة الكاملة متاحة للعموم.',
    category: 'api',
  },
  {
    title: "Claude with Google Cloud's Vertex AI",
    description: "Comprehensive course covering working with Anthropic models through Google Cloud's Vertex AI.",
    url: 'https://anthropic.skilljar.com/claude-with-google-vertex',
    titleAr: 'Claude مع Vertex AI من Google Cloud',
    descriptionAr: 'يغطي هذا المساق الشامل نطاق العمل مع نماذج Anthropic عبر Vertex AI من Google Cloud.',
    category: 'api',
  },
  {
    title: 'Introduction to agent skills',
    description: 'Learn how to build, configure, and share Skills in Claude Code — reusable markdown instructions.',
    url: 'https://anthropic.skilljar.com/introduction-to-agent-skills',
    titleAr: 'مقدمة إلى مهارات الوكيل',
    descriptionAr: 'تعلم كيفية بناء وتكوين ومشاركة Skills في Claude Code.',
    category: 'code',
  },
  {
    title: 'Introduction to subagents',
    description: 'Learn how to use and create sub-agents in Claude Code to manage context and delegate tasks.',
    url: 'https://anthropic.skilljar.com/introduction-to-subagents',
    titleAr: 'مقدمة إلى الوكلاء الفرعيين',
    descriptionAr: 'تعلم كيفية استخدام وإنشاء وكلاء فرعيين في Claude Code.',
    category: 'code',
  },
  {
    title: 'AI Capabilities and Limitations',
    description: 'An introductory course about how AI works.',
    url: 'https://anthropic.skilljar.com/ai-capabilities-and-limitations',
    titleAr: 'قدرات الذكاء الاصطناعي والحدود',
    descriptionAr: 'مساق تمهيدي يشرح كيف يعمل الذكاء الاصطناعي.',
    category: 'foundations',
  },
];

export const trainingCourses: TrainingCourse[] = [
  {
    slug: 'collective-brainpower',
    badge: 'Registration Now Open',
    category: 'brainsait',
    title: 'Master the Intersection of Healthcare, Tech & AI',
    subtitle:
      'Join an exclusive collective brainpower program designed to deliver solutions that are automated, integrated, and technology-driven.',
    summary:
      'A premium BrainSAIT course for healthcare founders, operators, and innovators building the next wave of digital health transformation.',
    description:
      'This course brings together healthcare strategy, digital transformation, artificial intelligence, and entrepreneurship into one practical learning track. It is designed for ambitious teams who need to move from fragmented ideas to automated systems, interoperable platforms, and scalable growth.',
    duration: 'Cohort-based with self-paced materials',
    format: 'Google Classroom + guided implementation',
    level: 'Founders, operators, and innovation teams',
    classroomUrl: 'https://classroom.google.com/c/ODYwNTAyNzAzMTky?cjc=4oc22gvm',
    classroomCode: '4oc22gvm',
    focusAreas: [
      {
        icon: 'automation',
        title: 'Automated Solutions',
        description:
          'Leverage artificial intelligence and machine learning to streamline clinical and operational workflows efficiently.',
      },
      {
        icon: 'integration',
        title: 'Integrated Systems',
        description:
          'Bridge healthcare requirements and business strategy through seamless interoperability and digital architecture.',
      },
      {
        icon: 'growth',
        title: 'Tech-Driven Growth',
        description:
          'Master the entrepreneurial mindset needed to scale innovative health-tech ventures across regional and global markets.',
      },
    ],
    curriculum: [
      {
        title: 'Collective Brainpower Foundations',
        description:
          'Build a decision-making model that aligns physicians, operators, founders, and technical teams around a shared digital roadmap.',
      },
      {
        title: 'Automation in Healthcare Operations',
        description:
          'Identify high-leverage automation opportunities across patient journeys, compliance workflows, analytics, and back-office execution.',
      },
      {
        title: 'Integrated Digital Health Systems',
        description:
          'Design interoperable systems that connect clinical requirements, data contracts, AI services, and business processes.',
      },
      {
        title: 'AI Strategy for Health-Tech Growth',
        description:
          'Translate AI capabilities into product strategy, founder positioning, and scalable market execution for healthcare ventures.',
      },
    ],
    outcomes: [
      'Map automation opportunities across healthcare workflows and business operations.',
      'Design interoperable digital systems that connect product, data, and service delivery.',
      'Create an actionable AI adoption plan aligned with real startup or enterprise priorities.',
      'Turn collective expertise into repeatable execution systems for growth and transformation.',
    ],
    instructor: {
      name: 'Dr. Mohamed El Fadil',
      role: 'Physician, Tech Entrepreneur, and Founder',
      company: 'BRAINSAIT LTD',
      location: 'Riyadh, Saudi Arabia',
      bio:
        'Dr. Mohamed El Fadil operates at the intersection of healthcare, business, and technology. He focuses on artificial intelligence, digital transformation, and innovation systems that convert collective expertise into practical, scalable products.',
      avatarUrl: 'https://gravatar.com/avatar/2e2a22838382d5a371c1b18342416b7f?s=800&d=mp',
      links: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/fadil369' },
        { label: 'X', url: 'https://x.com/brainsait369' },
        { label: 'GitHub', url: 'https://github.com/fadil369' },
        { label: 'Calendly', url: 'https://calendly.com/fadil369' },
      ],
    },
  },
  {
    slug: 'nphies-ai-mastery',
    badge: 'Advanced Track',
    category: 'brainsait',
    title: 'NPHIES-AI Mastery: Health Insurance Automation',
    subtitle:
      'Deep dive into Saudi health-insurance AI pipelines — claims automation, NPHIES compliance, and FHIR R4 integration.',
    summary:
      'A specialized BrainSAIT course focused on AI-driven claims processing, NPHIES compliance, and Oracle bridge integration for Saudi healthcare teams.',
    description:
      'This course is purpose-built for revenue cycle management teams, clinical coders, compliance officers, and healthcare IT professionals who need to master NPHIES-compliant claims processing using AI automation. Covers the full spectrum from claim submission to denial management and resubmission workflows.',
    duration: 'Cohort-based with live implementation sessions',
    format: 'Google Classroom + guided implementation',
    level: 'RCM teams, clinical coders, and compliance officers',
    classroomUrl: 'https://classroom.google.com/c/ODYwNTQ0NDEyNjMw?cjc=pohzx7a6',
    classroomCode: 'pohzx7a6',
    focusAreas: [
      {
        icon: 'automation',
        title: 'Claims Automation',
        description:
          'Automate the full NPHIES claims lifecycle from pre-authorization to resubmission using AI-native pipelines.',
      },
      {
        icon: 'integration',
        title: 'FHIR R4 Integration',
        description:
          'Implement FHIR R4 compliant data models and interfaces for seamless NPHIES communication and Oracle bridge connectivity.',
      },
      {
        icon: 'growth',
        title: 'RCM Optimization',
        description:
          'Maximize revenue recovery through intelligent denial analysis, prioritized resubmission queues, and audit-ready reporting.',
      },
    ],
    curriculum: [
      {
        title: 'NPHIES Architecture & Compliance',
        description:
          'Master the NPHIES system architecture, regulatory requirements, and compliance framework for Saudi healthcare payers and providers.',
      },
      {
        title: 'AI Claim Processing Pipelines',
        description:
          'Build intelligent claim processing pipelines that automate coding validation, eligibility checks, and submission workflows.',
      },
      {
        title: 'Denial Management & Resubmission',
        description:
          'Implement AI-driven denial analysis, root cause identification, and automated resubmission strategies for maximum recovery.',
      },
      {
        title: 'Oracle Bridge & Data Integration',
        description:
          'Connect Oracle healthcare databases with NPHIES endpoints through secure, scalable integration layers and real-time data contracts.',
      },
    ],
    outcomes: [
      'Implement end-to-end NPHIES-compliant claims automation pipelines.',
      'Build FHIR R4 data models for Saudi healthcare interoperability.',
      'Design AI-driven denial management workflows for maximum revenue recovery.',
      'Integrate Oracle healthcare systems with NPHIES via secure API bridges.',
    ],
    instructor: {
      name: 'Dr. Mohamed El Fadil',
      role: 'Physician, Tech Entrepreneur, and Founder',
      company: 'BRAINSAIT LTD',
      location: 'Riyadh, Saudi Arabia',
      bio:
        'Dr. Mohamed El Fadil operates at the intersection of healthcare, business, and technology. He focuses on artificial intelligence, digital transformation, and innovation systems that convert collective expertise into practical, scalable products.',
      avatarUrl: 'https://gravatar.com/avatar/2e2a22838382d5a371c1b18342416b7f?s=800&d=mp',
      links: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/fadil369' },
        { label: 'X', url: 'https://x.com/brainsait369' },
        { label: 'GitHub', url: 'https://github.com/fadil369' },
        { label: 'Calendly', url: 'https://calendly.com/fadil369' },
      ],
    },
  },
];

export const featuredTrainingCourse = trainingCourses[0];

export function getTrainingCourseBySlug(slug: string): TrainingCourse | undefined {
  return trainingCourses.find((course) => course.slug === slug);
}