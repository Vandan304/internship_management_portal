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
     * Helper to get base64 of an image synchronously
     * Provides fallback to empty string if missing to prevent crashes
     */
    getBase64Image(fileName) {
        try {
            const filePath = path.join(__dirname, '../assets', fileName);
            if (!fs.existsSync(filePath)) {
                console.warn(`[PDF SERVICE] Asset not found: ${filePath}`);
                return ''; // Fallback for missing images
            }
            const data = fs.readFileSync(filePath);
            let ext = path.extname(fileName).replace('.', '').toLowerCase();
            const mimeType = ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext;
            return `data:image/${mimeType};base64,${data.toString('base64')}`;
        } catch (error) {
            console.error(`[PDF SERVICE] Error reading image ${fileName}:`, error.message);
            return ''; // Fallback on error
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
            
            // Check if we are on Vercel and provide a warning
            if (process.env.VERCEL) {
                console.warn('[PDF SERVICE] Puppeteer is known to have issues on Vercel Serverless. If this fails, consider using Render or Railway.');
            }

            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
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
     * Generate a PDF buffer from HTML content
     * @param {string} html - The HTML template string
     * @returns {Promise<Buffer>} - The generated PDF buffer
     */
    async generatePDFBuffer(html) {
        let browser;
        try {
            console.log(`[PDF GENERATION START] Generating to Memory Buffer`);
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0px',
                    right: '0px',
                    bottom: '0px',
                    left: '0px'
                }
            });
            
            console.log(`[PDF GENERATION SUCCESS] Buffer produced`);
            return pdfBuffer;
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
    // getOfferLetterTemplate(data) {
    //     const { internName, internId, position, startDate } = data;
    //     const logo1Path = this.getBase64Image('logo1.png');
    //     const logoPath = this.getBase64Image('logo.png');
    //     const stampPath = this.getBase64Image('stamp.png');

    //     return `
    //     <!DOCTYPE html>
    //     <html>
    //     <head>
    //         <style>
    //             @page { size: A4; margin: 0; }
    //             body { margin: 0; padding: 0; font-family: 'serif'; background: white; width: 210mm; height: 297mm; overflow: hidden; position: relative; }
                
    //             /* Layout Elements from Design */
    //             .top-curves {
    //                 position: absolute; top: 0; left: 0; width: 100%; height: 200px;
    //                 background: linear-gradient(135deg, #2f6bff 0%, #2f6bff 30%, #4f82ff 30%, #4f82ff 45%, #e9f0ff 45%, #e9f0ff 60%, transparent 60%);
    //                 z-index: 1;
    //             }
    //             .bottom-curves {
    //                 position: absolute; bottom: 0; right: 0; width: 100%; height: 200px;
    //                 background: linear-gradient(315deg, #2f6bff 0%, #2f6bff 30%, #4f82ff 30%, #4f82ff 45%, #e9f0ff 45%, #e9f0ff 60%, transparent 60%);
    //                 z-index: 1;
    //             }
    //             .watermark {
    //                 position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    //                 width: 80%; opacity: 0.08; z-index: 0;
    //             }
                
    //             .container { position: relative; z-index: 2; padding: 60px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; }
                
    //             .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    //             .badge { width: 100px; height: 100px; background: white; border-radius: 50%; border: 2px solid #7aa7ff; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    //             .badge img { width: 60px; }
    //             .badge-text { color: #2f6bff; font-size: 8px; font-weight: bold; font-family: sans-serif; margin-top: 2px; }
                
    //             .contact-info { text-align: right; font-family: sans-serif; font-size: 12px; color: #333; }
    //             .company-header-text { text-align: center; margin-top: 10px; }
                
    //             .main-title { text-align: center; font-size: 36px; margin-top: 40px; color: #000; font-weight: bold; }
    //             .date-line { text-align: right; margin-top: 10px; font-size: 16px; color: #555; font-family: sans-serif; }
                
    //             .intern-info { margin-top: 30px; font-size: 20px; color: #333; font-weight: bold; font-family: sans-serif; }
                
    //             .content-text { margin-top: 30px; font-size: 18px; line-height: 1.6; color: #444; text-align: justify; font-family: 'Arial', sans-serif; }
                
    //             .footer { margin-top: auto; padding-bottom: 60px; position: relative; }
    //             .signature-section { display: flex; flex-direction: column; gap: 5px; }
    //             .stamp { width: 100px; margin-left: -5px; }
    //             .sign-info { font-family: sans-serif; font-size: 16px; }
    //             .sign-name { font-weight: bold; font-size: 18px; }
    //         </style>
    //     </head>
    //     <body>
    //         <div class="top-curves"></div>
    //         <div class="bottom-curves"></div>
    //         <img src="${logo1Path}" class="watermark">
            
    //         <div class="container">
    //             <div class="header">
    //                 <div class="badge">
    //                     <img src="${logoPath}">
    //                     <div class="badge-text">APPIFLY</div>
    //                     <div class="badge-text" style="margin-top: 0;">INFOTECH</div>
    //                 </div>
    //                 <div class="contact-info">
    //                     📞 +91 99094 03993<br>
    //                     📧 info@appiflyinfotech.com<br>
    //                     🌐 www.appiflyinfotech.com<br>
    //                     Surat, Gujarat, India
    //                 </div>
    //             </div>

    //             <div class="company-header-text">
    //                 <div style="font-size: 20px; font-weight: bold; color: #2f6bff; letter-spacing: 1px;">INTERNSHIP OFFER LETTER</div>
    //                 <div style="font-size: 16px; font-weight: bold; color: #333; margin-top: 5px;">APPIFLY INFOTECH</div>
    //                 <div style="font-size: 12px; color: #666;">Surat, Gujarat, India | info@appiflyinfotech.com</div>
    //             </div>
                
    //             <h1 class="main-title">Offer of Internship</h1>
    //             <div class="date-line">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                
    //             <div class="intern-info">
    //                 Intern ID: ${internId}<br>
    //                 To: ${internName}
    //             </div>
                
    //             <div class="content-text">
    //                 This is to confirm that <strong>${internName}</strong> has been selected for an internship with our organization starting from <strong>${startDate}</strong> as a <strong>${position}</strong>.<br><br>
    //                 During this internship, you will have the opportunity to work on real-world projects and gain valuable hands-on experience in your field of study. You will be reporting to the Technical Lead.<br><br>
    //                 Please sign and return a copy of this letter as a token of your acceptance.<br><br>
    //                 We look forward to having you on our team!
    //             </div>
                
    //             <div class="footer">
    //                 <div class="signature-section">
    //                     <div style="font-size: 16px;">Yours Sincerely,</div>
    //                     <img src="${stampPath}" class="stamp">
    //                     <div class="sign-info">
    //                         <div class="sign-name">Raj Ghevariya</div>
    //                         <div>Co-founder & CTO</div>
    //                         <div>APPIFLY INFOTECH</div>
    //                     </div>
    //                 </div>
    //             </div>
    //         </div>
    //     </body>
    //     </html>
    //     `;
    // }

   getOfferLetterTemplate(data) {
    const { internName, internId, position, startDate } = data;

    return this.getCertificateTemplate({
        internName,
        internId,
        position,
        startDate,
        completionDate: startDate
    })
    .replace(/Certificate of Internship/g, "Offer of Internship")

    // Fix opening line (IMPORTANT)
    .replace(
        /This is to certify that/g,
        "We are pleased to offer"
    )

    .replace(
        /has successfully completed an internship/g,
        "has been selected for an internship"
    )

    .replace(
        /The internship took place from/g,
        "The internship will start from"
    )

    // Remove end date
    .replace(
        /to <strong>.*?<\/strong>\./g,
        "."
    )

    // Fix tense (VERY IMPORTANT)
    .replace(
        /Throughout the internship, they demonstrated/g,
        "During this internship, you will demonstrate"
    )

    // Fix contribution sentence
    .replace(
        /Their contributions and skills have been invaluable to our team\./g,
        "We are confident that your contributions will be valuable to our team."
    )

    // Closing
    .replace(
        /We are glad that you have worked with us\./g,
        "We look forward to having you on our team!"
    )

    // Fix extra space before dot
    .replace(/\s+\./g, ".");
}


    /**
     * Get HTML template for Completion Certificate
     */
    // getCertificateTemplate(data) {
    //     const { internName, internId, position, startDate, completionDate } = data;
    //     const logo1Path = this.getBase64Image('logo1.png');
    //     const logoPath = this.getBase64Image('logo.png');
    //     const stampPath = this.getBase64Image('stamp.png');

    //     return `
    //     <!DOCTYPE html>
    //     <html>
    //     <head>
    //         <style>
    //             @page { size: A4; margin: 0; }
    //             body { margin: 0; padding: 0; font-family: 'serif'; background: white; width: 210mm; height: 297mm; overflow: hidden; position: relative; }
                
    //             /* Layout Elements from Design */
    //             .top-curves {
    //                 position: absolute; top: 0; left: 0; width: 100%; height: 200px;
    //                 background: linear-gradient(135deg, #2f6bff 0%, #2f6bff 30%, #4f82ff 30%, #4f82ff 45%, #e9f0ff 45%, #e9f0ff 60%, transparent 60%);
    //                 z-index: 1;
    //             }
    //             .bottom-curves {
    //                 position: absolute; bottom: 0; right: 0; width: 100%; height: 200px;
    //                 background: linear-gradient(315deg, #2f6bff 0%, #2f6bff 30%, #4f82ff 30%, #4f82ff 45%, #e9f0ff 45%, #e9f0ff 60%, transparent 60%);
    //                 z-index: 1;
    //             }
    //             .watermark {
    //                 position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    //                 width: 80%; opacity: 0.08; z-index: 0;
    //             }
                
    //             .container { position: relative; z-index: 2; padding: 60px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; }
                
    //             .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    //             .badge { width: 100px; height: 100px; background: white; border-radius: 50%; border: 2px solid #7aa7ff; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    //             .badge img { width: 60px; }
    //             .badge-text { color: #2f6bff; font-size: 8px; font-weight: bold; font-family: sans-serif; margin-top: 2px; }
                
    //             .contact-info { text-align: right; font-family: sans-serif; font-size: 12px; color: #333; }
    //             .company-header-text { text-align: center; margin-top: 10px; }
                
    //             .main-title { text-align: center; font-size: 36px; margin-top: 40px; color: #000; font-weight: bold; }
    //             .date-line { text-align: right; margin-top: 10px; font-size: 16px; color: #555; font-family: sans-serif; }
                
    //             .intern-info { margin-top: 30px; font-size: 20px; color: #333; font-weight: bold; font-family: sans-serif; }
                
    //             .content-text { margin-top: 30px; font-size: 18px; line-height: 1.6; color: #444; text-align: justify; font-family: 'Arial', sans-serif; }
                
    //             .footer { margin-top: auto; padding-bottom: 60px; position: relative; }
    //             .signature-section { display: flex; flex-direction: column; gap: 5px; }
    //             .stamp { width: 100px; margin-left: -5px; }
    //             .sign-info { font-family: sans-serif; font-size: 16px; }
    //             .sign-name { font-weight: bold; font-size: 18px; }
    //         </style>
    //     </head>
    //     <body>
    //         <div class="top-curves"></div>
    //         <div class="bottom-curves"></div>
    //         <img src="${logo1Path}" class="watermark">
            
    //         <div class="container">
    //             <div class="header">
    //                 <div class="badge">
    //                     <img src="${logoPath}">
    //                     <div class="badge-text">APPIFLY</div>
    //                     <div class="badge-text" style="margin-top: 0;">INFOTECH</div>
    //                 </div>
    //                 <div class="contact-info">
    //                     📞 +91 99094 03993<br>
    //                     📧 info@appiflyinfotech.com<br>
    //                     🌐 www.appiflyinfotech.com<br>
    //                     Surat, Gujarat, India
    //                 </div>
    //             </div>

    //             <div class="company-header-text">
    //                 <div style="font-size: 20px; font-weight: bold; color: #2f6bff; letter-spacing: 1px;">INTERNSHIP COMPLETION CERTIFICATE</div>
    //                 <div style="font-size: 16px; font-weight: bold; color: #333; margin-top: 5px;">APPIFLY INFOTECH</div>
    //                 <div style="font-size: 12px; color: #666;">Surat, Gujarat, India | info@appiflyinfotech.com</div>
    //             </div>
                
    //             <h1 class="main-title">Certificate of Internship</h1>
    //             <div class="date-line">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                
    //             <div class="intern-info">
    //                 Intern ID: ${internId}<br>
    //                 To: ${internName}
    //             </div>
                
    //             <div class="content-text">
    //                 This is to certify that <strong>${internName}</strong> has successfully completed an internship at <strong>APPIFLY INFOTECH</strong> as a <strong>${position}</strong>. 
    //                 The internship took place from <strong>${startDate}</strong> to <strong>${completionDate}</strong>. 
    //                 Throughout the internship, they demonstrated dedication, enthusiasm, and a strong work ethic in their chosen field. 
    //                 Their contributions and skills have been invaluable to our team.<br><br>
    //                 We are glad that you have worked with us.
    //             </div>
                
    //             <div class="footer">
    //                 <div class="signature-section">
    //                     <div style="font-size: 16px;">Yours Sincerely,</div>
    //                     <img src="${stampPath}" class="stamp">
    //                     <div class="sign-info">
    //                         <div class="sign-name">Raj Ghevariya</div>
    //                         <div>Co-founder & CTO</div>
    //                         <div>APPIFLY INFOTECH</div>
    //                     </div>
    //                 </div>
    //             </div>
    //         </div>
    //     </body>
    //     </html>
    //     `;
    // }

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

            
            html, body {
                margin: 0;
                padding: 0;
                /* Deterministic 1:1 mapping to A4 physical size eliminates Puppeteer scaling artifacts */
                width: 210mm;
                height: 297mm;
                background: white;
                font-family: Arial, sans-serif;
                position: relative;
                overflow: hidden;
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
            }

            *, *:before, *:after { box-sizing: inherit; }

            .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%; /* Increased from 80% */
                opacity: 0.12; /* Kept low */
            }

            /* Badge */
            .badge {
                position: absolute;
                top: 70px;
                left: 60px;
                width: 180px;
                height: 180px;
                border-radius: 50%;
                background: white;
                border: 4px solid #7aa7ff;

                display: flex;
                flex-direction: column;

                align-items: center;
                justify-content: flex-start; /* ✅ KEY CHANGE */
                overflow: hidden; /* Prevent zoomed logo from escaping rounded border */

                padding-top: 15px; /* Tweak to center scaled logo vertically */
            }
            .badge img {
                width: 130px; /* Base horizontal bound */
                height: 100px; /* Fixed height to create a structured bounding box */
                object-fit: cover; /* Fill bounds, ignore original aspect wrapper */
                object-position: center; /* keep it centered */
                transform: scale(1.6); /* Visually zoom to crop out the built-in image padding */
                margin-bottom: 5px; /* Create healthy space between cropped logo and text */
            }
            .badge-text {
                margin-top: 0px; /* Reset pull to fix overlapping */
                line-height: 1.2;   /* Relax line spacing */
                z-index: 1; /* Make sure text renders above scaled image */
                position: relative;
                color: #2f6bff; /* Reinstate primary Appifly blue */
                font-weight: bold;
                font-size: 14px;
                text-align: center;
            }

            /* Contact */
            .contact {
                position: absolute;
                top: 130px;
                right: 60px;
                text-align: right;
                font-size: 20px;
                color: #333;
                line-height: 2.0;
            }

            /* Title */
            .title {
                position: absolute;
                top: 310px; /* Shifted up from 330px */
                width: 100%;
                text-align: center;
                font-size: 45px;
                font-weight: bold;
                font-family: serif;
            }

            .date {
                position: absolute;
                top: 370px; /* Shifted up from 390px */
                right: 60px;
                font-size: 18px;
                color: #555;
            }

            .info {
                position: absolute;
                top: 420px; /* Shifted up from 440px */
                left: 60px;
                font-size: 20px; /* Reduced from 22px */
                font-weight: bold;
                color: #333;
                line-height: 2;
            }

            .content {
                position: absolute;
                top: 490px; /* Shifted up from 520px */
                left: 60px;
                right: 60px;
                font-size: 18px; /* Reduced from 20px */
                color: #444;
                line-height: 1.8;
                text-align: justify;
                max-height: 240px;
                overflow: hidden;
            }

            // .footer {
            //     position: absolute;
            //     bottom: 120px;
            //     left: 60px;
            // }
            
            .footer {
                position: absolute;
                bottom: 180px;   
                left: 60px;
            }

            .stamp {
                width: 110px; /* Decreased from 140px */
                margin-top: 10px;
            }

            .sign {
                margin-top: 10px;
                font-size: 18px;
            }

            

            .top-curve {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                /* Stretch to exactly match the 1123px implicit viewBox mapping to A4 height */
                height: 100%;
                z-index: 0;
            }

            .page {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }

            .bottom-container {
                position: absolute;
                left: 0;
                bottom: 0;
                width: 100%;
                height: 310px;
                overflow: hidden;
                z-index: 0;
                line-height: 0; /* Clear baseline gaps */
            }

            .bottom-container svg {
                width: 100%;
                height: 100%;
                display: block;
            }
            
        </style>
    </head>

    <body>

    <div class="page">
        <!-- ALL YOUR CONTENT INCLUDING SVG -->

        <!-- SVG CURVES (exact from canvas) -->
        <svg class="top-curve" viewBox="0 0 900 1123" preserveAspectRatio="none">
            <path d="M0,0 L900,0 C700,180 300,240 0,310 Z" fill="#e9f0ff"/>
            <path d="M0,0 L900,0 C700,130 300,190 0,260 Z" fill="#4f82ff"/>
            <path d="M0,0 L900,0 C800,80 200,120 0,190 Z" fill="#2f6bff"/>
        </svg>

        <div class="bottom-container">
    <svg viewBox="0 0 900 310" preserveAspectRatio="none">

        <!-- Light -->
        <path d="M900,310 L0,310 
                 C270,130 630,70 900,0 Z" fill="#e9f0ff"/>

        <!-- Mid -->
        <path d="M900,310 L0,310 
                 C270,180 630,120 900,50 Z" fill="#4f82ff"/>

        <!-- Dark -->
        <path d="M900,310 L0,310 
                 C180,230 720,190 900,120 Z" fill="#2f6bff"/>

    </svg>
