'use client'

interface KeywordResult {
  keyword: string
  found: boolean
}

interface KeywordCheckMetadata {
  positiveResults?: KeywordResult[]
  negativeResults?: KeywordResult[]
  missingPositive?: string[]
  foundNegative?: string[]
}

interface KeywordResultsDisplayProps {
  metadata: KeywordCheckMetadata | undefined
}

/**
 * Displays keyword check results on the monitor detail page.
 * Shows which positive keywords were found/missing and which negative keywords were found.
 */
export function KeywordResultsDisplay({ metadata }: KeywordResultsDisplayProps): React.ReactElement | null {
  if (!metadata) {
    return null
  }

  const { positiveResults, negativeResults } = metadata
  const hasPositive = Array.isArray(positiveResults) && positiveResults.length > 0
  const hasNegative = Array.isArray(negativeResults) && negativeResults.length > 0

  if (!hasPositive && !hasNegative) {
    return null
  }

  return (
    <div className="keyword-results-container">
      {hasPositive && (
        <div className="keyword-results-section">
          <span className="keyword-results-heading">Must exist on page</span>
          <div className="keyword-results-list">
            {positiveResults.map((result, index) => (
              <span
                key={`pos-${index}`}
                className={`keyword-result ${result.found ? 'keyword-result-pass' : 'keyword-result-fail'}`}
              >
                {result.found ? '\u2713' : '\u2717'} {result.keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasNegative && (
        <div className="keyword-results-section">
          <span className="keyword-results-heading">Must NOT appear on page</span>
          <div className="keyword-results-list">
            {negativeResults.map((result, index) => (
              <span
                key={`neg-${index}`}
                className={`keyword-result ${result.found ? 'keyword-result-fail' : 'keyword-result-pass'}`}
              >
                {result.found ? '\u2717' : '\u2713'} {result.keyword}
                {result.found ? ' (found!)' : ' (not found)'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
