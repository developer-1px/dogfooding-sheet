import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'
import { MAX_GENERATED_TEXT_LENGTH } from './textLimit'

const c = { A1: '5', A2: '10', A3: '3', A4: '20', A5: '8', A6: '' }

describe('COUNTIF', () => {
  it('counts numeric matches', () => {
    expect(evaluateCell(c, '=COUNTIF(A1:A5, ">5")')).toBe('3')
    expect(evaluateCell(c, '=COUNTIF($A$1:$A$5, ">5")')).toBe('3')
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
  it('supports tilde escaped wildcards', () => {
    const cells = { A1: 'a*', A2: 'ab', A3: 'a?', A4: 'a~' }
    expect(evaluateCell(cells, '=COUNTIF(A1:A4, "a~*")')).toBe('1')
    expect(evaluateCell(cells, '=COUNTIF(A1:A4, "a~?")')).toBe('1')
    expect(evaluateCell(cells, '=COUNTIF(A1:A4, "a~~")')).toBe('1')
  })
  it('treats regex metacharacters as literals in wildcard criteria', () => {
    const cells = { A1: 'a.b', A2: 'axb', A3: 'a+b', A4: 'a.bc' }
    expect(evaluateCell(cells, '=COUNTIF(A1:A4, "a.*")')).toBe('2')
    expect(evaluateCell(cells, '=COUNTIF(A1:A4, "a+?")')).toBe('1')
  })
})

describe('SUMIF', () => {
  it('sums values matching criteria', () => {
    expect(evaluateCell(c, '=SUMIF(A1:A5, ">5")')).toBe('38')
  })
  it('uses separate sumRange when given', () => {
    const cells = { A1: 'x', A2: 'y', A3: 'x', B1: '1', B2: '10', B3: '100' }
    expect(evaluateCell(cells, '=SUMIF(A1:A3, "x", B1:B3)')).toBe('101')
    expect(evaluateCell(cells, '=SUMIF($A$1:$A$3, "x", $B$1:$B$3)')).toBe('101')
  })
  it('coerces formatted values in sumRange', () => {
    const cells = { A1: 'x', A2: 'x', B1: '$1,200.50', B2: '50%' }
    expect(evaluateCell(cells, '=SUMIF(A1:A2, "x", B1:B2)')).toBe('1201')
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
    expect(evaluateCell(cells, '=COUNTIFS($A$1:$A$4, "x", $B$1:$B$4, ">10")')).toBe('2')
    expect(evaluateCell(cells, '=SUMIFS(C1:C4, A1:A4, "x", B1:B4, ">10")')).toBe('6')
  })

  it('AVERAGEIFS averages matching numeric values', () => {
    const cells = { A1: 'x', A2: 'x', A3: 'y', A4: 'x', B1: '5', B2: '15', B3: '15', B4: '20', C1: '10', C2: '20', C3: '30', C4: '40' }
    expect(evaluateCell(cells, '=AVERAGEIFS(C1:C4, A1:A4, "x", B1:B4, ">10")')).toBe('30')
    expect(evaluateCell(cells, '=AVERAGEIFS(C1:C4, A1:A4, "z")')).toBe('#DIV/0!')
  })

  it('multi-criteria aggregates coerce formatted numbers', () => {
    const cells = { A1: 'x', A2: 'x', A3: 'y', B1: '$1,200.50', B2: '$299.50', B3: '$100.00' }
    expect(evaluateCell(cells, '=SUMIFS(B1:B3, A1:A3, "x")')).toBe('1500')
    expect(evaluateCell(cells, '=AVERAGEIFS(B1:B3, A1:A3, "x")')).toBe('750')
    expect(evaluateCell(cells, '=MAXIFS(B1:B3, A1:A3, "x")')).toBe('1200.5')
  })
})

describe('MINIFS / MAXIFS', () => {
  it('picks min/max value where criteria matches', () => {
    const cells = { A1: '5', A2: '10', A3: '3', A4: '20', B1: 'x', B2: 'y', B3: 'x', B4: 'y' }
    expect(evaluateCell(cells, '=MINIFS(A1:A4, B1:B4, "x")')).toBe('3')
    expect(evaluateCell(cells, '=MAXIFS(A1:A4, B1:B4, "y")')).toBe('20')
  })
})

describe('conditional aggregate errors', () => {
  it('rejects missing arguments and non-finite results', () => {
    const huge = { A1: 'x', A2: 'x', B1: '1e308', B2: '1e308' }

    expect(evaluateCell({}, '=COUNTIF()')).toBe('#VALUE!')
    expect(evaluateCell(c, '=COUNTIF(A1:A5)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=SUMIF()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=COUNTA()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=COUNTBLANK()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=COUNTUNIQUE()')).toBe('#VALUE!')
    expect(evaluateCell(c, '=COUNTIFS(A1:A5)')).toBe('#VALUE!')
    expect(evaluateCell(c, '=SUMIFS(A1:A5, A1:A5)')).toBe('#VALUE!')
    expect(evaluateCell(c, '=AVERAGEIFS(A1:A5, A1:A5)')).toBe('#VALUE!')
    expect(evaluateCell(c, '=MINIFS(A1:A5, A1:A5)')).toBe('#VALUE!')
    expect(evaluateCell(c, '=MAXIFS(A1:A5, A1:A5)')).toBe('#VALUE!')
    expect(evaluateCell(huge, '=SUMIF(A1:A2, "x", B1:B2)')).toBe('#NUM!')
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

  it('returns explicit errors for invalid aggregate domains and overflow', () => {
    const huge = { A1: '1e308', A2: '1e308' }

    expect(evaluateCell({}, '=AVEDEV()')).toBe('#NUM!')
    expect(evaluateCell({}, '=GEOMEAN(-1, 4)')).toBe('#NUM!')
    expect(evaluateCell({}, '=HARMEAN(0, 4)')).toBe('#NUM!')
    expect(evaluateCell(huge, '=SUM(A1:A2)')).toBe('#NUM!')
    expect(evaluateCell(huge, '=PRODUCT(A1:A2)')).toBe('#NUM!')
    expect(evaluateCell(huge, '=SUMSQ(A1:A2)')).toBe('#NUM!')
    expect(evaluateCell({ A1: '1e308', A2: '-1e308' }, '=VAR(A1:A2)')).toBe('#NUM!')
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

describe('MOSTCOMMON', () => {
  it('returns most frequent value', () => {
    const cells = { A1: 'red', A2: 'blue', A3: 'red', A4: 'green' }
    expect(evaluateCell(cells, '=MOSTCOMMON(A1:A4)')).toBe('red')
    expect(['blue', 'green']).toContain(evaluateCell(cells, '=LEASTCOMMON(A1:A4)'))
  })
})

describe('RANGECSV', () => {
  it('joins range with CSV escaping', () => {
    const cells = { A1: 'a', A2: 'b,c', A3: 'd"e' }
    expect(evaluateCell(cells, '=RANGECSV(A1:A3)')).toBe('a,"b,c","d""e"')
  })
})

describe('RANGEJSON', () => {
  it('serializes range as JSON array', () => {
    const cells = { A1: 'a', A2: 'b', A3: 'c' }
    expect(evaluateCell(cells, '=RANGEJSON(A1:A3)')).toBe('["a","b","c"]')
  })
})

describe('FILTER', () => {
  it('filters rows by a boolean condition range', () => {
    const cells = { A1: 'Apple', B1: '1', C1: '1', A2: 'Bread', B2: '2', C2: '0', A3: 'Milk', B3: '3', C3: 'TRUE' }
    expect(evaluateCell(cells, '=FILTER(A1:B3, C1:C3)')).toBe('[["Apple","1"],["Milk","3"]]')
    expect(evaluateCell(cells, '=FILTER(A1:A3, C1:C3)')).toBe('["Apple","Milk"]')
  })
  it('filters columns by a horizontal condition range', () => {
    const cells = { A1: 'name', B1: 'price', C1: 'qty', A2: 'Apple', B2: '1', C2: '3', A3: '1', B3: '0', C3: '1' }
    expect(evaluateCell(cells, '=FILTER(A1:C2, A3:C3)')).toBe('[["name","qty"],["Apple","3"]]')
  })
  it('returns Sheets-style errors for no matches or incompatible conditions', () => {
    const cells = { A1: 'Apple', A2: 'Bread', B1: '0', B2: '0' }
    expect(evaluateCell(cells, '=FILTER(A1:A2, B1:B2)')).toBe('#N/A')
    expect(evaluateCell(cells, '=FILTER(A1:A2, A1:B2)')).toBe('#VALUE!')
  })
  it('rejects oversized output ranges', () => {
    expect(evaluateCell({}, '=FILTER(A1:Z1001, A1:A1001)')).toBe('#VALUE!')
  })
})

describe('RANGESORT', () => {
  it('sorts numeric values ascending', () => {
    const cells = { A1: '3', A2: '1', A3: '2' }
    expect(evaluateCell(cells, '=RANGESORT(A1:A3)')).toBe('["1","2","3"]')
    expect(evaluateCell(cells, '=SORT(A1:A3)')).toBe('["1","2","3"]')
  })
  it('sorts text values lexically', () => {
    const cells = { A1: 'c', A2: 'a', A3: 'b' }
    expect(evaluateCell(cells, '=RANGESORT(A1:A3)')).toBe('["a","b","c"]')
  })
  it('rejects range JSON output above the cell text cap', () => {
    const cells = Object.fromEntries(Array.from({ length: 3000 }, (_unused, index) => [`A${index + 1}`, 'x']))
    expect(evaluateCell(cells, '=RANGEJSON(A1:A3000)')).toBe('#VALUE!')
  })
})

describe('SKEW', () => {
  it('returns 0 for symmetric data', () => {
    const cells = { A1: '1', A2: '2', A3: '3', A4: '4', A5: '5' }
    expect(Number(evaluateCell(cells, '=SKEW(A1:A5)'))).toBeCloseTo(0)
  })
  it('returns positive for right-skewed data', () => {
    const cells = { A1: '1', A2: '1', A3: '1', A4: '2', A5: '10' }
    expect(Number(evaluateCell(cells, '=SKEW(A1:A5)'))).toBeGreaterThan(0)
  })
})

describe('Vector ops', () => {
  const cells = { A1: '1', A2: '2', A3: '3', B1: '4', B2: '5', B3: '6' }
  it('EUCLIDEAN distance', () => {
    expect(Number(evaluateCell(cells, '=EUCLIDEAN(A1:A3, B1:B3)'))).toBeCloseTo(Math.sqrt(27))
  })
  it('MANHATTAN distance', () => {
    expect(evaluateCell(cells, '=MANHATTAN(A1:A3, B1:B3)')).toBe('9')
  })
  it('CHEBYSHEV distance', () => {
    expect(evaluateCell(cells, '=CHEBYSHEV(A1:A3, B1:B3)')).toBe('3')
  })
  it('DOTPROD', () => {
    expect(evaluateCell(cells, '=DOTPROD(A1:A3, B1:B3)')).toBe('32')
  })
  it('COSINE similarity', () => {
    expect(Number(evaluateCell(cells, '=COSINE(A1:A3, B1:B3)'))).toBeCloseTo(0.9746, 3)
  })
  it('SUMXMY2 / SUMX2MY2 / SUMX2PY2', () => {
    expect(evaluateCell(cells, '=SUMXMY2(A1:A3, B1:B3)')).toBe('27')
    expect(evaluateCell(cells, '=SUMX2MY2(A1:A3, B1:B3)')).toBe('-63')
    expect(evaluateCell(cells, '=SUMX2PY2(A1:A3, B1:B3)')).toBe('91')
  })
})

describe('RSQ', () => {
  it('returns squared correlation coefficient', () => {
    const cells = { A1: '1', A2: '2', A3: '3', A4: '4', B1: '2', B2: '4', B3: '6', B4: '8' }
    expect(Number(evaluateCell(cells, '=RSQ(A1:A4, B1:B4)'))).toBeCloseTo(1)
  })
})

describe('GINI', () => {
  it('returns 0 for perfect equality', () => {
    const cells = { A1: '5', A2: '5', A3: '5', A4: '5' }
    expect(Number(evaluateCell(cells, '=GINI(A1:A4)'))).toBeCloseTo(0)
  })
  it('returns positive for inequality', () => {
    const cells = { A1: '0', A2: '0', A3: '0', A4: '100' }
    expect(Number(evaluateCell(cells, '=GINI(A1:A4)'))).toBeCloseTo(0.75)
  })
})

describe('KURT', () => {
  it('returns excess kurtosis', () => {
    const cells = { A1: '1', A2: '2', A3: '3', A4: '4', A5: '5' }
    expect(Number(evaluateCell(cells, '=KURT(A1:A5)'))).toBeCloseTo(-1.3, 1)
  })
})

describe('ZSCORE', () => {
  it('returns standardized value', () => {
    const cells = { A1: '2', A2: '4', A3: '4', A4: '4', A5: '5', A6: '5', A7: '7', A8: '9' }
    expect(evaluateCell(cells, '=ZSCORE(5, A1:A8)')).toBe('0')
    expect(Number(evaluateCell(cells, '=ZSCORE(9, A1:A8)'))).toBeCloseTo(2)
  })
})

describe('PERCENTRANK', () => {
  it('returns fraction of values less than given value', () => {
    const cells = { A1: '1', A2: '2', A3: '3', A4: '4', A5: '5' }
    expect(evaluateCell(cells, '=PERCENTRANK(A1:A5, 3)')).toBe('0.5')
    expect(evaluateCell(cells, '=PERCENTRANK(A1:A5, 1)')).toBe('0')
    expect(evaluateCell(cells, '=PERCENTRANK(A1:A5, 5)')).toBe('1')
  })
})

describe('statistical function errors', () => {
  it('rejects invalid scalar inputs and missing ranges', () => {
    const cells = { A1: '1', A2: '2', B1: '2', B2: '4', C1: '0', C2: '0' }

    expect(evaluateCell(cells, '=FORECAST("x", A1:A2, B1:B2)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=FORECAST(1, A1:A2)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=ZSCORE("x", A1:A2)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=PERCENTRANK(A1:A2, "x")')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=PERCENTILE(A1:A2, "x")')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=TRIMMEAN(A1:A2, "x")')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=QUARTILE(A1:A2, "x")')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=COVAR(A1:A2)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=SUMXMY2(A1:A2)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=COSINE(A1:A2, C1:C2)')).toBe('#DIV/0!')
  })
})

describe('JACCARD', () => {
  it('returns set similarity ratio', () => {
    const cells = { A1: 'a', A2: 'b', A3: 'c', B1: 'b', B2: 'c', B3: 'd' }
    expect(evaluateCell(cells, '=JACCARD(A1:A3, B1:B3)')).toBe('0.5')
  })
})

describe('ENTROPY', () => {
  it('returns 0 for uniform single value', () => {
    const cells = { A1: 'a', A2: 'a', A3: 'a' }
    expect(evaluateCell(cells, '=ENTROPY(A1:A3)')).toBe('0')
  })
  it('returns 1 for two equally likely values', () => {
    const cells = { A1: 'x', A2: 'y', A3: 'x', A4: 'y' }
    expect(Number(evaluateCell(cells, '=ENTROPY(A1:A4)'))).toBeCloseTo(1)
  })
})

describe('RANGEUNIQUE', () => {
  it('returns unique values in first-occurrence order', () => {
    const cells = { A1: 'b', A2: 'a', A3: 'b', A4: 'c', A5: 'a' }
    expect(evaluateCell(cells, '=RANGEUNIQUE(A1:A5)')).toBe('["b","a","c"]')
    expect(evaluateCell(cells, '=UNIQUE(A1:A5)')).toBe('["b","a","c"]')
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

  it('rejects missing ranges and oversized range text output', () => {
    const longCells = { A1: 'x'.repeat(MAX_GENERATED_TEXT_LENGTH), A2: 'y' }

    expect(evaluateCell({}, '=ARRAYTOTEXT()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=RANGEJSON()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=RANGECSV()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=RANGESORT()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=RANGEUNIQUE()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=COUNTNUMERIC()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=MAXLEN()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=MAXSTR()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=FIRST()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=SAMPLE()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=ENTROPY()')).toBe('#VALUE!')
    expect(evaluateCell(longCells, '=ARRAYTOTEXT(A1:A2, "")')).toBe('#VALUE!')
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

  it('returns explicit errors for invalid range operation inputs', () => {
    const cells = { A1: '5', A2: '1', A3: '8', B1: '1', B2: '0', B3: '-1', C1: '0', C2: '0', C3: '0' }
    const huge = { A1: '1e308', B1: '1e308' }

    expect(evaluateCell(cells, '=WEIGHTAVG(A1:A3)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=WEIGHTAVG(A1:A3, C1:C3)')).toBe('#DIV/0!')
    expect(evaluateCell(cells, '=MAX_BY(A1:A3)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=JACCARD(A1:A3)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=LARGE(A1:A3, "x")')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=SMALL(A1:A3, 1.5)')).toBe('#NUM!')
    expect(evaluateCell(cells, '=RANK("x", A1:A3)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=RANK(8, A1:A3, "x")')).toBe('#VALUE!')
    expect(evaluateCell(huge, '=SUMPRODUCT(A1:A1, B1:B1)')).toBe('#NUM!')
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
    const v = Number(evaluateCell(c, '=AVERAGEIF(A1:A5, ">5")'))
    expect(v).toBeCloseTo(38 / 3, 5)
  })
  it('uses separate avgRange', () => {
    const cells = { A1: 'x', A2: 'y', A3: 'x', B1: '10', B2: '99', B3: '20' }
    expect(evaluateCell(cells, '=AVERAGEIF(A1:A3, "x", B1:B3)')).toBe('15')
  })
  it('returns #DIV/0! when no numeric values match', () => {
    const cells = { A1: 'x', A2: 'y', B1: 'text', B2: '' }
    expect(evaluateCell(cells, '=AVERAGEIF(A1:A2, "x", B1:B2)')).toBe('#DIV/0!')
    expect(evaluateCell(cells, '=AVERAGEIF(A1:A2, "z", B1:B2)')).toBe('#DIV/0!')
  })
})

describe('extra math', () => {
  it('INT rounds down', () => {
    expect(evaluateCell({}, '=INT(3.7)')).toBe('3')
    expect(evaluateCell({}, '=INT(-3.7)')).toBe('-4')
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
