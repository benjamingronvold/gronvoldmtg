import { useScryfall } from '../../hooks/useScryfall.js'

export default function CardImage({ cardName, count = 1, tapped = false, size = 'normal' }) {
  const { imageUrl, loading, error } = useScryfall(cardName)

  const width = size === 'small' ? 'w-16' : 'w-28'
  const height = size === 'small' ? 'h-22' : 'h-40'

  return (
    <div className={`relative ${width} flex-shrink-0`} title={cardName}>
      <div className={`${tapped ? 'rotate-90' : ''} transition-transform duration-200`}>
        {loading && (
          <div className={`${width} ${height} bg-gray-700 rounded-lg animate-pulse flex items-center justify-center`}>
            <span className="text-gray-500 text-xs">...</span>
          </div>
        )}
        {error && (
          <div className={`${width} ${height} bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center p-1`}>
            <span className="text-gray-400 text-xs text-center leading-tight">{cardName}</span>
          </div>
        )}
        {imageUrl && !loading && (
          <img
            src={imageUrl}
            alt={cardName}
            className={`${width} ${height} rounded-lg object-cover ${tapped ? 'opacity-75' : ''} hover:z-10 hover:scale-110 transition-transform`}
          />
        )}
      </div>
      {count > 1 && (
        <span className="absolute -top-1 -right-1 bg-yellow-500 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  )
}
