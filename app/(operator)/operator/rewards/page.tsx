"use client";

import { useState, useEffect, useRef } from "react";
import { 
    Package, 
    Plus, 
    Edit3,
    ChevronRight,
    Trash2,
    X,
    ShoppingBag,
    Gift,
    Zap,
    Utensils,
    Wallet,
    Loader2,
    QrCode,
    ShieldCheck,
    AlertCircle,
    ArrowRight,
    Tag,
    AlignLeft,
    Layers,
    Box,
    Coins
} from "lucide-react";
import { db, auth } from "@/lib/firebase/client";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { addReward, updateReward, deleteReward, RewardItem } from "@/lib/db/rewards";
import { gabayToast } from "@/lib/toast";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import { Html5Qrcode } from "html5-qrcode";

export default function OperatorRewardsPage() {
    const [activeTab, setActiveTab] = useState<"items" | "redemptions" | "scan">("items");
    const [rewards, setRewards] = useState<RewardItem[]>([]);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedemptionsLoading, setIsRedemptionsLoading] = useState(true);

    // Scanner State
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [scannedRedemption, setScannedRedemption] = useState<any>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState("No image chosen");
    const scannerInstance = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<RewardItem | null>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        cost: 0,
        category: "Goods",
        stock: 0,
        iconName: "Package"
    });

    // Real-time listener
    useEffect(() => {
        const q = query(collection(db, "reward_items"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: RewardItem[] = [];
            snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as RewardItem));
            setRewards(list);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Redemptions listener
    useEffect(() => {
        const q = query(collection(db, "redemption_requests"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            setRedemptions(list);
            setIsRedemptionsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Scanner Initialization
    useEffect(() => {
        if (activeTab === "scan") {
            const scanner = new Html5Qrcode("reader");
            scannerInstance.current = scanner;
        }

        return () => {
            if (scannerInstance.current?.isScanning) {
                scannerInstance.current.stop().catch(err => console.error(err));
            }
        };
    }, [activeTab]);

    const startCamera = async () => {
        if (!scannerInstance.current) return;
        setScanError(null);
        try {
            setIsCameraActive(true);
            await scannerInstance.current.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 450, height: 450 } },
                onScanSuccess,
                onScanFailure
            );
        } catch (err: any) {
            setIsCameraActive(false);
            setScanError("Camera access denied or not found.");
            gabayToast.error("Error", "Could not start the camera.");
        }
    };

    const stopCamera = async () => {
        if (scannerInstance.current?.isScanning) {
            await scannerInstance.current.stop();
            setIsCameraActive(false);
        }
    };

    const handleFileScan = async (file: File) => {
        if (!scannerInstance.current) return;
        setScanError(null);
        setSelectedFileName(file.name);
        setIsVerifying(true);
        
        try {
            const decodedText = await scannerInstance.current.scanFile(file, false);
            onScanSuccess(decodedText);
        } catch (err: any) {
            setScanError("No QR code found in this image.");
            gabayToast.error("Scanning Failed", "We couldn't detect a QR code.");
        } finally {
            setIsVerifying(false);
        }
    };

    async function onScanSuccess(decodedText: string) {
        if (isVerifying) return;
        
        if (!decodedText.startsWith("gabay:redeem:")) {
            setScanError("This is not a Gabay Redemption QR.");
            return;
        }

        const redemptionId = decodedText.split("gabay:redeem:")[1];
        if (!redemptionId) return;

        setScanResult(decodedText);
        setIsVerifying(true);
        setScanError(null);

        try {
            const docRef = doc(db, "redemption_requests", redemptionId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                throw new Error("Redemption record not found.");
            }

            const data = docSnap.data();
            setScannedRedemption({ id: docSnap.id, ...data });
            stopCamera();
        } catch (error: any) {
            setScanError(error.message);
            resetScanner();
        } finally {
            setIsVerifying(false);
        }
    }

    function onScanFailure() {}

    const resetScanner = () => {
        stopCamera();
        setScanResult(null);
        setScannedRedemption(null);
        setScanError(null);
        setIsVerifying(false);
        setSelectedFileName("No image chosen");
    };

    const handleConfirmFulfillment = async () => {
        if (!scannedRedemption || isVerifying) return;
        setIsVerifying(true);
        
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`/api/rewards/redeem/${scannedRedemption.id}/fulfill`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to fulfill claim.");
            }

            gabayToast.success("Reward Claimed", `Successfully claimed ${scannedRedemption.itemName} for ${scannedRedemption.residentName}`);
            resetScanner();
        } catch (err: any) {
            gabayToast.error("Update Failed", err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const openModal = (item: RewardItem | null = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description,
                cost: item.cost,
                category: item.category,
                stock: item.stock,
                iconName: item.iconName || "Package"
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: "",
                description: "",
                cost: 0,
                category: "Goods",
                stock: 0,
                iconName: "Package"
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingItem?.id) {
                await updateReward(editingItem.id, formData);
                gabayToast.success("Updated", "Reward item updated successfully.");
            } else {
                await addReward(formData);
                gabayToast.success("Created", "New reward item added to catalog.");
            }
            setIsModalOpen(false);
        } catch (err) {
            gabayToast.error("Error", "Failed to save reward item.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        setItemToDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDeleteId) return;
        setIsDeleting(true);
        try {
            await deleteReward(itemToDeleteId);
            gabayToast.success("Deleted", "Reward removed from catalog.");
            setIsDeleteModalOpen(false);
        } catch (err) {
            gabayToast.error("Error", "Failed to delete item.");
        } finally {
            setIsDeleting(false);
            setItemToDeleteId(null);
        }
    };

    const getIcon = (name: string) => {
        switch(name) {
            case "ShoppingBag": return ShoppingBag;
            case "Gift": return Gift;
            case "Zap": return Zap;
            case "Utensils": return Utensils;
            case "Wallet": return Wallet;
            default: return Package;
        }
    };

    return (
        <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 pb-20">
            {/* Header Hero - Standardized Green */}
            <div className="absolute top-0 left-0 right-0 h-72 sm:h-44 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />

            <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6 mx-auto">
                {/* Header Cluster */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-white tracking-tight">Rewards</h1>
                        <p className="text-brand-100/60 text-sm font-medium tracking-tight whitespace-nowrap">Manage rewards and check QR codes.</p>
                    </div>
                </div>

                {/* Main Content Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
                    
                    {/* Left Side: Navigation */}
                    <div className="lg:col-span-3 space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                            <button 
                                onClick={() => setActiveTab("items")}
                                className={`group relative flex items-center p-4 rounded-2xl border transition-all text-left ${
                                    activeTab === "items" 
                                        ? "bg-white border-brand-600 shadow-xl shadow-brand-900/20 scale-[1.02] z-10" 
                                        : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 transition-all ${
                                    activeTab === "items" ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" : "bg-gray-100 text-gray-400 group-hover:bg-brand-50"
                                }`}>
                                    <Package className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-black tracking-tight ${activeTab === "items" ? "text-brand-900" : "text-gray-500"}`}>
                                        Items
                                    </h4>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${activeTab === "items" ? "text-brand-600" : "text-gray-400"}`}>
                                        Catalog
                                    </p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setActiveTab("redemptions")}
                                className={`group relative flex items-center p-4 rounded-2xl border transition-all text-left ${
                                    activeTab === "redemptions" 
                                        ? "bg-white border-brand-600 shadow-xl shadow-brand-900/20 scale-[1.02] z-10" 
                                        : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 transition-all ${
                                    activeTab === "redemptions" ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" : "bg-gray-100 text-gray-400 group-hover:bg-brand-50"
                                }`}>
                                    <Gift className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-black tracking-tight ${activeTab === "redemptions" ? "text-brand-900" : "text-gray-500"}`}>
                                        History
                                    </h4>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${activeTab === "redemptions" ? "text-brand-600" : "text-gray-400"}`}>
                                        Past claims
                                    </p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setActiveTab("scan")}
                                className={`group relative flex items-center p-4 rounded-2xl border transition-all text-left ${
                                    activeTab === "scan" 
                                        ? "bg-white border-brand-600 shadow-xl shadow-brand-900/20 scale-[1.02] z-10" 
                                        : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 transition-all ${
                                    activeTab === "scan" ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" : "bg-gray-100 text-gray-400 group-hover:bg-brand-50"
                                }`}>
                                    <QrCode className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-black tracking-tight ${activeTab === "scan" ? "text-brand-900" : "text-gray-500"}`}>
                                        Scanner
                                    </h4>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${activeTab === "scan" ? "text-brand-600" : "text-gray-400"}`}>
                                        Check QR
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Data View */}
                    <div className="lg:col-span-9">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-brand-900/10 overflow-hidden flex flex-col min-h-[600px]">
                            
                            {/* Toolbar */}
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
                                <div />
                                <div className="flex gap-2">
                                    {activeTab === "items" && (
                                        <button 
                                            onClick={() => openModal()}
                                            className="px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-700 active:scale-95 transition-all shadow-lg shadow-brand-900/10"
                                        >
                                            <Plus className="w-4 h-4" /> Add Item
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Table Content */}
                            <div className="flex-1">
                                {activeTab === "items" ? (
                                    <>
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-gray-50 text-xs font-black text-gray-400 tracking-tight bg-gray-50/30">
                                                        <th className="px-8 py-5">Items</th>
                                                        <th className="px-8 py-5">Category</th>
                                                        <th className="px-8 py-5">Stock</th>
                                                        <th className="px-8 py-5">Cost</th>
                                                        <th className="px-8 py-5 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {rewards.map((item) => {
                                                        const ItemIcon = getIcon(item.iconName);
                                                        return (
                                                            <tr key={item.id} className="group hover:bg-brand-50/30 transition-all duration-300">
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-center gap-5">
                                                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-brand-700 font-bold group-hover:scale-110 group-hover:bg-white group-hover:shadow-lg group-hover:border-brand-100 transition-all duration-500">
                                                                            <ItemIcon className="w-6 h-6" />
                                                                        </div>
                                                                        <div className="space-y-0.5">
                                                                            <p className="text-base font-black text-gray-900 tracking-tight leading-none">{item.name}</p>
                                                                            <p className="text-[12px] font-medium text-gray-400 tracking-tight pt-1 opacity-60 truncate max-w-[200px]">{item.description}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <span className="px-3 py-1 bg-gray-100/50 border border-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                                        {item.category}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div>
                                                                        <p className="text-sm font-black text-gray-900 tracking-tight">{item.stock} Units</p>
                                                                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${item.stock < 20 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                                            {item.stock < 20 ? 'Low Stock' : 'Stable'}
                                                                        </p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex flex-col">
                                                                        <p className="text-2xl font-black text-brand-600 tracking-tighter leading-none">{item.cost}</p>
                                                                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Points</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6 text-right">
                                                                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                                                                        <button 
                                                                            onClick={() => openModal(item)}
                                                                            className="p-2.5 text-gray-400 hover:text-brand-600 hover:bg-white hover:shadow-lg rounded-xl transition-all border border-transparent hover:border-brand-100"
                                                                        >
                                                                            <Edit3 className="w-4 h-4" />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleDelete(item.id!)}
                                                                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-white hover:shadow-lg rounded-xl transition-all border border-transparent hover:border-red-100"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="md:hidden p-4 space-y-4">
                                            {rewards.map((item) => {
                                                const ItemIcon = getIcon(item.iconName);
                                                return (
                                                    <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm active:scale-[0.98] transition-all">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100">
                                                                    <ItemIcon className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-base font-black text-gray-900 leading-tight">{item.name}</h4>
                                                                    <span className="text-[10px] font-black text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                                        {item.category}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-2xl font-black text-brand-600 tracking-tighter leading-none">{item.cost}</p>
                                                                <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Points</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-medium text-gray-400 line-clamp-2 leading-relaxed">
                                                            {item.description}
                                                        </p>
                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Stock Level</p>
                                                                <p className={`text-sm font-black ${item.stock < 20 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                                    {item.stock} Units • {item.stock < 20 ? 'Low Stock' : 'Stable'}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button 
                                                                    onClick={() => openModal(item)}
                                                                    className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-brand-600 active:bg-brand-50"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(item.id!)}
                                                                    className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 active:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {(rewards.length === 0 && !isLoading) && (
                                            <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-4">
                                                <Package className="w-12 h-12 opacity-20" />
                                                <p className="text-sm font-semibold">Rewards catalog is empty</p>
                                            </div>
                                        )}
                                        {isLoading && (
                                            <div className="py-20 flex flex-col items-center justify-center text-brand-600 space-y-4">
                                                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-sm font-bold">Syncing Catalog...</p>
                                            </div>
                                        )}
                                    </>

                                ) : activeTab === "redemptions" ? (
                                    <>
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-gray-50 text-xs font-black text-gray-400 tracking-tight bg-gray-50/30">
                                                        <th className="px-8 py-5">Resident</th>
                                                        <th className="px-8 py-5">Value Item</th>
                                                        <th className="px-8 py-5 text-center">Cost</th>
                                                        <th className="px-8 py-5">Claim Date</th>
                                                        <th className="px-8 py-5 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {redemptions.map((claim) => (
                                                        <tr key={claim.id} className="group hover:bg-brand-50/30 transition-all duration-300">
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 font-black text-xs shadow-sm group-hover:bg-white group-hover:text-brand-600 transition-all">
                                                                        {claim.residentName.charAt(0)}
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <p className="text-sm font-black text-gray-900 tracking-tight leading-none">{claim.residentName}</p>
                                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {claim.residentId.slice(0, 8)}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div>
                                                                    <p className="text-sm font-black text-gray-700 tracking-tight">{claim.itemName}</p>
                                                                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mt-1 opacity-60">{claim.itemCategory}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-center">
                                                                <p className="text-lg font-black text-red-500 tracking-tighter">-{claim.cost}</p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <p className="text-sm font-black text-gray-900 leading-none">{new Date(claim.createdAt).toLocaleDateString()}</p>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{new Date(claim.createdAt).toLocaleTimeString()}</p>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                                    {claim.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="md:hidden p-4 space-y-4">
                                            {redemptions.map((claim) => (
                                                <div key={claim.id} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm active:scale-[0.98] transition-all">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 font-black text-sm">
                                                                {claim.residentName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-base font-black text-gray-900 leading-tight">{claim.residentName}</h4>
                                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                                    {claim.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xl font-black text-red-500 tracking-tighter">-{claim.cost}</p>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Spent</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Redeemed Item</p>
                                                            <p className="text-sm font-black text-gray-900">{claim.itemName}</p>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                                    </div>
                                                    <div className="flex items-center justify-between pt-2">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Claimed on {new Date(claim.createdAt).toLocaleDateString()}</p>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(claim.createdAt).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {(redemptions.length === 0 && !isRedemptionsLoading) && (
                                            <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-4">
                                                <Gift className="w-12 h-12 opacity-20" />
                                                <p className="text-sm font-semibold">No redemptions found</p>
                                            </div>
                                        )}
                                        {isRedemptionsLoading && (
                                            <div className="py-20 flex flex-col items-center justify-center text-brand-600 space-y-4">
                                                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-sm font-bold">Syncing Claims History...</p>
                                            </div>
                                        )}
                                    </>
                                ) : activeTab === "scan" ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                            <div>
                                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Verify Claim</h2>
                                                <p className="text-sm font-semibold text-gray-400 mt-1">Scan resident QR to fulfill redemption</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                                            {/* Left: Scanner */}
                                            <div className="p-8 border-r border-gray-50 space-y-8">
                                                <div className="bg-brand-950 rounded-[2.5rem] border-8 border-gray-50 shadow-2xl overflow-hidden relative aspect-square">
                                                    {isCameraActive ? (
                                                        <button 
                                                            onClick={stopCamera}
                                                            className="absolute top-6 left-6 z-30 px-6 py-3 bg-black/40 backdrop-blur-md rounded-2xl text-white text-sm font-semibold border border-white/10 hover:bg-black/60 transition-all active:scale-95 shadow-lg"
                                                        >
                                                            Close Camera
                                                        </button>
                                                    ) : (
                                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-10 space-y-10 bg-brand-950/95 backdrop-blur-xl">
                                                            <div className="text-center space-y-6 w-full">
                                                                <h3 className="text-lg font-black text-white tracking-tight">Camera Access</h3>
                                                                <button 
                                                                    onClick={startCamera}
                                                                    className="w-full py-4 bg-white text-brand-900 rounded-2xl text-sm font-semibold shadow-xl hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-3"
                                                                >
                                                                    Direct Scan
                                                                </button>
                                                            </div>

                                                            <div className="relative w-full">
                                                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                                                                <div className="relative flex justify-center text-xs font-semibold text-white/20"><span className="px-4 bg-brand-950">OR</span></div>
                                                            </div>

                                                            <div className="w-full space-y-4">
                                                                <button 
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-sm font-semibold hover:bg-white/10 transition-all active:scale-95 px-6 truncate"
                                                                >
                                                                    {selectedFileName === "No image chosen" ? "Choose Image" : selectedFileName}
                                                                </button>
                                                                <input 
                                                                    type="file"
                                                                    ref={fileInputRef}
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleFileScan(file);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div id="reader" className="w-full h-full bg-brand-950 [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
                                                </div>

                                                {scanError && (
                                                    <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-in shake duration-500 shadow-sm">
                                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-500 shadow-sm">
                                                            <AlertCircle className="w-5 h-5" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-red-600">{scanError}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Results */}
                                            <div className="p-8 bg-gray-50/50 space-y-8">
                                                {scannedRedemption ? (
                                                    <div className="space-y-8 animate-in slide-in-from-right-10 duration-700">
                                                        <div className="space-y-6">
                                                            <div className="flex items-center gap-5">
                                                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl transition-all ${
                                                                    scannedRedemption.status === 'claimed' ? "bg-amber-500 shadow-amber-500/30" : "bg-brand-600 shadow-brand-600/30"
                                                                }`}>
                                                                    {scannedRedemption.status === 'claimed' ? <AlertCircle className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-400">Verification Status</p>
                                                                    <p className="text-2xl font-black text-gray-900 tracking-tight">
                                                                        {scannedRedemption.status === 'claimed' ? "Previously Claimed" : "Ready to Fulfill"}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="p-8 bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-gray-100 shadow-xl space-y-8">
                                                                <div className="space-y-4">
                                                                    <p className="text-sm font-semibold text-gray-400 ml-1">Resident Information</p>
                                                                    <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-50 hover:border-brand-100 transition-all">
                                                                        <div className="w-14 h-14 rounded-xl bg-brand-900 flex items-center justify-center text-white font-black text-xl shadow-lg">
                                                                            {scannedRedemption.residentName.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-base font-black text-gray-900 leading-tight">{scannedRedemption.residentName}</p>
                                                                            <p className="text-sm font-semibold text-gray-400 mt-0.5">ID: {scannedRedemption.residentId.slice(0, 12)}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <p className="text-sm font-semibold text-gray-400 ml-1">Reward Details</p>
                                                                    <div className={`p-6 rounded-[2rem] border relative overflow-hidden group transition-all ${
                                                                        scannedRedemption.status === 'claimed' ? "bg-gray-50 border-gray-200" : "bg-emerald-50 border-emerald-100"
                                                                    }`}>
                                                                        <div className="relative z-10">
                                                                            <p className={`text-lg font-black leading-tight ${scannedRedemption.status === 'claimed' ? "text-gray-900" : "text-emerald-900"}`}>
                                                                                {scannedRedemption.itemName}
                                                                            </p>
                                                                            <p className={`text-xs font-semibold mt-1 ${scannedRedemption.status === 'claimed' ? "text-gray-400" : "text-emerald-600"}`}>
                                                                                {scannedRedemption.itemCategory}
                                                                            </p>
                                                                            <div className={`mt-6 pt-6 border-t flex items-center justify-between ${scannedRedemption.status === 'claimed' ? "border-gray-200" : "border-emerald-200/50"}`}>
                                                                               <p className={`text-sm font-semibold ${scannedRedemption.status === 'claimed' ? "text-gray-500" : "text-emerald-800"}`}>Points Spent</p>
                                                                               <p className={`text-3xl font-black ${scannedRedemption.status === 'claimed' ? "text-gray-400" : "text-emerald-600"}`}>
                                                                                   {scannedRedemption.cost}
                                                                               </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ${
                                                                            scannedRedemption.status === 'claimed' ? "bg-gray-200/30" : "bg-emerald-200/30"
                                                                        }`} />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-4 pt-4">
                                                                <button 
                                                                    onClick={resetScanner}
                                                                    className="flex-1 py-4 bg-white border border-gray-100 text-gray-400 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                                                >
                                                                    {scannedRedemption.status === 'claimed' ? "Close" : "Cancel"}
                                                                </button>
                                                                <button 
                                                                    onClick={handleConfirmFulfillment}
                                                                    disabled={isVerifying || scannedRedemption.status === 'claimed'}
                                                                    className={`flex-[2] py-4 text-white rounded-2xl text-sm font-semibold shadow-xl transition-all flex items-center justify-center gap-3 ${
                                                                        scannedRedemption.status === 'claimed' 
                                                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none" 
                                                                            : "bg-emerald-600 shadow-emerald-900/20 hover:bg-emerald-700 active:scale-95"
                                                                    }`}
                                                                >
                                                                    {isVerifying ? (
                                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                                    ) : scannedRedemption.status === 'claimed' ? (
                                                                        <ShieldCheck className="w-5 h-5 opacity-50" />
                                                                    ) : (
                                                                        <ShieldCheck className="w-5 h-5" />
                                                                    )}
                                                                    {scannedRedemption.status === 'claimed' ? "Already Claimed" : "Confirm Claim"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-8">
                                                        <div className="w-32 h-32 rounded-[3rem] bg-white border border-gray-100 flex items-center justify-center text-gray-200 shadow-2xl shadow-brand-900/5 relative group transition-all duration-500 hover:scale-110">
                                                            <QrCode className="w-12 h-12 text-gray-100 group-hover:text-brand-100 transition-colors" />
                                                            <div className="absolute inset-0 rounded-[3rem] border border-brand-500/0 group-hover:border-brand-500/20 transition-all" />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <p className="text-xs font-bold text-brand-600 tracking-widest">Verification Mode</p>
                                                            <p className="text-sm font-semibold text-gray-400 max-w-[240px] leading-relaxed mx-auto">
                                                                Scan a resident's redemption QR code to view details and mark as claimed.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                        </div>
                    </div>
                </div>
            </div>
        </div>

            {/* Reward Management Modal */}
            <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <div className="absolute inset-0 bg-brand-950/60 backdrop-blur-md" onClick={() => !isSubmitting && setIsModalOpen(false)} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl transition-all duration-500 transform ${isModalOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                    <div className="bg-brand-900 p-8 text-white relative overflow-hidden flex items-center justify-between rounded-t-2xl">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold capitalize text-white">{editingItem ? "Edit Reward" : "Add Reward"}</h3>
                            <p className="text-brand-100/60 text-sm font-semibold mt-0.5 whitespace-nowrap">Reward details</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="relative z-10 p-2 hover:bg-white/10 rounded-2xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-brand-600/20 rounded-full blur-3xl" />
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2 tracking-tight">Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                        <Tag className="h-5 w-5" />
                                    </div>
                                    <input 
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g., Grocery Voucher"
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm"
                                    />
                                </div>
                            </div>
                            
                            <div className="col-span-2 space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2 tracking-tight">Description</label>
                                <div className="relative group">
                                    <div className="absolute top-4 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                        <AlignLeft className="h-5 w-5" />
                                    </div>
                                    <textarea 
                                        required
                                        rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Briefly describe the reward..."
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm resize-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2 tracking-tight">Category</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <select 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm appearance-none"
                                    >
                                        {["Voucher", "Utility", "Goods", "Charity"].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2 tracking-tight">Display Icon</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <select 
                                        value={formData.iconName}
                                        onChange={(e) => setFormData({...formData, iconName: e.target.value})}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm appearance-none"
                                    >
                                        {["Package", "ShoppingBag", "Gift", "Zap", "Utensils", "Wallet"].map(icon => (
                                            <option key={icon} value={icon}>{icon}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2 tracking-tight">Point Cost</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                        <Coins className="h-5 w-5" />
                                    </div>
                                    <input 
                                        required
                                        type="text"
                                        value={formData.cost === 0 ? "" : formData.cost}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setFormData({...formData, cost: val === "" ? 0 : parseInt(val)})
                                        }}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm"
                                        placeholder="Points"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2 tracking-tight">Stock</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                        <Box className="h-5 w-5" />
                                    </div>
                                    <input 
                                        required
                                        type="text"
                                        value={formData.stock === 0 ? "" : formData.stock}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setFormData({...formData, stock: val === "" ? 0 : parseInt(val)})
                                        }}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm"
                                        placeholder="Units"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-4 text-sm font-bold text-gray-400 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="flex-[2] py-4 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-brand-900/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Reward"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Deletion Confirmation */}
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Reward?"
                message="This will permanently remove the item from the catalog. Residents will no longer be able to see or redeem this reward."
                confirmText="Delete"
                type="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
