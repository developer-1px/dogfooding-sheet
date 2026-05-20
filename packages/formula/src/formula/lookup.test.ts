import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

const data = {
  A1: 'Apple', B1: '1.50',
  A2: 'Bread', B2: '2.25',
  A3: 'Milk', B3: '3.00',
}

describe('HLOOKUP', () => {
  it('finds and returns row value', () => {
    const h = { A1: 'Q1', B1: 'Q2', C1: 'Q3', A2: '10', B2: '20', C2: '30' }
    expect(evaluateCell(h, '=HLOOKUP("Q2", A1:C2, 2)')).toBe('20')
    expect(evaluateCell(h, '=HLOOKUP("Q9", A1:C2, 2, FALSE)')).toBe('#N/A')
  })

  it('uses approximate match by default', () => {
    const h = { A1: '10', B1: '20', C1: '30', A2: 'low', B2: 'mid', C2: 'high' }
    expect(evaluateCell(h, '=HLOOKUP(25, A1:C2, 2)')).toBe('mid')
    expect(evaluateCell(h, '=HLOOKUP(5, A1:C2, 2)')).toBe('#N/A')
  })

  it('rejects invalid lookup indices', () => {
    const h = { A1: 'Q1', B1: 'Q2', C1: 'Q3', A2: '10', B2: '20', C2: '30' }
    expect(evaluateCell(h, '=HLOOKUP("Q2", A1:C2, "x")')).toBe('#VALUE!')
    expect(evaluateCell(h, '=HLOOKUP("Q2", A1:C2, 1.5)')).toBe('#VALUE!')
  })
})

describe('ISFORMULA / ISREF', () => {
  it('detects formula and ref', () => {
    expect(evaluateCell({ A1: '=1+2', A2: '5' }, '=ISFORMULA(A1)')).toBe('1')
    expect(evaluateCell({ A1: '=1+2', A2: '5' }, '=ISFORMULA(A2)')).toBe('0')
    expect(evaluateCell({}, '=ISREF(B5)')).toBe('1')
    expect(evaluateCell({}, '=ISREF("hi")')).toBe('0')
  })
})

describe('RANGEDIM', () => {
  it('returns rows×cols of a range', () => {
    expect(evaluateCell({}, '=RANGEDIM(B2:D5)')).toBe('4×3')
    expect(evaluateCell({}, '=RANGEDIM(A1:A1)')).toBe('1×1')
  })
})

describe('ROWS / COLUMNS', () => {
  it('returns range dimensions with Sheets-compatible function names', () => {
    expect(evaluateCell({}, '=ROWS(B2:D5)')).toBe('4')
    expect(evaluateCell({}, '=COLUMNS(B2:D5)')).toBe('3')
    expect(evaluateCell({}, '=COLUMNS(Z1:AA1)')).toBe('2')
    expect(evaluateCell({}, '=ROWS(A1)')).toBe('1')
    expect(evaluateCell({}, '=COLUMNS(A1)')).toBe('1')
  })
})

describe('TRANSPOSE', () => {
  it('returns a transposed JSON matrix', () => {
    const cells = { A1: 'a', B1: 'b', A2: 'c', B2: 'd' }
    expect(evaluateCell(cells, '=TRANSPOSE(A1:B2)')).toBe('[["a","c"],["b","d"]]')
  })

  it('supports one-dimensional ranges as matrices', () => {
    const cells = { A1: 'a', A2: 'b', A3: 'c' }
    expect(evaluateCell(cells, '=TRANSPOSE(A1:A3)')).toBe('[["a","b","c"]]')
  })

  it('rejects oversized source ranges', () => {
    expect(evaluateCell({}, '=TRANSPOSE(A1:Z1001)')).toBe('#VALUE!')
  })
})