</div>
        
        <img src="${logo1Path}" class="watermark"/>

        <!-- Badge -->
        <div class="badge">
            <img src="${logoPath}" />
            <div class="badge-text">APPIFLY</div>
            <div class="badge-text">INFOTECH</div>
        </div>

        <!-- Contact -->
        <div class="contact">
            📞 +91 99094 03993<br>
            📧 info@appiflyinfotech.com<br>
            🌐 www.appiflyinfotech.com
        </div>

        <div class="title">Certificate of Internship</div>

        <div class="date">
            Date: ${new Date().toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            })}
        </div>

        <div class="info">
            Intern ID: ${internId}<br>
            To: ${internName}
        </div>

        <div class="content">
            This is to certify that <strong>${internName}</strong> has successfully completed an internship at 
            <strong>APPIFLY INFOTECH</strong> as a <strong>${position}</strong>. 
            The internship took place from <strong>${startDate}</strong> to <strong>${completionDate}</strong>. 
            Throughout the internship, they demonstrated dedication, enthusiasm, and a strong work ethic. 
            Their contributions and skills have been invaluable to our team.<br><br>
            We are glad that you have worked with us.
        </div>

        <div class="footer">
            Yours Sincerely,<br>
            <img src="${stampPath}" class="stamp"/>

            <div class="sign">
                <strong>Raj Ghevariya</strong><br>
                Co-founder & CTO<br>
                APPIFLY INFOTECH
            </div>
        </div>
        </div>
    </body>
    </html>
    `;
    }
}

module.exports = new PDFService();
