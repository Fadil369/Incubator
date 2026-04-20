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
}
export declare const trainingCourses: TrainingCourse[];
export declare const featuredTrainingCourse: TrainingCourse;
export declare function getTrainingCourseBySlug(slug: string): TrainingCourse | undefined;
//# sourceMappingURL=training.d.ts.map