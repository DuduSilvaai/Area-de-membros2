"use client";

import { FileText, Archive, Download, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface Material {
    id: string;
    title: string;
    url: string;
    type: 'pdf' | 'zip' | 'link' | 'other';
    size?: string;
}

interface ComplementaryMaterialsTabProps {
    files?: Material[]; // Assuming we will pass files here
}

export function ComplementaryMaterialsTab({ files = [] }: ComplementaryMaterialsTabProps) {

    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                    <Download className="w-6 h-6 opacity-50" />
                </div>
                <h3 className="font-medium text-zinc-400 mb-1">Sem materiais</h3>
                <p className="text-sm">Nenhum arquivo disponível para esta aula.</p>
            </div>
        )
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
            case 'zip': return <Archive className="w-5 h-5 text-yellow-400" />;
            case 'link': return <ExternalLink className="w-5 h-5 text-blue-400" />;
            default: return <FileText className="w-5 h-5 text-zinc-400" />;
        }
    }

    return (
        <div className="space-y-3">
            {files.map((file, idx) => (
                <motion.a
                    key={file.id || idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.03)" }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-pink-500/30 transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                        {getIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate group-hover:text-pink-400 transition-colors">
                            {file.title}
                        </h4>
                        <p className="text-xs text-zinc-500">
                            {file.type.toUpperCase()} {file.size && `• ${file.size}`}
                        </p>
                    </div>
                    <Download className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                </motion.a>
            ))}
        </div>
    );
}
