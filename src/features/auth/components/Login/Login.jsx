import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../../core/providers/AuthProvider";
import { Input, Button, Form, Alert } from "antd";
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import './Login.css';

const Login = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuthContext();

  const handleLogin = async (values) => {
    try {
      // Determine if the identifier is an email or username
      const { identifier, password } = values;
      let loginData = { password };

      // Check if the identifier looks like an email
      if (identifier.includes('@')) {
        loginData.email = identifier;
      } else {
        loginData.username = identifier;
      }

      const result = await login(loginData);

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
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-6 md:p-10 rounded-lg shadow-md w-full mx-4 md:w-auto md:max-w-1/3 login-form-container">
        <h2 className="text-[22px] md:text-[25px] font-semibold mb-[10px] text-center text-gray-800">Login</h2>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            className="mb-6"
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          layout="vertical"
          className="w-full"
          size="large"
          validateTrigger={['onChange', 'onBlur']}
        >
          <Form.Item
            name="identifier"
            rules={[
              {
                required: true,
                message: 'Please input your email or username!'
              }
            ]}
            className="mb-5"
          >
            <Input
              prefix={<UserOutlined className="text-gray-400 mr-2" />}
              placeholder="Email or Username"
              size="large"
              className="rounded-lg py-2 border border-gray-200 hover:border-blue-400 focus:border-blue-500 shadow-sm min-h-[44px]"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
            className="mb-7"
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400 mr-2" />}
              placeholder="Password"
              size="large"
              className="rounded-lg py-2 border border-gray-200 hover:border-blue-400 focus:border-blue-500 shadow-sm min-h-[44px]"
            />
          </Form.Item>

          <Form.Item className="mb-2">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 rounded-lg h-11 md:h-12 flex items-center justify-center font-medium shadow-sm min-h-[44px]"
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Don't have an account? <a href="/register" className="text-blue-500 hover:text-blue-600 font-medium">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