describe('SEQUENCE', () => {
  it('returns a generated JSON matrix', () => {
    expect(evaluateCell({}, '=SEQUENCE(2, 3)')).toBe('[["1","2","3"],["4","5","6"]]')
  })

  it('supports start and step arguments', () => {
    expect(evaluateCell({}, '=SEQUENCE(2, 2, 10, 5)')).toBe('[["10","15"],["20","25"]]')
  })

  it('rejects invalid dimensions', () => {
    expect(evaluateCell({}, '=SEQUENCE(0, 2)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=SEQUENCE(2, -1)')).toBe('#VALUE!')
  })

  it('rejects oversized generated arrays', () => {
    expect(evaluateCell({}, '=SEQUENCE(26001, 1)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=SEQUENCE(3000, 1)')).toBe('#VALUE!')
  })
})

describe('TAKE / DROP', () => {
  const cells = {
    A1: 'a', B1: 'b', C1: 'c',
    A2: 'd', B2: 'e', C2: 'f',
    A3: 'g', B3: 'h', C3: 'i',
  }

  it('takes rows and columns from the start of a range', () => {
    expect(evaluateCell(cells, '=TAKE(A1:C3, 2, 2)')).toBe('[["a","b"],["d","e"]]')
  })

  it('takes rows and columns from the end with negative counts', () => {
    expect(evaluateCell(cells, '=TAKE(A1:C3, -2, -2)')).toBe('[["e","f"],["h","i"]]')
  })

  it('drops rows and columns from either edge', () => {
    expect(evaluateCell(cells, '=DROP(A1:C3, 1, 1)')).toBe('[["e","f"],["h","i"]]')
    expect(evaluateCell(cells, '=DROP(A1:C3, -1, -1)')).toBe('[["a","b"],["d","e"]]')
  })

  it('rejects zero row or column counts', () => {
    expect(evaluateCell(cells, '=TAKE(A1:C3, 0)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=DROP(A1:C3, 1, 0)')).toBe('#VALUE!')
  })
})

describe('CHOOSEROWS / CHOOSECOLS', () => {
  const cells = {
    A1: 'a', B1: 'b', C1: 'c',
    A2: 'd', B2: 'e', C2: 'f',
    A3: 'g', B3: 'h', C3: 'i',
  }

  it('returns selected rows in requested order', () => {
    expect(evaluateCell(cells, '=CHOOSEROWS(A1:C3, 3, 1)')).toBe('[["g","h","i"],["a","b","c"]]')
  })

  it('returns selected columns in requested order', () => {
    expect(evaluateCell(cells, '=CHOOSECOLS(A1:C3, 3, 1)')).toBe('[["c","a"],["f","d"],["i","g"]]')
  })

  it('supports negative indexes from the end', () => {
    expect(evaluateCell(cells, '=CHOOSEROWS(A1:C3, -1, -3)')).toBe('[["g","h","i"],["a","b","c"]]')
    expect(evaluateCell(cells, '=CHOOSECOLS(A1:C3, -1, -3)')).toBe('[["c","a"],["f","d"],["i","g"]]')
  })

  it('rejects missing, zero, or out-of-range indexes', () => {
    expect(evaluateCell(cells, '=CHOOSEROWS(A1:C3)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=CHOOSECOLS(A1:C3, 0)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=CHOOSECOLS(A1:C3, 4)')).toBe('#VALUE!')
  })
})

describe('TOCOL / TOROW', () => {
  const cells = {
    A1: 'a', B1: 'b',
    A2: 'c', B2: 'd',
  }

  it('flattens a range by row by default', () => {
    expect(evaluateCell(cells, '=TOCOL(A1:B2)')).toBe('[["a"],["b"],["c"],["d"]]')
    expect(evaluateCell(cells, '=TOROW(A1:B2)')).toBe('[["a","b","c","d"]]')
  })

  it('can scan by column', () => {
    expect(evaluateCell(cells, '=TOCOL(A1:B2, 0, 1)')).toBe('[["a"],["c"],["b"],["d"]]')
    expect(evaluateCell(cells, '=TOROW(A1:B2, 0, 1)')).toBe('[["a","c","b","d"]]')
  })
})

