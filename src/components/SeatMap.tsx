"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, Move } from "lucide-react";

interface SeatMapProps {
  occupiedSeats: string[];
  selectedSeats: string[];
  maxSelectable: number;
  onSeatToggle: (seatId: string) => void;
}

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
const COLS = Array.from({ length: 13 }, (_, i) => i + 1);

// Aisle & empty space configuration based on screenshot analysis
const isAisle = (row: string, col: number): boolean => {
  if (row === "A" && (col < 7 || col === 9)) return true;
  if (row === "B" && (col >= 6 && col <= 8)) return true;
  if (row === "D" && (col === 8 || col === 11)) return true;
  if (row === "E" && (col === 3 || (col >= 6 && col <= 10))) return true;
  if (row === "F" && (col >= 7 && col <= 9)) return true;
  if (row === "G" && ((col >= 1 && col <= 5) || (col >= 7 && col <= 9) || col === 12 || col === 13)) return true;
  if (row === "H" && (col === 1 || col === 2 || col === 5 || (col >= 7 && col <= 9))) return true;
  if (row === "I" && (col === 7 || col === 8 || col === 12 || col === 13)) return true;
  if (row === "J" && ((col >= 5 && col <= 8) || col === 11)) return true;
  if (row === "K" && col === 13) return true;
  if (row === "L" && col === 1) return true;
  if (row === "N" && (col >= 7 && col <= 9)) return true;
  return false;
};

const isHandicapped = (row: string, col: number): boolean => {
  return row === "A" && (col === 7 || col === 8);
};

const isLightZone = (row: string, col: number): boolean => {
  return row === "B" && ((col >= 1 && col <= 4) || col === 12 || col === 13);
};

export const SeatMap: React.FC<SeatMapProps> = ({
  occupiedSeats,
  selectedSeats,
  maxSelectable,
  onSeatToggle,
}) => {
  const [zoom, setZoom] = useState<number>(1);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.7));

  return (
    <div className="flex flex-col bg-[#171717] rounded-2xl p-4 text-white select-none relative overflow-hidden border border-neutral-800">
      
      {/* Zoom Controllers & Miniature Overlay indicator */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center space-x-2 text-[10px] text-neutral-400 bg-neutral-900/60 px-2.5 py-1 rounded-full border border-neutral-800">
          <Move className="w-3.5 h-3.5 text-neutral-500 animate-pulse" />
          <span>좌우로 스와이프하여 스크롤</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800">
          <button 
            onClick={handleZoomOut} 
            className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"
            title="축소"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono px-1 min-w-[32px] text-center text-neutral-300">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={handleZoomIn} 
            className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"
            title="확대"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen Graphic Component */}
      <div className="flex flex-col items-center mb-10 w-full relative">
        <div className="w-[80%] h-3 bg-gradient-to-b from-rose-500/20 to-transparent rounded-full filter blur-[2px] absolute -top-1"></div>
        {/* Curved Screen boundary */}
        <div className="w-[75%] h-5 border-t-[3px] border-rose-500/50 rounded-[100%] flex items-center justify-center relative">
          <span className="text-[10px] tracking-[0.4em] font-extrabold text-rose-500/80 uppercase select-none absolute -bottom-6">
            SCREEN
          </span>
        </div>
      </div>

      {/* Outer scroll container for panning */}
      <div className="w-full overflow-x-auto overflow-y-auto pb-4 cursor-grab active:cursor-grabbing scrollbar-thin scrollbar-thumb-neutral-800">
        <div 
          className="min-w-[440px] flex flex-col items-center origin-top transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Seat Grid Box */}
          <div className="grid gap-y-1.5 select-none my-2">
            {ROWS.map((row) => (
              <div key={row} className="flex items-center space-x-1.5">
                {/* Row Header */}
                <div className="w-5 text-center text-xs font-bold text-neutral-500 select-none">
                  {row}
                </div>

                {/* Seats List */}
                <div className="flex space-x-1">
                  {COLS.map((col) => {
                    const seatId = `${row}${col}`;
                    const isSeatAisle = isAisle(row, col);
                    const isSeatOccupied = occupiedSeats.includes(seatId);
                    const isSeatSelected = selectedSeats.includes(seatId);
                    const isHandi = isHandicapped(row, col);
                    const isLight = isLightZone(row, col);

                    if (isSeatAisle) {
                      // Aisle Spacer Block
                      return (
                        <div 
                          key={col} 
                          className="w-6 h-6 flex items-center justify-center select-none"
                          style={{
                            backgroundImage: "repeating-linear-gradient(45deg, #262626, #262626 1px, transparent 1px, transparent 4px)"
                          }}
                        />
                      );
                    }

                    // Determine Seat Styling
                    let seatClass = "w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center transition-all duration-150 relative cursor-pointer ";
                    
                    if (isSeatOccupied) {
                      seatClass += "bg-neutral-800 text-neutral-600 border border-neutral-800 pointer-events-none cursor-not-allowed ";
                    } else if (isSeatSelected) {
                      seatClass += "bg-[#FF2E2E] text-white border border-[#FF2E2E] shadow-[0_0_10px_rgba(255,46,46,0.4)] scale-105 z-10 ";
                    } else if (isHandi) {
                      seatClass += "bg-sky-500 text-white border border-sky-600 hover:bg-sky-400 ";
                    } else if (isLight) {
                      // Yellow diagonal border style for Light Zone
                      seatClass += "bg-white text-gray-900 border-[1.5px] border-amber-500 border-dashed hover:bg-amber-50 ";
                    } else {
                      // Standard Seat
                      seatClass += "bg-white text-gray-900 border border-gray-300 hover:bg-gray-100 ";
                    }

                    return (
                      <div
                        key={col}
                        onClick={() => !isSeatOccupied && onSeatToggle(seatId)}
                        className={seatClass}
                        title={`좌석 ${seatId}${isHandi ? " (장애인석)" : ""}${isLight ? " (Light존)" : ""}`}
                      >
                        {/* Occupied sign */}
                        {isSeatOccupied ? (
                          <span className="text-[7px]">✕</span>
                        ) : (
                          col
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Row Footer */}
                <div className="w-5 text-center text-[10px] font-bold text-neutral-500 select-none">
                  {row}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seat Type Legends */}
      <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-center space-x-6 text-[10px] text-neutral-400 z-10">
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
          <span>일반석</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-white border-[1.5px] border-amber-500 border-dashed rounded"></div>
          <span>Light존</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-sky-500 rounded"></div>
          <span>장애인석</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-neutral-800 border border-neutral-800 flex items-center justify-center text-[6px] text-neutral-600 rounded">✕</div>
          <span>예약완료</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-[#FF2E2E] rounded shadow-[0_0_5px_rgba(255,46,46,0.4)]"></div>
          <span>선택좌석</span>
        </div>
      </div>
    </div>
  );
};
