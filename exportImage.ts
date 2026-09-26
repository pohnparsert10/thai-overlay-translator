import { OverlayItem } from '../types.ts';

/**
 * Exports the current image with the Thai overlay boxes cleanly rendered on top.
 */
export async function exportImageWithOverlay(
  imageSrc: string,
  items: OverlayItem[],
  filename = 'Thai-Overlay-Translation.png',
  options: {
    opacity?: number;
    theme?: string;
  } = {}
): Promise<void> {
  const { opacity = 0.9, theme = 'bubble' } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2d context');

        // Draw base image
        ctx.drawImage(img, 0, 0);

        // Draw overlays
        for (const item of items) {
          const [ymin, xmin, ymax, xmax] = item.box_2d;
          const x = (xmin / 1000) * canvas.width;
          const y = (ymin / 1000) * canvas.height;
          const width = ((xmax - xmin) / 1000) * canvas.width;
          const height = ((ymax - ymin) / 1000) * canvas.height;

          ctx.save();
          // Draw backdrop
          if (theme === 'bubble') {
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = Math.max(2, canvas.width * 0.002);
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#0a0a0a';
          } else if (theme === 'neon') {
            ctx.fillStyle = `rgba(10, 15, 30, ${opacity})`;
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = Math.max(2, canvas.width * 0.002);
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, 6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#e0f2fe';
          } else {
            // dark / glass
            ctx.fillStyle = `rgba(15, 15, 20, ${opacity})`;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, 6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#f8fafc';
          }

          // Calculate font size
          const fontSize = Math.max(12, Math.min(28, Math.floor(height * 0.22)));
          ctx.font = `600 ${fontSize}px 'Noto Sans Thai', 'Plus Jakarta Sans', sans-serif`;
          ctx.textBaseline = 'middle';

          // Word wrap text inside bounding box
          const text = item.translated_thai;
          const maxTextWidth = width - 16;
          const words = text.split(' ');
          let line = '';
          const lines: string[] = [];

          for (let i = 0; i < words.length; i++) {
            const testLine = line + (line ? ' ' : '') + words[i];
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxTextWidth && i > 0) {
              lines.push(line);
              line = words[i];
            } else {
              line = testLine;
            }
          }
          if (line) lines.push(line);

          // Render lines centered vertically
          const lineHeight = fontSize * 1.35;
          const totalTextHeight = lines.length * lineHeight;
          let textY = y + (height - totalTextHeight) / 2 + lineHeight / 2;

          for (const l of lines) {
            ctx.fillText(l, x + 8, textY);
            textY += lineHeight;
          }

          ctx.restore();
        }

        // Trigger download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = imageSrc;
  });
}