describe('WRAPROWS / WRAPCOLS', () => {
  const cells = { A1: 'a', B1: 'b', C1: 'c', D1: 'd', E1: 'e' }

  it('wraps a vector into fixed-width rows', () => {
    expect(evaluateCell(cells, '=WRAPROWS(A1:E1, 2)')).toBe('[["a","b"],["c","d"],["e","#N/A"]]')
  })

  it('wraps a vector into fixed-height columns', () => {
    expect(evaluateCell(cells, '=WRAPCOLS(A1:E1, 2)')).toBe('[["a","c","e"],["b","d","#N/A"]]')
  })

  it('supports custom padding', () => {
    expect(evaluateCell(cells, '=WRAPROWS(A1:E1, 3, "-")')).toBe('[["a","b","c"],["d","e","-"]]')
    expect(evaluateCell(cells, '=WRAPCOLS(A1:E1, 3, "-")')).toBe('[["a","d"],["b","e"],["c","-"]]')
  })

  it('rejects invalid wrap counts', () => {
    expect(evaluateCell(cells, '=WRAPROWS(A1:E1, 0)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=WRAPCOLS(A1:E1, -1)')).toBe('#VALUE!')
  })

  it('rejects wrap counts that would allocate oversized padding', () => {
    expect(evaluateCell({ A1: 'a' }, '=WRAPROWS(A1:A1, 26001)')).toBe('#VALUE!')
    expect(evaluateCell({ A1: 'a' }, '=WRAPCOLS(A1:A1, 26001)')).toBe('#VALUE!')
  })
})

describe('EXPAND', () => {
  const cells = {
    A1: 'a', B1: 'b',
    A2: 'c', B2: 'd',
  }

  it('pads a range to requested rows and columns', () => {
    expect(evaluateCell(cells, '=EXPAND(A1:B2, 3, 4)')).toBe('[["a","b","#N/A","#N/A"],["c","d","#N/A","#N/A"],["#N/A","#N/A","#N/A","#N/A"]]')
  })

  it('supports custom padding and omitted columns', () => {
    expect(evaluateCell(cells, '=EXPAND(A1:B2, 3, 2, "-")')).toBe('[["a","b"],["c","d"],["-","-"]]')
  })

  it('rejects target dimensions smaller than the source', () => {
    expect(evaluateCell(cells, '=EXPAND(A1:B2, 1, 2)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=EXPAND(A1:B2, 2, 1)')).toBe('#VALUE!')
  })

  it('rejects target dimensions above the array cap', () => {
    expect(evaluateCell(cells, '=EXPAND(A1:B2, 26001, 1)')).toBe('#VALUE!')
  })

  it('rejects expanded arrays whose serialized text would exceed the output cap', () => {
    expect(evaluateCell({ A1: 'a', B1: 'x'.repeat(10_000) }, '=EXPAND(A1:A1, 2, 2, B1)')).toBe('#VALUE!')
  })
})

describe('HSTACK / VSTACK', () => {
  const cells = {
    A1: 'a', B1: 'b',
    A2: 'c', B2: 'd',
    D1: 'x',
    D2: 'y',
    D3: 'z',
  }

  it('combines ranges horizontally and pads shorter inputs', () => {
    expect(evaluateCell(cells, '=HSTACK(A1:B2, D1:D3)')).toBe('[["a","b","x"],["c","d","y"],["#N/A","#N/A","z"]]')
  })

  it('handles larger horizontal stacks without flatMap intermediates', () => {
    const cells = { A1: 'top', B1: 'x', A1000: 'bottom', B1000: 'y' }
    const rows = JSON.parse(evaluateCell(cells, '=HSTACK(A1:A1000, B1:B1000)')) as string[][]

    expect(rows).toHaveLength(1000)
    expect(rows[0]).toEqual(['top', 'x'])
    expect(rows[999]).toEqual(['bottom', 'y'])
  })

  it('combines ranges vertically and pads narrower inputs', () => {
    expect(evaluateCell(cells, '=VSTACK(A1:B2, D1:D3)')).toBe('[["a","b"],["c","d"],["x","#N/A"],["y","#N/A"],["z","#N/A"]]')
  })

  it('handles larger vertical stacks without flatMap intermediates', () => {
    const cells = { A1: 'top', A500: 'mid', B1: 'next', B500: 'bottom' }
    const rows = JSON.parse(evaluateCell(cells, '=VSTACK(A1:A500, B1:B500)')) as string[][]

    expect(rows).toHaveLength(1000)
    expect(rows[0]).toEqual(['top'])
    expect(rows[499]).toEqual(['mid'])
    expect(rows[500]).toEqual(['next'])
    expect(rows[999]).toEqual(['bottom'])
  })
})

