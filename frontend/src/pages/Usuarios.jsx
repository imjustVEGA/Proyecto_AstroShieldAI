import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, RefreshCw, Shield, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import UserModal from "@/components/UserModal";
import { PageHeader } from "@/components/common";
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
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader eyebrow="Sistema  /  Administración" title="Usuarios" description="Gestiona las cuentas y permisos de acceso."
        actions={<div className="flex gap-2"><button aria-label="Actualizar usuarios" className="rounded-md border p-2.5 text-muted-foreground hover:text-accent" disabled={loading} onClick={refresh} type="button"><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></button><button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90" onClick={() => setModalUser(null)} type="button"><Plus size={16} /> Nuevo usuario</button></div>} />
      {loadError && <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert"><span>{loadError}</span><button className="underline" onClick={refresh} type="button">Reintentar</button></div>}
      <article className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><tr>{["ID", "Usuario", "Email", "Rol", "Estado", "Acciones"].map((item) => <th className="px-5 py-4" key={item}>{item}</th>)}</tr></thead><tbody>
          {loading && <tr><td className="px-5 py-10 text-center text-astro-muted" colSpan="6">Cargando usuarios...</td></tr>}
          {!loading && !loadError && users.map((user) => <tr className="border-b border-border/70 last:border-0 hover:bg-secondary/40" key={user.id}>
            <td className="px-5 py-4 text-astro-muted">{user.id}</td>
            <td className="px-5 py-4"><span className="flex items-center gap-2 font-medium"><UserRound className="text-astro-cyan" size={17} />{user.username}</span></td>
            <td className="px-5 py-4 text-astro-muted">{user.email}</td>
            <td className="px-5 py-4"><span className="flex items-center gap-1.5">{user.role === "admin" && <Shield className="text-astro-cyan" size={14} />}{user.role === "admin" ? "Administrador" : "Usuario"}</span></td>
            <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${user.is_active ? "bg-astro-cyan/10 text-astro-cyan" : "bg-red-500/10 text-red-300"}`}>{user.is_active ? "Activo" : "Inactivo"}</span></td>
            <td className="px-5 py-4"><div className="flex gap-2"><button aria-label={`Editar ${user.username}`} className="rounded-md border p-2 text-astro-muted hover:text-astro-cyan" onClick={() => setModalUser(user)} type="button"><Pencil size={15} /></button><button aria-label={`Eliminar ${user.username}`} className="rounded-md border p-2 text-astro-muted hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40" disabled={user.id === currentUser?.id} onClick={() => remove(user)} title={user.id === currentUser?.id ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"} type="button"><Trash2 size={15} /></button></div></td>
          </tr>)}
          {!loading && !loadError && users.length === 0 && <tr><td className="px-5 py-10 text-center text-astro-muted" colSpan="6">No hay usuarios registrados.</td></tr>}
        </tbody></table></div>
      </article>
      {modalUser !== undefined && <UserModal key={modalUser?.id || "new"} user={modalUser} onClose={() => setModalUser(undefined)} onSave={save} saving={saving} />}
    </motion.section>
  );
}
