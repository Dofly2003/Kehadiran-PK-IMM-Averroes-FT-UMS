// src/components/RegisterForm.js
import React, { useState } from "react";
import { db, ref, set } from "../firebase";

const RegisterForm = ({ uid, onClose }) => {
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [prodi, setProdi] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!uid) {
      alert("UID tidak ditemukan!");
      return;
    }

    // Simpan ke Firebase
    set(ref(db, "users/" + uid), {
      nama,
      nim,
      prodi,
    })
      .then(() => {
        alert("User berhasil didaftarkan!");
        onClose(); // tutup form
      })
      .catch((err) => {
        console.error("Error: ", err);
      });
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "16px", marginTop: "16px" }}>
      <h3>Daftarkan UID: {uid}</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nama: </label>
          <input value={nama} onChange={(e) => setNama(e.target.value)} required />
        </div>
        <div>
          <label>NIM: </label>
          <input value={nim} onChange={(e) => setNim(e.target.value)} required />
        </div>
        <div>
          <label>Prodi: </label>
          <input value={prodi} onChange={(e) => setProdi(e.target.value)} required />
        </div>
        <button type="submit">Simpan</button>
        <button type="button" onClick={onClose} style={{ marginLeft: "8px" }}>
          Batal
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
