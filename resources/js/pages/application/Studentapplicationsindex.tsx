import { useState, useEffect, useMemo } from "react";
import { Link, router, usePage } from '@inertiajs/react';
import Avatar from "../../components/avatar";

interface StudentApplication {
  id: number;
  app_id: string;
  avatar_url?: string;
  student_name: string;
  phone_number: string;
  email: string;
  country: string;
  university_name: string;
  course_name: string;
  passport_number: string;
  date_of_birth: string;
  address: string;
  status: string;
  agency_name: string;
  agency_reference_notes: string | null;
  created_at: string;
}

interface ApiListResponse {
  success: boolean;
  data: {
    data: StudentApplication[];
    total: number;
  };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

// MaterialM status badge — mirrors the reference table's
// `bg-success-subtle text-success` (active) / `text-bg-light text-dark`
// (offline) pattern, extended with a couple of extra states commonly
// seen in an application pipeline.
function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase();

  const styleMap: Record<string, { cls: string; icon: string }> = {
    active: { cls: "bg-success-subtle text-success", icon: "ti-circle" },
    approved: { cls: "bg-success-subtle text-success", icon: "ti-circle" },
    pending: { cls: "bg-warning-subtle text-warning", icon: "ti-clock-hour-4" },
    "in review": { cls: "bg-warning-subtle text-warning", icon: "ti-clock-hour-4" },
    rejected: { cls: "bg-danger-subtle text-danger", icon: "ti-circle-x" },
    cancelled: { cls: "bg-danger-subtle text-danger", icon: "ti-circle-x" },
  };

  const { cls, icon } = styleMap[normalized] ?? { cls: "text-bg-light text-dark", icon: "ti-clock-hour-4" };

  return (
    <span className={`badge ${cls} fw-semibold fs-2 gap-1 d-inline-flex align-items-center`}>
      <i className={`ti ${icon} fs-3`}></i>
      {status}
    </span>
  );
}

