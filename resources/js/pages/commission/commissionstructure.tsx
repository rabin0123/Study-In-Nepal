import React, { useState, useEffect, useMemo } from 'react';

// Declarations to ensure TypeScript compiles custom elements from Iconify CDN seamlessly
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          icon?: string;
          class?: string;
        },
        HTMLElement
      >;
    }
  }
}

const API_BASE_URL = '/api'; 

interface CommissionEntryType {
  id: number;
  university: string;
  college: string;
  location: string;
  college_logo_url?: string | null; 
  commission_percentage: number | string;
}

export default function CommissionStructureList() {
  const [entries, setEntries] = useState<CommissionEntryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [exportingPdf, setExportingPdf] = useState(false);
  
  // Track image load failures per row ID
  const [logoErrors, setLogoErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/commission`, { 
        headers: { "Accept": "application/json" } 
      });
      if (!res.ok) throw new Error("Failed to load commissions data.");
      setEntries(await res.json());
    } catch (err) {
      console.error("Error fetching data", err);
    } finally { 
      setLoading(false); 
    }
  };

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

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const response = await fetch(`${API_BASE_URL}/commissions/export-pdf`, { method: "GET" });
      if (!response.ok) throw new Error("Failed to generate PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Commission-Structure-${new Date().toISOString().split('T')[0]}.pdf`); 
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export PDF. Please try again.");
    } finally { 
      setExportingPdf(false); 
    }
  };

  // Full-page loading gate keeps layout clean until API details load
  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '60vh' }}>
        <span className="spinner-border text-primary mb-4" style={{ width: '2.5rem', height: '2.5rem' }} role="status" aria-hidden="true"></span>
        <h5 className="fw-semibold mb-1">Loading Commission Structure</h5>
        <p className="text-body-secondary mb-0">Please wait while we fetch the latest records…</p>
      </div>
    );
  }

  return (
    /*
      Outer layout container: NOT fixed-height and NOT the scroll owner.
      It just participates in normal document flow. The table area below
      is the only element allowed to scroll, and it does so via its own
      max-height, not via constraining this wrapper's height.
    */
    <div className="d-flex flex-column">
      {/* ── Page header ── */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-6 flex-shrink-0">
        <div className="d-flex align-items-center gap-3">
          <span className="d-none d-sm-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 round-48" style={{ width: 48, height: 48 }}>
            <iconify-icon icon="solar:tag-price-line-duotone" className="fs-6"></iconify-icon>
          </span>
          <div>
            <h3 className="mb-0 fw-semibold">Commission Structure</h3>
            <p className="text-body-secondary mb-0 fs-2 mt-1">
              Master list of approved university and college commissions.
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            disabled={exportingPdf || loading}
            onClick={handleExportPdf}
            className="btn btn-primary d-inline-flex align-items-center gap-2"
          >
            {exportingPdf ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <iconify-icon icon="solar:file-download-line-duotone" className="fs-5"></iconify-icon>
            )}
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* ── Search filter card ── */}
      <div className="card mb-6 flex-shrink-0">
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

      {/* ── Table card ── */}
      <div className="card flex-shrink-0">
        <div className="card-body p-0">
          {entries.length === 0 ? (
            <div className="text-center py-16 text-body-secondary fw-semibold">
              No commission entries available.
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-16 text-body-secondary fw-semibold">
              No matching entries for "{searchQuery}".
            </div>
          ) : (
            /*
              This is the ONLY scrollable region. It has its own bounded
              max-height (independent of viewport math on the outer
              wrapper) and scrolls internally once content exceeds it.
              The rest of the page/component scrolls normally if needed,
              but this box will show its own scrollbar first.
            */
            <div
              className="table-responsive sidebar-nav-scroll"
              style={{ overflowY: 'auto', overflowX: 'auto', width: '100%', maxHeight: '65vh' }}
            >
              <table
                className="table mb-0 align-middle"
                style={{ tableLayout: 'fixed', width: '100%', minWidth: 900 }}
              >
                <colgroup>
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '15%' }} />
                </colgroup>
                <thead className="text-dark fs-4" style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bs-card-bg, #fff)' }}>
                  <tr>
                    <th className="ps-6"><h6 className="fs-4 fw-semibold mb-0">College</h6></th>
                    <th><h6 className="fs-4 fw-semibold mb-0">University</h6></th>
                    <th><h6 className="fs-4 fw-semibold mb-0">Location</h6></th>
                    <th><h6 className="fs-4 fw-semibold mb-0">Commission</h6></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => {
                    const hasImageError = logoErrors[entry.id];
                    const shouldShowLogo = entry.college_logo_url && !hasImageError;

                    return (
                      <tr key={entry.id}>
                        <td className="ps-6">
                          <div className="d-flex align-items-center">
                            {shouldShowLogo ? (
                              <img
                                src={entry.college_logo_url || undefined}
                                alt="logo"
                                className="rounded flex-shrink-0 border p-1"
                                width={32}
                                height={32}
                                style={{ objectFit: 'contain', background: '#fff' }}
                                onError={() => {
                                  setLogoErrors(prev => ({ ...prev, [entry.id]: true }));
                                }}
                              />
                            ) : (
                              <span 
                                className="d-flex align-items-center justify-content-center flex-shrink-0 bg-light text-body-secondary rounded" 
                                style={{ width: 32, height: 32 }}
                              >
                                <iconify-icon icon="solar:buildings-line-duotone" className="fs-5"></iconify-icon>
                              </span>
                            )}
                            <span className="ms-3 fw-semibold text-dark text-truncate" title={entry.college}>
                              {entry.college}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2 fw-normal">
                            <iconify-icon icon="solar:square-academic-cap-line-duotone" className="text-body-secondary fs-5 flex-shrink-0"></iconify-icon>
                            <span className="text-dark fw-semibold text-truncate" title={entry.university}>
                              {entry.university}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2 fw-normal">
                            <iconify-icon icon="solar:map-point-line-duotone" className="text-body-secondary fs-5 flex-shrink-0"></iconify-icon>
                            <span className="text-truncate" title={entry.location}>
                              {entry.location}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="badge bg-success-subtle text-success fw-semibold fs-2 gap-1 d-inline-flex align-items-center">
                            <iconify-icon icon="solar:tag-price-line-duotone" className="fs-3"></iconify-icon>
                            {Number(entry.commission_percentage).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}