/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
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
      
      const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      if (!/^26\d{6}$/.test(fileNameWithoutExt)) {
        setUploadStatus({ type: 'error', message: 'Tên file không đúng quy định' });
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

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
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
      setUploadStatus({ type: 'error', message: error.message || 'Có lỗi xảy ra khi tải ảnh lên.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-12">
      <div className="max-w-md mx-auto px-4 pt-6">
        
        {/* Header / Logo */}
        <div className="flex justify-center mb-8">
          <img src="https://hoangmaistarschool.edu.vn/thongtin/LogoNSHM.png" alt="Logo Ngôi Sao Hoàng Mai" className="h-[70px] object-contain" />
        </div>

        <h2 className="text-[20px] sm:text-[22px] font-bold mb-1 text-black tracking-tight leading-snug text-center">ĐĂNG KÝ ẢNH FACEID HỌC SINH MỚI</h2>
        <p className="text-center text-[#c51f27] italic text-[14px] sm:text-[18px] mb-6 font-medium whitespace-nowrap">(Học sinh đã học tại trường không cần nộp lại ảnh thẻ)</p>

        {/* Upload Box */}
        <div 
          className={`relative border ${isDragging ? 'border-red-600 bg-red-50' : 'border-[#c51f27]'} rounded-2xl overflow-hidden mb-10 shadow-sm transition-colors cursor-pointer`}
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
          <div className="absolute top-0 w-full h-10 flex">
            <div className="w-8 h-full bg-[#c51f27]"></div>
            <div className="flex-1 h-3 bg-[#c51f27]"></div>
            <div className="w-8 h-full bg-[#c51f27]"></div>
          </div>
          <div className="absolute top-0 w-full h-10 flex px-8">
            <div className="flex-1 bg-white h-10 rounded-tl-[16px] rounded-tr-[16px]"></div>
          </div>
          
          {/* Upload Content */}
          <div className={`relative pt-12 pb-8 px-4 flex flex-col items-center ${isDragging ? 'bg-red-50' : 'bg-white'}`}>
            {preview ? (
              <div className="relative w-full max-w-[200px] aspect-[3/4] mb-5 rounded-lg overflow-hidden border border-gray-200">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ) : (
              <>
                <div className="relative mb-5 text-[#c51f27]">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M4 7C2.89 7 2 7.89 2 9V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V9C22 7.89 21.11 7 20 7H16.83L15 5H9L7.17 7H4ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" />
                     <circle cx="12" cy="12" r="3.5" fill="white" />
                  </svg>
                  
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-[3px]">
                    <div className="bg-[#c51f27] rounded-full p-1 text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <p className="text-black font-medium mb-5 text-[16px] text-center">
                  {file ? file.name : 'Kéo và thả ảnh hoặc nhấn để chọn'}
                </p>
                
                <button 
                  className="bg-[#c51f27] text-white px-8 py-2.5 rounded-xl font-semibold text-[15px] hover:bg-red-800 transition-colors shadow-sm"
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

        <h3 className="text-[22px] font-bold mb-4 text-black">Hướng dẫn chụp ảnh</h3>

        <div className="mb-6 rounded-lg overflow-hidden border border-gray-200">
          <img src="https://hoangmaistarschool.edu.vn/thongtin/dkfaceid.png" alt="Hướng dẫn chụp ảnh" className="w-full h-auto object-contain bg-gray-50" />
        </div>

        <div className="text-gray-800 text-[16px] space-y-1.5 mb-8 font-medium">
          <p>- Kích thước tối thiểu 720x1280px</p>
          <p>- Định dạng: JPG, JPEG, PNG</p>
          <p>- Đặt tên file theo mã học sinh của trường gồm 8 chữ số: 26xxxxxx.</p>
          <p>- Đối với học sinh chỉ tham gia trại hè đặt tên file ảnh theo cú pháp: <span className="text-[#c51f27] font-bold">260+mã dự tuyển (5 chữ số)</span>.</p>
        </div>

        {uploadStatus && (
          <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${uploadStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {uploadStatus.message}
          </div>
        )}

        <button 
          className={`w-full text-white py-3.5 rounded-[14px] font-bold text-[17px] transition-colors shadow-sm ${!file || uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#c51f27] hover:bg-red-800'}`}
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
        </button>
      </div>
    </div>
  );
}