export default function StudentApplicationsIndex() {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Pagination — client-side, since all records are already fetched
  // (per_page=500) in one go. currentPage resets to 1 whenever the
  // filtered result set or rowsPerPage changes, so the user never lands
  // on an empty out-of-range page after adjusting a filter.
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [10, 25, 50, 100];

  // Retrieve user auth and permissions from Inertia's page props
  const { props } = usePage();
  const { auth } = props as any;

  // Permission checks
  const canView = auth?.permissions?.includes('view.application');
  const canCreate = auth?.permissions?.includes('create.application');
  const canExport = auth?.permissions?.includes('export.application');

  useEffect(() => {
    // If the user doesn't have permission to view, don't even fetch
    if (!canView) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/agent/applications?per_page=500", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Failed to load applications.");
        const body: ApiListResponse = await res.json();
        if (!cancelled) {
          setApplications(body.data?.data ?? []);
          setError("");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load applications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [canView]);

  const countries = useMemo(
    () => Array.from(new Set(applications.map((a) => a.country))).sort(),
    [applications]
  );
  const agencies = useMemo(
    () => Array.from(new Set(applications.map((a) => a.agency_name))).sort(),
    [applications]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      if (countryFilter && a.country !== countryFilter) return false;
      if (agencyFilter && a.agency_name !== agencyFilter) return false;
      if (!q) return true;

      // Safely convert all fields to string to handle numerical values or nulls smoothly
      const studentName = String(a.student_name || "").toLowerCase();
      const appId = String(a.app_id || "").toLowerCase();
      const email = String(a.email || "").toLowerCase();
      const passportNumber = String(a.passport_number || "").toLowerCase();
      const universityName = String(a.university_name || "").toLowerCase();
      const agencyName = String(a.agency_name || "").toLowerCase();

      return (
        studentName.includes(q) ||
        appId.includes(q) ||
        email.includes(q) ||
        passportNumber.includes(q) ||
        universityName.includes(q) ||
        agencyName.includes(q)
      );
    });
  }, [applications, search, countryFilter, agencyFilter]);

  const clearFilters = () => {
    setSearch(""); setCountryFilter(""); setAgencyFilter("");
    setSelectedIds([]);
    setCurrentPage(1);
  };

  // Reset to page 1 whenever the filtered set or page size changes, so
  // we never get stuck on a page that no longer has any rows.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, countryFilter, agencyFilter, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const pageEnd = Math.min(currentPage * rowsPerPage, filtered.length);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  // Compact page-number list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20
  const pageNumbers = useMemo(() => {
    const delta = 1;
    const range: (number | 'ellipsis')[] = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    range.push(1);
    if (left > 2) range.push('ellipsis');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push('ellipsis');
    if (totalPages > 1) range.push(totalPages);

    return range;
  }, [currentPage, totalPages]);

  const handleSelectAllToggle = () => {
    const pageIds = paginated.map(a => a.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
    if (allPageSelected) {
      setSelectedIds(selectedIds.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    }
  };

  const handleRowSelectToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkZipDownload = async () => {
    if (selectedIds.length === 0 || downloadingBulk) return;
    setDownloadingBulk(true);

    try {
      const response = await fetch('/api/agent/applications/download-zip', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/zip",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) throw new Error("Failed to compile ZIP archive");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `student-applications-${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      setSelectedIds([]);
    } catch (err) {
      console.error("ZIP download error:", err);
    } finally {
      setDownloadingBulk(false);
    }
  };

  const handleExportCsv = () => {
    setExportingCsv(true);
    try {
      const targetData = selectedIds.length > 0
        ? applications.filter(a => selectedIds.includes(a.id))
        : filtered;

      if (targetData.length === 0) return;

      const headers = [
        "Application ID", "Student Name", "Email Address", "Contact Number",
        "Country", "Passport Number", "Date of Birth", "Address Details",
        "University Placement", "Course / Program", "Managing Agent",
        "Reference Notes", "Submitted On"
      ];

      const csvRows = [
        headers.join(","),
        ...targetData.map(a => {
          const dob = a.date_of_birth ? a.date_of_birth.split('T')[0] : '—';
          return [
            a.id,
            `"${a.student_name.replace(/"/g, '""')}"`,
            `"${a.email.replace(/"/g, '""')}"`,
            `"${(a.phone_number || '').replace(/"/g, '""')}"`,
            `"${a.country.replace(/"/g, '""')}"`,
            `"${(a.passport_number || '').replace(/"/g, '""')}"`,
            `"${dob}"`,
            `"${(a.address || '').replace(/"/g, '""')}"`,
            `"${a.university_name.replace(/"/g, '""')}"`,
            `"${a.course_name.replace(/"/g, '""')}"`,
            `"${a.agency_name.replace(/"/g, '""')}"`,
            `"${(a.agency_reference_notes || '').replace(/"/g, '""')}"`,
            `"${formatDate(a.created_at)}"`
          ].join(",");
        })
      ];

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `student-data-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to generate export file:", err);
    } finally {
      setExportingCsv(false);
    }
  };

  // If the user does not have permission to view the index, show an empty state or access denied message.
  if (auth?.permissions && !canView) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="card text-center" style={{ maxWidth: 420 }}>
          <div className="card-body py-10 px-8">
            <iconify-icon icon="solar:shield-cross-line-duotone" className="fs-8 text-body-secondary mb-4 d-block"></iconify-icon>
            <h4 className="fs-5 fw-semibold mb-2">Access Denied</h4>
            <p className="mb-0 text-body-secondary">You do not have permission to view student applications.</p>
          </div>
        </div>
      </div>
    );
  }

  // Full-page loading gate: while the initial fetch is in flight, show a
  // single centered loading state for the whole component instead of
  // rendering the header/filters/table shell with stale zero-counts and
  // only spinning inside the table body. Bulk/export in-flight states
  // (downloadingBulk, exportingCsv) are intentionally excluded — those
  // happen after data has already loaded and should only affect their
  // own buttons/toolbar, not blank out the whole page.
  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '60vh' }}>
        <span className="spinner-border text-primary mb-4" style={{ width: '2.5rem', height: '2.5rem' }} role="status" aria-hidden="true"></span>
        <h5 className="fw-semibold mb-1">Loading Student Applications</h5>
        <p className="text-body-secondary mb-0">Please wait while we fetch the latest records…</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Page header ── */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-6">
        <div className="d-flex align-items-center gap-3">
          <span className="d-none d-sm-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 round-48">
            <iconify-icon icon="solar:square-academic-cap-line-duotone" className="fs-6"></iconify-icon>
          </span>
          <h3 className="mb-0 fw-semibold">Student Applications</h3>
        </div>

        <div className="d-flex align-items-center gap-2">
          {canExport && (
            <button
              type="button"
              disabled={exportingCsv || downloadingBulk || loading}
              onClick={handleExportCsv}
              className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
            >
              {exportingCsv ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <iconify-icon icon="solar:file-download-line-duotone" className="fs-5"></iconify-icon>
              )}
              <span>{selectedIds.length > 0 ? "Export Selected" : "Export All CSV"}</span>
            </button>
          )}

          {canCreate && (
            <Link href="/applications/create" className="btn btn-primary d-inline-flex align-items-center gap-2">
              <iconify-icon icon="solar:add-circle-line-duotone" className="fs-5"></iconify-icon>
              <span>Create Application</span>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-6" role="alert">
          <iconify-icon icon="solar:danger-triangle-line-duotone" className="fs-5"></iconify-icon>
          <span>{error}</span>
        </div>
      )}

      {/* ── Bulk selection toolbar ── */}
      {selectedIds.length > 0 && (
        <div className="alert bg-primary-subtle border-0 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-6">
          <div className="d-flex align-items-center gap-2">
            <span className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle round-32">
              <iconify-icon icon="solar:square-academic-cap-line-duotone" className="fs-4"></iconify-icon>
            </span>
            <span className="fw-semibold">
              You have selected <span className="text-primary">{selectedIds.length}</span> student record{selectedIds.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {canExport && (
              <button
                type="button"
                disabled={downloadingBulk || exportingCsv}
                onClick={handleBulkZipDownload}
                className="btn btn-primary d-inline-flex align-items-center gap-2"
              >
                {downloadingBulk ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Compiling ZIP Archive...</span>
                  </>
                ) : (
                  <>
                    <iconify-icon icon="solar:folder-with-files-line-duotone" className="fs-5"></iconify-icon>
                    <span>Download ZIP of PDFs</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              disabled={downloadingBulk}
              onClick={() => setSelectedIds([])}
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
            >
              <iconify-icon icon="solar:close-circle-line-duotone" className="fs-5"></iconify-icon>
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Filters card ── */}
      <div className="card mb-6">
        <div className="card-body d-flex flex-column flex-xl-row align-items-xl-center justify-content-xl-between gap-4">
          <div className="d-flex flex-wrap align-items-center gap-3 flex-grow-1">
            <div className="position-relative flex-grow-1" style={{ minWidth: 260 }}>
              <iconify-icon
                icon="solar:magnifer-line-duotone"
                className="position-absolute top-50 translate-middle-y text-body-secondary fs-5"
                style={{ left: '0.9rem' }}
              ></iconify-icon>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, SIN ID, email, passport, university..."
                className="form-control ps-11"
              />
            </div>

            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="form-select"
              style={{ maxWidth: 200 }}
            >
              <option value="">All Countries</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="form-select"
              style={{ maxWidth: 200 }}
            >
              <option value="">All Agencies</option>
              {agencies.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>

            {(search || countryFilter || agencyFilter) && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn btn-link text-primary d-inline-flex align-items-center gap-1 fw-semibold text-decoration-none px-0"
              >
                <iconify-icon icon="solar:filter-remove-line-duotone" className="fs-5"></iconify-icon>
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          <span className="text-body-secondary fs-3 text-nowrap">
            Showing <strong className="text-dark">{filtered.length}</strong> of <strong className="text-dark">{applications.length}</strong> applications
          </span>
        </div>
      </div>

      {/* ── Applications table (MaterialM card + table markup) ── */}
      <div className="card">
        <div className="card-body p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-body-secondary fw-semibold">
              No applications match your active filters.
            </div>
          ) : (
            <>
              {/* Scrollable table body, capped at a max height so many
                  rows never push pagination off-screen — but with no
                  forced min-height, so a short result set (like a single
                  row) doesn't leave a big empty gap underneath it. */}
              <div
                className="table-responsive sidebar-nav-scroll"
                style={{ maxHeight: 520, overflowY: 'auto', width: '100%' }}
              >
                <table
                  className="table mb-0 align-middle"
                  style={{ tableLayout: 'fixed', width: '100%', minWidth: 900 }}
                >
                  <colgroup>
                    <col style={{ width: '4%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '12%' }} />
                  </colgroup>
                  <thead className="text-dark fs-4" style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bs-card-bg, #fff)' }}>
                    <tr>
                      <th className="ps-6">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={paginated.length > 0 && paginated.every(a => selectedIds.includes(a.id))}
                          onChange={handleSelectAllToggle}
                        />
                      </th>
                      <th><h6 className="fs-4 fw-semibold mb-0">Student</h6></th>
                      <th><h6 className="fs-4 fw-semibold mb-0">Country</h6></th>
                      <th><h6 className="fs-4 fw-semibold mb-0">University / Course</h6></th>
                      <th><h6 className="fs-4 fw-semibold mb-0">Status</h6></th>
                      <th><h6 className="fs-4 fw-semibold mb-0">Agency</h6></th>
                      <th><h6 className="fs-4 fw-semibold mb-0">Submitted</h6></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((a) => {
                      const isRowSelected = selectedIds.includes(a.id);
                      return (
                        <tr
                          key={a.id}
                          role="button"
                          onClick={() => {
                            if (!downloadingBulk && !exportingCsv) {
                              router.visit(`/applications/${a.id}`);
                            }
                          }}
                          className={isRowSelected ? "table-active" : ""}
                        >
                          <td className="ps-6" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={isRowSelected}
                              onChange={() => handleRowSelectToggle(a.id)}
                            />
                          </td>

                          <td>
                            <div className="d-flex align-items-center">
                              {a?.avatar_url ? (
                                <img
                                  src={a.avatar_url}
                                  alt={a?.student_name}
                                  className="rounded-circle flex-shrink-0"
                                  width={40}
                                  height={40}
                                  style={{ objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="flex-shrink-0"><Avatar name={a?.student_name} size={40} /></span>
                              )}
                              <div className="ms-3 text-truncate">
                                <h6 className="fs-4 fw-semibold mb-0 text-truncate">{a.student_name}</h6>
                                <span className="fw-normal text-primary text-truncate d-block">SIN ID · {a.app_id}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="d-flex align-items-center gap-2 fw-normal">
                              <iconify-icon icon="solar:map-point-line-duotone" className="text-body-secondary fs-5 flex-shrink-0"></iconify-icon>
                              <span className="text-truncate">{a.country}</span>
                            </div>
                          </td>

                          <td className="overflow-hidden">
                            <h6 className="fs-4 fw-semibold mb-1 d-flex align-items-center gap-2 text-truncate">
                              <iconify-icon icon="solar:square-academic-cap-line-duotone" className="text-body-secondary fs-5 flex-shrink-0"></iconify-icon>
                              <span className="text-truncate">{a.university_name}</span>
                            </h6>
                            <span className="fs-2 fw-normal text-body-secondary d-flex align-items-center gap-2 text-truncate">
                              <iconify-icon icon="solar:notebook-line-duotone" className="fs-4 flex-shrink-0"></iconify-icon>
                              <span className="text-truncate">{a.course_name}</span>
                            </span>
                          </td>

                          <td>
                            <StatusBadge status={a.status} />
                          </td>

                          <td className="overflow-hidden">
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge text-bg-secondary text-truncate d-inline-block" style={{ maxWidth: '100%' }}>{a.agency_name}</span>
                            </div>
                          </td>

                          <td>
                            <p className="mb-0 fw-normal d-flex align-items-center gap-2">
                              <iconify-icon icon="solar:calendar-line-duotone" className="text-body-secondary fs-5 flex-shrink-0"></iconify-icon>
                              <span className="text-truncate">{formatDate(a.created_at)}</span>
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination footer ── */}
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3 border-top px-6 py-4">
                <div className="d-flex align-items-center gap-2 text-body-secondary fs-3">
                  <span>Rows per page</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="form-select form-select-sm"
                    style={{ width: 80 }}
                  >
                    {rowsPerPageOptions.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="ms-2">
                    Showing <strong className="text-dark">{pageStart}-{pageEnd}</strong> of <strong className="text-dark">{filtered.length}</strong>
                  </span>
                </div>

                {totalPages > 1 && (
                  <nav aria-label="Applications pagination">
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <a
                          href="javascript:void(0)"
                          className="page-link"
                          onClick={() => goToPage(currentPage - 1)}
                          aria-label="Previous"
                        >
                          <i className="ti ti-chevron-left fs-4"></i>
                        </a>
                      </li>

                      {pageNumbers.map((p, idx) =>
                        p === 'ellipsis' ? (
                          <li key={`ellipsis-${idx}`} className="page-item disabled">
                            <span className="page-link border-0">…</span>
                          </li>
                        ) : (
                          <li key={p} className={`page-item ${p === currentPage ? 'active' : ''}`}>
                            <a
                              href="javascript:void(0)"
                              className="page-link"
                              onClick={() => goToPage(p)}
                            >
                              {p}
                            </a>
                          </li>
                        )
                      )}

                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <a
                          href="javascript:void(0)"
                          className="page-link"
                          onClick={() => goToPage(currentPage + 1)}
                          aria-label="Next"
                        >
                          <i className="ti ti-chevron-right fs-4"></i>
                        </a>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}