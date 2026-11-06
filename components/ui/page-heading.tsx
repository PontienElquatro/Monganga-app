export function PageHeading({ space, title, description, actions }: {
  space?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">MONGANGA{space ? ` · ${space}` : ''}</p>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </header>
  )
}