describe('ARRAY_CONSTRAIN', () => {
  const cells = {
    A1: 'a', B1: 'b', C1: 'c',
    A2: 'd', B2: 'e', C2: 'f',
    A3: 'g', B3: 'h', C3: 'i',
  }

  it('limits a range to requested rows and columns', () => {
    expect(evaluateCell(cells, '=ARRAY_CONSTRAIN(A1:C3, 2, 2)')).toBe('[["a","b"],["d","e"]]')
  })

  it('caps oversized limits at the source dimensions', () => {
    expect(evaluateCell(cells, '=ARRAY_CONSTRAIN(A1:B2, 5, 5)')).toBe('[["a","b"],["d","e"]]')
  })

  it('rejects invalid limits', () => {
    expect(evaluateCell(cells, '=ARRAY_CONSTRAIN(A1:C3, 0, 2)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=ARRAY_CONSTRAIN(A1:C3, 2, -1)')).toBe('#VALUE!')
  })
})

describe('FLATTEN', () => {
  const cells = {
    A1: 'a', B1: 'b',
    A2: 'c', B2: 'd',
    D1: 'x', D2: 'y',
  }

  it('flattens a range into one column', () => {
    expect(evaluateCell(cells, '=FLATTEN(A1:B2)')).toBe('[["a"],["b"],["c"],["d"]]')
  })

  it('flattens multiple ranges in argument order', () => {
    expect(evaluateCell(cells, '=FLATTEN(A1:B1, D1:D2)')).toBe('[["a"],["b"],["x"],["y"]]')
  })

  it('handles larger flatten ranges without flatMap intermediates', () => {
    const cells = { A1: 'top', A1000: 'bottom' }
    const rows = JSON.parse(evaluateCell(cells, '=FLATTEN(A1:A1000)')) as string[][]

    expect(rows).toHaveLength(1000)
    expect(rows[0]).toEqual(['top'])
    expect(rows[999]).toEqual(['bottom'])
  })
})

describe('OFFSET', () => {
  it('returns value at base + (rows, cols)', () => {
    const cells = { A1: 'a', B1: 'b', A2: 'c', B2: 'd', AB1: 'wide' }
    expect(evaluateCell(cells, '=OFFSET(A1, 1, 1)')).toBe('d')
    expect(evaluateCell(cells, '=OFFSET(A1, 0, 1)')).toBe('b')
    expect(evaluateCell(cells, '=OFFSET(AA1, 0, 1)')).toBe('wide')
    expect(evaluateCell(cells, '=OFFSET(A1, -1, 0)')).toBe('#REF!')
  })
})

describe('INDIRECT', () => {
  it('resolves ref string to cell value', () => {
    expect(evaluateCell({ B5: 'hi' }, '=INDIRECT("B5")')).toBe('hi')
    expect(evaluateCell({ AA1: 'wide' }, '=INDIRECT("AA1")')).toBe('wide')
    expect(evaluateCell({ A1: '7' }, '=INDIRECT(ADDRESS(1,1))')).toBe('7')
    expect(evaluateCell({}, '=INDIRECT("nope")')).toBe('#REF!')
  })
})

describe('ADDRESS', () => {
  it('builds A1 ref from row/col', () => {
    expect(evaluateCell({}, '=ADDRESS(5, 2)')).toBe('B5')
    expect(evaluateCell({}, '=ADDRESS(1, 27)')).toBe('AA1')
    expect(evaluateCell({}, '=ADDRESS(1, 28)')).toBe('AB1')
    expect(evaluateCell({}, '=ADDRESS(0, 1)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=ADDRESS(1, 0)')).toBe('#VALUE!')
  })
})

