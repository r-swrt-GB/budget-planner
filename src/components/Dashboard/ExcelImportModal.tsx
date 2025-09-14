import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { downloadTemplateExcel } from '../../lib/excelTemplate';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
  userId?: string;
}

export function ExcelImportModal({ isOpen, onClose, onImport, userId }: ExcelImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTemplateDownload = async () => {
    if (!userId) {
      alert('User ID not available. Please try again.');
      return;
    }
    
    setDownloadingTemplate(true);
    try {
      await downloadTemplateExcel(userId);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template. Please try again.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a valid Excel file (.xlsx)');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a valid Excel file (.xlsx)');
      }
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile);
      setSelectedFile(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Import Budget from Excel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Import Instructions</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Upload an Excel file (.xlsx) that was previously exported from this app</li>
                  <li>• The file should contain "Income Items", "Deductions", and "Expenses" sheets</li>
                  <li>• Data from these sheets will pre-populate the budget creation form</li>
                  <li>• Recurring items will be ignored during import</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-sm text-blue-800 mb-2">
                    Don't have an Excel file? Download our template to get started:
                  </p>
                  <button
                    onClick={handleTemplateDownload}
                    disabled={downloadingTemplate}
                    className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900 underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {downloadingTemplate ? 'Generating Template...' : 'Download Excel Template'}
                  </button>
                  {userId && (
                    <p className="text-xs text-blue-600 mt-1">
                      Template will include your saved recurring items
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-green-400 bg-green-50'
                : selectedFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <FileSpreadsheet className="h-12 w-12 text-green-600 mx-auto" />
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your Excel file here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-green-600 hover:text-green-700 underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">Supports .xlsx files only</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import & Create Budget
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
