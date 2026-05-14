"use client";

import { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  file: File | null;
  onFileSelect: (file: File) => void;
}

export default function UploadDropzone({ file, onFileSelect }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-[#6C5CE7] bg-[#F3E8FF]"
            : file
              ? "border-[#4CAF50] bg-[#E8F5E9]"
              : "border-[#E3E2DE] bg-[#FBFBFA] hover:border-[#C3C2BF]"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-[#4CAF50] font-medium text-sm">選択済み: {file.name}</p>
            </div>
            <p className="text-sm text-[#6B6B6B]">
              {(file.size / 1024 / 1024).toFixed(1)} MB — クリックまたはドラッグで変更
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <svg className="w-10 h-10 text-[#C3C2BF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-[#37352F] font-medium text-sm">
              答案の写真をドラッグ＆ドロップ
            </p>
            <p className="text-sm text-[#9B9A97]">
              またはクリックしてファイルを選択（JPG / PNG / WebP、最大10MB）
            </p>
          </div>
        )}
      </div>

      {/* モバイルカメラ撮影ボタン */}
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        className="w-full py-3 border-2 border-[#6C5CE7]/30 bg-[#F3E8FF] text-[#6C5CE7] rounded-xl font-medium text-sm hover:bg-[#EDE0FF] transition-colors flex items-center justify-center gap-2 sm:hidden"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        カメラで撮影
      </button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />
    </div>
  );
}
