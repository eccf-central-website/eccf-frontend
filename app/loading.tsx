import LoadingState from '@/components/common/LoadingState'

export default function RootLoading() {
  return (
    <LoadingState
      fullscreen
      size="md"
      message="Welcome to ECCF Family"
      subtext="Preparing fellowship space..."
    />
  )
}
