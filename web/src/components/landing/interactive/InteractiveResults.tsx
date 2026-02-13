import { Share2 } from 'lucide-react'
import { useState } from 'react'

export function InteractiveResults() {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)

  const results = [
    { id: '1', label: '🏖️ Beach retreat', votes: 12, color: 'bg-blue-500' },
    { id: '2', label: '🏙️ City tour', votes: 8, color: 'bg-purple-500' },
    { id: '3', label: '🏔️ Mountain cabin', votes: 5, color: 'bg-green-500' },
    { id: '4', label: '🏕️ Camping trip', votes: 3, color: 'bg-orange-500' },
  ]

  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0)
  const maxVotes = Math.max(...results.map((r) => r.votes))

  const channels = [
    '#general',
    '#team-announcements',
    '#random',
    '#watercooler',
  ]

  const handleShare = (channel: string) => {
    setSelectedChannel(channel)
    setTimeout(() => {
      setShowShareMenu(false)
      setTimeout(() => setSelectedChannel(null), 2000)
    }, 500)
  }

  return (
    <div className="relative">
      {/* Share success notification */}
      {selectedChannel && !showShareMenu && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-top-2 fade-in z-10 whitespace-nowrap">
          ✓ Results shared to {selectedChannel}
        </div>
      )}

      {/* Results Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 w-[380px] h-[600px] flex flex-col mx-auto">
        {/* Header */}
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <img
              src="/logo.jpeg"
              alt="Askify"
              className="w-8 h-8 rounded object-cover"
            />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Askify
            </span>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 rounded">
              Closed
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            📊 Poll Results
          </h3>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Where should we have the team offsite?
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} • Closed 5
            minutes ago
          </p>
        </div>

        {/* Results Bars */}
        <div className="space-y-3 mb-6 flex-1 overflow-y-auto">
          {results.map((result, index) => {
            const percentage = (result.votes / totalVotes) * 100
            const isWinner = result.votes === maxVotes

            return (
              <div key={result.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {isWinner && (
                      <span
                        className="text-yellow-500 text-sm"
                        title="Most votes"
                      >
                        👑
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {result.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {result.votes}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[3ch] text-right font-medium">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${result.color} transition-all duration-1000 ease-out flex items-center px-3`}
                    style={{
                      width: `${percentage}%`,
                      animationDelay: `${index * 100}ms`,
                    }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Share Results Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex-shrink-0">
          {!showShareMenu ? (
            <button
              onClick={() => setShowShareMenu(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] text-white rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Share2 className="w-4 h-4" />
              Share Results
            </button>
          ) : (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Share to channel:
              </p>
              {channels.map((channel) => (
                <button
                  key={channel}
                  onClick={() => handleShare(channel)}
                  className="w-full text-left px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 group-hover:text-[var(--brand)] transition-colors">
                      #
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {channel.slice(1)}
                    </span>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowShareMenu(false)}
                className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Try it hint */}
        {!showShareMenu && (
          <div className="mt-3 text-center flex-shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              👆 Try sharing the results
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
