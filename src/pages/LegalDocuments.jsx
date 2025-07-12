import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFileText, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { ethers } from 'ethers';
import { DOCUMENT_REGISTRY_ABI, DOCUMENT_REGISTRY_ADDRESS } from '../utils/contract';
// import { NFTStorage } from 'nft.storage';

function LegalDocuments() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState({
    title: '',
    documentType: 'contract',
    author: '',
    effectiveDate: '',
    expirationDate: '',
    description: '',
    category: 'corporate',
    tags: '',
    file: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastDocId, setLastDocId] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setErrors(prev => ({ ...prev, file: 'File size should be less than 10MB' }));
        return;
      }
      setForm(prev => ({ ...prev, file }));
      setErrors(prev => ({ ...prev, file: null }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropRejected: () => {
      setErrors(prev => ({ ...prev, file: 'Please upload a valid document (PDF, DOC, DOCX)' }));
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const removeFile = () => {
    setForm(prev => ({ ...prev, file: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.documentType) newErrors.documentType = 'Document type is required';
    if (!form.file) newErrors.file = 'Please upload a document';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper: Connect to contract
  const getContract = async () => {
    if (!window.ethereum) throw new Error('MetaMask not detected');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(
      DOCUMENT_REGISTRY_ADDRESS,
      DOCUMENT_REGISTRY_ABI,
      signer
    );
  };

  // Helper: Publish document to contract
  const publishDocument = async ({ title, docType, jurisdiction, ipfsHash }) => {
    const contract = await getContract();
    const tx = await contract.publishDocument(title, docType, jurisdiction, ipfsHash);
    await tx.wait();
    return tx;
  };

  // Helper: Fetch document by docId (bytes32)
  const getDocument = async (docId) => {
    const contract = await getContract();
    return await contract.getDocument(docId);
  };

  // Helper: Revoke document
  const revokeDocument = async (docId) => {
    const contract = await getContract();
    const tx = await contract.revokeDocument(docId);
    await tx.wait();
    return tx;
  };

  // Helper: Verify document
  const verifyDocument = async ({ ipfsHash, timestamp, publisher }) => {
    const contract = await getContract();
    return await contract.verifyDocument(ipfsHash, timestamp, publisher);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
      // Upload file to IPFS using Pinata
      let ipfsHash = '';
      if (form.file) {
        const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
        const PINATA_API_SECRET = process.env.REACT_APP_PINATA_API_SECRET ;
        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
          setErrors(prev => ({ ...prev, submit: 'Pinata API key/secret not set. Please set REACT_APP_PINATA_API_KEY and REACT_APP_PINATA_API_SECRET in your .env file.' }));
          return;
        }
        try {
          const data = new FormData();
          data.append('file', form.file);

          const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
              pinata_api_key: PINATA_API_KEY,
              pinata_secret_api_key: PINATA_API_SECRET
            },
            body: data
          });
          if (!res.ok) {
            throw new Error('Pinata upload failed: ' + res.statusText);
          }
          const result = await res.json();
          ipfsHash = result.IpfsHash;
        } catch (pinataErr) {
          setErrors(prev => ({ ...prev, submit: 'Failed to upload to IPFS: ' + pinataErr.message }));
          return;
        }
      }
      // Get contract instance for log parsing
      const contract = await getContract();
      const tx = await contract.publishDocument(form.title, form.documentType, form.category || '', ipfsHash);
      const receipt = await tx.wait();
      // Parse DocumentPublished event for docId
      let docId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed.name === 'DocumentPublished') {
            docId = parsed.args.docId;
            break;
          }
        } catch (err) { /* not this event */ }
      }
      setSubmitted(true);
      setForm({
        title: '',
        documentType: 'contract',
        author: '',
        effectiveDate: '',
        expirationDate: '',
        description: '',
        category: 'corporate',
        tags: '',
        file: null,
      });
      if (docId) setLastDocId(docId);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors(prev => ({ ...prev, submit: 'Failed to submit or publish to blockchain. Please try again.' }));
    }
  };

  useEffect(() => {
    if (lastDocId) {
      getDocument(lastDocId).then(setLastDoc).catch(console.error);
    }
  }, [lastDocId]);

  if (submitted) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow flex items-center justify-center">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Document Published!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Your legal document has been successfully published and is now accessible.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Publish Another Document
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Publish Legal Document</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Upload and publish your legal documents with all necessary metadata.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white dark:bg-gray-900 shadow rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Document Information</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Document Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className={`form-input w-full ${errors.title ? 'border-red-500' : ''}`}
                        placeholder="E.g., Non-Disclosure Agreement"
                      />
                      {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                    </div>

                    <div>
                      <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Document Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="documentType"
                        name="documentType"
                        value={form.documentType}
                        onChange={handleChange}
                        className="form-select w-full"
                      >
                        <option value="contract">Contract</option>
                        <option value="agreement">Agreement</option>
                        <option value="disclosure">Disclosure</option>
                        <option value="policy">Policy</option>
                        <option value="terms">Terms of Service</option>
                        <option value="privacy">Privacy Policy</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Author/Issuer
                      </label>
                      <input
                        type="text"
                        id="author"
                        name="author"
                        value={form.author}
                        onChange={handleChange}
                        className="form-input w-full"
                        placeholder="Name of the author or company"
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="form-select w-full"
                      >
                        <option value="corporate">Corporate</option>
                        <option value="employment">Employment</option>
                        <option value="intellectual-property">Intellectual Property</option>
                        <option value="real-estate">Real Estate</option>
                        <option value="financial">Financial</option>
                        <option value="compliance">Compliance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Effective Date
                      </label>
                      <input
                        type="date"
                        id="effectiveDate"
                        name="effectiveDate"
                        value={form.effectiveDate}
                        onChange={handleChange}
                        className="form-input w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Expiration Date (if applicable)
                      </label>
                      <input
                        type="date"
                        id="expirationDate"
                        name="expirationDate"
                        value={form.expirationDate}
                        onChange={handleChange}
                        className="form-input w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={form.description}
                      onChange={handleChange}
                      className="form-textarea w-full"
                      placeholder="Provide a brief description of the document"
                    />
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={form.tags}
                      onChange={handleChange}
                      className="form-input w-full"
                      placeholder="E.g., nda, confidential, 2024 (comma-separated)"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Add relevant keywords to help with searching</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 shadow rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Document Upload <span className="text-red-500">*</span></h2>
                </div>
                <div className="p-6">
                  {!form.file ? (
                    <div 
                      {...getRootProps()} 
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                        isDragActive 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                          : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                          <FiUpload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {isDragActive ? 'Drop the file here' : 'Drag and drop your document here'}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            PDF, DOC, or DOCX (max. 10MB)
                          </p>
                        </div>
                        <button
                          type="button"
                          className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Select File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                          <FiFileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                            {form.file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(form.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        aria-label="Remove file"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {errors.file && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.file}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Publish Document
                </button>
              </div>

              {errors.submit && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        {errors.submit}
                      </h3>
                    </div>
                  </div>
                </div>
              )}
            </form>
            {lastDoc && (
              <div className="mt-8 p-4 border rounded bg-white dark:bg-gray-900">
                <h3 className="font-bold mb-2">Published Document</h3>
                <p><b>Title:</b> {lastDoc.title}</p>
                <p><b>Type:</b> {lastDoc.docType}</p>
                <p><b>Jurisdiction:</b> {lastDoc.jurisdiction}</p>
                <p><b>IPFS Hash:</b> {lastDoc.ipfsHash}</p>
                <p><b>Publisher:</b> {lastDoc.publisher}</p>
                <p><b>Timestamp:</b> {lastDoc.timestamp ? new Date(Number(lastDoc.timestamp) * 1000).toLocaleString() : ''}</p>
                <p><b>Revoked:</b> {lastDoc.isRevoked ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default LegalDocuments; 
