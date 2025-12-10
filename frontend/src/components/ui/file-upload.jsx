import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { cn } from "../../lib/utils";

const mainVariant = {
    initial: {
        x: 0,
        y: 0,
    },
    animate: {
        x: 20,
        y: -20,
        opacity: 0.9,
    },
};

const secondaryVariant = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
};

export const FileUpload = ({
    onChange
}) => {
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileChange = (newFiles) => {
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
        onChange && onChange(newFiles);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const { getRootProps, isDragActive } = useDropzone({
        multiple: false,
        noClick: true,
        onDrop: handleFileChange,
        onDropRejected: (error) => {
            console.log(error);
        },
    });

    return (
        (<div className="w-full" {...getRootProps()}>
            <motion.div
                onClick={handleClick}
                className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden">
                <div className="flex flex-col items-center justify-center">
                    <p
                        className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
                        Upload file
                    </p>
                    <p
                        className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
                        Drag or drop your PDF files here or click to upload
                    </p>
                    <div className="relative w-full mt-10 max-w-xl mx-auto">
                        {files.length > 0 &&
                            files.map((file, idx) => (
                                <motion.div
                                    key={"file" + idx}
                                    layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                                    className="relative z-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-start p-4 mt-4 w-full mx-auto rounded-xl shadow-sm gap-4"
                                >
                                    <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg flex-shrink-0 text-neutral-600 dark:text-neutral-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                    </div>

                                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            layout
                                            className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate w-full">
                                            {file.name}
                                        </motion.p>

                                        <div className="flex items-center gap-3 text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                                            <span>
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </span>
                                            <span className="text-neutral-300 dark:text-neutral-600">•</span>
                                            <span className="uppercase">
                                                {file.type ? file.type.split('/')[1] : 'FILE'}
                                            </span>
                                            <span className="text-neutral-300 dark:text-neutral-600">•</span>
                                            <span>
                                                {new Date(file.lastModified).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        {!files.length && (
                            <motion.div
                                animate={{
                                    scale: [1, 1.02, 1],
                                    opacity: [0.8, 1, 0.8]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className={cn(
                                    "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                                    "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                                )}>
                                {isDragActive ? (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-neutral-600 flex flex-col items-center">
                                        Drop it
                                        <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                                    </motion.p>
                                ) : (
                                    <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                                )}
                            </motion.div>
                        )}

                        {!files.length && (
                            <motion.div
                                variants={secondaryVariant}
                                className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"></motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
            <input
                ref={fileInputRef}
                id="file-upload-handle"
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
                className="hidden"
                style={{ display: 'none' }}
            />
        </div>)
    );
};

export function GridPattern() {
    const columns = 41;
    const rows = 11;
    return (
        (<div
            className="flex bg-gray-100 dark:bg-neutral-950 flex-shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
            {Array.from({ length: rows }).map((_, row) =>
                Array.from({ length: columns }).map((_, col) => {
                    const index = row * columns + col;
                    return (
                        (<div
                            key={`${col}-${row}`}
                            className={`w-10 h-10 flex flex-shrink-0 rounded-[2px] ${index % 2 === 0
                                ? "bg-gray-50 dark:bg-neutral-950"
                                : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
                                }`} />)
                    );
                }))}
        </div>)
    );
}
