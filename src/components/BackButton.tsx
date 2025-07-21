import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  label = 'Voltar', 
  className = '' 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Simplesmente navegar para a página anterior
    // O gerenciamento de scroll é feito pelo ScrollContext
    navigate(-1);
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
      <span className="font-medium">{label}</span>
    </button>
  );
};