describe('ROW / COLUMN', () => {
  it('return ref position', () => {
    expect(evaluateCell({}, '=ROW(B5)')).toBe('5')
    expect(evaluateCell({}, '=COLUMN(C1)')).toBe('3')
  })
})

describe('XLOOKUP', () => {
  it('vertical key with separate result column', () => {
    expect(evaluateCell(data, '=XLOOKUP("Bread", A1:A3, B1:B3)')).toBe('2.25')
  })
  it('returns ifNotFound when missing', () => {
    expect(evaluateCell(data, '=XLOOKUP("Cheese", A1:A3, B1:B3, "n/a")')).toBe('n/a')
  })
  it('horizontal lookup', () => {
    const h = { A1: 'Q1', B1: 'Q2', C1: 'Q3', A2: '10', B2: '20', C2: '30' }
    expect(evaluateCell(h, '=XLOOKUP("Q3", A1:C1, A2:C2)')).toBe('30')
  })
  it('supports next lesser and next greater match modes', () => {
    const table = { A1: '10', B1: 'low', A2: '20', B2: 'mid', A3: '30', B3: 'high', A4: '40', B4: 'top' }
    expect(evaluateCell(table, '=XLOOKUP(25, A1:A3, B1:B3, "n/a", -1)')).toBe('mid')
    expect(evaluateCell(table, '=XLOOKUP(25, A1:A4, B1:B4, "n/a", 1)')).toBe('high')
    expect(evaluateCell(table, '=XLOOKUP(5, A1:A4, B1:B4, "n/a", -1)')).toBe('n/a')
  })
  it('supports reverse search mode', () => {
    const table = { A1: 'a', B1: '1', A2: 'b', B2: '2', A3: 'a', B3: '3' }
    expect(evaluateCell(table, '=XLOOKUP("a", A1:A3, B1:B3)')).toBe('1')
    expect(evaluateCell(table, '=XLOOKUP("a", A1:A3, B1:B3, "n/a", 0, -1)')).toBe('3')
  })
  it('handles larger lookup vectors without ordered index arrays', () => {
    const table = { A1: 'first', B1: '1', A1000: 'target', B1000: '1000' }

    expect(evaluateCell(table, '=XLOOKUP("target", A1:A1000, B1:B1000)')).toBe('1000')
    expect(evaluateCell(table, '=XLOOKUP("first", A1:A1000, B1:B1000, "n/a", 0, -1)')).toBe('1')
  })
  it('supports wildcard match mode', () => {
    const table = { A1: 'apple', B1: '1', A2: 'apricot', B2: '2', A3: 'banana', B3: '3' }
    expect(evaluateCell(table, '=XLOOKUP("ap*", A1:A3, B1:B3, "n/a", 2)')).toBe('1')
    expect(evaluateCell(table, '=XLOOKUP("a????ot", A1:A3, B1:B3, "n/a", 2)')).toBe('2')
    expect(evaluateCell(table, '=XLOOKUP("ap*", A1:A3, B1:B3, "n/a", 2, -1)')).toBe('2')
  })
  it('supports escaped wildcard match mode', () => {
    const table = { A1: 'a*', B1: 'star', A2: 'a?', B2: 'question', A3: 'a~', B3: 'tilde' }
    expect(evaluateCell(table, '=XLOOKUP("a~*", A1:A3, B1:B3, "n/a", 2)')).toBe('star')
    expect(evaluateCell(table, '=XLOOKUP("a~?", A1:A3, B1:B3, "n/a", 2)')).toBe('question')
    expect(evaluateCell(table, '=XLOOKUP("a~~", A1:A3, B1:B3, "n/a", 2)')).toBe('tilde')
  })
  it('requires compatible lookup and result ranges', () => {
    const table = { A1: 'a', A2: 'b', A3: 'c', B1: '1', B2: '2' }
    expect(evaluateCell(table, '=XLOOKUP("b", A1:A3, B1:B2)')).toBe('#VALUE!')
    expect(evaluateCell(table, '=XLOOKUP("b", A1:B2, A1:A2)')).toBe('#VALUE!')
  })

  it('rejects missing ranges and invalid modes', () => {
    expect(evaluateCell(data, '=XLOOKUP("Bread", A1:A3)')).toBe('#VALUE!')
    expect(evaluateCell(data, '=XLOOKUP("Bread", A1:A3, B1:B3, "n/a", "x")')).toBe('#VALUE!')
    expect(evaluateCell(data, '=XLOOKUP("Bread", A1:A3, B1:B3, "n/a", 0, "x")')).toBe('#VALUE!')
  })
})

