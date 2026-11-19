import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, RefreshCw, Shield, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import UserModal from "@/components/UserModal";
import { createUser, deleteUser, listUsers, updateUser } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalUser, setModalUser] = useState(undefined);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setUsers(await listUsers());
    } catch (error) {
      setLoadError(error.userMessage || "No se pudo cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = async (payload) => {
    setSaving(true);
    try {
      if (modalUser) {
        await updateUser(modalUser.id, payload);
        toast.success("Usuario actualizado");
      } else {
        await createUser(payload);
        toast.success("Usuario creado");
      }
      setModalUser(undefined);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`¿Eliminar al usuario ${user.username}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUser(user.id);
      toast.success("Usuario eliminado");
      await refresh();
    } catch (error) {
      toast.error(error.userMessage || "No se pudo eliminar el usuario.");
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-widest text-astro-cyan">Administración</p><h1 className="mt-2 text-3xl font-semibold">Usuarios</h1><p className="mt-2 text-sm text-astro-muted">Gestiona las cuentas y permisos de acceso.</p></div>
        <div className="flex gap-2"><button aria-label="Actualizar usuarios" className="rounded-lg border border-astro-card p-3 text-astro-muted hover:text-astro-cyan" disabled={loading} onClick={refresh} type="button"><RefreshCw className={loading ? "animate-spin" : ""} size={18} /></button><button className="flex items-center gap-2 rounded-lg bg-astro-blue px-4 py-3 text-sm font-semibold" onClick={() => setModalUser(null)} type="button"><Plus size={18} /> Nuevo usuario</button></div>
      </header>
      {loadError && <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert"><span>{loadError}</span><button className="underline" onClick={refresh} type="button">Reintentar</button></div>}
      <article className="overflow-hidden rounded-xl border border-astro-card bg-astro-card">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-astro-bg text-xs uppercase tracking-wider text-astro-muted"><tr>{["ID", "Usuario", "Email", "Rol", "Estado", "Acciones"].map((item) => <th className="px-5 py-4" key={item}>{item}</th>)}</tr></thead><tbody>
          {loading && <tr><td className="px-5 py-10 text-center text-astro-muted" colSpan="6">Cargando usuarios...</td></tr>}
          {!loading && !loadError && users.map((user) => <tr className="border-b border-astro-bg/80 last:border-0" key={user.id}>
            <td className="px-5 py-4 text-astro-muted">{user.id}</td>
            <td className="px-5 py-4"><span className="flex items-center gap-2 font-medium"><UserRound className="text-astro-cyan" size={17} />{user.username}</span></td>
            <td className="px-5 py-4 text-astro-muted">{user.email}</td>
            <td className="px-5 py-4"><span className="flex items-center gap-1.5">{user.role === "admin" && <Shield className="text-astro-cyan" size={14} />}{user.role === "admin" ? "Administrador" : "Usuario"}</span></td>
            <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${user.is_active ? "bg-astro-cyan/10 text-astro-cyan" : "bg-red-500/10 text-red-300"}`}>{user.is_active ? "Activo" : "Inactivo"}</span></td>
            <td className="px-5 py-4"><div className="flex gap-2"><button aria-label={`Editar ${user.username}`} className="rounded-md border border-astro-bg p-2 text-astro-muted hover:text-astro-cyan" onClick={() => setModalUser(user)} type="button"><Pencil size={15} /></button><button aria-label={`Eliminar ${user.username}`} className="rounded-md border border-astro-bg p-2 text-astro-muted hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40" disabled={user.id === currentUser?.id} onClick={() => remove(user)} title={user.id === currentUser?.id ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"} type="button"><Trash2 size={15} /></button></div></td>
          </tr>)}
          {!loading && !loadError && users.length === 0 && <tr><td className="px-5 py-10 text-center text-astro-muted" colSpan="6">No hay usuarios registrados.</td></tr>}
        </tbody></table></div>
      </article>
      {modalUser !== undefined && <UserModal key={modalUser?.id || "new"} user={modalUser} onClose={() => setModalUser(undefined)} onSave={save} saving={saving} />}
    </motion.section>
  );
}
