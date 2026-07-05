import { useNavigate } from "react-router-dom";
import "./Home.css";

const features = [
  {
    title: "Manage every property in one place",
    description:
      "Shops, houses — track them all from a single dashboard, no matter how many you own.",
  },
  {
    title: "Full tenant history",
    description:
      "See every tenant who's ever lived at a property, with move-in and move-out dates preserved forever.",
  },
  {
    title: "Flexible monthly billing",
    description:
      "Rent, electricity, water, and any custom charge you need — all in one simple monthly entry.",
  },
  {
    title: "WhatsApp reminders",
    description:
      "Send rent reminders straight to tenants, automatically, until they've paid.",
  },
  {
    title: "Permanent payment ledger",
    description:
      "Every month is recorded and kept — always know who paid, when, and how much.",
  },
  {
    title: "Built for multiple admins",
    description:
      "Manage your own properties and tenants, completely separate from anyone else using the app.",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <section className="hero">
        <h1>TenantLedger</h1>
        <p className="hero-subtitle">
          Simple rent and tenant management for landlords with multiple properties.
        </p>
        <button className="hero-cta" onClick={() => navigate("/login")}>
          Login to get started
        </button>
      </section>

      <section className="features">
        {features.map((feature) => (
          <div className="feature-card" key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
