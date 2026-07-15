import React, { useState, useEffect, FormEvent } from "react";
import { useForm, Link, usePage } from "@inertiajs/react";

// ── design tokens ──
const PRIMARY = "#0ea5e9";
const RED = "#ef4444";

// ── interfaces ──
interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

interface GroupedPermissions {
  [module: string]: Permission[];
}

interface RoleCreatePageProps {
  editingRole?: Role | null;
}

interface QuestionLabelProps {
  text: string;
  required?: boolean;
  hint?: string;
}

interface Toast {
  id: string;
  type: "success" | "error";
  message: string;
}

// ── shared components ──
function LocalSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`spinner-border spinner-border-sm ${className}`}
      role="status"
      aria-hidden="true"
    ></span>
  );
}

/* Shared card shell, mirroring your application details setup */
function Card({
  children,
  className = "",
  bodyClassName = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card ${className}`} style={style}>
      <div className={`card-body ${bodyClassName}`}>{children}</div>
    </div>
  );
}

/* Section heading component directly matching StudentApplicationDetail.tsx */
function SectionHeading({ icon, children, action }: { icon?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="d-flex align-items-center justify-content-between pb-4 mb-3 border-bottom">
      <h6 className="sad-value fs-4 fw-semibold mb-0 d-flex align-items-center gap-3">
        {icon && (
          <span
            className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 shrink-0"
            style={{ width: 36, height: 36, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}
          >
            <iconify-icon icon={icon} className="text-primary"></iconify-icon>
          </span>
        )}
        <span>{children}</span>
      </h6>
      {action}
    </div>
  );
}

function QuestionLabel({ text, required, hint }: QuestionLabelProps) {
  return (
    <label className="sad-label d-block fw-semibold text-body-secondary mb-2" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
      {text}
      {required && <span style={{ color: RED, marginLeft: 4 }}>*</span>}
      {hint && (
        <span className="fw-normal text-muted-custom ms-2" style={{ fontSize: "0.75rem", textTransform: "none" }}>
          ({hint})
        </span>
      )}
    </label>
  );
}

export default function RoleCreatePage({ editingRole = null }: RoleCreatePageProps) {
  const { props } = usePage<any>();
  const flash = props.flash || {};
  
  const isEdit = !!editingRole;
  
  // State for dynamic permissions fetch
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [apiError, setApiError] = useState("");

  // Toast Notification State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Initialize Inertia form helper
  const { data, setData, post, patch, processing, errors } = useForm({
    name: editingRole ? editingRole.name : "",
    permissions: editingRole ? editingRole.permissions.map((p) => p.name) : [] as string[],
  });

  // Fetch permissions on mount
  useEffect(() => {
    setLoadingPermissions(true);
    setApiError("");
    fetch("/api/permissions", { headers: { Accept: "application/json" } })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load permissions from server.");
        return res.json();
      })
      .then((data) => {
        setGroupedPermissions(data || {});
      })
      .catch((err) => {
        setApiError(err.message || "Failed to fetch permission groups.");
        addToast("error", "Failed to load permissions configuration.");
      })
      .finally(() => {
        setLoadingPermissions(false);
      });
  }, []);

  // Listen to external flash messages
  useEffect(() => {
    if (flash.success) addToast("success", flash.success);
    if (flash.error) addToast("error", flash.error);
  }, [flash]);

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

  const handlePermissionToggle = (permName: string) => {
    setData("permissions", 
      data.permissions.includes(permName)
        ? data.permissions.filter((p) => p !== permName)
        : [...data.permissions, permName]
    );
  };

  const handleModuleToggle = (moduleName: string, modulePermissions: Permission[]) => {
    const modulePermNames = modulePermissions.map((p) => p.name);
    const allSelected = modulePermNames.every((name) => data.permissions.includes(name));

    if (allSelected) {
      setData("permissions", data.permissions.filter((p) => !modulePermNames.includes(p)));
    } else {
      setData("permissions", Array.from(new Set([...data.permissions, ...modulePermNames])));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const options = {
      onSuccess: () => {
        addToast("success", isEdit ? "Role updated successfully!" : "Role created successfully!");
      },
      onError: () => {
        addToast("error", "Validation failed. Please check your inputs.");
      }
    };

    if (isEdit) {
      patch(`/api/roles/${editingRole.id}`, options);
    } else {
      post("/api/roles", options);
    }
  };

  if (loadingPermissions) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center font-['Rajdhani']" style={{ minHeight: "100vh", background: "var(--surface-bg)" }}>
        <span className="spinner-border text-primary mb-4" style={{ width: '2.5rem', height: '2.5rem' }} role="status" aria-hidden="true"></span>
        <h5 className="fw-semibold mb-1 text-strong-custom">Retrieving Permissions</h5>
        <p className="text-body-secondary mb-0">Please wait while we load the system capability groups…</p>
      </div>
    );
  }

  return (
    <div className="min-vh-100 font-['Rajdhani']" style={{ background: "var(--surface-bg)", position: "relative" }}>
      
      {/* Embedded interactive stylesheet */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@400;500;600;700&display=swap');

        .sad-value {
          color: #1e2633 !important;
        }
        .sad-label {
          letter-spacing: 0.06em;
        }
        .sad-icon-chip iconify-icon {
          font-size: 18px;
        }

        /* Form input styles synced across the application views */
        .survey-input {
          width: 100%;
          border: 1.5px solid var(--bs-border-color, #dee2e6) !important;
          border-radius: 0.75rem !important;
          padding: 0.65rem 1rem !important;
          font-family: 'Rajdhani', sans-serif !important;
          font-size: 0.95rem !important;
          font-weight: 600 !important;
          color: var(--bs-body-color, #212529) !important;
          background: var(--surface-card, var(--bs-card-bg, #fff)) !important;
          outline: none !important;
          transition: all 0.2s ease !important;
          height: auto !important;
        }

        .survey-input:focus-within, .survey-input:focus {
          border-color: ${PRIMARY} !important;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.08) !important;
        }

        /* Explicit alignment rules for disabled/readonly states in Edit Mode */
        .survey-input:disabled,
        input:disabled {
          border: 1.5px solid var(--bs-border-color, #dee2e6) !important;
          background-color: var(--bs-tertiary-bg, #f8f9fa) !important;
          color: var(--bs-secondary-color, #6c757d) !important;
          cursor: not-allowed !important;
          opacity: 0.8 !important;
        }

        .custom-checkbox-label:hover .custom-checkbox {
          border-color: ${PRIMARY};
        }
        .custom-checkbox {
          width: 1.15rem;
          height: 1.15rem;
          border: 1.5px solid var(--bs-border-color, #dee2e6);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: var(--surface-bg);
          position: relative;
        }
        .custom-checkbox.checked {
          background: ${PRIMARY};
          border-color: ${PRIMARY};
        }
        .custom-checkbox.checked::after {
          content: "";
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          margin-bottom: 2px;
        }
        .module-card {
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .module-card:hover {
          border-color: ${PRIMARY}50;
          box-shadow: 0 4px 20px ${PRIMARY}10;
        }
      `}</style>

      {/* Increased container max-width to 1280px for a wider dashboard layout */}
      <div className="container px-3 px-md-4 px-lg-5 py-4 py-lg-5" style={{ maxWidth: 1280, margin: "0 auto" }}>
        
        {/* Header & Back Action */}
        <div className="d-flex align-items-center justify-content-between mb-4 pb-2">
          <div>
            <h1 className="h3 mb-1 fw-bold text-strong-custom" style={{ fontFamily: "'Castoro Titling', serif", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {isEdit ? "Modify Role" : "Create Role"}
            </h1>
            <p className="fs-3 fw-semibold text-muted-custom mb-0 text-uppercase" style={{ letterSpacing: "0.05em" }}>
              {isEdit ? `Adjust permissions for "${editingRole.name}"` : "Define a new access category"}
            </p>
          </div>

          <Link
            href="/roles"
            className="d-inline-flex align-items-center gap-2 text-decoration-none text-muted-custom fw-bold fs-2 text-uppercase"
            style={{ letterSpacing: "0.1em" }}
          >
            <iconify-icon icon="solar:arrow-left-line-duotone" className="fs-5" />
            Back to Directory
          </Link>
        </div>

        {/* Validation Errors Panel */}
        {Object.keys(errors).length > 0 && (
          <div className="alert alert-danger d-flex align-items-center gap-3 rounded-3 mb-4" role="alert">
            <iconify-icon icon="solar:danger-triangle-line-duotone" className="fs-5" />
            <div className="fw-semibold">Please correct the validation errors below.</div>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
            
            {/* Form Fields: Role Identity */}
            <div>
              <SectionHeading icon="solar:user-id-line-duotone">Role Identity</SectionHeading>
              
              <div className="mt-3">
                <QuestionLabel 
                  text="Role Identifier" 
                  required={!isEdit} 
                  hint={isEdit ? "System role identifiers cannot be renamed" : "Unique lower-case string (e.g. general-manager)"} 
                />
                <input
                  type="text"
                  disabled={isEdit}
                  placeholder="e.g. marketing-lead"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value.toLowerCase())}
                  className="survey-input"
                />
                {errors.name && (
                  <span style={{ color: RED, fontSize: "0.8rem", fontWeight: "700", display: "block", marginTop: "0.6rem" }}>
                    ⚠ {errors.name}
                  </span>
                )}
              </div>
            </div>

            {/* Matrix Segment */}
            <div>
              <SectionHeading icon="solar:shield-keyhole-line-duotone">Assign Capabilities</SectionHeading>
              
              <div className="d-flex flex-column gap-3 mt-3">
                {Object.entries(groupedPermissions).map(([moduleName, modulePermissions]) => {
                  const modulePermNames = modulePermissions.map((p) => p.name);
                  const allSelected = modulePermNames.every((name) => data.permissions.includes(name));

                  return (
                    <div 
                      key={moduleName}
                      className="module-card card p-4 border"
                      style={{ background: "var(--surface-bg)", borderRadius: "1rem" }}
                    >
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                        <span style={{ fontFamily: "'Castoro Titling', serif", fontWeight: "600", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.15em", color: PRIMARY }}>
                          {moduleName} Module
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => handleModuleToggle(moduleName, modulePermissions)}
                          className="btn btn-light border btn-sm text-uppercase fw-bold"
                          style={{
                            fontSize: "0.72rem", letterSpacing: "0.05em", borderRadius: "999px"
                          }}
                        >
                          {allSelected ? "Deselect All" : "Select All"}
                        </button>
                      </div>

                      {/* Configured to handle a 4-column split cleanly with the wider 1280px container boundary */}
                      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                        {modulePermissions.map((permission) => {
                          const isChecked = data.permissions.includes(permission.name);
                          return (
                            <div key={permission.id} className="col">
                              <label 
                                className="custom-checkbox-label d-flex align-items-center gap-2 text-decoration-none"
                                style={{
                                  cursor: "pointer",
                                  fontSize: "0.9rem",
                                  fontWeight: "600",
                                  color: isChecked ? "var(--text-strong)" : "var(--text-muted)",
                                  userSelect: "none"
                                }}
                              >
                                {/* Custom Styled Checkbox UI */}
                                <div className={`custom-checkbox shrink-0 ${isChecked ? "checked" : ""}`}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handlePermissionToggle(permission.name)}
                                    style={{ position: "absolute", opacity: 0, cursor: "pointer", width: 0, height: 0 }}
                                  />
                                </div>
                                <span className="text-truncate" style={{ letterSpacing: "0.02em" }}>{permission.name}</span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="d-flex justify-content-end align-items-center gap-3 border-top mt-4 pt-4">
              <Link
                href="/roles"
                className="btn btn-link text-strong-custom fw-bold text-uppercase text-decoration-none"
                style={{ fontSize: "0.85rem", letterSpacing: "0.1em" }}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={processing}
                className="btn btn-primary d-inline-flex align-items-center gap-2 text-uppercase fw-bold"
                style={{
                  borderRadius: "0.5rem", padding: "0.75rem 1.5rem",
                  fontFamily: "Rajdhani, sans-serif", fontSize: "0.85rem",
                  letterSpacing: "0.1em"
                }}
              >
                {processing ? <LocalSpinner className="text-white" /> : <iconify-icon icon="solar:check-read-linear" className="fs-5" />}
                <span>{processing ? "Saving..." : isEdit ? "Save Changes" : "Create Role"}</span>
              </button>
            </div>

          </form>
        </Card>
      </div>

      {/* Dynamic Toast Notifications */}
      <div style={{
        position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1050,
        display: "flex", flexDirection: "column", gap: "1rem", pointerEvents: "none"
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="d-flex align-items-center gap-3 bg-dark text-white fw-semibold py-3 px-4 rounded-3 shadow-lg"
            style={{ pointerEvents: "auto", minWidth: "280px" }}
          >
            <iconify-icon 
              icon={toast.type === "success" ? "solar:check-circle-bold" : "solar:danger-circle-bold"} 
              className={`fs-4 ${toast.type === "success" ? "text-success" : "text-danger"}`}
            />
            <span className="fs-2 text-uppercase" style={{ flexGrow: 1, letterSpacing: '0.05em' }}>{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="border-0 bg-transparent text-white p-0 d-flex align-items-center"
            >
              <iconify-icon icon="solar:close-circle-line-duotone" className="fs-5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}