describe('XMATCH', () => {
  it('returns exact 1-based position by default', () => {
    expect(evaluateCell(data, '=XMATCH("Bread", A1:A3)')).toBe('2')
    expect(evaluateCell(data, '=XMATCH("Cheese", A1:A3)')).toBe('#N/A')
  })
  it('supports approximate, wildcard, and reverse search modes', () => {
    const table = { A1: '10', A2: '20', A3: '30', A4: '40', B1: 'apple', B2: 'apricot', B3: 'banana', B4: 'apricot' }
    expect(evaluateCell(table, '=XMATCH(25, A1:A4, -1)')).toBe('2')
    expect(evaluateCell(table, '=XMATCH(25, A1:A4, 1)')).toBe('3')
    expect(evaluateCell(table, '=XMATCH("ap*", B1:B4, 2)')).toBe('1')
    expect(evaluateCell(table, '=XMATCH("ap*", B1:B4, 2, -1)')).toBe('4')
    expect(evaluateCell({ A1: 'a*', A2: 'ab' }, '=XMATCH("a~*", A1:A2, 2)')).toBe('1')
  })
  it('handles larger match vectors without ordered index arrays', () => {
    const table = { A1: 'first', A1000: 'target' }

    expect(evaluateCell(table, '=XMATCH("target", A1:A1000)')).toBe('1000')
    expect(evaluateCell(table, '=XMATCH("first", A1:A1000, 0, -1)')).toBe('1')
  })
  it('requires a one-dimensional lookup range', () => {
    expect(evaluateCell(data, '=XMATCH("Bread", A1:B3)')).toBe('#VALUE!')
  })

  it('rejects missing ranges and invalid modes', () => {
    expect(evaluateCell(data, '=XMATCH("Bread")')).toBe('#VALUE!')
    expect(evaluateCell(data, '=XMATCH("Bread", A1:A3, "x")')).toBe('#VALUE!')
    expect(evaluateCell(data, '=XMATCH("Bread", A1:A3, 0, "x")')).toBe('#VALUE!')
  })
})

describe('INRANGE', () => {
  it('predicate based on MATCH', () => {
    expect(evaluateCell(data, '=INRANGE("Bread", A1:A3)')).toBe('1')
    expect(evaluateCell(data, '=INRANGE("Cheese", A1:A3)')).toBe('0')
  })
})

