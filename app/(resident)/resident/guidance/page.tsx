"use client";

import { useState } from "react";
import Image from "next/image";
import { 
    BookOpen, 
    ChevronRight, 
    Info, 
    Lightbulb, 
    ArrowRight,
    Star,
    CheckCircle2,
    Leaf,
    RotateCw,
    Sparkles
} from "lucide-react";
import { WASTE_CATEGORIES, ENVIRONMENTAL_TIPS } from "@/lib/data/wasteEducation";

export default function WasteGuidancePage() {
    const [selectedCategory, setSelectedCategory] = useState<string>(WASTE_CATEGORIES[0].id);
    const [searchInput, setSearchInput] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(searchInput);
    };

    const activeCat = WASTE_CATEGORIES.find(c => c.id === selectedCategory)!;

    // Enhanced filtering across titles, sub-labels, and examples
    const displayedCategories = WASTE_CATEGORIES.filter(cat => {
        if (!appliedSearch) return true;
        const query = appliedSearch.toLowerCase();
        return (
            cat.title.toLowerCase().includes(query) ||
            cat.sub.toLowerCase().includes(query) ||
            cat.examples.some(ex => ex.toLowerCase().includes(query))
        );
    });

    return (
        <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 pb-20 animate-in fade-in duration-700">
            {/* Header Hero - Aligned with Pickup Page */}
            <div className="absolute top-0 left-0 right-0 h-80 sm:h-64 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />
            
            <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6 mx-auto">
                {/* Header Cluster */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                Waste Guidance
                            </h1>
                            <p className="text-brand-100/60 text-sm font-medium">Master the art of sustainable waste management.</p>
                        </div>
                    </div>

                    {/* Search & Stats Bar - Standardized Style */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <form onSubmit={handleSearch} className="relative group w-full lg:max-w-md">
                            <input
                                type="text"
                                placeholder="Search materials (e.g. 'plastic', 'batteries')..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-xl py-3.5 pl-5 pr-24 text-sm font-semibold focus:border-white/20 focus:ring-4 focus:ring-white/5 outline-none text-white transition-all shadow-sm placeholder:text-white/40"
                            />
                            <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                                <button type="submit" className="h-full px-5 bg-white text-brand-900 rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg">
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Main Content Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
                    
                    {/* Left Side: Category Navigation */}
                    <div className="lg:col-span-4 space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                            {displayedCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`group relative flex items-center p-4 rounded-2xl border transition-all text-left ${
                                        selectedCategory === cat.id 
                                            ? "bg-white border-brand-600 shadow-xl shadow-brand-900/20 scale-[1.02] z-10" 
                                            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all ${
                                        selectedCategory === cat.id 
                                            ? "bg-brand-600 text-white shadow-lg" 
                                            : "bg-gray-100 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600"
                                    }`}>
                                        <cat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-black tracking-tight ${selectedCategory === cat.id ? "text-brand-900" : "text-gray-500"}`}>
                                            {cat.title}
                                        </h4>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${selectedCategory === cat.id ? "text-brand-600" : "text-gray-400"}`}>
                                            {cat.sub}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-all ${selectedCategory === cat.id ? "text-brand-500 opacity-100 translate-x-1" : "opacity-0"}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Detailed Content Card */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-brand-900/10 overflow-hidden min-h-[500px] flex flex-col">
                            {/* Card Header */}
                            <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row items-start justify-between gap-6">
                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    {activeCat.imageUrl && (
                                        <div className="w-32 h-32 rounded-2xl bg-brand-50/50 p-2 border border-brand-100 flex-shrink-0 animate-in zoom-in duration-500">
                                            <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner bg-white">
                                                <Image 
                                                    src={activeCat.imageUrl} 
                                                    alt={activeCat.title}
                                                    fill
                                                    className="object-contain p-2"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[10px] font-black uppercase tracking-wider border border-brand-100">
                                                Guide
                                            </span>
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{activeCat.title}</h2>
                                        <p className="text-sm font-bold text-gray-400 max-w-md">{activeCat.description}</p>
                                    </div>
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-600 border border-gray-100 flex-shrink-0">
                                    <activeCat.icon className="w-8 h-8" />
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h5 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <Star className="w-3.5 h-3.5 text-amber-400" />
                                        Common Items
                                    </h5>
                                    <div className="grid gap-2">
                                        {activeCat.examples.map((ex, i) => (
                                            <div key={i} className="flex items-center p-3.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 border border-transparent hover:border-brand-100 hover:bg-white transition-all">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mr-3" />
                                                {ex}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h5 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <Lightbulb className="w-3.5 h-3.5 text-brand-500" />
                                        Disposal Protocol
                                    </h5>
                                    <div className="p-6 bg-brand-900 text-brand-50 rounded-2xl shadow-lg relative overflow-hidden group/box">
                                        <CheckCircle2 className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12 transition-transform group-hover/box:scale-110" />
                                        <p className="text-sm font-bold leading-relaxed italic relative z-10">
                                            "{activeCat.instructions}"
                                        </p>
                                    </div>
                                    <div className="p-5 border-2 border-dashed border-gray-100 rounded-2xl flex items-center gap-4 bg-gray-50/50">
                                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-brand-500">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            Pro-Tip: Clean and dry before disposal
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Minimal icon for the list header
function ListIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
    );
}
