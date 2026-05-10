import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

const c = { A1: '5', A2: '10', A3: '3', A4: '20', A5: '8', A6: '' }

describe('COUNTIF', () => {
  it('counts numeric matches', () => {
    expect(evaluateCell(c, '=COUNTIF(A1:A5, ">5")')).toBe('3')
    expect(evaluateCell(c, '=COUNTIF(A1:A5, "<=5")')).toBe('2')
    expect(evaluateCell(c, '=COUNTIF(A1:A5, "10")')).toBe('1')
    expect(evaluateCell(c, '=COUNTIF(A1:A5, "<>10")')).toBe('4')
  })
})

describe('COUNTIF wildcards', () => {
  it('* matches any sequence, ? matches single char', () => {
    const cells = { A1: 'apple', A2: 'apricot', A3: 'banana', A4: 'app' }
    expect(evaluateCell(cells, '=COUNTIF(A1:A4, "ap*")')).toBe('3')
    expect(evaluateCell(cells, '=COUNTIF(A1:A4, "app??")')).toBe('1')
  })
})

describe('SUMIF', () => {
  it('sums values matching criteria', () => {
    expect(evaluateCell(c, '=SUMIF(A1:A5, ">5")')).toBe('38')
  })
  it('uses separate sumRange when given', () => {
    const cells = { A1: 'x', A2: 'y', A3: 'x', B1: '1', B2: '10', B3: '100' }
    expect(evaluateCell(cells, '=SUMIF(A1:A3, "x", B1:B3)')).toBe('101')
  })
})

describe('COUNTA', () => {
  it('counts non-empty cells', () => {
    expect(evaluateCell(c, '=COUNTA(A1:A6)')).toBe('5')
  })
})

describe('COUNTIFS / SUMIFS', () => {
  it('multi-criteria count and sum', () => {
    const cells = { A1: 'x', A2: 'x', A3: 'y', A4: 'x', B1: '5', B2: '15', B3: '15', B4: '20', C1: '1', C2: '2', C3: '3', C4: '4' }
    expect(evaluateCell(cells, '=COUNTIFS(A1:A4, "x", B1:B4, ">10")')).toBe('2')
    expect(evaluateCell(cells, '=SUMIFS(C1:C4, A1:A4, "x", B1:B4, ">10")')).toBe('6')
  })
})

describe('MINIFS / MAXIFS', () => {
  it('picks min/max value where criteria matches', () => {
    const cells = { A1: '5', A2: '10', A3: '3', A4: '20', B1: 'x', B2: 'y', B3: 'x', B4: 'y' }
    expect(evaluateCell(cells, '=MINIFS(A1:A4, B1:B4, "x")')).toBe('3')
    expect(evaluateCell(cells, '=MAXIFS(A1:A4, B1:B4, "y")')).toBe('20')
  })
})

describe('MAXA / MINA / AVERAGEA', () => {
  it('treat text as 0 in stats', () => {
    const cells = { A1: '5', A2: 'text', A3: '10' }
    expect(evaluateCell(cells, '=MAXA(A1:A3)')).toBe('10')
    expect(evaluateCell(cells, '=MINA(A1:A3)')).toBe('0')
    expect(evaluateCell(cells, '=AVERAGEA(A1:A3)')).toBe('5')
  })
})

describe('AVEDEV', () => {
  it('mean absolute deviation', () => {
    const cells = { A1: '2', A2: '4', A3: '4', A4: '6' }
    expect(evaluateCell(cells, '=AVEDEV(A1:A4)')).toBe('1')
  })
})

describe('SUMSQ / GEOMEAN / HARMEAN', () => {
  it('aggregates squared / geometric / harmonic means', () => {
    const cells = { A1: '2', A2: '4', A3: '8' }
    expect(evaluateCell(cells, '=SUMSQ(A1:A3)')).toBe('84')
    expect(evaluateCell(cells, '=GEOMEAN(A1:A3)')).toBe('4')
    expect(Number(evaluateCell(cells, '=HARMEAN(A1:A3)'))).toBeCloseTo(3.4286, 3)
  })
})

describe('SLOPE / INTERCEPT', () => {
  it('linear regression on perfect line y=2x+1', () => {
    const cells = { A1: '3', A2: '5', A3: '7', A4: '9', B1: '1', B2: '2', B3: '3', B4: '4' }
    expect(evaluateCell(cells, '=SLOPE(A1:A4, B1:B4)')).toBe('2')
    expect(evaluateCell(cells, '=INTERCEPT(A1:A4, B1:B4)')).toBe('1')
  })
})

describe('COVAR / CORREL', () => {
  it('measure paired variance / linear correlation', () => {
    const cells = { A1: '1', A2: '2', A3: '3', A4: '4', B1: '2', B2: '4', B3: '6', B4: '8' }
    expect(evaluateCell(cells, '=CORREL(A1:A4, B1:B4)')).toBe('1')
    expect(Number(evaluateCell(cells, '=COVAR(A1:A4, B1:B4)'))).toBeCloseTo(2.5)
  })
})

