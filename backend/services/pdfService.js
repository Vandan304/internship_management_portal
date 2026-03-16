const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Service to generate PDFs for Certificates and Offer Letters
 */
class PDFService {
    /**
     * Generate a PDF from HTML content
     * @param {string} html - The HTML template string
     * @param {string} outputPath - Path to save the PDF
     */
    /**
     * Helper to get base64 of an image
     */
    getBase64Image(fileName) {
        try {
            const filePath = path.join(__dirname, '../assets', fileName);
            if (!fs.existsSync(filePath)) {
                console.warn(`[PDF SERVICE] Asset not found: ${filePath}`);
                return '';
            }
            const data = fs.readFileSync(filePath);
            const extension = path.extname(fileName).replace('.', '');
            return `data:image/${extension};base64,${data.toString('base64')}`;
        } catch (error) {
            console.error(`[PDF SERVICE] Error reading image ${fileName}:`, error.message);
            return '';
        }
    }

    /**
     * Generate a PDF from HTML content
     * @param {string} html - The HTML template string
     * @param {string} outputPath - Path to save the PDF
     */
    async generatePDF(html, outputPath) {
        let browser;
        try {
            console.log(`[PDF GENERATION START] ${outputPath}`);
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            // Set content and wait for images to load
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            // Ensure directory exists
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0px',
                    right: '0px',
                    bottom: '0px',
                    left: '0px'
                }
            });
            
            console.log(`[PDF GENERATION SUCCESS] ${outputPath}`);
            return true;
        } catch (error) {
            console.error(`[PDF GENERATION ERROR] ${error.message}`);
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }

    /**
     * Get HTML template for Offer Letter
     */
    getOfferLetterTemplate(data) {
        const { internName, internId, position, startDate } = data;
        const logo1Path = this.getBase64Image('logo1.png');
        const logoPath = this.getBase64Image('logo.png');
        const stampPath = this.getBase64Image('stamp.png');

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { size: A4; margin: 0; }
                body { margin: 0; padding: 0; font-family: 'serif'; background: white; width: 210mm; height: 297mm; overflow: hidden; position: relative; }
                
                /* Layout Elements from Design */
                .top-curves {
                    position: absolute; top: 0; left: 0; width: 100%; height: 200px;
                    background: linear-gradient(135deg, #2f6bff 0%, #2f6bff 30%, #4f82ff 30%, #4f82ff 45%, #e9f0ff 45%, #e9f0ff 60%, transparent 60%);
                    z-index: 1;
                }
                .bottom-curves {
                    position: absolute; bottom: 0; right: 0; width: 100%; height: 200px;
                    background: linear-gradient(315deg, #2f6bff 0%, #2f6bff 30%, #4f82ff 30%, #4f82ff 45%, #e9f0ff 45%, #e9f0ff 60%, transparent 60%);
                    z-index: 1;
                }
                .watermark {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 80%; opacity: 0.08; z-index: 0;
                }
                
                .container { position: relative; z-index: 2; padding: 60px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; }
                
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .badge { width: 100px; height: 100px; background: white; border-radius: 50%; border: 2px solid #7aa7ff; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                .badge img { width: 60px; }
                .badge-text { color: #2f6bff; font-size: 8px; font-weight: bold; font-family: sans-serif; margin-top: 2px; }
                
                .contact-info { text-align: right; font-family: sans-serif; font-size: 12px; color: #333; }
                .company-header-text { text-align: center; margin-top: 10px; }
                
                .main-title { text-align: center; font-size: 36px; margin-top: 40px; color: #000; font-weight: bold; }
                .date-line { text-align: right; margin-top: 10px; font-size: 16px; color: #555; font-family: sans-serif; }
                
                .intern-info { margin-top: 30px; font-size: 20px; color: #333; font-weight: bold; font-family: sans-serif; }
                
                .content-text { margin-top: 30px; font-size: 18px; line-height: 1.6; color: #444; text-align: justify; font-family: 'Arial', sans-serif; }
                
                .footer { margin-top: auto; padding-bottom: 60px; position: relative; }
                .signature-section { display: flex; flex-direction: column; gap: 5px; }
                .stamp { width: 100px; margin-left: -5px; }
                .sign-info { font-family: sans-serif; font-size: 16px; }
                .sign-name { font-weight: bold; font-size: 18px; }
            </style>
        </head>
        <body>
            <div class="top-curves"></div>
            <div class="bottom-curves"></div>
            <img src="${logo1Path}" class="watermark">
            
            <div class="container">
                <div class="header">
                    <div class="badge">
                        <img src="${logoPath}">
                        <div class="badge-text">APPIFLY</div>
                        <div class="badge-text" style="margin-top: 0;">INFOTECH</div>
                    </div>
                    <div class="contact-info">
                        📞 +91 99094 03993<br>
                        📧 info@appiflyinfotech.com<br>
                        🌐 www.appiflyinfotech.com<br>
                        Surat, Gujarat, India
                    </div>
                </div>

                <div class="company-header-text">
                    <div style="font-size: 20px; font-weight: bold; color: #2f6bff; letter-spacing: 1px;">INTERNSHIP OFFER LETTER</div>
                    <div style="font-size: 16px; font-weight: bold; color: #333; margin-top: 5px;">APPIFLY INFOTECH</div>
                    <div style="font-size: 12px; color: #666;">Surat, Gujarat, India | info@appiflyinfotech.com</div>
                </div>
                
                <h1 class="main-title">Offer of Internship</h1>
                <div class="date-line">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                
                <div class="intern-info">
                    Intern ID: ${internId}<br>
                    To: ${internName}
                </div>
                
                <div class="content-text">
                    This is to confirm that <strong>${internName}</strong> has been selected for an internship with our organization starting from <strong>${startDate}</strong> as a <strong>${position}</strong>.<br><br>
                    During this internship, you will have the opportunity to work on real-world projects and gain valuable hands-on experience in your field of study. You will be reporting to the Technical Lead.<br><br>
                    Please sign and return a copy of this letter as a token of your acceptance.<br><br>
                    We look forward to having you on our team!
                </div>
                
                <div class="footer">
                    <div class="signature-section">
                        <div style="font-size: 16px;">Yours Sincerely,</div>
                        <img src="${stampPath}" class="stamp">
                        <div class="sign-info">
                            <div class="sign-name">Raj Ghevariya</div>
                            <div>Co-founder & CTO</div>
                            <div>APPIFLY INFOTECH</div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Get HTML template for Completion Certificate
     */
    getCertificateTemplate(data) {
        const { internName, internId, position, startDate, completionDate } = data;
        const logo1Path = this.getBase64Image('logo1.png');
        const logoPath = this.getBase64Image('logo.png');
        const stampPath = this.getBase64Image('stamp.png');

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { size: A4; margin: 0; }
                body { margin: 0; padding: 0; font-family: 'serif'; background: white; width: 210mm; height: 297mm; overflow: hidden; position: relative; }
                
                /* Layout Elements from Design */
                .top-curves {
                    position: absolute; top: 0; left: 0; width: 100%; height: 200px;
                    background: linear-gradient(135deg, #2f6bff 0%, #2f6bff 30%, #4f82ff 30%, #4f82ff 45%, #e9f0ff 45%, #e9f0ff 60%, transparent 60%);
                    z-index: 1;
                }
                .bottom-curves {
                    position: absolute; bottom: 0; right: 0; width: 100%; height: 200px;
                    background: linear-gradient(315deg, #2f6bff 0%, #2f6bff 30%, #4f82ff 30%, #4f82ff 45%, #e9f0ff 45%, #e9f0ff 60%, transparent 60%);
                    z-index: 1;
                }
                .watermark {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 80%; opacity: 0.08; z-index: 0;
                }
                
                .container { position: relative; z-index: 2; padding: 60px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; }
                
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .badge { width: 100px; height: 100px; background: white; border-radius: 50%; border: 2px solid #7aa7ff; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                .badge img { width: 60px; }
                .badge-text { color: #2f6bff; font-size: 8px; font-weight: bold; font-family: sans-serif; margin-top: 2px; }
                
                .contact-info { text-align: right; font-family: sans-serif; font-size: 12px; color: #333; }
                .company-header-text { text-align: center; margin-top: 10px; }
                
                .main-title { text-align: center; font-size: 36px; margin-top: 40px; color: #000; font-weight: bold; }
                .date-line { text-align: right; margin-top: 10px; font-size: 16px; color: #555; font-family: sans-serif; }
                
                .intern-info { margin-top: 30px; font-size: 20px; color: #333; font-weight: bold; font-family: sans-serif; }
                
                .content-text { margin-top: 30px; font-size: 18px; line-height: 1.6; color: #444; text-align: justify; font-family: 'Arial', sans-serif; }
                
                .footer { margin-top: auto; padding-bottom: 60px; position: relative; }
                .signature-section { display: flex; flex-direction: column; gap: 5px; }
                .stamp { width: 100px; margin-left: -5px; }
                .sign-info { font-family: sans-serif; font-size: 16px; }
                .sign-name { font-weight: bold; font-size: 18px; }
            </style>
        </head>
        <body>
            <div class="top-curves"></div>
            <div class="bottom-curves"></div>
            <img src="${logo1Path}" class="watermark">
            
            <div class="container">
                <div class="header">
                    <div class="badge">
                        <img src="${logoPath}">
                        <div class="badge-text">APPIFLY</div>
                        <div class="badge-text" style="margin-top: 0;">INFOTECH</div>
                    </div>
                    <div class="contact-info">
                        📞 +91 99094 03993<br>
                        📧 info@appiflyinfotech.com<br>
                        🌐 www.appiflyinfotech.com<br>
                        Surat, Gujarat, India
                    </div>
                </div>

                <div class="company-header-text">
                    <div style="font-size: 20px; font-weight: bold; color: #2f6bff; letter-spacing: 1px;">INTERNSHIP COMPLETION CERTIFICATE</div>
                    <div style="font-size: 16px; font-weight: bold; color: #333; margin-top: 5px;">APPIFLY INFOTECH</div>
                    <div style="font-size: 12px; color: #666;">Surat, Gujarat, India | info@appiflyinfotech.com</div>
                </div>
                
                <h1 class="main-title">Certificate of Internship</h1>
                <div class="date-line">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                
                <div class="intern-info">
                    Intern ID: ${internId}<br>
                    To: ${internName}
                </div>
                
                <div class="content-text">
                    This is to certify that <strong>${internName}</strong> has successfully completed an internship at <strong>APPIFLY INFOTECH</strong> as a <strong>${position}</strong>. 
                    The internship took place from <strong>${startDate}</strong> to <strong>${completionDate}</strong>. 
                    Throughout the internship, they demonstrated dedication, enthusiasm, and a strong work ethic in their chosen field. 
                    Their contributions and skills have been invaluable to our team.<br><br>
                    We are glad that you have worked with us.
                </div>
                
                <div class="footer">
                    <div class="signature-section">
                        <div style="font-size: 16px;">Yours Sincerely,</div>
                        <img src="${stampPath}" class="stamp">
                        <div class="sign-info">
                            <div class="sign-name">Raj Ghevariya</div>
                            <div>Co-founder & CTO</div>
                            <div>APPIFLY INFOTECH</div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

module.exports = new PDFService();
