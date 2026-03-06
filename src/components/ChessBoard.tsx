'use client';

import React, { useMemo } from 'react';

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const PIECE_MAP: Record<string, string> = {
  K: '\u2654', Q: '\u2655', R: '\u2656', B: '\u2657', N: '\u2658', P: '\u2659',
  k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F',
};

function parseFEN(fen: string): (string | null)[][] {
  const rows = fen.split(' ')[0].split('/');
  return rows.map((row) => {
    const squares: (string | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch); i++) squares.push(null);
      } else {
        squares.push(ch);
      }
    }
    return squares;
  });
}

interface Props {
  fen?: string;
  size?: number;
  flipped?: boolean;
}

export default React.memo(function ChessBoard({ fen = DEFAULT_FEN, size = 320, flipped = false }: Props) {
  const board = useMemo(() => {
    const parsed = parseFEN(fen);
    return flipped ? parsed.map((row) => [...row].reverse()).reverse() : parsed;
  }, [fen, flipped]);

  const squareSize = size / 8;
  const files = flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = flipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div style={{ width: size, height: size }} className="rounded-lg overflow-hidden mx-auto shadow-lg">
      {board.map((row, rowIdx) => (
        <div key={rowIdx} className="flex">
          {row.map((piece, colIdx) => {
            const isLight = (rowIdx + colIdx) % 2 === 0;
            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                style={{
                  width: squareSize,
                  height: squareSize,
                  backgroundColor: isLight ? '#F0D9B5' : '#B58863',
                }}
                className="relative flex items-center justify-center"
              >
                {piece && (
                  <span
                    className="select-none leading-none"
                    style={{
                      fontSize: squareSize * 0.7,
                      color: piece === piece.toUpperCase() ? '#FFFFFF' : '#1a1a1a',
                      textShadow: piece === piece.toUpperCase()
                        ? '1px 1px 2px rgba(0,0,0,0.6)'
                        : '1px 1px 2px rgba(255,255,255,0.4)',
                    }}
                  >
                    {PIECE_MAP[piece]}
                  </span>
                )}
                {rowIdx === 7 && (
                  <span
                    className="absolute bottom-0.5 right-1 font-semibold"
                    style={{
                      fontSize: squareSize * 0.18,
                      color: isLight ? '#B58863' : '#F0D9B5',
                    }}
                  >
                    {files[colIdx]}
                  </span>
                )}
                {colIdx === 0 && (
                  <span
                    className="absolute top-0.5 left-1 font-semibold"
                    style={{
                      fontSize: squareSize * 0.18,
                      color: isLight ? '#B58863' : '#F0D9B5',
                    }}
                  >
                    {ranks[rowIdx]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});
