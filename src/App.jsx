// src/App.jsx
import React, { useContext } from "react";
import { SchoolProvider, SchoolContext } from "./context/SchoolContext";
import WeightEntry from "./components/WeightEntry";
import WrestlerList from "./components/WrestlerList";
import GraphView from "./components/GraphView";
import OptionsPanel from "./components/OptionsPanel";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import LoginScreen from "./components/LoginScreen";

const MainApp = () => {
  const { school, logout } = useContext(SchoolContext);
  const [currentPage, setCurrentPage] = React.useState("home");

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_token");
  };

  // Simple routing for admin panel
  if (window.location.pathname === "/admin") {
    return <AdminLogin />;
  }
  if (!school) return <LoginScreen />;

  const style = { background: "#111827", minHeight: "100vh", color: "white" };

  return (
    <div style={style}>
      <div style={{ background: school.primary_color, padding: 12 }}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">{school.name || school.code}</h1>
          <div>
            <button onClick={() => setCurrentPage("home")} className="mr-2">Home</button>
            <button onClick={() => setCurrentPage("wrestlers")} className="mr-2">Roster</button>
            <button onClick={() => setCurrentPage("graph")} className="mr-2">Graph</button>
            <button onClick={() => setCurrentPage("options")} className="mr-2">Options</button>
            <button onClick={logout} className="ml-4">Logout</button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {currentPage === "home" && <WeightEntry />}
        {currentPage === "wrestlers" && <WrestlerList />}
        {currentPage === "graph" && <GraphView />}
        {currentPage === "options" && <OptionsPanel />}
      </div>
    </div>
  );
};

export default function AppWrapper() {
  return (
    <SchoolProvider>
      <MainApp />
    </SchoolProvider>
  );
}
