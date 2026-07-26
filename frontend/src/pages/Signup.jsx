
import { useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const baseUrl = import.meta.env.VITE_API_URL;

export default function Signup() {

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [otp, setOtp] = useState("");
  
  const [loading, setLoading] = useState(false);
  
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const [otpSent, setOtpSent] = useState(false);
  
  const navigate = useNavigate();

  async function sendOTP(e) {

    e.preventDefault();

    try {

      setLoading(true);

      if (!name.trim()) {
          alert("Please enter your name.");
          return;
      }
      
      if (!phone.trim()) {
          alert("Please enter your phone number.");
          return;
      }
      
      if (!password) {
          alert("Please enter a password.");
          return;
      }
      
      if (password.length < 8) {
          alert("Password must be at least 8 characters.");
          return;
      }
      
      if (password !== confirmPassword) {
          alert("Passwords do not match.");
          return;
      }

      if (!window.recaptchaVerifier) {

        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
          }
        );

        await window.recaptchaVerifier.render();

      }

      const result = await signInWithPhoneNumber(
        auth,
        "+91" + phone,
        window.recaptchaVerifier
      );

      setConfirmationResult(result);
      setOtpSent(true);
      alert("OTP Sent Successfully");

    } catch (err) {

      console.error(err);

      alert(err.message);

    } finally {

      setLoading(false);

    }

  }

    async function verifyOTP() {

      try {

        setLoading(true);

        const credential = await confirmationResult.confirm(otp);

        const firebaseToken =
          await credential.user.getIdToken();

        await axios.post(
          "http://localhost:5001/api/auth/register",
        // '${baseUrl}/api/register'
          {
            name,
            password,
            firebaseToken,
          },
          {
            withCredentials: true,
          }
        );

        alert("Registration Successful");

        navigate("/dashboard");

      } catch (err) {

        console.error(err);

        // alert(
        //   err.response?.data?.msg ||
        //   err.message
        // );
        alert(
          err.response?.data?.error ||
          err.message
        );

      } finally {

        setLoading(false);

      }

    }

  return (

    <div className="login-page">

      <form
        className="login-card"
        onSubmit={sendOTP}
      >

        <h1>Tenant Ledger</h1>

        <p className="subtitle">
          Create your account
        </p>

        <label>Name</label>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Phone Number</label>

        <input
          type="tel"
          placeholder="9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <label>Password</label>

        <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
        />

        <label>Confirm Password</label>

        <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
        />

        <div id="recaptcha-container"></div>

        {
          !otpSent && (
        
            <button
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>

          )
        }

        {
          otpSent && (
        
            <>

              <label>OTP</label>
        
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value)
                }
              />

              <button
                type="button"
                onClick={verifyOTP}
                disabled={loading}
              >
                {loading
                  ? "Verifying..."
                  : "Verify OTP"}
              </button>
                
            </>

          )
        }

      </form>

    </div>

  );

}