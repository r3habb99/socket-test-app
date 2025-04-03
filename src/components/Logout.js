import { logoutUser } from "../apis/auth";

// Logout Component
const Logout = ({ onLogout }) => {
  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem("token");
      onLogout();
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
};
export default Logout;
