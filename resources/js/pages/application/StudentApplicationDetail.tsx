import { useState, useEffect, useRef } from "react";
import { Head, usePage } from "@inertiajs/react";
import Avatar from "../../components/avatar";

import PhoneInput from "react-phone-number-input";
import en from "react-phone-number-input/locale/en";
import "react-phone-number-input/style.css";

interface CreatorUser {
  id: number;
  name: string;
  email: string;
  agency_name?: string;
  contact_number?: string;
}

interface AssignableUser {
  id: number;
  name: string;
  email: string;
}

interface AssignedAgent {
  id: number;
  name: string;
  agency_name?: string;
  country?: string;
}

interface StudentApplication {
  id: number;
  avatar_url?: string;
  app_id: string;
  student_name: string;
  phone_number: string;
  email: string;
  country: string;
  university_name: string;
  college_name?: string;
  course_name: string;
  passport_number: string;
  date_of_birth: string;
  address: string;
  agency_name: string;
  agency_reference_notes: string | null;
  status: string;
  created_at: string;
  created_by: number;
  creator?: CreatorUser | null;
  assigned_to?: number | null;
  assigned_agent?: AssignedAgent | null;
  comments?: ApplicationComment[];
  activities?: ActivityLog[];
}

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface ApplicationComment {
  id: number;
  application_id: number;
  author_name: string;
  author_id?: number | null;
  comment: string;
  created_at: string;
  avatar_url?: string;
  author_avatar_url?: string;
  author?: {
    avatar_url?: string;
  } | null;
}

interface ActivityLog {
  id: number;
  type: "creation" | "status_change" | "update";
  description: string;
  user_name: string;
  created_at: string;
}

interface ApiUniversityRow {
  id: number;
  University: string | null;
  College: string | null;
  Course: string | null;
  Intake?: string | null;
  Location?: string | null;
  level?: string | null;
  stream?: string | null;
}

type Props = {
  application: StudentApplication | string | number;
  status?: string;
};

const countriesList = Object.entries(en).map(([code, name]) => ({
  code,
  name,
})).sort((a, b) => a.name.localeCompare(b.name));

const countryNameToCode: Record<string, string> = Object.entries(en).reduce(
  (acc, [code, name]) => {
    acc[name] = code;
    return acc;
  },
  {} as Record<string, string>
);

