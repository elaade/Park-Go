import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useState } from "react";

import LandingPage from "./Components/LandingPage";
import Subscribers from "./Components/Subscribers";
import AccountPage from "./Components/AccountPage";
import Login from "./Components/Login";
import PlateRecognize from "./Components/PlateRecognize";
import ExitVehicle from "./Components/ExitVehicle";
import AdminDashboard from "./Components/AdminDashboard";
import AddSubscriber from "./Components/AddSubscriber";
import Vehicles from "./Components/Vehicles";
import AdminOverview from "./Components/AdminOverview";
import Reservation from "./Components/Reservation";
import Subscription from "./Components/Subscription";

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (subscriber) => {
    setUser(subscriber);
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/login");
  };

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<LandingPage />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<AddSubscriber />} />

      {/* User */}
      <Route
        path="/account"
        element={
          user ? (
            <AccountPage user={user} onLogout={handleLogout} />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      {/*Rezervari*/}
      <Route
  path="/reservation"
  element={
    user ? (
      <Reservation user={user} />
    ) : (
      <Login onLogin={handleLogin} />
    )
  }
/>
{/*Abonament*/}
<Route
  path="/subscription"
  element={
    user ? (
      <Subscription user={user} />
    ) : (
      <Login onLogin={handleLogin} />
    )
  }
/>
      {/* Admin dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          user && user.role === "admin" ? (
            <AdminDashboard user={user} onLogout={handleLogout} />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      {/* Admin - utilizatori */}
      <Route
        path="/admin"
        element={
          user && user.role === "admin" ? (
            <Subscribers user={user} onLogout={handleLogout} />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      {/* Admin - vehicule în parcare + istoric */}
      <Route
        path="/admin/vehicles"
        element={
          user && user.role === "admin" ? (
            <Vehicles user={user} onLogout={handleLogout} />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      {/* Admin - situație generală */}
      <Route
        path="/admin/overview"
        element={
          user && user.role === "admin" ? (
            <AdminOverview user={user} onLogout={handleLogout} />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      {/* Parking - intrare */}
      <Route
        path="/parking/entry"
        element={
          user && user.role === "admin" ? (
            <PlateRecognize user={user} onLogout={handleLogout} />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      {/* Parking - ieșire */}
      <Route
        path="/parking/exit"
        element={
          user && user.role === "admin" ? (
            <ExitVehicle user={user} onLogout={handleLogout} />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;




