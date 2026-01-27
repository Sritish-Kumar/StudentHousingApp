"use client";

import { useState } from "react";
import PropertyCard from "./PropertyCard";

export default function LandlordPropertyCard({ property, onDelete, onEdit }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDeleteClick = (e) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();
        setShowConfirm(true);
    };

    const confirmDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            setIsDeleting(true);
            await onDelete(property.id);
        } catch (error) {
            console.error("Delete failed", error);
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    const cancelDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirm(false);
    };

    return (
        <div className="relative group">
            {/* Wrapper to overlay actions */}
            <PropertyCard property={property} />

            {/* Action Overlay - Actions always visible for better UX */}
            <div className={`absolute top-2 right-2 flex flex-col gap-2 transition-opacity duration-300 ${showConfirm ? "z-20" : "z-10"}`}>

                {/* Status Badge Overrides */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold text-center shadow-md ${property.verified ? "bg-green-500 text-white" : "bg-yellow-400 text-yellow-900"}`}>
                    {property.verified ? "Approved" : "Pending"}
                </div>

                {/* Edit Button */}
                {!showConfirm && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEdit(property.id);
                        }}
                        className="bg-white px-3 py-2 rounded-lg shadow-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
                        title="Edit Property"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">Edit</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                )}


                {/* Delete Button */}
                {!showConfirm && (
                    <button
                        onClick={handleDeleteClick}
                        className="bg-white px-3 py-2 rounded-lg shadow-lg text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        title="Delete Property"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">Delete</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Delete Confirmation Modal Overlay */}
            {showConfirm && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-2xl p-4 text-center animate-in fade-in zoom-in duration-200">
                    <h4 className="text-zinc-900 font-bold mb-2">Delete Property?</h4>
                    <p className="text-xs text-zinc-500 mb-4">This action cannot be undone.</p>
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={cancelDelete}
                            disabled={isDeleting}
                            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 flex items-center justify-center"
                        >
                            {isDeleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Delete"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
