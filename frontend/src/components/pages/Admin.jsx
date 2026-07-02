import { useState, useEffect, useCallback } from "react";
import {
  getAdminStats,
  getAdminUsuarios,
  crearAdminUsuario,
  getAdminLogs,
  getComandosPendientes,
  ejecutarBackupManual,
  getAdminBackups,
  desactivarAdminUsuario,
} from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { labelActuador } from "../../constants/invernadero.js";

function StatCard({ label, value, ok }) {
  return (
    <div className={`admin-stat ${ok === false ? "admin-stat--warn" : ""}`}>
      <span className="admin-stat-label">{label}</span>
      <span className="admin-stat-value">{value}</span>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [comandos, setComandos] = useState([]);
  const [backups, setBackups] = useState([]);
  const [nuevoUser, setNuevoUser] = useState({ usuario: "", password: "", rol: "lectura" });
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loadingBackup, setLoadingBackup] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [s, u, l, c, b] = await Promise.all([
        getAdminStats(),
        getAdminUsuarios(),
        getAdminLogs(80),
        getComandosPendientes(),
        getAdminBackups(),
      ]);
      setStats(s);
      setUsuarios(u);
      setLogs(l);
      setComandos(c);
      setBackups(b);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, [cargar]);

  async function handleCrearUsuario(e) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    try {
      await crearAdminUsuario(nuevoUser);
      setNuevoUser({ usuario: "", password: "", rol: "lectura" });
      setMsg("Usuario creado");
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBackup() {
    setLoadingBackup(true);
    setMsg(null);
    setError(null);
    try {
      const result = await ejecutarBackupManual();
      setMsg(result.mensaje || "Backup completado");
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBackup(false);
    }
  }

  async function handleDesactivarUsuario(id) {
    setMsg(null);
    setError(null);
    try {
      await desactivarAdminUsuario(id);
      setMsg("Usuario desactivado");
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <h2 className="sec-label">Administración</h2>
      <p className="admin-sub">Sesión: {user?.usuario} (admin)</p>

      {msg && <p className="admin-msg">{msg}</p>}
      {error && <p className="admin-error">{error}</p>}

      <section className="admin-section">
        <h3>Estado del sistema</h3>
        {stats ? (
          <div className="admin-stats-grid">
            <StatCard label="Uptime" value={`${stats.uptime_seg}s`} />
            <StatCard label="Base de datos" value={stats.db ? "OK" : "Sin conexión"} ok={stats.db} />
            <StatCard label="MQTT" value={stats.mqtt ? "Conectado" : "Desconectado"} ok={stats.mqtt} />
            <StatCard
              label="Zonas online"
              value={`${stats.zonas_conectadas}/${stats.zonas_total}`}
            />
            <StatCard label="Memoria" value={`${stats.memoria_mb} MB`} />
            {stats.db_stats && (
              <>
                <StatCard label="Lecturas DB" value={stats.db_stats.lecturas ?? "—"} />
                <StatCard label="Alertas activas" value={stats.db_stats.alertas_activas ?? "—"} />
                <StatCard label="Comandos en cola" value={stats.db_stats.comandos_pendientes ?? "—"} />
              </>
            )}
          </div>
        ) : (
          <p>Cargando estadísticas…</p>
        )}
        <button type="button" className="btn-secondary" onClick={handleBackup} disabled={loadingBackup}>
          {loadingBackup ? "Ejecutando backup…" : "Crear backup ahora"}
        </button>
        <ul className="admin-backups-list">
          {backups.map((b) => (
            <li key={b.archivo}>
              {b.archivo} — {b.tamano_kb} KB — {new Date(b.fecha).toLocaleString("es-ES")}
            </li>
          ))}
          {backups.length === 0 && <li className="admin-empty">Sin backups</li>}
        </ul>
      </section>

      <section className="admin-section">
        <h3>Usuarios</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.usuario}</td>
                <td>{u.rol}</td>
                <td>{u.activo ? "Sí" : "No"}</td>
                <td>
                  {u.activo && u.usuario !== user?.usuario && (
                    <button
                      type="button"
                      className="btn-text-danger"
                      onClick={() => handleDesactivarUsuario(u.id)}
                    >
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form className="admin-form" onSubmit={handleCrearUsuario}>
          <input
            placeholder="Nuevo usuario"
            value={nuevoUser.usuario}
            onChange={(e) => setNuevoUser((p) => ({ ...p, usuario: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={nuevoUser.password}
            onChange={(e) => setNuevoUser((p) => ({ ...p, password: e.target.value }))}
            required
          />
          <select
            value={nuevoUser.rol}
            onChange={(e) => setNuevoUser((p) => ({ ...p, rol: e.target.value }))}
          >
            <option value="lectura">Solo lectura</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" className="btn-primary">
            Crear usuario
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h3>Comandos pendientes ({comandos.length})</h3>
        {comandos.length === 0 ? (
          <p className="admin-empty">No hay comandos en cola</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Zona</th>
                <th>Actuador</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {comandos.map((c) => (
                <tr key={c.id}>
                  <td>{c.zona_id}</td>
                  <td>{labelActuador(c.actuador)}</td>
                  <td>{c.estado}</td>
                  <td>{new Date(c.creado_en).toLocaleString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="admin-section">
        <h3>Logs del sistema</h3>
        <div className="admin-logs">
          {logs.map((log) => (
            <div key={log.id} className="admin-log-line">
              <span className="admin-log-ts">
                {new Date(log.timestamp).toLocaleString("es-ES")}
              </span>
              <span className={`admin-log-nivel admin-log-nivel--${log.nivel}`}>{log.nivel}</span>
              <span>{log.mensaje}</span>
            </div>
          ))}
          {logs.length === 0 && <p className="admin-empty">Sin logs</p>}
        </div>
      </section>
    </div>
  );
}
