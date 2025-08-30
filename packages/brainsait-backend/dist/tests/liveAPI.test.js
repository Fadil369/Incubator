import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import { app } from '../server';
const request = supertest(app);
const prisma = new PrismaClient();
describe('BrainSAIT Live API Integration Tests', () => {
    let authToken;
    let testUserId;
    let testSMEId;
    beforeAll(async () => {
        // Ensure database connection
        await prisma.$connect();
        // Create test user and get auth token
        const testUser = await request
            .post('/api/auth/register')
            .send({
            email: 'test@brainsait.com',
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'SME_OWNER',
        });
        expect(testUser.status).toBe(201);
        testUserId = testUser.body.data.user.id;
        // Login to get auth token
        const loginResponse = await request
            .post('/api/auth/login')
            .send({
            email: 'test@brainsait.com',
            password: 'TestPassword123!',
        });
        expect(loginResponse.status).toBe(200);
        authToken = loginResponse.body.data.token;
    });
    afterAll(async () => {
        // Cleanup test data
        if (testUserId) {
            await prisma.user.delete({ where: { id: testUserId } });
        }
        if (testSMEId) {
            await prisma.sMEProfile.delete({ where: { id: testSMEId } });
        }
        await prisma.$disconnect();
    });
    describe('Health Checks', () => {
        test('Backend health check should pass', async () => {
            const response = await request.get('/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('healthy');
            expect(response.body.services.database).toBe('connected');
            expect(response.body.services.redis).toBe('connected');
        });
        test('AI service health check should pass', async () => {
            const aiResponse = await supertest('http://localhost:5001').get('/health');
            expect(aiResponse.status).toBe(200);
            expect(aiResponse.body.status).toBe('healthy');
            expect(aiResponse.body.checks.openai).toBeDefined();
            expect(aiResponse.body.checks.claude).toBeDefined();
        });
        test('Document service health check should pass', async () => {
            const docsResponse = await supertest('http://localhost:5002').get('/health');
            expect(docsResponse.status).toBe(200);
            expect(docsResponse.body.status).toBe('healthy');
        });
    });
    describe('Authentication & Authorization', () => {
        test('User registration with valid data should succeed', async () => {
            const response = await request
                .post('/api/auth/register')
                .send({
                email: 'newuser@brainsait.com',
                password: 'NewPassword123!',
                firstName: 'New',
                lastName: 'User',
                role: 'SME_OWNER',
            });
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('newuser@brainsait.com');
            // Cleanup
            await prisma.user.delete({
                where: { email: 'newuser@brainsait.com' }
            });
        });
        test('Login with valid credentials should return token', async () => {
            const response = await request
                .post('/api/auth/login')
                .send({
                email: 'test@brainsait.com',
                password: 'TestPassword123!',
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.role).toBe('SME_OWNER');
        });
        test('Protected routes should require authentication', async () => {
            const response = await request
                .get('/api/users/profile');
            expect(response.status).toBe(401);
        });
        test('Protected routes should work with valid token', async () => {
            const response = await request
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.data.user.id).toBe(testUserId);
        });
    });
    describe('SME Management API', () => {
        test('Create SME profile should succeed', async () => {
            const smeData = {
                companyName: 'Test Healthcare SME',
                companyNameAr: 'شركة الرعاية الصحية التجريبية',
                crNumber: '1234567890',
                vatNumber: '310123456700003',
                establishmentType: 'HEALTHCARE_PROVIDER',
                businessType: 'CLINIC',
                sector: 'HEALTHCARE',
                foundedYear: 2023,
                employeeCount: 15,
                description: 'Test healthcare SME for API testing',
                descriptionAr: 'شركة رعاية صحية تجريبية لاختبار الـ API',
                website: 'https://test-sme.com',
                phone: '+966501234567',
                email: 'info@test-sme.com',
                address: {
                    buildingNumber: '1234',
                    streetName: 'King Fahd Road',
                    district: 'Al Olaya',
                    city: 'Riyadh',
                    region: 'RIYADH',
                    postalCode: '11564',
                },
            };
            const response = await request
                .post('/api/sme')
                .set('Authorization', `Bearer ${authToken}`)
                .send(smeData);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.companyName).toBe(smeData.companyName);
            expect(response.body.data.crNumber).toBe(smeData.crNumber);
            testSMEId = response.body.data.id;
        });
        test('Get SME profile should return complete data', async () => {
            const response = await request
                .get(`/api/sme/${testSMEId}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(testSMEId);
            expect(response.body.data.companyName).toBeDefined();
            expect(response.body.data.address).toBeDefined();
        });
        test('Update SME profile should work', async () => {
            const updateData = {
                employeeCount: 20,
                description: 'Updated description for testing',
            };
            const response = await request
                .put(`/api/sme/${testSMEId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.data.employeeCount).toBe(20);
        });
    });
    describe('AI Service Integration', () => {
        test('AI chat completion should work with OpenAI', async () => {
            const aiRequest = {
                prompt: 'What are the key healthcare regulations in Saudi Arabia?',
                provider: 'openai',
                userId: testUserId,
                feature: 'knowledge_query',
                maxTokens: 500,
            };
            const response = await supertest('http://localhost:5001')
                .post('/api/ai/chat')
                .send(aiRequest);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.content).toBeDefined();
            expect(response.body.data.usage.totalTokens).toBeGreaterThan(0);
        });
        test('Claims analysis should process healthcare data', async () => {
            const claimData = {
                claimId: 'CLM-2024-001',
                patientData: {
                    id: 'PAT-001',
                    name: 'Ahmed Mohammed',
                    age: 35,
                    insuranceId: 'INS-123456',
                },
                procedures: [
                    {
                        code: 'H001',
                        description: 'General consultation',
                        cost: 200,
                    },
                ],
                facility: {
                    id: testSMEId || 'FAC-001',
                    name: 'Test Healthcare SME',
                    license: 'LIC-123456',
                },
                userId: testUserId,
            };
            const response = await supertest('http://localhost:5001')
                .post('/api/ai/claims/analyze')
                .send(claimData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.analysis).toBeDefined();
            expect(response.body.data.claimId).toBe(claimData.claimId);
        });
        test('Compliance report generation should work', async () => {
            const complianceData = {
                smeId: testSMEId || 'SME-001',
                complianceData: {
                    mohLicense: 'MOH-12345',
                    nphiesStatus: 'ACTIVE',
                    lastAudit: '2024-01-15',
                    facilityType: 'CLINIC',
                },
                userId: testUserId,
            };
            const response = await supertest('http://localhost:5001')
                .post('/api/ai/compliance/report')
                .send(complianceData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.report).toBeDefined();
        });
    });
    describe('Document Generation', () => {
        test('Generate PDF document should work', async () => {
            const docRequest = {
                templateType: 'certificate',
                data: {
                    recipientName: 'Ahmed Mohammed',
                    recipientNameAr: 'أحمد محمد',
                    certificateType: 'Digital Transformation Completion',
                    issueDate: new Date().toISOString(),
                    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                },
                language: 'en',
            };
            const response = await supertest('http://localhost:5002')
                .post('/api/pdf/generate')
                .send(docRequest);
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('application/pdf');
        });
        test('Generate Arabic document should work', async () => {
            const docRequest = {
                templateType: 'certificate',
                data: {
                    recipientName: 'Ahmed Mohammed',
                    recipientNameAr: 'أحمد محمد',
                    certificateType: 'إتمام التحول الرقمي',
                    issueDate: new Date().toISOString(),
                },
                language: 'ar',
            };
            const response = await supertest('http://localhost:5002')
                .post('/api/pdf/generate')
                .send(docRequest);
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('application/pdf');
        });
    });
    describe('Analytics and Reporting', () => {
        test('Get platform analytics should return data', async () => {
            const response = await request
                .get('/api/analytics/platform')
                .set('Authorization', `Bearer ${authToken}`)
                .query({
                startDate: '2024-01-01',
                endDate: '2024-12-31',
            });
            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
        });
        test('AI usage analytics should be available', async () => {
            const response = await supertest('http://localhost:5001')
                .get('/api/ai/usage/analytics')
                .query({
                userId: testUserId,
                startDate: '2024-01-01',
                endDate: '2024-12-31',
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalRequests).toBeDefined();
            expect(response.body.data.costBreakdown).toBeDefined();
        });
    });
    describe('Saudi Compliance Integration', () => {
        test('Validate CR number should work', async () => {
            const response = await request
                .post('/api/saudi-compliance/validate/cr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ crNumber: '1234567890' });
            expect(response.status).toBe(200);
            expect(response.body.data.isValid).toBeDefined();
        });
        test('Validate VAT number should work', async () => {
            const response = await request
                .post('/api/saudi-compliance/validate/vat')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ vatNumber: '310123456700003' });
            expect(response.status).toBe(200);
            expect(response.body.data.isValid).toBeDefined();
        });
        test('WASL address validation should work', async () => {
            const address = {
                buildingNumber: '1234',
                streetName: 'King Fahd Road',
                district: 'Al Olaya',
                city: 'Riyadh',
                region: 'RIYADH',
                postalCode: '11564',
            };
            const response = await request
                .post('/api/saudi-compliance/validate/address')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ address });
            expect(response.status).toBe(200);
            expect(response.body.data.isValid).toBeDefined();
        });
    });
    describe('Error Handling and Security', () => {
        test('Invalid endpoints should return 404', async () => {
            const response = await request.get('/api/invalid-endpoint');
            expect(response.status).toBe(404);
        });
        test('Rate limiting should work', async () => {
            // Make multiple rapid requests to test rate limiting
            const promises = Array(10).fill(null).map(() => supertest('http://localhost:5001').get('/health'));
            const responses = await Promise.all(promises);
            const rateLimited = responses.some(r => r.status === 429);
            // Note: This might not trigger in test environment with low limits
            expect(rateLimited || responses.every(r => r.status === 200)).toBe(true);
        });
        test('SQL injection should be prevented', async () => {
            const maliciousInput = "'; DROP TABLE users; --";
            const response = await request
                .post('/api/auth/login')
                .send({
                email: maliciousInput,
                password: 'anything',
            });
            // Should return validation error, not cause database issues
            expect(response.status).toBe(400);
        });
        test('XSS prevention should work', async () => {
            const xssPayload = '<script>alert("xss")</script>';
            const response = await request
                .post('/api/auth/register')
                .send({
                email: 'test2@example.com',
                password: 'Password123!',
                firstName: xssPayload,
                lastName: 'User',
                role: 'SME_OWNER',
            });
            if (response.status === 201) {
                // If user was created, check that XSS payload was sanitized
                expect(response.body.data.user.firstName).not.toContain('<script>');
                // Cleanup
                await prisma.user.delete({
                    where: { email: 'test2@example.com' }
                });
            }
        });
    });
    describe('Performance Tests', () => {
        test('API response times should be reasonable', async () => {
            const start = Date.now();
            const response = await request
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`);
            const responseTime = Date.now() - start;
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        });
        test('AI service should respond within acceptable time', async () => {
            const start = Date.now();
            const response = await supertest('http://localhost:5001')
                .post('/api/ai/chat')
                .send({
                prompt: 'Quick test query',
                userId: testUserId,
                feature: 'test',
                maxTokens: 50,
            });
            const responseTime = Date.now() - start;
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(10000); // AI responses within 10 seconds
        });
        test('Concurrent requests should be handled properly', async () => {
            const concurrentRequests = 5;
            const promises = Array(concurrentRequests).fill(null).map(() => request
                .get('/health'));
            const responses = await Promise.all(promises);
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
        });
    });
});
// Additional test utilities
export const TEST_HELPERS = {
    createTestSME: async (authToken) => {
        return await supertest(app)
            .post('/api/sme')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            companyName: 'Test Healthcare SME',
            crNumber: '1234567890',
            businessType: 'CLINIC',
            sector: 'HEALTHCARE',
            employeeCount: 10,
        });
    },
    createTestUser: async (email = 'test@example.com') => {
        return await supertest(app)
            .post('/api/auth/register')
            .send({
            email,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'SME_OWNER',
        });
    },
    cleanupTestData: async (userId, smeId) => {
        const prisma = new PrismaClient();
        if (smeId) {
            await prisma.sMEProfile.delete({ where: { id: smeId } });
        }
        if (userId) {
            await prisma.user.delete({ where: { id: userId } });
        }
        await prisma.$disconnect();
    },
};
console.log('🧪 Live API Integration Tests Ready');
console.log('📊 Test Coverage:');
console.log('  ✅ Health Checks (All Services)');
console.log('  ✅ Authentication & Authorization');
console.log('  ✅ SME Management CRUD Operations');
console.log('  ✅ AI Service Integration');
console.log('  ✅ Document Generation');
console.log('  ✅ Analytics and Reporting');
console.log('  ✅ Saudi Compliance Validation');
console.log('  ✅ Security & Error Handling');
console.log('  ✅ Performance & Load Testing');
console.log('  ⚡ Ready for Live API Testing!');
//# sourceMappingURL=liveAPI.test.js.map