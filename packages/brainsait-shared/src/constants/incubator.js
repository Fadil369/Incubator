import { featuredTrainingCourse } from './training';
export const incubatorRouteCards = [
    {
        title: 'Resources Library',
        description: 'Templates, workshops, contracts, and the shared course bundle in one searchable workspace.',
        href: '/resources',
    },
    {
        title: 'Mentorship Hub',
        description: 'Live cohort rooms, mentor threads, and notification-driven check-ins backed by Cloudflare realtime.',
        href: '/mentorship',
    },
    {
        title: 'App Marketplace',
        description: 'Deployable healthcare workflows, automation bundles, and GitHub-backed starter products.',
        href: '/app-store',
    },
    {
        title: 'Graduation Showcase',
        description: 'A curated public view of startups, product launches, and cohort outcomes.',
        href: '/showcase',
    },
];
export const incubatorAppCategories = [
    {
        slug: 'healthcare',
        title: 'Healthcare Operations',
        description: 'Clinical workflow automation, interoperability, and care-team coordination products.',
        highlight: 'Built for founders working with NPHIES, FHIR, PDPL, and patient operations at scale.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvW7La9Os8oeb1K63JhVGTFhiLyYEr9Cest4ewBLjMbVNHj2nibl_yGSWUZpw5DssQTg7jrUnLBOkta28PNv2eSwNDBY1Zmezwk_1AxHklAUiPDaUV2s_Obydmq9--s8TeMgwOAHabqZZvk4h0Jp3h_KOXmFbKln9Q7e_kiHVgUBvggp3CbXsEErgbc7U459QHaMPv7EoSjUta4MQwTOke_q8lo_Jlq3cYpTF9-tf0WtHGuS_87R6H9TjiQrBu8GSHWdtwzaMOftk',
    },
    {
        slug: 'automation',
        title: 'Automation & AI',
        description: 'Workflow assistants, routing agents, and AI services for startup execution.',
        highlight: 'Pairs with event-bridge, queue consumers, and Workers AI for assisted operations.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuGzzsewzyDrjxlYWOgHiHj3eG3rOTTbDdmWULgH8bqREc43GS5BQddmHrhcatHx-RS6Pvz99JtOGtq87oINX8hBaLEkclErbxersOOHVVVIGp5bwYKLMD9dAeqCj34R5heHFzQRLh1ekeF99uz_iEMSdtP0KjV6J3TA7c11LA-oYPKdtokKOUymVWEg8aBU_JF_I0Zr1ai7Soyvxu1N_vy3Z0wzAN9qXa3uOef0A67QOXL2M_C8JoUhRrHktHBioIQnbIvl1Tyi0',
    },
    {
        slug: 'data-sharing',
        title: 'Data Sharing & Compliance',
        description: 'Catalogs, contracts, and secure data exchange surfaces for partner integrations.',
        highlight: 'Tied to the data-hub worker, shared contracts, and storage-backed learning resources.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6TxGcnLWiIb9aABSkk3rFIdyGJasKl_I5UBis1CRVU_NR0tPe_6GpP-vzudJbeHPebO-vuxIgH6R5mML-_fRa_MGOFByEUJPemIuz8cRI6IrvlKM2Zfc5jQkVfcz9g5knogsZVjcKzQX7tmu232pLlULFlR9s_DTMeHJ5uX50Zus77L5qnK1rftxq_vpgwtJPeGKbzios0Lgf9nmr3OLF48lCRxmrvY7MuCvoxYhdmPPtnI50E9C61Xe2Qo_PCVndvWIkB012DKs',
    },
];
export const incubatorApps = [
    {
        slug: 'healthconnect',
        name: 'HealthConnect',
        category: 'healthcare',
        startup: 'CareGrid Studio',
        shortDescription: 'Patient data management, care coordination, and interoperability from one control layer.',
        description: 'HealthConnect unifies patient records, care-team tasks, and referral workflows into a single operational layer built for Saudi healthcare startups scaling across providers and payer ecosystems.',
        tagline: 'The operational backbone for patient coordination and partner-ready data sharing.',
        githubUrl: 'https://github.com/fadil369',
        demoUrl: '/portal',
        installEvent: 'app.healthconnect.install',
        tags: ['FHIR', 'NPHIES', 'Patient Ops', 'Care Coordination'],
        compliance: ['PDPL-aligned', 'FHIR-ready', 'NPHIES integration plan'],
        metrics: [
            { label: 'Care teams onboarded', value: '24' },
            { label: 'Workflow templates', value: '18' },
            { label: 'Expected time saved', value: '11 hrs / week' },
        ],
        features: [
            { icon: 'health_and_safety', title: 'Patient Data Management', description: 'Centralized clinical and operational records with role-based views.' },
            { icon: 'group', title: 'Care Coordination', description: 'Shared tasks, secure messages, and milestone-based escalations.' },
            { icon: 'verified_user', title: 'Security & Compliance', description: 'Policies and audit trails designed for regulated healthcare workflows.' },
            { icon: 'integration_instructions', title: 'Integration Support', description: 'Connects into data contracts, export bundles, and partner systems.' },
        ],
        screenshots: [
            { title: 'Operations dashboard', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp_4nuZqF-ts_5tLFi3Sl6jh4Ab_90ZHRt6PBP74fRgKlhCv6jiK22pkFGao6NHH3I7Llgu3uV9fjDgZO24lZBoR-BT6SD_Hf-zsPbyx4foRHPekV9k4l3FJJdb0Dc3gXwGyXIOh4aAeEbSqvWVzBQgD7GTjVEuSrp7ec7Tx9S-LbKP4S7p36Q3u0pYFhkTyxpFh3U4pkJdtWvwaUJYfEbPbJVqbAQ6GE_tCwU2Ag6KHfX80l0VVQuWLfxM-uXdc_MiLQngf5rTso' },
            { title: 'Team workspace', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD35l2FXQJdPgTVxCXYh4t5tF645fO-vqrDJAMO3RWhhn-WnMgNei3HIJXm3Ry07Q7TPcJTAiaHsKIiE6GVnzFslNQGTQHCZMwVxD9oogX6eNzrXAbyRQezOk39berMKVDM67rwp-2GmEX_y7GMcrn3NIk1OFg9fZg4L74HgpJ4fg1BIQzU6n59K0lgpAgnep0l1hp7k8AZXbx-aSlGA7KjdNHra_zKZLPvT3wIHeRhfINHAFel_u6RXGPmwhlPuCQ6zd-QsZwR3cA' },
            { title: 'Analytics and outreach', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5b_LwAwkZguyqTgEH7PQj6wkH_JYdoCyb9wP4wLi1YNYRNM7Bbd3p8FOz-kFPogsWjuG5Wk7kqVJe3fuyrsB9dHTKD0f8DDu-BdC5frs-5C6--WU6Ut_2Pweto1KUqgacbj8edhoRuGeiHl2AWx03Bq_7S48WoE14AuQy1jRGe-a0B53yIqZ608kdvxHx-pObUwIhPJ5uw8yNu0u_rBz-bSFT7rNxSer7L182G5BTizURsFT3MFnQUR6F2OeZqvJw-uuBkpfT928' },
        ],
        pricingTiers: [
            { name: 'Basic', price: 'Free', ctaLabel: 'Start Free', features: ['Up to 100 patient profiles', 'Basic reporting', 'Community support'] },
            { name: 'Standard', price: '$49 / month', ctaLabel: 'Choose Standard', featured: true, features: ['Unlimited patients', 'Advanced reporting', 'Priority support', '3rd-party integrations'] },
            { name: 'Premium', price: '$99 / month', ctaLabel: 'Talk to BrainSAIT', features: ['Custom dashboards', '24/7 support', 'Dedicated onboarding', 'Full partner integrations'] },
        ],
    },
    {
        slug: 'careflow-ai',
        name: 'CareFlow AI',
        category: 'automation',
        startup: 'BrainSAIT Applied AI',
        shortDescription: 'AI-assisted workflow routing for founders handling intake, milestones, and team follow-up.',
        description: 'CareFlow AI combines workflow automation, event routing, and mentor recommendations so incubated founders can convert fragmented requests into monitored, repeatable execution.',
        tagline: 'Operational AI tuned for healthcare founders and incubator staff.',
        githubUrl: 'https://github.com/fadil369',
        demoUrl: '/startup/automate',
        installEvent: 'app.careflow-ai.install',
        tags: ['Automation', 'Workers AI', 'Queues', 'Mentorship'],
        compliance: ['Audit trail enabled', 'Queue-based event routing'],
        metrics: [
            { label: 'Automations live', value: '12' },
            { label: 'Average response time', value: '< 5 min' },
            { label: 'Mentor handoffs', value: '93%' },
        ],
        features: [
            { icon: 'auto_awesome', title: 'Workflow Suggestions', description: 'Turns program events into actionable checklists and reminders.' },
            { icon: 'hub', title: 'Event Bridge Integration', description: 'Routes launches, approvals, and app installs through automation events.' },
            { icon: 'campaign', title: 'Email Automation', description: 'Coordinates reminder streams and cohort follow-ups from reusable templates.' },
            { icon: 'chat', title: 'Mentor Escalation', description: 'Pushes complex requests into live chat rooms and mentor queues.' },
        ],
        screenshots: [
            { title: 'Automation overview', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAU6UeGPhE4DkLeYApnIQlrtjjCbZAI2bNN7zd_eMSkOrcIjCIfbwM_Mz0vGX3zWOH2FYXEoKo7nmaPO0_KX4LI0xhKZybVnEFzvIbLkqb1XG2Rxp_LWg55ce9yH0QPUxPQfYKRIT2jMIrYSBsFym77IjjVXbAABia8HlhSpdi97YWSLM9a9XlqFZJ0U0fzCUuknua0suM4HFQJFDCN7aYoRylpVU3pU_M1qnuoV-QGJXOUQ3oons2P-U27-ktqH9KHby6VgJH4lR0' },
            { title: 'Workflow templates', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3C236bDaN3supUo85m39ZFZ9MZjLd2j8g8ZuOKnP_249CqGJcZTVmTTHHGmFoxDT6wXRk-6q13Cq013sVfbGNY38Z7f8o1I1DFbV4igz8duFl4MGfafAWPLzoVw5ydKzAa1XeKc1YwI_dSsinTwNI6UsiBZy0LLtU3ZItnQSJL1XStOpcjI4tEp_4BraVeJqd3EZgA4AhQo16zPpOkNVBjkXxlkz0BDpFvbekcAJaBhg9w0CXTipsRcTVxfAkku5AVeJozPakoSE' },
        ],
        pricingTiers: [
            { name: 'Pilot', price: 'Included in incubation', ctaLabel: 'Activate in Portal', features: ['One automation workspace', 'Cohort notifications', 'Weekly insights'] },
            { name: 'Growth', price: '$79 / month', ctaLabel: 'Upgrade', featured: true, features: ['Unlimited automations', 'Live chat routing', 'Email sequences', 'Event analytics'] },
        ],
    },
    {
        slug: 'nphies-sync',
        name: 'NPHIES Sync',
        category: 'data-sharing',
        startup: 'Data Hub Labs',
        shortDescription: 'Contract-aware data exchange starter for interoperability pilots and partner onboarding.',
        description: 'NPHIES Sync packages schemas, partner subscriptions, and governed data-sharing controls into one launch-ready surface for ecosystem collaborations.',
        tagline: 'From contract definition to shared dataset delivery without leaving the incubator stack.',
        githubUrl: 'https://github.com/fadil369',
        demoUrl: '/resources',
        installEvent: 'app.nphies-sync.install',
        tags: ['Data Hub', 'Contracts', 'R2', 'D1'],
        compliance: ['HIPAA validation checks', 'Contract registry support'],
        metrics: [
            { label: 'Contracts prepared', value: '8' },
            { label: 'Partner subscriptions', value: '17' },
            { label: 'Shared datasets', value: '5 bundles' },
        ],
        features: [
            { icon: 'database', title: 'Catalog Sync', description: 'Expose datasets and schema snapshots through the Cloudflare data hub.' },
            { icon: 'shield_lock', title: 'Contract-aware Access', description: 'Pair every dataset with usage rules and sharing boundaries.' },
            { icon: 'cloud_upload', title: 'Storage-backed Assets', description: 'Ships learning packs, templates, and export bundles from R2.' },
            { icon: 'insights', title: 'Partner Visibility', description: 'Surface active subscriptions, recent syncs, and adoption stats.' },
        ],
        screenshots: [
            { title: 'Data hub catalog', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5w8Dt2_bmAykIf6HYKhM0J8L4XTu4Lu16VwGSzH0tAqK56U6gZgMe6xFOIVxy2v2VZb8ISyl16Z6jEzQr70-Zi_euJHW44LAQkEvBsJX22eYj_VYLJ3lsdmZifBNtncliMCPkjnD_IQWF64emSn8fpArIsIz4moUIDez5OJyjpbkLt4Ii1jSgn9lGBFQvfHFIVxiq2sAbUe9DZ2EG6Zlf6frml1plDOiQRyH6E_XR9LtOS2Uw6_E2rm4Q1RuHvuMbaJcx77oQXd8' },
            { title: 'Contracts and policies', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCznezS_NNR56GTp8sdm-2fMFylCcobkUsbHu7_7gQdYVYRzH6j42lDV0XZHP8rfe1jXWvv5lxkVmDEG0WH-RSQ1dxnMyyJy0G3A67coBbckAhdMH-HLqs8qe6oiuYVY2Hs7UZAjUJ9pxTu79HdGNlXz9DHZFJvn1YKdgT-_CesbEsWXs_NCf55BIOer83hqp3FxYTTi4DnQxKp0Y9nPbXOqG4VO7Gjr7V0cc2vGss0ILwKPRtY0SDtITwcaMKusARTPTzqZcvipjw' },
        ],
        pricingTiers: [
            { name: 'Founders', price: 'Included', ctaLabel: 'Review contracts', features: ['One shared contract', 'Starter catalog', 'Secure export bundle'] },
            { name: 'Partner Network', price: '$129 / month', ctaLabel: 'Enable partner sync', featured: true, features: ['Unlimited contracts', 'Partner subscriptions', 'Usage analytics', 'Priority support'] },
        ],
    },
];
export const incubatorResources = [
    {
        slug: 'market-research-guide',
        title: 'Market Research Guide',
        summary: 'A founder-focused playbook for validating healthcare demand, segmenting buyers, and capturing evidence early.',
        category: 'Strategy',
        type: 'article',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVZKnnwy-3BucHySO-RiEHUiUPM6aVpb0mmlIs1dThHtg4_W5NJtTHYg2x73HQ4ixJPpfjrs1zZsxgK1IVe5KhLmCjMKYkYln9tGvOkp_Gtd53MmV5dKjtVQobfmMh5D7fM4bbMEn4aZtADCuy5X5sBLkgNJa-m9bZpXGcE-GEwpV1a-LR43ZIpEZBuCIH0IWHscMdCy4iMgpVLCgoHJ1sC2gf_e__uARaCvFtyJYaIbyXOYWnNw8E94hoghuTRziP9SoJiQs-hvQ',
        ctaLabel: 'Open guide',
        ctaHref: '/resources',
        tags: ['Validation', 'Interviews', 'Positioning'],
        featured: true,
    },
    {
        slug: 'startup-ops-toolkit',
        title: 'Startup Ops Toolkit',
        summary: 'Templates for finance, operating cadence, sprint planning, and healthcare stakeholder reporting.',
        category: 'Operations',
        type: 'template',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5w8Dt2_bmAykIf6HYKhM0J8L4XTu4Lu16VwGSzH0tAqK56U6gZgMe6xFOIVxy2v2VZb8ISyl16Z6jEzQr70-Zi_euJHW44LAQkEvBsJX22eYj_VYLJ3lsdmZifBNtncliMCPkjnD_IQWF64emSn8fpArIsIz4moUIDez5OJyjpbkLt4Ii1jSgn9lGBFQvfHFIVxiq2sAbUe9DZ2EG6Zlf6frml1plDOiQRyH6E_XR9LtOS2Uw6_E2rm4Q1RuHvuMbaJcx77oQXd8',
        ctaLabel: 'Download templates',
        ctaHref: '/resources',
        tags: ['Ops', 'Finance', 'Templates'],
        featured: true,
    },
    {
        slug: 'collective-brainpower-bundle',
        title: 'Collective Brainpower Bundle',
        summary: 'The first shared BrainSAIT course pack, with curriculum, execution prompts, and linked implementation resources.',
        category: 'Training',
        type: 'course',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAU6UeGPhE4DkLeYApnIQlrtjjCbZAI2bNN7zd_eMSkOrcIjCIfbwM_Mz0vGX3zWOH2FYXEoKo7nmaPO0_KX4LI0xhKZybVnEFzvIbLkqb1XG2Rxp_LWg55ce9yH0QPUxPQfYKRIT2jMIrYSBsFym77IjjVXbAABia8HlhSpdi97YWSLM9a9XlqFZJ0U0fzCUuknua0suM4HFQJFDCN7aYoRylpVU3pU_M1qnuoV-QGJXOUQ3oons2P-U27-ktqH9KHby6VgJH4lR0',
        ctaLabel: 'Open course hub',
        ctaHref: '/training/courses/collective-brainpower',
        tags: ['Course', 'AI', 'Healthcare'],
        featured: true,
    },
    {
        slug: 'pdpl-compliance-blueprint',
        title: 'PDPL Compliance Blueprint',
        summary: 'Operational guidance for storing, sharing, and governing health-related startup data responsibly.',
        category: 'Compliance',
        type: 'contract',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6TxGcnLWiIb9aABSkk3rFIdyGJasKl_I5UBis1CRVU_NR0tPe_6GpP-vzudJbeHPebO-vuxIgH6R5mML-_fRa_MGOFByEUJPemIuz8cRI6IrvlKM2Zfc5jQkVfcz9g5knogsZVjcKzQX7tmu232pLlULFlR9s_DTMeHJ5uX50Zus77L5qnK1rftxq_vpgwtJPeGKbzios0Lgf9nmr3OLF48lCRxmrvY7MuCvoxYhdmPPtnI50E9C61Xe2Qo_PCVndvWIkB012DKs',
        ctaLabel: 'Review contract',
        ctaHref: '/resources',
        tags: ['PDPL', 'Contracts', 'Governance'],
    },
    {
        slug: 'github-automation-recipes',
        title: 'GitHub Automation Recipes',
        summary: 'Ready-made workflow ideas for repo provisioning, template rollout, and post-approval startup automation.',
        category: 'Automation',
        type: 'template',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3C236bDaN3supUo85m39ZFZ9MZjLd2j8g8ZuOKnP_249CqGJcZTVmTTHHGmFoxDT6wXRk-6q13Cq013sVfbGNY38Z7f8o1I1DFbV4igz8duFl4MGfafAWPLzoVw5ydKzAa1XeKc1YwI_dSsinTwNI6UsiBZy0LLtU3ZItnQSJL1XStOpcjI4tEp_4BraVeJqd3EZgA4AhQo16zPpOkNVBjkXxlkz0BDpFvbekcAJaBhg9w0CXTipsRcTVxfAkku5AVeJozPakoSE',
        ctaLabel: 'Open automation hub',
        ctaHref: '/startup/automate',
        tags: ['GitHub', 'Templates', 'Automation'],
    },
];
export const incubatorWorkshops = [
    {
        slug: 'financial-planning-for-startups',
        title: 'Financial Planning for Startups',
        summary: 'Budgeting, runway modeling, and founder decision frameworks for healthcare ventures.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqENA3A_nw6MyxwtAdoqIZQF0ADVQ_X-Whm80GFulcbaeM0QgZ-H_ig4c-G8BCLRU8nv6UlCfYRKbLK3w2OpIQSxzgrd3LOoMkD4ZFiyZTApJWODLhMe-_CWWUKLOBmE512lAp73B9rVooAWBgRD_I0IbUZW7IcQiaN2vJBsJR955gEkJaiq3IiqVSrTP6qaPK_XAohaaT1gDdBsJwoF6F3Nz3r8LrNxjzRQODCQSAdOc_myrqA3Kb0xVvBAFazoFvfLykoIYHnCg',
        registrationHref: '/apply',
    },
    {
        slug: 'digital-marketing-strategies',
        title: 'Digital Marketing Strategies',
        summary: 'Positioning, content systems, and funnel design for B2B and B2G healthcare growth.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCgvZ9yk54CcDlfxEDQXXghRQ6FsbgK0T-ulNZRUGgIhObgolwAPeHszIOflvZl2vHyZy1XSgKZbMIvhoRl655N9GNs96FflaLJuR_PNaubWl3gnNLPxukAl2OSq2nuZjgUqpn_BIEUuWIfcnSjIYdQx0yY1kXNh8Eeykornu6rLRNooM0XZvc-ABcpI9N6GRyrrXIOIF1D8stfS1wPLkQI46-5YZpv6OgBR2cqlVvufrxuCeDP_QIgAerL3hsgyfQKqC-set6bvY',
        registrationHref: '/apply',
    },
];
export const incubatorMentors = [
    {
        id: 'mentor-fadil',
        name: 'Dr. Mohamed El Fadil',
        role: 'Founder Mentor',
        focus: 'Healthcare AI, digital transformation, venture execution',
        availability: 'Weekly live office hours',
        avatarUrl: featuredTrainingCourse.instructor.avatarUrl,
    },
    {
        id: 'mentor-lina',
        name: 'Lina Hassan',
        role: 'Product Systems Coach',
        focus: 'Program dashboards, discovery, and operational design',
        availability: 'Tue / Thu mentoring rooms',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    },
    {
        id: 'mentor-omar',
        name: 'Omar Al Harbi',
        role: 'Data Sharing Advisor',
        focus: 'Interoperability, contracts, D1 catalogs, partner onboarding',
        availability: 'On-demand contract reviews',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    },
];
export const incubatorChatRooms = [
    {
        id: 'mentor-circle',
        name: 'Mentor Circle',
        topic: 'Weekly feedback and founder questions',
        participants: ['Dr. Mohamed El Fadil', 'Lina Hassan', 'Sarah Ahmed'],
        unreadCount: 2,
    },
    {
        id: 'cohort-launch-room',
        name: 'Cohort Launch Room',
        topic: 'Application approvals, milestones, and launch coordination',
        participants: ['Operations Team', 'Founders', 'Automation Bot'],
        unreadCount: 1,
    },
    {
        id: 'data-sharing-lab',
        name: 'Data Sharing Lab',
        topic: 'Shared course assets, contracts, and partner datasets',
        participants: ['Omar Al Harbi', 'Compliance Team', 'Founders'],
        unreadCount: 0,
    },
];
export const incubatorChatMessages = [
    {
        id: 'msg-1',
        roomId: 'mentor-circle',
        senderId: 'mentor-fadil',
        senderName: 'Dr. Mohamed El Fadil',
        direction: 'incoming',
        message: "Let's use the program dashboard this week to connect mentor feedback, the course pack, and the launch sequence into one execution plan.",
        createdAt: '2026-04-18T09:00:00.000Z',
    },
    {
        id: 'msg-2',
        roomId: 'mentor-circle',
        senderId: 'founder-sarah',
        senderName: 'Sarah Ahmed',
        direction: 'outgoing',
        message: 'I also want the shared course bundle linked to our resource library so the team can access it from the dashboard.',
        createdAt: '2026-04-18T09:05:00.000Z',
    },
    {
        id: 'msg-3',
        roomId: 'mentor-circle',
        senderId: 'mentor-lina',
        senderName: 'Lina Hassan',
        direction: 'incoming',
        message: 'Perfect. I added a product review checklist and a milestone reminder automation so that handoff is visible in realtime.',
        createdAt: '2026-04-18T09:08:00.000Z',
        attachmentName: 'launch-checklist.pdf',
        attachmentUrl: '/resources',
    },
    {
        id: 'msg-4',
        roomId: 'cohort-launch-room',
        senderId: 'automation-bot',
        senderName: 'Automation Bot',
        direction: 'incoming',
        message: 'Three new launch tasks were created from the application acceptance workflow.',
        createdAt: '2026-04-18T10:11:00.000Z',
    },
    {
        id: 'msg-5',
        roomId: 'data-sharing-lab',
        senderId: 'mentor-omar',
        senderName: 'Omar Al Harbi',
        direction: 'incoming',
        message: 'The shared Collective Brainpower contract is ready for partner review. We can push it through the data hub after final sign-off.',
        createdAt: '2026-04-18T11:32:00.000Z',
    },
];
export const incubatorEmailAutomations = [
    {
        id: 'automation-application-approved',
        name: 'Application Approved',
        triggerEvent: 'application.approved',
        subject: 'Welcome to the BrainSAIT incubation program',
        recipients: ['founder@brainsait.org', 'ops@brainsait.org'],
        templatePreview: 'Includes program onboarding, mentorship room invite, and resource library access.',
        enabled: true,
        lastTriggeredAt: '2026-04-17T14:10:00.000Z',
        createdAt: '2026-04-17T14:10:00.000Z',
    },
    {
        id: 'automation-course-reminder',
        name: 'Course Reminder',
        triggerEvent: 'training.collective_brainpower.reminder',
        subject: 'Collective Brainpower cohort session starts tomorrow',
        recipients: ['cohort@brainsait.org'],
        templatePreview: 'Shares the classroom link, class code, and required prep resources.',
        enabled: true,
        lastTriggeredAt: '2026-04-16T09:00:00.000Z',
        createdAt: '2026-04-16T09:00:00.000Z',
    },
    {
        id: 'automation-partner-share',
        name: 'Data Share Approval',
        triggerEvent: 'data-share.contract.approved',
        subject: 'Shared course assets approved for partner access',
        recipients: ['partner@brainsait.org', 'datahub@brainsait.org'],
        templatePreview: 'Notifies partner teams when contracts and datasets are available in the data hub.',
        enabled: true,
        createdAt: '2026-04-15T11:30:00.000Z',
    },
];
export const graduationShowcase = [
    {
        year: 'Class of 2023',
        companies: [
            { name: 'EcoBloom', tagline: 'Eco-friendly products for sustainable living', website: 'https://brainsait.org', sector: 'Sustainability', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSNwa6ERF2i0CKOrvdupU9GEyge1-SdOcwx1XizVR4TirDxgbdp5CI5GFJZIMmxya0PhiVzEfjQ_6gkoFsOIW9TGk9obE7KUy4SreO-1BIpOi66qnTGOM60V8fx4cjRKjybWSrlmpFTAlTv8iV0MpflvYEU-DQI7ZVMeDVkeTTf6sWfWbOj5UNkgAXgQZvl7-bix_bhlmgx-kxxnJz0929ZHZM3HAY6l88-dB_SXcRUKSlvRDxv6-v5EYZRxOKaB0Gok5P0-a3JL8' },
            { name: 'TechTrek', tagline: 'Innovative software solutions for businesses', website: 'https://brainsait.org', sector: 'Software', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJH1BqeERukyoANf0AGIrKY6doVCRLp_uPslu4ToentG7U7NPDIjgWTvehGJy6h4IfETznlYTdtr7CkZuPDoerF5yeut-z4dklHzdraUDjACju90yh3lOV8NXhPJPulM6-tVc7NgqjIRqNdMz9Cai6sLo29yaEZls084e2dtDwQqaIsGZbomjWcq--r3keN0dD4V8ylkrm-aXu137I8N96SLiStuO4c8SaeuArOPUl-H--cLkYECFQrAYZwTO3hRl1GBrkFl10P8w' },
            { name: 'HealthHub', tagline: 'Wellness services and health products', website: 'https://brainsait.org', sector: 'Health & Wellness', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA17fFlHHzM4chyJ97VWbmRgGc9V2yS6WOqdc9SzhNidXyv5O-Ievu0PHn6n-xq4EVv7h9iiAAqr6jHcDsdS9MAcFGTfXkVf1j6Y7lfvemxO9yVNVBbco7kX9hQp868dpZMLDDTqnx6mnHPZAF6B1DZy0DNNPPMu_XzKQ7AOeJFK3ip4ZA-rEbtcgutqUyMdhlKG9_dgVIUxZsnIcJ4xbs013pe8zuyK28ipl5ClZ9tlJFV7Hm5LHlCtFSEJPqUcoyVHiXf9eGcLPU' },
        ],
    },
    {
        year: 'Class of 2022',
        companies: [
            { name: 'GreenCycle', tagline: 'Recycling solutions for a greener future', website: 'https://brainsait.org', sector: 'Climate', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIvdcX2-9C7xEXv00fXOJfH4BAjH5hglZZ0El8tYXlE1tz5bMH9LkyNVUXW_AKkySnpn0A-X_WkhfgrPNxHy5llkroLOe5ITWKWfkwAjYGFDk1Kt6bwN26dT4iofPykuzFtUKiCti26jXcUG07P0aDcSk65q_vZgNOcLgHOaIMWZJSfM9u8L89IrSEgzw7Y9KFwOfhzf00B8Hm8RilOSb4za8PCfMIGTMHf86F01ZYSXIUweVPc_P1DU608W_ssGEyYV6Wb814w_I' },
            { name: 'CodeCraft', tagline: 'Custom software development services', website: 'https://brainsait.org', sector: 'Engineering', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9d0rAsprYyeK-TjHgW_V0ihX8pVlYD6lf6V0ci6z8Qi0wkOf-xByfBwscvg7-KJJyte8C07IjkyQNYn4z9igWWcefgMnBAMJ6S9iBCzO7HeZOcxWVbXD6IK-XMCjX7MQSOywipr773GuiQBZonypplTucGpZ0ugyyPp7HUL5ZjtA6uDYRZ6w3Zf0LI0tnhujTKpM_BBwDb_muHjfk82yHOfHR-lyYqVuWkY3khTlR-42OOlJiQDiqaf-T0Gj4jlgMwtSaHmPfNag' },
            { name: 'CreativeWorks', tagline: 'Art and design studio', website: 'https://brainsait.org', sector: 'Creative', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAD1pGobQdl5lj1cyz5DTmTAXBsIBWX30JERFgTbpPpsIhEWDtBSKdVVon1x48b2vLehtAu1ARoFU6-Db3UB5OvLU82Z0h9PsTr7AFaKC-DibhopHR5M1uP1sSM5Df1JKxwXsmsLjxc2jO7FK8skupk2wf7U1vJ2IdRL7V1pm5BUJn90GL9_J22vL-nZMu4HhQFZnsJSXbqJcrWUoa5k_0vJFLJlPDDoSW6bElBK5dxj-ixnjNXF3UDAs5IhjwEfYZB4eYmfDlV95Y' },
        ],
    },
];
export const incubatorCourses = [
    {
        ...featuredTrainingCourse,
        sharedAssetId: 'collective-brainpower-course-pack',
        resourceSlugs: ['collective-brainpower-bundle', 'market-research-guide', 'startup-ops-toolkit'],
    },
];
export const sharedCourseContracts = [
    {
        slug: 'collective-brainpower-share',
        title: 'Collective Brainpower Shared Course Contract',
        summary: 'Controls access to course assets, cohort materials, and shared implementation documents via the data hub.',
        dataSource: 'brainsait://courses/collective-brainpower',
        accessLevel: 'Partner Review',
        ctaLabel: 'Request access',
    },
    {
        slug: 'mentor-feedback-loop',
        title: 'Mentor Feedback Loop Contract',
        summary: 'Defines how mentor notes, milestone updates, and readiness scores can be shared across program systems.',
        dataSource: 'brainsait://program/mentor-feedback',
        accessLevel: 'Internal',
        ctaLabel: 'View details',
    },
];
export function getIncubatorAppBySlug(slug) {
    return incubatorApps.find((app) => app.slug === slug);
}
export function getIncubatorAppsByCategory(category) {
    return incubatorApps.filter((app) => app.category === category);
}
export function getIncubatorCategoryBySlug(slug) {
    return incubatorAppCategories.find((category) => category.slug === slug);
}
export function getFeaturedResources() {
    return incubatorResources.filter((resource) => resource.featured);
}
export function getCourseBundleBySlug(slug) {
    return incubatorCourses.find((course) => course.slug === slug);
}
//# sourceMappingURL=incubator.js.map