import { PrismaClient } from '@prisma/client';
import express, { Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

// Healthcare SME Profile Schema
const HealthcareSMESchema = z.object({
  specialization: z.enum([
    'CARDIOLOGY',
    'NEUROLOGY', 
    'ONCOLOGY',
    'PEDIATRICS',
    'PSYCHIATRY',
    'SURGERY',
    'EMERGENCY_MEDICINE',
    'INTERNAL_MEDICINE',
    'RADIOLOGY',
    'PATHOLOGY',
    'ANESTHESIOLOGY',
    'DERMATOLOGY',
    'OPHTHALMOLOGY',
    'ORTHOPEDICS',
    'GYNECOLOGY',
    'UROLOGY',
    'ENT',
    'REHABILITATION',
    'PHARMACY',
    'NURSING',
    'ADMINISTRATION',
    'RESEARCH',
    'PUBLIC_HEALTH',
    'HEALTH_INFORMATICS'
  ]),
  yearsOfExperience: z.number().min(0).max(60),
  currentPosition: z.string().min(2).max(200),
  institution: z.string().min(2).max(200),
  licenseNumber: z.string().min(3).max(50),
  licenseCountry: z.string().min(2).max(2), // ISO country code
  certifications: z.array(z.string()).optional(),
  researchInterests: z.array(z.string()).optional(),
  publications: z.array(z.object({
    title: z.string(),
    journal: z.string(),
    year: z.number(),
    doi: z.string().optional(),
    pubmedId: z.string().optional()
  })).optional(),
  aiExperienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  interestedAIApplications: z.array(z.enum([
    'DIAGNOSTIC_ASSISTANCE',
    'TREATMENT_PLANNING',
    'DRUG_DISCOVERY',
    'MEDICAL_IMAGING',
    'CLINICAL_DECISION_SUPPORT',
    'PATIENT_MONITORING',
    'PREDICTIVE_ANALYTICS',
    'NATURAL_LANGUAGE_PROCESSING',
    'ROBOTIC_SURGERY',
    'TELEMEDICINE',
    'HEALTH_RECORDS_MANAGEMENT',
    'RESEARCH_AUTOMATION',
    'QUALITY_ASSURANCE',
    'WORKFLOW_OPTIMIZATION'
  ])),
  preferredLanguages: z.array(z.enum(['EN', 'AR', 'FR', 'ES', 'DE', 'JA', 'ZH'])),
  timeZone: z.string(),
  availabilityForMentoring: z.boolean().default(false),
  willingToShareCaseStudies: z.boolean().default(false),
  privacyConsent: z.boolean(),
  termsAccepted: z.boolean()
});

const OnboardingSurveySchema = z.object({
  currentChallenges: z.array(z.enum([
    'TIME_CONSTRAINTS',
    'INFORMATION_OVERLOAD',
    'DIAGNOSTIC_UNCERTAINTY',
    'TREATMENT_DECISIONS',
    'PATIENT_COMMUNICATION',
    'ADMINISTRATIVE_BURDEN',
    'RESEARCH_ACCESS',
    'CONTINUING_EDUCATION',
    'TECHNOLOGY_ADOPTION',
    'COST_MANAGEMENT',
    'QUALITY_METRICS',
    'REGULATORY_COMPLIANCE'
  ])),
  expectedAIBenefits: z.array(z.enum([
    'FASTER_DIAGNOSIS',
    'IMPROVED_ACCURACY',
    'REDUCED_WORKLOAD',
    'BETTER_OUTCOMES',
    'COST_REDUCTION',
    'ENHANCED_RESEARCH',
    'PERSONALIZED_TREATMENT',
    'PREDICTIVE_INSIGHTS',
    'WORKFLOW_AUTOMATION',
    'DECISION_SUPPORT',
    'PATIENT_ENGAGEMENT',
    'PROFESSIONAL_DEVELOPMENT'
  ])),
  implementationConcerns: z.array(z.enum([
    'DATA_PRIVACY',
    'ALGORITHMIC_BIAS',
    'RELIABILITY',
    'COST',
    'TRAINING_REQUIREMENTS',
    'INTEGRATION_COMPLEXITY',
    'REGULATORY_APPROVAL',
    'PATIENT_ACCEPTANCE',
    'STAFF_RESISTANCE',
    'TECHNICAL_SUPPORT',
    'MAINTENANCE',
    'LIABILITY_ISSUES'
  ])),
  preferredLearningFormats: z.array(z.enum([
    'INTERACTIVE_TUTORIALS',
    'VIDEO_COURSES',
    'HANDS_ON_WORKSHOPS',
    'CASE_STUDIES',
    'PEER_DISCUSSIONS',
    'EXPERT_WEBINARS',
    'DOCUMENTATION',
    'SIMULATION_ENVIRONMENTS',
    'MENTORSHIP_PROGRAMS',
    'CONFERENCE_PRESENTATIONS'
  ])),
  availableTimePerWeek: z.enum(['LESS_THAN_1_HOUR', '1_3_HOURS', '3_5_HOURS', '5_10_HOURS', 'MORE_THAN_10_HOURS']),
  organizationalReadiness: z.object({
    hasAIStrategy: z.boolean(),
    hasTechnicalTeam: z.boolean(),
    hasDataInfrastructure: z.boolean(),
    hasChangeManagement: z.boolean(),
    hasEthicsGuidelines: z.boolean()
  })
});

// Register healthcare SME
router.post('/register', validateRequest(HealthcareSMESchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const smeData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if SME profile already exists
    const existingSME = await prisma.healthcareSME.findUnique({
      where: { userId }
    });

    if (existingSME) {
      return res.status(400).json({ error: 'Healthcare SME profile already exists' });
    }

    // Validate license number format based on country
    const licenseValidation = validateLicenseNumber(smeData.licenseNumber, smeData.licenseCountry);
    if (!licenseValidation.valid) {
      return res.status(400).json({ error: licenseValidation.message });
    }

    // Create SME profile
    const sme = await prisma.healthcareSME.create({
      data: {
        userId,
        ...smeData,
        status: 'PENDING_VERIFICATION',
        verificationRequestedAt: new Date()
      }
    });

    // Create AI Champion profile if applicable
    if (smeData.aiExperienceLevel === 'ADVANCED' || smeData.aiExperienceLevel === 'EXPERT') {
      await prisma.aIChampion.create({
        data: {
          userId,
          healthcareSMEId: sme.id,
          department: smeData.specialization,
          level: smeData.aiExperienceLevel === 'EXPERT' ? 'SENIOR' : 'JUNIOR',
          mentorshipCapacity: smeData.availabilityForMentoring ? 5 : 0,
          specializations: smeData.interestedAIApplications
        }
      });
    }

    // Send verification email
    await sendVerificationEmail(sme);

    res.status(201).json({
      message: 'Healthcare SME profile created successfully',
      smeId: sme.id,
      status: sme.status
    });

  } catch (error) {
    console.error('Error creating healthcare SME profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit onboarding survey
router.post('/onboarding-survey', authenticate, validateRequest(OnboardingSurveySchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const surveyData = req.body;
    const userId = req.user?.id;

    // Find SME profile
    const sme = await prisma.healthcareSME.findUnique({
      where: { userId }
    });

    if (!sme) {
      return res.status(404).json({ error: 'Healthcare SME profile not found' });
    }

    // Save survey responses
    const survey = await prisma.onboardingSurvey.create({
      data: {
        healthcareSMEId: sme.id,
        ...surveyData
      }
    });

    // Generate personalized learning path
    const learningPath = await generateLearningPath(sme, surveyData);

    // Update SME status to active
    await prisma.healthcareSME.update({
      where: { id: sme.id },
      data: { 
        status: 'ACTIVE',
        onboardingCompletedAt: new Date()
      }
    });

    res.json({
      message: 'Onboarding survey completed successfully',
      learningPath,
      nextSteps: await getNextSteps(sme, surveyData)
    });

  } catch (error) {
    console.error('Error processing onboarding survey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get SME profile
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const sme = await prisma.healthcareSME.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        },
        onboardingSurveys: true,
        aiChampion: true,
        learningProgress: true,
        casesShared: true
      }
    });

    if (!sme) {
      return res.status(404).json({ error: 'Healthcare SME profile not found' });
    }

    res.json(sme);

  } catch (error) {
    console.error('Error fetching SME profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update SME profile
router.put('/profile', authenticate, validateRequest(HealthcareSMESchema.partial()), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const updateData = req.body;

    const sme = await prisma.healthcareSME.findUnique({
      where: { userId }
    });

    if (!sme) {
      return res.status(404).json({ error: 'Healthcare SME profile not found' });
    }

    const updatedSME = await prisma.healthcareSME.update({
      where: { id: sme.id },
      data: updateData
    });

    res.json(updatedSME);

  } catch (error) {
    console.error('Error updating SME profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get learning recommendations
router.get('/learning-recommendations', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const sme = await prisma.healthcareSME.findUnique({
      where: { userId },
      include: {
        onboardingSurveys: true,
        learningProgress: true
      }
    });

    if (!sme) {
      return res.status(404).json({ error: 'Healthcare SME profile not found' });
    }

    const recommendations = await generateLearningRecommendations(sme);

    res.json(recommendations);

  } catch (error) {
    console.error('Error generating learning recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function validateLicenseNumber(licenseNumber: string, country: string): { valid: boolean; message?: string } {
  // Basic validation - extend with country-specific patterns
  const patterns: Record<string, RegExp> = {
    'SA': /^[0-9]{6,10}$/, // Saudi Arabia
    'US': /^[A-Z0-9]{8,15}$/, // United States
    'CA': /^[0-9]{5,9}$/, // Canada
    'GB': /^[A-Z0-9]{7,10}$/, // United Kingdom
    'AU': /^[A-Z]{3}[0-9]{7}$/, // Australia
  };

  const pattern = patterns[country];
  if (!pattern) {
    return { valid: true }; // Allow if no pattern defined
  }

  if (!pattern.test(licenseNumber)) {
    return {
      valid: false,
      message: `Invalid license number format for ${country}`
    };
  }

  return { valid: true };
}

async function sendVerificationEmail(sme: { id: string; [key: string]: unknown }) {
  // Implementation would send verification email
  // logger.info('Verification email sent', { smeId: sme.id });
  void sme;
}

async function generateLearningPath(sme: any, survey: any) {
  // AI-powered learning path generation based on profile and survey
  const modules = [];

  // Basic AI fundamentals if beginner
  if (sme.aiExperienceLevel === 'BEGINNER') {
    modules.push({
      id: 'ai-fundamentals',
      title: 'AI Fundamentals for Healthcare',
      estimatedHours: 8,
      priority: 'HIGH'
    });
  }

  // Specialization-specific modules
  if (sme.specialization === 'RADIOLOGY') {
    modules.push({
      id: 'medical-imaging-ai',
      title: 'AI in Medical Imaging',
      estimatedHours: 12,
      priority: 'HIGH'
    });
  }

  // Add modules based on interested applications
  survey.expectedAIBenefits.forEach((benefit: string) => {
    switch (benefit) {
      case 'FASTER_DIAGNOSIS':
        modules.push({
          id: 'diagnostic-ai',
          title: 'AI-Assisted Diagnosis',
          estimatedHours: 10,
          priority: 'MEDIUM'
        });
        break;
      case 'PREDICTIVE_INSIGHTS':
        modules.push({
          id: 'predictive-analytics',
          title: 'Healthcare Predictive Analytics',
          estimatedHours: 14,
          priority: 'MEDIUM'
        });
        break;
    }
  });

  return {
    totalModules: modules.length,
    estimatedCompletionWeeks: Math.ceil(modules.reduce((sum, m) => sum + m.estimatedHours, 0) / 5),
    modules: modules.slice(0, 10) // Limit to top 10 modules
  };
}

async function generateLearningRecommendations(sme: any) {
  // AI-powered personalized recommendations
  return {
    nextModule: {
      id: 'clinical-decision-support',
      title: 'Clinical Decision Support Systems',
      reason: 'Based on your interest in diagnostic assistance',
      estimatedHours: 6
    },
    trending: [
      {
        id: 'llm-healthcare',
        title: 'Large Language Models in Healthcare',
        popularity: 95
      }
    ],
    peerRecommendations: [
      {
        id: 'ai-ethics',
        title: 'AI Ethics in Healthcare',
        recommendedBy: 'Dr. Sarah Al-Mahmoud'
      }
    ]
  };
}

async function getNextSteps(sme: any, survey: any) {
  return [
    {
      step: 1,
      title: 'Complete AI Fundamentals Module',
      description: 'Start with the basics of AI in healthcare',
      estimatedTime: '2-3 hours'
    },
    {
      step: 2,
      title: 'Join Peer Discussion Group',
      description: 'Connect with other healthcare professionals',
      estimatedTime: '30 minutes'
    },
    {
      step: 3,
      title: 'Explore Case Studies',
      description: 'Review real-world AI implementations',
      estimatedTime: '1 hour'
    }
  ];
}

export default router;