describe('FORECAST', () => {
  it('predicts y for given x on perfect line y=2x+1', () => {
    const cells = { A1: '3', A2: '5', A3: '7', A4: '9', B1: '1', B2: '2', B3: '3', B4: '4' }
    expect(evaluateCell(cells, '=FORECAST(5, A1:A4, B1:B4)')).toBe('11')
  })
})

describe('TRIMMEAN', () => {
  it('drops outliers from each end', () => {
    const cells = { A1: '1', A2: '2', A3: '3', A4: '4', A5: '5', A6: '6', A7: '7', A8: '8', A9: '9', A10: '100' }
    expect(evaluateCell(cells, '=TRIMMEAN(A1:A10, 0.2)')).toBe('5.5')
  })
})

describe('PERCENTILE / QUARTILE', () => {
  it('PERCENTILE interpolates', () => {
    const cells = { A1: '1', A2: '2', A3: '3', A4: '4', A5: '5' }
    expect(evaluateCell(cells, '=PERCENTILE(A1:A5, 0)')).toBe('1')
    expect(evaluateCell(cells, '=PERCENTILE(A1:A5, 0.5)')).toBe('3')
    expect(evaluateCell(cells, '=PERCENTILE(A1:A5, 1)')).toBe('5')
  })
  it('QUARTILE matches percentile mapping', () => {
    const cells = { A1: '1', A2: '2', A3: '3', A4: '4', A5: '5' }
    expect(evaluateCell(cells, '=QUARTILE(A1:A5, 2)')).toBe('3')
    expect(evaluateCell(cells, '=QUARTILE(A1:A5, 4)')).toBe('5')
  })
})

describe('WEIGHTAVG', () => {
  it('weighted average', () => {
    const cells = { A1: '80', A2: '90', A3: '100', B1: '1', B2: '2', B3: '1' }
    // (80 + 180 + 100) / 4 = 90
    expect(evaluateCell(cells, '=WEIGHTAVG(A1:A3, B1:B3)')).toBe('90')
  })
})

describe('MAX_BY / MIN_BY', () => {
  it('return value at index of key max/min', () => {
    const cells = { A1: 'red', A2: 'green', A3: 'blue', B1: '5', B2: '10', B3: '3' }
    expect(evaluateCell(cells, '=MAX_BY(A1:A3, B1:B3)')).toBe('green')
    expect(evaluateCell(cells, '=MIN_BY(A1:A3, B1:B3)')).toBe('blue')
  })
})

describe('COUNTNUMERIC', () => {
  it('counts cells holding finite numbers', () => {
    const cells = { A1: '5', A2: 'x', A3: '3.14', A4: '', A5: 'NaN' }
    expect(evaluateCell(cells, '=COUNTNUMERIC(A1:A5)')).toBe('2')
  })
})

describe('RANGEHASH', () => {
  it('stable hash of range contents', () => {
    const cells = { A1: 'a', A2: 'b', A3: 'c' }
    const h1 = evaluateCell(cells, '=RANGEHASH(A1:A3)')
    const h2 = evaluateCell(cells, '=RANGEHASH(A1:A3)')
    expect(h1).toEqual(h2)
    expect(h1).toMatch(/^[0-9a-f]{8}$/)
  })
})

describe('MAXSTR / MINSTR', () => {
  it('lexicographic max/min', () => {
    const cells = { A1: 'banana', A2: 'apple', A3: 'cherry' }
    expect(evaluateCell(cells, '=MAXSTR(A1:A3)')).toBe('cherry')
    expect(evaluateCell(cells, '=MINSTR(A1:A3)')).toBe('apple')
  })
})

describe('MAXLEN / MINLEN', () => {
  it('max/min string length over range', () => {
    const cells = { A1: 'red', A2: 'green', A3: 'aquamarine' }
    expect(evaluateCell(cells, '=MAXLEN(A1:A3)')).toBe('10')
    expect(evaluateCell(cells, '=MINLEN(A1:A3)')).toBe('3')
  })
})

describe('FIRST / LAST non-empty', () => {
  it('first/last non-empty values', () => {
    const cells = { A1: '', A2: 'a', A3: '', A4: 'b' }
    expect(evaluateCell(cells, '=FIRST(A1:A4)')).toBe('a')
    expect(evaluateCell(cells, '=LAST(A1:A4)')).toBe('b')
  })
})

describe('ARRAYTOTEXT', () => {
  it('joins non-empty values', () => {
    const cells = { A1: 'red', A2: '', A3: 'blue', A4: 'green' }
    expect(evaluateCell(cells, '=ARRAYTOTEXT(A1:A4)')).toBe('red, blue, green')
    expect(evaluateCell(cells, '=ARRAYTOTEXT(A1:A4, "|")')).toBe('red|blue|green')
  })
})

