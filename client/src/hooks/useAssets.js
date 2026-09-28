import { useEffect, useRef, useState } from 'react'
import { assetApi } from '../services/api'

function unwrapAssets(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.assets)) return response.assets
  return []
}

function unwrapPage(response) {
  if (response && typeof response === 'object' && Array.isArray(response.assets)) {
    return {
      assets: response.assets,
      page: response.page ?? 1,
      limit: response.limit ?? response.assets.length,
      total: response.total ?? response.assets.length,
      totalPages: response.totalPages ?? 1,
    }
  }

  return {
    assets: unwrapAssets(response),
    page: 1,
    limit: unwrapAssets(response).length,
    total: unwrapAssets(response).length,
    totalPages: 1,
  }
}

export function useAssets() {
  const [assets, setAssets] = useState([])
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [logs, setLogs] = useState([])
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const selectedAssetIdRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [error, setError] = useState(null)
  const [timelineError, setTimelineError] = useState(null)
  const [busyAssetId, setBusyAssetId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    assetApi.getAssets({ page, limit })
      .then((response) => {
        if (!active) return
        const nextPage = unwrapPage(response)
        const nextAssets = nextPage.assets
        setAssets(nextAssets)
        setPage(nextPage.page)
        setTotal(nextPage.total)
        setTotalPages(nextPage.totalPages)
        const currentId = selectedAssetIdRef.current
        const nextSelectedAssetId = nextAssets.some((asset) => asset._id === currentId)
          ? currentId
          : nextAssets[0]?._id || null
        if (nextSelectedAssetId !== currentId) {
          selectedAssetIdRef.current = nextSelectedAssetId
          setSelectedAssetId(nextSelectedAssetId)
          setTimelineLoading(Boolean(nextSelectedAssetId))
          if (!nextSelectedAssetId) {
            setLogs([])
            setTimelineError(null)
          }
        }
        setError(null)
      })
      .catch((requestError) => {
        if (active) setError(requestError)
      })
      .finally(() => {
        if (active) {
          setLoading(false)
          setRefreshing(false)
        }
      })

    return () => { active = false }
  }, [reloadKey, page, limit])

  useEffect(() => {
    if (!selectedAssetId) return undefined

    let active = true
    assetApi.getAssetTimeline(selectedAssetId)
      .then((response) => {
        if (!active) return
        setLogs(Array.isArray(response?.logs) ? response.logs : [])
        setTimelineError(null)
      })
      .catch((requestError) => {
        if (active) setTimelineError(requestError)
      })
      .finally(() => {
        if (active) setTimelineLoading(false)
      })

    return () => { active = false }
  }, [selectedAssetId, reloadKey])

  const refresh = () => {
    setRefreshing(true)
    setTimelineLoading(Boolean(selectedAssetId))
    setReloadKey((key) => key + 1)
  }

  const changePage = (nextPage) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages || 1))
    setLoading(true)
  }

  const selectAsset = (assetId) => {
    selectedAssetIdRef.current = assetId
    setTimelineLoading(Boolean(assetId))
    setTimelineError(null)
    setSelectedAssetId(assetId)
  }

  const transitionAsset = async (action, assetId, notes) => {
    setBusyAssetId(assetId)
    try {
      const result = action === 'report'
        ? await assetApi.reportAsset(assetId, notes)
        : await assetApi.fixAsset(assetId, notes)

      setAssets((currentAssets) => currentAssets.map((asset) => (
        asset._id === result.asset._id ? result.asset : asset
      )))
      setLogs((currentLogs) => [...currentLogs, result.log].sort(
        (left, right) => new Date(left.timestamp) - new Date(right.timestamp),
      ))
      setError(null)
      return result
    } finally {
      setBusyAssetId(null)
    }
  }

  const selectedAsset = assets.find((asset) => asset._id === selectedAssetId) || null

  return {
    assets,
    logs,
    selectedAsset,
    selectedAssetId,
    setSelectedAssetId: selectAsset,
    loading,
    refreshing,
    timelineLoading,
    error,
    timelineError,
    busyAssetId,
    refresh,
    transitionAsset,
    page,
    total,
    totalPages,
    setPage: changePage,
  }
}