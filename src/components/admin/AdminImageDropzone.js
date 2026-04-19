import React, { useRef, useState } from 'react';

const AdminImageDropzone = ({
  title = 'Drag & drop gambar di sini',
  hint = 'Klik area ini atau tarik gambar ke sini.',
  folderLabel = '',
  isUploading = false,
  onFilesSelected
}) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((file) => file?.type?.startsWith('image/'));

    if (!files.length) {
      return;
    }

    onFilesSelected?.(files);
  };

  const clearDragState = () => setIsDragging(false);

  return (
    <div
      className={`admin-upload-dropzone ${isDragging ? 'active' : ''} ${isUploading ? 'is-uploading' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        clearDragState();
      }}
      onDrop={(event) => {
        event.preventDefault();
        clearDragState();
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        className="admin-upload-hidden-input"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <strong>{isUploading ? 'Mengunggah gambar...' : title}</strong>
      <span>{isUploading ? 'Tunggu sebentar sampai gambar selesai diproses.' : hint}</span>
      {folderLabel ? <small>{folderLabel}</small> : null}
    </div>
  );
};

export default AdminImageDropzone;
