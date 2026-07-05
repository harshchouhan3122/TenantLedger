import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/client";
import "./Dashboard.css";

const today = new Date().toISOString().split("T")[0];

export default function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // --- Add Property form state ---
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("shop");
  const [address, setAddress] = useState("");
  const [propertySubmitting, setPropertySubmitting] = useState(false);
  const [propertyFormError, setPropertyFormError] = useState(null);

  // --- Add Tenant form state ---
  // Holds { propertyId, propertyName } for whichever property's "Add tenant"
  // button was clicked, or null if no tenant form is open. Since it's
  // opened from a specific property card, the property itself is already
  // known — no dropdown needed for this flow.
  const [tenantFormFor, setTenantFormFor] = useState(null);
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantAadhar, setTenantAadhar] = useState("");
  const [tenantMoveInDate, setTenantMoveInDate] = useState(today);
  const [tenantSubmitting, setTenantSubmitting] = useState(false);
  const [tenantFormError, setTenantFormError] = useState(null);

  // --- Tenant history state ---
  // Which property's history panel is currently open (or null if none).
  const [expandedPropertyId, setExpandedPropertyId] = useState(null);
  // Cache of already-fetched history, keyed by propertyId, so re-opening
  // a panel you've already viewed doesn't re-fetch from the server.
  const [tenantHistory, setTenantHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const loadProperties = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const response = await apiClient.get("/properties");
      setProperties(response.data);
    } catch (err) {
      setListError("Couldn't load properties. Please try refreshing.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // --- Add Property handlers ---

  async function handleAddProperty(e) {
    e.preventDefault();
    setPropertyFormError(null);
    setPropertySubmitting(true);

    try {
      await apiClient.post("/properties", {
        name: name.trim(),
        type,
        address: address.trim(),
      });
      setName("");
      setType("shop");
      setAddress("");
      setShowPropertyForm(false);
      await loadProperties();
    } catch (err) {
      setPropertyFormError(
        err.response?.data?.error || "Couldn't add the property. Please try again."
      );
    } finally {
      setPropertySubmitting(false);
    }
  }

  async function handleDeleteProperty(propertyId, propertyName) {
    const confirmed = window.confirm(`Delete "${propertyName}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await apiClient.delete(`/properties/${propertyId}`);
      await loadProperties();
    } catch (err) {
      setListError(
        err.response?.data?.error || "Couldn't delete that property. Please try again."
      );
    }
  }

  // --- Add Tenant handlers ---

  function openTenantForm(property) {
    setTenantFormError(null);
    setTenantName("");
    setTenantPhone("");
    setTenantAadhar("");
    setTenantMoveInDate(today);
    setTenantFormFor({ propertyId: property._id, propertyName: property.name });
  }

  function closeTenantForm() {
    setTenantFormFor(null);
  }

  async function handleAddTenant(e) {
    e.preventDefault();
    setTenantFormError(null);
    setTenantSubmitting(true);

    try {
      await apiClient.post("/tenants", {
        propertyId: tenantFormFor.propertyId,
        name: tenantName.trim(),
        phone: tenantPhone.trim(),
        aadharNo: tenantAadhar.trim(),
        moveInDate: tenantMoveInDate,
      });
      setTenantFormFor(null);
      await loadProperties();
    } catch (err) {
      setTenantFormError(
        err.response?.data?.error || "Couldn't add the tenant. Please try again."
      );
    } finally {
      setTenantSubmitting(false);
    }
  }

  async function handleMoveOut(property) {
    const confirmed = window.confirm(
      `Move out "${property.activeTenantName}" from "${property.name}"? ` +
        `Their history will be kept, and this property will become vacant.`
    );
    if (!confirmed) return;

    try {
      await apiClient.patch(`/tenants/${property.activeTenantId}/move-out`, {});
      // Drop any cached history for this property so the next time it's
      // expanded, it re-fetches and shows the newly-closed tenancy too.
      setTenantHistory((prev) => {
        const next = { ...prev };
        delete next[property._id];
        return next;
      });
      await loadProperties();
    } catch (err) {
      setListError(
        err.response?.data?.error || "Couldn't move out this tenant. Please try again."
      );
    }
  }

  // --- Tenant history handlers ---

  async function toggleHistory(propertyId) {
    if (expandedPropertyId === propertyId) {
      setExpandedPropertyId(null);
      return;
    }

    setExpandedPropertyId(propertyId);
    setHistoryError(null);

    // Already fetched this property's history in this session — no need
    // to hit the server again.
    if (tenantHistory[propertyId]) return;

    setHistoryLoading(true);
    try {
      const response = await apiClient.get(`/tenants?propertyId=${propertyId}`);
      setTenantHistory((prev) => ({ ...prev, [propertyId]: response.data }));
    } catch (err) {
      setHistoryError("Couldn't load tenant history for this property.");
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Properties</h1>

      <div className="dashboard-actions">
        <button className="primary-btn" onClick={() => setShowPropertyForm((v) => !v)}>
          {showPropertyForm ? "Cancel" : "+ Add property"}
        </button>
      </div>

      {showPropertyForm && (
        <form className="property-form" onSubmit={handleAddProperty}>
          <label htmlFor="name">Property name</label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Shop 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="type">Type</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="shop">Shop</option>
            <option value="house">House</option>
          </select>

          <label htmlFor="address">Address</label>
          <input
            id="address"
            type="text"
            placeholder="Optional"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          {propertyFormError && <div className="error-message">{propertyFormError}</div>}

          <button type="submit" disabled={propertySubmitting}>
            {propertySubmitting ? "Saving…" : "Save property"}
          </button>
        </form>
      )}

      {tenantFormFor && (
        <form className="property-form tenant-form" onSubmit={handleAddTenant}>
          <h3>Add tenant — {tenantFormFor.propertyName}</h3>

          <label htmlFor="tenantName">Tenant name</label>
          <input
            id="tenantName"
            type="text"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            required
          />

          <label htmlFor="tenantPhone">Phone number</label>
          <input
            id="tenantPhone"
            type="tel"
            placeholder="+91XXXXXXXXXX"
            value={tenantPhone}
            onChange={(e) => setTenantPhone(e.target.value)}
            required
          />

          <label htmlFor="tenantAadhar">Aadhar number</label>
          <input
            id="tenantAadhar"
            type="text"
            placeholder="12-digit Aadhar number"
            value={tenantAadhar}
            onChange={(e) => setTenantAadhar(e.target.value)}
            required
          />

          <label htmlFor="tenantMoveInDate">Move-in date</label>
          <input
            id="tenantMoveInDate"
            type="date"
            value={tenantMoveInDate}
            onChange={(e) => setTenantMoveInDate(e.target.value)}
            required
          />

          {tenantFormError && <div className="error-message">{tenantFormError}</div>}

          <div className="tenant-form-actions">
            <button type="button" className="secondary-btn" onClick={closeTenantForm}>
              Cancel
            </button>
            <button type="submit" disabled={tenantSubmitting}>
              {tenantSubmitting ? "Saving…" : "Save tenant"}
            </button>
          </div>
        </form>
      )}

      {listError && <p className="error-message list-level-error">{listError}</p>}

      <div className="properties-list">
        {listLoading && <p>Loading properties…</p>}

        {!listLoading && properties.length === 0 && (
          <p className="empty-state">
            No properties yet — click "Add property" to create your first one.
          </p>
        )}

        {!listLoading &&
          properties.map((property) => (
            <div className="property-card" key={property._id}>
              <div className="property-card-row">
                <div>
                  <div className="property-name">{property.name}</div>
                  <div className="property-type">{property.type}</div>
                  {property.address && (
                    <div className="property-address">{property.address}</div>
                  )}
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteProperty(property._id, property.name)}
                  title="Delete property"
                >
                  Delete
                </button>
              </div>

              <div className="occupancy-row">
                {property.occupied ? (
                  <span className="badge badge-occupied">
                    Occupied — {property.activeTenantName}
                  </span>
                ) : (
                  <span className="badge badge-vacant">Vacant</span>
                )}
              </div>

              <div className="property-card-actions">
                {property.occupied ? (
                  <button className="move-out-btn" onClick={() => handleMoveOut(property)}>
                    Move out
                  </button>
                ) : (
                  <button className="add-tenant-btn" onClick={() => openTenantForm(property)}>
                    + Add tenant
                  </button>
                )}
              </div>

              <button
                className="history-toggle-btn"
                onClick={() => toggleHistory(property._id)}
              >
                {expandedPropertyId === property._id ? "Hide history ▲" : "View history ▼"}
              </button>

              {expandedPropertyId === property._id && (
                <div className="history-panel">
                  {historyLoading && !tenantHistory[property._id] && (
                    <p className="history-loading">Loading history…</p>
                  )}

                  {historyError && <p className="error-message">{historyError}</p>}

                  {tenantHistory[property._id] && tenantHistory[property._id].length === 0 && (
                    <p className="history-empty">No tenants have stayed here yet.</p>
                  )}

                  {tenantHistory[property._id]?.map((tenant) => (
                    <div className="history-entry" key={tenant._id}>
                      <div className="history-entry-top">
                        <span className="history-tenant-name">{tenant.name}</span>
                        <span
                          className={
                            tenant.active
                              ? "badge badge-occupied history-badge"
                              : "badge history-badge history-badge-past"
                          }
                        >
                          {tenant.active ? "Current" : "Moved out"}
                        </span>
                      </div>
                      <div className="history-entry-details">
                        {tenant.moveInDate} → {tenant.moveOutDate || "present"}
                      </div>
                      <div className="history-entry-details">
                        {tenant.phone} · Aadhar {tenant.aadharMasked}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
