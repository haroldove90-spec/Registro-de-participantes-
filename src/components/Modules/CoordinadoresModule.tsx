import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  User,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Share2,
  Trash2,
  Edit2,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  Building2,
  Send,
  HelpCircle,
  X,
} from 'lucide-react';
import { UserCredential, UserRole } from '../../types';
import {
  getStoredCredentials,
  saveOrUpdateCoordinator,
  deleteCoordinator,
  formatMexicanWhatsAppPhone,
  generateWhatsAppCredentialsUrl,
  generateSecurePassword,
  SYSTEM_OFFICIAL_URL,
  UPDATED_DATABASE_SQL,
} from '../../utils/auth';

interface CoordinadoresModuleProps {
  onNotify?: (message: string) => void;
}

export const CoordinadoresModule: React.FC<CoordinadoresModuleProps> = () => {
  const [credentialsList, setCredentialsList] = useState<UserCredential[]>(() =>
    getStoredCredentials()
  );

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<UserRole>('Coordinadores');
  const [clave, setClave] = useState(() => generateSecurePassword('Coord'));
  const [puesto, setPuesto] = useState('Coordinador de Capacitación');
  const [departamento, setDepartamento] = useState('Recursos Humanos / Capacitación');
  const [showClave, setShowClave] = useState(false);

  // Feedback states
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Real-time phone formatting with automatic Mexican country code (+52)
  const phoneFormatting = formatMexicanWhatsAppPhone(telefono);

  const handleGenerateNewPassword = () => {
    const suggested = generateSecurePassword(usuario || 'Coord');
    setClave(suggested);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setNombre('');
    setUsuario('');
    setEmail('');
    setTelefono('');
    setRol('Coordinadores');
    setClave(generateSecurePassword('Coord'));
    setPuesto('Coordinador de Capacitación');
    setDepartamento('Recursos Humanos / Capacitación');
    setFormError('');
    setFormSuccess('');
  };

  const handleEditCoordinator = (coord: UserCredential) => {
    setEditingId(coord.id);
    setNombre(coord.nombre);
    setUsuario(coord.usuario);
    setEmail(coord.email);
    setTelefono(coord.telefono);
    setRol(coord.rol as UserRole);
    setClave(coord.clave);
    setPuesto(coord.puesto || 'Coordinador de Capacitación');
    setDepartamento(coord.departamento || 'Recursos Humanos / Capacitación');
    setFormError('');
    setFormSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!nombre.trim()) {
      setFormError('El nombre completo es obligatorio.');
      return;
    }

    const cleanUser = usuario.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanUser) {
      setFormError('El nombre de usuario es obligatorio.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!clave.trim() || clave.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Check duplicate username or email
    const exists = credentialsList.some(
      (c) =>
        c.id !== editingId &&
        (c.usuario.toLowerCase() === cleanUser ||
          c.email.toLowerCase() === email.trim().toLowerCase())
    );

    if (exists) {
      setFormError('Ya existe otro usuario registrado con este nombre de usuario o correo.');
      return;
    }

    // Save with normalized Mexican phone
    const saved = saveOrUpdateCoordinator({
      id: editingId || undefined,
      nombre: nombre.trim(),
      usuario: cleanUser,
      email: email.trim().toLowerCase(),
      clave: clave.trim(),
      rol,
      telefono: phoneFormatting.display || telefono.trim(),
      puesto: puesto.trim(),
      departamento: departamento.trim(),
      rfc: 'XAXX010101000',
      avatarUrl:
        rol === 'Coordinadores'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      activo: true,
    });

    setCredentialsList(getStoredCredentials());
    setFormSuccess(
      editingId
        ? `Coordinador "${saved.nombre}" actualizado correctamente.`
        : `¡Coordinador "${saved.nombre}" registrado con éxito! Ya puede ingresar al sistema con su rol asignado.`
    );

    if (!editingId) {
      handleResetForm();
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al coordinador "${name}"?`)) {
      const res = deleteCoordinator(id);
      if (!res.success) {
        alert(res.error);
        return;
      }
      setCredentialsList(getStoredCredentials());
    }
  };

  const handleCopyCredentials = (coord: UserCredential) => {
    const text =
      `*Credenciales de Acceso - Sistema de Control de Capacitaciones*\n` +
      `Enlace: ${SYSTEM_OFFICIAL_URL}\n` +
      `Nombre: ${coord.nombre}\n` +
      `Usuario: ${coord.usuario}\n` +
      `Correo: ${coord.email}\n` +
      `Contraseña: ${coord.clave}\n` +
      `Rol: ${coord.rol}\n` +
      `WhatsApp: ${coord.telefono}`;

    navigator.clipboard.writeText(text);
    setCopiedId(coord.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleShowPass = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(UPDATED_DATABASE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const filteredCredentials = credentialsList.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.usuario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.rol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Módulo de Administración Exclusivo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Registro y Gestión de Coordinadores
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Asigna roles operativos, genera credenciales seguras y comparte accesos instantáneamente por
            WhatsApp junto con el enlace oficial del sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Script SQL Actualizado</span>
          </button>

          <a
            href={SYSTEM_OFFICIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/30"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Enlace del Sistema</span>
          </a>
        </div>
      </div>

      {/* Grid: Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Registration Form (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                {editingId ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingId ? 'Editar Coordinador' : 'Alta de Coordinador'}
                </h2>
                <p className="text-xs text-slate-500">Credenciales y permisos de acceso</p>
              </div>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
              >
                Cancelar edición
              </button>
            )}
          </div>

          {formSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre Completo */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ej. Cesar Netro"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    if (!editingId && !usuario) {
                      // Auto-suggest username from name
                      const parts = e.target.value.toLowerCase().trim().split(/\s+/);
                      if (parts.length >= 2) {
                        setUsuario(`${parts[0]}_${parts[1]}`);
                      } else if (parts.length === 1 && parts[0]) {
                        setUsuario(parts[0]);
                      }
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Usuario y Correo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Usuario para Acceso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. cesar_netro"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="cesar_netro@hotmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Teléfono / WhatsApp con Detección Automática de +52 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Teléfono / WhatsApp *
                </label>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Autodetección +52 México
                </span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="ej. 8112345678 o 5512345678"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                />
              </div>
              {telefono && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Formato internacional WhatsApp:{' '}
                    <strong className="font-mono font-bold">
                      {phoneFormatting.display || `+52 ${telefono}`}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Rol Asignado */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Rol en el Sistema *
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="Coordinadores">Coordinadores (Registro de Participantes y Perfil)</option>
                <option value="Admin">Admin (Control Total, Edición, Borrado y Desactivación)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Al entrar al sistema, el usuario accederá con su respectivo rol y los eventos se mantendrán perfectamente sincronizados.
              </p>
            </div>

            {/* Clave Segura */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contraseña de Acceso Segura *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateNewPassword}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generar Clave Segura</span>
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showClave ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowClave(!showClave)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showClave ? 'Ocultar clave' : 'Mostrar clave'}
                >
                  {showClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Puesto y Depto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Puesto / Cargo
                </label>
                <input
                  type="text"
                  placeholder="Coordinador de Capacitación"
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Departamento
                </label>
                <input
                  type="text"
                  placeholder="Recursos Humanos"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {editingId ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios de Coordinador</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Registrar Coordinador y Activar Rol</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Coordinators Directory & Share Actions (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Directorio de Coordinadores y Administradores</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {credentialsList.length} cuentas registradas con acceso activo
                </p>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Buscar por nombre o usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* List of Cards */}
            <div className="space-y-3.5">
              {filteredCredentials.map((coord) => {
                const isHaroldAdmin = coord.usuario === 'haroldo90';
                const isCesarCoord = coord.usuario === 'cesar_netro';
                const waUrl = generateWhatsAppCredentialsUrl(coord);
                const isPassVisible = revealedPasswords[coord.id];

                return (
                  <div
                    key={coord.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isHaroldAdmin
                        ? 'bg-purple-50/50 border-purple-200/80 shadow-xs'
                        : isCesarCoord
                        ? 'bg-blue-50/40 border-blue-200/80 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left info */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <img
                          src={
                            coord.avatarUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                          }
                          alt={coord.nombre}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900">{coord.nombre}</h3>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                coord.rol === 'Administrador de Capacitación'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {coord.rol}
                            </span>
                            {isHaroldAdmin && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold">
                                Admin Principal
                              </span>
                            )}
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-800 font-bold">
                              @{coord.usuario}
                            </span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {coord.email}
                            </span>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            <span className="flex items-center gap-1 text-slate-700 font-medium font-mono">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              {coord.telefono || 'Sin teléfono'}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {coord.puesto || 'Coordinador'} • {coord.departamento || 'RH'}
                            </span>
                          </div>

                          {/* Password line */}
                          <div className="mt-2 flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 inline-flex">
                            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-500 font-medium">Clave:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {isPassVisible ? coord.clave : '••••••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleShowPass(coord.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer ml-1"
                              title="Revelar / Ocultar clave"
                            >
                              {isPassVisible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right action buttons: WhatsApp & Copy */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        {/* WhatsApp Button */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow-emerald-600/30 cursor-pointer"
                          title="Compartir credenciales por WhatsApp con enlace oficial"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(coord)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Copiar credenciales completas"
                        >
                          {copiedId === coord.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>

                        {/* Edit & Delete for secondary accounts */}
                        <div className="flex items-center gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => handleEditCoordinator(coord)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Editar datos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isHaroldAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(coord.id, coord.nombre)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar coordinador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SQL Script Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-white">
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Script SQL Actualizado</h3>
                  <p className="text-xs text-slate-400">
                    Tablas para usuarios, credenciales, eventos y lista de participantes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡SQL Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar SQL</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-slate-950 font-mono text-xs text-emerald-400 leading-relaxed select-text">
              <pre className="whitespace-pre-wrap">{UPDATED_DATABASE_SQL}</pre>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
              <span>Incluye inserciones iniciales para Harold Anguiano y Cesar Netro</span>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
