import { useState } from 'react'

export function InteractivePoll() {
  const [votes, setVotes] = useState({
    option1: 5,
    option2: 3,
    option3: 7,
    option4: 2,
  })
  const [userVote, setUserVote] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0)

  const options = [
    { id: 'option1', label: '🏖️ Beach retreat', color: 'bg-blue-500' },
    { id: 'option2', label: '🏔️ Mountain cabin', color: 'bg-green-500' },
    { id: 'option3', label: '🏙️ City tour', color: 'bg-purple-500' },
    { id: 'option4', label: '🏕️ Camping trip', color: 'bg-orange-500' },
  ]

  const handleVote = (optionId: string) => {
    if (userVote) {
      // Change vote
      setVotes((prev) => ({
        ...prev,
        [userVote]: prev[userVote as keyof typeof prev] - 1,
        [optionId]: prev[optionId as keyof typeof prev] + 1,
      }))
    } else {
      // New vote
      setVotes((prev) => ({
        ...prev,
        [optionId]: prev[optionId as keyof typeof prev] + 1,
      }))
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }
    setUserVote(optionId)
  }

  return (
    <div className="relative">
      {/* Success notification */}
      {showSuccess && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-top-2 fade-in z-10">
          ✓ Vote recorded!
        </div>
      )}

      {/* Poll Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 w-[380px] h-[600px] flex flex-col mx-auto">
        {/* Poll Header */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <img
              src="/logo.jpeg"
              alt="Askify"
              className="w-8 h-8 rounded object-cover"
            />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Askify
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              just now
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Where should we have the team offsite?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Single choice • {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </p>
        </div>

        {/* Poll Options */}
        <div className="space-y-3 flex-1 overflow-y-auto">
          {options.map((option) => {
            const voteCount = votes[option.id as keyof typeof votes]
            const percentage =
              totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
            const isSelected = userVote === option.id

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                className="w-full text-left group relative"
              >
                {/* Progress bar background */}
                <div
                  className={`absolute inset-0 rounded-lg transition-all duration-500 ${option.color} opacity-10`}
                  style={{ width: `${percentage}%` }}
                />

                {/* Option content */}
                <div
                  className={`relative flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[var(--brand)] bg-[var(--brand)]'
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {option.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {voteCount}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[3ch] text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Poll Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          <span>👤 Anonymous voting • ♻️ Allow vote change</span>
        </div>

        {/* Try it hint */}
        <div className="mt-3 text-center flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            👆 Click any option to vote
          </p>
        </div>
      </div>
    </div>
  )
}
