export declare enum ProgramType {
    INCUBATION = "INCUBATION",
    ACCELERATION = "ACCELERATION",
    MENTORSHIP = "MENTORSHIP",
    WORKSHOP = "WORKSHOP",
    MASTERCLASS = "MASTERCLASS"
}
export declare enum ProgramStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum EnrollmentStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    WITHDRAWN = "WITHDRAWN",
    REJECTED = "REJECTED"
}
export declare enum MentorshipStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum SessionStatus {
    SCHEDULED = "SCHEDULED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    NO_SHOW = "NO_SHOW"
}
export interface Program {
    id: string;
    title: string;
    titleAr?: string;
    description: string;
    descriptionAr?: string;
    type: ProgramType;
    duration: number;
    maxParticipants: number;
    currentParticipants: number;
    status: ProgramStatus;
    startDate?: Date;
    endDate?: Date;
    cost?: number;
    requirements?: ProgramRequirement[];
    curriculum?: CurriculumModule[];
    resources?: Resource[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ProgramRequirement {
    id: string;
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    mandatory: boolean;
    type: 'document' | 'experience' | 'certification' | 'other';
}
export interface CurriculumModule {
    id: string;
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    duration: number;
    order: number;
    sessions: Session[];
    assignments?: Assignment[];
}
export interface Session {
    id: string;
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    duration: number;
    type: 'lecture' | 'workshop' | 'discussion' | 'practical';
    instructor?: string;
    resources?: Resource[];
}
export interface Assignment {
    id: string;
    title: string;
    titleAr?: string;
    description: string;
    descriptionAr?: string;
    dueDate: Date;
    maxScore: number;
    submissionFormat: 'document' | 'presentation' | 'online' | 'practical';
}
export interface Resource {
    id: string;
    name: string;
    nameAr?: string;
    type: 'document' | 'video' | 'link' | 'tool' | 'template';
    url: string;
    description?: string;
    descriptionAr?: string;
    size?: number;
}
export interface ProgramEnrollment {
    id: string;
    smeId: string;
    programId: string;
    status: EnrollmentStatus;
    progress: number;
    completedModules: string[];
    currentModule?: string;
    completedAt?: Date;
    enrolledAt: Date;
    updatedAt: Date;
}
export interface Mentorship {
    id: string;
    smeId: string;
    mentorId: string;
    status: MentorshipStatus;
    startDate?: Date;
    endDate?: Date;
    sessionCount: number;
    totalHours: number;
    goals?: string[];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface MentorSession {
    id: string;
    mentorshipId: string;
    scheduledAt: Date;
    duration: number;
    status: SessionStatus;
    agenda?: string;
    notes?: string;
    feedback?: string;
    rating?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateProgramRequest {
    title: string;
    titleAr?: string;
    description: string;
    descriptionAr?: string;
    type: ProgramType;
    duration: number;
    maxParticipants: number;
    cost?: number;
    requirements?: Omit<ProgramRequirement, 'id'>[];
}
export interface UpdateProgramRequest {
    title?: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    maxParticipants?: number;
    cost?: number;
    status?: ProgramStatus;
}
export interface EnrollProgramRequest {
    programId: string;
    smeId: string;
    documents?: string[];
}
//# sourceMappingURL=program.types.d.ts.map