function flagFromCountryCode(code?: string) {
  if (!code || code.length !== 2) return null;
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function flagFromCountryName(name?: string) {
  if (!name) return null;
  const code = countryNameToCode[name];
  return flagFromCountryCode(code);
}

function LocalSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`spinner-border spinner-border-sm ${className}`}
      role="status"
      aria-hidden="true"
    ></span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function formatTimeOnly(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return "";
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

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

function SectionHeading({ icon, children, action }: { icon?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="d-flex align-items-center justify-content-between pb-4 mb-1 border-bottom">
      <h6 className="sad-value fs-4 fw-semibold mb-0 d-flex align-items-center gap-3">
        {icon && (
          <span
            className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
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

const STATUS_BADGE_STYLES: Record<string, string> = {
  active: "bg-success-subtle text-success",
  approved: "bg-success-subtle text-success",
  pending: "bg-warning-subtle text-warning",
  "in review": "bg-warning-subtle text-warning",
  rejected: "bg-danger-subtle text-danger",
  cancelled: "bg-danger-subtle text-danger",
};

export default function StudentApplicationDetail({ application: initialApplication }: Props) {
  const { props } = usePage();
  const { auth } = props as any;
  const canUpdate = auth?.permissions?.includes('update.application');
  const canUpdateStatus = auth?.permissions?.includes('update.applicationstatus');
  const canDownload = auth?.permissions?.includes('download.application');

  const [student, setStudent] = useState<StudentApplication | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [phoneValue, setPhoneValue] = useState<string | undefined>();

  const [viewMode, setViewMode] = useState<"overview" | "timeline">("overview");
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const [apiUniversities, setApiUniversities] = useState<ApiUniversityRow[]>([]);
  const [loadingUniData, setLoadingUniData] = useState(false);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [savingField, setSavingField] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const [downloadingCv, setDownloadingCv] = useState(false);

  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusValue, setStatusValue] = useState<string>("");
  const [savingStatus, setSavingStatus] = useState(false);

  const [comments, setComments] = useState<ApplicationComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [canManageAssignment, setCanManageAssignment] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [assigneeValue, setAssigneeValue] = useState<string>("");
  const [savingAssignee, setSavingAssignee] = useState(false);
  const assigneeRef = useRef<HTMLDivElement | null>(null);

  const activeRowRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);

  const leftColumnRef = useRef<HTMLDivElement | null>(null);
  const [leftColumnHeight, setLeftColumnHeight] = useState<number | null>(null);

  const currentUniversity = student?.university_name || (student as any)?.university || "";
  const currentCollege = student?.college_name || (student as any)?.college || "";
  const currentCourse = student?.course_name || (student as any)?.course || "";

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchApplicationDetails = async (id: string, active: boolean = true, showLoader: boolean = true) => {
    try {
      if (showLoader) {
        setLoadingStudent(true);
        setLoadingComments(true);
        setLoadingStatuses(true);
        setLoadingActivities(true);
      }
      const res = await fetch(`/api/agent/applications/${id}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load application details.");
      const body = await res.json();

      if (active && body.data) {
        setStudent(body.data);
        setPhoneValue(body.data.phone_number);
        setStatusValue(body.data.status || "");
        setAssigneeValue(body.data.assigned_to ? String(body.data.assigned_to) : "");
        setComments(body.data.comments || []);
        setActivities(body.data.activities || []);
      }
      if (active) {
        setCanManageAssignment(Boolean(body.can_manage_assignment));
        setStatusOptions(body.statuses || []);
      }
      if (active && Array.isArray(body.assignable_users)) {
        setAssignableUsers(body.assignable_users);
      }
    } catch (e) {
      console.error("Error loading application profile:", e);
    } finally {
      if (active) {
        setLoadingStudent(false);
        setLoadingComments(false);
        setLoadingStatuses(false);
        setLoadingActivities(false);
      }
    }
  };

  useEffect(() => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 1];

    if (!id || id === 'applications') {
      setLoadingStudent(false);
      return;
    }

    let active = true;
    fetchApplicationDetails(id, active, true);

    return () => { active = false; };
  }, [initialApplication]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingUniData(true);
        const res = await fetch("https://www.admin.studyinnepal.com/api/university");
        if (!res.ok) throw new Error("Failed to retrieve universities payload.");
        const body = await res.json();
        const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
        if (active) {
          setApiUniversities(list);
        }
      } catch (err) {
        console.error("Error loading university options from API:", err);
      } finally {
        if (active) setLoadingUniData(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!leftColumnRef.current) return;

    const el = leftColumnRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setLeftColumnHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getStatusMeta = (value?: string | null): StatusOption => {
    const found = statusOptions.find((s) => s.value === value);
    if (found) return found;
    return {
      value: value || "unknown",
      label: value ? value.replace(/_/g, " ") : "No Status",
      color: "#94a3b8"
    };
  };

  const getStatusBadgeClass = (value?: string | null) => {
    const normalized = (value || "").toLowerCase().replace(/_/g, " ");
    return STATUS_BADGE_STYLES[normalized] ?? "text-bg-light text-dark";
  };

  const handleDownloadCv = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (downloadingCv || !student) return;

    setDownloadingCv(true);
    try {
      const response = await fetch(`/api/agent/applications/${student.id}/pdf`, {
        method: "GET",
        headers: {
          "Accept": "application/octet-stream, application/pdf, */*",
        }
      });

      if (!response.ok) throw new Error("Failed to fetch PDF file.");
      const blob = await response.blob();

      const disposition = response.headers.get('content-disposition');
      let filename = `${student.student_name.toLowerCase().replace(/\s+/g, '-')}-cv.pdf`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast("CV downloaded successfully.");
    } catch (error) {
      console.error("Error fetching CV download:", error);
      showToast("Failed to download CV. Please try again.");
    } finally {
      setDownloadingCv(false);
    }
  };

  const handleSaveField = async (fieldName: string, valueToSave: string, label: string) => {
    if (!student) return;

    const originalValue = (student as any)[fieldName] || "";
    if (valueToSave.trim() === originalValue.trim()) {
      setEditingField(null);
      setLocalErrors({});
      return;
    }

    setSavingField(true);
    try {
      const payload: Record<string, string> = { [fieldName]: valueToSave };
      if (fieldName === "university_name") payload.university = valueToSave;
      if (fieldName === "college_name") payload.college = valueToSave;
      if (fieldName === "course_name") payload.course = valueToSave;

      const res = await fetch(`/api/agent/applications/${student.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "",
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setLocalErrors({});
        setEditingField(null);
        showToast(`${label} updated.`);
        fetchApplicationDetails(String(student.id), true, false);
      } else {
        if (res.status === 422 && body.errors) {
          const mappedErrors: Record<string, string> = {};
          Object.keys(body.errors).forEach((key) => {
            mappedErrors[key] = body.errors[key][0];
          });
          setLocalErrors(mappedErrors);
        } else {
          console.error(body.message || "Failed to save field.");
        }
      }
    } catch (e) {
      console.error("Connection error updating field:", e);
    } finally {
      setSavingField(false);
    }
  };

  const handleSaveAcademicField = async (fieldsToUpdate: Partial<StudentApplication>, label: string) => {
    if (!student) return;

    const payload: Record<string, any> = { ...fieldsToUpdate };
    if ('university_name' in fieldsToUpdate) {
      payload.university = fieldsToUpdate.university_name;
    }
    if ('college_name' in fieldsToUpdate) {
      payload.college = fieldsToUpdate.college_name;
    }
    if ('course_name' in fieldsToUpdate) {
      payload.course = fieldsToUpdate.course_name;
    }

    setSavingField(true);
    try {
      const res = await fetch(`/api/agent/applications/${student.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "",
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setEditingField(null);
        showToast(`${label} updated.`);
        fetchApplicationDetails(String(student.id), true, false);
      } else {
        console.error("Failed to sync academic configuration properties.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingField(false);
    }
  };

  const handleSaveStatus = async (valueToSave: string) => {
    if (!student) return;
    if (!valueToSave || valueToSave === student.status) {
      setEditingStatus(false);
      return;
    }

    setSavingStatus(true);
    try {
      const res = await fetch(`/api/agent/applications/${student.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "",
        },
        body: JSON.stringify({ status: valueToSave }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setEditingStatus(false);
        showToast(`Status updated to "${getStatusMeta(body.data.status).label}".`);
        fetchApplicationDetails(String(student.id), true, false);
      } else {
        showToast("Failed to update status.");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveAssignee = async (valueToSave: string) => {
    if (!student || !canManageAssignment) return;

    const newId = valueToSave ? Number(valueToSave) : null;
    if (!newId || newId === student.assigned_to) {
      setEditingAssignee(false);
      return;
    }

    setSavingAssignee(true);
    try {
      const res = await fetch(`/api/agent/applications/${student.id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "",
        },
        body: JSON.stringify({ assigned_to: newId }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setEditingAssignee(false);
        showToast(body.message || "Application reassigned.");
        fetchApplicationDetails(String(student.id), true, false);
      } else {
        showToast(body.message || "Failed to reassign application.");
      }
    } catch (e) {
      console.error("Error reassigning application:", e);
      showToast("Error reassigning application.");
    } finally {
      setSavingAssignee(false);
    }
  };

  const handleAddComment = async () => {
    if (!student || !newComment.trim() || postingComment) return;

    setPostingComment(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/agent/applications/${student.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "",
        },
        body: JSON.stringify({ comment: newComment.trim() }),
      });

      const body = await res.json();
      if (res.ok && body.success && body.data) {
        setNewComment("");
        showToast("Remark added successfully.");
        fetchApplicationDetails(String(student.id), true, false);
      } else if (res.status === 422 && body.errors) {
        setCommentError(body.errors.comment?.[0] || "Please check your entry.");
      } else {
        setCommentError(body.message || "Failed to post comment.");
      }
    } catch (e) {
      setCommentError("Network error. Please try again.");
    } finally {
      setPostingComment(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingField && activeRowRef.current && !activeRowRef.current.contains(event.target as Node)) {
        const labelMapping: Record<string, string> = {
          student_name: "Student Name",
          email: "Email Address",
          passport_number: "Passport Number",
          date_of_birth: "Date of Birth",
          phone_number: "Phone",
          country: "Country",
          address: "Address",
          university_name: "University Placement",
          college_name: "College Placement",
          course_name: "Course / Program",
          agency_reference_notes: "Reference Notes"
        };

        const isAcademic = ["university_name", "college_name", "course_name"].includes(editingField);
        if (isAcademic) {
          if (editingField === "university_name") {
            handleSaveAcademicField({
              university_name: editValue,
              college_name: "",
              course_name: ""
            }, "University Placement");
          } else if (editingField === "college_name") {
            handleSaveAcademicField({
              college_name: editValue,
              course_name: ""
            }, "College Placement");
          } else if (editingField === "course_name") {
            handleSaveAcademicField({
              course_name: editValue
            }, "Course Name");
          }
        } else {
          handleSaveField(editingField, editValue, labelMapping[editingField] || "Field");
        }
      }

      if (editingStatus && statusRef.current && !statusRef.current.contains(event.target as Node)) {
        handleSaveStatus(statusValue);
      }

      if (editingAssignee && assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        handleSaveAssignee(assigneeValue);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingField, editValue, editingStatus, statusValue, editingAssignee, assigneeValue]);

  const renderSidebarEditableField = (
    label: string,
    fieldName: string,
    currentValue: string,
    icon: string,
    inputType: "text" | "date" | "textarea" | "phone" | "country" = "text"
  ) => {
    const isEditing = editingField === fieldName;
    const error = localErrors[fieldName];
    const isAddress = fieldName === "address";
    const flag = fieldName === "country" ? flagFromCountryName(currentValue) : null;

    return (
      <div
        ref={isEditing ? activeRowRef : null}
        onDoubleClick={() => {
          if (!isEditing && canUpdate) {
            setEditingField(fieldName);
            setEditValue(currentValue || "");
          }
        }}
        className={`sad-field-row py-4 border-bottom d-flex gap-4 align-items-start ${canUpdate ? 'cursor-pointer' : ''}`}
      >
        <span
          className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
          style={{ width: 40, height: 40, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}
        >
          <iconify-icon icon={icon} className="text-primary"></iconify-icon>
        </span>

        <div className="flex-grow-1 min-w-0">
          <span className="sad-label fs-2 fw-semibold text-uppercase text-body-secondary d-block mb-2">
            {label}
          </span>

          {isEditing ? (
            <div className="mt-1" onDoubleClick={(e) => e.stopPropagation()}>
              {isAddress ? (
                <textarea
                  autoFocus
                  className="form-control form-control-sm"
                  rows={3}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveField(fieldName, editValue, label);
                    } else if (e.key === "Escape") {
                      setEditingField(null);
                      setLocalErrors({});
                    }
                  }}
                />
              ) : inputType === "textarea" ? (
                <textarea
                  autoFocus
                  className="form-control form-control-sm"
                  rows={3}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveField(fieldName, editValue, label);
                    } else if (e.key === "Escape") {
                      setEditingField(null);
                      setLocalErrors({});
                    }
                  }}
                />
              ) : inputType === "phone" ? (
                <div className="form-control form-control-sm d-flex align-items-center">
                  <PhoneInput
                    international
                    className="w-100"
                    placeholder="Phone Number"
                    value={editValue}
                    onChange={(val) => setEditValue(val || "")}
                  />
                </div>
              ) : inputType === "country" ? (
                <select
                  autoFocus
                  className="form-select form-select-sm"
                  value={editValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditValue(val);
                    handleSaveField(fieldName, val, label);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setEditingField(null); setLocalErrors({}); }
                  }}
                >
                  <option value="">Select Country</option>
                  {countriesList.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  autoFocus
                  type={inputType}
                  className="form-control form-control-sm"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveField(fieldName, editValue, label);
                    if (e.key === "Escape") { setEditingField(null); setLocalErrors({}); }
                  }}
                />
              )}
              {error && <div className="fs-2 text-danger fw-semibold mt-1">{error}</div>}
              {savingField && (
                <div className="d-flex align-items-center gap-2 text-body-secondary fs-2 fw-semibold mt-1">
                  <LocalSpinner />
                  <span>Saving...</span>
                </div>
              )}
            </div>
          ) : (
            <p className="sad-value fs-3 fw-semibold mb-0 d-flex align-items-center gap-2" style={{ wordBreak: 'break-word' }}>
              {flag && <span style={{ fontSize: '1.25em', lineHeight: 1 }}>{flag}</span>}
              {currentValue || <span className="text-body-secondary fw-normal fst-italic">{canUpdate ? "Double-click to set" : "Not set"}</span>}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderAcademicDropdown = (
    label: string,
    fieldName: "university_name" | "college_name" | "course_name",
    currentValue: string,
    icon: string,
    options: string[],
    onSelect: (val: string) => void
  ) => (
    <div
      ref={editingField === fieldName ? activeRowRef : null}
      onDoubleClick={() => {
        if (editingField !== fieldName && canUpdate) {
          setEditingField(fieldName);
          setEditValue(currentValue);
        }
      }}
      className={`sad-field-row py-4 border-bottom d-flex gap-4 align-items-start ${canUpdate ? 'cursor-pointer' : ''}`}
    >
      <span
        className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
        style={{ width: 40, height: 40, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}
      >
        <iconify-icon icon={icon} className="text-primary"></iconify-icon>
      </span>

      <div className="flex-grow-1 min-w-0">
        <span className="sad-label fs-2 fw-semibold text-uppercase text-body-secondary d-block mb-2">
          {label}
        </span>

        {editingField === fieldName ? (
          <div onDoubleClick={(e) => e.stopPropagation()}>
            <select
              autoFocus
              className="form-select form-select-sm"
              value={editValue}
              onChange={(e) => {
                const val = e.target.value;
                setEditValue(val);
                onSelect(val);
              }}
              onKeyDown={(e) => { if (e.key === "Escape") setEditingField(null); }}
            >
              <option value="">Select {label}</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ) : (
          <p className="sad-value fs-3 fw-semibold mb-0">
            {currentValue || <span className="text-body-secondary fw-normal fst-italic">{canUpdate ? "Double-click to set" : "Not set"}</span>}
          </p>
        )}
      </div>
    </div>
  );

  const uniqueUniversities = Array.from(
    new Set(apiUniversities.map((item) => item.University).filter(Boolean))
  ).sort() as string[];

  const uniqueColleges = Array.from(
    new Set(
      apiUniversities
        .filter((item) => item.University === currentUniversity)
        .map((item) => item.College)
        .filter(Boolean)
    )
  ).sort() as string[];

  const uniqueCourses = Array.from(
    new Set(
      apiUniversities
        .filter(
          (item) =>
            item.University === currentUniversity &&
            item.College === currentCollege
        )
        .map((item) => item.Course)
        .filter(Boolean)
    )
  ).sort() as string[];

  if (loadingStudent) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '60vh' }}>
        <span className="spinner-border text-primary mb-4" style={{ width: '2.5rem', height: '2.5rem' }} role="status" aria-hidden="true"></span>
        <h5 className="fw-semibold mb-1">Retrieving Student Profile</h5>
        <p className="text-body-secondary mb-0">Please wait while we fetch the application record…</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="card text-center" style={{ maxWidth: 420 }}>
          <div className="card-body py-10 px-8">
            <iconify-icon icon="solar:file-remove-line-duotone" className="fs-8 text-body-secondary mb-4 d-block"></iconify-icon>
            <h4 className="fs-5 fw-semibold mb-2">Application Not Found</h4>
            <p className="mb-0 text-body-secondary">This student application record could not be located.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentStatusMeta = getStatusMeta(student?.status);
  const countryFlag = flagFromCountryName(student?.country);

  return (
    <>
      <Head title={`${student?.student_name} - Application Detail`} />

      <style>
        {`
          .sad-value {
            color: var(--bs-heading-color, var(--bs-emphasis-color, #1e2633)) !important;
          }
          .sad-label {
            letter-spacing: 0.06em;
          }
          .sad-field-row:last-child {
            border-bottom: none !important;
            padding-bottom: 0 !important;
          }
          .sad-field-row:first-child {
            padding-top: 0 !important;
          }
          .sad-icon-chip iconify-icon {
            font-size: 18px;
          }
          
          /* Custom adaptive theme toggle buttons */
          .btn-toggle-custom {
            background-color: var(--bs-body-secondary-bg, #f8f9fa) !important;
            color: var(--bs-body-color, #495057) !important;
            border: 1px solid var(--bs-border-color, rgba(0, 0, 0, 0.12)) !important;
          }
          .btn-toggle-custom:hover {
            background-color: var(--bs-body-tertiary-bg, #e9ecef) !important;
            color: var(--bs-body-color, #212529) !important;
          }
          
          /* Enforce high contrast and background visibility in dark mode setups */
          [data-bs-theme="dark"] .btn-toggle-custom,
          .dark .btn-toggle-custom {
            background-color: var(--bs-body-secondary-bg, #2b3035) !important;
            color: var(--bs-body-color, #f8f9fa) !important;
            border-color: var(--bs-border-color, rgba(255, 255, 255, 0.15)) !important;
          }
          [data-bs-theme="dark"] .btn-toggle-custom:hover,
          .dark .btn-toggle-custom:hover {
            background-color: var(--bs-body-tertiary-bg, #3d444d) !important;
            color: var(--bs-body-color, #ffffff) !important;
          }

          /* Slim Scrollbar CSS Styles */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(100, 116, 139, 0.4) transparent;
          }
          
          /* Modern scrollbar properties for webkit engines (Chrome, Safari, Edge) */
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(100, 116, 139, 0.4);
            border-radius: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(100, 116, 139, 0.6);
          }
        `}
      </style>

      {/* ── Page header ── */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-6">
        <div className="d-flex align-items-center gap-3">
          <span className="d-none d-sm-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 round-48">
            <iconify-icon icon="solar:user-id-line-duotone" className="fs-6"></iconify-icon>
          </span>
          <div>
            <h3 className="mb-0 fw-semibold">{student?.student_name}</h3>
            <span className="fs-3 text-body-secondary fw-normal">Application ID · {student?.app_id || "—"}</span>
          </div>
        </div>

        {canDownload && (
          <button
            onClick={handleDownloadCv}
            disabled={downloadingCv}
            className="btn btn-primary d-inline-flex align-items-center gap-2"
          >
            {downloadingCv ? (
              <LocalSpinner className="text-white" />
            ) : (
              <iconify-icon icon="solar:file-download-line-duotone" className="fs-5"></iconify-icon>
            )}
            <span>{downloadingCv ? "Preparing…" : "Download CV"}</span>
          </button>
        )}
      </div>

      <div className="row g-6">
        {/* ══ Left column ══ */}
        <div className="col-12 col-lg-4" ref={leftColumnRef}>
          <div className="d-flex flex-column gap-6">

            {/* Identity card */}
            <div className="card overflow-hidden">
              <div style={{ height: 6, background: 'linear-gradient(90deg, var(--bs-primary) 0%, #60a5fa 55%, #f59e0b 100%)' }} />
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  <div className="flex-shrink-0 rounded-circle overflow-hidden border" style={{ width: 60, height: 60 }}>
                    {student?.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student?.student_name}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Avatar name={student?.student_name} size={60} />
                    )}
                  </div>

                  <div className="min-w-0 flex-grow-1">
                    <h5 className="fw-semibold mb-1 text-truncate">{student?.student_name}</h5>

                    {editingStatus ? (
                      <div ref={statusRef} style={{ maxWidth: 160 }} onDoubleClick={(e) => e.stopPropagation()}>
                        <select
                          autoFocus
                          disabled={loadingStatuses || savingStatus}
                          className="form-select form-select-sm"
                          value={statusValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStatusValue(val);
                            handleSaveStatus(val);
                          }}
                          onKeyDown={(e) => { if (e.key === "Escape") setEditingStatus(false); }}
                        >
                          {statusOptions.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span
                        ref={statusRef as any}
                        onDoubleClick={() => {
                          if (canUpdateStatus) {
                            setStatusValue(student?.status || statusOptions[0]?.value || "");
                            setEditingStatus(true);
                          }
                        }}
                        className={`badge ${getStatusBadgeClass(currentStatusMeta.value)} fw-semibold fs-2 gap-1 d-inline-flex align-items-center ${canUpdateStatus ? 'cursor-pointer' : ''}`}
                      >
                        <iconify-icon icon="solar:circle-bold" className="fs-1"></iconify-icon>
                        {savingStatus ? "Saving…" : currentStatusMeta.label}
                      </span>
                    )}
                  </div>
                   <div className="col-6">
                    <span className="fs-2 fw-semibold text-uppercase text-body-secondary d-flex align-items-center gap-1 mb-1">
                      <iconify-icon icon="solar:hashtag-square-line-duotone" className="fs-4"></iconify-icon>
                      App ID{student?.app_id }
                    </span>
                    <p className="sad-value fs-3 fw-semibold mb-0 text-truncate">
                      {student?.app_id || <span className="text-body-secondary fw-normal fst-italic">Not set</span>}
                    </p>
                  </div>
                </div>

                {/* Identifier grid */}
                <div className="row g-3 mt-4 pt-4 border-top">
                 

                  {/* {editingField === "date_of_birth" ? (
                    <div ref={activeRowRef} className="col-6" onDoubleClick={(e) => e.stopPropagation()}>
                      <span className="fs-2 fw-semibold text-uppercase text-body-secondary d-block mb-1">DOB</span>
                      <input
                        autoFocus
                        type="date"
                        className="form-control form-control-sm"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveField("date_of_birth", editValue, "Date of Birth");
                          if (e.key === "Escape") { setEditingField(null); setLocalErrors({}); }
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={`col-6 ${canUpdate ? 'cursor-pointer' : ''}`}
                      onDoubleClick={() => {
                        if (canUpdate) {
                          setEditingField("date_of_birth");
                          setEditValue(student?.date_of_birth ? student.date_of_birth.split("T")[0] : "");
                        }
                      }}
                    >
                      <span className="fs-2 fw-semibold text-uppercase text-body-secondary d-flex align-items-center gap-1 mb-1">
                        <iconify-icon icon="solar:calendar-line-duotone" className="fs-4"></iconify-icon>
                        DOB
                      </span>
                      <p className="sad-value fs-3 fw-semibold mb-0 text-truncate">
                        {student?.date_of_birth ? student.date_of_birth.split("T")[0] : <span className="text-body-secondary fw-normal fst-italic">Not set</span>}
                      </p>
                    </div>
                  )} */}
                </div>
              </div>
            </div>

            {/* View switcher */}
            <div className="card">
              <div className="card-body d-flex gap-2 p-2">
                <button
                  onClick={() => setViewMode("overview")}
                  className={`btn flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2 ${
                    viewMode === "overview" ? "btn-primary" : "btn-toggle-custom"
                  }`}
                >
                  <iconify-icon icon="solar:document-text-line-duotone" className="fs-5"></iconify-icon>
                  <span className="fw-semibold">Overview</span>
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`btn flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2 ${
                    viewMode === "timeline" ? "btn-primary" : "btn-toggle-custom"
                  }`}
                >
                  <iconify-icon icon="solar:clock-circle-line-duotone" className="fs-5"></iconify-icon>
                  <span className="fw-semibold">Timeline</span>
                </button>
              </div>
            </div>

            {viewMode === "overview" ? (
              <>
                {/* About Student */}
                <Card>
                  <SectionHeading icon="solar:user-circle-line-duotone">About Student</SectionHeading>
                  <div>
                    {renderSidebarEditableField("Student Name", "student_name", student?.student_name, "solar:user-line-duotone", "text")}
                    {renderSidebarEditableField("Country of Origin", "country", student?.country, "solar:global-line-duotone", "country")}
                    {renderSidebarEditableField("Street / Physical Address", "address", student?.address, "solar:map-point-line-duotone", "text")}
                  </div>
                </Card>

                {/* Academic Profile */}
                <Card>
                  <SectionHeading
                    icon="solar:square-academic-cap-line-duotone"
                    action={loadingUniData ? (
                      <span className="d-inline-flex align-items-center gap-2 fs-2 fw-semibold text-primary text-uppercase">
                        <LocalSpinner />
                        Syncing
                      </span>
                    ) : undefined}
                  >
                    Academic Profile
                  </SectionHeading>

                  <div>
                    {renderAcademicDropdown("University Placement", "university_name", currentUniversity, "solar:buildings-2-line-duotone", uniqueUniversities, (val) =>
                      handleSaveAcademicField({ university_name: val, college_name: "", course_name: "" }, "University Placement")
                    )}
                    {renderAcademicDropdown("College Placement", "college_name", currentCollege, "solar:library-line-duotone", uniqueColleges, (val) =>
                      handleSaveAcademicField({ college_name: val, course_name: "" }, "College Placement")
                    )}
                    {renderAcademicDropdown("Course Name", "course_name", currentCourse, "solar:notebook-line-duotone", uniqueCourses, (val) =>
                      handleSaveAcademicField({ course_name: val }, "Course Name")
                    )}
                  </div>
                </Card>

                {/* Referral & Agency Coordination */}
                <Card>
                  <SectionHeading icon="solar:user-hand-up-line-duotone">Referral &amp; Agency Coordination</SectionHeading>

                  <div className="row g-3 pb-3 mb-1 border-bottom">
                    <div className="col-6">
                      <span className="fs-2 fw-semibold text-uppercase text-body-secondary d-flex align-items-center gap-1 mb-1">
                        Managing Agent
                      </span>
                      <p className="sad-value fs-3 fw-semibold mb-0 text-truncate">
                        {student?.agency_name || "Direct Application"}
                      </p>
                    </div>
                    <div className="col-6">
                      <span className="fs-2 fw-semibold text-uppercase text-body-secondary d-flex align-items-center gap-1 mb-1">
                        Created By
                      </span>
                      <p className="sad-value fs-3 fw-semibold mb-0 text-truncate">
                        {student?.creator?.name || "System Automated"}
                      </p>
                    </div>
                  </div>

                  {renderSidebarEditableField("Reference / Agency Notes", "agency_reference_notes", student?.agency_reference_notes || "", "solar:notes-line-duotone", "textarea")}
                </Card>

                {canManageAssignment && (
                  <Card>
                    <SectionHeading icon="solar:user-hand-up-line-duotone">Assignment</SectionHeading>
                    <div
                      ref={editingAssignee ? assigneeRef : null}
                      onDoubleClick={() => {
                        if (!editingAssignee) {
                          setAssigneeValue(student?.assigned_to ? String(student.assigned_to) : "");
                          setEditingAssignee(true);
                        }
                      }}
                      className="d-flex gap-3 align-items-start cursor-pointer"
                    >
                      <span className="d-flex align-items-center justify-content-center bg-body-secondary rounded-2 flex-shrink-0" style={{ width: 34, height: 34 }}>
                        <iconify-icon icon="solar:user-check-line-duotone" className="fs-5 text-body-secondary"></iconify-icon>
                      </span>
                      <div className="flex-grow-1 min-w-0">
                        <span className="fs-2 fw-semibold text-uppercase text-body-secondary d-block mb-1">Assigned To</span>

                        {editingAssignee ? (
                          <div onDoubleClick={(e) => e.stopPropagation()}>
                            <select
                              autoFocus
                              disabled={savingAssignee}
                              className="form-select form-select-sm"
                              value={assigneeValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAssigneeValue(val);
                                handleSaveAssignee(val);
                              }}
                              onKeyDown={(e) => { if (e.key === "Escape") setEditingAssignee(false); }}
                            >
                              <option value="">Select Agent</option>
                              {assignableUsers.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                            {savingAssignee && (
                              <div className="d-flex align-items-center gap-2 text-body-secondary fs-2 fw-semibold mt-1">
                                <LocalSpinner />
                                <span>Reassigning...</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="sad-value fs-3 fw-semibold mb-0">
                            {student?.assigned_agent?.name || (
                              <span className="text-body-secondary fw-normal fst-italic">
                                Unassigned — double-click to assign
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              /* Activity Timeline (Fixed Height & Scrollable) */
              <Card>
                <div className="d-flex align-items-center justify-content-between pb-4 mb-1 border-bottom">
                  <div className="d-flex align-items-center gap-3">
                    <span
                      className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{ width: 36, height: 36, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}
                    >
                      <iconify-icon icon="solar:clock-circle-line-duotone" className="text-primary"></iconify-icon>
                    </span>
                    <div>
                      <h6 className="sad-value fs-4 fw-semibold mb-0">Activity Timeline</h6>
                      <span className="fs-1 text-body-secondary">Track all changes and updates</span>
                    </div>
                  </div>
                  <span className="badge bg-primary-subtle text-primary fs-2 fw-semibold">
                    {activities.length} Events
                  </span>
                </div>

                {loadingActivities ? (
                  <div className="d-flex align-items-center justify-content-center gap-2 py-8 fs-2 fw-semibold text-body-secondary text-uppercase">
                    <LocalSpinner />
                    <span>Loading activity log...</span>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 fs-2 fw-semibold text-body-secondary text-uppercase">
                    No logged activity events found.
                  </div>
                ) : (
                  <div className="overflow-auto custom-scrollbar px-1" style={{ maxHeight: "1050px" }}>
                    <div className="position-relative border-start ms-3 ps-6 pt-5" style={{ borderColor: 'var(--bs-border-color)' }}>
                      {activities.map((activity) => {
                        let badgeColor = "bg-info-subtle text-info";
                        let badgeLabel = "Updated";
                        let iconBg = "bg-info";
                        let iconName = "solar:file-text-line-duotone";

                        if (activity.type === "creation") {
                          badgeColor = "bg-success-subtle text-success";
                          badgeLabel = "Creation";
                          iconBg = "bg-success";
                          iconName = "solar:add-circle-line-duotone";
                        } else if (activity.type === "status_change") {
                          badgeColor = "bg-danger-subtle text-danger";
                          badgeLabel = "Activity";
                          iconBg = "bg-danger";
                          iconName = "solar:bolt-line-duotone";
                        }

                        return (
                          <div key={activity.id} className="position-relative pb-6">
                            <span
                              className={`position-absolute d-flex align-items-center justify-content-center rounded-circle text-white ${iconBg}`}
                              style={{ width: 28, height: 28, left: -37, top: 2, border: '3px solid var(--bs-card-bg, #fff)' }}
                            >
                              <iconify-icon icon={iconName} className="fs-3"></iconify-icon>
                            </span>

                            <div className="bg-body-secondary rounded-3 p-3">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <span className={`badge ${badgeColor} fs-1 fw-semibold`}>{badgeLabel}</span>
                                <span className="fs-1 fw-semibold text-body-secondary text-uppercase">{formatDate(activity.created_at)}</span>
                              </div>

                              <p className="sad-value fs-3 fw-semibold mb-2">{activity.description}</p>

                              <div className="d-flex align-items-center gap-3 fs-1 fw-semibold text-body-secondary text-uppercase">
                                <span className="d-flex align-items-center gap-1">
                                  <iconify-icon icon="solar:user-line-duotone" className="fs-3"></iconify-icon> {activity.user_name}
                                </span>
                                <span className="d-flex align-items-center gap-1">
                                  <iconify-icon icon="solar:clock-circle-line-duotone" className="fs-3"></iconify-icon> {formatTimeOnly(activity.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* ══ Right column: Remarks thread with dynamic system avatars ══ */}
        <div className="col-12 col-lg-8">
          <div
            className="card d-flex flex-column"
            style={{
              height: leftColumnHeight ? `${leftColumnHeight}px` : "1000px",
              minHeight: "480px"
            }}
          >
            <div className="flex-shrink-0 d-flex align-items-center justify-content-between px-6 py-4 border-bottom">
              <div className="d-flex align-items-center gap-3">
                <span
                  className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{ width: 40, height: 40, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}
                >
                  <iconify-icon icon="solar:chat-round-dots-line-duotone" className="text-primary"></iconify-icon>
                </span>
                <div>
                  <h6 className="sad-value fs-4 fw-semibold mb-0">Application Remarks</h6>
                  <span className="fs-1 text-body-secondary">Internal notes visible to your team only</span>
                </div>
              </div>
              {comments.length > 0 && (
                <span className="badge bg-primary-subtle text-primary fs-2 fw-semibold">
                  {comments.length} {comments.length === 1 ? "Remark" : "Remarks"}
                </span>
              )}
            </div>

            <div className="flex-shrink-0 px-6 pt-5">
              <div className="bg-body-secondary rounded-3 p-4">
                <textarea
                  className="form-control mb-3"
                  rows={3}
                  placeholder="Input feedback or updates here..."
                  value={newComment}
                  onChange={(e) => {
                    setNewComment(e.target.value);
                    if (commentError) setCommentError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fs-2 fw-semibold text-body-secondary text-uppercase">
                    {commentError ? (
                      <span className="text-danger">{commentError}</span>
                    ) : (
                      "Ctrl/Cmd + Enter to post"
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={!newComment.trim() || postingComment}
                    onClick={handleAddComment}
                    className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                  >
                    {postingComment ? (
                      <>
                        <LocalSpinner className="text-white" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <iconify-icon icon="solar:plain-line-duotone" className="fs-4"></iconify-icon>
                        <span>Post</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable remark list with custom slim scrollbar styles */}
            <div className="flex-grow-1 overflow-auto custom-scrollbar px-6 py-4" style={{ minHeight: 0 }}>
              {loadingComments ? (
                <div className="d-flex align-items-center justify-content-center gap-2 py-8 fs-2 fw-semibold text-body-secondary text-uppercase">
                  <LocalSpinner />
                  <span>Loading remarks...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center text-center py-10">
                  <span
                    className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ width: 56, height: 56, background: 'var(--bs-body-secondary-bg, #f4f6f9)' }}
                  >
                    <iconify-icon icon="solar:chat-round-line-line-duotone" className="fs-6 text-body-secondary"></iconify-icon>
                  </span>
                  <p className="sad-value fs-3 fw-semibold mb-1">No remarks yet</p>
                  <span className="fs-2 text-body-secondary" style={{ maxWidth: 260 }}>
                    Add the first internal note above to start the conversation trail for this application.
                  </span>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {comments
                    .slice()
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((c) => {
                      const avatarUrl = c.avatar_url || c.author_avatar_url || c.author?.avatar_url;

                      return (
                        <div key={c.id} className="d-flex gap-3 bg-body-secondary rounded-3 p-4">
                          <div className="flex-shrink-0 rounded-circle overflow-hidden border" style={{ width: 40, height: 40 }}>
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={c.author_name}
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Avatar name={c.author_name || "Advisor"} size={40} />
                            )}
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-1 mb-1">
                              <span className="sad-value fw-semibold fs-2 text-uppercase">{c.author_name || "Advisor"}</span>
                              <span className="fs-1 fw-semibold text-body-secondary text-uppercase">{formatDateTime(c.created_at)}</span>
                            </div>
                            <p className="fs-3 fw-normal text-body-secondary mb-0" style={{ wordBreak: 'break-word' }}>
                              {c.comment}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Status Notification */}
      {toastMessage && (
        <div
          className="position-fixed d-flex align-items-center gap-2 bg-dark text-white fw-semibold fs-2 text-uppercase py-3 px-4 rounded-3 shadow-lg"
          style={{ bottom: 24, right: 24, zIndex: 1050 }}
        >
          <iconify-icon icon="solar:check-circle-bold" className="fs-4 text-success"></iconify-icon>
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}

StudentApplicationDetail.layout = { title: "Application Administration Detail", description: "In-Context Profile Administration" };