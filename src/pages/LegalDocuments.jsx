import React, { useState } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import Banner from '../partials/Banner';

function LegalDocuments() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    author: '',
    date: '',
    description: '',
    file: null,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // send to backend
    setSubmitted(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Publish Legal Document</h1>
            </div>
            <form className="space-y-6 bg-white dark:bg-gray-900 p-8 rounded shadow" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
                <input type="text" id="title" name="title" className="form-input w-full" value={form.title} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="author">Author</label>
                <input type="text" id="author" name="author" className="form-input w-full" value={form.author} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="date">Date</label>
                <input type="date" id="date" name="date" className="form-input w-full" value={form.date} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
                <textarea id="description" name="description" className="form-input w-full" value={form.description} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="file">Upload Document</label>
                <input type="file" id="file" name="file" className="form-input w-full" onChange={handleChange} required />
              </div>
              <div>
                <button type="submit" className="btn bg-violet-500 hover:bg-violet-600 text-white w-full">Publish</button>
              </div>
              {submitted && <div className="text-green-600 font-medium">Document submitted successfully!</div>}
            </form>
          </div>
        </main>
        <Banner />
      </div>
    </div>
  );
}

export default LegalDocuments; 