describe('VLOOKUP', () => {
  it('finds and returns column value', () => {
    expect(evaluateCell(data, '=VLOOKUP("Bread", A1:B3, 2)')).toBe('2.25')
  })
  it('returns #N/A on exact lookup when not found', () => {
    expect(evaluateCell(data, '=VLOOKUP("Cheese", A1:B3, 2, FALSE)')).toBe('#N/A')
  })
  it('returns #REF! when col out of range', () => {
    expect(evaluateCell(data, '=VLOOKUP("Apple", A1:B3, 5)')).toBe('#REF!')
  })
  it('uses approximate match by default', () => {
    const table = { A1: '10', B1: 'low', A2: '20', B2: 'mid', A3: '30', B3: 'high' }
    expect(evaluateCell(table, '=VLOOKUP(25, A1:B3, 2)')).toBe('mid')
    expect(evaluateCell(table, '=VLOOKUP(5, A1:B3, 2)')).toBe('#N/A')
  })
  it('accepts FALSE/0 for exact match', () => {
    const table = { A1: '10', B1: 'low', A2: '20', B2: 'mid', A3: '30', B3: 'high' }
    expect(evaluateCell(table, '=VLOOKUP(25, A1:B3, 2, FALSE)')).toBe('#N/A')
    expect(evaluateCell(table, '=VLOOKUP(25, A1:B3, 2, 0)')).toBe('#N/A')
  })

  it('rejects missing ranges and invalid lookup indices', () => {
    expect(evaluateCell(data, '=VLOOKUP()')).toBe('#VALUE!')
    expect(evaluateCell(data, '=VLOOKUP("Apple", A1:B3, "x")')).toBe('#VALUE!')
    expect(evaluateCell(data, '=VLOOKUP("Apple", A1:B3, 1.5)')).toBe('#VALUE!')
  })
})

describe('INDEX / MATCH', () => {
  it('INDEX returns cell at offset', () => {
    expect(evaluateCell(data, '=INDEX(A1:B3, 2, 1)')).toBe('Bread')
    expect(evaluateCell(data, '=INDEX(A1:B3, 3, 2)')).toBe('3')
  })
  it('MATCH returns 1-based position', () => {
    expect(evaluateCell(data, '=MATCH("Milk", A1:A3)')).toBe('3')
  })
  it('MATCH supports exact and approximate match types', () => {
    const asc = { A1: '10', A2: '20', A3: '30' }
    const desc = { A1: '30', A2: '20', A3: '10' }
    const horizontal = { A1: '10', B1: '20', C1: '30' }
    expect(evaluateCell(asc, '=MATCH(25, A1:A3)')).toBe('2')
    expect(evaluateCell(asc, '=MATCH(25, A1:A3, 0)')).toBe('#N/A')
    expect(evaluateCell(desc, '=MATCH(25, A1:A3, -1)')).toBe('1')
    expect(evaluateCell(horizontal, '=MATCH(25, A1:C1)')).toBe('2')
  })
  it('INDEX+MATCH composes like VLOOKUP', () => {
    expect(evaluateCell(data, '=INDEX(B1:B3, MATCH("Bread", A1:A3, 0))')).toBe('2.25')
  })

  it('rejects missing ranges and invalid indices', () => {
    expect(evaluateCell(data, '=INDEX(, 1, 1)')).toBe('#VALUE!')
    expect(evaluateCell(data, '=INDEX(A1:B3, "x", 1)')).toBe('#VALUE!')
    expect(evaluateCell(data, '=INDEX(A1:B3, 1.5, 1)')).toBe('#VALUE!')
    expect(evaluateCell(data, '=MATCH("Bread")')).toBe('#VALUE!')
    expect(evaluateCell(data, '=MATCH("Bread", A1:A3, "x")')).toBe('#VALUE!')
  })
})

describe('logical functions', () => {
  it('AND returns 1 only when all truthy', () => {
    expect(evaluateCell({}, '=AND(1, 2, 3)')).toBe('1')
    expect(evaluateCell({}, '=AND(1, 0, 3)')).toBe('0')
  })
  it('OR returns 1 when any truthy', () => {
    expect(evaluateCell({}, '=OR(0, 0, 1)')).toBe('1')
    expect(evaluateCell({}, '=OR(0, 0, 0)')).toBe('0')
  })
  it('NOT inverts', () => {
    expect(evaluateCell({}, '=NOT(0)')).toBe('1')
    expect(evaluateCell({}, '=NOT(1)')).toBe('0')
  })
  it('IS-predicates', () => {
    expect(evaluateCell({ A1: '' }, '=ISBLANK(A1)')).toBe('1')
    expect(evaluateCell({ A1: '5' }, '=ISNUMBER(A1)')).toBe('1')
    expect(evaluateCell({ A1: 'hi' }, '=ISTEXT(A1)')).toBe('1')
  })
})
