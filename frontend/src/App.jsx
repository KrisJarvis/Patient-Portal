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

  const handleDownload = (id, filename) => {
    window.location.href = `${API_URL}/${id}?download=${encodeURIComponent(filename)}&t=${Date.now()}`;
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
        <section className="upload-section bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-lg mb-8">

          <div className="w-full max-w-4xl mx-auto min-h-64 border border-dashed bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 rounded-lg">
            <FileUpload key={uploadKey} onChange={handleFileChange} />
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-transform duration-200"
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-neutral-950 px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl gap-2">
                {uploading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    Upload PDF
                  </>
                )}
              </span>
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${isError ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
              {message}
            </div>
          )}
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
