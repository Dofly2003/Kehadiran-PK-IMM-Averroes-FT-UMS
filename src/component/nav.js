// src/components/Navbar.js
import React from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <nav
      className="navbar navbar-expand-lg shadow-sm"
      style={{
        backgroundColor: "#000", // hitam solid
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="container">
        <NavLink
          className="navbar-brand fw-semibold"
          to="/"
          style={{ color: "#0d6efd", fontWeight: 700 }}
        >
          🎓 <span style={{ color: "#fff" }}>Sistem Absensi</span>
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  "nav-link px-3 rounded-3 me-2 transition " +
                  (isActive
                    ? "bg-white text-primary fw-semibold shadow-sm"
                    : "text-white")
                }
                style={{
                  transition: "all 0.3s ease",
                }}
                to="/Tambah-Member"
              >
                📋 Daftar Member
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  "nav-link px-3 rounded-3 me-2 transition " +
                  (isActive
                    ? "bg-white text-primary fw-semibold shadow-sm"
                    : "text-white")
                }
                style={{
                  transition: "all 0.3s ease",
                }}
                to="/"
              >
                ✅ Absensi Hari Ini
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  "nav-link px-3 rounded-3 transition " +
                  (isActive
                    ? "bg-white text-primary fw-semibold shadow-sm"
                    : "text-white")
                }
                style={{
                  transition: "all 0.3s ease",
                }}
                to="/log-absen"
              >
                📑 Log Absensi
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
