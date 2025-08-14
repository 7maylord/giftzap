'use client'

import { useGetCharities } from '@/hooks/useGiftManager'

export default function CharityList() {
  const { data, isLoading, error } = useGetCharities()

  const charities = data && Array.isArray(data) ? {
    ids: data[0] as bigint[],
    addresses: data[1] as string[],
    names: data[2] as string[],
    descriptions: data[3] as string[]
  } : null

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-600">Loading charities...</p>
      </div>
    )
  }

  if (error || !charities) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load charities</p>
      </div>
    )
  }

  if (charities.addresses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No charities registered yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Registered Charities 💝</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {charities.addresses.map((address, index) => {
          const nameBytes = charities.names[index]
          const descBytes = charities.descriptions[index]
          
          let name = 'Unknown Charity'
          let description = 'No description available'
          
          try {
            // Parse name - handle both string and hex formats
            if (typeof nameBytes === 'string' && nameBytes.startsWith('0x')) {
              const nameHex = nameBytes.slice(2)
              if (nameHex) {
                name = Buffer.from(nameHex, 'hex').toString('utf8').replace(/\0/g, '').trim()
              }
            } else if (typeof nameBytes === 'string') {
              name = nameBytes.trim()
            }
            
            // Parse description - handle both JSON string and hex formats
            if (typeof descBytes === 'string' && descBytes.startsWith('0x')) {
              const descHex = descBytes.slice(2)
              if (descHex) {
                const descString = Buffer.from(descHex, 'hex').toString('utf8').replace(/\0/g, '').trim()
                try {
                  const descJson = JSON.parse(descString)
                  description = descJson.description || descString || 'No description available'
                } catch {
                  // If not JSON, use the string directly
                  description = descString || 'No description available'
                }
              }
            } else if (typeof descBytes === 'string') {
              description = descBytes.trim() || 'No description available'
            }
            
            // Fallback if name is empty
            if (!name || name === '') {
              name = `Charity #${Number(charities.ids[index])}`
            }
          } catch (error) {
            console.error('Error parsing charity data:', error, { nameBytes, descBytes })
            name = `Charity #${Number(charities.ids[index])}`
            description = 'Unable to load description'
          }
          
          return (
            <div key={index} className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {description}
                  </p>
                  
                  <p className="text-xs text-gray-500 font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>
                
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Charity ID: {Number(charities.ids[index])}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}