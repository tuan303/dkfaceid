/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [studentId, setStudentId] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (selectedFile) {
      const fileName = selectedFile.name;
      const fileExtMatch = fileName.match(/\.(jpg|jpeg|png)$/i);
      
      if (!selectedFile.type.startsWith('image/') || !fileExtMatch) {
        setUploadStatus({ type: 'error', message: 'Không đúng định dạng file. Vui lòng chọn ảnh JPG, JPEG hoặc PNG.' });
        return;
      }

      if (selectedFile.size > 3 * 1024 * 1024) {
        setUploadStatus({ type: 'error', message: 'Kích thước ảnh không được vượt quá 3MB.' });
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setUploadStatus(null);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    if (!studentId || !/^(26\d{6}|2520\d{4})$/.test(studentId)) {
      setUploadStatus({ type: 'error', message: 'Tên file ảnh không đúng quy định (26xxxxxx hoặc 260xxxxx hoặc 2520xxxx).' });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    const fileExt = file.name.substring(file.name.lastIndexOf('.'));
    const newFileName = `${studentId}${fileExt}`;
    const newFile = new File([file], newFileName, { type: file.type });

    const formData = new FormData();
    formData.append('file', newFile);

    try {
      const response = await fetch('/api/submit-photo', {
        method: 'POST',
        body: formData,
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Lỗi máy chủ (${response.status}): Tệp có thể quá lớn hoặc lỗi mạng.`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Tải lên thất bại');
      }

      setUploadStatus({ type: 'success', message: 'Tải ảnh lên thành công!' });
      setFile(null);
      setPreview(null);
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        setUploadStatus({ type: 'error', message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại hoặc tải lại trang.' });
      } else {
        setUploadStatus({ type: 'error', message: error.message || 'Có lỗi xảy ra khi tải ảnh lên.' });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white text-gray-900 font-sans pb-safe">
      <div className="max-w-md mx-auto px-4 pt-3 sm:pt-4 flex flex-col h-[100dvh] max-h-[100dvh]">
        
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-2">
          {/* Header / Logo */}
          <div className="flex justify-center mb-2 sm:mb-4">
            <img src="https://hoangmaistarschool.edu.vn/thongtin/LogoNSHM.png" alt="Logo Ngôi Sao Hoàng Mai" className="h-[40px] sm:h-[50px] object-contain" />
          </div>

          <h2 className="text-[16px] sm:text-[18px] font-bold mb-1 text-black tracking-tight leading-snug text-center">ĐĂNG KÝ ẢNH FACEID HỌC SINH MỚI</h2>
          <p className="text-center text-[#c51f27] italic text-[11px] sm:text-[12px] mb-3 sm:mb-4 font-medium whitespace-nowrap">(Học sinh đã học tại trường không cần nộp lại ảnh thẻ)</p>

          {/* Upload Box */}
          <div 
            className={`relative border ${isDragging ? 'border-red-600 bg-red-50' : 'border-[#c51f27]'} rounded-2xl overflow-hidden mb-3 sm:mb-4 shadow-sm transition-colors cursor-pointer flex-shrink-0`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={(e) => e.target.files && e.target.files.length > 0 && handleFile(e.target.files[0])}
            />
            {/* Top Red Decoration */}
            <div className="absolute top-0 w-full h-8 sm:h-10 flex">
              <div className="w-6 sm:w-8 h-full bg-[#c51f27]"></div>
              <div className="flex-1 h-2 sm:h-3 bg-[#c51f27]"></div>
              <div className="w-6 sm:w-8 h-full bg-[#c51f27]"></div>
            </div>
            <div className="absolute top-0 w-full h-8 sm:h-10 flex px-6 sm:px-8">
              <div className="flex-1 bg-white h-8 sm:h-10 rounded-tl-[12px] rounded-tr-[12px] sm:rounded-tl-[16px] sm:rounded-tr-[16px]"></div>
            </div>
            
            {/* Upload Content */}
            <div className={`relative pt-2 pb-3 px-4 flex flex-col items-center ${isDragging ? 'bg-red-50' : 'bg-white'}`}>
              {preview ? (
                <div className="relative w-full max-w-[100px] sm:max-w-[120px] aspect-[3/4] mb-2 sm:mb-3 rounded-lg overflow-hidden border border-gray-200">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-2 sm:mb-3 text-[#c51f27]">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M4 7C2.89 7 2 7.89 2 9V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V9C22 7.89 21.11 7 20 7H16.83L15 5H9L7.17 7H4ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" />
                       <circle cx="12" cy="12" r="3.5" fill="white" />
                    </svg>
                    
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px]">
                      <div className="bg-[#c51f27] rounded-full p-0.5 text-white">
                        <svg width="8" height="8" className="sm:w-2.5 sm:h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-black font-medium mb-2 sm:mb-3 text-[12px] sm:text-[14px] text-center">
                    {file ? file.name : 'Kéo và thả ảnh hoặc nhấn để chọn'}
                  </p>
                  
                  <button 
                    className="bg-[#c51f27] text-white px-5 py-1.5 sm:px-6 sm:py-2 rounded-xl font-semibold text-[13px] sm:text-[14px] hover:bg-red-800 transition-colors shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Chọn ảnh
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-800 text-[12px] sm:text-[13px] font-bold mb-1.5 sm:mb-2 space-y-1">
              <div>- Đặt tên file theo mã học sinh của trường gồm 8 chữ số: 26xxxxxx hoặc 2520xxxx.</div>
              <div>- Đối với học sinh chỉ tham gia trại hè đặt tên file ảnh theo cú pháp: <span className="text-[#c51f27] font-bold">260+mã dự tuyển (5 chữ số)</span>.</div>
            </label>
            <input
              type="text"
              className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#c51f27] focus:ring-1 focus:ring-[#c51f27] text-[13px] sm:text-sm"
              placeholder="Ví dụ: 26123456, 26012345, 25201234"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>

          <div className="mb-2 sm:mb-4">
            <h3 className="font-bold text-black text-[14px] sm:text-[15px] mb-1.5 sm:mb-2">Hướng dẫn chụp ảnh</h3>
            
            <div className="mb-1.5 sm:mb-2 rounded-lg overflow-hidden border border-gray-200">
              <img src="https://hoangmaistarschool.edu.vn/thongtin/dkfaceid.png" alt="Hướng dẫn chụp ảnh" className="w-full h-auto object-contain bg-gray-50" />
            </div>
            <div className="text-gray-800 text-[11px] sm:text-[12px] space-y-0.5 sm:space-y-1 font-medium">
              <p>- Kích thước tối thiểu 720x1280px</p>
              <p>- Định dạng: JPG, JPEG, PNG</p>
            </div>
          </div>

          {uploadStatus && uploadStatus.type === 'error' && (
            <div className="p-2 sm:p-3 mb-2 sm:mb-3 rounded-lg text-[12px] sm:text-sm font-medium bg-red-50 text-red-800 border border-red-200">
              {uploadStatus.message}
            </div>
          )}
        </div>

        <div className="pt-2 pb-4 sm:pb-6 mt-auto">
          <button 
            className={`w-full text-white py-2.5 sm:py-3 rounded-xl font-bold text-[15px] sm:text-[16px] transition-colors shadow-sm ${!file || uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#c51f27] hover:bg-red-800'}`}
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
          </button>
        </div>
      </div>

      {/* Success Popup */}
      {uploadStatus && uploadStatus.type === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Thành công!</h3>
            <p className="text-gray-600 mb-6 font-medium">Ba/Mẹ đã đăng ký thành công!</p>
            <button 
              className="w-full bg-[#c51f27] text-white py-2.5 rounded-xl font-bold hover:bg-red-800 transition-colors"
              onClick={() => {
                setUploadStatus(null);
                setStudentId('');
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