describe('SAMPLE', () => {
  it('picks one of the non-empty values', () => {
    const cells = { A1: 'a', A2: 'b', A3: '', A4: 'c' }
    const v = evaluateCell(cells, '=SAMPLE(A1:A4)')
    expect(['a', 'b', 'c']).toContain(v)
  })
})

describe('SUMPRODUCT', () => {
  it('sums element-wise products across ranges', () => {
    const cells = { A1: '2', A2: '3', A3: '4', B1: '10', B2: '20', B3: '30' }
    expect(evaluateCell(cells, '=SUMPRODUCT(A1:A3, B1:B3)')).toBe('200')
  })
})

describe('COUNTUNIQUE', () => {
  it('counts distinct non-empty values', () => {
    const cells = { A1: 'x', A2: 'y', A3: 'x', A4: 'z', A5: '', A6: 'y' }
    expect(evaluateCell(cells, '=COUNTUNIQUE(A1:A6)')).toBe('3')
  })
})

describe('COUNTBLANK', () => {
  it('counts empty cells', () => {
    expect(evaluateCell(c, '=COUNTBLANK(A1:A6)')).toBe('1')
  })
})

describe('AVERAGEIF', () => {
  it('averages matching values', () => {
    expect(evaluateCell(c, '=AVERAGEIF(A1:A5, ">5")')).toBeCloseTo(38 / 3, 5).toString
    const v = Number(evaluateCell(c, '=AVERAGEIF(A1:A5, ">5")'))
    expect(v).toBeCloseTo(38 / 3, 5)
  })
  it('uses separate avgRange', () => {
    const cells = { A1: 'x', A2: 'y', A3: 'x', B1: '10', B2: '99', B3: '20' }
    expect(evaluateCell(cells, '=AVERAGEIF(A1:A3, "x", B1:B3)')).toBe('15')
  })
})

describe('extra math', () => {
  it('INT truncates', () => {
    expect(evaluateCell({}, '=INT(3.7)')).toBe('3')
    expect(evaluateCell({}, '=INT(-3.7)')).toBe('-3')
  })
  it('LN / LOG / EXP', () => {
    expect(Number(evaluateCell({}, '=EXP(1)'))).toBeCloseTo(Math.E, 10)
    expect(Number(evaluateCell({}, '=LN(EXP(2))'))).toBeCloseTo(2, 10)
    expect(evaluateCell({}, '=LOG(100)')).toBe('2')
    expect(evaluateCell({}, '=LOG(8, 2)')).toBe('3')
  })
  it('VAR/VARP/STDEV/STDEVP differ by N vs N-1', () => {
    const cells = { A1: '2', A2: '4', A3: '4', A4: '4', A5: '5', A6: '5', A7: '7', A8: '9' }
    expect(Number(evaluateCell(cells, '=VARP(A1:A8)'))).toBeCloseTo(4, 5)
    expect(Number(evaluateCell(cells, '=STDEVP(A1:A8)'))).toBeCloseTo(2, 5)
  })
  it('RANK descending by default, asc when order != 0', () => {
    const cells = { A1: '5', A2: '1', A3: '8', A4: '3', A5: '9' }
    expect(evaluateCell(cells, '=RANK(8, A1:A5)')).toBe('2')
    expect(evaluateCell(cells, '=RANK(8, A1:A5, 1)')).toBe('4')
    expect(evaluateCell(cells, '=RANK(99, A1:A5)')).toBe('#N/A')
  })
  it('LARGE / SMALL pick Nth largest / smallest', () => {
    const cells = { A1: '5', A2: '1', A3: '8', A4: '3', A5: '9' }
    expect(evaluateCell(cells, '=LARGE(A1:A5,1)')).toBe('9')
    expect(evaluateCell(cells, '=LARGE(A1:A5,2)')).toBe('8')
    expect(evaluateCell(cells, '=SMALL(A1:A5,1)')).toBe('1')
    expect(evaluateCell(cells, '=SMALL(A1:A5,3)')).toBe('5')
  })
  it('PRODUCT multiplies range', () => {
    expect(evaluateCell({ A1: '2', A2: '3', A3: '4' }, '=PRODUCT(A1:A3)')).toBe('24')
  })
  it('MODE picks most common', () => {
    expect(evaluateCell({ A1: '5', A2: '3', A3: '5', A4: '2' }, '=MODE(A1:A4)')).toBe('5')
  })
  it('ROUNDUP / ROUNDDOWN', () => {
    expect(evaluateCell({}, '=ROUNDUP(3.14, 1)')).toBe('3.2')
    expect(evaluateCell({}, '=ROUNDDOWN(3.99, 0)')).toBe('3')
  })
})
