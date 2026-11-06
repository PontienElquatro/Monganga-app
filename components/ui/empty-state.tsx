import { Icon, type IconName } from './icon'

export function EmptyState({ icon = 'inbox', title, text, action }: { icon?: IconName; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <Icon name={icon} />
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
      {action}
    </div>
  )
}
