import { type TrainingCourse } from './training';
export interface AppCategory {
    slug: string;
    title: string;
    description: string;
    highlight: string;
    imageUrl: string;
}
export interface AppFeature {
    icon: string;
    title: string;
    description: string;
}
export interface AppScreenshot {
    title: string;
    imageUrl: string;
}
export interface AppPricingTier {
    name: string;
    price: string;
    ctaLabel: string;
    featured?: boolean;
    features: string[];
}
export interface IncubatorApp {
    slug: string;
    name: string;
    category: string;
    startup: string;
    shortDescription: string;
    description: string;
    tagline: string;
    githubUrl: string;
    demoUrl?: string;
    installEvent: string;
    tags: string[];
    compliance: string[];
    metrics: Array<{
        label: string;
        value: string;
    }>;
    features: AppFeature[];
    screenshots: AppScreenshot[];
    pricingTiers: AppPricingTier[];
}
export interface ResourceItem {
    slug: string;
    title: string;
    summary: string;
    category: string;
    type: 'article' | 'template' | 'workshop' | 'course' | 'contract';
    imageUrl: string;
    ctaLabel: string;
    ctaHref: string;
    tags: string[];
    featured?: boolean;
}
export interface ResourceWorkshop {
    slug: string;
    title: string;
    summary: string;
    imageUrl: string;
    registrationHref: string;
}
export interface MentorProfile {
    id: string;
    name: string;
    role: string;
    focus: string;
    availability: string;
    avatarUrl: string;
}
export interface CollaborationRoom {
    id: string;
    name: string;
    topic: string;
    participants: string[];
    unreadCount: number;
}
export interface CollaborationMessage {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    direction: 'incoming' | 'outgoing';
    message: string;
    createdAt: string;
    attachmentName?: string;
    attachmentUrl?: string;
}
export interface EmailAutomationConfig {
    id: string;
    name: string;
    triggerEvent: string;
    subject: string;
    recipients: string[];
    templatePreview: string;
    enabled: boolean;
    lastTriggeredAt?: string;
    createdAt?: string;
}
export interface ShowcaseCompany {
    name: string;
    tagline: string;
    website: string;
    sector: string;
    imageUrl: string;
}
export interface ShowcaseCohort {
    year: string;
    companies: ShowcaseCompany[];
}
export interface SharedCourseBundle extends TrainingCourse {
    sharedAssetId: string;
    resourceSlugs: string[];
}
export interface SharedDataContract {
    slug: string;
    title: string;
    summary: string;
    dataSource: string;
    accessLevel: string;
    ctaLabel: string;
}
export interface ResourceLibraryPayload {
    resources: ResourceItem[];
    workshops: ResourceWorkshop[];
    courses: SharedCourseBundle[];
    sharedContracts: SharedDataContract[];
}
export interface AppCatalogPayload {
    categories: AppCategory[];
    apps: IncubatorApp[];
}
export interface ContentSubscription {
    id: string;
    source: string;
    target: string;
    contractRef: string;
    dataTypes: string[];
    status: string;
    createdAt: string;
}
export declare const incubatorRouteCards: readonly [{
    readonly title: "Resources Library";
    readonly description: "Templates, workshops, contracts, and the shared course bundle in one searchable workspace.";
    readonly href: "/resources";
}, {
    readonly title: "Mentorship Hub";
    readonly description: "Live cohort rooms, mentor threads, and notification-driven check-ins backed by Cloudflare realtime.";
    readonly href: "/mentorship";
}, {
    readonly title: "App Marketplace";
    readonly description: "Deployable healthcare workflows, automation bundles, and GitHub-backed starter products.";
    readonly href: "/app-store";
}, {
    readonly title: "Graduation Showcase";
    readonly description: "A curated public view of startups, product launches, and cohort outcomes.";
    readonly href: "/showcase";
}];
export declare const incubatorAppCategories: AppCategory[];
export declare const incubatorApps: IncubatorApp[];
export declare const incubatorResources: ResourceItem[];
export declare const incubatorWorkshops: ResourceWorkshop[];
export declare const incubatorMentors: MentorProfile[];
export declare const incubatorChatRooms: CollaborationRoom[];
export declare const incubatorChatMessages: CollaborationMessage[];
export declare const incubatorEmailAutomations: EmailAutomationConfig[];
export declare const graduationShowcase: ShowcaseCohort[];
export declare const incubatorCourses: SharedCourseBundle[];
export declare const sharedCourseContracts: SharedDataContract[];
export declare function getIncubatorAppBySlug(slug: string): IncubatorApp | undefined;
export declare function getIncubatorAppsByCategory(category: string): IncubatorApp[];
export declare function getIncubatorCategoryBySlug(slug: string): AppCategory | undefined;
export declare function getFeaturedResources(): ResourceItem[];
export declare function getCourseBundleBySlug(slug: string): SharedCourseBundle | undefined;
//# sourceMappingURL=incubator.d.ts.map