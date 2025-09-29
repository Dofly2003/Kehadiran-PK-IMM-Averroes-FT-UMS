// src/components/Navbar.js
import React from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <nav
      className="navbar navbar-expand-lg shadow-sm"
      style={{
        background: "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)", // ungu → biru
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="container">
        <NavLink className="navbar-brand fw-semibold text-white" to="/">
          🎓 <span style={{ fontWeight: 600 }}>Sistem Absensi</span>
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
                  "nav-link px-3 rounded-3 me-2 " +
                  (isActive
                    ? "bg-white text-primary fw-semibold shadow-sm"
                    : "text-white-50 hover-text-white")
                }
                to="/Tambah-Member"
              >
                📋 Daftar Member
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  "nav-link px-3 rounded-3 me-2 " +
                  (isActive
                    ? "bg-white text-primary fw-semibold shadow-sm"
                    : "text-white-50 hover-text-white")
                }
                to="/"
              >
                ✅ Absensi Hari Ini
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  "nav-link px-3 rounded-3 " +
                  (isActive
                    ? "bg-white text-primary fw-semibold shadow-sm"
                    : "text-white-50 hover-text-white")
                }
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
