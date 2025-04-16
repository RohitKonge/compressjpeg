import React, { useState, useCallback, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Upload, Download, Package, Image as ImageIcon, X } from 'lucide-react';

interface CompressedImage {
  original: File;
  compressed: Blob;
  preview: string;
  name: string;
  originalSize: number;
  compressedSize: number;
}

function App() {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const compressImage = async (file: File): Promise<CompressedImage> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    const compressedBlob = await imageCompression(file, options);
    const preview = URL.createObjectURL(compressedBlob);

    return {
      original: file,
      compressed: compressedBlob,
      preview,
      name: file.name,
      originalSize: file.size,
      compressedSize: compressedBlob.size,
    };
  };

  const handleFiles = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const compressedImages = await Promise.all(imageFiles.map(compressImage));
    setImages(prev => [...prev, ...compressedImages]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleDownloadSingle = (image: CompressedImage) => {
    saveAs(image.compressed, `compressed_${image.name}`);
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) return;

    const zip = new JSZip();
    images.forEach((image) => {
      zip.file(`compressed_${image.name}`, image.compressed);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'compressed_images.zip');
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8" itemScope itemType="https://schema.org/WebApplication">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" itemProp="name">Free Online JPEG Compressor</h1>
          <p className="text-xl text-gray-600 mb-2">The Best Free Tool to Compress JPEG Images Online</p>
          <p className="text-lg text-gray-600" itemProp="description">
            Compress multiple JPEG images instantly without losing quality. Save up to 80% storage space.
            No registration required. 100% secure browser-based compression.
          </p>
        </header>

        <section 
          className={`border-2 border-dashed rounded-lg p-8 mb-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            aria-label="Choose files to compress"
          />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Drop Your JPEG Images Here or Click to Upload
          </h2>
          <p className="text-sm text-gray-500">
            Supports JPEG, JPG, PNG, WebP • No file size limits • 100% Free
          </p>
        </section>

        {images.length > 0 && (
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Compressed Images ({images.length})
            </h2>
            <button
              onClick={handleDownloadAll}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="Download all compressed images as ZIP"
            >
              <Package className="w-5 h-5 mr-2" aria-hidden="true" />
              Download All
            </button>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-4 flex space-x-4 snap-x snap-mandatory mb-12"
          role="list"
          aria-label="Compressed images gallery"
        >
          {images.map((image, index) => (
            <article
              key={index}
              className="flex-none w-72 snap-start bg-white rounded-lg shadow-md overflow-hidden relative"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute top-2 right-2 p-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-sm z-10 transition-all"
                aria-label={`Remove ${image.name}`}
              >
                <X className="w-4 h-4 text-gray-600 hover:text-gray-900" />
              </button>
              <div className="h-48 bg-gray-100 relative">
                <img
                  src={image.preview}
                  alt={`Preview of ${image.name}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate mb-2">{image.name}</h3>
                <dl className="text-sm text-gray-500 space-y-1">
                  <div>
                    <dt className="inline">Original: </dt>
                    <dd className="inline">{formatSize(image.originalSize)}</dd>
                  </div>
                  <div>
                    <dt className="inline">Compressed: </dt>
                    <dd className="inline">{formatSize(image.compressedSize)}</dd>
                  </div>
                  <div>
                    <dt className="inline">Saved: </dt>
                    <dd className="inline text-green-600">
                      {((1 - image.compressedSize / image.originalSize) * 100).toFixed(1)}%
                    </dd>
                  </div>
                </dl>
                <button
                  onClick={() => handleDownloadSingle(image)}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  aria-label={`Download compressed ${image.name}`}
                >
                  <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                  Download
                </button>
              </div>
            </article>
          ))}
          {images.length === 0 && (
            <div className="w-full flex items-center justify-center p-8 bg-gray-100 rounded-lg">
              <div className="text-center text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-4" aria-hidden="true" />
                <p>No images uploaded yet</p>
              </div>
            </div>
          )}
        </div>

        <article className="max-w-3xl mx-auto space-y-8 text-gray-800">
          <section>
            <h2 className="text-2xl font-bold mb-4">Professional JPEG Compression Technology</h2>
            <p className="mb-4">
              Our advanced JPEG compression algorithm utilizes state-of-the-art technology to reduce file sizes by up to 80% while preserving image quality. Perfect for photographers, web developers, and anyone needing to optimize their images.
            </p>
            <ul className="grid grid-cols-2 gap-4 my-6">
              <li className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Intelligent compression</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Batch processing</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>No quality loss</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Instant results</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Why Choose Our JPEG Compressor?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Advanced Technology</h3>
                <p>Our compression engine uses sophisticated algorithms to analyze and optimize each image individually, ensuring the perfect balance between file size and quality.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">100% Privacy</h3>
                <p>All compression happens directly in your browser. Your images never leave your device, making it completely safe and secure to use.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No Registration</h3>
                <p>Start compressing images instantly - no sign-up, no email required. Just drag, drop, and download your optimized images.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Batch Processing</h3>
                <p>Save time by compressing multiple images at once. Download individually or get all compressed images in a convenient ZIP file.</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">How much does it cost?</h3>
                <p>Our JPEG compressor is completely free to use. No hidden fees, no premium features - everyone gets access to our full compression capabilities.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">What's the maximum file size?</h3>
                <p>There are no file size limits. You can compress images of any size, and process multiple files simultaneously.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Will I lose image quality?</h3>
                <p>Our intelligent compression algorithm maintains optimal image quality while reducing file size. You'll get the perfect balance between size and quality.</p>
              </div>
            </div>
          </section>

          <footer className="text-center text-sm text-gray-500 mt-12 pt-8 border-t">
            <p className="mb-2">Trusted by millions of users worldwide for fast, secure image compression.</p>
            <p>All processing happens in your browser. Your images never leave your device.</p>
            <p className="mt-2">© 2007-2025 Image Compression Tools</p>
          </footer>
        </article>
      </div>
    </main>
  );
}

export default App;