import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [properties, setProperties] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("shop");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

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

  // Load the list once when the page first mounts.
  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  async function handleAddProperty(e) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await apiClient.post("/properties", {
        name: name.trim(),
        type,
        address: address.trim(),
      });

      // Reset the form and pull the fresh list rather than guessing what
      // the new property looks like on our end — keeps this in sync with
      // whatever the backend actually stored.
      setName("");
      setType("shop");
      setAddress("");
      setShowForm(false);
      await loadProperties();
    } catch (err) {
      const message =
        err.response?.data?.error || "Couldn't add the property. Please try again.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProperty(propertyId, propertyName) {
    const confirmed = window.confirm(
      `Delete "${propertyName}"? This can't be undone.`
    );
    if (!confirmed) return;

    try {
      await apiClient.delete(`/properties/${propertyId}`);
      await loadProperties();
    } catch (err) {
      setListError("Couldn't delete that property. Please try again.");
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div />
        <div className="header-center">
          <h1>Properties</h1>
          <p className="welcome-text">Welcome, {user?.name}</p>
        </div>
        <button className="logout-btn" onClick={() => logout()}>
          Log out
        </button>
      </header>

      <div className="dashboard-actions">
        <button className="primary-btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add property"}
        </button>
      </div>

      {showForm && (
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

          {formError && <div className="error-message">{formError}</div>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save property"}
          </button>
        </form>
      )}

      <div className="properties-list">
        {listLoading && <p>Loading properties…</p>}
        {listError && <p className="error-message">{listError}</p>}

        {!listLoading && !listError && properties.length === 0 && (
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
            </div>
          ))}
      </div>
    </div>
  );
}
