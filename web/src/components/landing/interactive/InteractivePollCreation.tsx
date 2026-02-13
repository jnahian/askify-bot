import { useState } from 'react'

export function InteractivePollCreation() {
  const [question, setQuestion] = useState('What should we have for lunch?')
  const [pollType, setPollType] = useState<
    'single' | 'multi' | 'yesno' | 'rating'
  >('single')
  const [options, setOptions] = useState([
    '🍕 Pizza',
    '🍔 Burgers',
    '🥗 Salads',
  ])
  const [showSuccess, setShowSuccess] = useState(false)

  const pollTypes = [
    { id: 'single' as const, label: 'Single Choice', icon: '○' },
    { id: 'multi' as const, label: 'Multi-Select', icon: '☑' },
    { id: 'yesno' as const, label: 'Yes/No/Maybe', icon: '👍' },
    { id: 'rating' as const, label: 'Rating Scale', icon: '⭐' },
  ]

  const handleCreate = () => {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  return (
    <div className="relative">
      {/* Success notification */}
      {showSuccess && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-top-2 fade-in z-10">
          ✓ Poll created!
        </div>
      )}

      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg w-[380px] h-[600px] flex flex-col mx-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <img
              src="/logo.jpeg"
              alt="Askify"
              className="w-8 h-8 rounded object-cover"
            />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Create a Poll
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Question Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Poll Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-all"
              placeholder="What would you like to ask?"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Tip: Use emoji codes like :fire: :rocket: :tada:
            </p>
          </div>

          {/* Poll Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Poll Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {pollTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPollType(type.id)}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    pollType === type.id
                      ? 'border-[var(--brand)] bg-blue-50 dark:bg-blue-950/20 text-[var(--brand)]'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options (only for single/multi) */}
          {(pollType === 'single' || pollType === 'multi') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[index] = e.target.value
                        setOptions(newOptions)
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent text-sm"
                      placeholder={`Option ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() =>
                          setOptions(options.filter((_, i) => i !== index))
                        }
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                          <path
                            fillRule="evenodd"
                            d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 10 && (
                  <button
                    onClick={() => setOptions([...options, ''])}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Settings
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'anonymous',
                  label: 'Anonymous Voting',
                  desc: 'Hide voter identities',
                },
                {
                  id: 'change',
                  label: 'Allow Vote Change',
                  desc: 'Voters can update their vote',
                },
                {
                  id: 'live',
                  label: 'Show Live Results',
                  desc: 'Real-time result visibility',
                },
              ].map((setting) => (
                <label
                  key={setting.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    defaultChecked={setting.id !== 'anonymous'}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[var(--brand)] focus:ring-[var(--brand)]"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {setting.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {setting.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
          >
            Create Poll
          </button>
        </div>

        {/* Try it hint */}
        <div className="px-6 pb-4 text-center flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            👆 Try editing the question or options
          </p>
        </div>
      </div>
    </div>
  )
}
