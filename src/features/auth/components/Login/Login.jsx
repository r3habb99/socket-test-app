import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../../core/providers/AuthProvider";
import { Input } from "../../../../shared/components/Input";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuthContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await login({ email, password });
      
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Login failed");
      }
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

export default Login;
