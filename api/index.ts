import express from 'express';
import multer from 'multer';

const app = express();
app.use(express.json());

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 } // 3MB limit
});

// API Route to upload file to Google Drive via Google Apps Script
app.post('/api/submit-photo', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Kích thước ảnh không được vượt quá 3MB.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn ảnh' });
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      return res.status(500).json({ 
        error: 'Hệ thống chưa được cấu hình GOOGLE_SCRIPT_URL. Vui lòng làm theo hướng dẫn tạo Google Apps Script và thêm vào Secrets.' 
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const base64Data = buffer.toString('base64');

    // Gửi request tới Google Apps Script Web App
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: originalname,
        mimeType: mimetype,
        fileData: base64Data
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Phản hồi từ Apps Script không hợp lệ: ${responseText.substring(0, 100)}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Lỗi khi lưu file trên Google Drive');
    }

    res.json({ success: true, fileUrl: data.fileUrl });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message || 'Lỗi server khi xử lý upload' });
  }
});

export default app;
