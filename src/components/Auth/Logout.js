import { logoutUser } from "../../apis/auth";

// Logout Component
const Logout = ({ onLogout }) => {
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");

      onLogout();
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
};
export default Logout;
