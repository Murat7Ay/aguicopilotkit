import { useEffect, useState } from 'react'

export type ToolCatalogEntry = {
  name: string
  description: string | null
}

type ToolsResponse = { tools: ToolCatalogEntry[] }

export function useToolCatalog(enabled: boolean) {
  const [tools, setTools] = useState<ToolCatalogEntry[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setTools(null)
      setLoadError(null)
      return
    }

    let cancelled = false
    setLoadError(null)

    fetch('/tools')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<ToolsResponse>
      })
      .then(data => {
        if (!cancelled) setTools(data.tools ?? [])
      })
      .catch(() => {
        if (!cancelled) {
          setTools(null)
          setLoadError('Araç listesi yüklenemedi')
        }
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return { tools, loadError }
}
