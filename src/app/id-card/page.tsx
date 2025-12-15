"use client";
import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

interface Program {
    programName: string;
    programCode: string;
}

interface Candidate {
    photo: string | null;
    name: string;
    chestNo: string;
    studyCentre: string;
    programs: Program[];
    section: string;
    date: string;
}

const IdCardPage = () => {
    const [studyCentres, setStudyCentres] = useState<string[]>([]);
    const [selectedCentre, setSelectedCentre] = useState<string>("");
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Fetch study centres and candidates on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [centresRes, candidatesRes] = await Promise.all([
                    fetch("/study_centres.json"),
                    fetch("/candidates.json"),
                ]);

                if (!centresRes.ok || !candidatesRes.ok) {
                    throw new Error("Failed to fetch data");
                }

                const centresData: string[] = await centresRes.json();
                const candidatesData: Candidate[] = await candidatesRes.json();

                setStudyCentres(centresData);
                setCandidates(candidatesData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter candidates when selected centre changes
    useEffect(() => {
        if (selectedCentre) {
            const filtered = candidates.filter(
                (c) => c.studyCentre === selectedCentre
            );
            setFilteredCandidates(filtered);
            cardRefs.current = filtered.map(() => null);
        } else {
            setFilteredCandidates([]);
            cardRefs.current = [];
        }
    }, [selectedCentre, candidates]);

    const handleCentreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCentre(event.target.value);
    };

    // Download all ID cards as PDF
    const downloadAllAsPDF = async () => {
        if (filteredCandidates.length === 0) return;

        setDownloading(true);

        try {
            // A5 dimensions in mm: 148 x 210
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a5"
            });

            const a5Width = 148;
            const a5Height = 210;

            for (let i = 0; i < cardRefs.current.length; i++) {
                const cardElement = cardRefs.current[i];
                if (!cardElement) continue;

                // Convert card to image
                const dataUrl = await toPng(cardElement, { pixelRatio: 3 });

                // Add new page for all cards except the first
                if (i > 0) {
                    pdf.addPage();
                }

                // Add image to PDF (full A5 page)
                pdf.addImage(dataUrl, "PNG", 0, 0, a5Width, a5Height);
            }

            // Save the PDF
            pdf.save(`${selectedCentre}_ID_Cards.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#fe8d00]/10 to-[#ff4c01]/10 flex items-center justify-center">
                <div className="text-[#ff4c01] text-2xl font-semibold animate-pulse">
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fe8d00]/10 to-[#ff4c01]/10 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#fe8d00] to-[#ff4c01] bg-clip-text text-transparent mb-2">
                        SHEFEST MAHDHIYYA
                    </h1>
                    <p className="text-[#ff4c01]/80 text-lg">Candidate ID Cards</p>
                </div>

                {/* Study Centre Selection */}
                <div className="bg-gradient-to-r from-[#fe8d00] to-[#ff4c01] rounded-3xl p-6 mb-8 max-w-md mx-auto">
                    <label
                        htmlFor="studyCentre"
                        className="block text-white font-semibold mb-3 text-center"
                    >
                        Select Study Centre
                    </label>
                    <select
                        id="studyCentre"
                        value={selectedCentre}
                        onChange={handleCentreChange}
                        className="w-full px-4 py-3 rounded-full bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer border-2 border-white"
                    >
                        <option value="">-- Select a Study Centre --</option>
                        {studyCentres.map((centre) => (
                            <option key={centre} value={centre}>
                                {centre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Candidates Count & Download Button */}
                {selectedCentre && filteredCandidates.length > 0 && (
                    <div className="flex items-center justify-between mb-6 bg-white rounded-2xl px-6 py-4 shadow-md">
                        <p className="text-[#ff4c01]/90 text-lg">
                            <span className="font-bold text-2xl text-[#ff4c01]">
                                {filteredCandidates.length}
                            </span>{" "}
                            candidates found in{" "}
                            <span className="font-semibold">{selectedCentre}</span>
                        </p>
                        <button
                            onClick={downloadAllAsPDF}
                            disabled={downloading}
                            className="bg-gradient-to-r from-[#fe8d00] to-[#ff4c01] text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {downloading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download PDF
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* ID Cards Grid - A5 ratio cards */}
                {selectedCentre && filteredCandidates.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCandidates.map((candidate, index) => (
                            <IdCard
                                key={candidate.chestNo}
                                candidate={candidate}
                                ref={(el) => { cardRefs.current[index] = el; }}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {selectedCentre && filteredCandidates.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-[#ff4c01]/80 text-xl">
                            No candidates found for this study centre.
                        </p>
                    </div>
                )}

                {/* Initial State */}
                {!selectedCentre && (
                    <div className="text-center py-16">
                        <p className="text-[#ff4c01]/60 text-xl">
                            Please select a study centre to view ID cards.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-12 text-center">
                <a
                    href="https://www.festie.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-all duration-300 group"
                >
                    <span className="text-[#ff4c01] text-xs opacity-80 group-hover:opacity-100">
                        Built with
                    </span>
                    <img src="/festie-logo.png" alt="Festie" className="h-5 w-auto" />
                    <span className="text-[#ff4c01] text-xs opacity-80 group-hover:opacity-100">
                        • Make your fest alive
                    </span>
                </a>
            </div>
        </div>
    );
};

// ID Card Component - A5 aspect ratio (1:1.414)
const IdCard = React.forwardRef<HTMLDivElement, { candidate: Candidate }>(
    ({ candidate }, ref) => {
        return (
            <div
                ref={ref}
                className="bg-white overflow-hidden shadow-xl"
                style={{ aspectRatio: "1 / 1.414" }}
            >
                {/* Card Header with gradient */}
                <div className="bg-gradient-to-r from-[#fe8d00] to-[#ff4c01] px-4 py-2">
                    <h2 className="text-white font-bold text-center text-md uppercase tracking-wider">
                        SHEFEST MAHDIYYAH
                    </h2>
                    <p className="text-white/80 text-xs font-medium text-center uppercase tracking-wider mt-1">
                        {candidate.section}
                    </p>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col">
                    {/* Photo Placeholder - Passport size: 3.5cm x 4.5cm */}
                    <div
                        className="mx-auto mb-4 bg-gradient-to-br from-[#fe8d00]/20 to-[#ff4c01]/20 flex items-center justify-center overflow-hidden border-2 border-[#fe8d00]/30"
                        style={{ width: '3.5cm', height: '4.5cm' }}
                    >
                        {candidate.photo ? (
                            <img
                                src={candidate.photo}
                                alt={candidate.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <svg
                                className="w-14 h-14 text-[#fe8d00]/50"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        )}
                    </div>

                    {/* Chest Number */}
                    <div className="bg-gradient-to-r from-[#fe8d00] to-[#ff4c01] text-white text-center py-1 px-3 rounded-full mx-auto w-fit mb-2">
                        <p className="text-xs font-bold tracking-wide">{candidate.chestNo}</p>
                    </div>

                    {/* Name */}
                    <h3 className="text-gray-800 font-bold font-garamond italic text-lg text-center text-md mb-2 capitalize leading-tight">
                        {candidate.name.toLowerCase()}
                    </h3>

                    {/* Study Centre */}
                    <p className="bg-[#fe8d00]/10 text-[#ff4c01] text-xs text-center py-1 px-4 rounded-full mx-auto uppercase tracking-wide font-jakarta font-medium w-fit">
                        {candidate.studyCentre}
                    </p>

                    {/* Divider */}
                    <div className="border-t-2 border-[#fe8d00]/20 my-2"></div>

                    {/* Programs - Full list (max 7 programs, no scrolling) */}
                    <div>
                        <p className="text-xs font-semibold text-[#ff4c01] uppercase tracking-wider mb-3 text-center">
                            Programs
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {[...candidate.programs].sort((a, b) => a.programName.length - b.programName.length).map((program) => (
                                <div
                                    key={program.programCode}
                                    className="w-fit bg-gradient-to-r from-[#fe8d00]/5 to-[#ff4c01]/10 text-gray-700 text-xs px-2 py-1 rounded-lg font-jakarta"
                                >
                                    <span className="font-bold text-[#ff4c01]">{program.programCode}</span>
                                    <span className="text-gray-400"> - </span>
                                    <span className="capitalize">{program.programName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

IdCard.displayName = "IdCard";

export default IdCardPage;

