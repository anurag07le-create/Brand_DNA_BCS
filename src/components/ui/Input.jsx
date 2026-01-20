import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const Input = ({ label, type = "text", placeholder, value, onChange, icon: Icon, className = "", labelClassName = "", inputClassName = "" }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className={`text-sm font-semibold text-gray-700 ${labelClassName}`}>
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${inputClassName.includes('text-white') ? 'text-gray-400' : 'text-gray-400'}`}>
                        <Icon size={18} />
                    </div>
                )}
                <input
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full ${Icon ? 'pl-11' : 'pl-4'} ${isPassword ? 'pr-12' : 'pr-4'} py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pucho-purple/20 focus:border-pucho-purple transition-all duration-200 text-gray-900 placeholder:text-gray-400 bg-gray-50/50 ${inputClassName}`}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Input;
