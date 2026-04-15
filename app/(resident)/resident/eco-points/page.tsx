"use client";

import { useState, useEffect } from "react";
import { 
    Sparkles, 
    TrendingUp, 
    History, 
    ShoppingBag, 
    ArrowRight, 
    ChevronRight, 
    Star, 
    Clock, 
    CheckCircle2, 
    Info,
    Gift,
    Wallet,
    Award,
    Search,
    Zap,
    Utensils,
    X,
    QrCode,
    Filter
} from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";
import { db } from "@/lib/firebase/client";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { RewardItem as DbRewardItem, redeemReward } from "@/lib/db/rewards";
import { gabayToast } from "@/lib/toast";
import { Package, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface PointActivity {
    id: string;
    type: 'pickup' | 'redemption' | 'bonus' | 'referral';
    amount: number;
    date: string;
    description: string;
    status: string;
    rating?: number;
    criteria?: string[];
}

export default function EcoPointsPage() {
    const { uid, displayName, points } = useAppSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState<"overview" | "history" | "store" | "claimed">("overview");
    const [activities, setActivities] = useState<PointActivity[]>([]);
    const [rewards, setRewards] = useState<DbRewardItem[]>([]);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [rewardSearchTerm, setRewardSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [rewardsLoading, setRewardsLoading] = useState(true);
    const [redemptionsLoading, setRedemptionsLoading] = useState(true);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [selectedRedemptionForQR, setSelectedRedemptionForQR] = useState<any>(null);

    useEffect(() => {
        if (!uid) return;

        const q = query(
            collection(db, "point_activities"),
            where("residentId", "==", uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: PointActivity[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                list.push({
                    id: doc.id,
                    type: data.type,
                    amount: data.amount,
                    date: data.createdAt,
                    description: data.description,
                    status: data.status,
                    rating: data.rating,
                    criteria: data.criteria
                });
            });
            setActivities(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [uid]);

    // Fetch Redemptions History
    useEffect(() => {
        if (!uid) return;

        const q = query(
            collection(db, "redemption_requests"),
            where("residentId", "==", uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setRedemptions(list);
            setRedemptionsLoading(false);
        });

        return () => unsubscribe();
    }, [uid]);

    // Fetch Rewards
    useEffect(() => {
        const q = query(collection(db, "reward_items"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: DbRewardItem[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as DbRewardItem);
            });
            setRewards(list);
            setRewardsLoading(false);
        });

        return () => unsubscribe();
    }, []);

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

    const totalPoints = points || 0;
    const ecoRank = "Guardian";
    const nextRankPoints = 3000;

    const menuItems = [
        { id: "overview", label: "Home", sub: "My Status", icon: TrendingUp },
        { id: "history", label: "History", sub: "Point History", icon: History },
        { id: "store", label: "Rewards Store", sub: "Get Rewards", icon: ShoppingBag },
        { id: "claimed", label: "Claimed", sub: "Usage", icon: Award },
    ] as const;

    const handleRedeem = async (item: DbRewardItem) => {
        if (totalPoints < item.cost) {
            gabayToast.error("Insufficient Points", `You need ${item.cost - totalPoints} more points for this reward.`);
            return;
        }

        if (isRedeeming) return;

        setIsRedeeming(true);
        try {
            await redeemReward(item.id!);
            gabayToast.success("Done!", `You got ${item.name}. Check "Claimed" to see it.`);
        } catch (error: any) {
            gabayToast.error("Error", error.message || "Could not redeem.");
        } finally {
            setIsRedeeming(false);
        }
    };

    return (
        <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 pb-20 animate-in fade-in duration-700">
            {/* Header Hero */}
            <div className="absolute top-0 left-0 right-0 h-80 sm:h-64 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />

            <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6 mx-auto">
                {/* Header Cluster */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                Eco Points
                            </h1>
                            <p className="text-brand-100/60 text-sm font-medium">Earn rewards for keeping your community clean.</p>
                        </div>
                    </div>

                    {/* Points HUD (Glassmorphism) */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 w-full lg:max-w-md shadow-2xl">
                            <div className="w-11 h-11 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black shadow-lg">
                                <Star className="w-5 h-5 fill-current" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-brand-200/60 uppercase tracking-widest">My Points</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-white">{totalPoints.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-brand-400">PTS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
                    
                    {/* Left Side: Navigation */}
                    <div className="lg:col-span-4 space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`group relative flex items-center p-3 sm:p-4 rounded-2xl border transition-all text-left ${
                                        activeTab === item.id 
                                            ? "bg-white border-brand-600 shadow-xl shadow-brand-900/20 scale-[1.02] z-10" 
                                            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                    }`}
                                >
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mr-3 sm:mr-4 transition-all ${
                                        activeTab === item.id 
                                            ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" 
                                            : "bg-gray-100 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600"
                                    }`}>
                                        <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-sm font-black tracking-tight truncate ${activeTab === item.id ? "text-brand-900" : "text-gray-500"}`}>
                                            {item.label}
                                        </h4>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${activeTab === item.id ? "text-brand-600" : "text-gray-400"}`}>
                                            {item.sub}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-all ${activeTab === item.id ? "text-brand-500 opacity-100 translate-x-1" : "opacity-0"}`} />
                                </button>
                            ))}
                        </div>

                    </div>

                    {/* Right Side: Tab Content */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-brand-900/10 overflow-hidden flex flex-col min-h-[600px]">
                            
                            {/* Content Header */}
                            <div className="p-6 sm:p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <div className="min-w-0">
                                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-2 truncate">
                                        {menuItems.find(m => m.id === activeTab)?.label}
                                    </h2>
                                </div>
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-brand-600 shrink-0">
                                    {activeTab === "overview" && <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />}
                                    {activeTab === "history" && <History className="w-8 h-8" />}
                                    {activeTab === "store" && <ShoppingBag className="w-8 h-8" />}
                                    {activeTab === "claimed" && <Award className="w-8 h-8" />}
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="flex-1 p-4 sm:p-8">
                                
                                {activeTab === "overview" && (
                                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-6 rounded-2xl bg-brand-50 border border-brand-100 space-y-2">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-600 shadow-sm mb-2">
                                                    <Star className="w-5 h-5 fill-current" />
                                                </div>
                                                <h5 className="text-lg font-bold text-brand-900">Total Earned</h5>
                                                <p className="text-3xl font-black text-brand-600">{totalPoints.toLocaleString()} pts</p>
                                                <p className="text-[10px] font-bold text-brand-700/50 uppercase tracking-widest">Points earned</p>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 space-y-2">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm mb-2">
                                                    <Gift className="w-5 h-5" />
                                                </div>
                                                <h5 className="text-lg font-bold text-blue-900">Rewards Claimed</h5>
                                                <p className="text-3xl font-black text-blue-600">{redemptions.filter(r => r.status === 'claimed').length} Items</p>
                                                <p className="text-[10px] font-bold text-blue-700/50 uppercase tracking-widest">Total claims</p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
                                            <h5 className="text-xs font-bold text-gray-400 underline decoration-brand-500 uppercase tracking-widest">Recent Activity</h5>
                                            <div className="space-y-4">
                                                {activities.slice(0, 3).map((act) => (
                                                    <div key={act.id} className="flex items-center justify-between group gap-4">
                                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${act.amount > 0 ? 'bg-brand-100 text-brand-600' : 'bg-brand-100 text-brand-600'}`}>
                                                                {act.amount > 0 ? <TrendingUp className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors uppercase tracking-tight truncate">{act.description}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-tight">{new Date(act.date).toLocaleDateString()}</p>
                                                                    {act.rating && (
                                                                        <div className="flex gap-0.5">
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <Star key={i} className={`w-2.5 h-2.5 ${i < act.rating! ? 'fill-brand-500 text-brand-500' : 'text-gray-200'}`} />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className={`text-lg font-black ${act.amount > 0 ? 'text-brand-600' : 'text-brand-600'}`}>
                                                            {act.amount > 0 ? '+' : ''}{act.amount}
                                                        </span>
                                                    </div>
                                                ))}
                                                {activities.length === 0 && (
                                                    <p className="text-xs font-bold text-gray-300 text-center py-4">No recent points earned</p>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => setActiveTab("history")}
                                                className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-2 border-dashed border-gray-100 rounded-2xl hover:border-brand-200 hover:text-brand-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                View Complete History <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "history" && (
                                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center justify-between mb-4">
                                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">History</h5>
                                        </div>
                                        <div className="space-y-3">
                                            {activities.map((act) => (
                                                <div key={act.id} className="flex flex-col p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all gap-4">
                                                    <div className="flex gap-3 sm:gap-5">
                                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${act.amount > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                                                            {act.amount > 0 ? <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /> : <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />}
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-black text-gray-900 tracking-tight truncate">{act.description}</p>
                                                                </div>
                                                                <div className="shrink-0 text-right">
                                                                    <p className={`text-xl font-black leading-none ${act.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                        {act.amount > 0 ? '+' : ''}{act.amount}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> {new Date(act.date).toLocaleDateString()}
                                                                </span>
                                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> {act.status}
                                                                </span>
                                                                <div className="flex gap-0.5">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star key={i} className={`w-3 h-3 ${i < (act.rating || 0) ? 'fill-emerald-500 text-emerald-500' : 'text-gray-100'}`} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {act.criteria && act.criteria.length > 0 && (
                                                        <div className="mt-2 pt-4 border-t border-gray-50 flex flex-wrap gap-2">
                                                            {act.criteria.map((c, i) => (
                                                                <span key={i} className="px-2 py-1 bg-emerald-50 text-[8px] font-black text-emerald-600 uppercase tracking-widest rounded-lg border border-emerald-100/50">
                                                                    {c}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {activities.length === 0 && !loading && (
                                                <div className="py-20 text-center">
                                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">No activities found</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "store" && (
                                    <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
                                        {/* Toolbar */}
                                        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/10">
                                            <div className="relative flex-1 max-w-md">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Find rewards..." 
                                                    value={rewardSearchTerm}
                                                    onChange={(e) => setRewardSearchTerm(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-brand-600 transition-all active:scale-95">
                                                    <Filter className="w-5 h-5" />
                                                </button>
                                                <div className="px-5 py-2.5 bg-brand-50 rounded-2xl text-brand-600 text-sm font-semibold border border-brand-100/50 shadow-sm">
                                                    {rewards.length} items available
                                                </div>
                                            </div>
                                        </div>

                                        {/* Table Content (Desktop) */}
                                        <div className="flex-1 overflow-x-auto hidden md:block">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-gray-50 text-brand-900/40">
                                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest">Items</th>
                                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest">Category</th>
                                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest">Stock</th>
                                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest">Cost</th>
                                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {rewards
                                                        .filter(item => item.name.toLowerCase().includes(rewardSearchTerm.toLowerCase()))
                                                        .map((item) => {
                                                        const ItemIcon = getIcon(item.iconName || "Package");
                                                        return (
                                                            <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100/50 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform duration-500">
                                                                            <ItemIcon className="w-6 h-6" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-base font-black text-gray-900 leading-tight">{item.name}</p>
                                                                            <p className="text-xs font-semibold text-gray-400 mt-1 max-w-[250px] truncate">{item.description}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6 font-bold text-gray-500">
                                                                    <span className="px-3 py-1 bg-gray-100/50 text-gray-500 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-gray-200/50">
                                                                        {item.category}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div>
                                                                        <p className="text-sm font-black text-gray-900">{item.stock} Units</p>
                                                                        <p className={`text-[10px] font-bold uppercase tracking-tight mt-0.5 ${item.stock < 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                                            {item.stock < 10 ? 'Limited stock' : 'Available'}
                                                                        </p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-baseline gap-1">
                                                                        <p className="text-2xl font-black text-brand-600">{item.cost.toLocaleString()}</p>
                                                                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">PTS</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6 text-right">
                                                                    <button 
                                                                        onClick={() => handleRedeem(item)}
                                                                        disabled={item.stock === 0}
                                                                        className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] active:scale-95 transition-all shadow-lg ${
                                                                            item.stock === 0 
                                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none' 
                                                                            : 'bg-brand-900 text-white hover:bg-black hover:shadow-brand-900/20'
                                                                        }`}
                                                                    >
                                                                        {item.stock === 0 ? "Out of Stock" : "Redeem Now"}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Card Content (Mobile) */}
                                        <div className="flex-1 p-4 md:hidden space-y-4">
                                            {rewards
                                                .filter(item => item.name.toLowerCase().includes(rewardSearchTerm.toLowerCase()))
                                                .map((item) => {
                                                    const ItemIcon = getIcon(item.iconName || "Package");
                                                    return (
                                                        <div key={item.id} className="bg-white rounded-3xl border border-gray-100 p-5 space-y-5 shadow-sm active:shadow-md transition-all">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-inner">
                                                                        <ItemIcon className="w-7 h-7" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.category}</p>
                                                                        <h4 className="text-lg font-black text-gray-900 tracking-tight leading-tight mt-1">{item.name}</h4>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <p className="text-2xl font-black text-brand-600 italic leading-none">{item.cost.toLocaleString()}</p>
                                                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mt-1">Points</p>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center justify-between py-3 border-y border-gray-50 border-dashed">
                                                                <span className="text-xs font-bold text-gray-500 lowercase">Warehouse availability</span>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-black text-gray-900 leading-none">{item.stock} Units</p>
                                                                    <p className={`text-[10px] font-bold uppercase tracking-tight mt-1 ${item.stock < 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                                        {item.stock < 10 ? 'Limited' : 'Ready for pickup'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <button 
                                                                onClick={() => handleRedeem(item)}
                                                                disabled={item.stock === 0}
                                                                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl ${
                                                                    item.stock === 0 
                                                                    ? 'bg-gray-100 text-gray-400 border border-gray-200 shadow-none' 
                                                                    : 'bg-brand-900 text-white hover:bg-black shadow-brand-900/20'
                                                                }`}
                                                            >
                                                                {item.stock === 0 ? "Currently Empty" : "Redeem Item"}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                        </div>

                                        {rewards.length === 0 && !rewardsLoading && (
                                            <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-40">
                                                <ShoppingBag className="w-12 h-12" />
                                                <p className="text-xs font-black uppercase tracking-widest">Setting up store...</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "claimed" && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                        {/* Claim Guide */}
                                        <div className="p-5 sm:p-6 bg-brand-900 rounded-[2rem] text-white relative overflow-hidden shadow-2xl shadow-brand-900/20">
                                            <div className="relative z-10 flex items-center gap-4 sm:gap-6">
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                                                    <QrCode className="w-6 h-6 sm:w-7 sm:h-7 text-brand-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base sm:text-lg font-black tracking-tight">How to claim?</h4>
                                                    <p className="text-xs sm:text-sm font-medium text-brand-100/60 leading-relaxed max-w-sm">
                                                        Visit the GABAY Desk at your local LGU and present the <span className="text-white font-bold">QR code</span> for each redeemed item.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="absolute -right-8 -bottom-8 w-24 h-24 sm:w-32 sm:h-32 bg-brand-400/20 rounded-full blur-3xl" />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Past Claims</h5>
                                        </div>

                                        <div className="space-y-3">
                                            {redemptions.map((claim) => (
                                                <div key={claim.id} className="flex flex-col p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group gap-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3 sm:gap-5 min-w-0">
                                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all shrink-0">
                                                                <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-gray-900 tracking-tight truncate">{claim.itemName}</p>
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" /> {new Date(claim.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${claim.status === 'claimed' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                                        <CheckCircle2 className="w-3 h-3" /> {claim.status}
                                                                    </span>
                                                                    <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest border border-brand-100 bg-brand-50/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                                        <Star className="w-2.5 h-2.5 fill-current" /> -{claim.cost} pts
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {claim.status !== 'claimed' && (
                                                            <button 
                                                                onClick={() => setSelectedRedemptionForQR(claim)}
                                                                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-50 hover:bg-brand-600 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-transparent shrink-0 shadow-sm"
                                                            >
                                                                Get QR
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {redemptions.length === 0 && !redemptionsLoading && (
                                                <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6">
                                                    <div className="w-32 h-32 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 border border-gray-100 shadow-inner">
                                                        <Gift className="w-16 h-16" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h5 className="text-xl font-black text-gray-900 tracking-tight italic">Waiting for your first claim</h5>
                                                        <p className="text-sm font-semibold text-gray-400 max-w-xs leading-relaxed capitalize">
                                                            Your redemption history is currently empty. Visit the store to start using your hard-earned points!
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setActiveTab("store")}
                                                        className="px-10 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all"
                                                    >
                                                        Go to Store
                                                    </button>
                                                </div>
                                            )}

                                            {redemptionsLoading && (
                                                <div className="py-20 flex flex-col items-center justify-center text-brand-600 space-y-4">
                                                    <Loader2 className="w-10 h-10 animate-spin" />
                                                    <p className="text-xs font-black uppercase tracking-widest">Loading history...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Modal */}
            {selectedRedemptionForQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-brand-950/60 backdrop-blur-md" onClick={() => setSelectedRedemptionForQR(null)} />
                    <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-brand-900 p-8 text-white relative overflow-hidden">
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">QR Code</h3>
                                    <p className="text-xs font-medium text-brand-200/60 mt-1 uppercase tracking-widest">Get Reward</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedRedemptionForQR(null)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-brand-600/20 rounded-full blur-3xl" />
                        </div>

                        <div className="p-8 flex flex-col items-center gap-8">
                            <div className="bg-white p-6 rounded-[2rem] border-8 border-gray-50 shadow-inner">
                                <QRCodeSVG 
                                    value={`gabay:redeem:${selectedRedemptionForQR.id}`} 
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            <div className="text-center space-y-4">
                                <div>
                                    <p className="text-base font-black text-gray-900 tracking-tight">{selectedRedemptionForQR.itemName}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 italic leading-tight">ID: {selectedRedemptionForQR.id.toUpperCase()}</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-700 leading-relaxed uppercase tracking-wide">
                                        Show this to the staff to get your reward.
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedRedemptionForQR(null)}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-900/10 active:scale-95 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
