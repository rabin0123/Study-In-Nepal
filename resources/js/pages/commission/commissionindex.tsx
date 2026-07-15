import React, { useState, useEffect, useMemo, useRef } from 'react';

const API_BASE_URL = '/api'; 

interface CommissionEntryType {
  id: number;
  university: string;
  college: string;
  location: string;
  college_logo_url?: string | null; 
  commission_percentage: number | string;
}

interface ExternalUniversityData {
  id: number;
  University: string;
  College: string;
  Location: string;
  college_logo_url?: string; 
  [key: string]: any;
}

function SingleCombobox({ placeholder, value, onChange, options }: { placeholder: string, value: string, onChange: (val: string) => void, options: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes((value || "").toLowerCase()));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="position-relative w-100">
      <div className="position-relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="form-control pe-11"
        />
        <div className="position-absolute end-0 top-50 translate-middle-y d-flex align-items-center gap-1 pe-3 text-body-secondary">
          {value && (
            <button 
              type="button" 
              onClick={() => onChange("")} 
              className="btn btn-link text-danger p-0 d-inline-flex align-items-center"
            >
              <iconify-icon icon="solar:close-circle-line-duotone" className="fs-5"></iconify-icon>
            </button>
          )}
          <i className="ti ti-chevron-down fs-4"></i>
        </div>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul className="dropdown-menu show w-100 mt-1 shadow-sm overflow-y-auto" style={{ maxHeight: '240px', zIndex: 1000 }}>
          {filteredOptions.map((opt, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className="dropdown-item fw-semibold py-2 fs-3"
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MultiSelectCombobox({ placeholder, selected, onChange, options }: { placeholder: string, selected: string[], onChange: (val: string[]) => void, options: string[] }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(x => x !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div ref={wrapperRef} className="position-relative w-100">
      <div 
        className="form-control d-flex align-items-center justify-content-between cursor-pointer"
        style={{ minHeight: '38px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-truncate flex-grow-1">
          {selected.length === 0 ? (
            <span className="text-body-secondary">{placeholder}</span>
          ) : selected.length === 1 ? (
            <span className="text-dark fw-semibold">{selected[0]}</span>
          ) : (
            <span className="text-primary fw-bold">{selected.length} colleges selected</span>
          )}
        </div>
        <div className="d-flex align-items-center gap-1 text-body-secondary ms-2" onClick={(e) => e.stopPropagation()}>
          {selected.length > 0 && (
            <button 
              type="button"
              onClick={() => onChange([])}
              className="btn btn-link text-danger p-0 d-inline-flex align-items-center"
            >
              <iconify-icon icon="solar:close-circle-line-duotone" className="fs-5"></iconify-icon>
            </button>
          )}
          <i className="ti ti-chevron-down fs-4"></i>
        </div>
      </div>

      {isOpen && (
        <div className="dropdown-menu show w-100 mt-1 shadow-sm" style={{ zIndex: 1000, overflow: 'hidden' }}>
          <div className="p-2 border-bottom">
            <input 
              type="text" 
              autoFocus 
              placeholder="Search colleges..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="form-control form-control-sm fw-semibold"
            />
          </div>
          <ul className="list-unstyled mb-0 overflow-y-auto p-1" style={{ maxHeight: '240px' }}>
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-body-secondary text-center fs-2">No colleges found</li>
            ) : filteredOptions.map((opt, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => toggleOption(opt)}
                  className="dropdown-item d-flex align-items-center gap-2 rounded py-2 fs-3"
                >
                  <input
                    type="checkbox"
                    className="form-check-input mt-0"
                    checked={selected.includes(opt)}
                    readOnly
                  />
                  <span className="text-truncate" title={opt}>{opt}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function CommissionEntry() {
  const [entries, setEntries] = useState<CommissionEntryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [externalApiData, setExternalApiData] = useState<ExternalUniversityData[]>([]);
  const [fetchingExternal, setFetchingExternal] = useState(false);

  const [formData, setFormData] = useState({
    university: '', colleges: [] as string[], location: '', commission_percentage: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); 

  const [editingCommissionId, setEditingCommissionId] = useState<number | null>(null);
  const [editCommissionValue, setEditCommissionValue] = useState<string>("");

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; message: string; confirmText: string; confirmColor: string; onConfirm: () => void;
  }>({
    isOpen: false, title: '', message: '', confirmText: '', confirmColor: '', onConfirm: () => {}
  });

  const closeConfirmDialog = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000); 
  };

  useEffect(() => {
    fetchEntries();
    fetchExternalData();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/commissions`, { headers: { "Accept": "application/json" } });
      if (!res.ok) throw new Error();
      setEntries(await res.json());
    } catch (err) {
      showToast("Error fetching table data", "error");
    } finally { setLoading(false); }
  };

  const fetchExternalData = async () => {
    try {
      setFetchingExternal(true);
      const res = await fetch("https://www.admin.studyinnepal.com/api/university");
      const data = await res.json();
      if (Array.isArray(data)) setExternalApiData(data);
    } catch (err) {
      console.error("Failed to fetch external university data");
    } finally { setFetchingExternal(false); }
  };

  const uniqueUniversities = useMemo(() => Array.from(new Set(externalApiData.map(d => d.University).filter(Boolean))), [externalApiData]);
  const uniqueColleges = useMemo(() => {
    if (formData.university) return Array.from(new Set(externalApiData.filter(d => d.University === formData.university).map(d => d.College).filter(Boolean)));
    return Array.from(new Set(externalApiData.map(d => d.College).filter(Boolean)));
  }, [externalApiData, formData.university]);

  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = entries.filter(entry => 
        entry.university.toLowerCase().includes(lowerQuery) || 
        entry.college.toLowerCase().includes(lowerQuery)
      );
    }

    return [...filtered].sort((a, b) => {
      const collegeComparison = a.college.localeCompare(b.college);
      if (collegeComparison !== 0) return collegeComparison;
      return a.university.localeCompare(b.university);
    });
  }, [entries, searchQuery]);

  const handleUniversityChange = (val: string) => {
    if (!val) setFormData(prev => ({ ...prev, university: '', colleges: [], location: '' }));
    else setFormData(prev => ({ ...prev, university: val, colleges: [], location: '' }));
  };

  const handleCollegesChange = (selectedColleges: string[]) => {
    if (selectedColleges.length === 0) {
      setFormData(prev => ({ ...prev, university: '', colleges: [], location: '' }));
    } else if (selectedColleges.length === 1) {
      let match = externalApiData.find(d => d.College === selectedColleges[0]);
      setFormData(prev => ({
        ...prev, colleges: selectedColleges, university: match?.University || prev.university, location: match?.Location || prev.location
      }));
    } else {
      let match = externalApiData.find(d => d.College === selectedColleges[0]);
      setFormData(prev => ({
        ...prev, colleges: selectedColleges, university: match?.University || prev.university, location: 'Multiple Locations Selected' 
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await Promise.all(formData.colleges.map(async (collegeName) => {
        const match = externalApiData.find(d => d.College === collegeName && d.University === formData.university) || externalApiData.find(d => d.College === collegeName);
        const payload = {
          university: formData.university, college: collegeName, location: match?.Location || formData.location,
          college_logo_url: match?.college_logo_url || null, commission_percentage: formData.commission_percentage
        };
        const response = await fetch(`${API_BASE_URL}/commissions`, {
          method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error();
      }));

      setFormData({ university: '', colleges: [], location: '', commission_percentage: '' });
      fetchEntries(); 
      showToast("Entries added successfully!", "success");
    } catch (err) {
      showToast("Error saving entries.", "error");
    } finally { setSubmitting(false); }
  };

  const handleCommissionUpdate = (id: number, originalValue: string | number) => {
    if (editingCommissionId !== id) return; 
    
    const newValue = editCommissionValue;
    if (newValue === originalValue.toString() || newValue.trim() === "") {
      setEditingCommissionId(null);
      return;
    }

    const formattedValue = parseFloat(newValue).toFixed(2);
    setEditingCommissionId(null);

    setConfirmDialog({
      isOpen: true, title: "Update Commission",
      message: `Are you sure you want to update the commission percentage to ${formattedValue}%?`,
      confirmText: "Yes, Update", confirmColor: "btn-primary",
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/commissions/${id}`, {
            method: "PUT", headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ commission_percentage: formattedValue })
          });
          if (!response.ok) throw new Error();
          
          setEntries(prev => prev.map(e => e.id === id ? { ...e, commission_percentage: formattedValue } : e));
          showToast("Commission updated successfully!", "success");
        } catch (err) {
          showToast("Failed to update commission.", "error");
        } finally { closeConfirmDialog(); }
      }
    });
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({
      isOpen: true, title: "Delete Entry",
      message: "Are you sure you want to permanently delete this commission entry? This action cannot be undone.",
      confirmText: "Yes, Delete", confirmColor: "btn-danger",
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/commissions/${id}`, { method: "DELETE" });
          fetchEntries();
          showToast("Entry deleted successfully!", "success");
        } catch(err) {
          showToast("Failed to delete entry.", "error");
        } finally { closeConfirmDialog(); }
      }
    });
  };

  const handleExport = async () => {
    setExportingCsv(true);
    try {
      const response = await fetch(`${API_BASE_URL}/commissions/export`, { method: "GET" });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.setAttribute("download", `commissions-${new Date().toISOString().split('T')[0]}.csv`); 
      document.body.appendChild(link); link.click(); link.parentNode?.removeChild(link); window.URL.revokeObjectURL(url);
      showToast("Data exported successfully!", "success");
    } catch (err) { showToast("Failed to export data.", "error"); } finally { setExportingCsv(false); }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    const importData = new FormData(); importData.append('file', file);
    try {
      const response = await fetch(`${API_BASE_URL}/commissions/import`, { method: "POST", headers: { "Accept": "application/json" }, body: importData });
      if (!response.ok) throw new Error();
      setFile(null);
      fetchEntries();
      showToast("Data imported successfully!", "success");
    } catch (err) { showToast("Import failed. Please check file format.", "error"); } finally { setImporting(false); }
  };

  return (
    <>
      {/* ── Toast Notifications (Bootstrap 5 Toast) ── */}
      {toast && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1050 }}>
          <div className={`toast show align-items-center border-0 ${toast.type === 'success' ? 'text-bg-success' : 'text-bg-danger'}`} role="alert" aria-live="assertive" aria-atomic="true">
            <div className="d-flex">
              <div className="toast-body d-flex align-items-center gap-2">
                <iconify-icon icon={toast.type === 'success' ? 'solar:check-circle-line-duotone' : 'solar:danger-triangle-line-duotone'} className="fs-5"></iconify-icon>
                <span className="fw-semibold">{toast.text}</span>
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast(null)} aria-label="Close"></button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-6">
        <div className="d-flex align-items-center gap-3">
          <span className="d-none d-sm-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 round-48" style={{ width: 48, height: 48 }}>
            <iconify-icon icon="solar:tag-price-line-duotone" className="fs-6"></iconify-icon>
          </span>
          <div>
            <h3 className="mb-0 fw-semibold">Commission Management</h3>
            <p className="text-body-secondary mb-0 fs-2 mt-1">Add, update, import, or export approved commission structures</p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            disabled={exportingCsv || loading}
            onClick={handleExport}
            className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
          >
            {exportingCsv ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <iconify-icon icon="solar:file-download-line-duotone" className="fs-5"></iconify-icon>
            )}
            <span>Export CSV</span>
          </button>

          <input 
            type="file" 
            accept=".csv" 
            id="csv-upload" 
            className="d-none" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
              e.target.value = '';
            }} 
          />
          <label 
            htmlFor="csv-upload"
            className="btn btn-primary d-inline-flex align-items-center gap-2 mb-0 cursor-pointer"
          >
            <iconify-icon icon="solar:file-send-line-duotone" className="fs-5"></iconify-icon>
            <span>Import CSV</span>
          </label>
        </div>
      </div>

      {/* ── File Import Ready Action Toolbar ── */}
      {file && (
        <div className="alert bg-primary-subtle border-0 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-6" role="alert">
          <div className="d-flex align-items-center gap-3">
            <span className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle" style={{ width: 32, height: 32 }}>
              <iconify-icon icon="solar:file-text-line-duotone" className="fs-4"></iconify-icon>
            </span>
            <span className="fw-semibold">
              Ready to import file: <span className="text-primary text-decoration-underline">{file.name}</span>
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button 
              type="button"
              disabled={importing} 
              onClick={handleImport} 
              className="btn btn-primary d-inline-flex align-items-center gap-2"
            >
              {importing ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <iconify-icon icon="solar:check-circle-line-duotone" className="fs-5"></iconify-icon>
                  <span>Confirm Import</span>
                </>
              )}
            </button>
            <button 
              type="button"
              disabled={importing} 
              onClick={() => setFile(null)} 
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
            >
              <iconify-icon icon="solar:close-circle-line-duotone" className="fs-5"></iconify-icon>
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Add New Entry Form Card ── */}
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm mb-6 position-relative" style={{ zIndex: 10 }}>
        {fetchingExternal && (
          <div className="position-absolute top-0 end-0 mt-3 me-4 text-xs font-bold text-body-secondary d-flex align-items-center gap-1.5 uppercase tracking-wider">
            <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
            <span>Fetching Master Data...</span>
          </div>
        )}

        <div className="d-flex flex-column flex-xl-row align-items-xl-end gap-3">
          <div className="row g-3 flex-grow-1 align-items-end">
            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label fs-2 fw-semibold text-body-secondary uppercase tracking-widest pl-1 mb-1">University</label>
              <SingleCombobox placeholder="Search University..." value={formData.university} onChange={handleUniversityChange} options={uniqueUniversities} />
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label fs-2 fw-semibold text-body-secondary uppercase tracking-widest pl-1 mb-1">Colleges (Multi-Select)</label>
              <MultiSelectCombobox placeholder="Search Colleges..." selected={formData.colleges} onChange={handleCollegesChange} options={uniqueColleges} />
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label fs-2 fw-semibold text-body-secondary uppercase tracking-widest pl-1 mb-1">Location</label>
              <input 
                name="location" 
                placeholder="Auto-filled from College..." 
                value={formData.location} 
                onChange={handleInputChange} 
                disabled={formData.colleges.length > 1} 
                required 
                className="form-control"
              />
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label fs-2 fw-semibold text-body-secondary uppercase tracking-widest pl-1 mb-1">Commission %</label>
              <input 
                name="commission_percentage" 
                type="number" 
                step="0.01" 
                placeholder="e.g. 15.5" 
                value={formData.commission_percentage} 
                onChange={handleInputChange} 
                required 
                className="form-control" 
              />
            </div>
          </div>

          <div className="mt-3 mt-xl-0 flex-shrink-0 align-self-stretch align-self-xl-auto">
            <button
              type="submit"
              disabled={submitting || !formData.university || formData.colleges.length === 0}
              className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2"
            >
              {submitting ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <iconify-icon icon="solar:plus-circle-line-duotone" className="fs-5"></iconify-icon>
              )}
              <span>{formData.colleges.length > 1 ? `Add ${formData.colleges.length} Entries` : 'Add Entry'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* ── Search Filter Card ── */}
      <div className="card mb-6">
        <div className="card-body d-flex flex-column flex-xl-row align-items-xl-center justify-content-xl-between gap-4">
          <div className="d-flex flex-wrap align-items-center gap-3 flex-grow-1">
            <div className="position-relative flex-grow-1" style={{ minWidth: 260, maxWidth: 400 }}>
              <iconify-icon
                icon="solar:magnifer-line-duotone"
                className="position-absolute top-50 translate-middle-y text-body-secondary fs-5"
                style={{ left: '0.9rem' }}
              ></iconify-icon>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by university or college name..."
                className="form-control ps-11"
              />
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="btn btn-link text-primary d-inline-flex align-items-center gap-1 fw-semibold text-decoration-none px-0"
              >
                <iconify-icon icon="solar:filter-remove-line-duotone" className="fs-5"></iconify-icon>
                <span>Clear Filter</span>
              </button>
            )}
          </div>

          <span className="text-body-secondary fs-3 text-nowrap">
            Showing <strong className="text-dark">{filteredEntries.length}</strong> of <strong className="text-dark">{entries.length}</strong> commissions
          </span>
        </div>
      </div>

      {/* ── Table Container Card ── */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-16 text-body-secondary fw-semibold">
              <span className="spinner-border spinner-border-sm me-2 text-primary" role="status" aria-hidden="true"></span>
              Loading records...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-body-secondary fw-semibold">
              No commission entries available.
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-16 text-body-secondary fw-semibold">
              No matching entries for "{searchQuery}"
            </div>
          ) : (
            <div
              className="table-responsive sidebar-nav-scroll"
              style={{ maxHeight: 520, overflowY: 'auto', width: '100%' }}
            >
              <table
                className="table mb-0 align-middle"
                style={{ tableLayout: 'fixed', width: '100%', minWidth: 900 }}
              >
                <colgroup>
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead className="text-dark fs-4" style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bs-card-bg, #fff)' }}>
                  <tr>
                    <th className="ps-6"><h6 className="fs-4 fw-semibold mb-0">College</h6></th>
                    <th><h6 className="fs-4 fw-semibold mb-0">University</h6></th>
                    <th><h6 className="fs-4 fw-semibold mb-0">Location</h6></th>
                    <th><h6 className="fs-4 fw-semibold mb-0">Commission</h6></th>
                    <th className="text-end pe-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="ps-6">
                        <div className="d-flex align-items-center">
                          {entry.college_logo_url ? (
                            <img
                              src={entry.college_logo_url}
                              alt="logo"
                              className="rounded flex-shrink-0 border p-1"
                              width={32}
                              height={32}
                              style={{ objectFit: 'contain', background: '#fff' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const fallback = document.getElementById(`fallback-col-${entry.id}`);
                                if (fallback) fallback.classList.remove('d-none');
                              }}
                            />
                          ) : null}
                          <span 
                            id={`fallback-col-${entry.id}`} 
                            className={`align-items-center justify-content-center flex-shrink-0 bg-light text-body-secondary rounded ${entry.college_logo_url ? 'd-none' : 'd-flex'}`} 
                            style={{ width: 32, height: 32 }}
                          >
                            <iconify-icon icon="solar:buildings-line-duotone" className="fs-5"></iconify-icon>
                          </span>
                          <span className="ms-3 fw-semibold text-dark text-truncate" title={entry.college}>
                            {entry.college}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2 fw-normal">
                          <iconify-icon icon="solar:square-academic-cap-line-duotone" className="text-body-secondary fs-5 flex-shrink-0"></iconify-icon>
                          <span className="text-dark fw-semibold text-truncate" title={entry.university}>{entry.university}</span>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2 fw-normal">
                          <iconify-icon icon="solar:map-point-line-duotone" className="text-body-secondary fs-5 flex-shrink-0"></iconify-icon>
                          <span className="text-truncate" title={entry.location}>{entry.location}</span>
                        </div>
                      </td>

                      <td>
                        {editingCommissionId === entry.id ? (
                          <input 
                            autoFocus 
                            type="number" 
                            step="0.01" 
                            value={editCommissionValue}
                            onChange={(e) => setEditCommissionValue(e.target.value)}
                            onBlur={() => handleCommissionUpdate(entry.id, entry.commission_percentage)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); handleCommissionUpdate(entry.id, entry.commission_percentage); }
                              if (e.key === 'Escape') setEditingCommissionId(null);
                            }}
                            className="form-control form-control-sm"
                            style={{ maxWidth: '120px' }}
                          />
                        ) : (
                          <span 
                            onDoubleClick={() => { setEditingCommissionId(entry.id); setEditCommissionValue(Number(entry.commission_percentage).toFixed(2)); }}
                            className="badge bg-success-subtle text-success fw-semibold fs-2 gap-1 d-inline-flex align-items-center cursor-pointer"
                          >
                            <iconify-icon icon="solar:tag-price-line-duotone" className="fs-3"></iconify-icon>
                            {Number(entry.commission_percentage).toFixed(2)}%
                          </span>
                        )}
                      </td>

                      <td className="text-end pe-6">
                        <button 
                          type="button"
                          onClick={() => handleDelete(entry.id)} 
                          className="btn btn-light-danger btn-sm p-1 rounded d-inline-flex align-items-center text-danger"
                        >
                          <iconify-icon icon="solar:trash-bin-trash-line-duotone" className="fs-5"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm Dialog Overlay Modals (Bootstrap 5 Modal Markup) ── */}
      {confirmDialog.isOpen && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '400px' }}>
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-0 pb-0 pe-3 pt-3">
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={closeConfirmDialog} 
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body text-center px-4 pb-4">
                  <div className="text-warning mb-3">
                    <iconify-icon icon="solar:danger-triangle-line-duotone" className="fs-10 text-warning" style={{ fontSize: '4.5rem' }}></iconify-icon>
                  </div>
                  <h4 className="fw-semibold mb-2">{confirmDialog.title}</h4>
                  <p className="text-body-secondary mb-4 fs-3">{confirmDialog.message}</p>
                  
                  <div className="d-flex gap-2">
                    <button 
                      type="button" 
                      onClick={closeConfirmDialog}
                      className="btn btn-light flex-grow-1 py-2 fw-semibold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={confirmDialog.onConfirm}
                      className={`btn flex-grow-1 py-2 fw-semibold text-white ${confirmDialog.confirmColor.includes('btn-danger') ? 'btn-danger' : 'btn-primary'}`}
                    >
                      {confirmDialog.confirmText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}