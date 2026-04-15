"use client";

import { useState, useEffect } from "react";
import { Users, Search, Plus, Mail, Phone, ExternalLink, Loader2, Trash2, UserCog, Activity, Shield, Truck, User, Briefcase, ChevronRight } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { ROLES, UserRole } from "@/lib/roles";
import CreateAccountDrawer from "@/components/accounts/CreateAccountDrawer";
import ConfirmationModal from "@/components/shared/ConfirmationModal";

interface Account {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  fleetId?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: any;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      const res = await fetch(`/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data: Account[] = await res.json();
        const nonAdmins = data.filter(acc => acc.role !== ROLES.ADMIN);
        setAccounts(nonAdmins);
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleEdit = (account: Account) => {
    setAccountToEdit(account);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setAccountToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleDelete = (account: Account) => {
    setAccountToDelete(account);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    setIsDeleting(true);

    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      const res = await fetch(`/api/users/${accountToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountToDelete.id));
        setDeleteModalOpen(false);
      }
    } catch (err) {
      console.error("Deletion error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         acc.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || acc.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleCategories = [
    { id: 'all', title: 'All Accounts', sub: 'List of all users', icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
    { id: ROLES.OPERATOR, title: 'Operators', sub: 'Control and scheduling', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: ROLES.COLLECTOR, title: 'Collectors', sub: 'Pickup and truck staff', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: ROLES.RESIDENT, title: 'Residents', sub: 'People in the community', icon: User, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 pb-20 animate-in fade-in duration-700">
      
      {/* Header Hero - Aligned with Guidance Style */}
      <div className="absolute top-0 left-0 right-0 h-80 sm:h-64 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />
      
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6 mx-auto">
        {/* Header Cluster */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Accounts Registry
              </h1>
              <p className="text-brand-100/60 text-sm font-medium">Manage staff, collectors and residents</p>
            </div>
            <button 
                onClick={handleCreate}
                className="hidden sm:flex items-center justify-center h-12 px-6 bg-white text-brand-900 rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg group"
            >
                <Plus className="w-4 h-4 mr-2.5 group-hover:rotate-90 transition-transform duration-300" />
                Add New Account
            </button>
          </div>

          {/* Search Cluster */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative group w-full lg:max-w-md">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-xl py-3.5 pl-5 pr-24 text-sm font-semibold focus:border-white/20 focus:ring-4 focus:ring-white/5 outline-none text-white transition-all shadow-sm placeholder:text-white/40"
                />
                <div className="absolute inset-y-1.5 right-1.5 flex items-center pointer-events-none">
                    <div className="px-5 h-full flex items-center bg-white text-brand-900 rounded-lg text-sm font-semibold capitalize shadow-lg">
                        Search
                    </div>
                </div>
              </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          
          {/* Left Column: Role Navigation */}
          <div className="lg:col-span-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                  {roleCategories.map((cat) => (
                      <button
                          key={cat.id}
                          onClick={() => setFilterRole(cat.id)}
                          className={`group relative flex items-center p-4 rounded-2xl border transition-all text-left ${
                              filterRole === cat.id 
                                  ? "bg-white border-brand-600 shadow-xl shadow-brand-900/20 scale-[1.02] z-10" 
                                  : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                          }`}
                      >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all ${
                              filterRole === cat.id 
                                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" 
                                  : "bg-gray-100 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600"
                          }`}>
                              <cat.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                              <h4 className={`text-sm font-black tracking-tight ${filterRole === cat.id ? "text-brand-900" : "text-gray-500"}`}>
                                  {cat.title}
                              </h4>
                              <p className={`text-[10px] font-bold tracking-tight mt-0.5 ${filterRole === cat.id ? "text-brand-600" : "text-gray-400"}`}>
                                  {cat.sub}
                              </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-all ${filterRole === cat.id ? "text-brand-500 opacity-100 translate-x-1" : "opacity-0"}`} />
                      </button>
                  ))}
              </div>
              
              <button 
                  onClick={handleCreate}
                  className="sm:hidden w-full flex items-center justify-center h-12 px-6 bg-white text-brand-900 rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg"
              >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Account
              </button>
          </div>

          {/* Right Column: Registry Viewport */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-brand-900/10 overflow-hidden min-h-[500px] flex flex-col">
              
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20">
                    <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-6" />
                    <p className="text-sm font-black text-gray-400 tracking-tight">Loading Accounts...</p>
                </div>
              ) : filteredAccounts.length > 0 ? (
                <>
                  {/* Desktop Table Viewport */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-50 text-xs font-black text-gray-400 tracking-tight bg-gray-50/30">
                          <th className="px-8 py-5">User Info</th>
                          <th className="px-8 py-5">System Role</th>
                          <th className="px-8 py-5">Contact Details</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredAccounts.map((account) => (
                          <tr key={account.id} className="group hover:bg-brand-50/30 transition-all duration-300">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-brand-700 font-bold group-hover:scale-110 group-hover:bg-white group-hover:shadow-lg group-hover:border-brand-100 transition-all duration-500">
                                  {account.fullName.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                  <h4 className="text-base font-black text-gray-900 tracking-tight leading-none">{account.fullName}</h4>
                                  <p className="text-[12px] font-medium text-gray-400 tracking-tight pt-1 opacity-60">ID: {account.id.slice(-8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-600 border border-brand-100 uppercase tracking-widest">
                                {account.role}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="space-y-1.5 flex flex-col items-start">
                                <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-gray-100 text-[11px] font-bold text-gray-600 group-hover:bg-white transition-colors">
                                  <Mail className="w-3 h-3 text-brand-400" />
                                  {account.email}
                                </div>
                                {account.phone && (
                                  <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-transparent text-[10px] font-bold text-gray-400">
                                    <Phone className="w-3 h-3 text-gray-300" />
                                    {account.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2 translate-x-2 group-hover:translate-x-0 transition-transform duration-300 opacity-60 group-hover:opacity-100">
                                <button 
                                    onClick={() => handleEdit(account)}
                                    className="px-5 py-2.5 bg-white text-brand-900 rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(account)}
                                    className="px-5 py-2.5 bg-white text-red-600 rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg hover:bg-red-50"
                                >
                                    Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden grid grid-cols-1 divide-y divide-gray-50">
                    {filteredAccounts.map((account) => (
                      <div key={account.id} className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black">
                              {account.fullName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-gray-900 tracking-tight">{account.fullName}</h4>
                              <p className="text-[10px] font-bold text-brand-600 tracking-tight">{account.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleEdit(account)}
                              className="px-4 py-2 bg-white text-brand-900 rounded-lg text-[11px] font-semibold capitalize shadow-md active:scale-95"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(account)}
                              className="px-4 py-2 bg-white text-red-600 rounded-lg text-[11px] font-semibold capitalize shadow-md active:scale-95"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                            <Mail className="w-3 h-3 text-gray-300" />
                            {account.email}
                          </div>
                          {account.phone && (
                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                              <Phone className="w-3 h-3 text-gray-200" />
                              {account.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mb-8 border border-gray-100 shadow-inner">
                        <Users className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-3 italic tracking-tight">No Accounts Found</h3>
                    <p className="text-sm font-bold text-gray-400 max-w-xs mb-10 leading-relaxed">
                        We could not find any accounts for this filter. Try resetting your search.
                    </p>
                    <button 
                        onClick={() => {setSearchQuery(""); setFilterRole("all");}}
                        className="px-10 h-14 bg-white text-brand-900 rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg border border-gray-100"
                    >
                        Reset Search
                    </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Creation / Edit Side Panel */}
      {/* Account Creation / Edit Side Panel */}
      <CreateAccountDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => {
          setIsDrawerOpen(false);
          setAccountToEdit(null);
        }} 
        onSuccess={fetchAccounts}
        account={accountToEdit}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => !isDeleting && setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Remove Account Access"
        message={`Are you sure you want to remove access for ${accountToDelete?.fullName}? This action cannot be reversed and they will no longer be able to log in.`}
        confirmText="Remove Access"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
