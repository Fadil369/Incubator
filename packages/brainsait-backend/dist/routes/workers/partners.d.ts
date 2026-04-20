/**
 * Partner Lifecycle Management Routes
 *
 * Covers the full partner journey from application receipt to incubator access:
 *
 *  POST  /api/v1/partners/application              — Receive application (webhook from brainsait-org or direct)
 *  GET   /api/v1/partners/applications             — Admin: list applications (requires X-Admin-Key)
 *  GET   /api/v1/partners/applications/:id         — Admin: get one application
 *  POST  /api/v1/partners/applications/:id/accept  — Admin: accept → generate magic link → send email + provision GitHub repo
 *  POST  /api/v1/partners/applications/:id/reject  — Admin: reject → send rejection email
 *  GET   /api/v1/partners/validate?token=xxx       — Validate invitation token, return partner info
 *  POST  /api/v1/partners/complete-onboarding      — Partner completes onboarding and persists profile details after clicking magic link
 */
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ONBOARDED';
export interface PartnerApplication {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    organization: string;
    country: string;
    partnerType: string;
    description: string;
    status: ApplicationStatus;
    referenceId: string;
    inviteToken?: string;
    inviteSentAt?: string;
    acceptedAt?: string;
    rejectedAt?: string;
    onboardedAt?: string;
    startupSlug?: string;
    timezone?: string;
    linkedIn?: string;
    passwordHash?: string;
    githubRepo?: string;
    createdAt: string;
    updatedAt: string;
}
declare const partners: any;
export default partners;
//# sourceMappingURL=partners.d.ts.map