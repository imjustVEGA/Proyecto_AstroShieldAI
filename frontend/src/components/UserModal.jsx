import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function UserModal({ user, onClose, onSave, saving }) {
  const [values, setValues] = useState({
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "user",
    is_active: user?.is_active ?? true,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setValues({
      username: user?.username || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "user",
      is_active: user?.is_active ?? true,
    });
  }, [user]);

  const update = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!user && values.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (values.password.length > 72) {
      setError("La contraseña no puede superar 72 caracteres.");
      return;
    }
    const payload = {
      username: values.username.trim(),
      email: values.email.trim(),
      role: values.role,
    };
    if (user) payload.is_active = values.is_active;
    if (values.password) payload.password = values.password;
    try {
      await onSave(payload);
    } catch (saveError) {
      setError(saveError.userMessage || saveError.message || "No se pudo guardar el usuario.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="user-modal-title" aria-modal="true" className="w-full max-w-lg rounded-xl border bg-popover p-6 shadow-2xl" role="dialog">
        <div className="mb-6 flex items-start justify-between">
          <div><p className="text-xs uppercase tracking-widest text-astro-cyan">Administración</p><h2 className="mt-1 text-xl font-semibold" id="user-modal-title">{user ? "Editar usuario" : "Nuevo usuario"}</h2></div>
          <button aria-label="Cerrar" className="rounded-lg p-2 text-astro-muted hover:bg-astro-card hover:text-astro-text" onClick={onClose} type="button"><X size={18} /></button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm">Username<input autoComplete="off" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-astro-cyan" minLength="3" maxLength="64" required value={values.username} onChange={update("username")} /></label>
          <label className="block text-sm">Email<input autoComplete="off" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-astro-cyan" maxLength="254" required type="email" value={values.email} onChange={update("email")} /></label>
          <label className="block text-sm">Contraseña{user && <span className="ml-1 text-xs text-astro-muted">(deja en blanco para mantenerla)</span>}<input autoComplete="new-password" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-astro-cyan" maxLength="72" minLength={user ? undefined : 6} required={!user} type="password" value={values.password} onChange={update("password")} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">Rol<select className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5" value={values.role} onChange={update("role")}><option value="user">Usuario</option><option value="admin">Administrador</option></select></label>
            {user && <label className="flex items-center gap-2 self-end pb-3 text-sm"><input checked={values.is_active} onChange={(event) => setValues((current) => ({ ...current, is_active: event.target.checked }))} type="checkbox" /> Cuenta activa</label>}
          </div>
          {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">{error}</p>}
          <div className="flex justify-end gap-3 pt-2"><button className="rounded-md border px-4 py-2 text-sm hover:bg-secondary" onClick={onClose} type="button">Cancelar</button><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={saving} type="submit">{saving ? "Guardando..." : user ? "Guardar cambios" : "Crear usuario"}</button></div>
        </form>
      </section>
    </div>
  );
}
