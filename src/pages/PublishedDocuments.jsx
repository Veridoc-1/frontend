import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { DOCUMENT_REGISTRY_ABI, DOCUMENT_REGISTRY_ADDRESS } from '../utils/contract';

function PublishedDocuments() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!window.ethereum) throw new Error('MetaMask not detected');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          DOCUMENT_REGISTRY_ADDRESS,
          DOCUMENT_REGISTRY_ABI,
          provider
        );
        // Query all DocumentPublished events
        const filter = contract.filters.DocumentPublished();
        const logs = await contract.queryFilter(filter, 0, 'latest');
        // Get unique docIds (in case of duplicates)
        const docIds = Array.from(new Set(logs.map(log => log.args.docId)));
        // Fetch details for each docId
        const docs = await Promise.all(
          docIds.map(async (docId) => {
            const doc = await contract.getDocument(docId);
            // Map struct fields by index for compatibility
            return {
              docId,
              publisher: doc.publisher ?? doc[0],
              title: doc.title ?? doc[1],
              docType: doc.docType ?? doc[2],
              jurisdiction: doc.jurisdiction ?? doc[3],
              ipfsHash: doc.ipfsHash ?? doc[4],
              timestamp: doc.timestamp ?? doc[5],
              isRevoked: doc.isRevoked ?? doc[6],
            };
          })
        );
        setDocuments(docs);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchDocuments();
  }, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Published Documents</h2>
      {loading && <p>Loading documents...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && documents.length === 0 && <p>No documents found.</p>}
      {!loading && !error && documents.length > 0 && (
        <div className="space-y-4">
          {documents.map((doc, idx) => (
            <div key={doc.docId} className="border rounded p-4 bg-white dark:bg-gray-900">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{doc.title}</div>
                  <div className="text-sm text-gray-500">Type: {doc.docType} | Jurisdiction: {doc.jurisdiction}</div>
                  <div className="text-xs mt-1">
                    {doc.ipfsHash && (
                      <a href={`https://ipfs.io/ipfs/${doc.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">View file on IPFS</a>
                    )}
                  </div>
                </div>
                <button
                  className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  onClick={() => setSelectedDoc(doc)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal or section for selected document */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-8 rounded shadow-lg max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setSelectedDoc(null)}
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-2">Document Details</h3>
            <p><b>Title:</b> {selectedDoc.title}</p>
            <p><b>Type:</b> {selectedDoc.docType}</p>
            <p><b>Jurisdiction:</b> {selectedDoc.jurisdiction}</p>
            <p><b>IPFS Hash:</b> {selectedDoc.ipfsHash}</p>
            {selectedDoc.ipfsHash && (
              <p className="mt-2">
                <a href={`https://ipfs.io/ipfs/${selectedDoc.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Open file on IPFS</a>
              </p>
            )}
            <p><b>Publisher:</b> {selectedDoc.publisher}</p>
            <p><b>Timestamp:</b> {selectedDoc.timestamp ? new Date(Number(selectedDoc.timestamp) * 1000).toLocaleString() : ''}</p>
            <p><b>Revoked:</b> {selectedDoc.isRevoked ? 'Yes' : 'No'}</p>
            <p className="mt-3 text-xs text-gray-500 break-all"><b>docId:</b> {selectedDoc.docId}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublishedDocuments;
