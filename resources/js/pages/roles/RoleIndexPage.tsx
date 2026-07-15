import { useState, useEffect, useMemo } from "react";
import { Link, router, usePage } from "@inertiajs/react";

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

interface RoleIndexPageProps {
  roles: Role[];
}

interface Toast {
  id: string;
  type: "success" | "error";
  message: string;
}

export default function RoleIndexPage({ roles = [] }: RoleIndexPageProps) {
  const { props } = usePage<any>();
  const flash = props.flash || {};
  const errors = props.errors || {};

  // Notifications & State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  
  const [error] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; role: Role | null }>({
    isOpen: false,
    role: null,
  });

  // Sync System Flashes
  useEffect(() => {
    if (flash.success) {
      addToast("success", flash.success);
    }
  }, [flash.success]);

  useEffect(() => {
    if (errors.message) {
      addToast("error", errors.message);
    }
  }, [errors.message]);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Filter Logic matching applications search pattern
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roles.filter((r) => {
      const isProtected = ["developer", "main-agent"].includes(r.name);
      
      if (typeFilter === "protected" && !isProtected) return false;
      if (typeFilter === "custom" && isProtected) return false;
      if (!q) return true;

      return (
        r.name.toLowerCase().includes(q) ||
        r.permissions.some(p => p.name.toLowerCase().includes(q))
      );
    });
  }, [roles, search, typeFilter]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
  };

  const handleRowClick = (role: Role, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".action-trigger") || target.closest(".dropdown") || target.closest(".dropdown-menu")) {
      return;
    }

    if (role.name === "developer") {
      addToast("error", "The developer role is managed system-wide.");
      return;
    }

    router.visit(`/roles/${role.id}/edit`);
  };

  const initiateDelete = (role: Role, e: React.MouseEvent) => {
    e.stopPropagation();

    if (["developer", "main-agent"].includes(role.name)) {
      addToast("error", "Protected system roles cannot be deleted.");
      return;
    }

    setConfirmModal({
      isOpen: true,
      role: role,
    });
  };

  const confirmDelete = () => {
    if (confirmModal.role) {
      router.delete(`/api/roles/${confirmModal.role.id}`, {
        onSuccess: () => {
          addToast("success", "Role successfully deleted.");
          setConfirmModal({ isOpen: false, role: null });
        },
        onError: () => {
          addToast("error", "Failed to delete specified role.");
          setConfirmModal({ isOpen: false, role: null });
        },
      });
    }
  };

  return (
    <>
      <style>
        {`
            .applications-table th {
                text-align: left;
                font-size: 0.78rem !important;
                font-weight: 700 !important;
                letter-spacing: 0.1em !important;
                text-transform: uppercase;
                color: var(--text-faint);
                padding: 1.1rem 1.5rem !important;
                background: var(--surface-sidebar);
                border-bottom: 1.5px solid var(--border-color);
            }
            .applications-table td {
                padding: 1.1rem 1.5rem !important;
                font-size: 0.95rem !important;
                font-weight: 600 !important;
                color: var(--text-strong);
                border-bottom: 1.5px solid var(--border-color-soft);
                vertical-align: middle;
            }

            @media (min-width: 1280px) {
                .applications-table th {
                    padding: 1.35rem 1.75rem !important;
                    font-size: 0.82rem !important;
                }
                .applications-table td {
                    padding: 1.35rem 1.75rem !important;
                    font-size: 1rem !important;
                }
            }

            .applications-table tr:last-child td {
                border-bottom: none;
            }
            .applications-table tbody tr {
                cursor: pointer;
                transition: background 0.15s ease;
            }
            .applications-table tbody tr:hover {
                background: var(--surface-hover) !important;
            }

            /* Responsive desktop hover display logic for the action trigger */
            @media (min-width: 768px) {
                .applications-table tbody tr .action-trigger {
                    opacity: 0;
                    transition: opacity 0.15s ease-in-out;
                }
                .applications-table tbody tr:hover .action-trigger,
                .applications-table tbody tr:focus-within .action-trigger {
                    opacity: 1;
                }
            }
        `}
      </style>

      {/* ── Page Header ── */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-6">
        <div className="d-flex align-items-center gap-3">
          <span className="d-none d-sm-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3" style={{ width: 48, height: 48 }}>
            <iconify-icon icon="solar:shield-keyhole-line-duotone" className="fs-6"></iconify-icon>
          </span>
          <div>
            <h3 className="mb-0 fw-semibold">Roles</h3>
            <p className="text-body-secondary mb-0 fs-2 mt-1">Manage system configurations and authorization clearances</p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link 
            href="/roles/create" 
            className="btn btn-primary d-inline-flex align-items-center gap-2"
          >
            <iconify-icon icon="solar:add-circle-line-duotone" className="fs-5"></iconify-icon>
            <span>Create Role</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-6" role="alert">
          <iconify-icon icon="solar:danger-triangle-line-duotone" className="fs-5"></iconify-icon>
          <span>{error}</span>
        </div>
      )}

      {/* ── Search & Filters Card ── */}
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by role name or parameters..."
                className="form-control ps-11"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select"
              style={{ maxWidth: 220 }}
            >
              <option value="">All Categories</option>
              <option value="protected">Protected System Roles</option>
              <option value="custom">Custom Defined Roles</option>
            </select>

            {(search || typeFilter) && (
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
            Showing <strong className="text-dark">{filtered.length}</strong> of <strong className="text-dark">{roles.length}</strong> configurations
          </span>
        </div>
      </div>

      {/* ── Roles Table Card ── */}
      <div className="card">
        <div className="card-body p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-body-secondary fw-semibold">
              No roles match your search filters.
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
                  <col style={{ width: '38%' }} />
                  <col style={{ width: '31%' }} />
                  <col style={{ width: '31%' }} />
                </colgroup>
                <thead className="text-dark fs-4" style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bs-card-bg, #fff)' }}>
                  <tr>
                    <th className="ps-6"><h6 className="fs-4 fw-semibold mb-0">Role Definition</h6></th>
                    <th><h6 className="fs-4 fw-semibold mb-0">Clearance Category</h6></th>
                    <th><h6 className="fs-4 fw-semibold mb-0">Assigned Parameters</h6></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const isProtected = ["developer", "main-agent"].includes(r.name);
                    const isDeveloper = r.name === "developer";

                    return (
                      <tr 
                        key={r.id}
                        role="button"
                        onClick={(e) => handleRowClick(r, e)}
                      >
                        <td className="ps-6">
                          <div className="d-flex align-items-center justify-content-between pe-4">
                            <span className="fw-semibold text-dark text-truncate text-uppercase tracking-wide">
                              {r.name}
                            </span>
                            
                            {/* Actions Menu Trigger wrapped with the action-trigger hover class */}
                            {!isProtected && (
                              <div className="dropdown action-trigger" onClick={(e) => e.stopPropagation()}>
                                <a
                                  href="javascript:void(0)"
                                  className="text-muted p-1 rounded hover-bg-light"
                                  id={`role-actions-${r.id}`}
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                >
                                  <i className="ti ti-dots fs-5"></i>
                                </a>
                                <ul className="dropdown-menu" aria-labelledby={`role-actions-${r.id}`}>
                                  <li>
                                    <button
                                      type="button"
                                      onClick={(e) => initiateDelete(r, e)}
                                      className="dropdown-item text-danger d-flex align-items-center gap-2"
                                    >
                                      <iconify-icon icon="solar:trash-bin-trash-line-duotone" className="fs-4"></iconify-icon>
                                      <span>Delete</span>
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </td>

                        <td>
                          {isProtected ? (
                            <span className="badge bg-warning-subtle text-warning fw-semibold fs-2 gap-1 d-inline-flex align-items-center">
                              <iconify-icon icon="solar:lock-keyhole-line-duotone" className="fs-3"></iconify-icon>
                              System Protected
                            </span>
                          ) : (
                            <span className="badge bg-primary-subtle text-primary fw-semibold fs-2 gap-1 d-inline-flex align-items-center">
                              <iconify-icon icon="solar:shield-check-line-duotone" className="fs-3"></iconify-icon>
                              Custom Role
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2 fw-normal">
                            <iconify-icon icon="solar:key-minimalistic-line-duotone" className="text-body-secondary fs-5 flex-shrink-0"></iconify-icon>
                            <span className={`fw-semibold ${isDeveloper ? "text-warning" : "text-body-secondary"}`}>
                              {isDeveloper ? "Inherited Clearance" : `${r.permissions.length} Configured`}
                            </span>
                          </div>
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

      {/* ── Toast Notifications ── */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1050 }}>
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`toast show align-items-center border-0 mb-2 ${toast.type === "success" ? "text-bg-success" : "text-bg-danger"}`} 
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body d-flex align-items-center gap-2">
                <iconify-icon 
                  icon={toast.type === "success" ? "solar:check-circle-line-duotone" : "solar:danger-triangle-line-duotone"} 
                  className="fs-5"
                ></iconify-icon>
                <span className="fw-semibold">{toast.message}</span>
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white me-2 m-auto" 
                onClick={() => removeToast(toast.id)} 
                aria-label="Close"
              ></button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {confirmModal.isOpen && confirmModal.role && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '400px' }}>
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-0 pb-0 pe-3 pt-3">
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setConfirmModal({ isOpen: false, role: null })} 
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body text-center px-4 pb-4">
                  <div className="text-danger mb-3">
                    <iconify-icon icon="solar:danger-triangle-line-duotone" className="text-danger" style={{ fontSize: '4.5rem' }}></iconify-icon>
                  </div>
                  <h4 className="fw-semibold mb-2">Confirm Deletion</h4>
                  <p className="text-body-secondary mb-4 fs-3">
                    Are you sure you want to delete <strong className="text-dark">"{confirmModal.role.name}"</strong>?<br/>This configuration change is irreversible.
                  </p>
                  
                  <div className="d-flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setConfirmModal({ isOpen: false, role: null })}
                      className="btn btn-light flex-grow-1 py-2 fw-semibold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={confirmDelete}
                      className="btn btn-danger flex-grow-1 py-2 fw-semibold text-white"
                    >
                      Confirm Delete
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