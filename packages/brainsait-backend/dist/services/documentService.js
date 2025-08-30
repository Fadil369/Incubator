import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
const prisma = new PrismaClient();
/**
 * Document Generation Service
 * Handles generation of various business documents
 */
export class DocumentService {
    static templatesPath = path.join(process.cwd(), 'templates');
    static outputPath = path.join(process.cwd(), 'uploads', 'generated-documents');
    /**
     * Initialize document service
     */
    static initialize() {
        // Ensure template and output directories exist
        [this.templatesPath, this.outputPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    /**
     * Generate feasibility study document
     */
    static async generateFeasibilityStudy(data) {
        try {
            const fileName = `feasibility-study-${data.companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
            const filePath = path.join(this.outputPath, fileName);
            // Generate HTML content for the feasibility study
            const htmlContent = this.generateFeasibilityStudyHTML(data);
            // For now, we'll save as HTML. In production, you'd use a library like Puppeteer to convert to PDF
            await fs.promises.writeFile(filePath.replace('.pdf', '.html'), htmlContent);
            logger.info(`Feasibility study generated for: ${data.companyName}`, {
                smeId: data.smeId,
                fileName,
            });
            return {
                filePath: filePath.replace('.pdf', '.html'),
                fileName: fileName.replace('.pdf', '.html'),
                downloadUrl: `/uploads/generated-documents/${fileName.replace('.pdf', '.html')}`,
            };
        }
        catch (error) {
            logger.error('Error generating feasibility study:', error);
            throw new Error('Failed to generate feasibility study');
        }
    }
    /**
     * Generate business plan document
     */
    static async generateBusinessPlan(data) {
        try {
            const smeProfile = await prisma.sMEProfile.findUnique({
                where: { id: data.smeId },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });
            if (!smeProfile) {
                throw new Error('SME profile not found');
            }
            const fileName = `business-plan-${smeProfile.companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
            const filePath = path.join(this.outputPath, fileName);
            // Generate HTML content for the business plan
            const htmlContent = this.generateBusinessPlanHTML(data, smeProfile);
            // Save as HTML (in production, convert to PDF)
            await fs.promises.writeFile(filePath.replace('.pdf', '.html'), htmlContent);
            logger.info(`Business plan generated for: ${smeProfile.companyName}`, {
                smeId: data.smeId,
                fileName,
            });
            return {
                filePath: filePath.replace('.pdf', '.html'),
                fileName: fileName.replace('.pdf', '.html'),
                downloadUrl: `/uploads/generated-documents/${fileName.replace('.pdf', '.html')}`,
            };
        }
        catch (error) {
            logger.error('Error generating business plan:', error);
            throw new Error('Failed to generate business plan');
        }
    }
    /**
     * Generate certificate
     */
    static async generateCertificate(data) {
        try {
            const fileName = `certificate-${data.recipientName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
            const filePath = path.join(this.outputPath, fileName);
            // Generate HTML content for the certificate
            const htmlContent = this.generateCertificateHTML(data);
            // Save as HTML (in production, convert to PDF)
            await fs.promises.writeFile(filePath.replace('.pdf', '.html'), htmlContent);
            logger.info(`Certificate generated for: ${data.recipientName}`, {
                programTitle: data.programTitle,
                fileName,
            });
            return {
                filePath: filePath.replace('.pdf', '.html'),
                fileName: fileName.replace('.pdf', '.html'),
                downloadUrl: `/uploads/generated-documents/${fileName.replace('.pdf', '.html')}`,
            };
        }
        catch (error) {
            logger.error('Error generating certificate:', error);
            throw new Error('Failed to generate certificate');
        }
    }
    /**
     * Generate feasibility study HTML template
     */
    static generateFeasibilityStudyHTML(data) {
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feasibility Study - ${data.companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { color: #667eea; font-size: 2.5em; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 1.2em; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #667eea; border-bottom: 2px solid #eee; padding-bottom: 10px; }
          .section h3 { color: #555; }
          .highlight { background-color: #f8f9ff; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
          .risk-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .risk-table th, .risk-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .risk-table th { background-color: #f8f9ff; }
          .footer { text-align: center; margin-top: 50px; font-size: 0.9em; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="company-name">${data.companyName}</h1>
          <p class="subtitle">Feasibility Study Report</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <h2>Executive Summary</h2>
          <p>This feasibility study analyzes the viability of ${data.companyName} in the ${data.industryFocus.join(', ')} sector(s). The study examines market potential, competitive landscape, financial projections, and associated risks.</p>
        </div>

        <div class="section">
          <h2>Business Overview</h2>
          <h3>Industry Focus</h3>
          <p>${data.industryFocus.join(', ')}</p>
          
          <h3>Business Model</h3>
          <p>${data.businessModel}</p>
          
          <h3>Target Market</h3>
          <p>${data.targetMarket}</p>
          
          <h3>Competitive Advantage</h3>
          <div class="highlight">
            <p>${data.competitiveAdvantage}</p>
          </div>
        </div>

        <div class="section">
          <h2>Market Analysis</h2>
          ${data.marketAnalysis ? `
            <h3>Market Size</h3>
            <p>Total Addressable Market: ${data.marketAnalysis.totalMarket || 'To be determined'}</p>
            <p>Serviceable Market: ${data.marketAnalysis.serviceableMarket || 'To be determined'}</p>
            
            <h3>Growth Potential</h3>
            <p>${data.marketAnalysis.growthPotential || 'Market shows positive growth indicators based on industry trends.'}</p>
          ` : '<p>Market analysis data to be provided during consultation.</p>'}
        </div>

        <div class="section">
          <h2>Financial Projections</h2>
          ${data.financialProjections ? `
            <h3>Revenue Projections (5 Years)</h3>
            <p>Year 1: ${data.financialProjections.year1 || '$0'}</p>
            <p>Year 2: ${data.financialProjections.year2 || '$0'}</p>
            <p>Year 3: ${data.financialProjections.year3 || '$0'}</p>
            <p>Year 5: ${data.financialProjections.year5 || '$0'}</p>
          ` : '<p>Financial projections will be developed based on detailed business planning sessions.</p>'}
        </div>

        <div class="section">
          <h2>Risk Assessment</h2>
          <table class="risk-table">
            <thead>
              <tr>
                <th>Risk Category</th>
                <th>Description</th>
                <th>Impact Level</th>
                <th>Mitigation Strategy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Market Risk</td>
                <td>Changes in market demand or competition</td>
                <td>Medium</td>
                <td>Continuous market monitoring and agile business model</td>
              </tr>
              <tr>
                <td>Regulatory Risk</td>
                <td>Healthcare regulations and compliance requirements</td>
                <td>High</td>
                <td>Legal consultation and compliance framework</td>
              </tr>
              <tr>
                <td>Technology Risk</td>
                <td>Technology obsolescence or security vulnerabilities</td>
                <td>Medium</td>
                <td>Regular technology updates and security protocols</td>
              </tr>
              <tr>
                <td>Financial Risk</td>
                <td>Cash flow challenges and funding requirements</td>
                <td>High</td>
                <td>Diversified funding sources and financial planning</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Implementation Timeline</h2>
          ${data.timeline ? `
            <h3>Phase 1: Foundation (Months 1-3)</h3>
            <p>${data.timeline.phase1 || 'Business setup, legal structure, initial team formation'}</p>
            
            <h3>Phase 2: Development (Months 4-6)</h3>
            <p>${data.timeline.phase2 || 'Product/service development, initial market testing'}</p>
            
            <h3>Phase 3: Launch (Months 7-9)</h3>
            <p>${data.timeline.phase3 || 'Market launch, customer acquisition, scaling operations'}</p>
          ` : `
            <h3>Phase 1: Foundation (Months 1-3)</h3>
            <p>Business setup, legal structure, initial team formation</p>
            
            <h3>Phase 2: Development (Months 4-6)</h3>
            <p>Product/service development, initial market testing</p>
            
            <h3>Phase 3: Launch (Months 7-9)</h3>
            <p>Market launch, customer acquisition, scaling operations</p>
          `}
        </div>

        <div class="section">
          <h2>Recommendations</h2>
          <div class="highlight">
            <h3>Go/No-Go Decision</h3>
            <p><strong>Recommendation:</strong> Proceed with caution. The business shows potential in the healthcare sector, but success will depend on proper execution of risk mitigation strategies and securing adequate funding.</p>
            
            <h3>Next Steps</h3>
            <ul>
              <li>Develop detailed business plan with financial models</li>
              <li>Conduct primary market research and customer validation</li>
              <li>Secure seed funding or investment</li>
              <li>Build minimum viable product (MVP)</li>
              <li>Establish key partnerships and regulatory compliance</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p>This feasibility study was generated by the BrainSAIT platform.</p>
          <p>For detailed consultation and business planning services, contact: support@brainsait.com</p>
        </div>
      </body>
      </html>
    `;
    }
    /**
     * Generate business plan HTML template
     */
    static generateBusinessPlanHTML(data, smeProfile) {
        const ownerName = `${smeProfile.user.firstName} ${smeProfile.user.lastName}`;
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Business Plan - ${smeProfile.companyName}</title>
        <style>
          body { font-family: Georgia, serif; line-height: 1.8; margin: 50px; color: #333; }
          .cover { text-align: center; page-break-after: always; }
          .company-name { font-size: 3em; color: #2c3e50; margin-bottom: 20px; font-weight: bold; }
          .business-plan-title { font-size: 1.8em; color: #666; margin-bottom: 40px; }
          .author-info { margin-top: 100px; font-size: 1.2em; }
          .section { margin-bottom: 40px; page-break-inside: avoid; }
          .section h1 { color: #2c3e50; font-size: 2em; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
          .section h2 { color: #34495e; font-size: 1.5em; margin-top: 30px; }
          .section h3 { color: #555; font-size: 1.2em; margin-top: 20px; }
          .highlight { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-left: 5px solid #3498db; margin: 20px 0; }
          .financial-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .financial-table th, .financial-table td { border: 1px solid #ddd; padding: 15px; text-align: left; }
          .financial-table th { background: #3498db; color: white; }
          .financial-table tr:nth-child(even) { background: #f8f9fa; }
          .toc { page-break-after: always; }
          .toc ul { list-style: none; padding: 0; }
          .toc li { padding: 10px 0; border-bottom: 1px dotted #ccc; }
        </style>
      </head>
      <body>
        <div class="cover">
          <h1 class="company-name">${smeProfile.companyName}</h1>
          <h2 class="business-plan-title">Comprehensive Business Plan</h2>
          <div class="author-info">
            <p><strong>Prepared by:</strong> ${ownerName}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Industry:</strong> ${smeProfile.industryFocus.join(', ')}</p>
          </div>
        </div>

        <div class="toc">
          <h1>Table of Contents</h1>
          <ul>
            <li>1. Executive Summary</li>
            <li>2. Business Description</li>
            <li>3. Market Analysis</li>
            <li>4. Organization & Management</li>
            <li>5. Service or Product Line</li>
            <li>6. Marketing & Sales</li>
            <li>7. Funding Request</li>
            <li>8. Financial Projections</li>
            <li>9. Appendix</li>
          </ul>
        </div>

        <div class="section">
          <h1>1. Executive Summary</h1>
          <div class="highlight">
            <p>${data.executiveSummary || `${smeProfile.companyName} is a ${smeProfile.companyType.toLowerCase().replace('_', ' ')} focused on ${smeProfile.industryFocus.join(' and ')}. Our mission is to provide innovative healthcare solutions that improve patient outcomes while reducing costs.`}</p>
          </div>

          <h2>Company Overview</h2>
          <p><strong>Company Name:</strong> ${smeProfile.companyName}</p>
          <p><strong>Legal Structure:</strong> ${smeProfile.companyType.replace('_', ' ')}</p>
          <p><strong>Founded:</strong> ${smeProfile.foundedYear || 'Recently established'}</p>
          <p><strong>Location:</strong> ${smeProfile.address ? JSON.stringify(smeProfile.address) : 'To be determined'}</p>
          
          <h2>Key Success Factors</h2>
          <ul>
            <li>Strong healthcare industry focus with growing market demand</li>
            <li>Experienced leadership team with domain expertise</li>
            <li>Innovative approach to healthcare challenges</li>
            <li>Strategic partnerships and collaborations</li>
          </ul>
        </div>

        <div class="section">
          <h1>2. Business Description</h1>
          <p>${data.businessDescription || `${smeProfile.companyName} operates in the healthcare sector, specifically focusing on ${smeProfile.industryFocus.join(', ')}. We are committed to developing solutions that address critical healthcare challenges while maintaining the highest standards of quality and compliance.`}</p>

          <h2>Mission Statement</h2>
          <div class="highlight">
            <p>To revolutionize healthcare delivery through innovative technology and services, improving patient outcomes while making healthcare more accessible and affordable.</p>
          </div>

          <h2>Vision Statement</h2>
          <p>To be a leading healthcare innovation company that transforms how patients receive care and how healthcare providers deliver services.</p>

          <h2>Company History and Ownership</h2>
          <p>${smeProfile.companyName} was founded ${smeProfile.foundedYear ? `in ${smeProfile.foundedYear}` : 'recently'} by ${ownerName}. The company has grown to ${smeProfile.employeeCount || 'a small but dedicated'} team of professionals committed to our mission.</p>
        </div>

        <div class="section">
          <h1>3. Market Analysis</h1>
          ${data.marketAnalysis ? `
            <h2>Industry Overview</h2>
            <p>${data.marketAnalysis.industryOverview || 'The healthcare industry continues to evolve rapidly, driven by technological advancement, demographic changes, and increasing demand for efficient healthcare solutions.'}</p>

            <h2>Target Market</h2>
            <p>${data.marketAnalysis.targetMarket || 'Our target market includes healthcare providers, patients, and healthcare technology companies seeking innovative solutions.'}</p>

            <h2>Market Trends</h2>
            <ul>
              <li>Digital health transformation</li>
              <li>Telemedicine adoption</li>
              <li>Value-based care models</li>
              <li>AI and data analytics integration</li>
            </ul>
          ` : `
            <h2>Industry Overview</h2>
            <p>The healthcare industry continues to evolve rapidly, driven by technological advancement, demographic changes, and increasing demand for efficient healthcare solutions.</p>

            <h2>Market Opportunity</h2>
            <p>The global healthcare market represents a multi-trillion dollar opportunity with significant growth potential in our focus areas of ${smeProfile.industryFocus.join(', ')}.</p>
          `}
        </div>

        <div class="section">
          <h1>4. Organization & Management</h1>
          ${data.organizationManagement ? `
            <h2>Organizational Structure</h2>
            <p>${data.organizationManagement.structure || 'Our organizational structure is designed to promote innovation while maintaining operational efficiency.'}</p>

            <h2>Management Team</h2>
            <p>${data.organizationManagement.team || `Led by ${ownerName}, our management team brings together diverse expertise in healthcare, technology, and business operations.`}</p>
          ` : `
            <h2>Management Team</h2>
            <p><strong>Founder & CEO:</strong> ${ownerName}</p>
            <p>Our founder brings extensive experience in the healthcare industry and a passion for innovation.</p>

            <h2>Personnel Plan</h2>
            <p>As we grow, we plan to expand our team strategically, focusing on key areas such as product development, sales, and customer success.</p>
          `}
        </div>

        <div class="section">
          <h1>5. Service or Product Line</h1>
          ${data.serviceProductLine ? `
            <p>${data.serviceProductLine.description || 'Our products and services are designed to address critical healthcare challenges through innovative solutions.'}</p>
          ` : `
            <h2>Core Offerings</h2>
            <p>Our products and services focus on ${smeProfile.industryFocus.join(' and ')}, providing innovative solutions that improve healthcare delivery and patient outcomes.</p>

            <h2>Product Development</h2>
            <p>We follow a rigorous product development process that ensures our solutions meet the highest standards of quality, safety, and regulatory compliance.</p>

            <h2>Competitive Advantages</h2>
            <ul>
              <li>Deep healthcare domain expertise</li>
              <li>Focus on user experience and patient outcomes</li>
              <li>Scalable technology platform</li>
              <li>Strong regulatory compliance framework</li>
            </ul>
          `}
        </div>

        <div class="section">
          <h1>6. Marketing & Sales</h1>
          ${data.marketingSales ? `
            <h2>Marketing Strategy</h2>
            <p>${data.marketingSales.strategy || 'Our marketing strategy focuses on building strong relationships with healthcare providers and demonstrating the value of our solutions.'}</p>

            <h2>Sales Strategy</h2>
            <p>${data.marketingSales.sales || 'We employ a consultative sales approach, working closely with customers to understand their needs and provide tailored solutions.'}</p>
          ` : `
            <h2>Marketing Strategy</h2>
            <p>Our marketing strategy focuses on thought leadership, industry partnerships, and demonstrating measurable outcomes for our customers.</p>

            <h2>Sales Approach</h2>
            <p>We employ a consultative sales methodology, building long-term partnerships with our customers and providing ongoing support and value.</p>

            <h2>Customer Acquisition</h2>
            <ul>
              <li>Industry conferences and events</li>
              <li>Professional networks and referrals</li>
              <li>Digital marketing and content strategy</li>
              <li>Pilot programs and proof-of-concept projects</li>
            </ul>
          `}
        </div>

        <div class="section">
          <h1>7. Funding Request</h1>
          ${data.fundingRequest ? `
            <p>${data.fundingRequest.amount || 'We are seeking funding to accelerate our growth and expand our market presence.'}</p>
            <p>${data.fundingRequest.use || 'Funding will be used for product development, team expansion, and market penetration activities.'}</p>
          ` : `
            <h2>Funding Requirements</h2>
            <p>We are seeking strategic funding to accelerate our growth trajectory and expand our market presence in the healthcare sector.</p>

            <h2>Use of Funds</h2>
            <ul>
              <li>Product development and enhancement (40%)</li>
              <li>Team expansion and talent acquisition (30%)</li>
              <li>Marketing and sales activities (20%)</li>
              <li>Working capital and operations (10%)</li>
            </ul>
          `}
        </div>

        <div class="section">
          <h1>8. Financial Projections</h1>
          ${data.financialProjections ? `
            <table class="financial-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Revenue</th>
                  <th>Expenses</th>
                  <th>Net Income</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Year 1</td>
                  <td>${data.financialProjections.year1_revenue || '$0'}</td>
                  <td>${data.financialProjections.year1_expenses || '$0'}</td>
                  <td>${data.financialProjections.year1_income || '$0'}</td>
                </tr>
                <tr>
                  <td>Year 2</td>
                  <td>${data.financialProjections.year2_revenue || '$0'}</td>
                  <td>${data.financialProjections.year2_expenses || '$0'}</td>
                  <td>${data.financialProjections.year2_income || '$0'}</td>
                </tr>
                <tr>
                  <td>Year 3</td>
                  <td>${data.financialProjections.year3_revenue || '$0'}</td>
                  <td>${data.financialProjections.year3_expenses || '$0'}</td>
                  <td>${data.financialProjections.year3_income || '$0'}</td>
                </tr>
              </tbody>
            </table>
          ` : `
            <h2>Revenue Model</h2>
            <p>Our revenue model is based on subscription services, licensing fees, and professional services, providing multiple revenue streams and recurring income potential.</p>

            <h2>Financial Assumptions</h2>
            <ul>
              <li>Conservative market penetration estimates</li>
              <li>Gradual scaling of operations and team</li>
              <li>Investment in R&D for continued innovation</li>
              <li>Focus on sustainable growth and profitability</li>
            </ul>
          `}
        </div>

        <div class="section">
          <h1>9. Appendix</h1>
          ${data.appendix ? `
            <p>${data.appendix}</p>
          ` : `
            <h2>Supporting Documents</h2>
            <p>Additional supporting documents, market research, and detailed financial models are available upon request.</p>

            <h2>Contact Information</h2>
            <p><strong>Company:</strong> ${smeProfile.companyName}</p>
            <p><strong>Contact Person:</strong> ${ownerName}</p>
            ${smeProfile.website ? `<p><strong>Website:</strong> ${smeProfile.website}</p>` : ''}
          `}
        </div>

        <div class="footer" style="text-align: center; margin-top: 50px; font-size: 0.9em; color: #666;">
          <p>This business plan was generated by the BrainSAIT platform.</p>
          <p>For professional business plan services and consultation, contact: support@brainsait.com</p>
        </div>
      </body>
      </html>
    `;
    }
    /**
     * Generate certificate HTML template
     */
    static generateCertificateHTML(data) {
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate - ${data.recipientName}</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
          }
          .certificate { 
            background: white; 
            width: 800px; 
            padding: 60px; 
            border: 20px solid #f8f9fa; 
            box-shadow: 0 0 30px rgba(0,0,0,0.3); 
            text-align: center; 
          }
          .certificate-header { 
            border-bottom: 3px solid #667eea; 
            padding-bottom: 20px; 
            margin-bottom: 40px; 
          }
          .brainsait-logo { 
            font-size: 2.5em; 
            font-weight: bold; 
            color: #667eea; 
            margin-bottom: 10px; 
          }
          .certificate-title { 
            font-size: 3em; 
            color: #2c3e50; 
            margin: 30px 0; 
            font-weight: bold; 
          }
          .recipient-name { 
            font-size: 2.5em; 
            color: #667eea; 
            font-style: italic; 
            margin: 30px 0; 
            text-decoration: underline; 
          }
          .program-title { 
            font-size: 1.8em; 
            color: #2c3e50; 
            margin: 20px 0; 
            font-weight: bold; 
          }
          .completion-text { 
            font-size: 1.3em; 
            color: #555; 
            margin: 30px 0; 
            line-height: 1.6; 
          }
          .date-section { 
            margin: 40px 0; 
            font-size: 1.2em; 
            color: #666; 
          }
          .signature-section { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 60px; 
            padding-top: 20px; 
          }
          .signature { 
            text-align: center; 
            width: 200px; 
          }
          .signature-line { 
            border-top: 2px solid #333; 
            margin-bottom: 10px; 
          }
          .seal { 
            position: absolute; 
            right: 100px; 
            bottom: 100px; 
            width: 100px; 
            height: 100px; 
            border: 3px solid #667eea; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background: rgba(102, 126, 234, 0.1); 
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="certificate-header">
            <div class="brainsait-logo">BrainSAIT</div>
            <p>Healthcare Innovation Platform</p>
          </div>

          <h1 class="certificate-title">Certificate of ${data.certificateType === 'COMPLETION' ? 'Completion' : data.certificateType === 'ACHIEVEMENT' ? 'Achievement' : 'Participation'}</h1>

          <div class="completion-text">
            This is to certify that
          </div>

          <h2 class="recipient-name">${data.recipientName}</h2>

          <div class="completion-text">
            has successfully ${data.certificateType === 'COMPLETION' ? 'completed' : data.certificateType === 'ACHIEVEMENT' ? 'achieved excellence in' : 'participated in'} the
          </div>

          <h3 class="program-title">${data.programTitle}</h3>

          <div class="completion-text">
            ${data.certificateType === 'COMPLETION'
            ? 'demonstrating commitment to professional development and healthcare innovation.'
            : data.certificateType === 'ACHIEVEMENT'
                ? 'demonstrating exceptional performance and dedication to excellence.'
                : 'showing commitment to learning and professional development in healthcare innovation.'}
          </div>

          <div class="date-section">
            Awarded on ${data.completionDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}
          </div>

          <div class="signature-section">
            <div class="signature">
              <div class="signature-line"></div>
              <p><strong>${data.signatory}</strong></p>
              <p>${data.signatoryTitle}</p>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <p><strong>Program Director</strong></p>
              <p>BrainSAIT Platform</p>
            </div>
          </div>

          <div class="seal">
            <div style="text-align: center; font-size: 0.8em; color: #667eea;">
              <div>BRAINSAIT</div>
              <div>CERTIFIED</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    /**
     * Get all generated documents for a user
     */
    static async getUserDocuments(userId) {
        try {
            // In a real implementation, you'd store document metadata in the database
            // For now, we'll return a simple response
            return {
                documents: [],
                message: 'Document history will be implemented with database storage',
            };
        }
        catch (error) {
            logger.error('Error fetching user documents:', error);
            throw new Error('Failed to fetch user documents');
        }
    }
    /**
     * Delete generated document
     */
    static async deleteDocument(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
                logger.info(`Document deleted: ${filePath}`);
            }
        }
        catch (error) {
            logger.error('Error deleting document:', error);
            throw new Error('Failed to delete document');
        }
    }
}
// Initialize the document service
DocumentService.initialize();
//# sourceMappingURL=documentService.js.map