// src/App.jsx
import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { SchoolProvider, SchoolContext } from "./context/SchoolContext";
import WeightEntry from "./components/WeightEntry";
import WrestlerList from "./components/WrestlerList";
import GraphView from "./components/GraphView";
import OptionsPanel from "./components/OptionsPanel";
import AdminLogin from "./components/AdminLogin";
import LoginScreen from "./components/LoginScreen";
import Reporting from "./components/Reporting";
import QuickWeightEntry from "./components/QuickWeightEntry";
import { NotifyProvider } from "./context/NotifyContext";
import { WrestlersProvider } from "./context/WrestlersContext";

const MainApp = () => {
  const { school, logout } = useContext(SchoolContext);
  const [currentPage, setCurrentPage] = React.useState("home");


  const location = useLocation();
  const navigate = useNavigate();

  // Simple routing for admin panel and quick entry
  if (location.pathname === "/admin") {
    return <AdminLogin />;
  }
  
  // Handle quick weight entry route
  if (location.pathname.startsWith("/w/") && location.pathname.split('/').filter(Boolean).length === 2) {
    return (
      <NotifyProvider>
        <WrestlersProvider>
          <QuickWeightEntry />
        </WrestlersProvider>
      </NotifyProvider>
    );
  }
  
  if (!school) return <LoginScreen />;

  const style = { background: "#111827", minHeight: "100vh", color: "white" };

  return (
    <div style={style} className="min-h-screen flex flex-col">
      <div style={{ background: school.primary_color, padding: 12 }}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">{school.name || school.code}</h1>
          <div>
            <button onClick={() => setCurrentPage("home")} className="mr-2">Home</button>
            <button onClick={() => setCurrentPage("wrestlers")} className="mr-2">Roster</button>
            <button onClick={() => setCurrentPage("graph")} className="mr-2">Graph</button>
            <button onClick={() => setCurrentPage("reporting")} className="mr-2">Reporting</button>
            <button onClick={() => setCurrentPage("options")} className="mr-2">Options</button>
            <a 
              href={`/w/${encodeURIComponent(school.name || school.code)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mr-2 bg-white text-blue-600 px-3 py-1 rounded font-medium hover:bg-blue-50"
            >
              Quick Entry
            </a>
            <button onClick={logout} className="ml-2">Logout</button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto flex-1 w-full">
        {currentPage === "home" && <WeightEntry />}
        {currentPage === "wrestlers" && <WrestlerList />}
        {currentPage === "graph" && <GraphView />}
        {currentPage === "reporting" && <Reporting />}
        {currentPage === "options" && <OptionsPanel />}
      </div>
    </div>
  );
};

function AppWithRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/w/:schoolName" element={
          <SchoolProvider>
            <MainApp />
          </SchoolProvider>
        } />
        <Route path="*" element={
          <NotifyProvider>
            <SchoolProvider>
              <WrestlersProvider>
                <MainApp />
              </WrestlersProvider>
            </SchoolProvider>
          </NotifyProvider>
        } />
      </Routes>
    </Router>
  );
}

export default function AppWrapper() {
  return <AppWithRouter />;
}
