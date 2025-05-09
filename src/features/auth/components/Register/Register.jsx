import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../../core/providers/AuthProvider";
import { Form, Input, Button, Alert } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';

const Register = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const { register } = useAuthContext();

  const handleRegister = async (values) => {
    setError(null);
    setSuccess(null);

    try {
      const result = await register(values);

      if (result.success) {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(result.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-1/3">
        <h2 className="text-[25px] font-semibold mb-[10px] text-center text-gray-800">Create Your Account</h2>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            className="mb-6"
          />
        )}

        {success && (
          <Alert
            message="Success"
            description={success}
            type="success"
            showIcon
            className="mb-6"
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={handleRegister}
          layout="vertical"
          className="w-full"
          size="large"
        >
          <div className="flex flex-col md:flex-row md:space-x-4">
            <Form.Item
              name="firstName"
              className="flex-1 mb-4"
              rules={[{ required: true, message: 'Please input your first name!' }]}
            >
              <Input
                prefix={<IdcardOutlined className="text-gray-400 mr-2" />}
                placeholder="First Name"
                size="large"
                className="rounded-lg py-2 border border-gray-200 hover:border-blue-400 focus:border-blue-500 shadow-sm"
              />
            </Form.Item>

            <Form.Item
              name="lastName"
              className="flex-1 mb-4"
              rules={[{ required: true, message: 'Please input your last name!' }]}
            >
              <Input
                prefix={<IdcardOutlined className="text-gray-400 mr-2" />}
                placeholder="Last Name"
                size="large"
                className="rounded-lg py-2 border border-gray-200 hover:border-blue-400 focus:border-blue-500 shadow-sm"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="username"
            className="mb-4"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400 mr-2" />}
              placeholder="Username"
              size="large"
              className="rounded-lg py-2 border border-gray-200 hover:border-blue-400 focus:border-blue-500 shadow-sm"
            />
          </Form.Item>

          <Form.Item
            name="email"
            className="mb-4"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400 mr-2" />}
              placeholder="Email"
              size="large"
              className="rounded-lg py-2 border border-gray-200 hover:border-blue-400 focus:border-blue-500 shadow-sm"
            />
          </Form.Item>

          <Form.Item
            name="password"
            className="mb-7"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400 mr-2" />}
              placeholder="Password"
              size="large"
              className="rounded-lg py-2 border border-gray-200 hover:border-blue-400 focus:border-blue-500 shadow-sm"
            />
          </Form.Item>

          <Form.Item className="mb-2">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 rounded-lg h-11 flex items-center justify-center font-medium shadow-sm"
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Already have an account? <a href="/login" className="text-blue-500 hover:text-[#76bd5a] font-medium">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
