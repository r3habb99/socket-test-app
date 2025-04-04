import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../apis/auth";
import "../css/login.css";
import Input from "./Input"; // Import the reusable Input component

const Login = ({ setAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Use navigate to redirect after login

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser({ email, password });
      const token = data?.data?.token; // Fix: Access correct token path
      const id = data?.data?.userData?.id;
      if (!id) {
        throw new Error("User ID is missing from the response");
      }
      if (!token) {
        throw new Error("Token is missing from the response");
      }
      // console.log(data?.data?.userData?.id, "token data");
      localStorage.setItem("token", token);
      localStorage.setItem("userId", id);
      setAuthenticated(true);
      navigate("/dashboard"); // Redirect to dashboard after login
    } catch (err) {
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

export default Login;
