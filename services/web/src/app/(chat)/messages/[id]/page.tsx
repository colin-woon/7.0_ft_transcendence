interface MessagePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MessagePage({ params }: MessagePageProps) {
  const { id } = await params

  return (
    <div>
      <h1>Message {id}</h1>
      <p>Message detail page</p>
    </div>
  )
}