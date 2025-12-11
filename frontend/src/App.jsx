import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileUpload } from './components/ui/file-upload'
import './App.css'

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [documents, setDocuments] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadKey, setUploadKey] = useState(0) // Key to reset FileUpload component

  const API_URL = 'http://localhost:5000/documents'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    fetchDocuments()
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(API_URL)
      setDocuments(response.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
      showFeedback('Failed to load documents.', true)
    }
  }

  const handleFileChange = (files) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0])
      setMessage('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      showFeedback('Please select a file first.', true)
      return
    }

    if (selectedFile.type !== 'application/pdf') {
      showFeedback('Only PDF files are allowed.', true)
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    setUploading(true)
    try {
      await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      showFeedback('File uploaded successfully!', false)
      setSelectedFile(null)
      fetchDocuments()
      setUploadKey(prev => prev + 1)
    } catch (error) {
      console.error('Upload error:', error)
      showFeedback('Failed to upload file. Please try again.', true)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (id, filename) => {
    try {
      showFeedback('Starting download...', false);
      const response = await axios.get(`${API_URL}/${id}`, {
        params: { download: filename },
        responseType: 'blob',
      });

      // Create a blob URL and trigger the download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Explicitly set the filename to patient-report.pdf as requested
      // (Or use the dynamic filename if you prefer, but strict request asked for this)
      link.setAttribute('download', "patient-report.pdf");

      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showFeedback('Download complete!', false);

    } catch (error) {
      console.error('Download error:', error);
      showFeedback('Failed to download file. It may be missing.', true);
    }
  }

  // ... imports and other code ...
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState(null)

  // ... 

  const handleDeleteClick = (id) => {
    setDocToDelete(id)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!docToDelete) return;

    try {
      await axios.delete(`${API_URL}/${docToDelete}`)
      setDocuments(prev => prev.filter(doc => doc.id !== docToDelete))
      showFeedback('File deleted.', false)
      setDeleteModalOpen(false)
      setDocToDelete(null)
    } catch (error) {
      console.error('Delete error:', error)
      showFeedback('Could not delete file.', true)
    }
  }

  const showFeedback = (msg, error = false) => {
    setMessage(msg)
    setIsError(error)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Patient Portal</h1>
        <button onClick={toggleTheme} className="btn-secondary">
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </header>

      <main className="content w-full max-w-4xl mx-auto p-4 z-10 relative">
        <section className="relative w-full max-w-2xl mx-auto mb-12">
          {/* Subtle Gradient Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-2xl rounded-3xl -z-10" />

          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
            {/* Minimal Input Area */}
            <div className="group w-full min-h-[200px] border-2 border-dashed border-neutral-100 dark:border-neutral-800/50 hover:border-blue-500/30 bg-neutral-50/30 dark:bg-neutral-950/20 rounded-2xl transition-all duration-300 overflow-hidden">
              <FileUpload key={uploadKey} onChange={handleFileChange} />
            </div>

            {/* Minimal Action Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="group relative cursor-pointer disabled:cursor-not-allowed"
              >
                {/* Outer Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-30 group-hover:opacity-75 transition duration-500 group-disabled:opacity-0" />

                {/* Button Content */}
                <div className="relative px-16 py-4 bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-200 rounded-full flex items-center gap-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-disabled:translate-y-0 group-disabled:from-neutral-300 group-disabled:to-neutral-300 dark:group-disabled:from-neutral-800 dark:group-disabled:to-neutral-800">
                  {uploading ? (
                    <div className="h-5 w-5 border-2 border-white/50 dark:border-black/50 border-t-white dark:border-t-black rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white dark:text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  )}
                  <span className="text-base font-bold text-white dark:text-black">
                    {uploading ? 'Uploading File...' : 'Upload PDF'}
                  </span>
                </div>
              </button>
            </div>

            {message && (
              <div className={`mt-4 text-center text-sm font-medium ${isError ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </div>
            )}
          </div>
        </section>

        <section className="list-section bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-lg">

          {documents.length === 0 ? (
            <p className="empty-state">No documents uploaded yet.</p>
          ) : (
            <div className="document-list">
              {documents.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="doc-info">
                    <span className="doc-name font-medium text-sm text-neutral-700 dark:text-neutral-200">{doc.filename}</span>
                    <span className="doc-meta text-xs text-neutral-500 dark:text-neutral-500">
                      {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="doc-actions">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(`${API_URL}/${doc.id}?inline=true`, '_blank');
                      }}
                      className="btn-secondary z-20 relative cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDownload(doc.id, doc.filename);
                      }}
                      className="btn-secondary z-20 relative cursor-pointer"
                    >
                      Download
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteClick(doc.id);
                      }}
                      className="btn-danger z-20 relative cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-neutral-200 dark:border-neutral-800"
            style={{
              transform: 'scale(1)',
              transition: 'all 0.2s',
              animation: 'pulse 0.2s ease-out'
            }}
          >
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Delete Document?</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 font-normal">
              Are you sure you want to delete this file? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-lg shadow-red-500/20 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
