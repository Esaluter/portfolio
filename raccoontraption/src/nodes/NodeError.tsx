type NodeErrorProps = {
  message: string | null
  details: string | null
}

function NodeError({ message, details }: NodeErrorProps) {
  if (!message) {
    return null
  }

  return (
    <div
      title={details ?? undefined}
      style={{
        marginTop: '12px',
        color: '#fca5a5',
        maxWidth: '100%',
        overflowWrap: 'anywhere',
        fontSize: '13px',
        lineHeight: 1.35,
      }}
    >
      {message}
    </div>
  )
}

export default NodeError
