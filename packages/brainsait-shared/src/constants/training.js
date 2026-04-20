export const trainingCourses = [
    {
        slug: 'collective-brainpower',
        badge: 'Registration Now Open',
        title: 'Master the Intersection of Healthcare, Tech & AI',
        subtitle: 'Join an exclusive collective brainpower program designed to deliver solutions that are automated, integrated, and technology-driven.',
        summary: 'A premium BrainSAIT course for healthcare founders, operators, and innovators building the next wave of digital health transformation.',
        description: 'This course brings together healthcare strategy, digital transformation, artificial intelligence, and entrepreneurship into one practical learning track. It is designed for ambitious teams who need to move from fragmented ideas to automated systems, interoperable platforms, and scalable growth.',
        duration: 'Cohort-based with self-paced materials',
        format: 'Google Classroom + guided implementation',
        level: 'Founders, operators, and innovation teams',
        classroomUrl: 'https://classroom.google.com/c/ODYwNTAyNzAzMTky?cjc=4oc22gvm',
        classroomCode: '4oc22gvm',
        focusAreas: [
            {
                icon: 'automation',
                title: 'Automated Solutions',
                description: 'Leverage artificial intelligence and machine learning to streamline clinical and operational workflows efficiently.',
            },
            {
                icon: 'integration',
                title: 'Integrated Systems',
                description: 'Bridge healthcare requirements and business strategy through seamless interoperability and digital architecture.',
            },
            {
                icon: 'growth',
                title: 'Tech-Driven Growth',
                description: 'Master the entrepreneurial mindset needed to scale innovative health-tech ventures across regional and global markets.',
            },
        ],
        curriculum: [
            {
                title: 'Collective Brainpower Foundations',
                description: 'Build a decision-making model that aligns physicians, operators, founders, and technical teams around a shared digital roadmap.',
            },
            {
                title: 'Automation in Healthcare Operations',
                description: 'Identify high-leverage automation opportunities across patient journeys, compliance workflows, analytics, and back-office execution.',
            },
            {
                title: 'Integrated Digital Health Systems',
                description: 'Design interoperable systems that connect clinical requirements, data contracts, AI services, and business processes.',
            },
            {
                title: 'AI Strategy for Health-Tech Growth',
                description: 'Translate AI capabilities into product strategy, founder positioning, and scalable market execution for healthcare ventures.',
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
            bio: 'Dr. Mohamed El Fadil operates at the intersection of healthcare, business, and technology. He focuses on artificial intelligence, digital transformation, and innovation systems that convert collective expertise into practical, scalable products.',
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
export function getTrainingCourseBySlug(slug) {
    return trainingCourses.find((course) => course.slug === slug);
}
//# sourceMappingURL=training.js.map