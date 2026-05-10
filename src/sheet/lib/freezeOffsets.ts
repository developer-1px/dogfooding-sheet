import { COL_LETTERS } from '../schema'

const HEADER_H = 30
const ROW_HEADER_W = 48

export function freezeOffsets(
  freezeRows: number, freezeCols: number,
  rowHeightOf: (row: number) => number, widthOf: (col: string) => number,
): { tops: number[]; lefts: number[] } {
  const tops: number[] = []; let aT = HEADER_H
  for (let r = 0; r < freezeRows; r++) { tops[r] = aT; aT += rowHeightOf(r) }
  const lefts: number[] = []; let aL = ROW_HEADER_W
  for (let c = 0; c < freezeCols; c++) { lefts[c] = aL; aL += widthOf(COL_LETTERS[c]) }
  return { tops, lefts }
}
