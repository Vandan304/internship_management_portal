import React, { useEffect, useRef } from 'react';

import logoImage from '../assets/logo1.png';
import logoSymbol from '../assets/logo.png';
import stampImage from '../assets/stamp.png';

const CertificateCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Canvas dimensions (A4 portrait proportion ~ 900x1273 - we will use 900x1300)
    const width = 900;
    const height = 1300;
    
    const loadImg = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    Promise.all([
      loadImg(logoImage),
      loadImg(stampImage),
      loadImg(logoSymbol)
    ]).then(([logo, stamp, symbol]) => {
      // 1. Draw Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 8. Decorative Design (Curved graphic shapes - Original Geometry restored)
      const topBandBlue = '#2f6bff';    // Dark
      const midBandBlue = '#4f82ff';    // Medium
      const lightBandBlue = '#e9f0ff';  // Light

      ctx.save();
      // --- Top Decorative Design ---
      // Original orientation: Start from LEFt edge, extend across smoothly. 
      // User layered request: Layer 1 (Dark), Layer 2 (Medium), Layer 3 (Light).
      
      // Layer 3 - Light band (Drawn first so it's at the back, meaning it extends furthest down)
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = lightBandBlue;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.bezierCurveTo(width * 0.7, 180, width * 0.3, 240, 0, 310);
      ctx.fill();

      // Layer 2 - Medium band
      ctx.fillStyle = midBandBlue;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.bezierCurveTo(width * 0.7, 130, width * 0.3, 190, 0, 260);
      ctx.fill();

      // Layer 1 - Dark band (Drawn last so it sits on top)
      ctx.fillStyle = topBandBlue;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.bezierCurveTo(width * 0.8, 80, width * 0.2, 120, 0, 190);
      ctx.fill();

      // --- Bottom Decorative Design ---
      // Mirrors footer design: Starts from RIGHT edge, flows toward LEFT.
      // User layered request: Light band, Medium band, Dark band.
      
      // Layer 1 - Light band (Extends furthest up)
      ctx.fillStyle = lightBandBlue;
      ctx.beginPath();
      ctx.moveTo(width, height);
      ctx.lineTo(0, height);
      ctx.bezierCurveTo(width * 0.3, height - 180, width * 0.7, height - 240, width, height - 310);
      ctx.fill();

      // Layer 2 - Medium band
      ctx.fillStyle = midBandBlue;
      ctx.beginPath();
      ctx.moveTo(width, height);
      ctx.lineTo(0, height);
      ctx.bezierCurveTo(width * 0.3, height - 130, width * 0.7, height - 190, width, height - 260);
      ctx.fill();

      // Layer 3 - Dark band (Stays closest to bottom edge)
      ctx.fillStyle = topBandBlue;
      ctx.beginPath();
      ctx.moveTo(width, height);
      ctx.lineTo(0, height);
      ctx.bezierCurveTo(width * 0.2, height - 80, width * 0.8, height - 120, width, height - 190);
      ctx.fill();
      ctx.restore();

      // Background Watermark Logo
      if (logo) {
        ctx.save();
        ctx.globalAlpha = 0.12; // Increased visibility without strong blur
        const wmWidth = width * 0.20; // Large 60% watermark size
        const wmHeight = (logo.height / logo.width) * wmWidth;
        // Center vertically and horizontally
        ctx.drawImage(logo, (width - wmWidth) / 2, (height - wmHeight) / 2, wmWidth, wmHeight);
        ctx.restore();
      }

      // 1. Top Logo Section Redesign
      if (symbol) {
        ctx.save();
        
        const badgeRadius = 90;
        const badgeX = 150; // Left side positioning
        const badgeY = 160; // Lowered to align dynamically with contact info
        
        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;
        
        // Draw badge circle
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Reset shadow for content
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        // Clean outer border styled with Light Blue tone
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#7aa7ff'; 
        ctx.stroke();

        // Draw logo inside badge (Using short symbol)
        const logoWidth = 170; // Balanced 90px internal fit
        const logoHeight = (symbol.height / symbol.width) * logoWidth;
        // Position logo symbol centered and slightly elevated within circle
        ctx.drawImage(symbol, badgeX - logoWidth / 2, badgeY - 105, logoWidth, logoHeight);
        
        // Draw company name below logo over two lines matching Appifly primary blue
        ctx.fillStyle = '#2f6bff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('APPIFLY', badgeX, badgeY + 30);
        ctx.fillText('INFOTECH', badgeX, badgeY + 55);

        ctx.restore();
      }

      // 2. Contact Section (Top Right)
      ctx.fillStyle = '#333333';
      ctx.font = '20px sans-serif'; // Increased font size
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const contactX = width - 60;
      let contactY = 120;
      const contactSpacing = 40;

      // Unicode icons for contact info
      ctx.fillText('📞 +91 99094 03993', contactX, contactY);
      contactY += contactSpacing;
      ctx.fillText('📧 info@appiflyinfotech.com', contactX, contactY);
      contactY += contactSpacing;
      ctx.fillText('🌐 www.appiflyinfotech.com', contactX, contactY);

      // Section Start Y coordinate
      let contentY = 370;

      // 3. Title & Date Placement
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 45px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Certificate of Internship', width / 2, contentY);

      contentY += 50;
      ctx.fillStyle = '#555555';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Date: March 13, 2026', width - 60, contentY);

      // 4. Intern Details Section
      contentY += 20;
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Intern ID: APPI144', 60, contentY);
      contentY += 55;
      ctx.fillText('To: Mr. Manav Patel', 60, contentY);

      // 6. Footer Zone (Fixed Position)
      const closingY = height - 390; // Fixed footer coordinate relative only to total height
      const maxAllowedY = closingY - 40; // Max allowed Y for paragraph to strictly prevent overlap

      // 5. Certificate Paragraph (Body Zone)
      contentY += 60;
      const certText = "This is to certify that Mr. Manav Patel has successfully completed a 1 month internship at APPIFLY INFOTECH as a Full Stack Development Intern. The internship took place from May 12, 2025 to June 14, 2025. Throughout the internship, he demonstrated dedication, enthusiasm, and a strong work ethic in their chosen field. Their contributions and skills have been invaluable to our team.\n\nWe are glad that you have worked with us.";
      
      ctx.fillStyle = '#444444';
      ctx.font = '22px Arial, sans-serif';
      
      const maxTextWidth = width - 120; // 60px margin on each side
      const lineHeight = 36;
      let y = contentY;

      // Handle explicit newlines first
      const paragraphs = certText.split('\n');
      
      let stopRendering = false;

      paragraphs.forEach((paragraph) => {
        if (stopRendering) return;

        if (paragraph === '') {
          if (y + lineHeight <= maxAllowedY) {
            y += lineHeight; // Empty line
          } else {
            stopRendering = true;
          }
          return;
        }

        const words = paragraph.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
          if (stopRendering) break;

          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxTextWidth && n > 0) {
            if (y + lineHeight > maxAllowedY) {
              stopRendering = true;
              break;
            }

            // Fully justified line rendering
            const wordsInLine = line.trim().split(' ');
            if (wordsInLine.length > 1) {
              const totalWordsWidth = wordsInLine.reduce((acc, word) => acc + ctx.measureText(word).width, 0);
              const extraSpace = (maxTextWidth - totalWordsWidth) / (wordsInLine.length - 1);
              let currentX = 60;
              for (let i = 0; i < wordsInLine.length; i++) {
                ctx.fillText(wordsInLine[i], currentX, y);
                currentX += ctx.measureText(wordsInLine[i]).width + extraSpace;
              }
            } else {
              ctx.fillText(line.trim(), 60, y);
            }
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        if (!stopRendering && line.trim() !== '') {
          if (y + lineHeight <= maxAllowedY) {
            ctx.fillText(line.trim(), 60, y); // Last line rendered default left-aligned
            y += lineHeight; 
          } else {
            stopRendering = true;
          }
        }
      });

      // Signature Section drawing
      ctx.fillStyle = '#333333';
      ctx.font = '22px sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('Yours Sincerely,', 60, closingY);

      let signatureY = closingY + 100; // Default signature position
      // Stamp
      const stampY = closingY + 30; // Closer vertical spacing
      if (stamp) {
        ctx.save();
        const stampWidth = 150; // Specified ~140px width
        const stampHeight = (stamp.height / stamp.width) * stampWidth;
        ctx.drawImage(stamp, 60, stampY, stampWidth, stampHeight);
        ctx.restore();
        
        // Safely flow the signatory text directly under the newly sized stamp
        signatureY = stampY + stampHeight + 20; 
      } else {
        // Fallback stamp drawing
        ctx.beginPath();
        ctx.arc(130, stampY + 70, 70, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('COMPANY', 130, stampY + 60);
        ctx.fillText('STAMP', 130, stampY + 80);
        
        signatureY = stampY + 170;
      }

      // Signatory Details
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      ctx.fillStyle = '#000000';
      ctx.font = '20px sans-serif'; // Clean professional text styling
      ctx.fillText('Raj Ghevariya', 60, signatureY);

      ctx.fillStyle = '#000000';
      ctx.font = '18px sans-serif';
      ctx.fillText('Co-founder & CTO', 60, signatureY + 25);
      
      ctx.fillStyle = '#000000';
      ctx.font = '18px sans-serif';
      ctx.fillText('APPIFLY INFOTECH', 60, signatureY + 50);

    });

  }, []);

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas 
        ref={canvasRef} 
        width={900} 
        height={1300} 
        style={{ width: '100%', height: 'auto', display: 'block', maxWidth: '800px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
      />
    </div>
  );
};

export default CertificateCanvas;
