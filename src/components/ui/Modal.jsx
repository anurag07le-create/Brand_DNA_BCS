import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, children, title }) => {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop with blur - "little blurry" */}
            <div
                className="absolute inset-0 bg-black/10 backdrop-blur-[2px] transition-all duration-300"
                onClick={onClose}
            ></div>

            {/* Mini Window Content */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-[480px] max-w-full m-4 p-8 transform transition-all duration-300 scale-100 flex flex-col gap-6 font-['Inter']">
                {/* Header */}
                <div className="flex items-center justify-between">
                    {title && <h3 className="text-xl font-semibold text-gray-900">{title}</h3>}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="text-gray-600">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
