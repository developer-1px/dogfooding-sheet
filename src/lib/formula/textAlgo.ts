export function dispatchTextAlgo(F: string, argsT: string[]): string | null {
  if (F === 'LEVENSHTEIN') {
    const a = argsT[0] ?? '', b = argsT[1] ?? ''
    const dp = Array.from({ length: a.length + 1 }, (_, i) => i)
    for (let j = 1; j <= b.length; j++) {
      let prev = dp[0]; dp[0] = j
      for (let i = 1; i <= a.length; i++) {
        const tmp = dp[i]
        dp[i] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[i - 1], dp[i]) + 1
        prev = tmp
      }
    }
    return String(dp[a.length])
  }
  if (F === 'LCS') {
    const a = argsT[0] ?? '', b = argsT[1] ?? ''
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    return String(dp[a.length][b.length])
  }
  return null
}
