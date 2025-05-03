import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/auth.css";
import { loginUser } from "../../apis";
import { Input } from "../Common";

export const Login = ({ setAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Use navigate to redirect after login

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser({ email, password });
      console.log("Login response:", data);

      // Extract token and user data, handling different response structures
      const token = data?.data?.token || data?.token;
      const userData =
        data?.data?.userData ||
        data?.userData ||
        data?.data?.user ||
        data?.user ||
        {};
      const id = userData?.id || userData?._id;
      const username = userData?.username;

      if (!id) {
        throw new Error("User ID is missing from the response");
      }
      if (!token) {
        throw new Error("Token is missing from the response");
      }
      if (!username) {
        throw new Error("Username is missing from the response");
      }

      console.log("Login successful:", {
        id,
        username,
        token: token.substring(0, 20) + "...",
      });

      // Store user data in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userId", id);
      localStorage.setItem("username", username);

      // Dispatch a storage event to notify other components
      window.dispatchEvent(new Event("storage"));

      setAuthenticated(true);
      navigate("/dashboard"); // Redirect to dashboard after login
    } catch (err) {
      console.error("Login error details:", err);
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin}>
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
        <div className="form-footer">
          <p>
            Don't have an account? <a href="/register">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};
