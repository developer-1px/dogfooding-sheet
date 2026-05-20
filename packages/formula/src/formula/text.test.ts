import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'
import { MAX_GENERATED_TEXT_LENGTH } from './textLimit'

describe('text functions', () => {
  it('YESNO / BOOLTEXT', () => {
    expect(evaluateCell({}, '=YESNO(1)')).toBe('예')
    expect(evaluateCell({}, '=YESNO(0)')).toBe('아니오')
    expect(evaluateCell({}, '=BOOLTEXT(1)')).toBe('TRUE')
  })
  it('BOOLEAN coerces strings', () => {
    expect(evaluateCell({}, '=BOOLEAN("yes")')).toBe('1')
    expect(evaluateCell({}, '=BOOLEAN("no")')).toBe('0')
    expect(evaluateCell({}, '=BOOLEAN("false")')).toBe('0')
    expect(evaluateCell({}, '=BOOLEAN("")')).toBe('0')
    expect(evaluateCell({}, '=BOOLEAN("anything")')).toBe('1')
  })
  it('XOR / TRUE / FALSE', () => {
    expect(evaluateCell({}, '=XOR(1,0)')).toBe('1')
    expect(evaluateCell({}, '=XOR(1,1)')).toBe('0')
    expect(evaluateCell({}, '=XOR(1,1,1)')).toBe('1')
    expect(evaluateCell({}, '=TRUE()')).toBe('1')
    expect(evaluateCell({}, '=FALSE()')).toBe('0')
  })
  it('JSONESCAPE escapes quotes/newlines', () => {
    expect(evaluateCell({}, '=JSONESCAPE("hi "a"")')).toBe('hi \\"a\\"')
  })
  it('BASE64 round-trip', () => {
    expect(evaluateCell({}, '=BASE64ENCODE("hi!")')).toBe('aGkh')
    expect(evaluateCell({}, '=BASE64DECODE("aGkh")')).toBe('hi!')
  })
  it('URLHOST / URLPATH / URLQUERY parse URLs', () => {
    expect(evaluateCell({}, '=URLHOST("https://example.com/foo?x=1")')).toBe('example.com')
    expect(evaluateCell({}, '=URLPATH("https://example.com/foo/bar")')).toBe('/foo/bar')
    expect(evaluateCell({}, '=URLQUERY("https://example.com/?name=alice", "name")')).toBe('alice')
  })
  it('ENCODEURL escapes special characters', () => {
    expect(evaluateCell({}, '=ENCODEURL("hello world & co")')).toBe('hello%20world%20%26%20co')
    expect(evaluateCell({}, '=DECODEURL("hello%20world%20%26%20co")')).toBe('hello world & co')
  })
  it('rejects oversized generated codec text', () => {
    expect(evaluateCell({ A1: 'x'.repeat(Math.floor(MAX_GENERATED_TEXT_LENGTH * 3 / 4) + 1) }, '=BASE64ENCODE(A1)')).toBe('#VALUE!')
    expect(evaluateCell({ A1: 'YWFh'.repeat(Math.floor(MAX_GENERATED_TEXT_LENGTH / 3) + 1) }, '=BASE64DECODE(A1)')).toBe('#VALUE!')
    expect(evaluateCell({ A1: ' '.repeat(Math.floor(MAX_GENERATED_TEXT_LENGTH / 3) + 1) }, '=ENCODEURL(A1)')).toBe('#VALUE!')
    expect(evaluateCell({ A1: '%61'.repeat(MAX_GENERATED_TEXT_LENGTH + 1) }, '=DECODEURL(A1)')).toBe('#VALUE!')
    expect(evaluateCell({ A1: '"'.repeat(Math.floor(MAX_GENERATED_TEXT_LENGTH / 2) + 1) }, '=JSONESCAPE(A1)')).toBe('#VALUE!')
  })
  it('HYPERLINK uses label when given, else URL', () => {
    expect(evaluateCell({}, '=HYPERLINK("https://example.com", "click")')).toBe('click')
    expect(evaluateCell({}, '=HYPERLINK("https://example.com")')).toBe('https://example.com')
  })
  it('CONCAT joins strings and refs', () => {
    expect(evaluateCell({ A1: 'hello' }, '=CONCAT(A1, " ", "world")')).toBe('hello world')
  })
  it('LEN returns length', () => {
    expect(evaluateCell({ A1: 'hello' }, '=LEN(A1)')).toBe('5')
  })
  it('UPPER / LOWER', () => {
    expect(evaluateCell({}, '=UPPER("abc")')).toBe('ABC')
    expect(evaluateCell({}, '=LOWER("ABC")')).toBe('abc')
  })
  it('LEFT / RIGHT / MID', () => {
    expect(evaluateCell({}, '=LEFT("abcdef", 3)')).toBe('abc')
    expect(evaluateCell({}, '=RIGHT("abcdef", 2)')).toBe('ef')
    expect(evaluateCell({}, '=MID("abcdef", 2, 3)')).toBe('bcd')
    expect(evaluateCell({}, '=CHARAT("abc", 1)')).toBe('b')
    expect(evaluateCell({}, '=CHARAT("hi😀", 2)')).toBe('😀')
    expect(evaluateCell({}, '=FIRSTCHAR("hi😀")')).toBe('h')
    expect(evaluateCell({}, '=LASTCHAR("hi😀")')).toBe('😀')
  })
  it('TRIM removes whitespace', () => {
    expect(evaluateCell({}, '=TRIM("  hi  ")')).toBe('hi')
  })
  it('REGEXMATCH / REGEXEXTRACT / REGEXREPLACE', () => {
    expect(evaluateCell({}, '=REGEXMATCH("foo123", "\\d+")')).toBe('1')
    expect(evaluateCell({}, '=REGEXMATCH("a(b)", "\\(b\\)")')).toBe('1')
    expect(evaluateCell({}, '=REGEXEXTRACT("foo123bar", "\\d+")')).toBe('123')
    expect(evaluateCell({}, '=REGEXREPLACE("a1b2c3", "\\d", "X")')).toBe('aXbXcX')
    expect(evaluateCell({}, '=REGEXCOUNT("a1b22c333", "\\d+")')).toBe('3')
    expect(evaluateCell({}, '=REGEXCOUNT("abc", "\\d")')).toBe('0')
  })
  it('rejects unsafe regex inputs', () => {
    const longText = 'a'.repeat(10001)
    const longPattern = 'a'.repeat(257)

    expect(evaluateCell({}, '=REGEXMATCH("aaaa", "(a+)+$")')).toBe('#VALUE!')
    expect(evaluateCell({}, `=REGEXMATCH("abc", "${longPattern}")`)).toBe('#VALUE!')
    expect(evaluateCell({}, `=REGEXMATCH("${longText}", "a")`)).toBe('#VALUE!')
  })
  it('NORMALIZE Unicode form', () => {
    expect(evaluateCell({}, '=NORMALIZE("café", "NFC")').length).toBe(4)
  })
  it('CLEAN strips control characters', () => {
    expect(evaluateCell({}, '=CLEAN("a\x01b\x1Fc")')).toBe('abc')
  })
  it('T returns text only (empty for numbers)', () => {
    expect(evaluateCell({}, '=T("hello")')).toBe('hello')
    expect(evaluateCell({}, '=T(42)')).toBe('')
  })
  it('SUBSTITUTE replaces all occurrences', () => {
    expect(evaluateCell({}, '=SUBSTITUTE("a-b-c", "-", "/")')).toBe('a/b/c')
  })
  it('SUBSTITUTE with occurrence_num replaces only Nth match', () => {
    expect(evaluateCell({}, '=SUBSTITUTE("a-b-c-d", "-", "/", 2)')).toBe('a-b/c-d')
    expect(evaluateCell({}, '=SUBSTITUTE("a-b-c", "-", "/", 5)')).toBe('a-b-c')
  })
  it('LINECOUNT / CHARCOUNT', () => {
    expect(evaluateCell({}, '=LINECOUNT("a\nb\nc")')).toBe('3')
    expect(evaluateCell({}, '=LINECOUNT("")')).toBe('0')
    expect(evaluateCell({}, '=CHARCOUNT("hi😀")')).toBe('3')
  })
  it('WORDCOUNT', () => {
    expect(evaluateCell({}, '=WORDCOUNT("hello world")')).toBe('2')
    expect(evaluateCell({}, '=WORDCOUNT("  one  ")')).toBe('1')
    expect(evaluateCell({}, '=WORDCOUNT("")')).toBe('0')
  })
  it('LPAD / RPAD / REVERSE', () => {
    expect(evaluateCell({}, '=LPAD("42", 5, "0")')).toBe('00042')
    expect(evaluateCell({}, '=RPAD("hi", 5, ".")')).toBe('hi...')
    expect(evaluateCell({}, '=REVERSE("abcd")')).toBe('dcba')
  })
  it('STARTSWITH / ENDSWITH / CONTAINS', () => {
    expect(evaluateCell({}, '=STARTSWITH("hello", "he")')).toBe('1')
    expect(evaluateCell({}, '=ENDSWITH("hello", "lo")')).toBe('1')
    expect(evaluateCell({}, '=CONTAINS("hello", "ell")')).toBe('1')
    expect(evaluateCell({}, '=STARTSWITH("hello", "X")')).toBe('0')
  })
  it('SPLITN extracts Nth field', () => {
    expect(evaluateCell({}, '=SPLITN("a-b-c-d", "-", 3)')).toBe('c')
    expect(evaluateCell({}, '=SPLITN("a-b", "-", 5)')).toBe('#N/A')
  })

  it('SPLIT returns a row array', () => {
    expect(evaluateCell({}, '=SPLIT("a,b,c", ",")')).toBe('[["a","b","c"]]')
    expect(evaluateCell({}, '=SPLIT("a,,b", ",", 1, 0)')).toBe('[["a","","b"]]')
  })

  it('SPLIT can split by the full delimiter', () => {
    expect(evaluateCell({}, '=SPLIT("a<>b<>c", "<>", 0)')).toBe('[["a","b","c"]]')
    expect(evaluateCell({}, '=SPLIT("a<>b.c", "<>.", 1)')).toBe('[["a","b","c"]]')
  })

  it('SPLIT treats split-by-each delimiters as literal characters', () => {
    expect(evaluateCell({}, '=SPLIT("a-b/c.d", "-/.", 1)')).toBe('[["a","b","c","d"]]')
  })

  it('SPLIT rejects oversized generated arrays', () => {
    const text = ','.repeat(5_000)
    expect(evaluateCell({}, `=SPLIT("${text}", ",", 1, 0)`)).toBe('#VALUE!')
  })

  it('TEXTSPLIT returns a 2D array', () => {
    expect(evaluateCell({}, '=TEXTSPLIT("a,b;c,d", ",", ";")')).toBe('[["a","b"],["c","d"]]')
    expect(evaluateCell({}, '=TEXTSPLIT("a,b;c", ",", ";", 0, 0, "-")')).toBe('[["a","b"],["c","-"]]')
  })

  it('TEXTSPLIT can ignore empty cells', () => {
    expect(evaluateCell({}, '=TEXTSPLIT("a,,b", ",",, 1)')).toBe('[["a","b"]]')
  })
  it('TEXTBEFORE / TEXTAFTER split by delimiter', () => {
    expect(evaluateCell({}, '=TEXTBEFORE("hello@example.com","@")')).toBe('hello')
    expect(evaluateCell({}, '=TEXTAFTER("hello@example.com","@")')).toBe('example.com')
    expect(evaluateCell({}, '=TEXTBEFORE("nodelim","@")')).toBe('nodelim')
    expect(evaluateCell({}, '=TEXTAFTER("nodelim","@")')).toBe('')
  })
  it('TEXTBEFORE / TEXTAFTER support instance and fallback options', () => {
    expect(evaluateCell({}, '=TEXTBEFORE("a-b-c-d","-", 3)')).toBe('a-b-c')
    expect(evaluateCell({}, '=TEXTAFTER("a-b-c-d","-", 3)')).toBe('d')
    expect(evaluateCell({}, '=TEXTBEFORE("a-b-c-d","-", -2)')).toBe('a-b')
    expect(evaluateCell({}, '=TEXTAFTER("a-b-c-d","-", -2)')).toBe('c-d')
    expect(evaluateCell({}, '=TEXTBEFORE("abc","-", 1, 0, 0, "missing")')).toBe('missing')
    expect(evaluateCell({}, '=TEXTAFTER("abc","-", 1, 0, 0, "missing")')).toBe('missing')
  })
  it('TEXTBEFORE / TEXTAFTER support case-insensitive matching', () => {
    expect(evaluateCell({}, '=TEXTBEFORE("AlphaXBeta","x", 1, 1)')).toBe('Alpha')
    expect(evaluateCell({}, '=TEXTAFTER("AlphaXBeta","x", 1, 1)')).toBe('Beta')
  })
  it('FIND returns 1-based position (case-sensitive)', () => {
    expect(evaluateCell({}, '=FIND("b", "abc")')).toBe('2')
    expect(evaluateCell({}, '=FIND("X", "abc")')).toBe('#VALUE!')
  })
  it('SEARCH is case-insensitive', () => {
    expect(evaluateCell({}, '=SEARCH("B", "abc")')).toBe('2')
  })
  it('REPT repeats text', () => {
    expect(evaluateCell({}, '=REPT("ab", 3)')).toBe('ababab')
  })
  it('caps generated text length', () => {
    expect(evaluateCell({}, '=REPT("x", 1000000000)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=LPAD("x", 1000000000, "0")')).toBe('#VALUE!')
    expect(evaluateCell({}, '=RPAD("x", 1000000000, "0")')).toBe('#VALUE!')
    expect(evaluateCell({}, '=RANDSTRING(1000000000)')).toBe('#VALUE!')
  })
  it('caps generated text from string assembly functions', () => {
    const cells = {
      A1: 'x'.repeat(6_000),
      A2: 'y'.repeat(5_000),
      A3: 'a'.repeat(6_000),
    }

    expect(evaluateCell(cells, '=CONCAT(A1, A2)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=JOIN("", A1, A2)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=TEXTJOIN("", 0, A1, A2)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=SUBSTITUTE(A3, "a", "bb")')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=REPLACE(A1, 1, 0, A2)')).toBe('#VALUE!')
  })
  it('handles out-of-range empty SUBSTITUTE occurrence without looping', () => {
    expect(evaluateCell({}, '=SUBSTITUTE("abc", "", "x", 99)')).toBe('abc')
    expect(evaluateCell({}, '=SUBSTITUTE("abc", "", "x", 2)')).toBe('axbc')
  })
  it('SLUG / CAMELCASE / SNAKECASE', () => {
    expect(evaluateCell({}, '=SLUG("Hello World!")')).toBe('hello-world')
    expect(evaluateCell({}, '=CAMELCASE("hello world")')).toBe('helloWorld')
    expect(evaluateCell({}, '=SNAKECASE("helloWorld")')).toBe('hello_world')
    expect(evaluateCell({}, '=KEBABCASE("helloWorld")')).toBe('hello-world')
  })
  it('PROPER capitalises each word', () => {
    expect(evaluateCell({}, '=PROPER("hello world")')).toBe('Hello World')
  })
  it('nested CONCAT + UPPER', () => {
    expect(evaluateCell({ A1: 'foo' }, '=CONCAT(UPPER(A1), "!")')).toBe('FOO!')
  })
  it('JOIN concatenates with separator (no empty filter)', () => {
    expect(evaluateCell({}, '=JOIN("-","a","","b")')).toBe('a--b')
  })
  it('TEXTJOIN ignores empty by default', () => {
    expect(evaluateCell({}, '=TEXTJOIN("-",1,"a","","b","c")')).toBe('a-b-c')
    expect(evaluateCell({}, '=TEXTJOIN("-",0,"a","","b")')).toBe('a--b')
    expect(evaluateCell({}, '=TEXTJOIN(",",1,"a""b,c","d")')).toBe('a"b,c,d')
    expect(evaluateCell({}, '=TEXTJOIN("-",0,"a",)')).toBe('a-')
  })
  it('LIKE wildcard match', () => {
    expect(evaluateCell({}, '=LIKE("apple", "ap*")')).toBe('1')
    expect(evaluateCell({}, '=LIKE("apple", "a?ple")')).toBe('1')
    expect(evaluateCell({}, '=LIKE("apple", "ax*")')).toBe('0')
    expect(evaluateCell({}, '=LIKE("a.b", "a.b")')).toBe('1')
    expect(evaluateCell({}, '=LIKE("acb", "a.b")')).toBe('0')
  })
  it('SOUNDEX phonetic code', () => {
    expect(evaluateCell({}, '=SOUNDEX("Robert")')).toBe('R163')
    expect(evaluateCell({}, '=SOUNDEX("Rupert")')).toBe('R163')
  })
  it('LCS longest common subsequence length', () => {
    expect(evaluateCell({}, '=LCS("abcde", "ace")')).toBe('3')
    expect(evaluateCell({}, '=LCS("abc", "xyz")')).toBe('0')
  })
  it('rejects oversized text algorithm work', () => {
    const a = 'a'.repeat(501)
    const b = 'b'.repeat(501)

    expect(evaluateCell({}, `=LCS("${a}", "${b}")`)).toBe('#VALUE!')
    expect(evaluateCell({}, `=LEVENSHTEIN("${a}", "${b}")`)).toBe('#VALUE!')
  })
  it('LEVENSHTEIN edit distance', () => {
    expect(evaluateCell({}, '=LEVENSHTEIN("kitten", "sitting")')).toBe('3')
    expect(evaluateCell({}, '=LEVENSHTEIN("abc", "abc")')).toBe('0')
    expect(evaluateCell({}, '=LEVENSHTEIN("", "abc")')).toBe('3')
  })
  it('HAMMING distance counts position mismatches', () => {
    expect(evaluateCell({}, '=HAMMING("karolin", "kathrin")')).toBe('3')
    expect(evaluateCell({}, '=HAMMING("abc", "abcd")')).toBe('#N/A')
  })
  it('COMMONPREFIX/COMMONSUFFIX find shared edges', () => {
    expect(evaluateCell({}, '=COMMONPREFIX("flower", "flow")')).toBe('flow')
    expect(evaluateCell({}, '=COMMONPREFIX("dog", "cat")')).toBe('')
    expect(evaluateCell({}, '=COMMONSUFFIX("walking", "running")')).toBe('ing')
  })
  it('MASK redacts all but last N chars', () => {
    expect(evaluateCell({}, '=MASK("4111222233334444")')).toBe('************4444')
    expect(evaluateCell({}, '=MASK("1234", 2, "x")')).toBe('xx34')
  })
  it('ROT13 transforms ASCII letters', () => {
    expect(evaluateCell({}, '=ROT13("Hello")')).toBe('Uryyb')
    expect(evaluateCell({}, '=ROT13(ROT13("test"))')).toBe('test')
  })
  it('RANDSTRING produces requested length', () => {
    expect(evaluateCell({}, '=LEN(RANDSTRING(12))')).toBe('12')
    expect(/^[ab]+$/.test(evaluateCell({}, '=RANDSTRING(20, "ab")'))).toBe(true)
  })
  it('SQUEEZE collapses runs of whitespace and trims', () => {
    expect(evaluateCell({}, '=SQUEEZE("  hello   world  ")')).toBe('hello world')
    expect(evaluateCell({}, '=SQUEEZE("foo  bar    baz")')).toBe('foo bar baz')
  })
  it('TRUNCATE shortens with ellipsis tail', () => {
    expect(evaluateCell({}, '=TRUNCATE("hello world", 8)')).toBe('hello w…')
    expect(evaluateCell({}, '=TRUNCATE("hi", 8)')).toBe('hi')
    expect(evaluateCell({}, '=TRUNCATE("hello world", 7, "...")')).toBe('hell...')
  })
  it('DEACCENT strips combining marks', () => {
    expect(evaluateCell({}, '=DEACCENT("café résumé naïve")')).toBe('cafe resume naive')
    expect(evaluateCell({}, '=DEACCENT("Crème brûlée")')).toBe('Creme brulee')
  })
  it('INITIALS extracts uppercase initial of each word', () => {
    expect(evaluateCell({}, '=INITIALS("john ronald reuel tolkien")')).toBe('JRRT')
    expect(evaluateCell({}, '=INITIALS("")')).toBe('')
  })
  it('OCCURS counts non-overlapping occurrences', () => {
    expect(evaluateCell({}, '=OCCURS("banana", "an")')).toBe('2')
    expect(evaluateCell({}, '=OCCURS("aaaa", "aa")')).toBe('2')
    expect(evaluateCell({}, '=OCCURS("hi", "")')).toBe('0')
  })
  it('DICE bigram similarity', () => {
    expect(evaluateCell({}, '=DICE("night", "nacht")')).toBe('0.25')
    expect(Number(evaluateCell({}, '=DICE("hello", "hello")'))).toBeCloseTo(1)
  })
  it('rejects oversized linear text algorithm input', () => {
    const text = 'a'.repeat(10001)

    expect(evaluateCell({}, `=LIKE("${text}", "*")`)).toBe('#VALUE!')
    expect(evaluateCell({}, `=HAMMING("${text}", "${text}")`)).toBe('#VALUE!')
    expect(evaluateCell({}, `=DICE("${text}", "aa")`)).toBe('#VALUE!')
    expect(evaluateCell({}, `=SOUNDEX("${text}")`)).toBe('#VALUE!')
  })
  it('EQUALCI case-insensitive equality', () => {
    expect(evaluateCell({}, '=EQUALCI("Hello", "hello")')).toBe('1')
    expect(evaluateCell({}, '=EQUALCI("a", "b")')).toBe('0')
  })
  it('EXACT case-sensitive', () => {
    expect(evaluateCell({}, '=EXACT("ab","AB")')).toBe('0')
    expect(evaluateCell({}, '=EXACT("ab","ab")')).toBe('1')
  })
  it('REPLACE by position', () => {
    expect(evaluateCell({}, '=REPLACE("abcdef",2,3,"XY")')).toBe('aXYef')
  })
  it('ISURL / ISEMAIL', () => {
    expect(evaluateCell({}, '=ISURL("https://example.com")')).toBe('1')
    expect(evaluateCell({}, '=ISURL("nope")')).toBe('0')
    expect(evaluateCell({}, '=ISEMAIL("a@b.co")')).toBe('1')
    expect(evaluateCell({}, '=ISEMAIL("nope")')).toBe('0')
  })
  it('TEXT formats with thousands separators / decimals / percent', () => {
    expect(evaluateCell({}, '=TEXT(1234.5, "0,000.00")')).toBe('1,234.50')
    expect(evaluateCell({}, '=TEXT(0.25, "0%")')).toBe('25%')
    expect(evaluateCell({}, '=TEXT(7, "0.000")')).toBe('7.000')
  })
  it('DOLLAR formats with thousands and decimals', () => {
    expect(evaluateCell({}, '=DOLLAR(1234.5)')).toBe('$1,234.50')
    expect(evaluateCell({}, '=DOLLAR(1234.5, 0)')).toBe('$1,235')
  })
  it('UNICHAR / UNICODE handle codepoints', () => {
    expect(evaluateCell({}, '=UNICHAR(128512)')).toBe('😀')
    expect(evaluateCell({}, '=UNICODE("😀")')).toBe('128512')
  })
  it('CHAR / CODE round-trip', () => {
    expect(evaluateCell({}, '=CHAR(65)')).toBe('A')
    expect(evaluateCell({}, '=CODE("A")')).toBe('65')
  })
})
